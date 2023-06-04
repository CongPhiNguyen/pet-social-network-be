const crypto = require("crypto")
const renderCode = (length) => {
  const randomBytes = crypto.randomBytes(length)
  const randomString = randomBytes.toString("base64").slice(0, length)
  return randomString
}
module.exports = renderCode
