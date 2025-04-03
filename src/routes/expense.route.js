const express = require('express')
const isAuthenticated = require('../middlewares/isAuthenticated.js')
const checkRole = require('../middlewares/checkRole.js')
const { createExpense, getExpenses, approveExpense, uploadReceipt, verifyExpense, deleteExpense } = require('../controllers/expense.controller.js')
const { ROLE } = require('../constants/enums.js')
const upload = require('../middlewares/multer.js')

const router = express.Router()

router.route('/').get(isAuthenticated, getExpenses)
router.route('/').post(isAuthenticated, checkRole([ROLE.SERVICE_STAFF, ROLE.MANAGER]), createExpense)
router.route('/:id/approve').put(isAuthenticated, checkRole([ROLE.SERVICE_STAFF, ROLE.MANAGER]), approveExpense)
router.route('/:id/upload').post(isAuthenticated, checkRole([ROLE.SERVICE_STAFF]), upload.single('receipt'), uploadReceipt)
router.route('/:id/verify').put(isAuthenticated, checkRole([ROLE.MANAGER]), verifyExpense)
router.route('/:id').delete(isAuthenticated, checkRole([ROLE.SERVICE_STAFF]), deleteExpense)
module.exports = router
