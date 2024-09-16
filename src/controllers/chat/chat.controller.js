const systemPromptSession = require('../../models/chat/systemPrompt.model');
const chatSession = require('./../../models/chat/chatSession.model');
const userSession = require('./../../models/chat/globalSession.model');
const { v4: uuidv4 } = require('uuid');
const { ChatAnthropic } = require("@langchain/anthropic");
const { default: Anthropic } = require('@anthropic-ai/sdk');
const App = require('../../models/app');
const Api = require('../../models/api.model');
const { default: axios } = require('axios');

const generateSessionId = () => {
  return uuidv4();  // Generates a unique UUID
};

const client = new Anthropic({
  apiKey: process.env['ANTHROPIC_API_KEY'],
});

const startChatSession = async (userId, agentId, message) => {
  try {

    // get main system prompt from db
    const prompts = await systemPromptSession.findOne({});

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
          content: prompts.childPrompt?.apibased
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
    const response = await axios.post('https://api.anthropic.com/v1/messages', {
      model: "claude-3-5-sonnet-20240620", // Use the appropriate model
      max_tokens: 1024,
      tools,
      messages: [
        {
          role: "user",
          content: "Need to return one api only which can return more correct output. Here is our user prompt:  " + userPrompt
        }
      ]
    }, {
      headers: {
        "content-type": "application/json",
        "x-api-key": process.env['ANTHROPIC_API_KEY'],
        "anthropic-version": "2023-06-01"
      }
    });
    if(response.data.content[1].type === 'tool_use'){
      return response.data.content[1].name;
    }
    console.log(response.data);
  } catch (error) {
    console.error("Error making API call:", error.response ? error.response.data : error.message);
  }
}


const startLLMChat = async (userMessage, appId) => {
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
    }, appId);
    return waitForChildOperation;
  } catch (error) {
    throw error;
  }
};

async function CallingAiPrompt(parentResponse, prompts, aiData, appId) {
  let reactCode = `
  function WeatherTracker() {
    const [fromCity, setFromCity] = React.useState("");
    const [toCity, setToCity] = React.useState("");
    const [fromWeather, setFromWeather] = React.useState(null);
    const [toWeather, setToWeather] = React.useState(null);
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState(null);
  
    const fetchWeather = async (city, setter) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          \`https://api.weatherapi.com/v1/forecast.json?key=323e6c0135f941f7a0b95629242808&q=\${city}&days=7\`
        );
        if (!response.ok) {
          throw new Error('Failed to fetch weather data');
        }
        const data = await response.json();
        setter(data);
      } catch (error) {
        console.error("Error fetching weather data:", error);
        setError("Failed to fetch weather data. Please try again.");
      } finally {
        setLoading(false);
      }
    };
  
    const handleSubmit = (e) => {
      e.preventDefault();
      fetchWeather(fromCity, setFromWeather);
      fetchWeather(toCity, setToWeather);
    };
  
    const renderWeatherCard = (weather, title) => {
      if (!weather) return null;
      return React.createElement('div', { className: "bg-white rounded-lg shadow-xl p-6 mb-6", key: title },
        React.createElement('h2', { className: "text-2xl font-bold mb-4 flex items-center" },
          React.createElement(MapPin, { className: "mr-2" }),
          \`\${title}: \${weather.location.name}, \${weather.location.country}\`
        ),
        React.createElement('p', { className: "text-sm text-gray-600 mb-4" }, \`Local time: \${weather.location.localtime}\`),
        React.createElement('div', { className: "mb-4 flex items-center" },
          React.createElement('img', { src: weather.current.condition.icon, alt: weather.current.condition.text, className: "w-16 h-16 mr-4" }),
          React.createElement('div', null,
            React.createElement('p', { className: "text-4xl font-bold" }, \`\${weather.current.temp_c}°C\`),
            React.createElement('p', { className: "text-lg" }, weather.current.condition.text)
          )
        ),
        React.createElement('div', { className: "grid grid-cols-2 gap-4 mb-4" },
          React.createElement('div', null,
            React.createElement('p', { className: "font-semibold" }, "Feels like"),
            React.createElement('p', null, \`\${weather.current.feelslike_c}°C\`)
          ),
          React.createElement('div', null,
            React.createElement('p', { className: "font-semibold" }, "Wind"),
            React.createElement('p', null, \`\${weather.current.wind_kph} km/h\`)
          ),
          React.createElement('div', null,
            React.createElement('p', { className: "font-semibold" }, "Humidity"),
            React.createElement('p', null, \`\${weather.current.humidity}%\`)
          ),
          React.createElement('div', null,
            React.createElement('p', { className: "font-semibold" }, "UV Index"),
            React.createElement('p', null, weather.current.uv)
          )
        ),
        React.createElement('h3', { className: "text-xl font-semibold mb-2" }, "7-Day Forecast"),
        React.createElement('div', { className: "space-y-4" },
          weather.forecast.forecastday.map((day) => 
            React.createElement('div', { key: day.date, className: "border-t pt-4" },
              React.createElement('div', { className: "flex justify-between items-center" },
                React.createElement('div', { className: "flex items-center" },
                  React.createElement(Calendar, { className: "mr-2" }),
                  React.createElement('span', { className: "font-semibold" },
                    new Date(day.date).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                    })
                  )
                ),
                React.createElement('div', { className: "flex items-center" },
                  React.createElement('img', {
                    src: day.day.condition.icon,
                    alt: day.day.condition.text,
                    className: "w-10 h-10 mr-2"
                  }),
                  React.createElement('span', { className: "text-xl font-bold" }, \`\${day.day.avgtemp_c}°C\`)
                )
              ),
              React.createElement('p', { className: "text-sm text-gray-600 mt-1" }, day.day.condition.text),
              React.createElement('div', { className: "grid grid-cols-2 gap-2 mt-2 text-sm" },
                React.createElement('div', { className: "flex items-center" },
                  React.createElement(Wind, { className: "w-4 h-4 mr-1" }),
                  React.createElement('span', null, \`\${day.day.maxwind_kph} km/h\`)
                ),
                React.createElement('div', { className: "flex items-center" },
                  React.createElement(Droplets, { className: "w-4 h-4 mr-1" }),
                  React.createElement('span', null, \`\${day.day.avghumidity}%\`)
                ),
                React.createElement('div', { className: "flex items-center" },
                  React.createElement(Cloud, { className: "w-4 h-4 mr-1" }),
                  React.createElement('span', null, \`\${day.day.daily_chance_of_rain}% rain\`)
                ),
                React.createElement('div', { className: "flex items-center" },
                  React.createElement(Sun, { className: "w-4 h-4 mr-1" }),
                  React.createElement('span', null, \`UV \${day.day.uv}\`)
                )
              )
            )
          )
        )
      );
    };
  
    return React.createElement('div', { className: "min-h-screen bg-gray-100 p-4 md:p-8" },
      React.createElement('div', { className: "max-w-4xl mx-auto" },
        React.createElement('h1', { className: "text-3xl font-bold text-center mb-8 text-black" }, "Travel Weather Tracker"),
        React.createElement('form', { onSubmit: handleSubmit, className: "bg-white rounded-lg shadow-xl p-6 mb-8" },
          React.createElement('div', { className: "flex flex-col md:flex-row md:space-x-4" },
            React.createElement('div', { className: "flex-1 mb-4 md:mb-0" },
              React.createElement('label', { htmlFor: "fromCity", className: "block text-sm font-medium text-gray-700 mb-1" }, "From City"),
              React.createElement('input', {
                id: "fromCity",
                type: "text",
                value: fromCity,
                onChange: (e) => setFromCity(e.target.value),
                className: "w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                placeholder: "Enter departure city",
                required: true
              })
            ),
            React.createElement('div', { className: "flex-1" },
              React.createElement('label', { htmlFor: "toCity", className: "block text-sm font-medium text-gray-700 mb-1" }, "To City"),
              React.createElement('input', {
                id: "toCity",
                type: "text",
                value: toCity,
                onChange: (e) => setToCity(e.target.value),
                className: "w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500",
                placeholder: "Enter destination city",
                required: true
              })
            )
          ),
          React.createElement('button', { 
            type: "submit", 
            className: "w-full bg-blue-500 text-white py-2 px-4 rounded-md mt-4 hover:bg-blue-600 transition duration-300",
            disabled: loading
          }, loading ? "Loading..." : "Get Weather Forecast")
        ),
        error && React.createElement('div', { className: "bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" }, error),
        fromWeather && renderWeatherCard(fromWeather, "From"),
        toWeather && renderWeatherCard(toWeather, "To")
      )
    );
  }
  return WeatherTracker;
`;
  let obj = {};
  if (parentResponse && parentResponse.ToolTYPE === "AIBASED") {
    let childPrompt = prompts?.childPrompt?.aibased;
    childPrompt = childPrompt.replace("{userInput}", aiData.customPrompt);
    childPrompt = childPrompt.replace("{reactCode}", reactCode);
    const mesg = await client.messages.create({
      max_tokens: 8192,
      messages: [{ role: "user", content: childPrompt }],
      model: "claude-3-5-sonnet-20240620",
    });
    let childResponseAsCode = mesg.content[0].text.trim();
    obj = {
      code: childResponseAsCode,
      type: "AIBASED",
      message: "Your Request is Completed. UI Getting Rendered",
    };
  } else if (parentResponse && parentResponse.ToolTYPE === "GENERALTEXT") {
    obj = {
      code: "",
      type: "GENERALTEXT",
      message: "Hello. Welcome to tool builder...!",
    };
  } else if (parentResponse && parentResponse.ToolTYPE === "APIBASED") {
    let childPrompt = prompts?.childPrompt?.apibased;
    childPrompt = childPrompt.replace("{userInput}", aiData.customPrompt);
    let getAllAPIs = await Api.find({}, "key purpose").lean();
    const apiKey = await determineApi(userMessage, getAllAPIs);
    let apiOutput = await Api.find({ key: apiKey });
    childPrompt = childPrompt.replace("{API_Output}", apiOutput);
    childPrompt = childPrompt.replace("{reactCode}", reactCode);
    const mesg = await client.messages.create({
      max_tokens: 8192,
      messages: [{ role: "user", content: childPrompt }],
      model: "claude-3-5-sonnet-20240620",
    });
    let childResponseAsCode = mesg.content[0].text.trim();
    obj = {
      code: childResponseAsCode,
      type: "APIBASED",
      message: "Your Request is Completed. UI Getting Rendered",
    };
  }
  const app = await App.findOne({ _id: appId });
  app.componentCode = childResponseAsCode;
  await app.save();
  return obj;
}

const updateAIMessageToChatSession = async (userId, agentId, message) => {
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
            content: 'Your Request is Completed. UI Getting Rendered',
            code: message
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
