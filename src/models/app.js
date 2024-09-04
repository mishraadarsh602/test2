'use strict';
const mongoose = require('mongoose');
const fieldsSchema = require('./fields');

const appSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    // user:{
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'User',
    //     required: true
    // },
    appUUID: {
        type: String,
        default:''
    },
    status: { 
        type: String, 
        enum: ['live', 'dev', 'deleted'], 
        default: 'dev' 
    },
    agent: {
        type: {
            type: String,
            default: 'weather'
        },
        status: { 
            type: String, 
            enum: ['active','deleted'], 
            default: 'active' 
        },
        heading: {
            type: String,
            default: "<span style='font-weight: 700;font-size: 2.25rem;line-height: 2.5rem;text-align: center;margin: 0;'>Weather Forecast1123</span>",
        },
        subHeading: {
            type: String,
            default: "Get the latest weather updates",
        },
        componentText: {
            type: String,
            default: "Search"
        },
        componentColor: {
            type: String,
            default: "#4f46e5"
        },
        themeColor: {
            type: String,
            default: "#111827"
        },
        location: {
            type: String,
            default: "Enter Location"
        },
        locationColor: {
            type: String,
            default: "#4f46e5"
        },
        locationComponentColor: {
            type: String,
            default: "#111827"
        },
        airQuality: {
            type: String,
            default: "<span style='font-weight: 700;font-size: 2.25rem;line-height: 2.5rem;text-align: center;margin: 0;'>Air Quality</span>"
        },
        airQualityToggle: {
            type: Boolean,
            default: false
        },
        celsiusToggle: {
            type: Boolean,
            default: true
        },
        outputToggle: {
            type: Boolean,
            default: false
        },
        feelsLike: {
            type: String,
            default: "Feels Like"
        },
        wind: {
            type: String,
            default: "Wind"
        },
        humidity: {
            type: String,
            default: "Humidity"
        },
        cloudCover: {
            type: String,
            default: "Cloud Cover"
        },
        uvIndex: {
            type: String,
            default: "UV Index"
        },
        pressure: {
            type: String,
            default: "Pressure"
        },
        airQualityCO: {
            type: String,
            default: "CO"
        },
        airQualityNO2: {
            type: String,
            default: "NO2"
        },
        airQualityO3: {
            type: String,
            default: "O3"
        },
        airQualitySO2: {
            type: String,
            default: "SO2"
        },
        airQualityPM25: {
            type: String,
            default: "PM2.5"
        },
        airQualityPM10: {
            type: String,
            default: "PM10"
        },
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
    useBrandDetail: {
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
        enableRedirect: {
            type: Boolean,
            default: false
        },
        redirectUrl: {
            type: String,
            default: ''
        },
        // fields: {
        //     type: [mongoose.Schema.Types.Mixed],
        //     required: false
        // }
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
            default:0.00 
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
        },
       
       
    }
}, { timestamps: true });

const App = mongoose.model('App', appSchema);
module.exports = App;
