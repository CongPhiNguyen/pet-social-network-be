const { Configuration, OpenAIApi } = require("openai");

class gptCtrl {
    configuration = new Configuration({
        apiKey: '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',
    });

    openai = new OpenAIApi(this.configuration);

    getChat = () => {
        return true
    }

    chat = async (req, res) => {
        try {
            const message = req.body.message;
            if (!message) {
                return res.status(400).json({ error: 'Message is required.' });
            }
            try {

                const response = await this.openai.createCompletion({
                    model: "text-davinci-003",
                    prompt: message,
                    max_tokens: 100,
                    temperature: 0.9
                });


                const reply = response.data.choices[0].text.trim();
                res.json({ reply });
            } catch (error) {
                console.error('Error:', error);
                res.status(500).json({ error: 'An error occurred while processing the request.' });
            }

        } catch (err) {
            return res.status(500).json({ msg: err.message })
        }
    }
}
module.exports = new gptCtrl();
