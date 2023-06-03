const forever = require("forever")

const child = new forever.Monitor("app.js", {
  max: 3,
  silent: false,
  args: []
})

child.on("exit", function () {
  console.log("app.js has exited after 3 restarts")
})

child.start()
