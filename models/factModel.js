const mongoose = require("mongoose")

const factSchema = new mongoose.Schema(
  {
    facts: { type: String }
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model("facts", factSchema)
