const router = require('express').Router()
const gptCtrl = require('../controllers/gptCtrl')
const auth = require('../middleware/auth')

router.post('/gpt', gptCtrl.chat)
router.get('/gpt', gptCtrl.getChat)




module.exports = router