const chatSession = require('./../../models/chat/chatSession.model');
const userSession = require('./../../models/chat/globalSession.model');
const Api = require('./../../models/api.model');
const { v4: uuidv4 } = require('uuid');
const App = require('../../models/app');
const { default: axios } = require('axios');
const { OpenAI } = require("openai");
const { default: mongoose } = require('mongoose');
const { URL, URLSearchParams } = require('url');
const sharp = require('sharp');
const systemPromptSession = require('../../models/chat/systemPrompt.model');
const { default: Anthropic } = require('@anthropic-ai/sdk');
const aiService = require("../../service/aiService")

const generateSessionId = () => {
  return uuidv4();  // Generates a unique UUID
};
const openai = new OpenAI({ apiKey: process.env.OPEN_AI_KEY });

const client = new Anthropic({
  apiKey: process.env['ANTHROPIC_API_KEY'],
});

const startChatSession = async (userId, agentId, message, imageArray) => {
  try {
    const newChatSession = await chatSession.create({
      agentId: new mongoose.Types.ObjectId(agentId), 
      userId: new mongoose.Types.ObjectId(userId),
      sessionId: generateSessionId(), // Create a unique sessionId
      conversationId: generateSessionId(), // Create a unique sessionId
      startTime: new Date(),
      lastTime: new Date(),
      date: new Date(),
      messages: [
        {
          sno: 1,
          role: 'user',
          content: message,
          image: imageArray
        }
      ]
    });

    // This can be done asynchronously
    userSession.findOneAndUpdate(
      { userId },
      { $push: { chatsessions: newChatSession._id }, $setOnInsert: { userId, timeSpent: 0, date: new Date() } },
      { upsert: true, new: true }
    ).exec().catch(error => console.error("Error updating user session:", error));

    return newChatSession; // Return the new session
  } catch (error) {
    console.error("Error starting chat session:", error);
    throw new Error('Failed to start chat session');
  }
};

const fetchPreviousChat = async (userId, agentId) => {
  try {
    // Find the ongoing chat session for the user
    const ongoingSession = await chatSession.findOne({ userId, agentId });

    if (!ongoingSession) {
      return []; // Return the updated session
    }

    return ongoingSession.messages; // Return the updated session
  } catch (error) {
    console.error("Error fetching previous chat:", error);
    throw new Error('Failed to fetch previous chat');
  }
};

const updateAIMessageToChatSession = async (userId, agentId, code, message) => {
  try {
    // Find the existing chat session
    const oldChatSession = await chatSession
      .findOne({ agentId: new mongoose.Types.ObjectId(agentId), userId: new mongoose.Types.ObjectId(userId) })
      .lean();

    // Ensure oldChatSession exists before proceeding
    if (!oldChatSession) {
      throw new Error('Chat session not found');
    }

    // Push a new message to the existing chat session's messages array
    const newChatSession = await chatSession.updateOne(
      { agentId: new mongoose.Types.ObjectId(agentId), userId: new mongoose.Types.ObjectId(userId) },
      {
        $set: { lastTime: new Date() },
        $push: {
          messages: {
            sno: oldChatSession.messages.length + 1,
            role: 'assistant',
            content: message,
            code: code
          },
        },
      },
      { new: true }
    );

    return newChatSession; // Return the updated session
  } catch (error) {
    console.error('Error updating AI message:', error);
    throw new Error('Failed to update AI message in chat session');
  }
};

const updateHumanMessageToChatSession = async (userId, agentId, message, imageArray) => {
  try {
    // Find the existing chat session
    const oldChatSession = await chatSession
      .findOne({ agentId: new mongoose.Types.ObjectId(agentId), userId: new mongoose.Types.ObjectId(userId) })
      .lean();

    // Ensure oldChatSession exists before proceeding
    if (!oldChatSession) {
      throw new Error('Chat session not found');
    }

    // Push a new message to the existing chat session's messages array
    const newChatSession = await chatSession.updateOne(
      { agentId: new mongoose.Types.ObjectId(agentId), userId: new mongoose.Types.ObjectId(userId)
      },
      {
        $set: { lastTime: new Date() },
        $push: {
          messages: {
            sno: oldChatSession.messages.length + 1,
            role: 'user',
            content: message,
            image: imageArray
          },
        },
      },
      { new: true }
    );

    return newChatSession; // Return the updated session
  } catch (error) {
    console.error('Error updating human message:', error);
    throw new Error('Failed to update human message in chat session');
  }
};

const addMessageToThread = async (threadId, messageText) => {
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

const addImageToThread = async (threadId, content, image) => {
  try {
    console.log("Calling new image...........................")
    console.log(image);
    const response = await openai.beta.threads.messages.create(threadId, {
      role: "user",
      content: [
        {
          type: "text",
          text: content,
        },
        {
          type: "image_url",
          image_url: {
            url: image,
            detail: "auto",
          },
        },
      ],
    });
    console.log("Image Added:", response);
    return response;
  } catch (error) {
    console.error("Error adding image to thread:", error);
  }
};

async function search_from_internet({ query, numResults = 5 }) {
  try {
    console.log("Called Internet.......")
    const apiKey = process.env.SERPAPI_API_KEY; // Use SerpAPI key
    const response = await axios.get("https://serpapi.com/search.json", {
      params: {
        q: query,                      // Search query
        num: numResults,               // Number of results
        google_domain: "google.com",    // Google domain
        api_key: apiKey,               // Your SerpAPI key
      },
    });
    console.log("Called.......", response)
    // Parse the response based on SerpAPI's format
    const results = response.data.organic_results;
    return results.map((result) => ({
      title: result.title,
      link: result.link,
      snippet: result.snippet,
    }));
  } catch (error) {
    console.error("Error during search:", error);
    throw new Error("Search failed");
  }
}

async function validate_api_endpoint({ apiName, currentEndpoint }) {
  console.log("validate_api_endpoint calling...");

  try {
    // Step 1: Use `search_from_internet` to find information about the API
    const searchQuery = `API status and details for ${apiName} at endpoint ${currentEndpoint}`;
    const searchResults = await search_from_internet({ query: searchQuery });

    // Log search results
    console.log("Search results:", searchResults);

    // Step 2: Extract relevant information for the prompt
    const topSearchResults = searchResults.slice(0, 3); // Use the top 3 results
    const summarizedInfo = topSearchResults.map(
      (result, index) => `${index + 1}. ${result.title}: ${result.snippet} (URL: ${result.link})`
    ).join("\n");

    // Step 3: Update the validation prompt with internet results
    const prompt = `
      <API_validation_protocol>

      1. WHEN TO VALIDATE:
          A. Before suggesting API integrations
          B. When encountering deprecated endpoints
          C. During version compatibility checks
          D. When updating existing integrations

      2. VALIDATION STEPS:
          A. Check current endpoint status
          B. Verify version compatibility
          C. Confirm authentication methods
          D. Test for breaking changes

      Additional Information from the Internet:
      ${summarizedInfo}

      Here is the input: API Name: "${apiName}" and Current Endpoint: "${currentEndpoint}"`;

    // Step 4: Validate using the modified prompt
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

    const resultData = response.data.content[0].text;
    console.log("Validation results:", resultData);
    return resultData;
  } catch (error) {
    console.error("Error validating API endpoint:", error);
    throw new Error("Validation failed");
  }
}


async function generate_graph({ userInput }) {
  console.log("Chart Generator calling.......................")
  try {
    let prompt = `
      You are a tool that generates graph data for Chart.js. Based on the input provided, return a structured JSON output.
      The output should contain:
      1. Chart type (e.g., line, bar, pie).
      2. Labels (X-axis or categories).
      3. Data for Y-axis or series.
      4. Background colors.

      Here is the user input: "${userInput}"`;

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
  } catch (error) {
    console.error("Error generating chart data:", error);
    throw new Error("Chart generation failed");
  }
}

// The actual implementation of the `determineApi` function using OpenAI function calling
async function get_api_url() {
  console.log("determine Api calling.......................")
  const apis_array = await Api.find({});
  const tools = apis_array.map(api => ({
    name: api.key,
    api: api.api,
    description: api.purpose, // Keep the description concise
  }));

  // try {
  //   // Create a prompt for the model to decide the best API
  //   let prompt = `You are a decision-maker. Based on my input return the most relevant API only, without any extra content: 
  //   Here is my input = ${userPrompt}`;

  //   const response = await axios.post('https://api.anthropic.com/v1/messages', {
  //     model: "claude-3-5-sonnet-20240620",  // Use the appropriate model
  //     max_tokens: 8000,
  //     tools,
  //     messages: [
  //       {
  //         role: "user",
  //         content: prompt,
  //       }
  //     ],
  //   }, {
  //     headers: {
  //       "content-type": "application/json",
  //       "x-api-key": process.env['ANTHROPIC_API_KEY'],
  //       "anthropic-version": "2023-06-01",
  //     }
  //   });
  //   console.log(response);

  //   if (response.data.content[1].type === 'tool_use') {
  //     const tool = apis_array.filter(api => {api.key === response.data.content[1].name});
  //     return tool.output; // Return the selected API
  //   } else {
  //     console.log('No API found');
  //     return null;
  //   }
  // } catch (error) {
  //   console.error("Error making determineApi call via OpenAI:", error.response ? error.response.data : error.message);
  //   throw error;
  // }

  return tools;
}

const handleRequiresAction = async (data, runId, threadId, onPartialResponse, app) => {
  try {
    const toolOutputs = await Promise.all(data.required_action.submit_tool_outputs.tool_calls.map(async (toolCall) => {
      if (toolCall.function.name === "search_from_internet") {
        const { query, numResults } = JSON.parse(toolCall.function.arguments);
        const results = await search_from_internet({ query, numResults });
        return {
          tool_call_id: toolCall.id,
          output: JSON.stringify(results),
        };
      } 
      else if (toolCall.function.name === "validate_api_endpoint") {
        const { apiName, currentEndpoint } = JSON.parse(toolCall.function.arguments);
        const results = await validate_api_endpoint({ apiName, currentEndpoint });
        return {
          tool_call_id: toolCall.id,
          output: JSON.stringify(results),
        };
      } 
      // else if (toolCall.function.name === "generate_graph") {
      //   const { userInput } = JSON.parse(toolCall.function.arguments);
      //   const chartData = await generate_graph({ userInput });
      //   return {
      //     tool_call_id: toolCall.id,
      //     output: JSON.stringify(chartData),
      //   };
      // } 
      // else if (toolCall.function.name === "get_api_url") {
      //   const data = await get_api_url();
      //   return {
      //     tool_call_id: toolCall.id,
      //     output: JSON.stringify(data),
      //   };
      // }
    }));

    // Filter out any undefined outputs
    const filteredOutputs = toolOutputs.filter(output => output !== undefined);
    // Submit all the tool outputs at the same time
    const resultObj = await submitToolOutputs(filteredOutputs, runId, threadId, onPartialResponse, app);
    return resultObj;
  } catch (error) {
    console.error("Error processing required action:", error);
  }
};

const submitToolOutputs = async (toolOutputs, runId, threadId, onPartialResponse, app) => {
  try {
    console.log
    const obj = { message: "", code: "", streaming: false };
    let chatResponse = "";
    let isInsideCodeBlock = false;
    let codeBlockBuffer = "";
    const stream = openai.beta.threads.runs.submitToolOutputsStream(threadId, runId, { tool_outputs: toolOutputs })
      .on("textDelta", (textDelta) => {
        chatResponse += textDelta.value;
        const parts = textDelta.value.split("```");
        parts.forEach((part, index) => {
          // Check if the part contains a code block
          if (part.includes("``")) {
            isInsideCodeBlock = false;
          }
          if (isInsideCodeBlock) {
            // Call the callback to stream partial responses
            onPartialResponse({
              message: chatResponse,
              fullChatResponse: chatResponse,
              streaming: true,
              code: obj.code,
              codeFound: true,
            });
            if (index % 2 !== 0) {
              codeBlockBuffer += part;
            }
          } else {
            if (index % 2 === 0) {
              obj.message += part;
              obj.streaming = true;
              // Call the callback to stream partial responses
              onPartialResponse({
                message: textDelta.value,
                fullChatResponse: chatResponse,
                streaming: true,
                code: "",
                codeFound: false,
              });
            } else {
              codeBlockBuffer = part;
              isInsideCodeBlock = true;
              // Call the callback to stream partial responses
              onPartialResponse({
                message: chatResponse,
                fullChatResponse: chatResponse,
                streaming: true,
                code: obj.code,
                codeFound: true,
              });
            }
          }
        });
    });

    const finalFunctionCall = await stream.finalMessages();
    console.log("Run end 22:", finalFunctionCall, chatResponse);


    return obj;
  } catch (error) {
    console.error("Error submitting tool outputs:", error);
  }
};

async function getMediaType(url) {
  try {
      const response = await axios.head(url);
      return response.headers['content-type'];
  } catch (error) {
      console.error('Error:', error.message);
  }
}

// Helper function to fetch image as base64 and reduce resolution
async function fetchAndResizeImageAsBase64(imageUrl) {
  try {
    // Fetch the image and reduce its resolution to 500X500 (or any desired dimensions)
    const imageBuffer = await axios.get(imageUrl, { responseType: "arraybuffer" });
    
    // Resize the image using sharp
    const resizedImageBuffer = await sharp(imageBuffer.data)
      .resize(500, 500) // You can adjust the width and height as needed
      .toBuffer();
    
    // Convert resized image to base64
    return resizedImageBuffer.toString('base64');
  } catch (error) {
    console.error("Error fetching and resizing image:", error);
    return null;
  }
}

const aiAssistantChatStart = async (userId, userMessage, app, image = null, isStartChat, onPartialResponse) => {
  let parentResponse = '';
  if (isStartChat && app.agent_type.length && app.agent_type == 'AI_Tool') { //only for new tool not for premades
    // const prompts = await systemPromptSession.findOne({});
    let parentPrompt = `I want you to act as a technical advisor for tool development. Based on user requirements, classify whether the tool needs:

    1. API-BASED implementation: Tools that primarily require third-party APIs, data processing, or standard programming logic
    2. AI-BASED implementation: Tools that require machine learning, natural language processing, computer vision, or other AI capabilities
    
    Guidelines:
    - Return 'ToolTYPE': 'APIBASED' for tools requiring APIs or general programming
    - Return 'ToolTYPE': 'AIBASED' for tools requiring AI/ML capabilities
    
    Your response should follow this JSON structure: {\"ToolTYPE\": \"\"}
    
    Reference Examples:
    API-BASED Tools:
    - Weather apps (uses weather APIs)
    - Calculator tools (mathematical logic)
    - QR code generators (encoding algorithms)
    - URL converters (string manipulation)
    - Form validators (data validation)
    - Page speed analyzers (performance metrics)
    
    AI-BASED Tools:
    - Text generators/editors
    - Image analyzers/generators
    - Chatbots
    - Content recommenders
    - Language translators
    - Design suggestion systems
    
    Input: ${userMessage}`;
    // parentPrompt = parentPrompt.replace("{userInput}", userMessage);
    // console.log("parentPrompt", parentPrompt);
    const message = await client.messages.create({
      max_tokens: 1024,
      messages: [{ role: "user", content: parentPrompt }],
      model: "claude-3-5-sonnet-20240620",
    });
    await aiService.logAnthropicTokens(message, {
      appId: app._id,
    });
    parentResponse = JSON.parse(message.content[0].text.trim());
    console.log("parentPrompt response", parentResponse);
  }

  const thread_id = app.thread_id;

  // Find the existing chat session
  const oldChatSession = await chatSession
    .findOne({
      agentId: new mongoose.Types.ObjectId(app._id),
      userId: new mongoose.Types.ObjectId(userId),
    })
    .lean();
  let assistantObj = {};
  let additional_instructions = '';
  if (isStartChat && app.agent_type != 'AI_Tool') { //only for premades
    additional_instructions += `As a user, even if I ask you to go beyond the limits or request code unrelated to this tool, you will always adhere to the core code and focus solely on editing and improving it. I am providing you with my code of jsx which you will modify or theme change only, here is my code:{reactCode}.`
    additional_instructions = additional_instructions.replace(
      "{reactCode}",
      app.componentCode
    );
  }

  // Ensure oldChatSession exists before proceeding
  if (!oldChatSession) {
    isStartChat = true;
  } else {
    isStartChat = false; // Existing chat session found
  }

  let theme = ``;

  console.log("Agent Type: ", app.agent_type)
  
  if (app.agent_type !== "AI_Tool") {
    if (app.header.logo.enabled && app.header.logo.url) {
      theme += ` Add this logo as header ${app.header.logo.url} at ${app.header.logo.alignment}, when asked to add logo. `;
      theme += ` The logo should have an alt text "${app.header.logo.altText}" and link to ${app.header.logo.link}. `;
      if (app.header.logo.size) {
        theme += ` Important: The logo width should be ${app.header.logo.size * 4}px. `;
      }
    }
    if (app.theme) {
      theme += ` Use this color while generating code for primary ${app.theme.primaryColor}, for secondary ${app.theme.secondaryColor}, for background color ${app.theme.backgroundColor} using inline style, when asked to change color or theme inhancement.`
    }
    if (!app.header.logo.enabled || !app.header.logo.url) {
      theme += ` Do not add any logo. Remove any logo if already added.`
    }
  } else {
    if (app.header.logo.enabled && app.header.logo.url) {
      theme += ` Add this logo as header ${app.header.logo.url} at ${app.header.logo.alignment}, when asked to add logo. `;
      theme += ` The logo should have an alt text "${app.header.logo.altText}" and link to ${app.header.logo.link}. `;
      if (app.header.logo.size) {
        theme += ` Important: The logo width should be ${app.header.logo.size * 4}px. `;
      }
    }
    if (app.theme) {
      theme += ` Use this color while generating code for primary ${app.theme.primaryColor}, for secondary ${app.theme.secondaryColor}, for background color ${app.theme.backgroundColor} using inline style.`
    }
    if (!app.header.logo.enabled || !app.header.logo.url) {
      theme += ` Do not add any logo. Remove any logo if already added.`
    }
  }

  theme += `Message Formatting Rules:
  1.Keep messages small, non technical, conversational, and relevent.
  2.Avoid phrases like "Here's the code..." or "Here is the implementation...", as the end user is not viewing any code. The code is for internal purposes only.`

  console.log(" Applied theme: ",theme)

  additional_instructions += `${theme}. Follow instruction prompt for message and code generation.`;
  if (app.agent_type !== "AI_Tool") {
    console.log("pre-made--------------------------");
    assistantObj = {
      assistant_id:
        process.env.NODE_ENV == "staging" ||
        process.env.NODE_ENV == "production"
          ? process.env.PREMADE_ASSISTANT_ID
          : process.env.DEV_PREMADE_ASSISTANT_ID,
    };
    assistantObj.additional_instructions = additional_instructions;
  } else {
    console.log("custom--------------------------");
    assistantObj = {
      assistant_id:
        process.env.NODE_ENV == "staging" ||
        process.env.NODE_ENV == "production"
          ? process.env.ASSISTANT_ID
          : process.env.DEV_ASSISTANT_ID,
    };
    // if (isStartChat) {
      assistantObj.additional_instructions = `${theme}`;
    // }
  }
  console.log("additional_instructions", additional_instructions);

  if(app.tool_type === 'AIBASED' && app.agent_type === "AI_Tool"){
    assistantObj = {
      assistant_id:
        process.env.NODE_ENV == "staging" ||
        process.env.NODE_ENV == "production"
          ? process.env.AI_ASSISTANT_ID
          : process.env.DEV_AI_ASSISTANT_ID,
    };
    assistantObj.additional_instructions = `  ${theme}`;
  }

  console.log("Assistant Obj: ",assistantObj)

  if (image) {
    try {
      const imageResponse = await addImageToThread(
        thread_id,
        userMessage,
        image
      );
      console.log("Image sent successfully", imageResponse);
    } catch (error) {
      console.error("Error uploading image", error);
    }
  } else {
    // Add user message to thread
    const messageResponse = await addMessageToThread(thread_id, userMessage);
    if (messageResponse) {
      console.log("Message sent successfully");
    }
  }

  const obj = { message: "", code: "", streaming: false };

  try {
    let chatResponse = "";
    let isInsideCodeBlock = false;
    let codeBlockBuffer = "";
    // let isInsideLastMsgBlock = false;


    // Start streaming from OpenAI or another source
    const run = await openai.beta.threads.runs
      .stream(thread_id, assistantObj)
      .on("textDelta", (textDelta) => {
        chatResponse += textDelta.value;

        const parts = textDelta.value.split("```");
        parts.forEach((part, index) => {
          // Check if the part contains a code block
          if (part.includes("``")) {
            isInsideCodeBlock = false; // Resetting this as we are about to process a last message
          }
          if (isInsideCodeBlock) {
            // Call the callback to stream partial responses
            onPartialResponse({
              message: chatResponse,
              fullChatResponse: chatResponse,
              streaming: true,
              code: obj.code,
              codeFound: true,
              // demo: 'h'
            });
            if (index % 2 !== 0) {
              codeBlockBuffer += part;
            }
          } else {
            if (index % 2 === 0) {
              obj.message += part;
              obj.streaming = true;
              // Call the callback to stream partial responses
              onPartialResponse({
                message: textDelta.value,
                fullChatResponse: chatResponse,
                streaming: true,
                code: "",
                codeFound: false,
              });
            } else {
              codeBlockBuffer = part;
              isInsideCodeBlock = true;
              // Call the callback to stream partial responses
              onPartialResponse({
                message: chatResponse,
                fullChatResponse: chatResponse,
                streaming: true,
                code: obj.code,
                codeFound: true,
              });
            }
          }
        });
      })
      .on("event", (event) => {
        if (event.event === "thread.run.completed") {
          aiService.logOpenAITokens({
            model: event.data.model,
            appId: app._id,
            aiInputToken: event.data.usage.prompt_tokens,
            aiOutputToken: event.data.usage.completion_tokens,
            aiTotalToken: event.data.usage.total_tokens
          }).catch(error => console.log("Error logging tokens:", error));
        }
      });
     

    // if (chatResponse.trim() === "") {
      for await (const event of run) {
        if (event.event === "thread.run.requires_action") {
          const resultObj = await handleRequiresAction(
            event.data,
            event.data.id,
            event.data.thread_id,
            onPartialResponse,
            app
          );
          obj.code = resultObj.code;
          obj.message = resultObj.message;
          chatResponse = resultObj.message;
        }
      }
    // }

    const finalFunctionCall = await run.finalMessages();
    console.log("Run end:", finalFunctionCall, chatResponse);

    const codeBlockRegex = /```(?:\w+)?\n([\s\S]*?)\n```/g;
    let match;
    if ((match = codeBlockRegex.exec(chatResponse)) !== null) {
      const extractedCode = match[1];
      obj.code += extractedCode.replace(/tsx/g, "");
      process.stdout.write(obj.code);
    }

    if (isStartChat) {
      console.log(
        "new chat loaded.---------------------------------------------"
      );
      // This can be done asynchronously
      startChatSession(userId, app._id, userMessage, [image === null ? "" : image])
        .catch(error => console.error("Error starting chat session:", error));
    }

    if(!isStartChat && app.agent_type !== 'AI_Tool' && oldChatSession.messages.length === 1){
      console.log(
        "Premade new chat loaded......................................."
      );
      // This can be done asynchronously
      updateHumanMessageToChatSession(userId, app._id, userMessage, [image === null ? "" : image])
        .catch(error => console.error("Error updating human message:", error));
    }

    const appDetails = await App.findOne({ _id: app._id });
    if (obj.code) {
      try {
      // let prompt = `You are an AI assistant who inhances my UI and function, and fix error if present in it, and returns code in string \"\" format. We were going to work on a React-based Javascript App. 
      // Your purpose is to assist with creating, editing and improving React codebases with tailwind CSS, custom inline CSS, and Javascript only. 
      // Create the best and most visually appealing UI, working functionality, valid syntax, and other properties according to provided my code. 
      // My code:${obj.code}\ MY requirement: ${userMessage}\n.Inhance it to best if it not equivalent to my requirement. 
      // Follow the code pattern in terms of function usage, API calls, and element creation. 
      // **Ensure that all React hooks are written with the full 'React' prefix, e.g., React.useState().**
      // Create React element without any import statement. I have this header added already import React, {useState, useEffect, useContext, useReducer, useCallback, useMemo, useRef, useImperativeHandle, useLayoutEffect, useDebugValue, useTransition, useDeferredValue, useId, useSyncExternalStore, useInsertionEffect} from 'react'; import * as LucideIcons from 'lucide-react'; import { useLocation } from 'react-router-dom'; 
      // Note: Input is code and output will be only one code file which will run as JSX. You must return code only no extra text allowed.
      // Output structure:
      //           function AppName(){
      //               ...
      //           }
      //           return AppName;`;

      // let content = [
      //   {
      //     type: "text",
      //     text: prompt,
      //   },
      // ];
      // if (image) {
      //   content.push({
      //     type: "image",
      //     source: {
      //       type: "base64",
      //       media_type: await getMediaType(image),
      //       data: await fetchAndResizeImageAsBase64(image),
      //     },
      //   });
      // }

      // const response = await axios.post(
      //   "https://api.anthropic.com/v1/messages",
      //   {
      //     model: "claude-3-5-sonnet-20240620", // Using Claude model
      //     max_tokens: 8000,
      //     messages: [
      //       {
      //         role: "user",
      //         content: content,
      //       },
      //     ],
      //   },
      //   {
      //     headers: {
      //       "content-type": "application/json",
      //       "x-api-key": process.env["ANTHROPIC_API_KEY"],
      //       "anthropic-version": "2023-06-01",
      //     },
      //   }
      // );

      // obj.code = response.data.content[0].text;

      // await openai.beta.threads.messages.create(
      //   thread_id,
      //   {
      //     role: "user",
      //     content: userMessage,
      //   },
      //   {
      //     role: "assistant",
      //     content: response.data.content[0].text,
      //   }
      // );

      const apiKeyRegex = /(your[_-\s]*)?api[_-\s]*key/i;
      const urlRegex = /fetch\((['"`])([^'"`]+)\1\)/;
      let originalApis = []; // Array to store original API objects

      // Replace URLs in the code while extracting them
      obj.code = obj.code.replace(urlRegex, (matchedUrl) => {
        // Extract the full URL from the matched string
        const fullUrl = matchedUrl.match(/(['"`])([^'"`]+)\1/)[2].replace(/\$\{encodeURIComponent\(([^)]+)\)\}/g, '${$1}'); // URL is in the second capture group
        
        // Check if the URL contains an API key pattern
        if (!apiKeyRegex.test(fullUrl)) {
          // If no API key pattern is found, return the original matched URL
          return matchedUrl.replace(/\$\{encodeURIComponent\(([^)]+)\)\}/g, '${$1}');
        }

        if (fullUrl.startsWith(process.env.BACKEND_URL)) {
          originalApis = appDetails.apis;
          return `fetch(\`${fullUrl}\`)`;
        }
        
        console.log("fullUrl", fullUrl)
        // Store the matched URL as an object in the array
        originalApis.push({ api: fullUrl });

        // Use a regex to extract existing query parameters
        const existingParams = {};
        const paramRegex = /[?&]([^=]+)=([^&]*)/g;
        let match;

        // Find and store existing parameters
        while ((match = paramRegex.exec(fullUrl)) !== null) {
          existingParams[match[1]] = match[2];
        }

        // Build a new query string with existing and new parameters
        const paramsArray = [];
        paramsArray.push(`appId=${app._id}`); // Ensure to append appId

        // Preserve existing parameters, including `${city}`
        for (const [key, value] of Object.entries(existingParams)) {
          paramsArray.push(`${key}=${value}`);
        }

        // Join parameters with '&' to form the new query string
        const newQueryString = paramsArray.join("&");
        const decodedQueryString = newQueryString.replace(/\$\{encodeURIComponent\(([^)]+)\)\}/g, '${$1}');

        // Construct the new URL with the updated query string
        return `fetch(\`${process.env.BACKEND_URL}/builder/callAPI?${decodedQueryString}\`)`;
     });

      if(obj.code.includes('Call_AI_API')){
        obj.code = obj.code.replace('Call_AI_API', `${process.env.BACKEND_URL}/builder/callAI`)
      }

      if (appDetails.apis.length > 0 && appDetails.apis[0].api.trim() !== "") {
        // Using Promise.all() with map() to handle asynchronous operations
        const results = await Promise.all(
          appDetails.apis.map(async (fetchedApi, index) => {
            const originalApi = originalApis[index];
            if (
              fetchedApi &&
              fetchedApi.api &&
              originalApi &&
              originalApi.api
            ) {
              if (
                extractDomain(fetchedApi.api) !== extractDomain(originalApi.api)
              ) {
                originalApis[index].api = fetchedApi.api; // Update originalApis
                return { success: true, index, newApi: fetchedApi.api }; // Return a success result
              }
            }
            return { success: false, index }; // Return a failure result
          })
        );

        // Check results
        results.forEach((result) => {
          if (result.success) {
            appDetails.apis[0].api = originalApis[0].api;
          } else {
            console.log(`No update needed for index ${result.index}`);
          }
        });
      }

      if(appDetails.apis.length === 0 && originalApis.length > 0){
        appDetails.apis = originalApis;
      }

      // Update app componentCode and save
      if (isStartChat && appDetails["tool_type"] === '') {
        appDetails["tool_type"] = parentResponse.ToolTYPE;
      }
      // appDetails.apis = originalApis;
      appDetails.componentCode = obj.code;
      // This can be done asynchronously
      await appDetails.save().catch(error => console.error("Error saving app details:", error));
      // Call the callback to stream partial responses
    } catch (error) {
      console.error("Error saving app details:", error);
      // Optionally throw the error if you want to handle it at a higher level
      throw new Error("Failed to save new component code");
    }
    }
    // obj.code = appDetails.componentCode;

   
    // Final return after the streaming is done
    return obj;
  } catch (error) {
    console.error("Error running assistant:", error);
    onPartialResponse({
      message: "An error occurred while processing your request.",
      streaming: false,
    });
    return {
      message: "The server had an error processing your request.",
      code: "",
    };
  }
};

// Helper function to extract the domain from a URL
function extractDomain(url) {
  const domain = url.split('/')[2]; // Extracts the domain part of the URL
  return domain;
}

module.exports = {
  startChatSession,
  fetchPreviousChat,
  updateAIMessageToChatSession,
  updateHumanMessageToChatSession,
  aiAssistantChatStart,
};
