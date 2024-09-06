const { Server } = require("socket.io"); // Import the Socket.IO server class

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
    console.log("Client connected:", socket.id);

    // Sending a message to the connected client
    socket.emit("message", "Welcome to the Socket.IO server!");

    // Listening for messages from the client
    socket.on("client-message", (data) => {
      console.log("Message from client:", data);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });
};
