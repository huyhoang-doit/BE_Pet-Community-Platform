const sharp = require('sharp')
const Post = require('../models/post.model.js')
const User = require('../models/user.model.js')
const Comment = require('../models/comment.model.js')
const { getReceiverSocketId, io } = require('../socket/socket.js')
const catchAsync = require('../utils/catchAsync.js')
const { CREATED, OK } = require('../configs/response.config.js')
const { POST_MESSAGE } = require('../constants/messages.js')
const { ObjectId } = require('mongoose').Types
const cloudinaryService = require('../utils/cloudinary.js')
const postService = require('../services/post.service.js')
const Notification = require('../models/notification.model.js')
const { NOTIFICAITON_TYPE } = require('../constants/enums.js')
const { checkBoth } = require('../utils/gemini.js')

class PostController {
  addNewPost = catchAsync(async (req, res) => {
    const { caption } = req.body
    const mediaFiles = req.files
    const authorId = req.id

    if (!mediaFiles || mediaFiles.length === 0) {
      return res.status(400).json({
        message: 'At least one media file (image or video) is required.',
        success: false
      })
    }

    const contentCheckResult = await checkBoth(caption, mediaFiles[0].buffer)
    if (contentCheckResult.combined_assessment.is_harmful) {
      return res.status(400).json({
        message: 'Nội dung không hợp lệ.',
        success: false,
        reason: contentCheckResult.combined_assessment.reason
      })
    }

    // // Kiểm duyệt nội dung trước khi tạo bài post
    // const contentCheckResult = await checkContent(caption)
    // if (contentCheckResult.overall_toxic) {
    //   return res.status(400).json({
    //     message: 'Nội dung không hợp lệ.',
    //     success: false,
    //     reason: contentCheckResult.reason
    //   })
    // }

    // // Kiểm duyệt ảnh trước khi tạo bài post
    // if (mediaFiles.length > 0) {
    //   const imageCheckResult = await checkImage(mediaFiles[0].buffer)
    //   if (imageCheckResult.overall_harmful) {
    //     return res.status(400).json({
    //       message: 'Ảnh không hợp lệ.',
    //       success: false,
    //       reason: imageCheckResult.moderation_reason
    //     })
    //   }
    // }

    const imageUrls = []
    const videoUrls = []

    for (let i = 0; i < mediaFiles.length; i++) {
      const mediaFile = mediaFiles[i]

      // Ensure file has the required buffer property
      if (!mediaFile.buffer) {
        return res.status(400).json({
          message: `Invalid file format for media ${i + 1}.`,
          success: false
        })
      }

      const fileType = mediaFile.mimetype.split('/')[0]

      try {
        if (fileType === 'image') {
          const optimizedImageBuffer = await sharp(mediaFile.buffer)
            .resize({ width: 800, height: 800, fit: 'inside' })
            .toFormat('jpeg', { quality: 80 })
            .toBuffer()

          const imageUrl = await cloudinaryService.uploadImage(optimizedImageBuffer)
          if (!imageUrl) {
            return res.status(500).json({
              message: `Image ${i + 1} upload failed.`,
              success: false
            })
          }
          imageUrls.push(imageUrl)
        } else if (fileType === 'video') {
          const videoUrl = await cloudinaryService.uploadVideo(mediaFile.buffer)
          if (!videoUrl) {
            return res.status(500).json({
              message: `Video ${i + 1} upload failed.`,
              success: false
            })
          }
          videoUrls.push(videoUrl)
        } else {
          return res.status(400).json({
            message: `Unsupported media type for file ${i + 1}.`,
            success: false
          })
        }
      } catch (error) {
        return res.status(500).json({
          message: `Error while processing media ${i + 1}: ${error}`,
          success: false
        })
      }
    }

    // Create the post with the collected media URLs
    const post = await Post.create({
      caption,
      image: imageUrls,
      video: videoUrls,
      author: new ObjectId(authorId)
    })

    // Update the user's post list
    const user = await User.findById(authorId)
    if (user) {
      user.posts.push(post._id)
      await user.save()
    }

    // Populate author details in the response
    await post.populate({ path: 'author', select: '-password' })

    return CREATED(res, POST_MESSAGE.POST_CREATED_SUCCESSFULLY, post)
  })

  getAllPost = catchAsync(async (req, res) => {
    const posts = await postService.getAllPosts(req.query)
    return OK(res, POST_MESSAGE.POST_FETCHED_SUCCESSFULLY, posts)
  })

  getUserPost = catchAsync(async (req, res) => {
    const authorId = req.id
    const posts = await postService.getUserPost(authorId)
    return OK(res, POST_MESSAGE.POST_FETCHED_SUCCESSFULLY, posts)
  })

  likePost = async (req, res) => {
    try {
      const likeKrneWalaUserKiId = req.id
      const postId = req.params.id
      const post = await Post.findById(postId)
      if (!post) return res.status(404).json({ message: 'Post not found', success: false })

      // like logic started
      await post.updateOne({ $addToSet: { likes: likeKrneWalaUserKiId } })
      await post.save()

      // implement socket io for real time notification
      const user = await User.findById(likeKrneWalaUserKiId).select('username profilePicture')

      const postOwnerId = post.author.toString()
      if (postOwnerId !== likeKrneWalaUserKiId) {
        // emit a notification event
        const notification = await Notification.create({
          type: NOTIFICAITON_TYPE.LIKE,
          sender: likeKrneWalaUserKiId,
          recipient: post.author,
          post: postId,
          message: 'đã thích ảnh của bạn',
          read: false
        })
        const postOwnerSocketId = getReceiverSocketId(postOwnerId)
        io.to(postOwnerSocketId).emit('notification', {
          ...notification,
          sender: user
        })
      }

      return res.status(200).json({ message: 'Post liked', success: true })
    } catch (error) {}
  }
  dislikePost = async (req, res) => {
    try {
      const likeKrneWalaUserKiId = req.id
      const postId = req.params.id
      const post = await Post.findById(postId)
      if (!post) return res.status(404).json({ message: 'Post not found', success: false })

      // like logic started
      await post.updateOne({ $pull: { likes: likeKrneWalaUserKiId } })
      await post.save()

      // implement socket io for real time notification
      const user = await User.findById(likeKrneWalaUserKiId).select('username profilePicture')
      const postOwnerId = post.author.toString()
      if (postOwnerId !== likeKrneWalaUserKiId) {
        // emit a notification event
        const notification = {
          type: 'dislike',
          userId: likeKrneWalaUserKiId,
          userDetails: user,
          postId,
          message: 'Your post was liked'
        }
        const postOwnerSocketId = getReceiverSocketId(postOwnerId)
        io.to(postOwnerSocketId).emit('notification', notification)
      }

      return res.status(200).json({ message: 'Post disliked', success: true })
    } catch (error) {}
  }
  addComment = async (req, res) => {
    try {
      const postId = req.params.id
      const commentKrneWalaUserKiId = req.id

      const { text } = req.body

      const post = await Post.findById(postId)

      if (!text) return res.status(400).json({ message: 'text is required', success: false })

      const comment = await Comment.create({
        text,
        author: commentKrneWalaUserKiId,
        post: postId
      })

      await comment.populate({
        path: 'author',
        select: 'username profilePicture isVerified'
      })

      post.comments.push(comment._id)
      await post.save()

      return res.status(201).json({
        message: 'Comment Added',
        comment,
        success: true
      })
    } catch (error) {
      console.log(error)
    }
  }
  getCommentsOfPost = async (req, res) => {
    try {
      const postId = req.params.id

      const comments = await Comment.find({ post: postId }).populate('author', 'username profilePicture isVerified')

      if (!comments) return res.status(404).json({ message: 'No comments found for this post', success: false })

      return res.status(200).json({ success: true, comments })
    } catch (error) {
      console.log(error)
    }
  }
  deletePost = async (req, res) => {
    try {
      const postId = req.params.id
      const authorId = req.id

      const post = await Post.findById(postId)
      if (!post) return res.status(404).json({ message: 'Post not found', success: false })

      // check if the logged-in user is the owner of the post
      if (post.author.toString() !== authorId) return res.status(403).json({ message: 'Unauthorized' })

      // delete post
      await Post.findByIdAndDelete(postId)

      // remove the post id from the user's post
      let user = await User.findById(authorId)
      user.posts = user.posts.filter((id) => id.toString() !== postId)
      await user.save()

      // delete associated comments
      await Comment.deleteMany({ post: postId })

      return res.status(200).json({
        success: true,
        message: 'Post deleted'
      })
    } catch (error) {
      console.log(error)
    }
  }
  updatePost = async (req, res) => {
    try {
      const postId = req.params.id
      console.log(req.body)
      console.log(postId)
      const post = await Post.findById(postId)
      if (!post) return res.status(404).json({ message: 'Post not found', success: false })
      await post.updateOne(req.body)
      return res.status(200).json({ message: 'Post updated', success: true })
    } catch (error) {
      console.log(error)
    }
  }
  getPostById = catchAsync(async (req, res) => {
    const post = await postService.getPostById(req.params.id)
    return OK(res, POST_MESSAGE.GET_POST_SUCCESSFULLY, post)
  })
  bookmarkPost = async (req, res) => {
    try {
      const postId = req.params.id
      const authorId = req.id
      const post = await Post.findById(postId)
      if (!post) return res.status(404).json({ message: 'Post not found', success: false })

      const user = await User.findById(authorId)
      if (user.bookmarks.includes(post._id)) {
        // already bookmarked -> remove from the bookmark
        await user.updateOne({ $pull: { bookmarks: post._id } })
        await user.save()
        return res.status(200).json({ type: 'unsaved', message: 'Post removed from bookmark', success: true })
      } else {
        // bookmark krna pdega
        await user.updateOne({ $addToSet: { bookmarks: post._id } })
        await user.save()
        return res.status(200).json({ type: 'saved', message: 'Post bookmarked', success: true })
      }
    } catch (error) {
      console.log(error)
    }
  }
}
module.exports = new PostController()
