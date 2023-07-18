const mongoose = require("mongoose")

const chatSchema = new mongoose.Schema(
  {
    userId: String,
    session: String,
    message: Array,
    bot: String,
    lastGreetTime: Date
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model("chat", chatSchema)
