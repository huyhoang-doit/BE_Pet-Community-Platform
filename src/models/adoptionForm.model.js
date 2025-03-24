const mongoose = require('mongoose')

const adoptionFormSchema = new mongoose.Schema(
  {
    adoptionPost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdoptionPost',
      required: [true, 'AdoptionPost ID is required']
    },
    pet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pet',
      required: [true, 'Pet ID is required']
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required']
    },
    adopter: {
      name: {
        type: String,
        required: [true, 'Adopter name is required'],
        trim: true,
        minlength: [2, 'Name must be at least 2 characters long']
      },
      email: {
        type: String,
        required: [true, 'Adopter email is required'],
        trim: true,
        lowercase: true,
        match: [/.+\@.+\..+/, 'Please enter a valid email address']
      },
      phone: {
        type: String,
        required: [true, 'Adopter phone number is required'],
        trim: true,
        match: [/^[0-9]{10,11}$/, 'Phone number must be 10-11 digits']
      },
      address: {
        province: {
          type: String,
          required: [true, 'Province is required'],
          trim: true
        },
        district: {
          type: String,
          required: [true, 'District is required'],
          trim: true
        },
        ward: {
          type: String,
          required: [true, 'Ward is required'],
          trim: true
        },
        detail: {
          type: String,
          required: [true, 'Detailed address is required'],
          trim: true
        }
      }
    },
    reason: {
      type: String,
      trim: true,
      default: ''
    },
    status: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected'],
      default: 'Pending'
    },
    response_note: {
      type: String,
      default: ''
    },
    approved_date: {
      type: Date,
      default: null
    },
    next_check_date: {
      type: Date,
      default: null
    },
    periodicChecks: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PeriodicCheck' }],
      default: [],
      validate: {
        validator: (array) => array.length <= 3,
        message: 'Periodic checks cannot exceed 3 entries'
      }
    }
  },
  { timestamps: true }
)

// Pagination Plugin
adoptionFormSchema.plugin(require('./plugins/paginate.plugin'))

const AdoptionForm = mongoose.model('AdoptionForm', adoptionFormSchema)
module.exports = AdoptionForm
