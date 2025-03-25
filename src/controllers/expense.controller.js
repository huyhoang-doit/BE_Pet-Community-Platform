const { OK, CREATED, NOT_FOUND } = require('../configs/response.config')
const { EXPENSE_MESSAGE } = require('../constants/messages')
const expenseService = require('../services/expense.service')
const Expense = require('../models/expense.model.js')
const Pet = require('../models/pet.model.js')
const catchAsync = require('../utils/catchAsync.js')

class ExpenseController {
  async createExpense(req, res) {
    const expense = await expenseService.createExpense(req, req.id)
    return CREATED(res, EXPENSE_MESSAGE.CREATED_SUCCESSFULLY, expense)
  }

  getExpenses = catchAsync(async (req, res) => {
    const expenses = await expenseService.getExpenses(req.query)
    return OK(res, EXPENSE_MESSAGE.GET_ALL_SUCCESSFULLY, expenses)
  })

  async approveExpense(req, res) {
    const { id } = req.params
    const { status } = req.body
    const expense = await expenseService.approveExpense(id, status)
    return OK(res, EXPENSE_MESSAGE.UPDATED_SUCCESSFULLY, expense)
  }

  uploadReceipt = catchAsync(async (req, res) => {
    const receipt = await expenseService.uploadReceipt(req)
    return OK(res, EXPENSE_MESSAGE.UPLOADED_RECEIPT_SUCCESSFULLY, receipt)
  })

  verifyExpense = catchAsync(async (req, res) => {
    const receipt = await expenseService.verifyReceipt(req)
    return OK(res, EXPENSE_MESSAGE.VERIFIED_RECEIPT_SUCCESSFULLY, receipt)
  })
}

module.exports = new ExpenseController()
