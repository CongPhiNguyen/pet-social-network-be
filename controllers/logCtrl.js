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
    return res
      .status(200)
      .send({ success: true, listLogs: listLogs, meta: { currentPage, total } })
  },
  getLogAccumulation: async (req, res) => {
    const { sortValue } = req.query
    const defaultSort = { _id: 1 }
    let sort = {}
    if (sortValue?.sortColumn && sortValue?.sortType) {
      sort[sortValue?.sortColumn] = sortValue?.sortType === "desc" ? -1 : 1
    } else sort = defaultSort
    const logAccumulation = await Logs.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date("2023-07-10"),
            $lt: new Date("2023-07-11")
          }
        }
      },
      {
        $match: {
          $or: [
            {
              url: {
                $regex: "^/api"
              }
            },
            {
              url: {
                $regex: "^/chat"
              }
            }
          ]
        }
      },
      {
        $addFields: {
          urlParts: {
            $split: ["$url", "/"] // Tách đường dẫn thành các phần
          }
        }
      },
      {
        $addFields: {
          urlParts: {
            $filter: {
              input: "$urlParts",
              cond: { $ne: [{ $strLenCP: "$$this" }, 24] } // Loại bỏ các phần tử ObjectId
            }
          }
        }
      },
      {
        $addFields: {
          url2: {
            $reduce: {
              input: "$urlParts",
              initialValue: "",
              in: {
                $concat: [
                  "$$value", // Thêm phần tử đã xử lý vào chuỗi kết quả
                  { $cond: [{ $eq: ["$$value", ""] }, "", "/"] }, // Thêm dấu "/" giữa các phần tử (nếu cần)
                  "$$this" // Thêm phần tử hiện tại vào chuỗi kết quả
                ]
              }
            }
          }
        }
      },
      {
        $addFields: {
          apiName: {
            $arrayElemAt: [
              { $split: ["$url2", "?"] }, // Tách đường dẫn thành các phần
              0 // Lấy phần tử đầu tiên trong danh sách các phần
            ]
          }
        }
      },
      {
        $group: {
          _id: "$apiName",
          count: { $sum: 1 },
          // count_200: { $sum: { $cond: [{ $eq: ["$status", 200] }, 1, 0] } },
          // count_400: { $sum: { $cond: [{ $eq: ["$status", 400] }, 1, 0] } },
          responseTime: { $avg: "$responseTime" }
        }
      },
      {
        $sort: sort
      }
    ])
    // console.log(logAccumulation)
    return res.status(200).send({
      success: true,
      listLogAccumulation: logAccumulation
      // meta: { currentPage, total }
    })
  }
}
module.exports = petCtrl
