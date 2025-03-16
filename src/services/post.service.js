const bcrypt = require('bcryptjs')
const { USER_MESSAGE } = require('../constants/messages.js')
const ErrorWithStatus = require('../utils/errorWithStatus.js')
const { StatusCodes } = require('http-status-codes')
const Post = require('../models/post.model.js')
const postRepo = require('../repositories/post.repo.js')

class PostService {
  constructor() {
    this.post = Post
  }
  addPost = async (user) => {
    const { username, email, password } = user
    const isUserExists = await this.user.findOne({ email })
    if (isUserExists) {
      throw new ErrorWithStatus({ status: StatusCodes.BAD_REQUEST, message: USER_MESSAGE.EMAIL_ALREADY_EXISTS })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const newUser = await this.user.create({
      username,
      email,
      password: hashedPassword
    })

    const email_verify_token = await this.signEmailVerifyToken({
      user_id: newUser._id.toString()
    })

    const { access_token, refresh_token } = await this.signAccessAndRefreshToken({
      user_id: newUser._id.toString()
    })

    return {
      access_token,
      refresh_token,
      email_verify_token
    }
  }

  getAllPosts = async (query) => {
    const { sortBy, limit, page, q, ...filters } = query // Extract additional filters

    const defaultFilters = {
      isHidden: false,
      isDeleted: false
    }

    const options = {
      sortBy: sortBy || 'createdAt',
      limit: limit ? parseInt(limit) : 5,
      page: page ? parseInt(page) : 1,
      allowSearchFields: ['caption'],
      q: q ?? '',
      populate: 'author,comments,comments.author'
    }

    // Merge default filters with filters from query (e.g., isApproved, isRejected)
    const finalFilter = { ...defaultFilters, ...filters }

    return await postRepo.getAll(finalFilter, options)
  }

  getUserPost = async (userId) => {
    return await Post.find({ 
      author: userId,
      isApproved: true,
      isBlocked: false,
      isHidden: false,
      isDeleted: false
    })
      .sort({ createdAt: -1 })
      .populate({
        path: 'author',
        select: 'username, profilePicture isVerified'
      })
      .populate({
        path: 'comments',
        sort: { createdAt: -1 },
        populate: {
          path: 'author',
          select: 'username profilePicture isVerified'
        }
      })
  }

  getPostById = async (postId) => {
    return await Post.findById(postId)
      .populate('author', 'username profilePicture isVerified')
      .populate({
        path: 'comments',
        sort: { createdAt: -1 },
        populate: {
          path: 'author',
          select: 'username profilePicture isVerified'
        }
      })
  }
}

const postService = new PostService()
module.exports = postService
