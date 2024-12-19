const systemPromptSession = require('../models/chat/systemPrompt.model');
const App = require('../models/app');
const { Anthropic } = require('@anthropic-ai/sdk');
const { OpenAI } = require("openai");
const fs = require('fs');
const path = require('path');
// const { z } = require("zod");
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

      // const myAssistant = await openai.beta.assistants.retrieve(
      //   process.env.DEV_PREMADE_ASSISTANT_ID
      // );
    
      // console.log(myAssistant);
      // res.status(200).json({
      //   assistant: myAssistant,
      // });



      const assistant = await openai.beta.assistants.update(process.env.DEV_ASSISTANT_ID,{
        name: "AI Assistant",
        instructions,
        description: 'You are an AI assistant who assist with create, editing and improving React codebases with tailwind, custom CSS and Javascript only. And capable of real-time API validation.',
        model: "gpt-4o-mini",
        temperature: 0.1,
        top_p: 0.9,
        response_format: "auto",
        tools:[{
          type: "function",
          function: {
            name: 'search_from_internet',
            description: "Perform real-time internet searches for latest information and API documentation",
            parameters: {
              type: "object",
              properties: {
                query: {
                  type: "string",
                  description: "Search query for finding specific information or documentation",
                },
                numResults: {
                  type: "integer",
                  description: "Number of search results to return",
                  default: 5,
                },
                searchType: {
                  type: "string",
                  enum: ["api_docs", "latest_news", "technical_info", "general"],
                  description: "Type of search to perform",
                  default: "api_docs"
                }
              },
              required: ["query"],
            },
          },
        },
        {
          type: "function",
          function: {
            name: "validate_api_endpoint",
            description: "Validate and verify API endpoints against latest documentation",
            parameters: {
              type: "object",
              properties: {
                apiName: {
                  type: "string",
                  description: "Name of the API to validate"
                },
                currentEndpoint: {
                  type: "string",
                  description: "Current endpoint URL to verify"
                },
                version: {
                  type: "string",
                  description: "Current API version",
                  default: "latest"
                }
              },
              required: ["apiName", "currentEndpoint"]
            }
          }
      }
 ],
        // tool_resources: {"file_search": {"vector_store_ids":[]}}
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


  getAssistantAI: async (req, res) => {
    try{
      // const myAssistant = await openai.beta.assistants.retrieve(
      //   "asst_M2KQmzzSVCrDBe3AbEXiTYru"
      // );
      return res.status(200).json({
        assistant: myAssistant,
      });
    }catch(error){
      return res.status(500).json({
        error
      });
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



