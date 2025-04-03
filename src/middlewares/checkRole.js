const checkRole = (roles) => {
  return (req, res, next) => {

    if (!roles.includes(req.role)) {
      return res.status(StatusCodes.FORBIDDEN).json({ message: 'Forbidden: Access denied' })
    }
    next()
  }
}

module.exports = checkRole
