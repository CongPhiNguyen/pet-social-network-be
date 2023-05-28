const router = require("express").Router()
const auth = require("../middleware/auth")
const petCtrl = require("../controllers/petCtrl")

router.post("/pet/", petCtrl.add)
router.get("/pet-by-userId", petCtrl.getList)
router.get("/pet/:id", petCtrl.getPetById)
router.delete("/pet/:id", petCtrl.deletePetById)
router.put("/pet/:id", petCtrl.updatePetById)

module.exports = router
