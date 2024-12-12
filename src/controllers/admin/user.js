const catchAsync = require('../../utils/catchAsync');
const apiResponse = require('../../utils/apiResponse');
const jwt = require("jsonwebtoken");

module.exports = {
  loginUser: catchAsync(async (req, res) => {
    const { email, password } = req.body;
    if (
      email === process.env.ADMIN_EMAIL &&
      password === process.env.ADMIN_PASSWORD
    ) {
      const token = jwt.sign(
        { email: process.env.ADMIN_EMAIL, type: "admin" },
        process.env.JWT_SECRET_KEY,
        { expiresIn: "1d" }
      );
      res.cookie("admintoken", token, {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
        sameSite: "none",
        secure: true,
      });
      res.status(200).json(
        new apiResponse(200, "User logged in successfully!!!", {
          email: process.env.ADMIN_EMAIL,
          type: "admin",
        })
      );
    } else {
      res.status(401).json(new apiResponse(401, "Invalid login details"));
    }
  }),
  checkUser: catchAsync(async (req, res) => {
    try {
      if (
        req.user.email === process.env.ADMIN_EMAIL &&
        req.user.type === "admin"
      ) {
       return res.status(200).json({
          message: "User fetched successfully",
          data: req.user,
          success: true,
        });
      }
      return res.status(404).json({ error: "User not found" });
    } catch (error) {
     return  res.status(500).json({ error: error.message });
    }
  }),
  logoutUser: catchAsync(async (req, res) => {
    try {
      // Clear the token cookie
      res.clearCookie("admintoken", {
        httpOnly: true,
        sameSite: "none",
        secure: true,
      });

      res
        .status(200)
        .json(new apiResponse(200, "User logged out successfully!", null));
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }),
};


