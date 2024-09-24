const chatSession = require('./../../models/chat/chatSession.model');
const userSession = require('./../../models/chat/globalSession.model');
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

const addImageToThread = async (threadId, imageUrl) => {
  try {

    // Upload the image file and add it to the conversation
    const response = await openai.beta.threads.messages.create(
      threadId,
      {
        role: "user",
        content: imageUrl
      }
    );
    console.log('Image Added:', response);
    return response;
  } catch (error) {
    console.error('Error adding image to thread:', error);
  }
};


const aiAssistantChatStart = async (userId, userMessage, appId, imageUrl = null, isStartChat, onPartialResponse) => {
  const app = await App.findOne({
    _id: new mongoose.Types.ObjectId(appId),
    user: new mongoose.Types.ObjectId(userId),
  });

  if (!app) {
    throw new Error("App or user not found");
  }

  const thread_id = app.thread_id;

  // Find the existing chat session
  const oldChatSession = await chatSession
    .findOne({
      agentId: new mongoose.Types.ObjectId(appId),
      userId: new mongoose.Types.ObjectId(userId),
    })
    .lean();

  // Ensure oldChatSession exists before proceeding
  if (!oldChatSession) {
    isStartChat = true;
  }

  let assistantObj = {};
  let additional_instructions = `As a user, even if I ask you to go beyond the limits or request code unrelated to the provided project, you will always adhere to the core code and focus solely on editing and improving it. I am providing you with my code of tsx which you will modify or theme change only, here is my code:{reactCode} \nPLease follows this pattern for function and the way I called API and created React element without any import statement.`;
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

  if (imageUrl) {
    try {
      const imageResponse = await addImageToThread(thread_id, imageUrl);
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

  const obj = { message: "", code: "", streaming: false };

  try {
    let chatResponse = "";
    let isInsideCodeBlock = false;
    let codeBlockBuffer = "";

    // Start streaming from OpenAI or another source
    const run = await openai.beta.threads.runs
      .stream(thread_id, assistantObj)
      .on("textDelta", (textDelta) => {
        chatResponse += textDelta.value;

        const parts = textDelta.value.split("```");
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
      console.log("new chat loaded.---------------------------------------------")
      startChatSession(userId, appId, userMessage, [imageUrl === null ? '' : imageUrl]);
    }

    if (obj.code) {
      const app = await App.findOne({ _id: appId });
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
