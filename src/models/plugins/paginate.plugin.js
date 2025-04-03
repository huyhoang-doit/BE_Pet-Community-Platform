const toRegex = require('../../utils/toRegex')

const paginate = (schema) => {
  schema.statics.paginate = async function (filter, options) {
    let sort = ''
    if (options?.sortBy) {
      const sortingCriteria = []
      options.sortBy.split(',').forEach((sortOption) => {
        const [key, order] = sortOption.split(':')
        if (!order) sortingCriteria.push(key)
        sortingCriteria.push((order === 'desc' ? '-' : '') + key)
      })
      sort = sortingCriteria.join(' ')
    } else {
      sort = 'createdAt'
    }

    const limit = options.limit && parseInt(options.limit, 10) > 0 ? parseInt(options.limit, 10) : 10
    const page = options.page && parseInt(options.page, 10) > 0 ? parseInt(options.page, 10) : 1
    const skip = (page - 1) * limit

    let queryStr = JSON.stringify({ ...filter })
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`)
    let search = []

    if (options?.allowSearchFields?.length) {
      search = options.allowSearchFields.map((f) => {
        return { [f]: { $regex: toRegex(options.q), $options: 'i' } }
      })
    }

    const queryFilter = { $or: [...search], ...JSON.parse(queryStr) }

    const countPromise = this.countDocuments(queryFilter).exec()
    let docsPromise = this.find(queryFilter).sort(sort).skip(skip).limit(limit).select(options.fields)

    if (options.populate) {
      if (Array.isArray(options.populate)) {
        options.populate.forEach((pop) => {
          docsPromise = docsPromise.populate(pop)
        })
      } else {
        options.populate.split(',').forEach((populateOption) => {
          docsPromise = docsPromise.populate(
            populateOption
              .split('.')
              .reverse()
              .reduce((a, b) => ({ path: b, populate: a }))
          )
        })
      }
    }

    docsPromise = docsPromise.exec()

    return Promise.all([countPromise, docsPromise]).then((values) => {
      const [totalResults, results] = values
      const totalPages = Math.ceil(totalResults / limit)
      const result = {
        page,
        limit,
        totalPages,
        totalResults,
        results
      }
      return Promise.resolve(result)
    })
  }
}

module.exports = paginate
