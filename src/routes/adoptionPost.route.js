const express = require('express')
const multer = require('multer')
const {
  getAllPost,
  addNewPost,
  updatePost,
  getPostByBreed,
  updateAdoptionFormStatus,
  likePost,
  dislikePost,
  sharePost,
  getUserBehavior,
  getDetailPost
} = require('../controllers/adoptionPost.controller.js')
const isAuthenticated = require('../middlewares/isAuthenticated.js')
const checkRole = require('../middlewares/checkRole.js')
const { ROLE } = require('../constants/enums.js')
const { createAdoptionForm, getAll, checkPeriodic } = require('../controllers/adoptionForm.controller.js')
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })
const router = express.Router()

router.route('/all').get(getAllPost)
router.route('/').post(isAuthenticated, upload.array('media'), addNewPost)
router.route('/:id').put(isAuthenticated, upload.array('media'), updatePost)
router.route('/:id/like').put(isAuthenticated, likePost)
router.route('/:id/dislike').put(isAuthenticated, dislikePost)
router.route('/:id/share').post(isAuthenticated, sharePost)
router.route('/:id').get(isAuthenticated, getDetailPost)
// Adoption Form
router.route('/form-check').post(isAuthenticated, checkRole(ROLE.SERVICE_STAFF), checkPeriodic)
router
  .route('/form')
  .get(isAuthenticated, checkRole(ROLE.SERVICE_STAFF), getAll)
  .post(isAuthenticated, checkRole(ROLE.SERVICE_STAFF), createAdoptionForm)
router.route('/form/:formId').put(isAuthenticated, checkRole(ROLE.SERVICE_STAFF), updateAdoptionFormStatus)
router.route('/breed/:breedId').get(isAuthenticated, getPostByBreed)

// User Behavior
router.route('/user/user-behavior').get(isAuthenticated, getUserBehavior)
module.exports = router
