const mongoose = require("mongoose");
const apiSchema = new mongoose.Schema(
  {
    key: { 
         type: String,
         default:'',
         unique: true,
        },
    api: { 
        type: String,
        default:'',
    },
    purpose: {
         type: String,
         default:'',
         },
    output: { 
        type:Array,
        default:[], 
    } 
  },
  { timestamps: true }
);



const Api = mongoose.model("Api", apiSchema, "apis");

module.exports = Api;