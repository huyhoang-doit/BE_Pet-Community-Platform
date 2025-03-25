const { OK } = require('../configs/response.config')
const { EXPENSE_TYPES_MESSAGE } = require('../constants/messages')
const ExpenseType = require('../models/expenseType.model')

class ExpenseTypeController {
  async getExpenseTypes(req, res) {
    const expenseTypes = await ExpenseType.find()
    return OK(res, EXPENSE_TYPES_MESSAGE.GET_EXPENSE_TYPES_SUCCESSFULLY, expenseTypes)
  }
  async createExpense(req, res) {
    const { name } = req.body
    const expenseType = await ExpenseType.create({ name })
    return OK(res, EXPENSE_TYPES_MESSAGE.CREATE_EXPENSE_TYPE_SUCCESSFULLY, expenseType)
  }
  
  async deleteExpense(req, res) {
    const { id } = req.params
    await ExpenseType.findByIdAndDelete(id)
    return OK(res, EXPENSE_TYPES_MESSAGE.DELETE_EXPENSE_TYPE_SUCCESSFULLY)
  }
}

module.exports = new ExpenseTypeController()
