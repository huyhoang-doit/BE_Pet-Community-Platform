const mongoose = require('mongoose')
const { GENDER, ROLE } = require('../constants/enums.js')
const { DEFAULT_AVATAR } = require('../constants/default.js')

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    firstName: { type: String, default: '' },
    lastName: { type: String, default: '' },
    name: { type: String },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, private: true },
    profilePicture: { type: String, default: DEFAULT_AVATAR },
    bio: { type: String, default: '' },
    gender: { type: String, enum: Object.values(GENDER), default: GENDER.MALE },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
    bookmarks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Post' }],
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    isDeleted: { type: Boolean, default: false },
    isBlocked: { type: Boolean, default: false },
    address: { type: String, default: '' },
    phoneNumber: { type: String, default: '' },
    dateOfBirth: { type: Date, default: null },
    role: { type: String, enum: Object.values(ROLE), default: ROLE.USER }
  },
  { timestamps: true }
)
userSchema.plugin(require('./plugins/paginate.plugin'))
userSchema.plugin(require('./plugins/toJSON.plugin'))

const User = mongoose.model('User', userSchema)
module.exports = User
