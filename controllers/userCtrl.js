const renderCode = require("../helpers/renderCode")
const sendMailNode = require("../helpers/sendMail")
const { isObjectId } = require("../helpers/stringValidation")
const Users = require("../models/userModel")
const Posts = require("../models/postModel")
const { getRecByUserIdHandling } = require("../helpers/rec_sys")

const userCtrl = {
  searchInPage: async (req, res) => {
    try {
      const { search } = req.query

      const [users, posts] = await Promise.all([
        Users.find({
          username: { $regex: search }
        })
          .limit(10)
          .select("fullname username avatar"),
        Posts.find({
          content: { $regex: search }
        })
          .sort("-createdAt")
          .populate("user likes", "avatar username fullname followers")
          .populate({
            path: "comments",
            populate: {
              path: "user likes",
              select: "-password"
            }
          })
          .limit(10)
      ])

      res.json({ users, posts })
    } catch (err) {
      return res.status(500).json({ msg: err.message })
    }
  },

  searchUser: async (req, res) => {
    try {
      const users = await Users.find({
        username: { $regex: req.query.username }
      })
        .limit(10)
        .select("fullname username avatar")

      res.json({ users })
    } catch (err) {
      return res.status(500).json({ msg: err.message })
    }
  },
  getUser: async (req, res) => {
    try {
      if (!isObjectId(req.params.id)) {
        return res.status(400).json({ msg: "UserId is not valid" })
      }
      const user = await Users.findById(req.params.id)
        .select("-password")
        .populate("followers following", "-password")
      if (!user) return res.status(400).json({ msg: "User does not exist." })

      res.json({ user })
    } catch (err) {
      return res.status(500).json({ msg: err.message })
    }
  },

  getUserWithEmail: async (req, res) => {
    const { pattern } = req.query
    const userEmail = await Users.findOne({
      $or: [{ email: pattern }, { username: pattern }]
    })
    res.status(200).send({ success: true, user: userEmail })
  },

  getEmailWithId: async (req, res) => {
    const id = req?.params?.id
    if (!isObjectId(id)) {
      return res.status(400).json({ msg: "UserId is not valid" })
    }
    const user = await Users.findById(id)
    if (!user) {
      return res.status(400).send({ success: false })
    }
    return res.status(200).send({ success: true, email: user.email })
  },

  sendEmailVerifyByPattern: async (req, res) => {
    const { pattern } = req.params
    const userFind = await Users.findOne({
      $or: [{ username: pattern }, { email: pattern }]
    })
    if (!userFind) {
      res
        .status(400)
        .send({ success: false, message: "Username or email not found" })
      return
    }
    // Update code in user
    // const code = renderCode(6)
    const code = "123456"
    const currentTime = Date.now()

    await Users.findOneAndUpdate(
      { $or: [{ username: pattern }, { email: pattern }] },
      {
        codeVerify: code,
        timeSendCode: currentTime
      }
    )

    // const email = userFind.email
    // await sendMailNode(
    //   "PET LOVE CODE VERIFICATION",
    //   `Your verfication code of Petlove is: ${code}`,
    //   email
    // )

    return res.status(200).send({ success: true })
  },

  sendEmailVerify: async (req, res) => {
    const { id } = req.params
    // Check existed user
    if (!isObjectId(id)) {
      return res.status(400).json({ msg: "UserId is not valid" })
    }
    const userInfo = await Users.findById(id)
    if (!userInfo) {
      return res.status(400).json({ msg: "UserId is not found" })
    }

    // Update code in user
    // const code = renderCode(6)
    const code = "123456"
    const currentTime = Date.now()

    await Users.findByIdAndUpdate(id, {
      codeVerify: code,
      timeSendCode: currentTime
    })

    // const email = userInfo.email
    // await sendMailNode(
    //   "PET LOVE CODE VERIFICATION",
    //   `Your verfication code of Petlove is: ${code}`,
    //   email
    // )

    return res.status(200).send({ success: true })
  },

  verifyEmail: async (req, res) => {
    const { email, code } = req.body
    const userVerify = await Users.findOne({
      email: email,
      codeVerify: code
    })

    if (!userVerify) {
      return res
        .status(400)
        .send({ success: false, message: "Verification code not valid" })
    }

    // Check time:
    const timeCreateCode = userVerify.timeSendCode
    const timeNow = Date.now()
    const timeDiff = (timeNow - timeCreateCode.getTime()) / 1000
    if (timeDiff > 120) {
      return res.status(400).send({ success: false, message: "Code expired!" })
    }

    const findUserUpdate = await Users.findOneAndUpdate(
      {
        email: email,
        codeVerify: code
      },
      { isVerify: true },
      { new: true }
    )
    if (!findUserUpdate) {
      return res
        .status(400)
        .send({ success: false, message: "Error when updating verify status" })
    } else {
      return res.status(200).send({ success: true })
    }
  },

  follow: async (req, res) => {
    try {
      const user = await Users.find({
        _id: req.params.id,
        followers: req.user._id
      })
      if (user.length > 0)
        return res.status(500).json({ msg: "You followed this user." })

      const newUser = await Users.findOneAndUpdate(
        { _id: req.params.id },
        {
          $push: { followers: req.user._id }
        },
        { new: true }
      ).populate("followers following", "-password")

      await Users.findOneAndUpdate(
        { _id: req.user._id },
        {
          $push: { following: req.params.id }
        },
        { new: true }
      )

      res.json({ newUser })
    } catch (err) {
      return res.status(500).json({ msg: err.message })
    }
  },
  unfollow: async (req, res) => {
    try {
      const newUser = await Users.findOneAndUpdate(
        { _id: req.params.id },
        {
          $pull: { followers: req.user._id }
        },
        { new: true }
      ).populate("followers following", "-password")

      await Users.findOneAndUpdate(
        { _id: req.user._id },
        {
          $pull: { following: req.params.id }
        },
        { new: true }
      )

      res.json({ newUser })
    } catch (err) {
      return res.status(500).json({ msg: err.message })
    }
  },
  suggestionsUser: async (req, res) => {
    try {
      const newArr = [...req.user.following, req.user._id]

      const num = req.query.num || 10

      const users = await Users.aggregate([
        { $match: { _id: { $nin: newArr } } },
        { $sample: { size: Number(num) } },
        {
          $lookup: {
            from: "users",
            localField: "followers",
            foreignField: "_id",
            as: "followers"
          }
        },
        {
          $lookup: {
            from: "users",
            localField: "following",
            foreignField: "_id",
            as: "following"
          }
        }
      ]).project("-password")

      return res.json({
        users,
        result: users.length
      })
    } catch (err) {
      return res.status(500).json({ msg: err.message })
    }
  },
  getAllUser: async (req, res) => {
    const { id, username, role } = req.query
    const objectSearch = {}
    if (id && id !== "undefined") objectSearch["idString"] = new RegExp(id)
    if (username && username !== "undefined")
      objectSearch["username"] = new RegExp(username)
    if (role && role !== "undefined") objectSearch["role"] = new RegExp(role)

    const users = await Users.aggregate([
      {
        $addFields: {
          idString: { $toString: "$_id" }
        }
      },
      {
        $match: {
          ...objectSearch
        }
      }
    ])
    res.status(200).send(users)
  },

  changeRole: async (req, res) => {
    const { id, role } = req.body
    const user = await Users.findByIdAndUpdate(id, { role })
    res.status(200).send(user)
  },

  getAllFollower: async (req, res) => {
    const { id } = req.params
    if (!isObjectId(id)) {
      return res.status(400).json({ msg: "UserId is not valid" })
    }
    const user = await Users.findById(id)
    if (!user) {
      res.status(200).send({ success: true, followers: [] })
    }
    const followerIdList = user.followers
    const userList = await Users.find({ _id: { $in: followerIdList } })
    res.status(200).send({ success: true, followers: userList })
  },

  getAllFollowing: async (req, res) => {
    const { id } = req.params
    if (!isObjectId(id)) {
      return res.status(400).json({ msg: "UserId is not valid" })
    }
    const user = await Users.findById(id)
    if (!user) {
      res.status(200).send({ success: true, following: [] })
    }
    const followingIdList = user.following
    const userList = await Users.find({ _id: { $in: followingIdList } })
    res.status(200).send({ success: true, following: userList })
  },

  getUserInfo: async (req, res) => {
    if (!isObjectId(req.params.id)) {
      return res.status(400).json({ message: "UserId is not valid" })
    }
    try {
      const user = await Users.findById(req.params.id).select("-password")
      if (!user) return res.status(404).json({ msg: "User does not exist." })
      res.json({ user })
    } catch (err) {
      return res.status(500).json({ msg: err.message })
    }
  },
  updateUserInfo: async (req, res) => {
    const { id } = req.params
    const data = req.body
    if (!isObjectId(id)) {
      return res.status(400).json({ msg: "UserId is not valid" })
    }
    const updateVal = await Users.findByIdAndUpdate(id, data, { new: true })
    if (updateVal) {
      res.status(200).send({ success: true, updateVal })
    } else {
      res.status(400).send({ success: false })
    }
  },
  getSuggestion: async (req, res) => {
    console.log(req.query)
    const { userId } = req.query
    const userIdList = await getRecByUserIdHandling(userId)
    // console.log(userIdList)
    res.status(200).send({ success: true, suggestion: userIdList })
  }
}

module.exports = userCtrl
