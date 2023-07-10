const Logs = require("../models/logsModel")

const petCtrl = {
  getList: async (req, res) => {
    const { currentPage, pageSize, filter, sortValue } = req.query
    console.log(sortValue)
    const newFilter = filter
    if (newFilter?.url) {
      const escapedName = newFilter?.url.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      newFilter["url"] = { $regex: escapedName, $options: "i" }
    }

    const defaultSort = { createdAt: -1 }
    let sort = {}
    if (sortValue?.sortColumn && sortValue?.sortType) {
      sort[sortValue?.sortColumn] = sortValue?.sortType === "desc" ? -1 : 1
    } else sort = defaultSort

    const total = await Logs.find(newFilter).count()
    const listLogs = await Logs.find(newFilter)
      .sort(sort)
      .limit(Number(pageSize))
      .skip(Number(currentPage) * Number(pageSize))
    res
      .status(200)
      .send({ success: true, listLogs: listLogs, meta: { currentPage, total } })
  }
}
module.exports = petCtrl
