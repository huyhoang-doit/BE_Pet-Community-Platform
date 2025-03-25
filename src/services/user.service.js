const { StatusCodes } = require('http-status-codes')
const User = require('../models/user.model')
const ErrorWithStatus = require('../utils/errorWithStatus')
const cloudinaryService = require('../utils/cloudinary.js')
const Message = require('../models/message.model.js')
const { getReceiverSocketId, io } = require('../socket/socket.js')

class UserService {
  getProfile = async (username) => {
    let user = await User.findOne({ username })
      .populate('bookmarks')
      .populate({
        path: 'posts',
        match: {
          isApproved: true,
          isBlocked: false,
          isHidden: false,
          isDeleted: false
        },
        options: { sort: { createdAt: -1 } }
      })
    return user
  }

  getProfileById = async (userId) => {
    let user = await User.findById(userId)
      .populate('bookmarks')
      .populate({
        path: 'posts',
        match: {
          isApproved: true,
          isBlocked: false,
          isHidden: false,
          isDeleted: false
        },
        options: { sort: { createdAt: -1 } }
      })
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

  getSuggestedUsers = async (userId, query) => {
    const { sortBy, limit, page, q } = query
    const user = await User.findById(userId)
    const filter = {
      isActive: true,
      _id: { $ne: userId, $nin: user.following }
    }

    const options = {
      sortBy: sortBy || 'createdAt',
      limit: limit ? parseInt(limit) : 5,
      page: page ? parseInt(page) : 1,
      allowSearchFields: ['username'],
      q: q ?? '',
      fields: '-password'
    }

    return await User.paginate(filter, options)
  }

  followOrUnfollow = async (followerId, followingId) => {
    if (followerId === followingId) {
      throw new ErrorWithStatus({
        status: StatusCodes.BAD_REQUEST,
        message: 'You cannot follow/unfollow yourself'
      })
    }

    const [user, targetUser] = await Promise.all([User.findById(followerId), User.findById(followingId)])

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
    return users
      .map((user) => {
        // Lấy tin nhắn cuối cùng
        const lastMessage = latestMessagesMap.get(user._id.toString())
        return {
          ...user.toObject(),
          id: user._id,
          lastMessage: lastMessage
            ? {
                content: lastMessage.message,
                from: lastMessage.senderId.toString(),
                time: lastMessage.createdAt
              }
            : null
        }
      })
      .sort((a, b) => b.lastMessage.time - a.lastMessage.time)
  }

  getAllUser = async (query, userId) => {
    const { q, page, limit, sortBy } = query
    const filter = { isActive: true, _id: { $ne: userId } }
    const options = {
      sortBy: sortBy || 'createdAt',
      limit: limit ? parseInt(limit) : 5,
      page: page ? parseInt(page) : 1,
      allowSearchFields: ['username'],
      q: q ?? '',
      fields: '-password'
    }

    return await User.paginate(filter, options)
  }
}

module.exports = new UserService()
