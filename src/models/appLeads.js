const mongoose = require('mongoose');

const appLeadSchema = new mongoose.Schema(
    {
        key: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'appVisitors'
        },
        live_app: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'App'
        },
        fields: [
            {
                field_name: {
                    type: String,
                    trim: true,
                    default: ''
                },
                value: {
                    type: String,
                    trim: true,
                    default: ''
                },
                title: {
                    type: String,
                    trim: true,
                    default: ''
                },
                subtype: {
                    type: String,
                    trim: true,
                    default: ''
                },
                placeholder: {
                    type: String,
                    trim: true,
                    default: ''
                }
            }
        ],
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