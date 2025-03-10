const express = require('express')
const isAuthenticated = require('../middlewares/isAuthenticated.js')
const upload = require('../middlewares/multer.js')
const { createCampaign, currentCampaign, getCampagins, stopCampaign, getCampaignById, getDonationsByCampaignId } = require('../controllers/campaign.controller.js')
const checkRole = require('../middlewares/checkRole.js')
const { ROLE } = require('../constants/enums.js')

const router = express.Router()

router.route('/').post(isAuthenticated, checkRole(ROLE.ADMIN), upload.single('image'), createCampaign)
router.route('/current').get(isAuthenticated, currentCampaign)
router.route('/').get(isAuthenticated, checkRole(ROLE.ADMIN), getCampagins)
router.route('/:id').delete(isAuthenticated, checkRole(ROLE.ADMIN), stopCampaign)
router.route('/:id').get(isAuthenticated, getCampaignById)
router.route('/:id/donations').get(isAuthenticated, getDonationsByCampaignId)

module.exports = router
