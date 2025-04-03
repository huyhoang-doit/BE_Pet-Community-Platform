const { StatusCodes } = require('http-status-codes')
const catchAsync = require('../utils/catchAsync')
const authService = require('../services/auth.service')
const { OK, CREATED } = require('../configs/response.config')
const { USER_MESSAGE, COMMON_MESSAGE } = require('../constants/messages')
const ErrorWithStatus = require('../utils/errorWithStatus')

class AuthController {
  register = catchAsync(async (req, res) => {
    const { username, email, password } = req.body
    if (!username || !email || !password) {
      throw new ErrorWithStatus({ status: StatusCodes.BAD_REQUEST, message: COMMON_MESSAGE.SOMETHING_IS_MISSING })
    }
    const result = await authService.register(req.body)
    return CREATED(res, USER_MESSAGE.USER_CREATED_SUCCESSFULLY, result)
  })

  login = catchAsync(async (req, res) => {
    const { email, password } = req.body
    if (!email || !password) {
      throw new ErrorWithStatus({ status: StatusCodes.BAD_REQUEST, message: COMMON_MESSAGE.SOMETHING_IS_MISSING })
    }
    const result = await authService.login(req.body)
    return OK(res, USER_MESSAGE.USER_LOGIN_SUCCESSFULLY, result)
  })

  logout = catchAsync(async (req, res) => {
    return OK(res, USER_MESSAGE.USER_LOGOUT_SUCCESSFULLY)
  })

  refreshToken = catchAsync(async (req, res) => {
    const refreshToken = req.body.refresh_token
    const access_token = await authService.refreshToken(refreshToken)
    return OK(res, USER_MESSAGE.USER_LOGIN_SUCCESSFULLY, access_token)
  })
}

module.exports = new AuthController()
