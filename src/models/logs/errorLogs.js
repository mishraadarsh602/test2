const mongoose = require('mongoose');

const errorLogsSchema = new mongoose.Schema(
  {
    userId: { 
      type: mongoose.Schema.ObjectId, 
      ref: "User",
    },
    error: {
      type: String,
      required: true,
    },
    statusCode: {
      type: Number, 
      required: true,
    },
    requestPath: {
      type: String, 
      required:true
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

const errorLogs = mongoose.model('errorLogs', errorLogsSchema);
module.exports = errorLogs;
