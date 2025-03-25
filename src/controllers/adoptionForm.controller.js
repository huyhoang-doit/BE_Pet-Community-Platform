const adoptionFormRepo = require('../repositories/adoptonForm.repo')
const catchAsync = require('../utils/catchAsync')
const { CREATED, OK } = require('../configs/response.config')
const { ADOPTION_FORM_MESSAGE } = require('../constants/messages')
const AdoptionForm = require('../models/adoptionForm.model')
const User = require('../models/user.model')
const AdoptionPost = require('../models/adoptionPost.model')
const { ADOPTION_POST_STATUS, NOTIFICAITON_TYPE } = require('../constants/enums')
const PeriodicCheck = require('../models/periodicCheck.model')
const cloudinaryService = require('../utils/cloudinary')
const Pet = require('../models/pet.model')
const Notification = require('../models/notification.model')
const { getReceiverSocketId, io } = require('../socket/socket')

class AdoptionFormController {
  createAdoptionForm = catchAsync(async (req, res) => {
    const { adoptionPost, pet, sender, adopter, reason, expectedDate } = req.body

    // Optional: Verify that the user exists and is valid
    const adopterUser = await User.findById(sender)
    if (!adopterUser) {
      return res.status(400).json({ message: 'Invalid user ID' })
    }
    const currentPet = await Pet.findById(pet)
    if (!currentPet) {
      return res.status(400).json({ message: 'Invalid Pet ID' })
    }
    const currentAdoptPost = await AdoptionPost.findById(adoptionPost)
    if (!currentAdoptPost) {
      return res.status(400).json({ message: 'Invalid adoption post ID' })
    }

    const adoptionForm = new AdoptionForm({
      adoptionPost,
      pet,
      sender,
      adopter,
      reason,
      expected_date: expectedDate
    })

    const savedForm = await adoptionForm.save()
    currentPet.formRequests.push(savedForm._id)
    currentPet.adoptionRequests.push(adopterUser._id)
    await currentPet.save()
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
        allowSearchFields: ['reason'],
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
            .populate({
              path: 'pet',
              populate: {
                path: 'breed',
                select: 'name'
              }
            })
            .populate('sender')
            .populate({
              path: 'periodicChecks',
              populate: {
                path: 'checkedBy',
                select: 'username email'
              }
            })
            .lean()

          // Validate and clean up populated data
          if (populatedForm) {
            // Handle periodicChecks
            populatedForm.periodicChecks = populatedForm.periodicChecks.map((check) => ({
              ...check,
              checkedBy: check.checkedBy
                ? {
                    _id: check.checkedBy._id,
                    username: check.checkedBy.username || 'N/A',
                    email: check.checkedBy.email || 'N/A'
                  }
                : null,
              image_url: check.image_url || '',
              notes: check.notes || ''
            }))

            // Handle other populated fields
            populatedForm.adoptionPost = populatedForm.adoptionPost || null
            populatedForm.pet = populatedForm.pet || null
            populatedForm.sender = populatedForm.sender || null
          }

          return populatedForm
        })
      )

      // Filter out any null results
      const validResults = populatedResults.filter((result) => result !== null)

      // Replace the results with populated data
      adoptionForms.results = validResults

      return OK(res, ADOPTION_FORM_MESSAGE.FETCH_ALL_SUCCESS, adoptionForms)
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Internal server error while fetching adoption forms',
        error: error.message
      })
    }
  }

  async getFormBySenderId(req, res) {
    try {
      const senderId = req.params.id

      const { sortBy, limit, page, q, status, ...filters } = req.query

      const defaultFilters = { sender: senderId }

      const options = {
        sortBy: sortBy || 'createdAt',
        limit: limit ? parseInt(limit) : 5,
        page: page ? parseInt(page) : 1,
        allowSearchFields: ['reason', 'adopter.name', 'adopter.email'],
        q: q ?? ''
      }

      if (status) {
        filters.status = status
      }

      const finalFilter = { ...defaultFilters, ...filters }

      const adoptionForms = await AdoptionForm.paginate(finalFilter, options)

      const populatedResults = await Promise.all(
        adoptionForms.results.map(async (form) => {
          const populatedForm = await AdoptionForm.findById(form._id)
            .populate('adoptionPost')
            .populate({
              path: 'pet',
              populate: {
                path: 'breed',
                select: 'name'
              }
            })
            .populate('sender')
            .populate({
              path: 'periodicChecks',
              populate: {
                path: 'checkedBy',
                select: 'username email'
              }
            })
            .lean()

          if (populatedForm) {
            populatedForm.periodicChecks = populatedForm.periodicChecks.map((check) => ({
              _id: check._id,
              checkedBy: check.checkedBy
                ? {
                    _id: check.checkedBy._id,
                    username: check.checkedBy.username || 'N/A',
                    email: check.checkedBy.email || 'N/A'
                  }
                : null,
              image_url: check.image_url || '',
              notes: check.notes || ''
            }))

            populatedForm.adoptionPost = populatedForm.adoptionPost || null
            populatedForm.pet = populatedForm.pet || null
            populatedForm.sender = populatedForm.sender || null

            populatedForm.adopter = {
              name: populatedForm.adopter?.name || 'N/A',
              email: populatedForm.adopter?.email || 'N/A',
              phone: populatedForm.adopter?.phone || 'N/A',
              address: {
                province: populatedForm.adopter?.address?.province || 'N/A',
                district: populatedForm.adopter?.address?.district || 'N/A',
                ward: populatedForm.adopter?.address?.ward || 'N/A',
                detail: populatedForm.adopter?.address?.detail || 'N/A'
              }
            }
          }

          return populatedForm
        })
      )

      const validResults = populatedResults.filter((result) => result !== null)

      adoptionForms.results = validResults

      return OK(res, ADOPTION_FORM_MESSAGE.FETCH_FORM_BY_SENDER_ID, adoptionForms)
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

      let imageUrl = ''
      if (req.file) {
        try {
          imageUrl = await cloudinaryService.uploadImage(req.file.buffer)
        } catch (uploadError) {
          return res.status(400).json({
            success: false,
            message: 'Error uploading image'
          })
        }
      }

      const periodicCheck = new PeriodicCheck({
        adoptionFormId,
        checkDate,
        status,
        notes,
        checkedBy,
        image_url: imageUrl
      })

      const savedPeriodicCheck = await periodicCheck.save()
      if (savedPeriodicCheck) {
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
        .exec()

      return OK(res, ADOPTION_FORM_MESSAGE.ADD_PERIODIC_CHECK_SUCCESS, populatedCheck)
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Internal server error while processing periodic check'
      })
    }
  }

  async updateAdoptionFormStatus(req, res) {
    const { formId } = req.params
    const { status, note } = req.body

    if (!['Pending', 'Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      })
    }

    const updatedForm = await AdoptionForm.findByIdAndUpdate(
      formId,
      { status, response_note: note },
      { new: true }
    ).populate('adopter pet adoptionPost sender')

    if (!updatedForm) {
      return res.status(404).json({
        success: false,
        message: 'Adoption form not found'
      })
    }

    // Tạo thông báo cho sender dựa trên trạng thái mới
    let message
    switch (updatedForm.status) {
      case 'Approved':
        message = `Đơn nhận nuôi ${updatedForm.pet.name} của bạn đã được duyệt!`
        break
      case 'Rejected':
        message = `Đơn nhận nuôi ${updatedForm.pet.name} của bạn đã bị từ chối.`
        break
      case 'Pending':
        message = `Đơn nhận nuôi ${updatedForm.pet.name} của bạn đang được xem xét.`
        break
      default:
        message = `Trạng thái đơn nhận nuôi ${updatedForm.pet.name} đã được cập nhật.`
    }

    const notification = await Notification.create({
      type: NOTIFICAITON_TYPE.FORM_STATUS_UPDATE,
      sender: null,
      recipient: updatedForm.sender._id,
      post: updatedForm.adoptionPost._id || null,
      message,
      read: false
    })

    const userSocketId = getReceiverSocketId(updatedForm.sender._id.toString())
    if (userSocketId) {
      io.to(userSocketId).emit('notification', {
        ...notification.toObject(),
        sender: null
      })
    }

    // Xử lý khi status là "Approved"
    if (updatedForm.status === 'Approved') {
      await AdoptionForm.updateMany(
        {
          _id: { $ne: formId }, // Loại trừ form hiện tại
          pet: updatedForm.pet._id, // Tìm các form có cùng pet._id
          status: { $ne: 'Rejected' } // Chỉ cập nhật các form chưa bị Rejected
        },
        { $set: { status: 'Rejected', response_note: 'Đã có đăng ký được phê duyệt' } }
      )

      // 2. Cập nhật pet
      await Pet.findByIdAndUpdate(updatedForm.pet._id, {
        $set: { isAdopted: true }
      })

      // 3. Cập nhật adoptionPost thành "Pending"
      await AdoptionPost.findByIdAndUpdate(updatedForm.adoptionPost._id, {
        $set: { adopt_status: 'Pending' }
      })
    }

    if (updatedForm.status === 'Rejected') {
      await Pet.findByIdAndUpdate(updatedForm.pet._id, {
        $set: { isAdopted: false }
      })
    }

    return OK(res, ADOPTION_FORM_MESSAGE.UPDATED_SUCCESS, updatedForm)
  }

  async alertCheckForm(req, res) {
    const { formId } = req.params

    const form = await AdoptionForm.findById(formId).populate('sender pet')
    if (!form) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Adoption form not found'
      })
    }

    if (form.status !== 'Approved' || form.periodicChecks.length >= 3) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Form does not require a check alert'
      })
    }

    // Tạo thông báo
    const notification = await Notification.create({
      type: NOTIFICAITON_TYPE.CHECK_REQUEST,
      sender: req.id,
      recipient: form.sender._id,
      post: form.adoptionPost || null,
      message: `Đơn nhận nuôi ${form.pet.name} của bạn cần được kiểm tra định kỳ ngay!`,
      read: false
    })

    const userSocketId = getReceiverSocketId(form.sender._id.toString())
    if (userSocketId) {
      io.to(userSocketId).emit('notification', {
        ...notification.toObject(),
        sender: { _id: req.id, username: 'staff' }
      })
    }

    return OK(res, 'Check alert sent successfully', notification)
  }
}

module.exports = new AdoptionFormController()
