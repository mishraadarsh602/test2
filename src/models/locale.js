const _ = require('lodash');
const mongoose = require('mongoose');
const calcLocales = require('./calc-locales');

const localeSchema = new mongoose.Schema(
    {
        langCode: {
            type: String,
            trim: true,
            default: ''
        },
        language: {
            type: String,
            trim: true,
            default: ''
        },
        fields: calcLocales
    },
    {
        timestamps: true,
    }
);


const Locale = mongoose.model('Locale', localeSchema);
module.exports = Locale;