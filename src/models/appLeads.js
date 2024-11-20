const mongoose = require('mongoose');

const appLeadSchema = new mongoose.Schema(
    {
        key: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'appVisitors'
        },
        app: { // parentApp of status dev
            type: mongoose.Schema.ObjectId,
            ref: 'App',
            required: true
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
                // title: {
                //     type: String,
                //     trim: true,
                //     default: ''
                // },
                subtype: {
                    type: String,
                    trim: true,
                    default: ''
                },
                // placeholder: {
                //     type: String,
                //     trim: true,
                //     default: ''
                // }
            }
        ],
    },
    {
        timestamps: true,
    }
);

appLeadSchema.index({ "app": 1, "createdAt": -1 });
appLeadSchema.index({ "key": 1, "createdAt": -1 });
const appLeads = mongoose.model('appLeads', appLeadSchema);
module.exports = appLeads;