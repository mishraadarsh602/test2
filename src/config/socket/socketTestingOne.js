const socketIo = require("socket.io");
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});
app.set("socketio", io);
io.on("connection", (socket) => {});
io.sockets.on("connection", async (socket) => {
  // let vv = await io.fetchSockets();
  console.log(io.sockets.connected);
  io.sockets.sockets["nickname"] = socket.id;
  // console.log("socket connection : ", socket.id, io.sockets.sockets);

  // io.sockets.connected[socket.id].emit("socket-conn-id", socket.id);
  // for (let socketId in io.sockets.sockets) {
  //   const connectedSocket = io.sockets.sockets["nickname"];
  //   console.log(
  //     `Connected socket ${socket._id} ${
  //       connectedSocket.connected ? "is" : "is not"
  //     } connected`
  //   );
  // }
  socket.on("joinConversation", async (data) => {
    const userId = data.userId;
    console.log(io.sockets.connected);
    let user = await User.findById(userId);
    if (io.sockets.connected[user.socketId]) {
      // Disconnect existing socket connection
      io.sockets.connected[user.socketId].disconnect(true);
    }
    // socket.userId = user._id;
    user.socketId = socket.id;
    await user.save();
  });
});
