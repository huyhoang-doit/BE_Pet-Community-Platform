const catchAsync = require('../utils/catchAsync.js')
const { CREATED, OK } = require('../configs/response.config.js')
const { ADOPTION_POST_MESSAGE, ADOPTION_FORM_MESSAGE } = require('../constants/messages.js')
const adoptPostService = require('../services/adoptionPost.service.js')
const User = require('../models/user.model.js')
const AdoptionForm = require('../models/adoptionForm.model.js')
const AdoptionPost = require('../models/adoptionPost.model.js')
const Notification = require('../models/notification.model.js')
const { NOTIFICAITON_TYPE } = require('../constants/enums.js')
const { getReceiverSocketId, io } = require('../socket/socket.js')
const UserBehavior = require('../models/userBehavior.model.js')

class AdoptionPostController {
  getAllPost = catchAsync(async (req, res) => {
    const posts = await adoptPostService.getAdoptionPosts(req.query)
    return OK(res, ADOPTION_POST_MESSAGE.FETCH_ALL_SUCCESS, posts)
  })

  addNewPost = catchAsync(async (req, res) => {
    const adoptionPost = await adoptPostService.createAdoptionPost(req, res)
    return CREATED(res, ADOPTION_POST_MESSAGE.CREATED_SUCCESS, adoptionPost)
  })

  updatePost = catchAsync(async (req, res) => {
    const updatedPost = await adoptPostService.updateAdoptionPost(req, res)
    return OK(res, ADOPTION_POST_MESSAGE.UPDATED_SUCCESS, updatedPost)
  })

  getPostByBreed = catchAsync(async (req, res) => {
    const post = await adoptPostService.getPostByBreed(req.params.breedId, req.query)
    return OK(res, ADOPTION_POST_MESSAGE.FETCH_SUCCESS, post)
  })

  updateAdoptionFormStatus = async (req, res) => {
    const { formId } = req.params
    const { status } = req.body
    console.log(formId, status)

    if (!['Pending', 'Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      })
    }

    const updatedForm = await AdoptionForm.findByIdAndUpdate(formId, { status }, { new: true }).populate(
      'adopter pet adoptionPost user'
    )
    console.log(updatedForm)

    if (!updatedForm) {
      return res.status(404).json({
        success: false,
        message: 'Adoption form not found'
      })
    }
    return OK(res, ADOPTION_FORM_MESSAGE.UPDATED_SUCCESS, updatedForm)
  }

  likePost = async (req, res) => {
    try {
      const likeKrneWalaUserKiId = req.id
      const postId = req.params.id
      const post = await AdoptionPost.findById(postId)
      if (!post) return res.status(404).json({ message: 'Post not found', success: false })

      await post.updateOne({ $addToSet: { likes: likeKrneWalaUserKiId } })
      await post.save()

      const alreadyLiked = await UserBehavior.findOne({ userId: likeKrneWalaUserKiId, postId, action: "like" });

      if (alreadyLiked) {
        return res.status(400).json({ message: 'Post already liked', success: false });
      }

      await UserBehavior.create({ userId: likeKrneWalaUserKiId, postId, action: "like" });

      const user = await User.findById(likeKrneWalaUserKiId).select('username profilePicture')

      const postOwnerId = post.author.toString()
      if (postOwnerId !== likeKrneWalaUserKiId) {
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

      return OK(res, ADOPTION_POST_MESSAGE.LIKED_SUCCESS)
    } catch (error) {
      console.log(error)
    }
  }
  dislikePost = async (req, res) => {
    try {
      const likeKrneWalaUserKiId = req.id
      const postId = req.params.id
      const post = await AdoptionPost.findById(postId)
      if (!post) return res.status(404).json({ message: 'Post not found', success: false })

      await post.updateOne({ $pull: { likes: likeKrneWalaUserKiId } })
      await post.save()

      const user = await User.findById(likeKrneWalaUserKiId).select('username profilePicture')
      const postOwnerId = post.author.toString()
      if (postOwnerId !== likeKrneWalaUserKiId) {
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

  sharePost = async (req, res) => {
    try {
      const { postId, platform } = req.body;
      const userId = req.id;

      const alreadyShared = await UserBehavior.findOne({
        userId,
        postId,
        action: "share",
      });
  
      if (alreadyShared) {
        return ;
      }
  
      await UserBehavior.create({ userId, postId, action: "share" });
  
      return OK(res, ADOPTION_POST_MESSAGE.SHARED_SUCCESS);
    } catch (error) {
      console.log(error);
      res.status(500).json({ message: "Internal server error", success: false });
    }
  };

  getDeatilPost = async (req, res) => {
    const postId = req.params.id
    const post = await AdoptionPost.findById(postId)
      .populate('author')
      .populate('pet')
      return OK(res, ADOPTION_POST_MESSAGE.FETCH_SUCCESS, post)
  }

  getUserBehavior = async (req, res) => {
    try {
      const userId = req.id;
      if (!userId) {
        return res.status(400).json({ message: "User ID is required", success: false });
      }
  
      const userBehavior = await UserBehavior.find({ userId })
        .populate({
          path: "postId",
          populate: {
            path: "pet",
          },
        });
  
      return OK(res, ADOPTION_POST_MESSAGE.FETCH_SUCCESS, userBehavior);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: "Internal server error", success: false });
    }
  };
  
}
module.exports = new AdoptionPostController()
