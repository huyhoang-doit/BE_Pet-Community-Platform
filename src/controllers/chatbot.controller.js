const { OK } = require("../configs/response.config")
const catchAsync = require("../utils/catchAsync")
const { chatbot } = require("../utils/gemini")

class ChatbotController {
  chatbot = catchAsync(async (req, res) => {
    const { breedName } = req.body
    const result = await chatbot(breedName)
    return OK(res, 'Chatbot response', result)
  })
}

module.exports = new ChatbotController()
