const { StatusCodes } = require('http-status-codes')
const User = require('../models/user.model')
const ErrorWithStatus = require('../utils/errorWithStatus')
const cloudinaryService = require('../utils/cloudinary.js')
const Message = require('../models/message.model.js')
const { getReceiverSocketId, io } = require('../socket/socket.js')

class UserService {
  getProfile = async (username) => {
    let user = await User.findOne({ username }).populate(['bookmarks', 'posts'])
    user.posts.sort((a, b) => b.createdAt - a.createdAt)
    return user
  }
  getProfileById = async (userId) => {
    let user = await User.findById(userId).populate(['bookmarks', 'posts'])
    user.posts.sort((a, b) => b.createdAt - a.createdAt)
    return user
  }
  editProfile = async (userId, updateData, profilePicture) => {
    const user = await User.findById(userId).select('-password')
    if (!user) {
      throw new ErrorWithStatus({
        status: StatusCodes.NOT_FOUND,
        message: USER_MESSAGE.USER_NOT_FOUND
      })
    }

    if (profilePicture) {
      const profilePictureUrl = await cloudinaryService.uploadImage(profilePicture.buffer)
      user.profilePicture = profilePictureUrl
    }

    if (updateData.username) {
      const isUsernameExists = await User.findOne({ username: updateData.username })
      if (isUsernameExists && isUsernameExists._id.toString() !== userId) {
        throw new ErrorWithStatus({
          status: StatusCodes.BAD_REQUEST,
          message: USER_MESSAGE.USERNAME_ALREADY_EXISTS
        })
      }
    }

    Object.assign(user, updateData)
    await user.save()
    return user
  }

  getSuggestedUsers = async (userId) => {
    const user = await User.findById(userId)
    const suggestedUsers = await User.find({
      $and: [
        { _id: { $ne: userId } },
        { _id: { $nin: user.following } }
      ]
    }).select('-password')
    return suggestedUsers
  }

  followOrUnfollow = async (followerId, followingId) => {
    if (followerId === followingId) {
      throw new ErrorWithStatus({
        status: StatusCodes.BAD_REQUEST,
        message: 'You cannot follow/unfollow yourself'
      })
    }

    const [user, targetUser] = await Promise.all([
      User.findById(followerId),
      User.findById(followingId)
    ])

    if (!user || !targetUser) {
      throw new ErrorWithStatus({
        status: StatusCodes.NOT_FOUND,
        message: 'User not found'
      })
    }

    const isFollowing = user.following.includes(followingId)
    if (isFollowing) {
      await Promise.all([
        User.updateOne({ _id: followerId }, { $pull: { following: followingId } }),
        User.updateOne({ _id: followingId }, { $pull: { followers: followerId } })
      ])
      const notification = {
        type: 'follow',
        userId: followerId,
        userDetails: user,
        message: 'You are unfollowed'
      }
      const targetUserSocketId = getReceiverSocketId(followingId)
      io.to(targetUserSocketId).emit('notification', notification)
      return { action: 'unfollow' }
    } else {
      await Promise.all([
        User.updateOne({ _id: followerId }, { $push: { following: followingId } }),
        User.updateOne({ _id: followingId }, { $push: { followers: followerId } })
      ])
      return { action: 'follow' }
    }
  }

  getChatUsers = async (userId) => {
    // Lấy tất cả message với người khác của user
    const messages = await Message.find({
      $or: [{ senderId: userId }, { receiverId: userId }]
    }).sort({ createdAt: -1 })

    // Lấy ra tin nhắn cuối cùng của mỗi người
    const latestMessagesMap = new Map()
    for (const message of messages) {
      const chatPartnerId = message.senderId.equals(userId)
        ? message.receiverId.toString()
        : message.senderId.toString()
      if (!latestMessagesMap.has(chatPartnerId)) {
        latestMessagesMap.set(chatPartnerId, message)
      }
    }
    // Lấy ra id của những người đã chat với user
    const userIds = [...latestMessagesMap.keys()]
    // Lấy thông tin user của những người đã chat với user
    const users = await User.find({ _id: { $in: userIds } }).select('-password')

    // Thêm tin nhắn cuối cùng vào thông tin user
    return users.map(user => {

      // Lấy tin nhắn cuối cùng
      const lastMessage = latestMessagesMap.get(user._id.toString())
      return {
        ...user.toObject(),
        lastMessage: lastMessage
          ? {
            content: lastMessage.message,
            from: lastMessage.senderId.toString(),
            time: lastMessage.createdAt
          }
          : null
      }
    })
  }
}

module.exports = new UserService()