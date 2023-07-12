const router = require("express").Router()
const logCtrl = require("../controllers/logCtrl")
const auth = require("../middleware/auth")

router.get("/log", logCtrl.getList)
router.get("/log/accumulation", logCtrl.getLogAccumulation)

module.exports = router
