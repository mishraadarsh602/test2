const chatSession = require('./../../models/chat/chatSession.model');
const userSession = require('./../../models/chat/globalSession.model');
const Api = require('./../../models/api.model');
const { v4: uuidv4 } = require('uuid');
const App = require('../../models/app');
const { default: axios } = require('axios');
const { OpenAI } = require("openai");
const { default: mongoose } = require('mongoose');
const { URL, URLSearchParams } = require('url');

const generateSessionId = () => {
  return uuidv4();  // Generates a unique UUID
};
const openai = new OpenAI({ apiKey: process.env.OPEN_AI_KEY });

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

    // Check if a userSession already exists for this user
    let userSessionDoc = await userSession.findOne({ userId });

    if (!userSessionDoc) {
      // Create a new user session if none exists
      userSessionDoc = await userSession.create({
        userId,
        chatsessions: [newChatSession._id],
        timeSpent: 0,
        date: new Date(),
      });
    } else {
      // Add the new chat session to the existing user session
      userSessionDoc.chatsessions.push(newChatSession._id);
      await userSessionDoc.save();
    }

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
            code: code,
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
    // A user wants to attach a file to a specific message, let's upload it.
    // const imageInVectorStore = await openai.files.create({
    //   file: fs.createReadStream(image),
    //   purpose: "vision",
    // });
    // Upload the image file and add it to the conversation
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
        // {
        //   type: "image_file",
        //   image_file: {
        //     file_name: "string",
        //   },
        // },
      ],
      // attachments: [
      //   { file_id: imageInVectorStore.id, tools: [{ type: "file_search" }] },
      // ],
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
        api_key: '82c9a514bf856c3104747d3117c65ffae63156134332cb35265088a7a8c43f52',               // Your SerpAPI key
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
  const apis_array = await Api.find({}).limit(5);
  const tools = apis_array.map(api => ({
    // name: api.key,
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
  //     return response.data.content[1].name; // Return the selected API
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

// const handleRequiresAction = async (run) => {
//   if (
//     run.required_action &&
//     run.required_action.submit_tool_outputs &&
//     run.required_action.submit_tool_outputs.tool_calls
//   ) {
//     const toolOutputs = run.required_action.submit_tool_outputs.tool_calls.map(
//       async (tool) => {
//         if (tool.function.name === "search_from_internet") {
//           const { query, numResults } = JSON.parse(tool.function.arguments);
//           const searchResults = await search_from_internet({ query, numResults });
//           return {
//             tool_call_id: tool.id,
//             output: JSON.stringify(searchResults),
//           };
//         } else if (tool.function.name === "generate_graph") {
//           const { userInput } = JSON.parse(tool.function.arguments);
//           const chartData = await generate_graph({ userInput });
//           return {
//             tool_call_id: tool.id,
//             output: JSON.stringify(chartData),
//           };
//         }
//       }
//     );

//     // Submit all tool outputs
//     if (toolOutputs.length > 0) {
//       run = await client.beta.threads.runs.submitToolOutputsAndPoll(
//         thread.id,
//         run.id,
//         { tool_outputs: toolOutputs },
//       );
//       console.log("Tool outputs submitted successfully.");
//     } else {
//       console.log("No tool outputs to submit.");
//     }

//     // Check status after submitting tool outputs
//     return handleRunStatus(run);
//   }
// };

// const handleRunStatus = async (run) => {
//   // Check if the run is completed
//   if (run.status === "completed") {
//     let messages = await client.beta.threads.messages.list(thread.id);
//     console.log(messages.data);
//     return messages.data;
//   } else if (run.status === "requires_action") {
//     console.log(run.status);
//     return await handleRequiresAction(run);
//   } else {
//     console.error("Run did not complete:", run);
//   }
// };

// Stream handler

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
      } else if (toolCall.function.name === "generate_graph") {
        const { userInput } = JSON.parse(toolCall.function.arguments);
        const chartData = await generate_graph({ userInput });
        return {
          tool_call_id: toolCall.id,
          output: JSON.stringify(chartData),
        };
      } else if (toolCall.function.name === "get_api_url") {
        const data = await get_api_url();
        return {
          tool_call_id: toolCall.id,
          output: JSON.stringify(data),
        };
      }
    }));

    // Filter out any undefined outputs
    const filteredOutputs = toolOutputs.filter(output => output !== undefined);
    // Submit all the tool outputs at the same time
    const obj = await submitToolOutputs(filteredOutputs, runId, threadId, onPartialResponse, app);
    return obj;
  } catch (error) {
    console.error("Error processing required action:", error);
  }
};

const submitToolOutputs = async (toolOutputs, runId, threadId, onPartialResponse, app) => {
  try {
    console.log(toolOutputs)
    const obj = { message: "", code: "", streaming: false };
    let messageContent = "";  // Separate variable to store message key's value
    let chatResponse = "";  // Separate variable to store message key's value
    let isStreamingMessage = false;
    let isMessageStarted = false;
    const stream = openai.beta.threads.runs
      .submitToolOutputsStream(threadId, runId, { tool_outputs: toolOutputs })
      .on("textDelta", (textDelta) => {
        const delta = textDelta.value;
        chatResponse += textDelta.value;
        console.log(delta)
      })
      .on("end", () => {
        console.log(messageContent, chatResponse)
        if (messageContent.trim() !== "") {
          // When streaming is done, send the react_code and graph_output
          const reactCode = JSON.parse(chatResponse).react_code;
          // const graphOutput = JSON.parse(chatResponse).graph_output;

          // console.log(reactCode, graphOutput);

          obj.code = reactCode;
          obj.message = messageContent;
          // obj.graph = graphOutput;
        }
      });
    


    const finalFunctionCall = await stream.finalMessages();
    console.log("Run end:", finalFunctionCall, chatResponse);

    console.log("RUN LAST 2.................................");
    return obj;
  } catch (error) {
    console.error("Error submitting tool outputs:", error);
  }
};

const aiAssistantChatStart = async (userId, userMessage, app, image = null, isStartChat, onPartialResponse) => {

  const thread_id = app.thread_id;

  // Find the existing chat session
  const oldChatSession = await chatSession
    .findOne({
      agentId: new mongoose.Types.ObjectId(app._id),
      userId: new mongoose.Types.ObjectId(userId),
    })
    .lean();

  // Ensure oldChatSession exists before proceeding
  if (!oldChatSession) {
    isStartChat = true;
    if (isStartChat) {
      console.log(
        "new chat loaded.---------------------------------------------"
      );
      await startChatSession(userId, app._id, userMessage, [
        image === null ? "" : image,
      ]);
    }
  }
  let theme = ``;
  if (app.header.logo.enabled && app.header.logo.url) {
    theme += `add this logo as header ${app.header.logo.url} at ${app.header.logo.alignment}`
  }
  if (app.theme) {
    theme += `use this color while generating code for primary ${app.theme.primaryColor}, for secondary ${app.theme.secondaryColor}, for background color ${app.theme.backgroundColor} using inline style`
  }


  let assistantObj = {};
  let additional_instructions = `As a user, even if I ask you to go beyond the limits or request code unrelated to the provided project, you will always adhere to the core code and focus solely on editing and improving it. I am providing you with my code of jsx which you will modify or theme change only, here is my code:{reactCode} \nPLease follows this pattern for function and the way I called API and created React element without any import statement. 
  If It is API based tool, then call the get_api_url tool to retrieve a list of relevant APIs and select the best match. If No match found, then must call internet Search tool to find relevant API
  ${theme}`;
  additional_instructions = additional_instructions.replace(
    "{reactCode}",
    app.componentCode
  );
  if (app.agent_type !== "AI_Tool") {
    console.log("pre-made--------------------------")
    assistantObj = {
      assistant_id: process.env.PREMADE_ASSISTANT_ID,
      additional_instructions: additional_instructions,
    };
  } else {
    console.log("custom--------------------------")
    assistantObj = { assistant_id: process.env.ASSISTANT_ID };
  }
  console.log("additional_instructions",additional_instructions)

  if (image) {
    try {
      const imageResponse = await addImageToThread(thread_id, userMessage, image);
      console.log("Image sent successfully", imageResponse);
    } catch (error) {
      console.error("Error uploading image", error);
    }
  }else{
    // Add user message to thread
    const messageResponse = await addMessageToThread(thread_id, userMessage);
    if (messageResponse) {
      console.log("Message sent successfully");
    }
  }


  let obj = { message: "", code: "", streaming: false };

  try {
    let messageContent = "";  // Separate variable to store message key's value
    let chatResponse = "";  // Separate variable to store message key's value
    let isStreamingMessage = false;
    let isMessageStarted = false;
    
    // Start streaming from OpenAI or another source
    const run = await openai.beta.threads.runs
      .stream(thread_id, assistantObj)
      .on("textDelta", (textDelta) => {
        const delta = textDelta.value;
        chatResponse += textDelta.value;
        // Check if we should start streaming the message content
        if (!isStreamingMessage && delta.includes("message")) {
          // The message part has begun, set flag to start streaming
          isStreamingMessage = true;
          isMessageStarted = true;
        }
        // Continue streaming message if it has already started
        else if (isStreamingMessage) {
          if (isMessageStarted) {
            if(textDelta.value === '":"'){
              return;
            }
            const endOfMessage = delta.indexOf('",');
            if (endOfMessage !== -1) {
              // Message ends, stop streaming
              const finalMessagePart = delta.substring(0, endOfMessage);
              messageContent += finalMessagePart; // Ensure we store only the complete message
              isStreamingMessage = false; // Stop the message part

              // Send final streamed message response
              onPartialResponse({
                message: textDelta.value, // Send the captured message content
                fullChatResponse: messageContent,
                streaming: false, // Message streaming is done
                code: "", // No code yet
              });
            } else {
              // Continue appending the message until the end
              messageContent += delta;
              console.log(delta);
              // Send partial response as the message streams in
              onPartialResponse({
                message: textDelta.value, // Send the captured message content
                fullChatResponse: messageContent,
                streaming: true, // Streaming is ongoing
                code: "", // No code yet
              });
            }
          }
        }
      })
      .on("end", async () => {
        console.log(
          "DONE -------------------------------",
          assistantObj,
          messageContent
        );
        if (messageContent.trim() !== "") {
          // When streaming is done, send the react_code and graph_output
          const reactCode = JSON.parse(chatResponse).react_code;
          // const graphOutput = JSON.parse(chatResponse).graph_output;

          // console.log(reactCode, graphOutput);

          obj.code = reactCode;
          obj.message = messageContent;
          // obj.graph = graphOutput;
        }
      });
    

    if (messageContent.trim() === "") {
      for await (const event of run) {
        // onEvent(event, onPartialResponse);
        if (event.event === "thread.run.requires_action") {
          console.log("Starting tooling......................")
          obj = await handleRequiresAction(
            event.data,
            event.data.id,
            event.data.thread_id,
            onPartialResponse,
            app
          );
          console.log("Ending tooling......................")
        }
      }
    }

    const finalFunctionCall = await run.finalMessages();
    console.log("Run end:", finalFunctionCall, chatResponse);

    const appDetails = await App.findOne({ _id: app._id });
    if (obj.code) {

      const urlRegex = /fetch\(`([^`]+)`\)/;
      const originalApis = []; // Array to store original API objects
      
      // Replace URLs in the code while extracting them
      obj.code = obj.code.replace(urlRegex, (matchedUrl) => {
          
          // Extract the full URL from the matched string
          const fullUrl = matchedUrl.match(/`([^`]+)`/)[1];
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
          const newQueryString = paramsArray.join('&');
      
          // Construct the new URL with the updated query string
          return `fetch(\`http://localhost:4000/api/v1/builder/callAPI?${newQueryString}\`)`;
      });

      // Update app componentCode and save
      appDetails.apis = originalApis;
      appDetails.componentCode = obj.code;
      await appDetails.save();
    }
    obj.code = appDetails.componentCode;

    console.log("RUN LAST.................................");
       // Send final message with the code and graph after streaming
       onPartialResponse({
        message: obj.message, // Send the captured message content
        fullChatResponse: obj.message,
        streaming: false, // Streaming complete
        code: obj.code, // Send the code now
        codeFound: true,
        // graph: obj.graph, // Send the graph output now
      });
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

module.exports = {
  startChatSession,
  fetchPreviousChat,
  updateAIMessageToChatSession,
  updateHumanMessageToChatSession,
  aiAssistantChatStart,
};
