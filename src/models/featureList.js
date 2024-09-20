const mongoose = require('mongoose');
const featureListSchema = new mongoose.Schema(
    {
        type: { 
            type: String,
            required: true,
        },
        title:{
            type:String,
            required:true
        },
        description:{
            type:String,
            required:true
        },
        active: {  
            type: Boolean,
            required: true,
            default:true,
        },
        componentCode:{
            type: String,
            required:true
        },
        icon:{
            type:String,
            required:true
        },
        visitorCount:{
            type: Number,
            default:0 
        },
    },
    {
        timestamps: true,
    }
);

const featureListModel = mongoose.model('featureList', featureListSchema);
module.exports = featureListModel;