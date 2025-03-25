const Pet = require('../models/pet.model')
const mongoose = require('mongoose')
const ErrorWithStatus = require('../utils/errorWithStatus')
const { StatusCodes } = require('http-status-codes')
const cloudinaryService = require('../utils/cloudinary')
const { getReceiverSocketId, io } = require('../socket/socket')
const Notification = require('../models/notification.model')
const { NOTIFICAITON_TYPE } = require('../constants/enums')
const petRepo = require('../repositories/pet.repo')

class PetService {
  async createPet(petData, imagelUrl) {
    try {
      const newPet = await Pet.create({
        ...petData,
        image_url: imagelUrl,
        isApproved: true
      })
      return newPet
    } catch (error) {
      if (error.name === 'ValidationError') {
        throw new ErrorWithStatus({
          status: StatusCodes.BAD_REQUEST,
          message: 'Validation Error'
        })
      }
      throw new ErrorWithStatus({ status: StatusCodes.INTERNAL_SERVER_ERROR, message: 'Error adding pet' })
    }
  }

  async updatePet(petId, petData, imageUrl) {
    if (!petId) {
      throw new ErrorWithStatus({ status: StatusCodes.BAD_REQUEST, message: 'Pet ID is required for update' })
    }

    if (!mongoose.Types.ObjectId.isValid(petId)) {
      throw new ErrorWithStatus({ status: StatusCodes.BAD_REQUEST, message: 'Invalid Pet ID format' })
    }

    const existingPet = await Pet.findById(petId)
    if (!existingPet) {
      throw new ErrorWithStatus({ status: StatusCodes.NOT_FOUND, message: 'Pet not found' })
    }

    if (petData.status === 'add_image') {
      if (!imageUrl) {
        throw new ErrorWithStatus({ status: StatusCodes.BAD_REQUEST, message: 'No file uploaded' })
      }

      if (!Array.isArray(existingPet.image_url)) {
        existingPet.image_url = []
      }

      existingPet.image_url.push(...imageUrl)

      const updatedPet = await Pet.findByIdAndUpdate(
        petId,
        {
          ...petData,
          image_url: existingPet.image_url
        },
        { new: true }
      )
      return updatedPet
    }

    const updatedPet = await Pet.findByIdAndUpdate(
      petId,
      {
        ...petData,
        image_url: Array.isArray(imageUrl) && imageUrl.length > 0 ? imageUrl : existingPet.image_url
      },
      { new: true }
    )

    return updatedPet
  }

  async deletePet(petId) {
    try {
      if (!petId) {
        throw new ErrorWithStatus({ status: StatusCodes.BAD_REQUEST, message: 'Pet ID is required' })
      }

      const deletedPet = await Pet.findByIdAndDelete(petId)
      if (!deletedPet) {
        throw new ErrorWithStatus({ status: StatusCodes.NOT_FOUND, message: 'Pet not found' })
      }

      return deletedPet
    } catch (error) {
      if (error.name === 'CastError') {
        throw new ErrorWithStatus({ status: StatusCodes.BAD_REQUEST, message: 'Invalid Pet ID format' })
      }
      throw new ErrorWithStatus({ status: StatusCodes.INTERNAL_SERVER_ERROR, message: 'Error deleting pet' })
    }
  }

  async submitPet(userId, petData, imageUrl) {
    if (!imageUrl) {
      throw new ErrorWithStatus({ status: StatusCodes.BAD_REQUEST, message: 'No file uploaded' })
    }
    if (!userId) {
      throw new ErrorWithStatus({ status: StatusCodes.BAD_REQUEST, message: 'User ID is required' })
    }

    const newPet = await Pet.create({
      ...petData,
      submittedBy: userId,
      owner: userId,
      image_url: imageUrl,
      isApproved: false
    })

    return newPet
  }

  async getAllPetNotApproved() {
    const pets = await Pet.find({ isApproved: false }).populate(['submittedBy', 'breed'])
    return pets
  }
  async getAllPetApproved(query) {
    const { sortBy, limit, page, q, ...filters } = query

    const defaultFilters = { isApproved: true }

    const options = {
      sortBy: sortBy || 'createdAt',
      limit: limit ? parseInt(limit) : 5,
      page: page ? parseInt(page) : 1,
      allowSearchFields: ['name'],
      q: q ?? '',
      populate: 'owner,breed'
    }

    const finalFilter = { ...defaultFilters, ...filters }

    return await petRepo.getAll(finalFilter, options)
  }

  async approvePet(petId) {
    const pet = await Pet.findById(petId).populate('submittedBy')
    if (!pet) {
      throw new ErrorWithStatus({ status: StatusCodes.NOT_FOUND, message: 'Pet not found' })
    }

    if (pet.isApproved) {
      throw new ErrorWithStatus({ status: StatusCodes.BAD_REQUEST, message: 'Pet is already approved' })
    }

    pet.owner = null
    pet.isApproved = true
    await pet.save()

    const notification = await Notification.create({
      type: NOTIFICAITON_TYPE.APPROVE,
      sender: null,
      recipient: pet.submittedBy._id,
      post: null,
      message: `Yêu cầu gửi thú cưng của bạn đã được phê duyệt! Chúng tôi sẽ liên hệ bạn để tiếp nhận thú cưng thời gian sớm nhất`,
      read: false
    })

    const userSocketId = getReceiverSocketId(pet.submittedBy._id.toString())
    if (userSocketId) {
      io.to(userSocketId).emit('notification', {
        ...notification.toObject(),
        sender: null
      })
    }

    return pet
  }

  async requestAdoption(userId, petId) {
    if (!userId || !petId) {
      throw new ErrorWithStatus({ status: StatusCodes.BAD_REQUEST, message: 'User ID and Pet ID are required' })
    }

    const pet = await Pet.findById(petId)
    if (!pet) {
      throw new ErrorWithStatus({ status: StatusCodes.NOT_FOUND, message: 'Pet not found' })
    }
    if (!pet.isApproved) {
      throw new ErrorWithStatus({ status: StatusCodes.BAD_REQUEST, message: 'Pet is not available for adoption' })
    }
    if (pet.isAdopted) {
      throw new ErrorWithStatus({ status: StatusCodes.BAD_REQUEST, message: 'Pet has already been adopted' })
    }

    if (pet.adoptionRequests.includes(userId)) {
      throw new ErrorWithStatus({
        status: StatusCodes.BAD_REQUEST,
        message: 'You have already requested to adopt this pet'
      })
    }
    return pet
  }
  async getPetBySubmittedId(userId, query) {
    if (!userId) {
      throw new ErrorWithStatus({ status: StatusCodes.BAD_REQUEST, message: 'User ID are required' })
    }
    const { sortBy, limit, page, q, ...filters } = query

    const defaultFilters = { submittedBy: userId }

    const options = {
      sortBy: sortBy || 'createdAt',
      limit: limit ? parseInt(limit) : 5,
      page: page ? parseInt(page) : 1,
      allowSearchFields: ['name'],
      q: q ?? '',
      populate: 'breed,adoptionRequests,formRequests'
    }

    const finalFilter = { ...defaultFilters, ...filters }

    const pets = await Pet.paginate(finalFilter, options)

    return pets
  }

  async adoptPet(userId, petId) {
    const pet = await Pet.findById(petId)
    if (!pet) {
      throw new ErrorWithStatus({ status: StatusCodes.NOT_FOUND, message: 'Pet not found' })
    }

    if (!pet.isApproved) {
      throw new ErrorWithStatus({ status: StatusCodes.BAD_REQUEST, message: 'Pet is not available for adoption' })
    }
    if (pet.isAdopted) {
      throw new ErrorWithStatus({ status: StatusCodes.BAD_REQUEST, message: 'Pet has already been adopted' })
    }

    if (pet.owner) {
      throw new ErrorWithStatus({ status: StatusCodes.BAD_REQUEST, message: 'Pet has already been adopted' })
    }
    if (!pet.adoptionRequests.includes(userId)) {
      throw new ErrorWithStatus({
        status: StatusCodes.BAD_REQUEST,
        message: 'This user did not request to adopt this pet'
      })
    }
    pet.isAdopted = true
    pet.adoptionRequests = []
    pet.owner = userId
    await pet.save()

    return pet
  }
  async getPetById(petId) {
    const pet = await Pet.findById(petId)
    return pet
  }
}

module.exports = new PetService()
