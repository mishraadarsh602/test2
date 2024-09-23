const systemPromptSession = require('../../models/chat/systemPrompt.model');
const chatSession = require('./../../models/chat/chatSession.model');
const userSession = require('./../../models/chat/globalSession.model');
const { v4: uuidv4 } = require('uuid');
const { ChatAnthropic } = require("@langchain/anthropic");
const { default: Anthropic } = require('@anthropic-ai/sdk');
const App = require('../../models/app');
const Api = require('../../models/api.model');
const { default: axios } = require('axios');
const { InMemoryChatMessageHistory } = require("@langchain/core/chat_history");
const { ChatPromptTemplate } = require("@langchain/core/prompts");
const { RunnableWithMessageHistory } = require("@langchain/core/runnables");
const { HumanMessage, AIMessage } = require("@langchain/core/messages");
const { OpenAI } = require("openai");
const { default: mongoose } = require('mongoose');

const generateSessionId = () => {
  return uuidv4();  // Generates a unique UUID
};

const client = new Anthropic({
  apiKey: process.env['ANTHROPIC_API_KEY'],
});

const model = new ChatAnthropic({
  model: "claude-3-5-sonnet-20240620",
  temperature: 0
});

const openai = new OpenAI({ apiKey: process.env.OPEN_AI_KEY });

const startChatSession = async (userId, agentId, message) => {
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
          content: message
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

const continueChatSession = async (userId, sessionId, newMessage) => {
  try {
    // Find the ongoing chat session for the user
    const ongoingSession = await chatSession.findOne({ userId, sessionId });

    if (!ongoingSession) {
      throw new Error("Session not found");
    }

    // Update the session's messages and lastTime
    ongoingSession.messages.push(newMessage);
    ongoingSession.lastTime = new Date();

    // Optionally update the timeSpent if you want to track session duration
    const sessionDuration = new Date() - new Date(ongoingSession.startTime);
    ongoingSession.timeSpent = Math.floor(sessionDuration / 1000); // Time spent in seconds

    await ongoingSession.save();

    return ongoingSession; // Return the updated session
  } catch (error) {
    console.error("Error continuing chat session:", error);
    throw new Error('Failed to continue chat session');
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

async function determineApi(userPrompt, apis) {
  const tools = apis.map(api => ({
    name: api.key,
    description: api.purpose // Keep the description concise
  }));  

  try {
    let prompt =`You are a decision-maker. Based on my input return one of the most relevant API only, without any extra content: 
    Here is my input = ${userPrompt}`
    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: "claude-3-5-sonnet-20240620", // Use the appropriate model
      max_tokens: 8000,
      tools,
      messages: [
        {
          role: "user",
          content: prompt
        }
      ]
    }, {
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env['ANTHROPIC_API_KEY'],
        "anthropic-version": "2023-06-01"
      }
    });
    console.log(response.data);
    if(response.data.content[1].type === 'tool_use'){
      return response.data.content[1].name;
    } else {
      console.log('NO API found');
    }
  } catch (error) {
    console.error("Error making determineApi call via tool:", error.response ? error.response.data : error.message);
  }
}

const startLLMChat = async (userId, userMessage, appId, isStartChat) => {
  try {
    // console.log("-------------------------------------------------------New----------------------------------------------")
    return await aiAssistantChatStart(userId, userMessage, appId, null, true);
    // const prompts = await systemPromptSession.findOne({});
    // let parentPrompt = prompts?.parentPrompt;
    // let getAllAPIs = await Api.find({}, 'key purpose').lean();
    // parentPrompt = parentPrompt.replace("{userInput}", userMessage);
    // parentPrompt = parentPrompt.replace("{apiList}", getAllAPIs);
    // console.log("parentPrompt", parentPrompt);
    // const message = await client.messages.create({
    //   max_tokens: 1024,
    //   messages: [{ role: "user", content: parentPrompt }],
    //   model: "claude-3-5-sonnet-20240620",
    // });
    // let parentResponse = JSON.parse(message.content[0].text.trim());
    // console.log(parentResponse);

    // let waitForChildOperation = await CallingAiPrompt(parentResponse, prompts, {
    //   customPrompt: userMessage,
    // }, appId, userId, isStartChat);
    // return waitForChildOperation;
  } catch (error) {
    console.error("Error starting LLM chat:", error);
    throw new Error('Failed to start LLM chat');
  }
};

async function CallingAiPrompt(parentResponse, prompts, aiData, appId, userId, isStartChat) {
  // console.log(parentResponse, prompts, aiData, appId, isStartChat)
  let reactCode = `
  function WeatherApp() {
    const [weather, setWeather] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState(null);

    React.useEffect(() => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          fetch(\`https://api.weatherapi.com/v1/current.json?key=323e6c0135f941f7a0b95629242808&q=\${latitude},\${longitude}\`)
            .then(response => response.json())
            .then(data => {
              setWeather(data);
              setLoading(false);
            })
            .catch(err => {
              setError('Failed to fetch weather data');
              setLoading(false);
            });
        },
        () => {
          setError('Unable to retrieve your location');
          setLoading(false);
        }
      );
    }, []);

    if (loading) return React.createElement('div', { className: 'flex justify-center items-center h-screen' }, 'Loading...');
    if (error) return React.createElement('div', { className: 'text-red-500 text-center' }, error);

    return React.createElement('div', { className: 'flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-blue-400 to-blue-600 p-4' },
      React.createElement('div', { className: 'bg-white rounded-lg shadow-xl p-6 max-w-sm w-full' },
        React.createElement('h1', { className: 'text-2xl font-bold mb-4 text-center' }, weather.location.name),
        React.createElement('div', { className: 'flex items-center justify-center mb-4' },
          React.createElement('img', { src: weather.current.condition.icon, alt: weather.current.condition.text, className: 'w-16 h-16 mr-4' }),
          React.createElement('span', { className: 'text-5xl font-bold' }, \`\${weather.current.temp_c}°C\`)
        ),
        React.createElement('p', { className: 'text-center text-gray-700 mb-4' }, weather.current.condition.text),
        React.createElement('div', { className: 'grid grid-cols-2 gap-4 text-sm' },
          React.createElement('div', { className: 'flex items-center' },
            React.createElement(Wind, { className: 'w-4 h-4 mr-2' }),
            \`\${weather.current.wind_kph} km/h\`
          ),
          React.createElement('div', { className: 'flex items-center' },
            React.createElement(Droplets, { className: 'w-4 h-4 mr-2' }),
            \`\${weather.current.humidity}%\`
          ),
          React.createElement('div', { className: 'flex items-center' },
            React.createElement(Thermometer, { className: 'w-4 h-4 mr-2' }),
            \`Feels like \${weather.current.feelslike_c}°C\`
          ),
          React.createElement('div', { className: 'flex items-center' },
            React.createElement(Sun, { className: 'w-4 h-4 mr-2' }),
            \`UV \${weather.current.uv}\`
          )
        )
      )
    );
  }

  return WeatherApp;
`;
  let obj = {};
  let messages = [];
let childPrompt = prompts?.childPrompt?.aibased;
  if(!isStartChat){
    const ongoingSession = await chatSession.findOne({ userId: userId, agentId: appId });

    if (!ongoingSession) {
      return [];
    }

    for (let i = 0; i < ongoingSession.messages.length - 1 > 0; i++) {
      if (ongoingSession.messages[i].role === "user") {
        messages.push(
          new HumanMessage({ content: ongoingSession.messages[i].content })
        );
      } else if (ongoingSession.messages[i].role === "bot") {
        messages.push(
          new AIMessage({ content: ongoingSession.messages[i].content })
        );
      }
    }
  }

  if (parentResponse && parentResponse.ToolTYPE === "AIBASED") {
    childPrompt = prompts?.childPrompt?.aibased;
    childPrompt = childPrompt.replace("{reactCode}", reactCode);
    
    const {code, msg} = await memoryBasedChatOutput(childPrompt, messages, aiData.customPrompt, appId, true);
    
    obj = {
      code: code.trim(),
      type: "AIBASED",
      message: msg,
    };
    
  } else if (parentResponse && parentResponse.ToolTYPE === "GENERALTEXT") {

    let childPrompt = "You can return normal output for conversation";

    const { code } = await memoryBasedChatOutput(childPrompt, messages, aiData.customPrompt, appId, false)
    
    obj = {
      code: "",
      type: "GENERALTEXT",
      message: code,
    };

  } else if (parentResponse && parentResponse.ToolTYPE === "APIBASED") {
    childPrompt = prompts?.childPrompt?.apibased;
    childPrompt = childPrompt.replace("{userInput}", aiData.customPrompt);
    let getAllAPIs = await Api.find({}, "key purpose").lean();
    const apiKey = await determineApi(aiData.customPrompt, getAllAPIs);
    let apiOutput = await Api.find({ key: apiKey });
    childPrompt = childPrompt.replace("{API_Output}", apiOutput.output);
    childPrompt = childPrompt.replace("{reactCode}", reactCode);

    const {code, msg} = await memoryBasedChatOutput(childPrompt, messages, aiData.customPrompt, appId, true);

    obj = {
      code: code.trim(),
      type: "APIBASED",
      message: msg.trim(),
    };
  }

  if(isStartChat){
    await startChatSession(userId, appId, aiData.customPrompt, childPrompt);
  }

  if (obj.code) {
    const app = await App.findOne({ _id: appId });
    app.componentCode = obj.code;
    await app.save();
  }

  return obj;
}

const memoryBasedChatOutput = async (childPrompt, messages, humanInput, appId, generateCode) => {
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", childPrompt.replaceAll('{', "{{").replaceAll('}', "}}")],
    ["placeholder", "{chat_history}"],
    ["human", "{input}"],
  ]);

  const chain = prompt.pipe(model);
  const messageHistories = {};
  const withMessageHistory = new RunnableWithMessageHistory({
    runnable: chain,
    getMessageHistory: async (sessionId) => {
      if (messageHistories[sessionId] === undefined) {
        const messageHistory = new InMemoryChatMessageHistory();
        await messageHistory.addMessages(messages);
        messageHistories[sessionId] = messageHistory;
      }
      return messageHistories[sessionId];
    },
    inputMessagesKey: "input",
    historyMessagesKey: "chat_history",
  });

  const config = {
    configurable: {
      sessionId: appId,
    },
  };

  const code = await withMessageHistory.invoke(
    {
      input: "Here is my requirment: " + humanInput,
    },
    config
  );

  let msg = {content: ''};

  if (generateCode) {
    msg = await withMessageHistory.invoke(
      {
        input:
          "Given the user input: '" +
          humanInput +
          "', generate a clear and concise message summarizing the changes and updates made to the code in the previous step. Ensure the explanation is simple and easy to understand in plain English in 4-5 lines only.",
      },
      config
    );
  }

  return {code: code.content, msg: msg.content};
}

const continueChatSessionMessages = async (
  userId,
  humanInput,
  appId
) => {

  console.log("-------------------------------------------------------Continue ----------------------------------------------")
  return await aiAssistantChatStart(userId, humanInput, appId, null, false);

//   let reactCode = `
//   function WeatherApp() {
//     const [weather, setWeather] = React.useState(null);
//     const [loading, setLoading] = React.useState(true);
//     const [error, setError] = React.useState(null);

//     React.useEffect(() => {
//       navigator.geolocation.getCurrentPosition(
//         (position) => {
//           const { latitude, longitude } = position.coords;
//           fetch(\`https://api.weatherapi.com/v1/current.json?key=323e6c0135f941f7a0b95629242808&q=\${latitude},\${longitude}\`)
//             .then(response => response.json())
//             .then(data => {
//               setWeather(data);
//               setLoading(false);
//             })
//             .catch(err => {
//               setError('Failed to fetch weather data');
//               setLoading(false);
//             });
//         },
//         () => {
//           setError('Unable to retrieve your location');
//           setLoading(false);
//         }
//       );
//     }, []);

//     if (loading) return React.createElement('div', { className: 'flex justify-center items-center h-screen' }, 'Loading...');
//     if (error) return React.createElement('div', { className: 'text-red-500 text-center' }, error);

//     return React.createElement('div', { className: 'flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-blue-400 to-blue-600 p-4' },
//       React.createElement('div', { className: 'bg-white rounded-lg shadow-xl p-6 max-w-sm w-full' },
//         React.createElement('h1', { className: 'text-2xl font-bold mb-4 text-center' }, weather.location.name),
//         React.createElement('div', { className: 'flex items-center justify-center mb-4' },
//           React.createElement('img', { src: weather.current.condition.icon, alt: weather.current.condition.text, className: 'w-16 h-16 mr-4' }),
//           React.createElement('span', { className: 'text-5xl font-bold' }, \`\${weather.current.temp_c}°C\`)
//         ),
//         React.createElement('p', { className: 'text-center text-gray-700 mb-4' }, weather.current.condition.text),
//         React.createElement('div', { className: 'grid grid-cols-2 gap-4 text-sm' },
//           React.createElement('div', { className: 'flex items-center' },
//             React.createElement(Wind, { className: 'w-4 h-4 mr-2' }),
//             \`\${weather.current.wind_kph} km/h\`
//           ),
//           React.createElement('div', { className: 'flex items-center' },
//             React.createElement(Droplets, { className: 'w-4 h-4 mr-2' }),
//             \`\${weather.current.humidity}%\`
//           ),
//           React.createElement('div', { className: 'flex items-center' },
//             React.createElement(Thermometer, { className: 'w-4 h-4 mr-2' }),
//             \`Feels like \${weather.current.feelslike_c}°C\`
//           ),
//           React.createElement('div', { className: 'flex items-center' },
//             React.createElement(Sun, { className: 'w-4 h-4 mr-2' }),
//             \`UV \${weather.current.uv}\`
//           )
//         )
//       )
//     );
//   }

//   return WeatherApp;
// `;
//   let obj = {};
//   let messages = [];
//   let childPrompt = "";
//   const ongoingSession = await chatSession.findOne({
//     userId: userId,
//     agentId: appId,
//   });

//   if (!ongoingSession) {
//     return [];
//   }

// // Loop through the session messages and add the system message first if it exists
// for (let i = 0; i < ongoingSession.messages.length; i++) {
//   let message = ongoingSession.messages[i];
  
//   if (message.role === "system") {
//     // Ensure system message is only added as the first message
//     if (messages.length === 0) {
//       // messages.push(new SystemMessage({ content: message.content }));
//       childPrompt = message.content; // Storing the system message content in childPrompt
//     } else {
//       console.error("System message is not allowed after the first message.");
//     }
//   } else if (message.role === "user") {
//     messages.push(new HumanMessage({ content: message.content }));
//   } else if (message.role === "bot") {
//     messages.push(new AIMessage({ content: message.content }));
//   }
// }


//   if (childPrompt.includes("{API_Output}")) {
//     childPrompt = childPrompt.replace("{userInput}", humanInput);
//     let getAllAPIs = await Api.find({}, "key purpose").lean();
//     const apiKey = await determineApi(humanInput, getAllAPIs);
//     let apiOutput = await Api.find({ key: apiKey });
//     childPrompt = childPrompt.replace("{API_Output}", apiOutput.output);
//   }
//   childPrompt = childPrompt.replace("{reactCode}", reactCode);

//   const { code, msg } = await memoryBasedChatOutput(
//     childPrompt,
//     messages,
//     humanInput,
//     appId,
//     true
//   );

//   obj = {
//     code: code.trim(),
//     type: "AIBASED",
//     message: msg,
//   };

  
//   if (obj.code) {
//     const app = await App.findOne({ _id: appId });
//     app.componentCode = obj.code;
//     await app.save();
//   }

  // return obj;
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

const updateHumanMessageToChatSession = async (userId, agentId, message) => {
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

const addImageToThread = async (threadId, imagePath) => {
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

const streamingWithFunctions = async (threadId) => {
  const tools = [
    {
      type: "function",
      function: {
        name: "get_current_weather",
        description: "Get the current weather in a given location",
        parameters: {
          type: "object",
          properties: {
            location: {
              type: "string",
              description: "The city and state, e.g. San Francisco, CA",
            },
            unit: { type: "string", enum: ["celsius", "fahrenheit"] },
          },
          required: ["location"],
        },
      },
    },
  ];
  const stream = await openai.beta.threads.runs.create(threadId, {
    assistant_id: process.env.ASSISTANT_ID,
    tools: tools,
    stream: true,
  });

  for await (const event of stream) {
    console.log(event);
  }
};

const aiAssistantChatStart = async (userId, userMessage, appId, imagePath = null, isStartChat, onPartialResponse) => {
  const app = await App.findOne({ _id: new mongoose.Types.ObjectId(appId), user: new mongoose.Types.ObjectId(userId) });

  if (!app) {
    throw new Error("App or user not found");
  }

  const thread_id = app.thread_id;

  if (imagePath) {
    try {
      const imageResponse = await addImageToThread(thread_id, imagePath);
      console.log("Image sent successfully", imageResponse);
    } catch (error) {
      console.error("Error uploading image", error);
    }
  }
  
   // Add user message to thread
   const messageResponse = await addMessageToThread(thread_id, userMessage);
   if (messageResponse) {
     console.log("Message sent successfully");
   }

  const obj = { message: '', code: '', streaming: false };

  try {
    let chatResponse = '';
    let isInsideCodeBlock = false;
    let codeBlockBuffer = '';

    // Start streaming from OpenAI or another source
    const run = await openai.beta.threads.runs.stream(
      thread_id,
      { assistant_id: process.env.ASSISTANT_ID }
    )
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

    const finalFunctionCall = await run.finalMessages();
    console.log('Run end:', finalFunctionCall, chatResponse);

    const codeBlockRegex = /```(?:\w+)?\n([\s\S]*?)\n```/g;
    let match;
    if ((match = codeBlockRegex.exec(chatResponse)) !== null) {
      const extractedCode = match[1];
      obj.code += extractedCode.replace(/tsx/g, '');
      process.stdout.write(obj.code);
    }

    // Call the callback to stream partial responses
    onPartialResponse({
      message: chatResponse,
      fullChatResponse: chatResponse,
      streaming: false,
      code: obj.code,
      codeFound: false
    });

    if (isStartChat) {
      startChatSession(userId, appId, userMessage);
    }

    if (obj.code) {
      const app = await App.findOne({ _id: appId });
      app.componentCode = obj.code;
      await app.save();
    }

    // Final return after the streaming is done
    return obj;

  } catch (error) {
    console.error('Error running assistant:', error);
    onPartialResponse({ message: 'An error occurred while processing your request.', streaming: false });
    return { message: 'The server had an error processing your request.', code: '' };
  }
};


module.exports = {
  startChatSession,
  continueChatSession,
  fetchPreviousChat,
  startLLMChat,
  updateAIMessageToChatSession,
  updateHumanMessageToChatSession,
  continueChatSessionMessages,
  aiAssistantChatStart
};
