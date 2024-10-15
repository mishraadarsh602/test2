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
        agent_type: {
            type: String
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
        type:{
            type: String,
            enum: ['Visitor', 'Lead', 'Engagement', 'Deleted'],
            default: 'Visitor'
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
        lead:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'appLeads',
        },
        transaction_mode: {
            type: String,
            trim: true,
            default: ''
        },
        transaction_status: {
            type: String,
            trim: true,
            default: ''
        },
        transaction_json: {
            type: String,
            trim: true,
            default: ''
        },
        transaction_completed: {
            type: Boolean,
            default: false
        }
    },
    {
        timestamps: true,
    }
);
appVisitorSchema.index({ app: 1, createdAt: 1 })
const appVisitors = mongoose.model('appVisitors', appVisitorSchema);
module.exports = appVisitors;