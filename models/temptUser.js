const mongoose = require("mongoose")

const temptUserSchema = new mongoose.Schema(
  {
    fullname: {
      type: String,
      required: true,
      trim: true,
      maxlength: 25
    },
    username: {
      type: String,
      required: true,
      trim: true,
      maxlength: 25,
      unique: true
    },
    email: {
      type: String,
      required: true,
      trim: true,
      unique: true
    },
    password: {
      type: String,
      required: true
    },
    gender: { type: String, default: "male" }
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model("temptUser", temptUserSchema)
