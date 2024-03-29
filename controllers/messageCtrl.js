const Conversations = require("../models/conversationModel")
const Messages = require("../models/messageModel")
const dialogflow = require("dialogflow")
const uuid = require("uuid")
const axios = require("axios")
const fs = require("fs")
const moment = require("moment")
const sessionClient = new dialogflow.SessionsClient()
const sessionPath = sessionClient.sessionPath(process.env.PROJECT_ID, uuid.v4())
require("dotenv").config({ path: "./.env" })
const Chat = require("../models/chatModel")
const Fact = require("../models/factModel")
const { handleIntent } = require("../helpers/chatBotHandler")

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
  addGreetMesssageApi: async (req, res) => {
    const { userId, botName, messageList: messageAddList } = req.body
    console.log(botName)
    console.log(userId, botName)
    let userChat = await Chat.findOne({ userId: userId, bot: botName })
    if (!userChat) {
      const userChatInfo = {
        userId: userId,
        session: sessionPath,
        message: [],
        bot: botName
      }
      await new Chat(userChatInfo).save()
      console.log("create new")
    }

    userChat = await Chat.findOne({ userId: userId, bot: botName })
    const messageList = userChat.message

    for (const text of messageAddList) {
      messageList.push({
        text: text,
        time: Date.now(),
        sender: botName
      })
    }

    await Chat.findOneAndUpdate(
      { userId: userId, bot: botName },
      { message: messageList, lastGreetTime: Date.now() }
    )

    // const

    //
    res.status(200).send({ success: true, messageList: messageList })
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
      let messageRes = responses[0].queryResult.fulfillmentText
      const { queryResult } = responses[0]
      const dialogFlowFeature = await handleIntent(queryResult)

      if (dialogFlowFeature?.name === "ask_find-cat") {
        console.log("ok")
        const request = {
          session: sessionPath,
          queryInput: {
            text: {
              text: "Tôi muốn tìm mèo",
              languageCode: "en-US"
            }
          }
        }
        await sessionClient.detectIntent(request)
      } else if (dialogFlowFeature?.name === "ask_find-dog") {
        const request = {
          session: sessionPath,
          queryInput: {
            text: {
              text: "Tôi muốn tìm chó",
              languageCode: "en-US"
            }
          }
        }
        await sessionClient.detectIntent(request)
      } else if (dialogFlowFeature?.name === "choose.pet-by-personal") {
        if (dialogFlowFeature?.genPersonal) {
          const genPersonal = dialogFlowFeature?.genPersonal
          let newMessage = messageRes
            .replace("${per1}", genPersonal[0])
            .replace("${per2}", genPersonal[1])
            .replace("${per3}", genPersonal[2])
          messageRes = newMessage
        } else {
          const petName =
            dialogFlowFeature?.dogName || dialogFlowFeature?.catName
          let newMessage =
            messageRes.replace(" ${pet_name}", petName) +
            ". Với các tính cách đặc biệt: " +
            dialogFlowFeature?.tempList
          messageRes = newMessage
        }
      } else if (dialogFlowFeature?.name === "predict_sick") {
        if (dialogFlowFeature?.genSick) {
          const genSick = dialogFlowFeature?.genSick
          let newMessage = messageRes
            .replace("${sym1}", genSick[0])
            .replace("${sym2}", genSick[1])
            .replace("${sym3}", genSick[2])
          console.log(newMessage)
          messageRes = newMessage
        } else {
          const sickName = dialogFlowFeature?.sickName
          let newMessage = messageRes.replace(" ${sick_name}", sickName)
          messageRes = newMessage
        }
      }

      // // Temporary disable logs
      // try {
      //   fs.writeFileSync(
      //     `C:\\CongPhi\\school-project\\logs\\a_${moment().format(
      //       "DDMMYY_HHmmss"
      //     )}.json`,
      //     JSON.stringify(responses)
      //   )
      // } catch (err) {
      //   console.log(err)
      // }
      const messageInfo = {
        // ...responses,
        text: messageRes,
        dialogflowFeature: dialogFlowFeature,
        time: Date.now(),
        sender: "dialogflow"
      }
      messageList.push(messageInfo)
      await Chat.findOneAndUpdate(
        {
          userId: userId,
          sessionPath: userChat.sessionPath,
          bot: "dialogflow"
        },
        { message: messageList }
      )
      res.status(200).send(messageInfo)
    } catch (error) {
      console.log(`Error in detectIntent: ${error}`)
      res.status(500).send("Internal Server Error")
    }
  },
  dummyBotApi: async (req, res) => {
    const { userId, message } = req.body
    let userChat = await Chat.findOne({ userId: userId, bot: "dummy" })
    // Check case chưa nhắn lần nào
    if (!userChat) {
      const userChatInfo = {
        userId: userId,
        message: [],
        bot: "dummy"
      }
      await new Chat(userChatInfo).save()
    }
    userChat = await Chat.findOne({ userId: userId, bot: "dummy" })
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
    try {
      const response = await axios.post(
        `${process.env.CHAT_BOT_SERVER}/api/chat-basic`,
        { message: message }
      )
      const { status, data } = response
      const result = data.reply
      messageList.push({
        // ...responses,
        text: data.reply,
        time: Date.now(),
        sender: "dummy"
      })
      await Chat.findOneAndUpdate(
        {
          userId: userId,
          bot: "dummy"
        },
        { message: messageList }
      )
      res.status(200).send({ message: data.reply })
    } catch (error) {
      console.log(`${error}`)
      res.status(500).send("Internal Server Error")
    }
    // res.status(200).send({ success: true, reply: data.reply })
  },
  gossipBotApi: async (req, res) => {
    const { userId, message } = req.body
    let userChat = await Chat.findOne({ userId: userId, bot: "gossip" })
    // Check case chưa nhắn lần nào
    if (!userChat) {
      const userChatInfo = {
        userId: userId,
        message: [],
        bot: "gossip"
      }
      await new Chat(userChatInfo).save()
    }
    userChat = await Chat.findOne({ userId: userId, bot: "gossip" })
    // Append user message
    const messageList = userChat.message
    messageList.push({
      text: message,
      time: Date.now(),
      sender: userId
    })
    await Chat.findOneAndUpdate(
      { userId: userId, sessionPath: sessionPath, bot: "gossip" },
      { message: messageList }
    )
    try {
      const response = await axios.post(
        `${process.env.CHAT_BOT_SERVER}/api/chat-gossip`,
        { message: message }
      )
      const { status, data } = response
      console.log(data)
      const result = data.reply
      const messageInfo = {
        // ...responses,
        text: data.reply,
        message: data.reply,
        dialogflowFeature: data.dialogflowFeature,
        time: Date.now(),
        sender: "gossip"
      }
      messageList.push(messageInfo)
      await Chat.findOneAndUpdate(
        {
          userId: userId,
          bot: "gossip"
        },
        { message: messageList }
      )
      res.status(200).send(messageInfo)
    } catch (error) {
      console.log(`${error}`)
      res.status(500).send("Internal Server Error")
    }
  },
  getBotMessage: async (req, res) => {
    const { botName, userId } = req.query
    const userChat = await Chat.findOne({ bot: botName, userId: userId })
    return res.status(200).send({
      success: false,
      messageList: userChat?.message || [],
      lastGreetTime: userChat?.lastGreetTime || "Not a valid time"
    })
  },
  getFact: async (req, res) => {
    const val = await Fact.find({})
    res.status(200).send({
      success: true,
      fact: global.fact[Math.floor(Math.random() * global.fact.length)]
    })
  }
}

module.exports = messageCtrl
