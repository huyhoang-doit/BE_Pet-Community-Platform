const express = require('express')
const multer = require('multer')
const {
  editProfile,
  followOrUnfollow,
  getProfile,
  getSuggestedUsers,
  getProfileById,
  getChatUser,
  getAllUser
} = require('../controllers/user.controller.js')
const isAuthenticated = require('../middlewares/isAuthenticated.js')

const storage = multer.memoryStorage()
const upload = multer({ storage: storage })

const router = express.Router()
router.route('/:username/profile').get(getProfile)
router.route('/id/:id/profile').get(getProfileById)
router.route('/profile/edit').post(isAuthenticated, upload.single('profilePicture'), editProfile)
router.route('/suggested').get(isAuthenticated, getSuggestedUsers)
router.route('/followorunfollow/:id').post(isAuthenticated, followOrUnfollow)
router.route('/chat-users').get(isAuthenticated, getChatUser)
router.route('/all').get(isAuthenticated, getAllUser)

module.exports = router
