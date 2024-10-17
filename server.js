const express = require('express');
const http = require('http');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('./src/config/db');
const appRoutes = require("./src/routes");
const errorHandle = require("./src/utils/errorHandle");
const path = require('path');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const redisClient=require('./src/utils/redisClient');
// Connect to Redis
const connectRedis = async () => {
  try {
      await redisClient.connect();
      console.log('Connected to Redis');
  } catch (error) {
      console.error('Error connecting to Redis:', error);
      setTimeout(connectRedis, 5000); // Retry connection after 5 seconds
  }
};

connectRedis(); // Start Redis connection

connectDB();
const app = express();
const server = http.createServer(app);  // Create the HTTP server
require('./src/config/socket/chatConnect')(server);

app.use(express.json({ limit: "40mb" }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser()); // Ensure cookie-parser middleware is used

// Middleware
const corsOptions = {
    origin: [
      "http://127.0.0.1:4500",
      "http://localhost:4500",
      "http://localhost:4200",
      "http://localhost:3000",
      "https://gen-purpose-builder.web.app"
    ],
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    allowedHeaders: ["Content-Type", "x-refresh-token", "Authorization"],
    preflightContinue: false,
    optionsSuccessStatus: 204,
    credentials: true,
  };
app.use(cors(corsOptions));
app.use(morgan('dev'));

// Routes
app.get("/", (req, res) => {
    return res.json({ success: true, message: "Server#index" });
});
app.use("/api", appRoutes);
app.use(errorHandle.Error);

// Serve a basic route
app.get('/', (req, res) => {
  res.send('Server is running.');
});

// Start the server on port 4000
server.listen(process.env.PORT || 4000, () => {
  console.log('Server is running on http://localhost:4000');
});

// Error handling for Redis
redisClient.on("error", (err) => {
  console.error("Redis Client Error:", err);
});