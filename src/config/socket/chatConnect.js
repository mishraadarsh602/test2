const { Server } = require("socket.io"); // Import the Socket.IO server class
const {
  startChatSession,
  fetchPreviousChat,
} = require("../../controllers/chat/chat.controller");

module.exports = (server) => {
  console.log("Server Connecting");
  // Create a new Socket.IO instance attached to the server
  const io = new Server(server, {
    cors: {
      origin: "http://localhost:3000", // Enable CORS for development
      methods: ["GET", "POST"],
    },
  });

  // Set up a basic connection event
  io.on("connection", (socket) => {
    console.log("A client connected:", socket.id);

    // Listen for the 'startChat' event from the client
    socket.on("startChat", (data) => {
      console.log("Chat started by user:", data);

      startChatSession(data.userId, data.agentId, data.message);

      generateChatgptOutput();

      // Optionally, emit a response to the client
      socket.emit("message", "Welcome! Let’s start chatting.");
    });

    socket.on("fetchPreviousChat", async (data) => {
      console.log("Chat fetched:", data);
      const messages = await fetchPreviousChat(data.userId, data.agentId);
      let msg = [];
      for(let i = 1; i < messages.length; i++){
        if(i % 2 !== 0){
          msg.push({text: messages[i].content, sender: 'user'});
        }else{
          msg.push({text: messages[i].content, sender: 'bot'});
        }
      }
      socket.emit("previousMessages", msg);
    });

    socket.on("continueChat", (data) => {
      console.log("Chat Continued by user:", data);

      // Optionally, emit a response to the client
      socket.emit("message", "Welcome! Let’s Continue Chatting.");
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });
};
