const mongoose = require("mongoose")

function isObjectId(str) {
  try {
    return mongoose.Types.ObjectId.isValid(str)
  } catch (e) {
    return false
  }
}

module.exports = {
  isObjectId
}
