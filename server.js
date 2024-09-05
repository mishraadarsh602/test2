const express = require('express');
const http = require('http');
const { Server } = require('socket.io');  // Import the Socket.IO server class

const app = express();
const server = http.createServer(app);  // Create the HTTP server

// Create a new Socket.IO instance attached to the server
const io = new Server(server, {
  cors: {
    origin: '*',  // Enable CORS for development
    methods: ['GET', 'POST']
  }
});

// Set up a basic connection event
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Sending a message to the connected client
  socket.emit('message', 'Welcome to the Socket.IO server!');

  // Listening for messages from the client
  socket.on('client-message', (data) => {
    console.log('Message from client:', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Serve a basic route
app.get('/', (req, res) => {
  res.send('Server is running.');
});

// Start the server on port 4000
server.listen(4000, () => {
  console.log('Server is running on http://localhost:4000');
});
