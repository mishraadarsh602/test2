const mongoose = require("mongoose");

const userSessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.ObjectId, ref: "user" },
    timeSpent: { type: Number },
    chatsessions: [{ type: mongoose.Schema.ObjectId, ref: "chatSession" }],
    date: { type: Date },
  },
  { timestamps: true }
);

const userSession = mongoose.model(
  "userSession",
  userSessionSchema,
  "userSessions"
);

module.exports = userSession;
