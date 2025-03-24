const mongoose = require('mongoose')

const petSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 32 },
    breed: { type: String, required: true, trim: true, maxlength: 32 },
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

petSchema.plugin(require('./plugins/paginate.plugin'))
const Pet = mongoose.model('Pet', petSchema)
module.exports = Pet
