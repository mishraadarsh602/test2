const mongoose = require('mongoose');

const planSchema = new mongoose.Schema(
    {
        totalAppsCount:{
            type:Number,
        },
        totalLeadsCount: {
            type: Number
        },
        planName:{
            type:String,
            unique:true,
        },
        //features to add through fetaure model and sync to selected plans
        // enhance_prompt
        // upload_image
        // upload_doc
        // brand_setup
        // enhance_magic -> usage count 10/app
        // email_notificaation
        // channel_analytics
        // social_launch_link
        // embed_on_webpage
        // export_lead

        features:[
            {
                type: String,
                ref: 'features_new'
            }
        ]
    },
    {
        timestamps: true,
        autoIndex: true,
    }
);

module.exports = mongoose.model('plan', planSchema);
