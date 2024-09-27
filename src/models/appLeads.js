const mongoose = require('mongoose');

const appLeadSchema = new mongoose.Schema(
    {
        name:{
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
        },
        email:{
            type:String,
            required:true,
        },
        parentApp:{
            type: mongoose.Schema.Types.ObjectId,
        ref: 'App',
        }
    },
    {
        timestamps: true,
    }
);

const appVisitors = mongoose.model('appLeads', appLeadSchema);
module.exports = appVisitors;