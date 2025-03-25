const mongoose = require('mongoose')
const { TRANSACTION_STATUS } = require('../constants/enums')

const donationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    campaign: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', default: null },
    pet: { type: mongoose.Schema.Types.ObjectId, ref: 'Pet', default: null },
    amount: { type: Number, required: true },
    description: { type: String, required: true },
    code: { type: String, unique: true, required: true },
    paymentUrl: { type: String, default: '' },
    counterAccountName: { type: String, default: '' },
    counterAccountNumber: { type: String, default: '' },
    transactionDateTime: { type: String, default: '' },
    status: {
      type: String,
      enum: Object.values(TRANSACTION_STATUS),
      default: TRANSACTION_STATUS.PENDING,
      required: true
    },
    isAnonymous: { type: Boolean, default: false }
  },
  { timestamps: true }
)

// Middleware để đảm bảo chỉ có campaign hoặc pet, không đồng thời cả hai
donationSchema.pre('save', function (next) {
  if (this.campaign && this.pet) {
    return next(new Error('A donation can only be linked to a campaign or a pet, not both.'))
  }
  if (!this.campaign && !this.pet) {
    return next(new Error('A donation must be linked to either a campaign or a pet.'))
  }
  next()
})

// Middleware to update pet's donation amount when donation status changes to SUCCESS
donationSchema.post('save', async function (doc) {
  try {
    if (doc.status === TRANSACTION_STATUS.COMPLETED) {
      if (doc.pet) {
        const Pet = mongoose.model('Pet')
        const pet = await Pet.findById(doc.pet)
        if (pet) {
          // Increment donation count
          pet.donationCount = (pet.donationCount || 0) + 1

          // Add or update donationAmount field
          pet.donationAmount = (pet.donationAmount || 0) + doc.amount

          pet.totalDonation = (pet.totalDonation || 0) + doc.amount

          await pet.save()
        }
      }
      if (doc.campaign) {
        const Campaign = mongoose.model('Campaign')
        const campaign = await Campaign.findById(doc.campaign)
        if (campaign) {
          campaign.currentAmount = (campaign.currentAmount || 0) + doc.amount
          await campaign.save()
        }
      }
    }
  } catch (error) {
    console.error('Error updating pet donation data:', error)
  }
})

donationSchema.plugin(require('./plugins/paginate.plugin'))
const Donation = mongoose.model('Donation', donationSchema)
module.exports = Donation
