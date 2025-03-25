const express = require('express')
const isAuthenticated = require('../middlewares/isAuthenticated.js')
const upload = require('../middlewares/multer.js')
const { createCampaign, currentCampaign, getCampaigns, stopCampaign, getCampaignById, getDonationsByCampaignId } = require('../controllers/campaign.controller.js')
const checkRole = require('../middlewares/checkRole.js')
const { ROLE } = require('../constants/enums.js')

const router = express.Router()

router.route('/current').get(currentCampaign)
router.route('/:id').get(getCampaignById)
router.route('/:id/donations').get(isAuthenticated, getDonationsByCampaignId)
router.route('/').get(isAuthenticated, checkRole([ROLE.MANAGER]), getCampaigns)
router.route('/').post(isAuthenticated, checkRole([ROLE.MANAGER]), upload.single('image'), createCampaign)
router.route('/:id').delete(isAuthenticated, checkRole([ROLE.MANAGER]), stopCampaign)

module.exports = router
