const express = require('express')
const { chatbot } = require('../controllers/chatbot.controller')

const router = express.Router()

router.route('/').post(chatbot)

module.exports = router