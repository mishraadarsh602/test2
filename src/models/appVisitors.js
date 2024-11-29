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
            enum: ['Visitor','Lead', 'Engagement', 'Deleted'],
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
        lead_fields: [
            {
            field_name: {
                type: String,
                trim: true,
                default: '',
            },
            value: {
                type: String,
                trim: true,
                default: '',
            },
            subtype: {
                type: String,
                trim: true,
                default: '',
            },
        },
    ],
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
        },
        amount: {
            type: Number,
            default: null
        },
        currency: {
            type: String,
            default: null
        },
    },
    {
        timestamps: true,
    }
);
appVisitorSchema.index({ app: 1, createdAt: 1, type: 1 })
const appVisitors = mongoose.model('appVisitors', appVisitorSchema);
module.exports = appVisitors;