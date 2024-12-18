
const mongoose = require('mongoose');

const aiTempLog = new mongoose.Schema({

    appId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'App',
      required: true
    },
  
    aiInputToken: {
        type: Number,
        default: 0,
    },
    aiOutputToken: {
        type: Number,
        default: 0,
    },
    aiTotalToken: {
      type: Number,
      default: 0,
  },
    model: {
      type: String,
      required: true
    },
 
}, {
    timestamps: true,
    autoIndex: true,
});

aiTempLog.index({ appId: 1, model: 1 });

const AiTempLog = mongoose.model('AiTempLog', aiTempLog, 'aiTempLog');
module.exports = AiTempLog;

