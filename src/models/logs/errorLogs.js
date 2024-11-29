const mongoose = require("mongoose");

const errorLogsSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.ObjectId,
      ref: "user",
      index: true, 
    },
    error: {
      type: String,
      required: true,
    },
    statusCode: {
      type: Number,
      required: true,
      index: true, 
    },
    requestPath: {
      type: String,
      required: true,
      index: true, 
    },
    requestBody: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);


errorLogsSchema.index({ "userId.name": 1 });
errorLogsSchema.index({ "userId.email": 1 });

const errorLogs = mongoose.model("errorLogs", errorLogsSchema);
module.exports = errorLogs;
