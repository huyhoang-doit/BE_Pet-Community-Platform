const mongoose = require('mongoose')
const Schema = mongoose.Schema

const periodicCheckSchema = new mongoose.Schema(
  {
    adoptionFormId: {
      type: Schema.Types.ObjectId,
      ref: 'AdoptionForm',
      required: [true, 'Adoption Form ID is required']
    },
    checkDate: {
      type: Date,
      required: [true, 'Check date is required'],
      default: Date.now
    },
    status: {
      type: String,
      enum: ['Good', 'Needs Attention', 'Critical'],
      required: [true, 'Check status is required']
    },
    notes: {
      type: String,
      trim: true,
      default: ''
    },
    checkedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Checked by is required']
    },
    image_url: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
)

// Pagination Plugin
periodicCheckSchema.plugin(require('./plugins/paginate.plugin'))

const PeriodicCheck = mongoose.model('PeriodicCheck', periodicCheckSchema)
module.exports = PeriodicCheck
