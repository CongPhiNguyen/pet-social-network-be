const router = require("express").Router()
const logCtrl = require("../controllers/logCtrl")
const auth = require("../middleware/auth")

router.get("/log", logCtrl.getList)

module.exports = router
