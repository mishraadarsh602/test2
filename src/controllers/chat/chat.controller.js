const chatSession = require('./../../models/chat/chatSession.model');
const userSession = require('./../../models/chat/globalSession.model');
const Api = require('./../../models/api.model');
const { v4: uuidv4 } = require('uuid');
const App = require('../../models/app');
const { default: axios } = require('axios');
const { OpenAI } = require("openai");
const { default: mongoose } = require('mongoose');

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

async function searchInternet({ query, numResults = 5 }) {
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

async function chartGenerator({ userInput }) {
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
async function callAPI() {
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
//         if (tool.function.name === "searchInternet") {
//           const { query, numResults } = JSON.parse(tool.function.arguments);
//           const searchResults = await searchInternet({ query, numResults });
//           return {
//             tool_call_id: tool.id,
//             output: JSON.stringify(searchResults),
//           };
//         } else if (tool.function.name === "chartGenerator") {
//           const { userInput } = JSON.parse(tool.function.arguments);
//           const chartData = await chartGenerator({ userInput });
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
const onEvent = async (event, onPartialResponse) => {
  try {
    console.log(event.event);
    if (event.event === "thread.run.requires_action") {
      await handleRequiresAction(
        event.data,
        event.data.id,
        event.data.thread_id,
        onPartialResponse
      );
    }

     // Handle message streaming during the run
     if (event.event === "thread.message.delta") {
      let output = event.data.delta.content[0].text.value; // Handle the delta response

      let chatResponse = '';
      chatResponse += output;

      console.log("Received delta message:", chatResponse);

      let obj = { message: "", code: "", streaming: false };

      const parts = output.split('```'); // Split the response by code blocks
      parts.forEach((part, index) => {
        // Check if we are inside a code block or outside of one
        if (index % 2 === 0) {
          // Outside the code block (plain text)
          obj.message += part;
          obj.streaming = true;
  
          // Call the callback to stream the message (without code)
          onPartialResponse({
            message: obj.message, // Stream only the message part
            fullChatResponse: '',
            streaming: true,
            code: "", // No code is streamed
            codeFound: false,
          });
        } else {
          // Outside the code block (plain text)
          obj.code += part;
          obj.streaming = true;
  
          // Call the callback to stream the message (without code)
          onPartialResponse({
            message: obj.message, // Stream only the message part
            fullChatResponse: '',
            streaming: true,
            code: obj.code, // No code is streamed
            codeFound: true,
          });
        }
      });
  
      console.log("running................................")
      const codeBlockRegex = /```(?:\w+)?\n([\s\S]*?)\n```/g;
      let match;
      if ((match = codeBlockRegex.exec(chatResponse)) !== null) {
        const extractedCode = match[1];
        obj.code += extractedCode.replace(/tsx/g, "");
        process.stdout.write(obj.code);
      }

      onPartialResponse({
        message: chatResponse,
        fullChatResponse: chatResponse,
        streaming: false,
        code: obj.code,
        codeFound: false,
      });

      return obj; // You can use this if needed for final processing
    }

    if (event.event === "thread.run.completed") {
      console.log("Run completed. Preparing to print results...");
      const messages = await openai.beta.threads.messages.list(
        event.data.thread_id
      );
      console.log("Final Results:", messages.data);
    }
  } catch (error) {
    console.error("Error handling event:", error);
  }
};

const handleRequiresAction = async (data, runId, threadId, onPartialResponse) => {
  try {
    const toolOutputs = await Promise.all(data.required_action.submit_tool_outputs.tool_calls.map(async (toolCall) => {
      if (toolCall.function.name === "searchInternet") {
        const { query, numResults } = JSON.parse(toolCall.function.arguments);
        const results = await searchInternet({ query, numResults });
        return {
          tool_call_id: toolCall.id,
          output: JSON.stringify(results),
        };
      } else if (toolCall.function.name === "chartGenerator") {
        const { userInput } = JSON.parse(toolCall.function.arguments);
        const chartData = await chartGenerator({ userInput });
        return {
          tool_call_id: toolCall.id,
          output: JSON.stringify(chartData),
        };
      } else if (toolCall.function.name === "callAPI") {
        const data = await callAPI();
        return {
          tool_call_id: toolCall.id,
          output: JSON.stringify(data),
        };
      }
    }));

    // Filter out any undefined outputs
    const filteredOutputs = toolOutputs.filter(output => output !== undefined);
    // Submit all the tool outputs at the same time
    await submitToolOutputs(filteredOutputs, runId, threadId, onPartialResponse);
  } catch (error) {
    console.error("Error processing required action:", error);
  }
};

const submitToolOutputs = async (toolOutputs, runId, threadId, onPartialResponse) => {
  try {
    const obj = { message: "", code: "", streaming: false };
    let chatResponse = "";
    let isInsideCodeBlock = false;
    let codeBlockBuffer = "";
    const stream = openai.beta.threads.runs.submitToolOutputsStream(threadId, runId, { tool_outputs: toolOutputs })
    .on('textDelta', (textDelta) => {  
      chatResponse += textDelta.value;
      const parts = textDelta.value.split('```');
      parts.forEach((part, index) => {
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
    console.log("Run end:", finalFunctionCall, chatResponse);

    const codeBlockRegex = /```(?:\w+)?\n([\s\S]*?)\n```/g;
    let match;
    if ((match = codeBlockRegex.exec(chatResponse)) !== null) {
      const extractedCode = match[1];
      obj.code += extractedCode.replace(/tsx/g, "");
      process.stdout.write(obj.code);
    }

    // Call the callback to stream partial responses
    onPartialResponse({
      message: chatResponse,
      fullChatResponse: chatResponse,
      streaming: false,
      code: obj.code,
      codeFound: false,
    });

      // ;
    // for await (const event of stream) {
    //   onEvent(event, onPartialResponse);
    // }
  } catch (error) {
    console.error("Error submitting tool outputs:", error);
  }
};

const aiAssistantChatStart = async (userId, userMessage, app, image = null, isStartChat, onPartialResponse) => {
  // const app = await App.findOne({
  //   name: appName,
  //   user: new mongoose.Types.ObjectId(userId),
  // });

  // if (!app) {
  //   throw new Error("App or user not found");
  // }

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
  }

  let assistantObj = {};
  let additional_instructions = `As a user, even if I ask you to go beyond the limits or request code unrelated to the provided project, you will always adhere to the core code and focus solely on editing and improving it. I am providing you with my code of jsx which you will modify or theme change only, here is my code:{reactCode} \nPLease follows this pattern for function and the way I called API and created React element without any import statement. If It is API based tool, then call the callAPI tool to retrieve a list of relevant APIs and select the best match. If No match found, then must call internet Search tool to find relevant API`;
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
    assistantObj = { assistant_id: process.env.ASSISTANT_ID, additional_instructions: 'If App is using any API, then first must call the callAPI tool to retrieve a list of relevant APIs and select the best match. If No match found, then call internet Search tool to find relevant API' };
  }

  if (image) {
    try {
      // Decode base64 image data
      // const base64Data = image.replace(/^data:image\/\w+;base64,/, "");
      // const buffer = Buffer.from(base64Data, "base64");

      // // Define a file path for saving the image
      // let fileName = `uploads/image-${Date.now()}.png`;

      // // // // Write the file to the uploads directory
      // await fs.writeFile(fileName, buffer, async (err) => {
      //   if (err) {
      //     console.error("Error saving the image:", err);
      //   } else {
      //     console.log("Image saved successfully at:", fileName);
      //   }
      // });
      // const uploadsPath = path.resolve(__dirname, '..', '..', '..', 'uploads'); // Adjust based on your folder structure

      // // To get the path for a specific uploaded file
      // const filePath = path.join(uploadsPath, fileName.split('/')[1]);
      // const imageBuffer = fs.readFileSync(filePath);
      // console.log(filePath)
      // const img_str = `data:image/png;base64,${imageBuffer.toString('base64')}`;
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


  const obj = { message: "", code: "", streaming: false };

  try {
    let chatResponse = "";
    let isInsideCodeBlock = false;
    let codeBlockBuffer = "";

    // Start streaming from OpenAI or another source
    const run = await openai.beta.threads.runs
    .stream(thread_id, assistantObj)
    .on('textDelta', (textDelta) => {
      chatResponse += textDelta.value;
      
      const parts = textDelta.value.split('```');
      parts.forEach((part, index) => {
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

    console.log()
    if(chatResponse.trim() === ''){
      for await (const event of run) {
        // onEvent(event, onPartialResponse);
        if (event.event === "thread.run.requires_action") {
          await handleRequiresAction(
            event.data,
            event.data.id,
            event.data.thread_id,
            onPartialResponse
          );
        }
    
      }
    }

      const finalFunctionCall = await run.finalMessages();
      console.log("Run end:", finalFunctionCall, chatResponse);

      const codeBlockRegex = /```(?:\w+)?\n([\s\S]*?)\n```/g;
      let match;
      if ((match = codeBlockRegex.exec(chatResponse)) !== null) {
        const extractedCode = match[1];
        obj.code += extractedCode.replace(/tsx/g, "");
        process.stdout.write(obj.code);
      }

      // Call the callback to stream partial responses
      onPartialResponse({
        message: chatResponse,
        fullChatResponse: chatResponse,
        streaming: false,
        code: obj.code,
        codeFound: false,
      });

    if (isStartChat) {
      console.log(
        "new chat loaded.---------------------------------------------"
      );
      await startChatSession(userId, app._id, userMessage, [
        image === null ? "" : image,
      ]);
    }

    if (obj.code) {
      const app = await App.findOne({ _id: app._id });
      app.componentCode = obj.code;
      await app.save();
    }

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

module.exports = {
  startChatSession,
  fetchPreviousChat,
  updateAIMessageToChatSession,
  updateHumanMessageToChatSession,
  aiAssistantChatStart,
};
