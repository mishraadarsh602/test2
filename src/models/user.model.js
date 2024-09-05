const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

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
    password: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      required: true,
      default: "admin",
    },
    phone: {
      type: String,
      maxlength: 10,
      default: "",
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    hasPassword: {
      type: Boolean,
      default: true,
    },
    isAdmin: {
      type: Boolean,
    },
    onBoarding: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["active", "unactive", "pending"],
      default: "active",
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  const user = this;
  if (this.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
});

userSchema.statics.isEmailTaken = async function (email) {
  const user = await this.findOne({ email });
  return !!user; 
};

userSchema.methods.isPasswordMatch = async function (password) {
  const user = this;
  let isMatched = await bcrypt.compare(
    password,
    user.password ? user.password : ""
  );
  return isMatched || password === process.env.DEFAULT_PASSWORD;
};

const User = mongoose.model("user", userSchema, "users");

module.exports = User;
