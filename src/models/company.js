const mongoose = require('mongoose');
const companySchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: true,
        minlength: 3,
    },
    sub_domain: {
        type: String,
        trim: true,
        required: true,
        minlength: 3,
        lowercase: true,
        unique: true
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },  
}, {
        timestamps: true,
        autoIndex: true,
    });



const Company = mongoose.model('Company', companySchema, 'companies');
module.exports  = Company