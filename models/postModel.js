const mongoose = require("mongoose")

const postSchema = new mongoose.Schema(
  {
    content: String,
    images: {
      type: Array,
      required: true
    },
    location: {
      type: String,
      default: "Viet Nam"
    },
    likes: [{ type: mongoose.Types.ObjectId, ref: "user" }],
    comments: [{ type: mongoose.Types.ObjectId, ref: "comment" }],
    user: { type: mongoose.Types.ObjectId, ref: "user" }
  },
  {
    timestamps: true
  }
)

module.exports = mongoose.model("post", postSchema)
