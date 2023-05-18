const router = require('express').Router()
const gptCtrl = require('../controllers/gptCtrl')
const auth = require('../middleware/auth')

router.post('/gpt', auth, gptCtrl.chat)
router.get('/gpt', auth, gptCtrl.getChat)




module.exports = router