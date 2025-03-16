const ClientSetting = require('../models/clientSetting.model')
const cloudinaryService = require('../utils/cloudinary.js')

class ClientSettingController {
  getClientSetting = async (req, res) => {
    const clientSetting = await ClientSetting.find()
    res.status(200).json(clientSetting)
  }

  updateClientSetting = async (req, res) => {
    const { name, description } = req.body
    let value = req.body.value

    const file = req.file

    console.log(file)
    if (file) {
      value = await cloudinaryService.uploadImage(file.buffer)
    }
    const clientSetting = await ClientSetting.findOneAndUpdate({ name }, { value, description }, { new: true })
    res.status(200).json(clientSetting)
  }

  createClientSetting = async (req, res) => {
    const { name, description } = req.body
    let value = req.body.value

    const file = req.file

    if (file) {
      value = await cloudinaryService.uploadImage(file.buffer)
    }
    const clientSetting = await ClientSetting.create({ name, value, description })
    res.status(201).json(clientSetting)
  }
}

module.exports = new ClientSettingController()
