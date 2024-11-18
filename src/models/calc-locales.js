
const mongoose = require('mongoose');
let dictionary = {};
['location', 'isRequired', 'isMandatory', 'emailError', 'phoneNumberError', 'USPhoneNumberError',
    'minVal', 'maxVal', 'minimum', 'maximum', 'charAllowed', 'charRequired', 'submit',
    'skip', 'isoCode', 'redo', 'review', 'disclaimer', 'viewCharts', 'graphAndCharts',
    'next', 'back', 'section', 'of', 'follow', 'share', 'tweet', 'shareOL', 'answers', 'to', 'scrollForResults',
    'name', 'firstName', 'fullName', 'tel', 'tel_us', 'others', 'lastName', 'email', 'results', 'viewMedias',
    'reviewP', 'voters', 'shareOn', 'readMore', 'viewFeedback', 'or', 'InvalidBusinessEmail', 'go', 'loadMoreProds',
    'addToCart', 'correct', 'incorrect', 'exact', 'exact_1', 'range', 'zipCodeError', 'pressEnter', 'zip_code', 'continue',
    'acceptAndClose', 'scrollDownToSeeMore', 'shiftEnterTip', 'upload', 'uploading', 'deny', 'completed',
    'fileSizeExceed', 'invalidFileType', 'pleaseUpload', 'shareResult', 'info', 'viewDetailedResult', 'notAnswered', 'file'].forEach((item) => dictionary[item] = { type: String, trim: true, default: '' });

const calcLocales = new mongoose.Schema(dictionary);

module.exports = calcLocales;
