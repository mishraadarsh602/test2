const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const connectDB = require('../config/db');
const appRoutes = require("../routes");
const errorHandle = require("../utils/errorHandle");
const path = require('path');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser'); // Ensure cookie-parser is required

const env = process.env.NODE_ENV;
dotenv.config({ path: path.resolve(__dirname, `../../env/.env.${env}`) });
connectDB();

const app = express();
app.use(express.json({ limit: "40mb" }));
app.use(express.urlencoded({ extended: false }));
app.use(morgan('dev'));
app.use(cookieParser()); // Ensure cookie-parser middleware is used

// Middleware
const corsOptions = {
    origin: [
      "http://127.0.0.1:4500",
      "http://localhost:4500",
      "http://localhost:4200",
      "http://localhost:3000",
      "http://localhost:3001",
      "https://gen-purpose-builder.web.app",
      "https://gen-ai-admin.firebaseapp.com",
      "https://toolbuilder-9d47d.web.app",
      "https://toolbuilder-9d47d.firebaseapp.com"
    ],
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
    allowedHeaders: ["Content-Type", "x-refresh-token", "Authorization","Access-Control-Allow-Credentials"],
    preflightContinue: false,
    optionsSuccessStatus: 204,
    credentials: true, // Allow credentials (cookies)
};

app.use(cors(corsOptions));

// Routes
app.get("/", (req, res) => {
    return res.json({ success: true, message: "Server#index" });
});
app.use("/api", appRoutes);
app.use(errorHandle.Error);

module.exports = app;