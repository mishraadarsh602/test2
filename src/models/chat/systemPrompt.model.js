const mongoose = require("mongoose");

const SystemPromptSchema = new mongoose.Schema(
  {
    parentPrompt: {
      type: String
    },
    childPrompt: {
      aibased: {
        type: String
      },
      apibased: {
        type: String
      }
    },
    apiMatchingPrompt: {
      type: String
    }
  },
  { timestamps: true }
);

const systemPromptSession = mongoose.model(
  "systemPromptSession",
  SystemPromptSchema,
  "systemPromptSessions"
);

module.exports = systemPromptSession;
