const mongoose = require('mongoose');

const planSchema = new mongoose.Schema(
    {
        totalAppsCount:{
            type:Number,
        },
        totalLeads: {
            type: Number
        },
        planName:{
            type:String,
            unique:true,
        }
    },
    {
        timestamps: true,
        autoIndex: true,
    }
);

module.exports = mongoose.model('plan', planSchema);
