const mongoose = require('mongoose');

const logsLivecalc = new mongoose.Schema(
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

const LogsLivecalc = mongoose.model('LogsLivecalc', logsLivecalc);
module.exports = LogsLivecalc;