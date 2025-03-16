const express = require('express')
const isAuthenticated = require('../middlewares/isAuthenticated.js')
const { chatbot } = require('../controllers/chatbot.controller')

const router = express.Router()

router.route('/').post(isAuthenticated, chatbot)

module.exports = router