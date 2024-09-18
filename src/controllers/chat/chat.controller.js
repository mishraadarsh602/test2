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

const startChatSession = async (userId, agentId, message, prompt) => {
  try {

    // get main system prompt from db
    // const prompts = await systemPromptSession.findOne({});

    const newChatSession = await chatSession.create({
      userId,
      agentId,
      sessionId: generateSessionId(), // Create a unique sessionId
      conversationId: generateSessionId(), // Create a unique sessionId
      startTime: new Date(),
      lastTime: new Date(),
      date: new Date(),
      messages: [
        {
          sno: 1,
          role: 'system',
          content: prompt
        },
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
    // console.error("Error starting chat session:", error);
    throw error;
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
    // console.error("Error continuing chat session:", error);
    throw error;
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
    // console.error("Error continuing chat session:", error);
    throw error;
  }
};

async function determineApi(userPrompt, apis) {
  const tools = apis.map(api => ({
    name: api.key,
    description: `Use this API for ${api.purpose} functionality.`,
    input_schema: {
      type: "object",
      properties: {
        key: {
          type: "string",
          description: `The API key for ${api.key}.`
        },
        purpose: {
          type: "string",
          description: `The API purpose is ${api.purpose}.`
        }
      },
      required: ["key", "purpose"]
    }
  }));
  

  try {
    let prompt =`You are a decision-maker. I want to build a tool. Based on my input, you will decide whether the context returns the most relevant API along with the response: 
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
    console.error("Error making API call:", error.response ? error.response.data : error.message);
  }
}

const startLLMChat = async (userId, userMessage, appId, isStartChat) => {
  try {
    const prompts = await systemPromptSession.findOne({});
    let parentPrompt = prompts?.parentPrompt;
    let getAllAPIs = await Api.find({}, 'key purpose').lean();
    parentPrompt = parentPrompt.replace("{userInput}", userMessage);
    parentPrompt = parentPrompt.replace("{apiList}", getAllAPIs);
    console.log("parentPrompt", parentPrompt);
    const message = await client.messages.create({
      max_tokens: 1024,
      messages: [{ role: "user", content: parentPrompt }],
      model: "claude-3-5-sonnet-20240620",
    });
    let parentResponse = JSON.parse(message.content[0].text.trim());
    console.log(parentResponse);

    let waitForChildOperation = await CallingAiPrompt(parentResponse, prompts, {
      customPrompt: userMessage,
    }, appId, userId, isStartChat);
    return waitForChildOperation;
  } catch (error) {
    throw error;
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
      input: humanInput,
    },
    config
  );

  let msg = {content: ''};

  if(generateCode){
    msg = await withMessageHistory.invoke(
      {
        input: "This is user input : " + humanInput + "for this user input, you need to generate one message for the user about changes and updations in plain English for code which you have just generate before one step.",
      },
      config
    );
  }
  
  return {code: code.content, msg: msg.content};
}

const updateAIMessageToChatSession = async (userId, agentId, code, message) => {
  try {
    // Find the existing chat session
    const oldChatSession = await chatSession
      .findOne({ userId, agentId })
      .lean();

    // Ensure oldChatSession exists before proceeding
    if (!oldChatSession) {
      throw new Error('Chat session not found');
    }

    // Push a new message to the existing chat session's messages array
    const newChatSession = await chatSession.updateOne(
      { userId, agentId },
      {
        $set: { lastTime: new Date() },
        $push: {
          messages: {
            sno: oldChatSession.messages.length + 1,
            role: 'ai',
            content: message,
            code: code
          },
        },
      },
      { new: true }
    );

    return newChatSession; // Return the updated session
  } catch (error) {
    // console.error('Error updating chat session:', error);
    throw error;
  }
};

const updateHumanMessageToChatSession = async (userId, agentId, message) => {
  try {
    // Find the existing chat session
    const oldChatSession = await chatSession
      .findOne({ userId, agentId })
      .lean();

    // Ensure oldChatSession exists before proceeding
    if (!oldChatSession) {
      throw new Error('Chat session not found');
    }

    // Push a new message to the existing chat session's messages array
    const newChatSession = await chatSession.updateOne(
      { userId, agentId },
      {
        $set: { lastTime: new Date() },
        $push: {
          messages: {
            sno: oldChatSession.messages.length + 1,
            role: 'human',
            content: message,
          },
        },
      },
      { new: true }
    );

    return newChatSession; // Return the updated session
  } catch (error) {
    // console.error('Error updating chat session:', error);
    throw error;
  }
};

module.exports = {
  startChatSession,
  continueChatSession,
  fetchPreviousChat,
  startLLMChat,
  updateAIMessageToChatSession,
  updateHumanMessageToChatSession
};
