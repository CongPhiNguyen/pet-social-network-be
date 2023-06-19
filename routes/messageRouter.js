const router = require("express").Router()
const messageCtrl = require("../controllers/messageCtrl")
const auth = require("../middleware/auth")

router.post("/message", auth, messageCtrl.createMessage)

router.get("/conversations", auth, messageCtrl.getConversations)

router.get("/message/:id", auth, messageCtrl.getMessages)

router.delete("/message/:id", auth, messageCtrl.deleteMessages)

router.delete("/conversation/:id", auth, messageCtrl.deleteConversation)

router.post("/dialogflow-api", messageCtrl.dialogFlowApi)

router.post("/chat/dummy", messageCtrl.dummyBotApi)

router.post("/chat/gossip", messageCtrl.gossipBotApi)

router.get("/bot-message", messageCtrl.getBotMessage)

module.exports = router
