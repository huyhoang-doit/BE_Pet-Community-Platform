const express = require('express')
const isAuthenticated = require('../middlewares/isAuthenticated.js')
const adminController = require('../controllers/admin.controller.js')
const checkRole = require('../middlewares/checkRole.js')
const { ROLE } = require('../constants/enums.js')
const router = express.Router()

router.get('/stats', isAuthenticated, checkRole([ROLE.ADMIN, ROLE.MANAGER]), adminController.getStats)
router.get('/staff', isAuthenticated, checkRole(ROLE.ADMIN), adminController.getAllStaffs)
router.post('/staff', isAuthenticated, checkRole(ROLE.ADMIN), adminController.createStaffAccount)
module.exports = router
