const catchAsync = require('../utils/catchAsync.js')
const { CREATED, OK } = require('../configs/response.config.js')
const { ADOPTION_POST_MESSAGE, ADOPTION_FORM_MESSAGE } = require('../constants/messages.js')
const adoptPostService = require('../services/adoptionPost.service.js')
const User = require('../models/user.model.js')
const AdoptionForm = require('../models/adoptionForm.model.js')
const AdoptionPost = require('../models/adoptionPost.model.js')

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

}
module.exports = new AdoptionPostController()
