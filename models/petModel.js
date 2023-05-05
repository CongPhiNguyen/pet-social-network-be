const mongoose = require("mongoose")

const petSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 25
    },
    image: {
      type: String
    },
    description: {
      type: String,
      required: true,
      trim: true,
      unique: true
    },
    dateOfBirth: {
      type: String,
      required: true
    },
    weight: {
      type: Number,
      required: true
    }
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model("pet", petSchema)
