<<<<<<< HEAD
'use strict';
const mongoose = require('mongoose');

const appSchema = new mongoose.Schema({
    appName: {
        type: String,
        required: false
    },
    agent: {
        status: {
            type: String,
            required: false
        },
        heading: {
            type: String,
            required: false
        },
        subHeading: {
            type: String,
            required: false
        },
        componentText: {
            type: String,
            required: false
        },
        componentColor: {
            type: String,
            required: false
        },
        themeColor:{
            type:String,
            required:false
        },
        location:{
            type:String,
            required:false
        },
        locationColor:{
            type:String,
            required:false
        },
        locationComponentColor:{
            type:String,
            required:false
        },
        airQuality: {
            type: String,
            required: false
        },
        airQualityToggle: {
            type: Boolean,
            required: false
        },
        celsiusToggle: {
            type: Boolean,
            required: false
        },
        outputToggle: {
            type: Boolean,
            required: false
        },
        feelsLike: {
            type: String,
            required: false
        },
        wind: {
            type: String,
            required: false
        },
        humidity: {
            type: String,
            required: false
        },
        cloudCover: {
            type: String,
            required: false
        },
        uvIndex: {
            type: String,
            required: false
        },
        pressure: {
            type: String,
            required: false
        },
        airQualityCO: {
            type: String,
            required: false
        },
        airQualityNO2: {
            type: String,
            required: false
        },
        airQualityO3: {
            type: String,
            required: false
        },
        airQualitySO2: {
            type: String,
            required: false
        },
        airQualityPM25: {
            type: String,
            required: false
        },
        airQualityPM10: {
            type: String,
            required: false
        },
     },
    theme: {
        mode: {
            type: String,
            required: false
        },
        primaryColor: {
            type: String,
            required: false
        },
        themeColor: {
            type: String,
            required: false
        },
        textColor: {
            type: String,
            required: false
        }
    },
    domain: {
        type: {
            type: String,
            required: false
        },
        default: {
            type: String,
            required: false
        },
        trim: {
            type: Boolean,
            required: false
        }
    },
    useBrandDetail: {
        type: Boolean,
        required: false
    },
    brandDetail: {
        fonts: {
            type: [String],
            required: false
        },
        colors: {
            type: [String],
            required: false
        },
        logo: {
            type: String,
            required: false
        },
        favicon: {
            type: String,
            required: false
        },
        title: {
            type: String,
            required: false
        },
        description: {
            type: String,
            required: false
        },
        topImages: {
            type: [String],
            required: false
        }
    },
    leadForm: {
        enabled: {
            type: Boolean,
            required: false
        },
        thankYouMessage: {
            type: String,
            required: false
        },
        enableRedirect: {
            type: Boolean,
            required: false
        },
        redirectUrl: {
            type: String,
            required: false
        },
        fields: {
            type: [mongoose.Schema.Types.Mixed],
            required: false
        }
    },
    payments: {
        recurringBilling: {
            enabled: {
                type: Boolean,
                required: false
            },
            interval: {
                type: String,
                required: false
            }
        },
        taxRates: {
            default: {
                type: Number,
                required: false
            },
            byCountry: {
                type: Map,
                of: Number,
                required: false
            }
        },
        invoicing: {
            enabled: {
                type: Boolean,
                required: false
            },
            companyName: {
                type: String,
                required: false
            },
            companyAddress: {
                type: String,
                required: false
            }
        },
        enabled: {
            type: Boolean,
            required: false
        },
        mode: {
            type: String,
            required: false
        },
        currency: {
            type: String,
            required: false
        },
        amount: {
            type: Number,
            required: false
        },
        providers: {
            type: [mongoose.Schema.Types.Mixed],
            required: false
        }
    }
});

const App = mongoose.model('App', appSchema);
module.exports = App;
=======
const mongoose = require('mongoose');
const fieldsSchema = require('./fields');

const AppSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
    user: { 
        type: mongoose.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    appUUID: {
        type: String,
        default:''
    },
    status: { 
        type: String, 
        enum: ['LIVE', 'DEV', 'DELETED'], 
        default: 'DEV' 
    },
    theme: {
        mode: { 
            type: String,
            default: 'dark' 
        },
        primaryColor: { 
            type: String,
            default: '#6366F1' 
        },
        backgroundColor: { 
            type: String,
            default: '#1F2937' 
        },
        textColor: { 
            type: String,
            default: '#FFFFFF'
        }
    },
    domain: {
        type: { 
            type: String,
            default: '' 
        },
        default: { 
            type: String,
            default: '' 
        },
        trim: { 
            type: Boolean,
            default: true
        }
    },
    use_brand_detail: { 
        type: Boolean, 
        default: true 
    },
    brand_detail: {
        fonts: { type: Array, default: [] },
        colors: { type: Array, default: [] },
        logo: { type: String, default: '' },
        favicon: { type: String, default: '' },
        title: { type: String, default: '' },
        description: { type: String, default: '' },
        topImages: { type: Array, default: [] }
    },
    leadForm: {
        enabled: { 
            type: Boolean, 
            default: false 
        },
        fields: [fieldsSchema],
        thankYouMessage: { 
            type: String, 
            default: "Thank you for your interest! We'll be in touch soon." 
        },
        enable_redirect: { 
            type: Boolean, 
            default: false 
        },
        redirectUrl: { 
            type: String, 
            default: '' 
        }
    },
    payments: {
        enabled: { 
            type: Boolean,
            default: false 
        },
        mode: { 
            type: String,
            default: 'live' 
        },
        currency: { 
            type: String,
            default: 'USD' 
        },
        amount: { 
            type: Number,
            default: 0.00 
        },
        recurringBilling: {
            enabled: { 
                type: Boolean, 
                default: false 
            },
            interval: { 
                type: String, 
                default: 'monthly' 
            }
        },
        providers: [{
            name: { 
                type: String, 
                default: '' 
            },
            enabled: { 
                type: Boolean, 
                default: false 
            },
            config: {
                // publicKey: { type: String, default: '' },
                // secretKey: { type: String, default: '' },
                // webhookSecret: { type: String, default: '' },
                // clientId: { type: String, default: '' },
                // clientSecret: { type: String, default: '' },
                // environment: { type: String, default: '' }
                type: Object,
                default: {}
            }
        }],
        taxRates: {
            default: {
                type: Number,
                default: 0.00
            },
            byCountry: {
                type: Object,
                default: {}
            }
        },
        invoicing: {
            enabled: { 
                type: Boolean,
                default: true 
            },
            companyName: { 
                type: String,
                default: '' 
            },
            companyAddress: { 
                type: String,
                default: ''
            }
        }
    },
    agent_type: { 
        type: String, 
        default: '' 
    },
}, { timestamps: true });

const App = mongoose.model('App', AppSchema);

module.exports = App;
>>>>>>> 8c7a57d15712e8bdddd18d0726f8d212e79c73fc
