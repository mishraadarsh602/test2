const systemPromptSession = require('../models/chat/systemPrompt.model');
const App = require('../models/app');
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
            let apiList = `[
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
            ]`

            parentPrompt = parentPrompt.replace('{userInput}', aiData.customPrompt);
            parentPrompt = parentPrompt.replace('{apiList}', apiList);
            console.log("parentPrompt", parentPrompt)
            const message = await client.messages.create({
                max_tokens: 1024,
                messages: [{ role: 'user', content: parentPrompt }],
                model: 'claude-3-5-sonnet-20240620',
            });
            let parentResponse = JSON.parse(message.content[0].text.trim());
            console.log(parentResponse);

            if (parentResponse && parentResponse.ToolTYPE === 'AIBASED') {
                let childPrompt = prompts?.childPrompt?.aibased;
                childPrompt = childPrompt.replace('{userInput}', aiData.customPrompt);
                const mesg = await client.messages.create({
                    max_tokens: 8192,
                    messages: [{ role: 'user', content: childPrompt }],
                    model: 'claude-3-5-sonnet-20240620',
                });
                let childResponse = mesg.content[0].text.trim();
                console.log(childResponse);
            }
            else if (parentResponse && parentResponse.ToolTYPE === 'APIBASED') {
                let childPrompt = prompts?.childPrompt?.apibased;
                childPrompt = childPrompt.replace('{userInput}', aiData.customPrompt);
                console.log(childPrompt)
            }

            res.status(200).json({
                message: "Prompt Chaining",
                data: parentResponse,
            });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    },

    callAPI: async (req, res) => { // get called from live APP( as live app dont have api only parentApp have)
        try {
            let body = req.body;
            const app = await App.findOne({ parentApp: body.parentApp });
            const response = await fetch(`${app.api}`);
            const data = await response.json();
            res.status(200).json({
                message: "API Called",
                data,
            });
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }
}