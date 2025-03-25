const mongoose = require('mongoose')
const { EXPENSE_STATUS } = require('../constants/enums')

// Define expense schema as a subdocument
const expenseSchema = new mongoose.Schema(
  {
    type: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExpenseType',
      required: true
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    uploadedBy : {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    pet: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet', required: true },
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    note: { type: String, required: true },
    receipt: { type: String }, // URL to receipt image if available

    status: {
      type: String,
      enum: Object.values(EXPENSE_STATUS),
      default: EXPENSE_STATUS.PENDING
    }
  },
  { timestamps: true }
)
expenseSchema.plugin(require('./plugins/paginate.plugin'))
const Expense = mongoose.model('Expense', expenseSchema)
module.exports = Expense
