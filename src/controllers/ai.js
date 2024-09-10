const systemPromptSession = require('../models/chat/systemPrompt.model');
const { Anthropic } = require('@anthropic-ai/sdk');

const client = new Anthropic({
    apiKey: process.env['ANTHROPIC_API_KEY'],
});
module.exports = {

    createAppByAI: async (req, res) => {
        try {
            let aiData = req.body;
            const prompts = await systemPromptSession.findOne({});
            let parentPrompt = prompts?.parentPrompt;
            let apiList = [
                {
                    API: 'http://api.weatherapi.com/v1/forecast.json?q=gurgaon&key=YOUR_API&days=2',
                    Purpose: 'To retrieve the 2-day weather forecast (current day and next day) for a specific location, including hourly updates.',
                    key: 'FORCAST'
                },
                {
                    API: 'http://api.weatherapi.com/v1/current.json?q=mumbai&key=YOUR_API&aqi=yes',
                    Purpose: 'To get the  weather data of particular location  of current date and time',
                    key: 'FORCAST'
                }
            ]

            parentPrompt = parentPrompt.replace('{userInput}', aiData.customPrompt);
            parentPrompt = parentPrompt.replace('{apiList}', apiList);
            parentPrompt
            const message = await client.messages.create({
                max_tokens: 1024,
                messages: [{ role: 'user', content: parentPrompt }],
                model: 'claude-3-5-sonnet-20240620',
            });

            console.log(message.content[0].text.trim());
            res.status(201).json({
                message: "Prompt Chaining",
                data: message.content[0].text.trim(),
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
}