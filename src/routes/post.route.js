const express = require('express')
const multer = require('multer')
const storage = multer.memoryStorage()
const upload = multer({ storage: storage })
const {
  addComment,
  addNewPost,
  bookmarkPost,
  deletePost,
  dislikePost,
  getAllPost,
  getCommentsOfPost,
  getPostById,
  getUserPost,
  likePost,
  updatePost
} = require('../controllers/post.controller.js')
const isAuthenticated = require('../middlewares/isAuthenticated.js')

const router = express.Router()

router.route('/:id/getpostbyid').get(getPostById)
router.route('/all').get(getAllPost)
router.route('/addpost').post(isAuthenticated, upload.array('media'), addNewPost)
router.route('/userpost/all').get(isAuthenticated, getUserPost)
router.route('/:id/like').put(isAuthenticated, likePost)
router.route('/:id/dislike').put(isAuthenticated, dislikePost)
router.route('/:id/comment').post(isAuthenticated, addComment)
router.route('/:id/comment/all').post(isAuthenticated, getCommentsOfPost)
router.route('/:id').delete(isAuthenticated, deletePost).put(isAuthenticated, updatePost)
router.route('/:id/bookmark').get(isAuthenticated, bookmarkPost)

module.exports = router
