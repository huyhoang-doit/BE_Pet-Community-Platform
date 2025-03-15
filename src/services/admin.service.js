const User = require('../models/user.model') // Assuming you have a User model
const Donation = require('../models/donation.model') // Assuming you have a Donation model
const { ROLE } = require('../constants/enums')
class AdminService {
  getStats = async () => {
    try {
      const user = await User.countDocuments()

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

      return { user, donations }
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
      allowSearchFields: ['username'],
      q: q ?? '',
      fields: '-password'
    }

    try {
      const staffs = await User.find(filter)
        .select(options.fields) // Exclude password
        .sort({ [options.sortBy]: -1 }) // Sort in descending order
        .skip((options.page - 1) * options.limit)
        .limit(options.limit)

      return staffs // Ensure the function returns data
    } catch (error) {
      console.error('Error in getAllStaffs:', error)
      throw new Error('Failed to fetch staffs')
    }
  }
}

module.exports = new AdminService()
