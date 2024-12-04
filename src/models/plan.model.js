const mongoose = require('mongoose');

const planSchema = new mongoose.Schema(
    {
        _id: {
            type: String,
            trim: true
        },
        agent: [
            {
                type: {
                    type: String, 
                },
                allowedCount: {
                    type: Number
                }
            }
        ],
        totalLeads: {
            type: Number
        }
    },
    {
        timestamps: true,
        autoIndex: true,
    }
);

module.exports = mongoose.model('Plan', planSchema);
