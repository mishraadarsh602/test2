const mongoose = require('mongoose');

const logsFrontend = new mongoose.Schema(
    {
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

const LogsFrontend = mongoose.model('LogsFrontend', logsFrontend);
module.exports = LogsFrontend;