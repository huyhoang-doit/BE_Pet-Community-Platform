const catchAsync = require('../utils/catchAsync')
const { OK, CREATED } = require('../configs/response.config')
const { CAMPAIGN_MESSAGE } = require('../constants/messages')
const campaignService = require('../services/campaign.service')
const cloudinaryService = require('../utils/cloudinary.js')

class CampaignController {
  createCampaign = catchAsync(async (req, res) => {
    const user = req.id
    const { title, description, startDate, endDate, targetAmount } = req.body
    
    let image
    const file = req.file

    if (!file) {
      return res.status(400).json({ message: 'Image is required' })
    }

    image = await cloudinaryService.uploadImage(file.buffer)

    const campaign = await campaignService.createCampaign(
      title,
      description,
      startDate,
      endDate,
      targetAmount,
      image,
      user
    )
    return CREATED(res, CAMPAIGN_MESSAGE.CAMPAIGN_CREATED_SUCCESSFULLY, campaign)
  })
  currentCampaign = catchAsync(async (req, res) => {
    const campaign = await campaignService.getCurrentCampaign()
    return OK(res, CAMPAIGN_MESSAGE.GET_CURRENT_CAMPAIGN_SUCCESSFULLY, campaign)
  })

  getCampagins = catchAsync(async (req, res) => {
    const campaigns = await campaignService.getCampaigns(req.query)
    return OK(res, CAMPAIGN_MESSAGE.GET_CAMPAIGNS_SUCCESSFULLY, campaigns)
  })

  stopCampaign = catchAsync(async (req, res) => {
    const { id } = req.params
    await campaignService.stopCampaign(id)
    return OK(res, CAMPAIGN_MESSAGE.CAMPAIGN_DELETED_SUCCESSFULLY)
  })

  getCampaignById = catchAsync(async (req, res) => {
    const { id } = req.params
    const campaign = await campaignService.getCampaignById(id)
    return OK(res, CAMPAIGN_MESSAGE.GET_CAMPAIGN_BY_ID_SUCCESSFULLY, campaign)
  })

  getDonationsByCampaignId = catchAsync(async (req, res) => {
    const { id } = req.params
    const donations = await campaignService.getDonationsByCampaignId(id)
    return OK(res, CAMPAIGN_MESSAGE.GET_DONATIONS_BY_CAMPAIGN_ID_SUCCESSFULLY, donations)
  })
}

module.exports = new CampaignController()
