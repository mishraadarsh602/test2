const mongoose = require('mongoose');
const planFeaturesSchema = new mongoose.Schema(
    {
        _id: {
            type: String,
            trim:true,
        },
        name: {
            type: String,
            trim: true,
            required: true,
            unique: true
        },
        heading: {
            type: String,
            trim: true,
            default: ''
        },

        description: {
            type: String,
            trim: true,
            default: 'Please describe this feature'
        },

        media_link: {
            type: String,
            default: ''
        },

        media_type: {
            type: String,
            enum: ['', 'IMAGE', 'VIDEO', 'GIF', 'YOUTUBE'],
            default: ''
        },

        active: {
            type: Boolean,
            default: true
        },

        seq: {
            type: Number,
            default: 0
        },

        parent_feature: {
            type: String,
            ref: 'features_new',
            default: null
        },

        sub_features: [{
            type: String,
            ref: 'features_new'
        }],
    },
    {
        timestamps: true,
        autoIndex: true,
    }
);


module.exports = mongoose.model('plan_features', planFeaturesSchema, 'plan_features' );