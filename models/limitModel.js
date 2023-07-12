const mongoose = require("mongoose")

const limitSchema = new mongoose.Schema(
  {
    limit: []
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model("limit", limitSchema)
