'use strict';
const mongoose = require('mongoose');
const fieldsSchema = require('./fields');

const appSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        // unique: true
    },
    url:{
        type: String,
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    header: {
        logo: {
            enabled: {
                type: Boolean,
                default: true
            },
            alignment: {
                type: String,
                default: 'left'
            },
            size: {
                type: String,
                default: ''
            },
            url: {
                type: String,
                default: 'https://dlvkyia8i4zmz.cloudfront.net/X2lN5NGWQEeRUUjujnvj_logo.svg'
            },
            altText: {
                type: String,
                default: 'logo'
            }
        }
    },
    appUUID: {
        type: String,
        default: ''
    },
    thread_id: {
        type: String,
        default: ''
    },
    parentApp: {
        type: mongoose.Schema.ObjectId,
        ref: 'App'
    },
    apis: [{
        api: {
            type: String,
            default: ''
        }
    }],
    componentCode: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['live', 'dev', 'deleted', 'old'],
        default: 'dev'
    },
    agent_type: {
        type: String,
        default: ''
    },
    theme: {
        primaryColor: {
            type: String,
            default: '#dc6067'
        },
        backgroundColor: {
            type: String,
            default: '#fbfbfb'
        },
        secondaryColor: {
            type: String,
            default: '#d9b5b9'
        }
    },
    leadForm: {
        enabled: {
            type: Boolean,
            default: false
        },
        skip:{
            type:Boolean,
            default:false
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
        },


    },
    visitorCount: {
        type: Number,
        default: 0
    },
    changed: {
        type: Boolean,
        default: false
    },
}, { timestamps: true });

const App = mongoose.model('App', appSchema);
module.exports = App;
