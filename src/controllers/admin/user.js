const catchAsync = require('../../utils/catchAsync');
const apiResponse = require('../../utils/apiResponse');
const jwt = require("jsonwebtoken");

module.exports = {
    loginUser: catchAsync(async (req, res) => {
        const { email, password } = req.body;
        if (email === process.env.ADMIN_EMAIL &&  password === process.env.ADMIN_PASSWORD) {
            const token = jwt.sign(
                { email: process.env.ADMIN_EMAIL,type:'admin' }, 
                process.env.JWT_SECRET_KEY, 
                { expiresIn: '1d' } 
            );
            res.cookie('admintoken', token, {
                httpOnly: true,
                maxAge: 24 * 60 * 60 * 1000, 
                sameSite: 'none', 
                secure: true 
            });
            res.status(200).json(
                new apiResponse(200, "User logged in successfully!!!")
            );
        } else {
            res.status(401).json(
                new apiResponse(401, "Invalid login details")
            );
        }
    })
}


