const Campaign = require('../models/campaign.model')
const Donation = require('../models/donation.model')

class CampaignService {
  createCampaign = async (title, description, startDate, endDate, targetAmount, image, user) => {
    const campaign = await Campaign.create({ title, description, startDate, endDate, targetAmount, image, user })
    return campaign
  }
  getCurrentCampaign = async () => {
    const currentDate = new Date()
    const campaigns = await Campaign.find({
      startDate: { $lte: currentDate },
      endDate: { $gte: currentDate }
    })
    return campaigns
  }
  getCampaigns = async (query) => {
    const { sortBy, limit, page, q } = query
    const filter = {}
    const options = {
      sortBy: sortBy || 'createdAt',
      limit: limit ? parseInt(limit) : 10,
      page: page ? parseInt(page) : 1,
      allowSearchFields: ['title'],
      q: q ?? '',
      fields: '-password'
    }
    return await Campaign.paginate(filter, options)
  }

  stopCampaign = async (id) => {
    await Campaign.findByIdAndUpdate(id, { isActive: false })
  }

  getCampaignById = async (id) => {
    return await Campaign.findById(id).populate('user', 'username profilePicture firstName lastName')
  }

  getDonationsByCampaignId = async (id) => {
    return await Donation.find({ campaign: id }).populate('user', 'username profilePicture firstName lastName')
  }
}

module.exports = new CampaignService()
