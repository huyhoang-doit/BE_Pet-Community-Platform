const mongoose = require('mongoose')

const expenseTypeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    color: { type: String, required: true },
  },
  { timestamps: true }
)
    
module.exports = mongoose.model('ExpenseType', expenseTypeSchema)
