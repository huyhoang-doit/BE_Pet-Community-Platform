const bcrypt = require('bcryptjs')
const User = require('../models/user.model.js')
const { USER_MESSAGE } = require('../constants/messages.js')
const ErrorWithStatus = require('../utils/errorWithStatus.js')
const { StatusCodes } = require('http-status-codes')
const { generateToken, verifyToken } = require('../utils/jwt.js')
const { TokenType } = require('../constants/enums.js')

class AuthService {
  signAccessToken = async ({ user_id }) => {
    const payload = {
      userId: user_id,
      type: TokenType.AccessToken
    }
    return generateToken(payload, process.env.JWT_SECRET_ACCESS_TOKEN_KEY, parseInt(process.env.ACCESS_TOKEN_EXPIRES_IN) || '24h')
  }

  signRefreshToken = async ({ user_id }) => {
    const payload = {
      userId: user_id,
      type: TokenType.RefreshToken
    }
    return generateToken(payload, process.env.JWT_SECRET_REFRESH_TOKEN_KEY, parseInt(process.env.REFRESH_TOKEN_EXPIRES_IN) || '7d')
  }

  signEmailVerifyToken = async ({ user_id }) => {
    const payload = {
      userId: user_id,
      type: TokenType.EmailVerifyToken
    }
    return generateToken(payload, process.env.JWT_SECRET_EMAIL_VERIFY_TOKEN_KEY, parseInt(process.env.EMAIL_VERIFY_TOKEN_EXPIRES_IN) || '1h')
  }

  signForgotPasswordToken = async ({ user_id }) => {
    const payload = {
      userId: user_id,
      type: TokenType.ForgotPasswordToken
    }
    return generateToken(payload, process.env.JWT_SECRET_FORGOT_PASSWORD_TOKEN_KEY, parseInt(process.env.FORGOT_PASSWORD_TOKEN_EXPIRES_IN) || '1h')
  }

  signAccessAndRefreshToken = async ({ user_id }) => {
    const [access_token, refresh_token] = await Promise.all([
      this.signAccessToken({ user_id }),
      this.signRefreshToken({ user_id })
    ])
    return { access_token, refresh_token }
  }

  constructor() {
    this.user = User
  }
  register = async (user) => {
    const { username, email, password } = user
    const isUserExists = await this.user.findOne({ email })
    if (isUserExists) {
      throw new ErrorWithStatus({ status: StatusCodes.BAD_REQUEST, message: USER_MESSAGE.EMAIL_ALREADY_EXISTS })
    }

    const hashedPassword = await bcrypt.hash(password, 10)
    const newUser = await this.user.create({
      username,
      email,
      password: hashedPassword
    })

    const email_verify_token = await this.signEmailVerifyToken({
      user_id: newUser._id.toString()
    })

    const { access_token, refresh_token } = await this.signAccessAndRefreshToken({
      user_id: newUser._id.toString()
    })

    return {
      access_token,
      refresh_token,
      email_verify_token
    }
  }

  refreshToken = async (refreshToken) => {
    const decoded = await verifyToken(refreshToken, process.env.JWT_SECRET_REFRESH_TOKEN_KEY)
    const accessToken = await generateToken({ userId: decoded.userId }, process.env.JWT_SECRET_ACCESS_TOKEN_KEY, parseInt(process.env.ACCESS_TOKEN_EXPIRES_IN) || '24h')

    return accessToken
  }

  login = async ({ email, password }) => {
    const isUserExists = await this.user.findOne({ email }).select('-createdAt -updatedAt -__v -isBlocked')
    if (!isUserExists) {
      throw new ErrorWithStatus({ status: StatusCodes.BAD_REQUEST, message: USER_MESSAGE.USER_NOT_FOUND })
    }
    const isPasswordMatch = await bcrypt.compare(password, isUserExists.password)
    if (!isPasswordMatch) {
      throw new ErrorWithStatus({ status: StatusCodes.BAD_REQUEST, message: USER_MESSAGE.INCORRECT_EMAIL_OR_PASSWORD })
    }

    const { access_token, refresh_token } = await this.signAccessAndRefreshToken({
      user_id: isUserExists._id.toString()
    })

    const user = {
      _id: isUserExists._id,
      username: isUserExists.username,
      firstName: isUserExists.firstName,
      lastName: isUserExists.lastName,
      email: isUserExists.email,
      profilePicture: isUserExists.profilePicture,
      bio: isUserExists.bio,
      followers: isUserExists.followers,
      following: isUserExists.following,
      bookmarks: isUserExists.bookmarks,
      isVerified: isUserExists.isVerified,
      isActive: isUserExists.isActive,
      gender: isUserExists.gender,
      role: isUserExists.role
    }

    return {
      access_token,
      refresh_token,
      user
    }
  }

  logout = async () => {
    return { message: 'Logged out successfully.' }
  }
}

const authService = new AuthService()
module.exports = authService
