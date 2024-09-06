const { Server } = require("socket.io"); // Import the Socket.IO server class
const {
  startChatSession,
  fetchPreviousChat,
  startLLMChat,
  updateAIMessageToChatSession,
  updateHumanMessageToChatSession
} = require("../../controllers/chat/chat.controller");

module.exports = (server) => {
  console.log("Server Connecting");
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
    console.log("A client connected:", socket.id);

    // Listen for the 'startChat' event from the client
    socket.on("startChat", async (data) => {
      console.log("Chat started by user:", data);

      await startChatSession(data.userId, data.agentId, data.message);

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

      const aiMsg = await startLLMChat(msg);

      await updateAIMessageToChatSession(data.userId, data.agentId, aiMsg);

      // Optionally, emit a response to the client
      socket.emit("message", aiMsg);
    });

    socket.on("fetchPreviousChat", async (data) => {
      console.log("Chat fetched:", data);
      const messages = await fetchPreviousChat(data.userId, data.agentId);
      console.log(messages);
      let msg = [];
      if (messages.length > 0) {
        for (let i = 1; i < messages.length; i++) {
          if (i % 2 !== 0) {
            msg.push({ text: messages[i].content, sender: "user" });
          } else {
            msg.push({ text: messages[i].content, sender: "bot" });
          }
        }
      }
      console.log(msg);
      socket.emit("previousMessages", msg);
    });

    socket.on("continueChat", async (data) => {
      console.log("Chat Continued by user:", data);

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

      await updateHumanMessageToChatSession(data.userId, data.agentId, data.message)
      
      msg.push(['human', data.message])

      const aiMsg = await startLLMChat(msg);

      await updateAIMessageToChatSession(data.userId, data.agentId, aiMsg);

      // Optionally, emit a response to the client
      socket.emit("message", aiMsg);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });
};
