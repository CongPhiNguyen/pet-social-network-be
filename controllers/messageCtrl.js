const Conversations = require("../models/conversationModel")
const Messages = require("../models/messageModel")
const dialogflow = require("dialogflow")
const uuid = require("uuid")
const sessionClient = new dialogflow.SessionsClient()
const sessionPath = sessionClient.sessionPath(process.env.PROJECT_ID, uuid.v4())
require("dotenv").config({ path: "./.env" })
const Chat = require("../models/chatModel")

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

const messageCtrl = {
  createMessage: async (req, res) => {
    try {
      const { sender, recipient, text, media, call } = req.body

      if (!recipient || (!text.trim() && media.length === 0 && !call)) return

      const newConversation = await Conversations.findOneAndUpdate(
        {
          $or: [
            { recipients: [sender, recipient] },
            { recipients: [recipient, sender] }
          ]
        },
        {
          recipients: [sender, recipient],
          text,
          media,
          call
        },
        { new: true, upsert: true }
      )

      const newMessage = new Messages({
        conversation: newConversation._id,
        sender,
        call,
        recipient,
        text,
        media
      })

      await newMessage.save()

      res.json({ msg: "Create Success!" })
    } catch (err) {
      return res.status(500).json({ msg: err.message })
    }
  },
  getConversations: async (req, res) => {
    try {
      const features = new APIfeatures(
        Conversations.find({
          recipients: req.user._id
        }),
        req.query
      ).paginating()

      const conversations = await features.query
        .sort("-updatedAt")
        .populate("recipients", "avatar username fullname")

      res.json({
        conversations,
        result: conversations.length
      })
    } catch (err) {
      return res.status(500).json({ msg: err.message })
    }
  },
  getMessages: async (req, res) => {
    try {
      const features = new APIfeatures(
        Messages.find({
          $or: [
            { sender: req.user._id, recipient: req.params.id },
            { sender: req.params.id, recipient: req.user._id }
          ]
        }),
        req.query
      ).paginating()

      const messages = await features.query.sort("-createdAt")

      res.json({
        messages,
        result: messages.length
      })
    } catch (err) {
      return res.status(500).json({ msg: err.message })
    }
  },
  deleteMessages: async (req, res) => {
    try {
      await Messages.findOneAndDelete({
        _id: req.params.id,
        sender: req.user._id
      })
      res.json({ msg: "Delete Success!" })
    } catch (err) {
      return res.status(500).json({ msg: err.message })
    }
  },

  deleteConversation: async (req, res) => {
    try {
      const newConver = await Conversations.findOneAndDelete({
        $or: [
          { recipients: [req.user._id, req.params.id] },
          { recipients: [req.params.id, req.user._id] }
        ]
      })
      await Messages.deleteMany({ conversation: newConver._id })

      res.json({ msg: "Delete Success!" })
    } catch (err) {
      return res.status(500).json({ msg: err.message })
    }
  },

  dialogFlowApi: async (req, res) => {
    const { userId, message } = req.body
    let userChat = await Chat.findOne({ userId: userId, bot: "dialogflow" })
    // Check case chưa nhắn lần nào
    if (!userChat) {
      const userChatInfo = {
        userId: userId,
        session: sessionPath,
        message: [],
        bot: "dialogflow"
      }
      await new Chat(userChatInfo).save()
    }

    userChat = await Chat.findOne({ userId: userId, bot: "dialogflow" })

    // Append user message
    const messageList = userChat.message
    messageList.push({
      text: message,
      time: Date.now(),
      sender: userId
    })
    await Chat.findOneAndUpdate(
      { userId: userId, sessionPath: sessionPath, bot: "dialogflow" },
      { message: messageList }
    )

    const request = {
      session: sessionPath,
      queryInput: {
        text: {
          text: message,
          languageCode: "en-US"
        }
      }
    }

    try {
      const responses = await sessionClient.detectIntent(request)
      const result = responses[0].queryResult
      messageList.push({
        // ...responses,
        text: responses[0].queryResult.fulfillmentText,
        time: Date.now(),
        sender: "dialogflow"
      })
      await Chat.findOneAndUpdate(
        {
          userId: userId,
          sessionPath: userChat.sessionPath,
          bot: "dialogflow"
        },
        { message: messageList }
      )
      res.status(200).send({ message: result.fulfillmentText })
    } catch (error) {
      console.log(`Error in detectIntent: ${error}`)
      res.status(500).send("Internal Server Error")
    }
  },

  getBotMessage: async (req, res) => {
    const { botName, userId } = req.query
    const userChat = await Chat.findOne({ bot: botName, userId: userId })
    res
      .status(200)
      .send({ success: false, messageList: userChat?.message || [] })
  }
}

module.exports = messageCtrl
