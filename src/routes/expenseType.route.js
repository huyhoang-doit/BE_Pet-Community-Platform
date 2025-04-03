const express = require('express')
const { getExpenseTypes, createExpense } = require('../controllers/expenseType.controller.js')
const isAuthenticated = require('../middlewares/isAuthenticated.js')
const checkRole = require('../middlewares/checkRole.js')
const { ROLE } = require('../constants/enums.js')

const router = express.Router()

router.route('/').get(getExpenseTypes)
router.route('/').post(isAuthenticated, checkRole(ROLE.MANAGER), createExpense)
module.exports = router
