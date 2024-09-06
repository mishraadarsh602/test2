const mongoose = require("mongoose");

const SystemPromptSchema = new mongoose.Schema(
  {
    mainSystemPrompt: { type: String },
  },
  { timestamps: true }
);

const systemPromptSession = mongoose.model(
  "systemPromptSession",
  SystemPromptSchema,
  "systemPromptSessions"
);

module.exports = systemPromptSession;
