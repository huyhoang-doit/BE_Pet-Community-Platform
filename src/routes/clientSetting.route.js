const express = require('express')
const router = express.Router()
const isAuthenticated = require('../middlewares/isAuthenticated')
const checkRole = require('../middlewares/checkRole')
const { ROLE } = require('../constants/enums')
const {
  getClientSetting,
  updateClientSetting,
  createClientSetting
} = require('../controllers/clientSetting.controller')
const upload = require('../middlewares/multer')

router.route('/').get(getClientSetting)
router.route('/').post(isAuthenticated, checkRole(ROLE.ADMIN), upload.single('image'), createClientSetting)
router.route('/:id').put(isAuthenticated, checkRole(ROLE.ADMIN), upload.single('image'), updateClientSetting)

module.exports = router
