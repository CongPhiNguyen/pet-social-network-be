const router = require("express").Router()
const auth = require("../middleware/auth")
const petCtrl = require("../controllers/petCtrl")

router.post("/pet/", petCtrl.add)
router.get("/pet-by-userId", petCtrl.getList)

module.exports = router
