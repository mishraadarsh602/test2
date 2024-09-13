const systemPromptSession = require('../../models/chat/systemPrompt.model');
const chatSession = require('./../../models/chat/chatSession.model');
const userSession = require('./../../models/chat/globalSession.model');
const { v4: uuidv4 } = require('uuid');
const { ChatAnthropic } = require("@langchain/anthropic");
const { default: Anthropic } = require('@anthropic-ai/sdk');

const generateSessionId = () => {
  return uuidv4();  // Generates a unique UUID
};

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
    console.error("Error starting chat session:", error);
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
    console.error("Error continuing chat session:", error);
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
    console.error("Error continuing chat session:", error);
    throw error;
  }
};

const startLLMChat = async (messages) => {
  try {
    const client = new Anthropic({
      apiKey: process.env['ANTHROPIC_API_KEY'],
  });
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

            parentPrompt = parentPrompt.replace('{userInput}', 'do you know about react tailwind?');
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
                childPrompt = childPrompt.replace('{userInput}',  'do you know about react tailwind?');
                const mesg = await client.messages.create({
                    max_tokens: 8192,
                    messages: [{ role: 'user', content: childPrompt }],
                    model: 'claude-3-5-sonnet-20240620',
                });
                let childResponse = mesg.content[0].text.trim();
                console.log(childResponse);
                let message = JSON.stringify(childResponse).split("@$@$@$");
                let obj = { code: message[0], message: message[1] };
                return JSON.stringify(obj);
            }
            else if (parentResponse && parentResponse.ToolTYPE === 'APIBASED') {
                let childPrompt = prompts?.childPrompt?.apibased;
                childPrompt = childPrompt.replace('{userInput}',  'do you know about react tailwind?');
                console.log(childPrompt);
                let message = JSON.stringify(childResponse).split("@$@$@$");
                let obj = { code: message[0], message: message[1] };
                return JSON.stringify(obj);
            }


    // if(aiMsg.content.trim().contains('@$@$@$')){
    //   let message = JSON.stringify(aiMsg.content.trim()).split("@$@$@$");
    //   let obj = { code: message[0], message: message[1] };
    //   return JSON.stringify(obj);
    // }else{
    //   let message = aiMsg.content.trim()
    //   return message;
    // }
  } catch (error) {
    console.error("Error continuing chat session:", error);
    throw error;
  }
};

function isJsonString(message) {
  try {
      JSON.parse(message);
      return true;
  } catch (e) {
      return false;
  }
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

    if(isJsonString(message)){
      code = JSON.parse(message).code;
      message = JSON.parse(message).message;
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
            code
          },
        },
      },
      { new: true }
    );

    return newChatSession; // Return the updated session
  } catch (error) {
    console.error('Error updating chat session:', error);
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
    console.error('Error updating chat session:', error);
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
