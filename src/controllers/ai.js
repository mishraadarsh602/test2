const systemPromptSession = require('../models/chat/systemPrompt.model');
const App = require('../models/app');
const { Anthropic } = require('@anthropic-ai/sdk');
const { OpenAI } = require("openai");
const fs = require('fs');
const path = require('path');
const { z } = require("zod");
const { ChatAnthropic } = require('@langchain/anthropic');
const { default: axios } = require('axios');
const openai = new OpenAI({ apiKey: process.env.OPEN_AI_KEY });
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
            ]`;

      parentPrompt = parentPrompt.replace("{userInput}", aiData.customPrompt);
      parentPrompt = parentPrompt.replace("{apiList}", apiList);
      // console.log("parentPrompt", parentPrompt)
      const message = await client.messages.create({
        max_tokens: 1024,
        messages: [{ role: "user", content: parentPrompt }],
        model: "claude-3-5-sonnet-20240620",
      });
      let parentResponse = JSON.parse(message.content[0].text.trim());
      console.log(parentResponse);

      let waitForChildOperation = await CALLAI(parentResponse, prompts, aiData);

      res.status(200).json({
        message: "Prompt Chaining",
        data: waitForChildOperation,
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  callAPI: async (req, res) => {
    // get called from live APP( as live app dont have api only parentApp have)
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
  },

  returnCode: async (req, res) => {
    // get called from live APP( as live app dont have api only parentApp have)
    try {
      const app = await App.findOne({ _id: "thread_XFx8ZU8Ebn4nJBAf3iKx5UMf" });
      console.log("ashish", app["componentCode"]);
      res.status(200).json({
        code: app["componentCode"],
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  createAssistant: async (req, res) => {
    try {
      let reactCode = `function SolarEnergyApp() {
        const [latitude, setLatitude] = React.useState('');
        const [longitude, setLongitude] = React.useState('');
        const [startDate, setStartDate] = React.useState('');
        const [endDate, setEndDate] = React.useState('');
        const [solarData, setSolarData] = React.useState(null);
        const [loading, setLoading] = React.useState(false);
        const [error, setError] = React.useState(null);
      
        const fetchSolarData = async () => {
          setLoading(true);
          setError(null);
          try {
            const response = await fetch(\`https://api.solcast.com.au/world_solar_radiation/estimated_actuals?latitude=\${latitude}&longitude=\${longitude}&start=\${startDate}&end=\${endDate}&api_key=YOUR_API_KEY\`);
            if (!response.ok) {
              throw new Error('Failed to fetch solar energy data');
            }
            const data = await response.json();
            setSolarData(data);
          } catch (err) {
            setError('Failed to fetch solar energy data');
          } finally {
            setLoading(false);
          }
        };
      
        return React.createElement('div', { className: 'min-h-screen bg-gradient-to-br from-green-400 to-blue-500 flex flex-col items-center justify-center p-4' },
          React.createElement('div', { className: 'bg-white rounded-lg shadow-2xl p-8 w-full max-w-md' },
            React.createElement('header', { className: 'flex items-center justify-between mb-6' },
              React.createElement('h1', { className: 'text-3xl font-bold text-gray-800' }, 'Solar Energy Data'),
              React.createElement(LucideIcons.Sun, { className: 'w-10 h-10 text-yellow-500' })
            ),
            React.createElement('div', { className: 'space-y-4' },
              React.createElement('div', { className: 'relative' },
                React.createElement(LucideIcons.MapPin, { className: 'absolute top-3 left-3 text-gray-400' }),
                React.createElement('input', {
                  type: 'text',
                  value: latitude,
                  onChange: (e) => setLatitude(e.target.value),
                  placeholder: 'Latitude',
                  className: 'w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                })
              ),
              React.createElement('div', { className: 'relative' },
                React.createElement(LucideIcons.MapPin, { className: 'absolute top-3 left-3 text-gray-400' }),
                React.createElement('input', {
                  type: 'text',
                  value: longitude,
                  onChange: (e) => setLongitude(e.target.value),
                  placeholder: 'Longitude',
                  className: 'w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                })
              ),
              React.createElement('div', { className: 'relative' },
                React.createElement(LucideIcons.Calendar, { className: 'absolute top-3 left-3 text-gray-400' }),
                React.createElement('input', {
                  type: 'date',
                  value: startDate,
                  onChange: (e) => setStartDate(e.target.value),
                  className: 'w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                })
              ),
              React.createElement('div', { className: 'relative' },
                React.createElement(LucideIcons.Calendar, { className: 'absolute top-3 left-3 text-gray-400' }),
                React.createElement('input', {
                  type: 'date',
                  value: endDate,
                  onChange: (e) => setEndDate(e.target.value),
                  className: 'w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                })
              ),
              React.createElement('button', {
                onClick: fetchSolarData,
                className: 'w-full bg-blue-500 text-white rounded-md py-3 font-semibold hover:bg-blue-600 transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50'
              }, 'Get Solar Data')
            )
          ),
          solarData && React.createElement('div', { className: 'mt-8 bg-white rounded-lg shadow-2xl p-6 w-full max-w-md' },
            React.createElement('h2', { className: 'text-2xl font-bold mb-4 text-gray-800' }, 'Solar Energy Output'),
            React.createElement('pre', { className: 'bg-gray-100 p-4 rounded-md overflow-auto max-h-60 text-sm' },
              JSON.stringify(solarData, null, 2)
            )
          ),
          error && React.createElement('div', { className: 'mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative', role: 'alert' },
            React.createElement('strong', { className: 'font-bold' }, 'Error: '),
            React.createElement('span', { className: 'block sm:inline' }, error)
          ),
          loading && React.createElement('div', { className: 'mt-4 flex items-center justify-center' },
            React.createElement('div', { className: 'animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500' })
          )
        );
      }
      return SolarEnergyApp;`;
      let instructions = `You are an AI assistant who generates both conversational responses and code when necessary. Generate code in a string format. We were going to work on a React-based Javascript App, and your role is to assist with creating, editing and improving React codebases with the tailwind, custom CSS and Javascript only, based on my requests. Our app relies heavily on third-party API integration. Avoid fetching the API on load. Instead, fetch the API when the button is clicked. Additionally, handle API errors properly to ensure the app doesn't crash. \n Before generating any code, ensure you fully understand my requirements. Take the time to clarify anything necessary until you have complete clarity. Once you're certain about my instructions, proceed to create the code.\n Ask for a specific API If API is required: "Do you have a specific API in mind, or would you like us to recommend one?" Confirm if sure: "If you're sure about the API, would you like to proceed with this one?" Respond options: If the user confirms: "Great! Let's proceed with this API." If the user denies: "No worries, would you like us to recommend another one?" If the user is unsure: "That's fine! We'll go with our best recommendation."\nProvide non-technical conversational responses along with code in the proper format. Maintain the best UI practices, colours, responsiveness, and functionality.\n If I provide you with any media or media link, please use it as a reference for what I want to create. Feel free to ask for clarification if you're unsure about the media or its relevance.\n Always ensure the final output contains the correct code.\n Maintain contrasting colours of buttons, and icons properly and don’t add any out-of-scope elements or icons. \nAssume that we have all other files and the environment setup is done and only requires one code file which will run as jsx. I am providing you with a sample JSX code purely as a syntax and reference guide:{reactCode}\ Please note that this code is only for reference, and you're free to modify the structure, style, and functionality. Follow the pattern in terms of function usage, API calls, and element creation without any import statements. However, feel free to enhance the code with best practices, improve UI/UX, and optimize functionality as needed. I have this header added already import React, {useState, useEffect, useContext, useReducer, useCallback, useMemo, useRef, useImperativeHandle, useLayoutEffect, useDebugValue, useTransition, useDeferredValue, useId, useSyncExternalStore, useInsertionEffect} from 'react'; import * as LucideIcons from 'lucide-react'; import { useLocation } from 'react-router-dom'; \n If the generated code includes any new third-party API call, insert the following trigger keyword at the beginning of the ‘message’:‘[THIRD_PARTY_API_TRIGGER]’. For example, ‘[THIRD_PARTY_API_TRIGGER] This code uses the OpenWeather API for fetching weather data.’\n Keep the generated message simple and conversational, Do not include any phrases like "Here's the code for your web app… or Here is the implementation etc" as the code is for internal purposes only. Do not add any instructions or unnecessary text or code in "message". And place the react code in "react_code". Do not include react code in the "message". Ensure that the "message" contains only plain conversation text, while "react_code" contains the react code only.`;
      instructions = instructions.replace('{reactCode}', reactCode);
      const assistant = await openai.beta.assistants.update(process.env.DEV_ASSISTANT_ID,{
        name: "AI Assistant",
        instructions,
        description: 'You are an AI assistant who assist with create, editing and improving React codebases with tailwind, custom CSS and Javascript only',
        model: "gpt-4o-mini",
        temperature: 0.1,
        top_p: 0.9,
        response_format: "auto",
        tools:[],
        tool_resources: {}
        // response_format:{ type: "json_schema", json_schema: {"strict": true,"name": "chat_response", "schema": {
        //     "type": "object",
        //     "properties": {
        //       "message": {
        //         "type": "string",
        //         "description": "The text message to be displayed in the chat window."
        //       },
        //       "react_code": {
        //         "type": "string",
        //         "description": "The React code output when needed without graph."
        //       }
        //     },
        //     "required": [
        //       "message",
        //       "react_code"
        //     ],
        //     "additionalProperties": false
        // }}}
      });
      console.log("assistant", assistant);
      res.status(200).json({
        assistant: assistant,
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  },

  runAssistantConversation: async () => {
    try {
      let reactCode = `function SolarEnergyApp() {
        const [latitude, setLatitude] = React.useState('');
        const [longitude, setLongitude] = React.useState('');
        const [startDate, setStartDate] = React.useState('');
        const [endDate, setEndDate] = React.useState('');
        const [solarData, setSolarData] = React.useState(null);
        const [loading, setLoading] = React.useState(false);
        const [error, setError] = React.useState(null);
      
        const fetchSolarData = async () => {
          setLoading(true);
          setError(null);
          try {
            const response = await fetch(\`https://api.solcast.com.au/world_solar_radiation/estimated_actuals?latitude=\${latitude}&longitude=\${longitude}&start=\${startDate}&end=\${endDate}&api_key=YOUR_API_KEY\`);
            if (!response.ok) {
              throw new Error('Failed to fetch solar energy data');
            }
            const data = await response.json();
            setSolarData(data);
          } catch (err) {
            setError('Failed to fetch solar energy data');
          } finally {
            setLoading(false);
          }
        };
      
        return React.createElement('div', { className: 'min-h-screen bg-gradient-to-br from-green-400 to-blue-500 flex flex-col items-center justify-center p-4' },
          React.createElement('div', { className: 'bg-white rounded-lg shadow-2xl p-8 w-full max-w-md' },
            React.createElement('header', { className: 'flex items-center justify-between mb-6' },
              React.createElement('h1', { className: 'text-3xl font-bold text-gray-800' }, 'Solar Energy Data'),
              React.createElement(LucideIcons.Sun, { className: 'w-10 h-10 text-yellow-500' })
            ),
            React.createElement('div', { className: 'space-y-4' },
              React.createElement('div', { className: 'relative' },
                React.createElement(LucideIcons.MapPin, { className: 'absolute top-3 left-3 text-gray-400' }),
                React.createElement('input', {
                  type: 'text',
                  value: latitude,
                  onChange: (e) => setLatitude(e.target.value),
                  placeholder: 'Latitude',
                  className: 'w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                })
              ),
              React.createElement('div', { className: 'relative' },
                React.createElement(LucideIcons.MapPin, { className: 'absolute top-3 left-3 text-gray-400' }),
                React.createElement('input', {
                  type: 'text',
                  value: longitude,
                  onChange: (e) => setLongitude(e.target.value),
                  placeholder: 'Longitude',
                  className: 'w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                })
              ),
              React.createElement('div', { className: 'relative' },
                React.createElement(LucideIcons.Calendar, { className: 'absolute top-3 left-3 text-gray-400' }),
                React.createElement('input', {
                  type: 'date',
                  value: startDate,
                  onChange: (e) => setStartDate(e.target.value),
                  className: 'w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                })
              ),
              React.createElement('div', { className: 'relative' },
                React.createElement(LucideIcons.Calendar, { className: 'absolute top-3 left-3 text-gray-400' }),
                React.createElement('input', {
                  type: 'date',
                  value: endDate,
                  onChange: (e) => setEndDate(e.target.value),
                  className: 'w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
                })
              ),
              React.createElement('button', {
                onClick: fetchSolarData,
                className: 'w-full bg-blue-500 text-white rounded-md py-3 font-semibold hover:bg-blue-600 transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50'
              }, 'Get Solar Data')
            )
          ),
          solarData && React.createElement('div', { className: 'mt-8 bg-white rounded-lg shadow-2xl p-6 w-full max-w-md' },
            React.createElement('h2', { className: 'text-2xl font-bold mb-4 text-gray-800' }, 'Solar Energy Output'),
            React.createElement('pre', { className: 'bg-gray-100 p-4 rounded-md overflow-auto max-h-60 text-sm' },
              JSON.stringify(solarData, null, 2)
            )
          ),
          error && React.createElement('div', { className: 'mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative', role: 'alert' },
            React.createElement('strong', { className: 'font-bold' }, 'Error: '),
            React.createElement('span', { className: 'block sm:inline' }, error)
          ),
          loading && React.createElement('div', { className: 'mt-4 flex items-center justify-center' },
            React.createElement('div', { className: 'animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500' })
          )
        );
      }
      return SolarEnergyApp;`;
      const threadId = "thread_60jcKkCJjeJ0ZpMrGrD8Bha9";
      // const userMessage = 'Here is my React code, which we will be working on for my request. Dont modify now, just have a look at my code. Are you ready for my next request? Code:'+ reactCode;
      const userMessage = 'create counter app'
      await addMessageToThread(threadId, userMessage);

      // const imagePath = './path-to-image.jpg'; // Replace with your image file path
      // await addImageToThread(threadId, imagePath);

      console.log("Running assistant on thread...");
      await runAssistantOnThread(threadId);
    } catch (error) {
      console.error("Error in assistant conversation:", error);
    }
  },

  tryGraphMaking: async () => {
    try {
      let userPrompt =
        "Generate a bar chart showing sales of North, East, and West regions.";
      let prompt = `You are a decision-maker. Find best tool to return it best and correct output: 
        Here is my input = ${userPrompt}`;

      const tools = [chartGenerationTool];

      const response = await axios.post(
        "https://api.anthropic.com/v1/messages",
        {
          model: "claude-3-5-sonnet-20240620", // Use the appropriate model
          max_tokens: 8000,
          tools,
          messages: [
            {
              role: "user",
              content: prompt,
            },
          ],
        },
        {
          headers: {
            "content-type": "application/json",
            "x-api-key": process.env["ANTHROPIC_API_KEY"],
            "anthropic-version": "2023-06-01",
          },
        }
      );

      console.log(response.data);

      // Check if the response indicates the use of the chart generator tool
      const selectedTool = response.data.content[1].name; // Assuming the response contains a 'tool' field
      if (selectedTool === "chartGenerator") {
        // Prepare the input for the tool's execute function
        const input = { userInput: userPrompt };
        const chartData = await chartGenerationTool.execute(input);
        console.log("Generated Chart Data:", chartData);
      } else {
        console.error("No suitable tool selected or tool execution failed.");
      }
    } catch (error) {
      console.error("Error calling Anthropic API:", error);
    }
  },
};

const chartGenerationTool = {
  name: "chartGenerator",
  description: "Generates graph data for Chart.js based on user input.",
  input_schema: {
    // Define the expected input structure for the tool
    type: "object",
    properties: {
      userInput: {
        type: "string",
        description:
          "A description of the graph you want to generate, including type and data.",
      },
    },
    required: ["userInput"], // This field is required
  },
  execute: async function (input) {
    const { userInput } = input; // Destructure the user input from the input schema
    let prompt = `
      You are a tool that generates graph data for Chart.js. Based on the input provided, return a structured JSON output.
      The output should contain:
      1. Chart type (e.g., line, bar, pie).
      2. Labels (X-axis or categories).
      3. Data for Y-axis or series.
      4. Background colors.

      Here is the user input: "${userInput}"`;

    // Call the Anthropic API to generate the chart data
    const response = await axios.post(
      "https://api.anthropic.com/v1/messages",
      {
        model: "claude-3-5-sonnet-20240620", // Using Claude model
        max_tokens: 8000,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
      },
      {
        headers: {
          "content-type": "application/json",
          "x-api-key": process.env["ANTHROPIC_API_KEY"],
          "anthropic-version": "2023-06-01",
        },
      }
    );

    const chartData = response.data;
    return chartData;
  },
};

addMessageToThread = async (threadId, messageText) => {
  try {
    const message = await openai.beta.threads.messages.create(
      threadId,
      {
        role: "user",
        content: messageText
      }
    );

    console.log('Message Added:', message);
    return message.data;
  } catch (error) {
    console.error('Error adding message to thread:', error);
  }
};

addImageToThread = async (threadId, imagePath) => {
  try {
    // Read the image file
    const imageFile = fs.createReadStream(path.resolve(imagePath));

    // Upload the image file and add it to the conversation
    const response = await openai.beta.threads.messages.create(
      threadId,
      {
        role: "user",
        content: imageFile
      }
    );
    console.log('Image Added:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error adding image to thread:', error);
  }
};

const runAssistantOnThread = async (threadId) => {
  try {
    let chatResponse = ``;
    const run = await openai.beta.threads.runs.stream(
      threadId,
      { assistant_id: process.env.NODE_ENV == 'staging' || process.env.NODE_ENV == 'production' ? process.env.ASSISTANT_ID : process.env.DEV_ASSISTANT_ID }
    )
      .on('textDelta', (textDelta, snapshot) => {
        // Log the latest text delta
        chatResponse += textDelta.value;
        process.stdout.write(textDelta.value);
      })
      .on('textCreated', (text) => {
        console.log(`textCreated${JSON.stringify(text)}`);
      })
      .on('toolCallCreated', (toolCall) => {
        console.log(`\nassistant > Tool invoked: ${toolCall.type}\n`);
      })

    const finalFunctionCall = await run.finalMessages();
    console.log('Run end:', finalFunctionCall, chatResponse);
    return run;
  } catch (error) {
    console.error('Error running assistant:', error);
  }
};


async function CALLAI(parentResponse, prompts, aiData) {
  if (parentResponse && parentResponse.ToolTYPE === 'AIBASED') {
    let childPrompt = prompts?.childPrompt?.aibased;
    let reactCode = `function SolarEnergyApp() {
      const [latitude, setLatitude] = React.useState('');
      const [longitude, setLongitude] = React.useState('');
      const [startDate, setStartDate] = React.useState('');
      const [endDate, setEndDate] = React.useState('');
      const [solarData, setSolarData] = React.useState(null);
      const [loading, setLoading] = React.useState(false);
      const [error, setError] = React.useState(null);
    
      const fetchSolarData = async () => {
        setLoading(true);
        setError(null);
        try {
          const response = await fetch(\`https://api.solcast.com.au/world_solar_radiation/estimated_actuals?latitude=\${latitude}&longitude=\${longitude}&start=\${startDate}&end=\${endDate}&api_key=YOUR_API_KEY\`);
          if (!response.ok) {
            throw new Error('Failed to fetch solar energy data');
          }
          const data = await response.json();
          setSolarData(data);
        } catch (err) {
          setError('Failed to fetch solar energy data');
        } finally {
          setLoading(false);
        }
      };
    
      return React.createElement('div', { className: 'min-h-screen bg-gradient-to-br from-green-400 to-blue-500 flex flex-col items-center justify-center p-4' },
        React.createElement('div', { className: 'bg-white rounded-lg shadow-2xl p-8 w-full max-w-md' },
          React.createElement('header', { className: 'flex items-center justify-between mb-6' },
            React.createElement('h1', { className: 'text-3xl font-bold text-gray-800' }, 'Solar Energy Data'),
            React.createElement(LucideIcons.Sun, { className: 'w-10 h-10 text-yellow-500' })
          ),
          React.createElement('div', { className: 'space-y-4' },
            React.createElement('div', { className: 'relative' },
              React.createElement(LucideIcons.MapPin, { className: 'absolute top-3 left-3 text-gray-400' }),
              React.createElement('input', {
                type: 'text',
                value: latitude,
                onChange: (e) => setLatitude(e.target.value),
                placeholder: 'Latitude',
                className: 'w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              })
            ),
            React.createElement('div', { className: 'relative' },
              React.createElement(LucideIcons.MapPin, { className: 'absolute top-3 left-3 text-gray-400' }),
              React.createElement('input', {
                type: 'text',
                value: longitude,
                onChange: (e) => setLongitude(e.target.value),
                placeholder: 'Longitude',
                className: 'w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              })
            ),
            React.createElement('div', { className: 'relative' },
              React.createElement(LucideIcons.Calendar, { className: 'absolute top-3 left-3 text-gray-400' }),
              React.createElement('input', {
                type: 'date',
                value: startDate,
                onChange: (e) => setStartDate(e.target.value),
                className: 'w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              })
            ),
            React.createElement('div', { className: 'relative' },
              React.createElement(LucideIcons.Calendar, { className: 'absolute top-3 left-3 text-gray-400' }),
              React.createElement('input', {
                type: 'date',
                value: endDate,
                onChange: (e) => setEndDate(e.target.value),
                className: 'w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
              })
            ),
            React.createElement('button', {
              onClick: fetchSolarData,
              className: 'w-full bg-blue-500 text-white rounded-md py-3 font-semibold hover:bg-blue-600 transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50'
            }, 'Get Solar Data')
          )
        ),
        solarData && React.createElement('div', { className: 'mt-8 bg-white rounded-lg shadow-2xl p-6 w-full max-w-md' },
          React.createElement('h2', { className: 'text-2xl font-bold mb-4 text-gray-800' }, 'Solar Energy Output'),
          React.createElement('pre', { className: 'bg-gray-100 p-4 rounded-md overflow-auto max-h-60 text-sm' },
            JSON.stringify(solarData, null, 2)
          )
        ),
        error && React.createElement('div', { className: 'mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative', role: 'alert' },
          React.createElement('strong', { className: 'font-bold' }, 'Error: '),
          React.createElement('span', { className: 'block sm:inline' }, error)
        ),
        loading && React.createElement('div', { className: 'mt-4 flex items-center justify-center' },
          React.createElement('div', { className: 'animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500' })
        )
      );
    }
    return SolarEnergyApp;`;
    childPrompt = childPrompt.replace('{userInput}', aiData.customPrompt);
    childPrompt = childPrompt.replace('{reactCode}', reactCode);
    const mesg = await client.messages.create({
      max_tokens: 8192,
      messages: [{ role: 'user', content: childPrompt }],
      model: 'claude-3-5-sonnet-20240620',
    });
    let childResponse = mesg.content[0].text.trim();
    console.log(childResponse);
    // let message = (childResponse).split("@$@$@$");
    // let obj = { code: message[0], message: message[1] };
    const app = await App.findOne({ _id: "66e2cbe8ecccb0a4162b2b0c" });
    app.componentCode = childResponse;
    await app.save()
    return app;
  }
  else if (parentResponse && parentResponse.ToolTYPE === 'APIBASED') {
    let childPrompt = prompts?.childPrompt?.apibased;
    childPrompt = childPrompt.replace('{userInput}', aiData.customPrompt);
    // console.log(childPrompt)
    const app = await App.findOne({ _id: "66e2cbe8ecccb0a4162b2b0c" });
    // app.componentCode = childResponse;
    // await app.save()
    return app;
  }
}


