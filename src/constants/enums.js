const GENDER = {
  MALE: 'male',
  FEMALE: 'female'
}

const NOTIFICAITON_TYPE = {
  FOLLOW: 'follow',
  LIKE: 'like',
  COMMENT: 'comment',
  APPROVE: 'approve',
  FORM_STATUS_UPDATE: 'form_status_update',
  CHECK_REQUEST: 'check request'
}

const ROLE = {
  USER: 'user',
  ADMIN: 'admin',
  SERVICE_STAFF: 'services_staff',
  FORUM_STAFF: 'forum_staff'
}

const TokenType = {
  AccessToken: 'access_token',
  RefreshToken: 'refresh_token',
  EmailVerifyToken: 'email_verify_token',
  ForgotPasswordToken: 'forgot_password_token'
}

const TRANSACTION_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
}
const ADOPTION_POST_STATUS = {
  PENDING: 'Pending',
  AVAILABLE: 'Available',
  ADOPTED: 'Adopted'
}

module.exports = { GENDER, NOTIFICAITON_TYPE, ADOPTION_POST_STATUS, ROLE, TokenType, TRANSACTION_STATUS }
