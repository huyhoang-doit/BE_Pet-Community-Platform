const catchAsync = require('../utils/catchAsync')
const { OK, CREATED } = require('../configs/response.config')
const petService = require('../services/pet.service')
const breedService = require('../services/breed.service')
const cloudinaryService = require('../utils/cloudinary')
const ErrorWithStatus = require('../utils/errorWithStatus')
const { StatusCodes } = require('http-status-codes')

class PetController {
  addNewPet = catchAsync(async (req, res) => {
    const { petData } = req.body
    const image_url = req.file
    const imagelUrl = await cloudinaryService.uploadImage(image_url.buffer)
    const newPet = await petService.createPet(petData, imagelUrl)
    return CREATED(res, 'Pet added successfully', newPet)
  })

  updatePet = catchAsync(async (req, res) => {
    const { petId } = req.params
    if (!petId) {
      throw new ErrorWithStatus({ status: StatusCodes.BAD_REQUEST, message: 'Pet ID is required for update' })
    }

    const existingPet = await petService.getPetById(petId)
    if (!existingPet) {
      throw new ErrorWithStatus({ status: StatusCodes.NOT_FOUND, message: 'Pet not found' })
    }

    let imageUrls
    if (req.files && req.files.length > 0) {
      imageUrls = await Promise.all(req.files.map((file) => cloudinaryService.uploadImage(file.buffer)))
    } else {
      imageUrls = existingPet.image_url || []
    }

    const updatedPet = await petService.updatePet(petId, req.body, imageUrls)
    return OK(res, 'Pet updated successfully', updatedPet)
  })

  deletePet = catchAsync(async (req, res) => {
    const { id } = req.params
    if (!id) {
      throw new ErrorWithStatus({ status: StatusCodes.BAD_REQUEST, message: 'Pet ID is required for delete' })
    }
    const deletedPet = await petService.deletePet(id)

    return OK(res, 'Pet deleted successfully', deletedPet)
  })
  submitPet = catchAsync(async (req, res) => {
    if (!req.files || req.files.length === 0) {
      throw new ErrorWithStatus({ status: 400, message: 'No file uploaded' })
    }

    const imageFiles = req.files

    const imageUrls = await Promise.all(imageFiles.map((file) => cloudinaryService.uploadImage(file.buffer)))

    const pet = await petService.submitPet(req.id, req.body, imageUrls)
    return CREATED(res, 'Pet submitted successfully, pending approval', pet)
  })

  adminApprovePet = catchAsync(async (req, res) => {
    const pet = await petService.approvePet(req.params.petId)
    return OK(res, 'Pet approved successfully', pet)
  })
  getPetNotApprove = catchAsync(async (req, res) => {
    const pet = await petService.getAllPetNotApproved()
    return OK(res, 'Pet retrieved successfully', pet)
  })
  getPetApprove = catchAsync(async (req, res) => {
    const pet = await petService.getAllPetApproved(req.query)
    return OK(res, 'Pet retrieved successfully', pet)
  })
  getRequestAdoptPet = catchAsync(async (req, res) => {
    const pet = await petService.requestAdoption(req.id, req.params.petId)
    return OK(res, 'Get request adoption successfully', pet)
  })
  getPetBySubmittedId = catchAsync(async (req, res) => {
    const pet = await petService.getPetBySubmittedId(req.params.userId, req.query)
    return OK(res, 'Get by submited successfully', pet)
  })
  userAdoptPet = catchAsync(async (req, res) => {
    const pet = await petService.adoptPet(req.id, req.params.petId)
    return OK(res, 'Pet adopted successfully', pet)
  })
  getPetByBreed = catchAsync(async (req, res) => {
    const pet = await petService.getPetByBreed(req.params.breedId)
    return OK(res, 'Pet retrieved successfully', pet)
  })
  getBreeds = catchAsync(async (req, res) => {
    const breeds = await breedService.getBreeds()
    return OK(res, 'Get breeds successfully', breeds)
  })
  getBreedById = catchAsync(async (req, res) => {
    const breed = await breedService.getBreedById(req.params.breedId)
    return OK(res, 'Breed retrieved successfully', breed)
  })

  getPetById = catchAsync(async (req, res) => {
    const pet = await petService.getPetById(req.params.petId)
    return OK(res, 'Get Pet successfully', pet)
  })
}

module.exports = new PetController()
