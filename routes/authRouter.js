const router = require("express").Router()
const authCtrl = require("../controllers/authCtrl")

router.post("/register", authCtrl.register)

router.post("/login", authCtrl.login)

router.post("/logout", authCtrl.logout)

router.post("/forgot-password", authCtrl.forgotPassword)

router.post("/change-password", authCtrl.changePassword)

router.post("/refresh_token", authCtrl.generateAccessToken)

router.get("/refresh-v2", authCtrl.generateAccessTokenV2)

router.post("/auth/otp/generate", authCtrl.generateOTP)

router.post("/auth/otp/verify", authCtrl.verifyOTP)

router.post("/auth/otp/disable", authCtrl.disable2Factor)

module.exports = router
