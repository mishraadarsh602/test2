const _ = require('lodash');
const mongoose = require('mongoose');
const calcLocales = require('./calc-locales');

const localeSchema = new mongoose.Schema(
  {
    langCode: {
      type: String,
      trim: true,
     
      required: true,
    },
    language: {
      type: String,
      trim: true,
      
      required: true,
    },
    fields: calcLocales,
  },
  {
    timestamps: true,
  }
);


const Locale = mongoose.model('Locale', localeSchema);
module.exports = Locale;