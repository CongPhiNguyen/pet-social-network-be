const nodemailer = require("nodemailer")

var transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "phiroudnodemailer@gmail.com",
    pass: "yrrtytdsnrsyyrhc"
  }
})

const sendMailNode = async (subject, content, receiver) => {
  var mailOptions = {
    from: "phiroudnodemailer@gmail.com",
    to: receiver,
    subject: subject,
    text: content
  }
  const res = await transporter.sendMail(mailOptions)
  return res
}

module.exports = sendMailNode
