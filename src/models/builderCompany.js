
const mongoose= require("mongoose");

const schema= new mongoose.Schema({
    company:{
        type:mongoose.Schema.ObjectId,
        ref:"Company"
    },
    domain: {
        type: String,
        default: '',
        trim: true
    },
    useBrandDetail: {
        type: Boolean,
        default: true
    },
    brandDetailCount:{
        type:Number,
        default:1
    },
    userCustomBrandDetail: {
        colors: {
            type: Array,
            default: []
        },
        logo: {
            type: String,
            default: ''
        },
        favicon: {
            type: String,
            default: ''
        },
        primaryColor:{
            type:String,
            default:'',
        },
        secondaryColor:{
            type:String,
            default:'',
        },
    },
    brandDetail: {
        colors: {
            type: Array,
            default: []
        },
        logo: {
            type: String,
            default: ''
        },
        favicon: {
            type: String,
            default: ''
        }
    },
},{timestamps:true,autoIndex:true})


module.exports= mongoose.model("builderCompany",schema,'builderCompanies');