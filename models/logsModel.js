const mongoose = require("mongoose")

const logSchema = new mongoose.Schema(
  {
    method: String,
    url: String,
    status: Number,
    contentLength: Number,
    responseTime: Number,
    message: String
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model("logs", logSchema)
