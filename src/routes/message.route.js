const express = require('express')
const isAuthenticated = require('../middlewares/isAuthenticated.js')
const upload = require('../middlewares/multer.js')
const { getMessage, sendMessage, sendImageMessage } = require('../controllers/message.controller.js')

const router = express.Router()

router.route('/send/:id').post(isAuthenticated, sendMessage)
router.route('/send-image/:id').post(isAuthenticated, upload.single('image'), sendImageMessage)
router.route('/all/:id').get(isAuthenticated, getMessage)

module.exports = router
