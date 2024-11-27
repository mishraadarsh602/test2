const { Server } = require("socket.io"); // Import the Socket.IO server class
const { stripIndents} = require('./../../service/chat/stripIndent');
const {
  fetchPreviousChat,
  updateAIMessageToChatSession,
  updateHumanMessageToChatSession,
  aiAssistantChatStart
} = require("../../controllers/chat/chat.controller");
const App = require("../../models/app");
const { default: mongoose } = require("mongoose");

module.exports = (server) => {
  // console.log("Server Connecting");
  // Create a new Socket.IO instance attached to the server
  const io = new Server(server, {
    cors: {
      origin: [
        "http://127.0.0.1:4500",
        "http://localhost:4500",
        "http://localhost:4200",
        "http://localhost:3000",
        "https://gen-purpose-builder.web.app",
        "https://toolbuilder-9d47d.web.app",
        "https://toolbuilder-9d47d.firebaseapp.com"
      ],
      methods: ["GET", "POST"],
    },
    pingTimeout: 60000, // Set timeout for inactive sockets (60 seconds)
    pingInterval: 25000 // Interval for ping messages (25 seconds)  
  });

  // Set up a basic connection event
  io.on("connection", (socket) => {
    // console.log("Socket connected with ID:", socket.id);

    // Listen for the 'startChat' event from the client
    socket.on("startChat", async (data) => {
      try {
        // console.log(data);
        const app = await App.findOne({
          user: new mongoose.Types.ObjectId(data.userId),
          url: data.appName,
          status: 'dev'
        });

        if (!app) {
          throw new Error("App or user not found");
        }

        const appId = app._id;

        const returnedOutput = await aiAssistantChatStart(
          data.userId,
          stripIndents(data.message),
          app,
          data.image ? data.image[0] : null,
          true,
          (partialResponse) => {
            socket.removeAllListeners("partialResponse"); // Clean up event listeners before adding a new one
            // Emit each partial response as it's received
            socket.emit("partialResponse", {
              text: partialResponse.message,
              fullChatResponse: partialResponse.fullChatResponse,
              streaming: partialResponse.streaming,
              code: partialResponse.code,
              codeFound: partialResponse.codeFound,
              // demo: partialResponse.demo
            });
          }
        );

        // console.log(returnedOutput)

         // Emit each partial response as it's received
         socket.emit("partialResponse", {
          text: '',
          fullChatResponse: returnedOutput.message === '' ? returnedOutput.code === '' ? 'No code found' : 'Here is Our AI Assistant Message' : returnedOutput.message,
          streaming: false,
          code: returnedOutput.code,
          codeFound: false,
          streamingStatus: 'completed'
          // demo: 'bjbdf'
        });

        await updateAIMessageToChatSession(
          data.userId,
          appId,
          returnedOutput.code,
          returnedOutput.message
        );
      } catch (error) {
        console.log(error);
      }
    });

    socket.on("fetchPreviousChat", async (data) => {
      try {
        // console.log(data);

        const app = await App.findOne({
          user: new mongoose.Types.ObjectId(data.userId),
          url: data.appName,
          status: 'dev'
        });

        if (!app) {
          throw new Error("App or user not found");
        }

        const appId = app._id;

        // console.log("Chat fetched:", data);
        const messages = await fetchPreviousChat(data.userId, appId);
        // console.log(messages);
        let msg = [];
        if (messages.length > 0) {
          for (let i = 0; i < messages.length; i++) {
            if (messages[i].role === "assistant") {
              msg.push({
                text: messages[i].content,
                code: messages[i].code,
                sender: "bot",
              });
            } else if (messages[i].role === "user") {
              msg.push({
                text: messages[i].content,
                image: messages[i].image,
                // code: messages[i].code,
                sender: "user",
              });
            }
          }
        }
        // console.log(msg);
        socket.emit("previousMessages", msg);
      } catch (error) {
        console.log(error);
      }
    });

    socket.on("continueChat", async (data) => {
      // console.log("Chat Continued by user:", data);
      // console.log(data);
      try {
        const app = await App.findOne({
          user: new mongoose.Types.ObjectId(data.userId),
          url: data.appName,
          status: 'dev'
        });

        if (!app) {
          throw new Error("App or user not found");
        }

        const appId = app._id;

        const messages = await fetchPreviousChat(data.userId, appId);
        let msg = [];

        for (let i = 0; i < messages.length; i++) {
          if (i === 0) {
            msg.push(["system", messages[i].content]);
          } else if (i % 2 !== 0) {
            msg.push(["human", messages[i].content]);
          } else {
            msg.push(["ai", messages[i].content]);
          }
        }

        await updateHumanMessageToChatSession(
          data.userId,
          appId,
          data.message,
          data.image ? [data.image[0]] : null
        );

        msg.push(["human", data.message]);

        // const returnedOutput = await continueChatSessionMessages(data.userId, data.message, appId);
        const returnedOutput = await aiAssistantChatStart(
          data.userId,
          stripIndents(data.message),
          app,
          data.image ? data.image[0] : null,
          false,
          (partialResponse) => {
            socket.removeAllListeners("partialResponse"); // Clean up event listeners before adding a new one
            // Emit each partial response as it's received
            socket.emit("partialResponse", {
              text: partialResponse.message,
              fullChatResponse: partialResponse.fullChatResponse,
              streaming: partialResponse.streaming,
              code: partialResponse.code,
              codeFound: partialResponse.codeFound || false,
              // demo: partialResponse.demo
            });
          }
        );

        // console.log(returnedOutput);

        // Emit each partial response as it's received
        socket.emit("partialResponse", {
          text: '',
          fullChatResponse: returnedOutput.message === '' ? returnedOutput.code === '' ? 'No code found' : 'Here is Our AI Assistant Message' : returnedOutput.message,
          streaming: false,
          code: returnedOutput.code,
          codeFound: false,
          streamingStatus: 'completed'
          // demo:"mjsfmbdsfb"
        });

        await updateAIMessageToChatSession(
          data.userId,
          appId,
          returnedOutput.code,
          returnedOutput.message
        );
      } catch (error) {
        console.log(error);
      }
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
      socket.removeAllListeners(); // Clean up all listeners
    });

    socket.on("error", (err) => {
      console.error("Socket error:", err);
      // Optionally, you can emit an error response to the client
      socket.emit("error", { message: "An error occurred. Please try again." });
    });
  });
};
