const { OK } = require('../configs/response.config')
const { ADMIN_MESSAGE } = require('../constants/messages')
const adminService = require('../services/admin.service')
const { StatusCodes } = require('http-status-codes')

class adminController {
  getStats = async (req, res) => {
    const stats = await adminService.getStats(req)
    return OK(res, ADMIN_MESSAGE.GET_STATS_SUCCESSFULLY, stats)
  }

  getAllStaffs = async (req, res) => {
    const staffs = await adminService.getAllStaffs(req.query, req.id)
    return OK(res, ADMIN_MESSAGE.GET_ALL_STAFFS_SUCCESSFULLY, staffs)
  }

  createStaffAccount = async (req, res) => {
    const staff = await adminService.createStaffAccount(req.body)
    return OK(res, ADMIN_MESSAGE.CREATE_STAFF_ACCOUNT_SUCCESSFULLY, staff)
  }
}

module.exports = new adminController()
