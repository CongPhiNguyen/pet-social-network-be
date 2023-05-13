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

const app = express()
app.use(express.json())
app.use(cors({ origin: true }))
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
app.use(
  morgan("dev", {
    stream: {
      write: function (message) {
        const messageSplit = message.split(" ")
        // tạo một document mới cho log
        console.log(messageSplit)
        console.log({
          method: messageSplit[0].slice(7),
          url: messageSplit[1],
          status: messageSplit[2].slice(7, 3),
          contentLength: Number(messageSplit[3]),
          responseTime: messageSplit[6].slice(messageSplit[6].indexOf(`\\`)),
          message: message
        })
        // const log = new Log({
        //   method: messageSplit[0].slice(7),
        //   url: messageSplit[2].slice(7),
        //   status: messageSplit[3],
        //   contentLength: Number(messageSplit[4]),
        //   responseTime: messageSplit[6].split(messageSplit[6].indexOf(`\\`))
        // })
        // lưu document vào MongoDB
        // log.save(function (err) {
        //   if (err) {
        //     // console.log(err)
        //   }
        // })
      }
    }
  })
)

// Routes
app.use("/api", require("./routes/authRouter"))
app.use("/api", require("./routes/userRouter"))
app.use("/api", require("./routes/postRouter"))
app.use("/api", require("./routes/commentRouter"))
app.use("/api", require("./routes/notifyRouter"))
app.use("/api", require("./routes/messageRouter"))
app.use("/api", require("./routes/petRouter"))

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

const port = process.env.PORT || 5000
http.listen(port, () => {
  console.log("Server is running on port", port)
})
