const sendMailNode = require("../helpers/sendMail")
const Users = require("../models/userModel")

const userCtrl = {
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
    const { email } = req.query
    const userEmail = await Users.findOne({ email: email })
    res.status(200).send({ success: true, user: userEmail })
  },

  getEmailWithId: async (req, res) => {
    const id = req.params.id
    const user = await Users.findById(id)
    if (!user) {
      res.status(400).send({ success: false })
    }
    res.status(200).send({ success: true, email: user.email })
  },

  sendEmailVerify: async (req, res) => {
    const result = await sendMailNode(
      "CODE",
      "code",
      "congphinguyen312@gmail.com"
    )
    res.status(200).send({ success: true, result: result })
  },

  verifyEmail: async (req, res) => {
    console.log(req.params)
    console.log(req.body)
    res.status(200).send({ success: true })
  },

  updateUser: async (req, res) => {
    try {
      const { avatar, fullname, mobile, address, story, website, gender } =
        req.body
      if (!fullname)
        return res.status(400).json({ msg: "Please add your full name." })

      await Users.findOneAndUpdate(
        { _id: req.user._id },
        {
          avatar,
          fullname,
          mobile,
          address,
          story,
          website,
          gender
        }
      )

      res.json({ msg: "Update Success!" })
    } catch (err) {
      return res.status(500).json({ msg: err.message })
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
  }
}

module.exports = userCtrl
