const router = require("express").Router()
const errorCtrl = require("../controllers/errorCtrl")

router.get("/error", errorCtrl.throwError)

module.exports = router
