const express = require('express')
const multer = require('multer')
const storage = multer.memoryStorage()
const upload = multer({ storage })
const PetController = require('../controllers/pet.controller.js')
const isAuthenticated = require('../middlewares/isAuthenticated.js')
const validate = require('../middlewares/validate.middleware')
const PetValidation = require('../validation/pet.validation.js')

const router = express.Router()

router.get('/', PetController.getPetsNotAdoptedAndApproved)

router.post(
  '/add',
  isAuthenticated,
  validate(PetValidation.addNewPet),
  upload.array('image_url'),
  PetController.addNewPet
)
router.post(
  '/update/:petId',
  isAuthenticated,
  validate(PetValidation.updatePet),
  upload.array('image_url'),
  PetController.updatePet
)
router.delete('/delete/:id', PetController.deletePet, isAuthenticated)
router.post(
  '/submit',
  isAuthenticated,
  upload.array('image_url'),
  validate(PetValidation.addNewPet),
  PetController.submitPet
)
router.get('/detail/:petId', PetController.getPetById)
router.get('/breeds', PetController.getBreeds)
router.get('/breeds/:breedId', PetController.getBreedById)
router.post('/approve/:petId', isAuthenticated, PetController.adminApprovePet)
router.get('/not-approved', isAuthenticated, PetController.getPetNotApprove)
router.get('/approved', isAuthenticated, PetController.getPetApprove)
router.post('/adopt/:petId', isAuthenticated, PetController.userAdoptPet)
router.post('/request/:petId', isAuthenticated, PetController.requestAdoptPet)
router.put('/:id/donation-goal', isAuthenticated, PetController.updateDonationGoal)
router.get('/request/:petId', isAuthenticated, PetController.getRequestAdoptPet)
router.get('/submitted/:userId', isAuthenticated, PetController.getPetBySubmittedId)

module.exports = router
