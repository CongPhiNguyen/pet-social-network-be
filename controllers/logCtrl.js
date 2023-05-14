const Logs = require("../models/logsModel")

const petCtrl = {
  getList: async (req, res) => {
    const listLogs = await Logs.find().sort({ createdAt: -1 }).limit(100)
    res.status(200).send({ success: true, listLogs: listLogs })
  }
}
module.exports = petCtrl
