const mongoose = require('mongoose');

const appVisitorSchema = new mongoose.Schema(
    {
        liveUrl:{
            type:String,
            required:true
        },
        user:{
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
        },
        deleted:{
            type:Boolean,
            default:false
        }
    },
    {
        timestamps: true,
    }
);

const appVisitors = mongoose.model('appVisitors', appVisitorSchema);
module.exports = appVisitors;