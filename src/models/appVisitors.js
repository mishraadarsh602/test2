const mongoose = require('mongoose');

const appVisitorSchema = new mongoose.Schema(
    {
        app: {
              type: mongoose.Schema.ObjectId,
              ref: 'App',
            required: true
        },
        live_app: {
            type: mongoose.Schema.ObjectId,
            ref: 'App',
            required: true
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
        utm_source: {
            type: String,
            trim: true,
            default: ''
        },
        utm_medium: {
            type: String,
            trim: true,
            default: ''
        },
        utm_campaign: {
            type: String,
            trim: true,
            default: ''
        },
        utm_term: {
            type: String,
            trim: true,
            default: ''
        },
        utm_content: {
            type: String,
            trim: true,
            default: ''
        },
    },
    {
        timestamps: true,
    }
);

const appVisitors = mongoose.model('appVisitors', appVisitorSchema);
module.exports = appVisitors;