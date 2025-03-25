const express = require('express')
const isAuthenticated = require('../middlewares/isAuthenticated.js')
const { chatbot, recommendBreeds } = require('../controllers/chatbot.controller')

const router = express.Router()

router.route('/').post(isAuthenticated, chatbot)
router.route('/recommend-breeds').post(isAuthenticated, recommendBreeds)


module.exports = router