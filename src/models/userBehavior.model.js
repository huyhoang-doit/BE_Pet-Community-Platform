const mongoose = require('mongoose')

const UserBehaviorSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    postId: { type: mongoose.Schema.Types.ObjectId, ref: "AdoptionPost", required: true },
    action: { type: String, enum: ["like", "dislike", "share"], required: true },
    timestamp: { type: Date, default: Date.now },
  });

UserBehaviorSchema.plugin(require('./plugins/toJSON.plugin'))
const UserBehavior = mongoose.model('UserBehavior', UserBehaviorSchema)
module.exports = UserBehavior
