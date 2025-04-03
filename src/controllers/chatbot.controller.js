const { OK } = require('../configs/response.config')
const catchAsync = require('../utils/catchAsync')
const { chatbot, recommendBreeds } = require('../utils/gemini')

class ChatbotController {
  chatbot = catchAsync(async (req, res) => {
    const { breedName } = req.body
    const result = await chatbot(breedName)
    return OK(res, 'Chatbot response', result)
  })

  recommendBreeds = catchAsync(async (req, res) => {
    const { userPreferences, breedList } = req.body

    if (!userPreferences || !breedList || !Array.isArray(breedList)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request data',
        data: null
      })
    }

    const result = await recommendBreeds(userPreferences, breedList)

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error,
        data: result.data
      })
    }

    return OK(res, 'Breed recommendations', result.data)
  })
}

module.exports = new ChatbotController()
