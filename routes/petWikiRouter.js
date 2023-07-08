const router = require("express").Router()
const auth = require("../middleware/auth")
const petApiCtrl = require("../controllers/petApiCtrl")

router.get("/pet-wiki/dogs", petApiCtrl.getDog)
router.get("/pet-wiki/cats", petApiCtrl.getCat)

module.exports = router
