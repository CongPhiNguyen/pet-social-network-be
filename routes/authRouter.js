const router = require("express").Router()
const authCtrl = require("../controllers/authCtrl")

router.post("/register", authCtrl.register)

router.post("/login", authCtrl.login)

router.post("/logout", authCtrl.logout)

router.post("/refresh_token", authCtrl.generateAccessToken)

router.post("/auth/otp/generate", authCtrl.generateOTP)
router.post("/auth/otp/verify", authCtrl.verifyOTP)

module.exports = router
