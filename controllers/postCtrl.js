const Posts = require("../models/postModel")
const Comments = require("../models/commentModel")
const Users = require("../models/userModel")
const Limit = require("../models/limitModel")
const ObjectId = require("mongodb").ObjectId
const { isObjectId } = require("../helpers/stringValidation")
class APIfeatures {
  constructor(query, queryString) {
    this.query = query
    this.queryString = queryString
  }

  paginating() {
    const page = this.queryString.page * 1 || 1
    const limit = this.queryString.limit * 1 || 9
    const skip = (page - 1) * limit
    this.query = this.query.skip(skip).limit(limit)
    return this
  }
}

function convertToUnaccentedString(str) {
  // Chuẩn hóa chuỗi Unicode để xử lý các ký tự có dấu
  const normalizedString = str.normalize("NFD")

  // Sử dụng regular expression để loại bỏ các ký tự không phải là chữ cái Latin
  const unaccentedString = normalizedString.replace(/[\u0300-\u036f]/g, "")

  // Chuyển đổi thành chữ thường
  const lowercaseString = unaccentedString.toLowerCase()

  return lowercaseString
}
let LimitsWord = ["Fucking", "dm", "dcmm"]

async function KiemTraTuNguThoTuc(content) {
  const content1 = convertToUnaccentedString(content)
  const limit = await Limit.find()
  for (const word of limit[0]?.limit) {
    if (content1.includes(convertToUnaccentedString(word))) {
      return true
    }
  }
  return false
}

const postCtrl = {
  getAllLimitsWord: async (req, res) => {
    const LimitsWords = await Limit.find()
    if (LimitsWords.length === 0) {
      const a = new Limit({
        limit: LimitsWord
      })
      await a.save()
      res.status(200).send({ data: LimitsWord })
    } else {
      res.status(200).send({ data: LimitsWords[0].limit })
    }
  },

  getPostByLocation: async (req, res) => {
    let { location } = req.body
    let arrLocation = location.split(",")
    arrLocation = arrLocation.map((word) => word.trim())
    arrLocation = arrLocation.filter((word) => isNaN(word))
    arrLocation = arrLocation.splice(-3)
    // const posts = await Posts.find({ location: { $in: arrLocation } })

    let posts = await Posts.find()
      .populate("user likes", "avatar username fullname followers")
      .populate({
        path: "comments",
        populate: {
          path: "user likes",
          select: "-password"
        }
      })
      .sort({ createdAt: -1 })

    posts = posts.filter((post) => {
      const includesWord = arrLocation.every((word) =>
        post.location.includes(word)
      )
      if (includesWord) return true
      return false
    })

    res.status(200).send({ data: posts })
  },

  updateAllLimitsWord: async (req, res) => {
    const { words } = req.body
    await Limit.updateMany({}, { limit: words })
    res.status(200).send({ data: words })
  },

  getAllPosts: async (req, res) => {
    try {
      const { username } = req.query
      const objectSearch = {}
      if (username && username !== "undefined")
        objectSearch["username"] = new RegExp(username)
      // const posts = await Posts.find(objectSearch)
      // const posts = await Posts.aggregate([
      //   // {
      //   //   $addFields: {
      //   //     idString: { $toString: '$_id' },
      //   //   },
      //   // },
      //   // {
      //   //   $match: {
      //   //     ...objectSearch,
      //   //   },
      //   // },
      //   {
      //     $lookup: {
      //       from: 'user',
      //       localField: 'user',
      //       foreignField: '_id',
      //       as: "abcdyzed"
      //     },
      //   }
      // ])

      const features = new APIfeatures(Posts.find({}), objectSearch)
      let posts = await features.query
        .sort("-updatedAt")
        .populate("user likes", "avatar username fullname followers")
        .populate({
          path: "comments",
          populate: {
            path: "user likes",
            select: "-password"
          }
        })

      posts =
        username && username !== "undefined"
          ? posts.filter((post) => post?.user?.username.includes(username))
          : posts

      res.status(200).send(posts)
    } catch (err) {
      return res.status(500).json({ msg: err.message })
    }
  },

  createPost: async (req, res) => {
    try {
      const { content, images, location } = req.body
      const check = await KiemTraTuNguThoTuc(content)
      if (check)
        return res
          .status(400)
          .json({ msg: "Content contains no offensive words" })

      if (images.length === 0)
        return res.status(400).json({ msg: "Please add your photo." })

      const newPost = new Posts({
        content,
        location,
        images,
        user: req.user._id
      })
      await newPost.save()

      res.json({
        msg: "Created Post!",
        newPost: {
          ...newPost._doc,
          user: req.user
        }
      })
    } catch (err) {
      return res.status(500).json({ msg: err.message })
    }
  },
  getPosts: async (req, res) => {
    try {
      const features = new APIfeatures(
        Posts.find({
          user: {
            $in: req.user.following
          }
        }),
        req.query
      )

      const posts = await features.query
        .sort("-updatedAt")
        .populate("user likes", "avatar username fullname followers")
        .populate({
          path: "comments",
          populate: {
            path: "user likes",
            select: "-password"
          }
        })

      res.json({
        msg: "Success!",
        result: posts.length,
        posts
      })
    } catch (err) {
      return res.status(500).json({ msg: err.message })
    }
  },
  updatePost: async (req, res) => {
    try {
      const { content, images, location } = req.body
      const check = await KiemTraTuNguThoTuc(content)
      if (check)
        return res
          .status(400)
          .json({ msg: "Content contains no offensive words" })

      const post = await Posts.findOneAndUpdate(
        { _id: req.params.id },
        {
          content,
          location,
          images
        }
      )
        .populate("user likes", "avatar username fullname")
        .populate({
          path: "comments",
          populate: {
            path: "user likes",
            select: "-password"
          }
        })

      res.json({
        msg: "Updated Post!",
        newPost: {
          ...post._doc,
          content,
          images
        }
      })
    } catch (err) {
      return res.status(500).json({ msg: err.message })
    }
  },
  likePost: async (req, res) => {
    try {
      const post = await Posts.find({ _id: req.params.id, likes: req.user._id })
      if (post.length > 0)
        return res.status(400).json({ msg: "You liked this post." })

      const like = await Posts.findOneAndUpdate(
        { _id: req.params.id },
        {
          $push: { likes: req.user._id }
        },
        { new: true }
      )

      if (!like)
        return res.status(400).json({ msg: "This post does not exist." })

      res.json({ msg: "Liked Post!" })
    } catch (err) {
      return res.status(500).json({ msg: err.message })
    }
  },
  unLikePost: async (req, res) => {
    try {
      const like = await Posts.findOneAndUpdate(
        { _id: req.params.id },
        {
          $pull: { likes: req.user._id }
        },
        { new: true }
      )

      if (!like)
        return res.status(400).json({ msg: "This post does not exist." })

      res.json({ msg: "UnLiked Post!" })
    } catch (err) {
      return res.status(500).json({ msg: err.message })
    }
  },
  getUserPosts: async (req, res) => {
    try {
      const features = new APIfeatures(
        Posts.find({ user: req.params.id }),
        req.query
      ).paginating()
      const posts = await features.query.sort("-updatedAt")

      res.json({
        posts,
        result: posts.length
      })
    } catch (err) {
      return res.status(500).json({ msg: err.message })
    }
  },
  getPost: async (req, res) => {
    try {
      const post = await Posts.findById(req.params.id)
        .populate("user likes", "avatar username fullname followers")
        .populate({
          path: "comments",
          populate: {
            path: "user likes",
            select: "-password"
          }
        })

      if (!post)
        return res.status(400).json({ msg: "This post does not exist." })

      res.json({
        post
      })
    } catch (err) {
      return res.status(500).json({ msg: err.message })
    }
  },
  getPostsDicover: async (req, res) => {
    try {
      const newArr = [...req.user.following, req.user._id]

      const num = req.query.num || 9

      const posts = await Posts.aggregate([
        { $match: { user: { $nin: newArr } } },
        { $sample: { size: Number(num) } }
      ])

      return res.json({
        msg: "Success!",
        result: posts.length,
        posts
      })
    } catch (err) {
      return res.status(500).json({ msg: err.message })
    }
  },
  deletePost: async (req, res) => {
    try {
      const post = await Posts.findOneAndDelete({
        _id: req.params.id,
        user: req.user._id
      })
      await Comments.deleteMany({ _id: { $in: post.comments } })

      res.json({
        msg: "Deleted Post!",
        newPost: {
          ...post,
          user: req.user
        }
      })
    } catch (err) {
      return res.status(500).json({ msg: err.message })
    }
  },
  savePost: async (req, res) => {
    try {
      const user = await Users.find({ _id: req.user._id, saved: req.params.id })
      if (user.length > 0)
        return res.status(400).json({ msg: "You saved this post." })

      const save = await Users.findOneAndUpdate(
        { _id: req.user._id },
        {
          $push: { saved: req.params.id }
        },
        { new: true }
      )

      if (!save)
        return res.status(400).json({ msg: "This user does not exist." })

      res.json({ msg: "Saved Post!" })
    } catch (err) {
      return res.status(500).json({ msg: err.message })
    }
  },
  unSavePost: async (req, res) => {
    try {
      const save = await Users.findOneAndUpdate(
        { _id: req.user._id },
        {
          $pull: { saved: req.params.id }
        },
        { new: true }
      )

      if (!save)
        return res.status(400).json({ msg: "This user does not exist." })

      res.json({ msg: "unSaved Post!" })
    } catch (err) {
      return res.status(500).json({ msg: err.message })
    }
  },
  getSavePosts: async (req, res) => {
    try {
      const features = new APIfeatures(
        Posts.find({
          _id: { $in: req.user.saved }
        }),
        req.query
      )

      const savePosts = await features.query
        .sort("-createdAt")
        .populate("user likes", "avatar username fullname followers")
        .populate({
          path: "comments",
          populate: {
            path: "user likes",
            select: "-password"
          }
        })

      res.json({
        savePosts,
        result: savePosts.length
      })
    } catch (err) {
      return res.status(500).json({ msg: err.message })
    }
  },
  getPostByUserId: async (req, res) => {
    const { id } = req.params
    if (!isObjectId(id)) {
      return res.status(400).json({ msg: "UserId is not valid" })
    }
    const postList = await Posts.find({ user: ObjectId(id) })
      .populate("user likes", "avatar username fullname followers")
      .populate({
        path: "comments",
        populate: {
          path: "user likes",
          select: "-password"
        }
      })
    res.status(200).send({ success: true, postList: postList })
  }
}

module.exports = { postCtrl, KiemTraTuNguThoTuc }
