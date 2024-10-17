const mongoose = require('mongoose');
const featureListSchema = new mongoose.Schema(
    {
        type: { 
            type: String,
            required: true,
            index: true
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
            index: true
        },
        comingSoon:{  
            type: Boolean,
            required: true,
            default:true,
        },
        apis: [{
            api: {
                type: String,
                default: ''
            }
        }],
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
        tool_type: {
            type: String,
            default: ''
        },
        rank: {
            type: Number,
            default: 999999
        }
    },
    {
        timestamps: true,
    }
);

const featureListModel = mongoose.model('featureList', featureListSchema);
module.exports = featureListModel;