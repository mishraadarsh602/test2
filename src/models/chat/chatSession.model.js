const mongoose = require("mongoose");
const messageSchema = new mongoose.Schema(
  {
    sno: {
      type: Number,
      default: 0,
    },
    role: {
      type: String,
      enum: ["system", "user", "assistant"],
      required: true,
    },
    content: { type: String },
    code: { type: String, default: "" },
  },
  { timestamps: true }
);

const SessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.ObjectId, ref: "user" },
    startTime: { type: Date },
    lastTime: { type: Date },
    timeSpent: { type: Number },
    sessionId: { type: String },
    conversationId: { type: String },
    agentId: { type: mongoose.Schema.ObjectId, ref: "App" },
    date: { type: Date },
    messages: [messageSchema],
  },
  { timestamps: true }
);

const chatSession = mongoose.model(
  "chatSession",
  SessionSchema,
  "chatSessions"
);

module.exports = chatSession;
