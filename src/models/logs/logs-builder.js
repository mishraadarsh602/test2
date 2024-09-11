const mongoose = require('mongoose');

const logsBuilder = new mongoose.Schema(
    {
        appId: {
            type: mongoose.Schema.ObjectId, ref: "App"
        },
        userId: { type: mongoose.Schema.ObjectId, ref: "user" },
        error: {
            type: String,
            trim: true,
            default: ''
        },
    },
    {
        timestamps: true,
    }
);

const LogsBuilder = mongoose.model('LogsBuilder', logsBuilder);
module.exports = LogsBuilder;