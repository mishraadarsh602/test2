'use strict';

const mongoose = require('mongoose');

const dropdownSchema = new mongoose.Schema({
    text: {
        type: String,
        trim: true,
        default: ''
    }
});

const fieldsSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            trim: true,
            default: 'First Name'
        },
        fileName: [],
        fieldsArray: [dropdownSchema],
        givenArray:[],
        previousIcons:[],
        name: {
            type: String,
            trim: true,
            default: 'First Name'
        },
        unique: {
            type: Boolean,
            default: false
        },
        placeholder: {
            type: String,
            trim: true,
            default: 'First Name'
        },
        value: {
            type: String,
            trim: true,
            default: ''
        },
        key: {
            type: String,
            trim: true,
            default: ''
        },
        subType: {
            type: String,
            trim: true,
            default: ''
        },
        emailValidator: {
            type: Boolean,
            default: false
        },
        freeEmailValidator: {
            type: Boolean,
            default: false
        },
        disposableEmailValidator: {
            type: Boolean,
            default: false
        },
        lowDeliverEmailValidator: {
            type: Boolean,
            default: false
        },
        validations: {
            required: {
                status: {
                    type: Boolean,
                    default: true,
                },
                message: {
                    type: String,
                    trim: true,
                    default: 'Field is Required'
                }
            },
            minLength: {
                status: {
                    type: Boolean,
                    default: false,
                }
            },
            maxLength: {
                status: {
                    type: Boolean,
                    default: false,
                }
            }
        },
        icon: {
            type: String,
            trim: true,
            default: ''
        },
        showConnect:{
            type:Boolean,
            default:false
        },
        connectArray: [ {
            type: String,
            trim: true,
            default: ''
        }],
        fileExt:{
            type: Object,
            default: {'Doc': false, 'Excel': false, 'Image': true, 'Pdf': false, 'Vector Graphics': false,'Video': false}
        },
        errorInUploading: {
            type:Boolean,
            default:false
        },
        uploadErr:{
            type:String,
            default:''
        },
        inProgress:  {
            type:Boolean,
            default:false
        },   
    }, { usePushEach: true }
);

module.exports = fieldsSchema;
