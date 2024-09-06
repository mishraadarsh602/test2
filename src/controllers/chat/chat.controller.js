const systemPromptSession = require('../../models/chat/systemPrompt.model');
const chatSession = require('./../../models/chat/chatSession.model');
const userSession = require('./../../models/chat/globalSession.model');
const { v4: uuidv4 } = require('uuid');

const generateSessionId = () => {
  return uuidv4();  // Generates a unique UUID
};

const startChatSession = async (userId, agentId, message) => {
  try {

    // get main system prompt from db
    const mainSystemPrompt = await systemPromptSession.findOne({});

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
          content: mainSystemPrompt.mainSystemPrompt
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
      throw new Error("Session not found");
    }

    return ongoingSession.messages; // Return the updated session
  } catch (error) {
    console.error("Error continuing chat session:", error);
    throw error;
  }
};

module.exports = {
  startChatSession,
  continueChatSession,
  fetchPreviousChat
};
