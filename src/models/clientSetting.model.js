const mongoose = require('mongoose')

const clientSettingSchema = new mongoose.Schema({
  name: { type: String, required: true },
  value: { type: String, required: true },
  description: { type: String, required: true },
}, { timestamps: true })

const ClientSetting = mongoose.model('ClientSetting', clientSettingSchema)

module.exports = ClientSetting
