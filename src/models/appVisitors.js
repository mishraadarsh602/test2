const mongoose = require('mongoose');

const appVisitorSchema = new mongoose.Schema(
    {
        appId: { // refer to liveAppId with status=> live
            type: mongoose.Schema.ObjectId,
             ref: "App",
            required: true,
        },
        parentId: {  // // refer to parentAppId with status=> dev
            type: mongoose.Schema.ObjectId,
            ref: "App" ,
            required: true,
        },
        userId:{
            type: mongoose.Schema.ObjectId,
            ref:'user',
            required:true
        },
        browser:{
            type:String,
            required:true,
        },
        device:{
            type:String,
            required:true,
        },
        ipAddress:{
            type:String,
            required:true
        }
    },
    {
        timestamps: true,
    }
);

const appVisitors = mongoose.model('appVisitors', appVisitorSchema);
module.exports = appVisitors;