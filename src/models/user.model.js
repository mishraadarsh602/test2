const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

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
      type:String,
      default:""
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

const User = mongoose.model("user", userSchema, "users");

module.exports = User;