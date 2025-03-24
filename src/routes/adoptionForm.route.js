const express = require('express')
const router = express.Router()
const multer = require('multer')
const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
})
const AdoptionFormController = require('../controllers/adoptionForm.controller')
const isAuthenticated = require('../middlewares/isAuthenticated')
const checkRole = require('../middlewares/checkRole')
const { ROLE } = require('../constants/enums')

router.post('/create', isAuthenticated, checkRole(ROLE.USER), AdoptionFormController.createAdoptionForm)
router.get('/sender/:id', isAuthenticated, checkRole(ROLE.USER), AdoptionFormController.getFormBySenderId)
router.get('/all', isAuthenticated, checkRole(ROLE.SERVICE_STAFF), AdoptionFormController.getAll)
router.post(
  '/check',
  isAuthenticated,
  checkRole(ROLE.SERVICE_STAFF),
  upload.single('image_url'),
  AdoptionFormController.checkPeriodic
)
router
  .route('/form/:formId')
  .put(isAuthenticated, checkRole(ROLE.SERVICE_STAFF), AdoptionFormController.updateAdoptionFormStatus)

module.exports = router
