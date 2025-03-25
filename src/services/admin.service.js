const User = require('../models/user.model') // Assuming you have a User model
const Donation = require('../models/donation.model') // Assuming you have a Donation model
const { ROLE } = require('../constants/enums')

class AdminService {
  getStats = async (req) => {
    try {
      if (req.role === ROLE.ADMIN) {
        const user = await User.countDocuments({ role: { $in: [ROLE.USER] } })
        const numberForumStaff = await User.countDocuments({ role: { $in: [ROLE.FORUM_STAFF] } })
        const numberServiceStaff = await User.countDocuments({ role: { $in: [ROLE.SERVICE_STAFF] } })
        return { user, numberForumStaff, numberServiceStaff }
      } else if (req.role === ROLE.MANAGER) {
        const donationAggregation = await Donation.aggregate([
          {
            $match: { status: 'completed' }
          },
          {
            $group: {
              _id: { $month: '$createdAt' }, // Group by month
              total: { $sum: '$amount' } // Sum donations
            }
          },
          { $sort: { _id: 1 } } // Sort by month
        ])

        // Ensure all months (1-12) are represented
        const donations = Array.from({ length: 12 }, (_, index) => {
          const monthData = donationAggregation.find((d) => d._id === index + 1)
          return {
            month: new Date(2000, index, 1).toLocaleString('en-US', { month: 'long' }), // Convert to month name
            total: monthData ? monthData.total : 0
          }
        })
        return { donations }
      }
    } catch (error) {
      console.error('Error in getStats:', error)
      throw new Error('Failed to fetch admin stats')
    }
  }

  getAllStaffs = async (query, userId) => {
    const { q, page, limit, sortBy } = query

    const filter = {
      isActive: true,
      _id: { $ne: userId },
      role: { $in: [ROLE.SERVICE_STAFF, ROLE.FORUM_STAFF] } // Proper role filtering
    }

    const options = {
      limit: limit ? parseInt(limit) : 5,
      page: page ? parseInt(page) : 1,
      sortBy: sortBy || 'createdAt',
      allowSearchFields: ['username ', 'email'],
      q: q ?? '',
      fields: '-password'
    }

    try {
      const staffs = await User.paginate(filter, options)

      return staffs // Ensure the function returns data
    } catch (error) {
      console.error('Error in getAllStaffs:', error)
      throw new Error('Failed to fetch staffs')
    }
  }

  createStaffAccount = async (data) => {
    try {
      const { firstName, lastName, email, username, password, role } = data
      if (!firstName || !lastName || !email || !username || !password || !role) {
        throw new Error('Missing required fields')
      }
      const hashedPassword = await User.hashPassword(password)
      data.password = hashedPassword
      const staff = await User.create(data)
      return staff
    } catch (error) {
      console.error('Error in createStaffAccount:', error)
      throw new Error('Failed to create staff account')
    }
  }
}

module.exports = new AdminService()
