const { Configuration, OpenAIApi } = require("openai")
const API_KEY = process.env.CHAT_GPT_KEY1 + process.env.CHAT_GPT_KEY2
class gptCtrl {
  configuration = new Configuration({
    apiKey: API_KEY
  })

  openai = new OpenAIApi(this.configuration)

  getChat = (req, res) => {
    res.setHeader("Content-Type", "text/event-stream")
    res.setHeader("Cache-Control", "no-cache")
    res.setHeader("Connection", "keep-alive")
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.flushHeaders()
    const message = req.query.message
    if (!message) {
      return res.status(400).json({ error: "Message is required." })
    }

    const sendEvent = (data) => {
      res.write(`data: ${data}\n\n`)
    }
    const generateChat = async () => {
      try {
        const response = await this.openai.createCompletion(
          {
            model: "text-davinci-003",
            prompt: message,
            max_tokens: 500,
            temperature: 0.9,
            stream: true
          },
          { responseType: "stream" }
        )
        response.data.on("data", (data) => {
          const lines = data
            .toString()
            .split("\n")
            .filter((line) => line.trim() !== "")

          for (const line of lines) {
            const message = line.replace(/^data: /, "")
            if (message === "[DONE]") {
              return
            }
            const parsed = JSON.parse(message)
            sendEvent(parsed.choices[0].text)
          }
        })
      } catch (error) {
        console.error("Error:", error)
        res.end()
      }
    }

    generateChat()
  }

  chat = async (req, res) => {
    try {
      const message = req.body.message
      if (!message) {
        return res.status(400).json({ error: "Message is required." })
      }
      try {
        const response = await this.openai.createCompletion({
          model: "text-davinci-003",
          prompt: message,
          max_tokens: 100,
          temperature: 0.9
        })

        const reply = response.data.choices[0].text.trim()
        res.json({ reply })
      } catch (error) {
        console.error("Error:", error)
        res
          .status(500)
          .json({ error: "An error occurred while processing the request." })
      }
    } catch (err) {
      return res.status(500).json({ msg: err.message })
    }
  }
}
module.exports = new gptCtrl()
