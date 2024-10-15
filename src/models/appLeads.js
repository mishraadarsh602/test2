const mongoose = require('mongoose');

const appLeadSchema = new mongoose.Schema(
    {
        key: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'appVisitors'
        },
        // app: { // parentApp of status dev
        //       type: mongoose.Schema.ObjectId,
        //       ref: 'App',
        //     required: true
        // },
        // live_app: {
        //     type: mongoose.Schema.Types.ObjectId,
        //     ref: 'App'
        // },
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
    },
    {
        timestamps: true,
    }
);

const appVisitors = mongoose.model('appLeads', appLeadSchema);
module.exports = appVisitors;