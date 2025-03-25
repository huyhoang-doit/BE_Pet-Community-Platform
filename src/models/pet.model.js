const mongoose = require('mongoose')
const { EXPENSE_STATUS } = require('../constants/enums')

const petSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 32 },
    // breed: { type: String, required: true, trim: true, maxlength: 32 },
    age: { type: Number, required: true, min: 0 },
    health_status: {
      type: String,
      required: true,
      trim: true,
      enum: ['Healthy', 'Sick', 'Recovering', 'Injured'],
      default: 'Healthy'
    },
    description: { type: String, required: true, trim: true, maxlength: 500 },
    image_url: { type: [[{ type: String }]], required: false, trim: true },
    size: { type: String, required: true, trim: true, maxlength: 32 },
    coat: { type: String, required: true, trim: true, maxlength: 32 },
    temperament: { type: String, required: true, trim: true, maxlength: 32 },
    vaccinated: { type: Boolean, required: true, default: false },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
    isApproved: { type: Boolean, default: false },
    isAddPost: { type: Boolean, default: false },
    isAdopted: {
      type: Boolean,
      default: false
    },
    adoptionRequests: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    breed: { type: mongoose.Schema.Types.ObjectId, ref: 'Breed', required: true },
    expenses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Expense'
      }
    ],
    totalDonation: { type: Number, default: 0 }, // Tổng tiền đã donate từ trước đến nay
    donationAmount: { type: Number, default: 0 }, // Số dư hiện tại sau khi trừ chi tiêu
    donationGoal: { type: Number, default: 0 },
    donationCount: { type: Number, default: 0 },
    formRequests: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AdoptionForm'
      }
    ],
    breed: { type: mongoose.Schema.Types.ObjectId, ref: 'Breed', required: true }
  },
  { timestamps: true }
)

petSchema.virtual('totalExpenses').get(function () {
  return this.expenses
    .filter((expense) => expense.status === EXPENSE_STATUS.COMPLETED)
    .reduce((total, expense) => total + expense.amount, 0)
})

petSchema.virtual('remainingFunds').get(function () {
  return this.donationAmount || 0
})

petSchema.virtual('remainingDonationNeeded').get(function () {
  return Math.max(0, this.donationGoal - this.totalDonation)
})

petSchema.set('toJSON', { virtuals: true })
petSchema.set('toObject', { virtuals: true })

petSchema.plugin(require('./plugins/paginate.plugin'))
const Pet = mongoose.model('Pet', petSchema)
module.exports = Pet
