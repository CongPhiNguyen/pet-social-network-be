const Users = require("../models/userModel")
const bcrypt = require("bcrypt")
const { success } = require("concurrently/src/defaults")
const jwt = require("jsonwebtoken")
const speakeasy = require("speakeasy")
const jwt_decode = require("jwt-decode")

const authCtrl = {
  register: async (req, res) => {
    const { fullname, username, email, password, gender } = req.body
    let newUserName = username.toLowerCase().replace(/ /g, "")

    const user_name = await Users.findOne({ username: newUserName })
    if (user_name)
      return res.status(400).json({ msg: "This user name already exists." })

    const user_email = await Users.findOne({ email })
    if (user_email)
      return res.status(400).json({ msg: "This email already exists." })

    if (password.length < 6)
      return res
        .status(400)
        .json({ msg: "Password must be at least 6 characters." })

    const passwordHash = await bcrypt.hash(password, 12)

    const newUser = new Users({
      fullname,
      username: newUserName,
      email,
      password: passwordHash,
      gender
    })

    await newUser.save()

    res.status(200).json({
      msg: "Register Success!",
      user: {
        ...newUser._doc,
        password: ""
      }
    })
  },

  verifyEmail: async (req, res) => {
    res.status(200).send({ success: true })
  },

  login: async (req, res) => {
    try {
      const { pattern, password, token } = req.body
      const user = await Users.findOne({
        $or: [{ email: pattern }, { username: pattern }]
      }).populate(
        "followers following",
        "avatar username fullname followers following"
      )

      if (!user) {
        return res
          .status(400)
          .json({ msg: "This email or username does not exist." })
      }

      if (!user.isVerify) {
        return res
          .status(401)
          .json({
            msg: "Unverified account. Verify account to login",
            userId: user._id
          })
      }

      // Check if is verify email
      const isMatch = await bcrypt.compare(password, user.password)
      if (!isMatch)
        return res.status(400).json({ msg: "Password is incorrect." })
      if (user.otpEnabled) {
        const verified = speakeasy.totp.verify({
          secret: user?.otpInfo?.otp_base32,
          encoding: "base32",
          token: token
        })
        if (!verified) {
          return res.status(401).json({
            status: "fail",
            msg: "Token is not valid"
          })
        }
      }

      const access_token = createAccessToken({ id: user._id })
      const refresh_token = createRefreshToken({ id: user._id })

      // res.cookie("refreshtoken", refresh_token, {
      //   httpOnly: true,
      //   path: "/api/refresh_token",
      //   maxAge: 30 * 24 * 60 * 60 * 1000 // 30days
      // })

      res.json({
        msg: "Login Success!",
        access_token,
        refresh_token,
        user: {
          ...user._doc,
          password: ""
        }
      })
    } catch (err) {
      return res.status(500).json({ msg: err.message })
    }
  },

  logout: async (req, res) => {
    try {
      res.clearCookie("refreshtoken", { path: "/api/refresh_token" })
      return res.json({ msg: "Logged out!" })
    } catch (err) {
      return res.status(500).json({ msg: err.message })
    }
  },

  generateAccessToken: async (req, res) => {
    try {
      const rf_token = req.cookies.refreshtoken
      if (!rf_token) return res.status(400).json({ msg: "Please login now." })

      jwt.verify(
        rf_token,
        process.env.REFRESH_TOKEN_SECRET,
        async (err, result) => {
          if (err) return res.status(400).json({ msg: "Please login now." })

          const user = await Users.findById(result.id)
            .select("-password")
            .populate(
              "followers following",
              "avatar username fullname followers following"
            )

          if (!user)
            return res.status(400).json({ msg: "This does not exist." })

          const access_token = createAccessToken({ id: result.id })

          res.json({
            access_token,
            user
          })
        }
      )
    } catch (err) {
      return res.status(500).json({ msg: err.message })
    }
  },

  generateAccessTokenV2: async (req, res) => {
    try {
      const { refreshToken } = req.query
      if (!refreshToken) {
        return res
          .status(400)
          .json({ msg: "Please login now.", error: "Your token is missing" })
      }
      jwt.verify(
        refreshToken,
        process.env.REFRESH_TOKEN_SECRET,
        async (err, result) => {
          if (err) {
            console.log(err)
            return res.status(400).json({
              msg: "Please login now.",
              error: "Your token is not valid"
            })
          }
          const user = await Users.findById(result.id)
            .select("-password")
            .populate(
              "followers following",
              "avatar username fullname followers following"
            )

          if (!user)
            return res.status(400).json({ msg: "This use does not exist." })

          const access_token = createAccessToken({ id: result.id })

          res.json({
            access_token,
            user
          })
        }
      )
    } catch (err) {
      return res.status(500).json({ msg: err.message })
    }
  },
  generateOTP: async (req, res) => {
    const { userId, email } = req.body
    // TODO: userId not found
    const { ascii, hex, base32, otpauth_url } = speakeasy.generateSecret({
      issuer: userId,
      name: email,
      length: 15
    })

    const userUpdateOTP = await Users.findByIdAndUpdate(
      userId,
      {
        otpInfo: {
          otp_ascii: ascii,
          otp_auth_url: otpauth_url,
          otp_base32: base32,
          otp_hex: hex
        }
      },
      { new: true }
    ).lean()
    res.status(200).json({
      success: true,
      base32,
      otpauth_url
    })
  },
  verifyOTP: async (req, res) => {
    const { userId, token } = req.body
    const user = await Users.findById(userId)
    if (!user) {
      return res.status(401).json({
        status: "fail",
        message: "User is not exist"
      })
    }

    const verified = speakeasy.totp.verify({
      secret: user?.otpInfo?.otp_base32,
      encoding: "base32",
      token: token
    })

    if (!verified) {
      return res.status(401).json({
        status: "fail",
        message: "Token is not valid"
      })
    }

    const updatedUser = await Users.findByIdAndUpdate(
      userId,
      {
        $set: { "otpInfo.otpVerified": true },
        otpEnabled: true
      },
      { new: true }
    ).lean()

    res.status(200).json({
      success: true,
      otpVerified: true,
      user: updatedUser
    })
  },
  disable2Factor: async (req, res) => {
    const { userId } = req.body
    const updateUser = await Users.findByIdAndUpdate(
      userId,
      {
        otpEnabled: false
      },
      { new: true }
    ).lean()
    if (!updateUser) {
      res.status(404).send({ success: false, message: "UserId not found" })
    }
    res.status(200).send({ success: true, updateUser: updateUser })
  },
  forgotPassword: async (req, res) => {
    const { pattern, code } = req.body

    const userFind = await Users.findOne({
      $or: [{ username: pattern }, { email: pattern }]
    })
    if (!userFind) {
      res
        .status(400)
        .send({ success: false, message: "Username or email not found" })
      return
    }

    if (userFind.codeVerify !== code) {
      res
        .status(400)
        .send({ success: false, message: "Verify code is not valid" })
      return
    }
    // Check time:
    const timeCreateCode = userFind.timeSendCode
    const timeNow = Date.now()
    const timeDiff = (timeNow - timeCreateCode.getTime()) / 1000
    if (timeDiff > 120) {
      return res.status(400).send({ success: false, message: "Code expired!" })
    }

    return res.status(200).send({ success: true })
  },
  changePassword: async (req, res) => {
    console.log(req.body)
    const { pattern, password } = req.body
    // Find user
    const userFind = await Users.findOne({
      $or: [{ username: pattern }, { email: pattern }]
    })
    if (!userFind) {
      res
        .status(400)
        .send({ success: false, message: "Username or email not found" })
      return
    }
    // Update password
    const passwordHash = await bcrypt.hash(password, 12)
    await Users.findOneAndUpdate(
      {
        $or: [{ username: pattern }, { email: pattern }]
      },
      { password: passwordHash }
    )
    res.status(200).send({ success: true })
  },

  loginGoogle: async (req, res) => {
    try {
      const info = jwt_decode(req?.body?.token)
      const { email } = info

      // Check if info is defined
      if (!info) {
        return res
          .status(400)
          .send({ success: false, message: "Unexpected error" })
      }

      // Check if user exists
      const user = await Users.findOne({ email: email })
      if (!user) {
        const passwordHash = await bcrypt.hash("111111", 12)
        // Create a new user
        const userInfo = {
          fullname: [info?.family_name, info?.given_name].join(" "),
          username: info?.email.slice(0, 24),
          email: info?.email,
          password: passwordHash,
          avatar: info?.picture,
          role: "user",
          gender: "male",
          story: "",
          isVerify: true
        }
        const saveUser = await new Users(userInfo).save()
      }

      const userFullInfo = await Users.findOne({
        email: info?.email
      })
        .populate(
          "followers following",
          "avatar username fullname followers following"
        )
        .lean()

      const access_token = createAccessToken({ id: userFullInfo._id })
      const refresh_token = createRefreshToken({ id: userFullInfo._id })

      return res.status(200).send({
        msg: "Login Success!",
        access_token,
        refresh_token,
        user: {
          ...userFullInfo,
          password: ""
        }
      })
    } catch (err) {
      console.log(err.message)
      return res
        .status(500)
        .send({ success: false, message: "Internal server error" })
    }
  }
}

const createAccessToken = (payload) => {
  return jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "1d" })
}

const createRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "30d"
  })
}

module.exports = authCtrl
