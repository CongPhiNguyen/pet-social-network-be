const router = require("express").Router()
const auth = require("../middleware/auth")
const userCtrl = require("../controllers/userCtrl")


router.get("/search-in-page", userCtrl.searchInPage)
router.get("/search", auth, userCtrl.searchUser)
router.get("/user/:id", auth, userCtrl.getUser)
router.post("/user/verify-account", userCtrl.verifyEmail)
router.post("/user/:id", userCtrl.updateUserInfo)
router.get("/user/:id/email", userCtrl.getEmailWithId)
router.post("/user/:id/send-email", userCtrl.sendEmailVerify)
router.post(
  "/user/:pattern/send-email-by-pattern",
  userCtrl.sendEmailVerifyByPattern
)
router.patch("/user/:id/follow", auth, userCtrl.follow)
router.patch("/user/:id/unfollow", auth, userCtrl.unfollow)
router.get("/user", userCtrl.getUserWithEmail)
router.get("user", userCtrl.getUserWithEmail)


router.post("/change-role", userCtrl.changeRole)
router.get("/suggestionsUser", auth, userCtrl.suggestionsUser)
router.get("/get-all-user", userCtrl.getAllUser)
router.get("/follower/:id", userCtrl.getAllFollower)
router.get("/following/:id", userCtrl.getAllFollowing)
router.get("/get-user-info/:id", userCtrl.getUserInfo)

module.exports = router
