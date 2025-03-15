const adoptionFormRepo = require('../repositories/adoptonForm.repo')
const catchAsync = require('../utils/catchAsync')
const { CREATED, OK } = require('../configs/response.config')
const { ADOPTION_FORM_MESSAGE } = require('../constants/messages')
const AdoptionForm = require('../models/adoptionForm.model')
const User = require('../models/user.model')
const AdoptionPost = require('../models/adoptionPost.model')
const { ADOPTION_POST_STATUS } = require('../constants/enums')
const PeriodicCheck = require('../models/periodicCheck.model')
const cloudinaryService = require('../utils/cloudinary')
const Pet = require('../models/pet.model')

class AdoptionFormController {
  createAdoptionForm = catchAsync(async (req, res) => {
    const { adoptionPost, pet, user, adopter, message } = req.body

    // Optional: Verify that the user exists and is valid
    const adopterUser = await User.findById(user)
    if (!adopterUser) {
      return res.status(400).json({ message: 'Invalid user ID' })
    }
    const currentAdoptPost = await AdoptionPost.findById(adoptionPost)
    if (!currentAdoptPost) {
      return res.status(400).json({ message: 'Invalid adoption post ID' })
    }

    const adoptionForm = new AdoptionForm({
      adoptionPost,
      pet,
      user,
      adopter,
      message
    })

    const savedForm = await adoptionForm.save()
    currentAdoptPost.adopt_status = ADOPTION_POST_STATUS.PENDING
    return CREATED(res, ADOPTION_FORM_MESSAGE.CREATED_SUCCESS, savedForm)
  })

  // Get all adoption forms
  async getAll(req, res) {
    try {
      const { sortBy, limit, page, q, status, ...filters } = req.query

      const options = {
        sortBy: sortBy || 'createdAt',
        limit: limit ? parseInt(limit) : 5,
        page: page ? parseInt(page) : 1,
        allowSearchFields: ['message'],
        q: q ?? ''
      }

      if (status) {
        filters.status = status
      }

      // Get paginated results without populate first
      const adoptionForms = await adoptionFormRepo.getAll(filters, options)

      // Then populate all required fields
      const populatedResults = await Promise.all(
        adoptionForms.results.map(async (form) => {
          const populatedForm = await AdoptionForm.findById(form._id)
            .populate('adoptionPost')
            .populate('pet')
            .populate('user')
            .populate({
              path: 'periodicChecks',
              populate: {
                path: 'checkedBy',
                select: 'username email'
              }
            })
            .lean(); // Convert to plain JavaScript object

          // Validate and clean up populated data
          if (populatedForm) {
            // Handle periodicChecks
            populatedForm.periodicChecks = populatedForm.periodicChecks.map(check => ({
              ...check,
              checkedBy: check.checkedBy ? {
                _id: check.checkedBy._id,
                username: check.checkedBy.username || 'N/A',
                email: check.checkedBy.email || 'N/A'
              } : null,
              image_url: check.image_url || '',
              notes: check.notes || ''
            }));

            // Handle other populated fields
            populatedForm.adoptionPost = populatedForm.adoptionPost || null;
            populatedForm.pet = populatedForm.pet || null;
            populatedForm.user = populatedForm.user || null;
          }

          return populatedForm;
        })
      );

      // Filter out any null results
      const validResults = populatedResults.filter(result => result !== null);

      // Replace the results with populated data
      adoptionForms.results = validResults;

      return OK(res, ADOPTION_FORM_MESSAGE.FETCH_ALL_SUCCESS, adoptionForms)
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Internal server error while fetching adoption forms',
        error: error.message
      })
    }
  }

  async checkPeriodic(req, res) {
    try {
      const { adoptionFormId, checkDate, status, notes, checkedBy } = req.body
      
      
      let imageUrl = '';
      if (req.file) {
        try {
          imageUrl = await cloudinaryService.uploadImage(req.file.buffer);
        } catch (uploadError) {
          return res.status(400).json({
            success: false,
            message: 'Error uploading image'
          });
        }
      }

      const periodicCheck = new PeriodicCheck({
        adoptionFormId,
        checkDate,
        status,
        notes,
        checkedBy,
        image_url: imageUrl
      });


      const savedPeriodicCheck = await periodicCheck.save()
      if(savedPeriodicCheck) {
        const adoptionForm = await AdoptionForm.findById(adoptionFormId)
        
        // If this is the first check and form is approved, set next check date
        if (adoptionForm.periodicChecks.length === 0 && adoptionForm.status === 'Approved') {
          if (!adoptionForm.approved_date) {
            adoptionForm.approved_date = new Date()
          }
          // Set next check date to 1 month from now
          const nextCheckDate = new Date()
          nextCheckDate.setMonth(nextCheckDate.getMonth() + 1)
          adoptionForm.next_check_date = nextCheckDate
        } else if (adoptionForm.periodicChecks.length === 1) {
          // After first check is completed, set next check date for second check
          const nextCheckDate = new Date()
          nextCheckDate.setMonth(nextCheckDate.getMonth() + 1)
          adoptionForm.next_check_date = nextCheckDate
        } else if (adoptionForm.periodicChecks.length === 2) {
          // After second check is completed, set next check date for final check
          const nextCheckDate = new Date()
          nextCheckDate.setMonth(nextCheckDate.getMonth() + 1)
          adoptionForm.next_check_date = nextCheckDate
        } else if (adoptionForm.periodicChecks.length === 3) {
          // After final check, clear next check date
          adoptionForm.next_check_date = null
        }

        adoptionForm.periodicChecks.push(savedPeriodicCheck._id)
        await adoptionForm.save()
      }

      // Populate the checkedBy field before sending response
      const populatedCheck = await PeriodicCheck.findById(savedPeriodicCheck._id)
        .populate('checkedBy', 'name email')
        .exec();

      return OK(res, ADOPTION_FORM_MESSAGE.ADD_PERIODIC_CHECK_SUCCESS, populatedCheck)
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Internal server error while processing periodic check'
      });
    }
  }

  updateAdoptionFormStatus = async (req, res) => {
    const { formId } = req.params;
    const { status } = req.body;

    if (!['Pending', 'Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value',
      });
    }

    const updatedForm = await AdoptionForm.findByIdAndUpdate(
      formId,
      { status },
      { new: true }
    ).populate('adopter pet adoptionPost user');

    if(updatedForm.status === 'Rejected') {
      await Pet.findByIdAndUpdate(updatedForm.pet, { $set: { isAdopted: false, isAddPost: false } })
    }
    if(updatedForm.status === 'Approved') {
      await Pet.findByIdAndUpdate(updatedForm.pet, { $set: { isAdopted: true } })
    }

    if (!updatedForm) {
      return res.status(404).json({
        success: false,
        message: 'Adoption form not found',
      });
    }
return OK(res, ADOPTION_FORM_MESSAGE.UPDATED_SUCCESS, updatedForm)
};
}

module.exports = new AdoptionFormController()
