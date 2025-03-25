const { EXPENSE_STATUS } = require('../constants/enums')
const Expense = require('../models/expense.model')
const Pet = require('../models/pet.model')
const cloudinaryService = require('../utils/cloudinary.js')

class ExpenseService {
  async createExpense(req, userId) {
    try {
      const { amount, note, date, type, petId } = req.body
      const createdBy = userId
      // Create expense

      const expense = new Expense({
        amount,
        note,
        date,
        createdBy,
        type,
        pet: petId
      })
      console.log('expense:', expense)

      await expense.save()

      await Pet.findByIdAndUpdate(petId, { $push: { expenses: expense._id } }, { new: true })

      const populatedExpense = await Expense.findById(expense._id)
        .populate('pet')
        .populate('type')
        .populate('createdBy')
      return populatedExpense
    } catch (error) {
      console.error('Error in createExpense:', error)
      throw new Error('Failed to create expense')
    }
  }

  async getExpenses(query) {
    try {
      const { sortBy, page, limit, q } = query
      const filter = {}

      const options = {
        sortBy: sortBy || 'status:desc',
        limit: limit ? parseInt(limit) : 10,
        page: page ? parseInt(page) : 1,
        allowSearchFields: ['note'],
        q: q ?? '',
        populate: 'type,pet,createdBy'
      }
      const expenses = await Expense.paginate(filter, options)
      return expenses
    } catch (error) {
      console.error('Error in getExpenses:', error)
      throw new Error('Failed to get expenses')
    }
  }

  async approveExpense(id, status) {
    try {
      const expense = await Expense.findById(id).populate('pet')
      if (!expense) {
        throw new Error('Expense not found')
      }

      if (expense.status !== EXPENSE_STATUS.PENDING) {
        throw new Error('Expense has already been processed')
      }

      // Cập nhật trạng thái sang "Receipt Pending"
      if (status === EXPENSE_STATUS.RECEIPT_PENDING) {
        expense.status = EXPENSE_STATUS.RECEIPT_PENDING
      } else if (status === EXPENSE_STATUS.REJECTED) {
        expense.status = EXPENSE_STATUS.REJECTED
      }
      await expense.save()
      return expense
    } catch (error) {
      console.error('Error in approveExpense:', error)
      throw new Error('Failed to approve expense')
    }
  }

  async uploadReceipt(req) {
    try {
      const { id } = req.params
      const expense = await Expense.findById(id).populate('pet')
      if (!expense) {
        throw new Error('Expense not found')
      }

      let receipt
      const file = req.file
      if (file) {
        receipt = await cloudinaryService.uploadImage(file.buffer)
      }

      // Chỉ cho phép upload nếu đang ở trạng thái "Receipt Pending"
      if (expense.status !== EXPENSE_STATUS.RECEIPT_PENDING) {
        throw new Error('Receipt can only be uploaded for approved expenses')
      }

      // Cập nhật hóa đơn
      expense.receipt = receipt
      expense.uploadedBy = req.id
      expense.status = EXPENSE_STATUS.WAITING_FOR_REVIEW

      await expense.save()

      return expense
    } catch (error) {
      console.error('Error in uploadReceipt:', error)
      throw new Error('Failed to upload receipt')
    }
  }

  async verifyReceipt(req) {
    try {
      const { id } = req.params
      const { status } = req.body
      const expense = await Expense.findById(id).populate('pet')
      if (!expense) throw new Error('Expense not found')

      if (expense.status !== EXPENSE_STATUS.WAITING_FOR_REVIEW) {
        throw new Error('Expense must be in Waiting for Review status')
      }

      if (status === EXPENSE_STATUS.COMPLETED) {
        // Nếu hóa đơn hợp lệ, chuyển sang Completed và trừ tiền
        const pet = expense.pet
        if (pet.donationAmount < expense.amount) {
          throw new Error('Insufficient funds for this expense')
        }
        pet.donationAmount -= expense.amount
        expense.status = EXPENSE_STATUS.COMPLETED
        await pet.save()
      } else {
        // Nếu hóa đơn sai, quay lại Receipt Pending để Staff upload lại
        expense.receipt = null
        expense.status = EXPENSE_STATUS.RECEIPT_PENDING
      }

      await expense.save()
      return expense
    } catch (error) {
      console.error('Error in verifyReceipt:', error)
      throw new Error('Failed to verify receipt')
    }
  }

  async deleteExpense(req) {
    try {
      const { id } = req.params
      const expense = await Expense.findById(id)
      if (!expense) {
        throw new Error('Expense not found')
      }

      await Pet.findByIdAndUpdate(expense.pet, { $pull: { expenses: id } })

      await expense.remove()
      return expense
    } catch (error) {
      console.error('Error in deleteExpense:', error)
      throw new Error('Failed to delete expense')
    }
  }
}

module.exports = new ExpenseService()
