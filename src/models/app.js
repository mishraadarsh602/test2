'use strict';
const mongoose = require('mongoose');
const fieldsSchema = require('./fields');

const appSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        // unique: true
    },
    localeCode: {
        type: String,
        default: 'en',
        trim: true
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
                default: '50'
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
    icon: {
        type: String,
        default: ''
    },
    description: {
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
        },
        key: {
            type: String,
            default: ''
        }
    }],
    ai: {
        model: {
            type: String,
            enum: ['anthropic', 'openai'],
            default: 'anthropic'
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
        fb_lead:{
            type: Boolean,
            default: false
        },
        showSubTitle:{
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
        subTitle:{
            type:String,
            default:'Receive new articles and resources directly on your inbox. Fill your email below to join our email newsletter today.',
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
    visuals: {
        graph: {
         type:Object,
         default:null
        },
        table:{
            type:Object,
            default:null
        },
        visible: {
            type: Boolean,
            default: true
        },
        type: {
            type: String,
            default: 'image'
        },
        videoLink: {
            type: String,
            default: 'https://www.youtube.com/embed/PmN_MY5kNrE'
        },
        imageLink: {
            type: String,
            default: 'https://dlvkyia8i4zmz.cloudfront.net/DcgzVVEJTPaZYy1WF9s5_img.gif'
        },
        imageSize: {
            type: Number,
            default: 1572000
        },
        imageFit: {
            type: String,
            default: 'cover'
        },
        imageName: {
            type: String,
            default: 'default.jpg'
        },
        imageAlt: {
            type: String,
            default: '',
        },
        videoType: {
            type: String,
            default: 'youTube'
        }
    },
    payments:{
        enabled: {
            type: Boolean,
            default: false
        },
        paymentType: {
            type: String,
            default: 'stripeCheckout',
            enum: ['stripeCheckout','sensepass']
        },
        providers:{
            type : Array,
            default : []  
        }
    },
    visitorCount: {
        type: Number,
        default: 0
    },
    changed: {
        type: Boolean,
        default: false
    },
    noOfCopies: {
        type: Number,
        default: 0
    }
}, { timestamps: true });
appSchema.index({ "url": 1, "status": 1 });
appSchema.index({ "user": 1, "status": 1, "name": 1, "updatedAt": -1 });
appSchema.index({ "parentApp": 1, "status": 1 });
const App = mongoose.model('App', appSchema);
module.exports = App;
