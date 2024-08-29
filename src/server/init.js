const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('../config/db');
const appRoutes = require("../routes");
const errorHandle = require("../utils/errorHandle");

require('dotenv').config();

// Connect to database
// connectDB();

const app = express();

app.use(express.json({ limit: "40mb" }));
app.use(express.urlencoded({ extended: false }));

// Middleware
const corsOptions = {
    origin: [
      "http://127.0.0.1:4500",
      "http://localhost:4500",
      "http://localhost:4200",
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

module.exports = app;
