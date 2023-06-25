require("dotenv").config()
const express = require("express")
const mongoose = require("mongoose")
const cors = require("cors")
const cookieParser = require("cookie-parser")
const SocketServer = require("./socketServer")
const { ExpressPeerServer } = require("peer")
const path = require("path")
const morgan = require("morgan")
const Log = require("./models/logsModel")
const morganBody = require("morgan-body")
const jwt = require("jsonwebtoken")
const cluster = require("cluster")
const cpuCount = require("os").cpus().length

const app = express()
app.use(express.json())
app.use(cors({
  origin: true,
  credentials: true,            //access-control-allow-credentials:true
  optionSuccessStatus: 200
}))
app.use(cookieParser())

// Socket
const http = require("http").createServer(app)
const io = require("socket.io")(http)

io.on("connection", (socket) => {
  SocketServer(socket)
})

// Create peer server
ExpressPeerServer(http, { path: "/" })

// Logs

// sử dụng middleware morgan để log request
app.use(
  morgan(function (tokens, req, res) {
    // trả về một chuỗi JSON chứa thông tin request
    return JSON.stringify({
      method: tokens.method(req, res),
      url: tokens.url(req, res),
      status: tokens.status(req, res),
      responseTime: tokens["response-time"](req, res)
    })
  })
)

// sử dụng middleware để lưu log vào MongoDB
app.use(function (req, res, next) {
  let userId = ""
  try {
    const token = req.header("Authorization")
    if (token) {
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
      userId = decoded.id
    }
  } catch (e) {}
  // tạo một document mới cho log
  const log = new Log({
    method: req.method,
    url: req.originalUrl,
    status: res.statusCode,
    responseTime: Date.now() - req._startTime,
    userId: userId
  })

  // lưu document vào MongoDB
  log.save(function (err) {
    if (err) {
      console.log(err.msg)
    }
  })

  next()
})

// Routes
app.use("/api", require("./routes/authRouter"))
app.use("/api", require("./routes/userRouter"))
app.use("/api", require("./routes/postRouter"))
app.use("/api", require("./routes/commentRouter"))
app.use("/api", require("./routes/notifyRouter"))
app.use("/api", require("./routes/messageRouter"))
app.use("/api", require("./routes/petRouter"))
app.use("/api", require("./routes/logRouter"))
app.use("/api", require("./routes/gptRouter"))
app.use("/", require("./routes/errorRouter"))

const URI = process.env.MONGODB_URL
mongoose.connect(
  URI,
  {
    useCreateIndex: true,
    useFindAndModify: false,
    useNewUrlParser: true,
    useUnifiedTopology: true
  },
  (err) => {
    if (err) throw err
    console.log("Connected to mongodb")
  }
)

// if (process.env.NODE_ENV === "production") {
//   app.use(express.static("client/build"))
//   app.get("*", (req, res) => {
//     res.sendFile(path.join(__dirname, "client", "build", "index.html"))
//   })
// }

const main = async () => {
  global.fact = await require("fs")
    .readFileSync("./fact.txt", "utf-8")
    .split("\r\n")
  global.tips = await require("fs")
    .readFileSync("./tips.txt", "utf-8")
    .split("\r\n")
}

main()

const port = process.env.PORT || 5000
if (cluster.isMaster) {
  for (var i = 0; i < cpuCount; i++) {
    cluster.fork()
  }
  cluster.on("exit", function (worker, code, signal) {
    console.log("worker " + worker.process.pid + " died")
    cluster.fork()
  })
} else {
  http.listen(port, () => {
    console.log("Server is running at port " + port)
  })
}
