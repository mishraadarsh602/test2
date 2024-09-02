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