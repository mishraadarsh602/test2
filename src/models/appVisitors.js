const mongoose = require('mongoose');

const appVisitorSchema = new mongoose.Schema(
    {
        appId: {
            type: mongoose.Schema.ObjectId,
             ref: "App",
            required: true,
        },
        parentId: { 
            type: mongoose.Schema.ObjectId,
            ref: "App" ,
            required: true,
        },
        userId:{
            type: mongoose.Schema.ObjectId,
            ref:'user',
            required:true
        }
    },
    {
        timestamps: true,
    }
);

const appVisitors = mongoose.model('appVisitors', appVisitorSchema);
module.exports = appVisitors;