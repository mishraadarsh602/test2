const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const planModel=require('../models/plan.model');
const ApiError=require('../utils/throwError');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      trim: true,
      required: true,
      lowercase: true,
      unique: true,
      index: true
    },
    ogUserId:{
      type:String,
      default:""
    },
    ogCompanyName:{
      type:String,
      default:""
    },
    ogCompanyId:{
      type:String,
      default:""
    },
    ogSubscriptionId:{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'plan',
      required: true
    },
    totalAppsCount: {
      type: Number,
    },
    totalLeadsCount: {
      type: Number,
    },

    brandDetails: {
      enabled:{
        type:Boolean,
        default:false
      },
      brandInfo: {
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
      customBrand:{
       logo: {
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
        backgroundColor:{
            type:String,
            default:'',
      }
    },
  },
    domain:{
      type:String,
      default:""
    },
    status: {
      type: String,
      enum: ["active", "inactive", "pending"],
      default: "active",
    },
  },
  { timestamps: true }
);


userSchema.methods.generateToken = async function () {
 const secretKey = process.env.JWT_SECRET_KEY;
 try{
  return jwt.sign({
    userId:this._id.toString(),
    name:this.name,
    email:this.email,
    role:this.role,
    status: this.status,
    ogSubscriptionId: this.ogSubscriptionId,
  },
  secretKey,
  {
    // expiresIn:process.env.JWT_EXPIRY,
   expiresIn: '1d',
  });
 } catch (error) {
 console.log(error);
 }
}
userSchema.pre('save',
  async function(next) {
    const plan = await planModel.findById(this.ogSubscriptionId);
    if (!plan) {
      throw new ApiError(400, "Invalid plan ID provided. Please select a valid plan.");
    }
    if (this.totalAppsCount == null) {
      this.totalAppsCount = plan.totalAppsCount;
    }
    if (this.totalLeadsCount == null) {
      this.totalLeadsCount = plan.totalLeadsCount;
    }
    next();
  });

const User = mongoose.model("user", userSchema, "users");

module.exports = User;