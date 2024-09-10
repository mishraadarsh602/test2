const systemPromptSession = require('../models/chat/systemPrompt.model');
const { ChatAnthropic } = require("@langchain/anthropic");
module.exports = {

    createAppByAI: async (req, res) => {
        try {
            let aiData = req.body;
            const prompts = await systemPromptSession.findOne({});
            console.log(aiData)
            res.status(201).json({
                message: "Prompt Chaining",
                data: prompts?.parentPrompt,
              });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
}