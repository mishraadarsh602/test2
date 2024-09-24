const { Server } = require("socket.io"); // Import the Socket.IO server class
const {
  fetchPreviousChat,
  updateAIMessageToChatSession,
  updateHumanMessageToChatSession,
  aiAssistantChatStart
} = require("../../controllers/chat/chat.controller");

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
        "https://gen-purpose-builder.web.app"
      ],
      methods: ["GET", "POST"],
    },
  });

  // Set up a basic connection event
  io.on("connection", (socket) => {
    // console.log("Socket connected with ID:", socket.id);

    // Listen for the 'startChat' event from the client
    socket.on("startChat", async (data) => {

      const returnedOutput = await aiAssistantChatStart(
        data.userId,
        data.message,
        data.agentId,
        data.image,
        true,
        (partialResponse) => {
          // Emit each partial response as it's received
          socket.emit("partialResponse", {
            text: partialResponse.message,
            fullChatResponse: partialResponse.fullChatResponse,
            streaming: partialResponse.streaming,
            code: partialResponse.code,
            codeFound: partialResponse.codeFound
          });
        }
      );

      await updateAIMessageToChatSession(
        data.userId,
        data.agentId,
        returnedOutput.code,
        returnedOutput.message
      );

      // Optionally, emit a response to the client
      // socket.emit("message", {
      //   code: returnedOutput.code,
      //   text: returnedOutput.message,
      // });
    });

    socket.on("fetchPreviousChat", async (data) => {
      // console.log("Chat fetched:", data);
      const messages = await fetchPreviousChat(data.userId, data.agentId);
      // console.log(messages);
      let msg = [];
      if (messages.length > 0) {
        for (let i = 0; i < messages.length; i++) {
          if (messages[i].role === 'assistant') {
            msg.push({ text: messages[i].content, code: messages[i].code, sender: "bot" });
          } else if (messages[i].role === 'user') {
            msg.push({
              text: messages[i].content,
              // code: messages[i].code,
              sender: "user",
            });
          }
        }
      }
      // console.log(msg);
      socket.emit("previousMessages", msg);
    });

    socket.on("continueChat", async (data) => {
      // console.log("Chat Continued by user:", data);

      const messages = await fetchPreviousChat(data.userId, data.agentId);
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
        data.agentId,
        data.message,
        [data.image]
      );

      msg.push(["human", data.message]);

      // const returnedOutput = await continueChatSessionMessages(data.userId, data.message, data.agentId);
      const returnedOutput = await aiAssistantChatStart(
        data.userId,
        data.message,
        data.agentId,
        data.image,
        false,
        (partialResponse) => {
          // Emit each partial response as it's received
          socket.emit("partialResponse", {
            text: partialResponse.message,
            fullChatResponse: partialResponse.fullChatResponse,
            streaming: partialResponse.streaming,
            code: partialResponse.code,
            codeFound: partialResponse.codeFound
          });
        }
      );

      await updateAIMessageToChatSession(
        data.userId,
        data.agentId,
        returnedOutput.code,
        returnedOutput.message
      );
      
      // Optionally, emit a response to the client
      // socket.emit("message", {
      //   code: returnedOutput.code,
      //   text: returnedOutput.message,
      // });
    });

    socket.on("disconnect", () => {
      // console.log("Client disconnected:", socket.id);
    });
  });
};
