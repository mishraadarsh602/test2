'use strict';
const mongoose = require('mongoose');
const fieldsSchema = require('./fields');

const appSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        // unique: true
    },
    url: {
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
            },
            link: {
                type: String,
                default: 'https://outgrow.co'
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
    ai: {
        model: {
            type: String,
            enum: ['claude-3-5-sonnet-20240620', 'gpt-4o', 'gpt-4o-mini'],
            default: 'dclaude-3-5-sonnet-20240620v'
        },
        key: {
            type: String,
            default: ''
        }
    },
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
    tool_type: {
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
        buttonText:{
            type:String,
            default:'Submit'
        },
        isIconPresent: {
            type: Boolean,
            default: true
        },
        skip: {
            type: Boolean,
            default: false
        },
        fields: [fieldsSchema],
        title: {
            type: String,
            default: 'How can we get in touch?'
        },
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
    paymentSetting: {
        enabled: {
            type: Boolean,
            default: false
        },
        paymentType: {
            type: String,
            default: 'stripeCheckout',
            enum: ['stripeCheckout','sensepass']
        }
    },
    payments:{
      type : Array,
        default : []  
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
appSchema.index({ "url": 1, "status": 1 });
appSchema.index({ "user": 1, "status": 1, "name": 1, "updatedAt": -1 });
appSchema.index({ "parentApp": 1, "status": 1 });
const App = mongoose.model('App', appSchema);
module.exports = App;
