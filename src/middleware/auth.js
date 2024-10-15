const jwt = require('jsonwebtoken');
const secretKey = process.env.JWT_SECRET_KEY;
const auth = async (req, res, next) => {
    try {
     
        const token = req.cookies.token;
        if(!token) return res.status(401).json({ error: 'Access Denied' });
        const verified = jwt.verify(token, secretKey);
        // Check if the token has a 'status' variable and if it's 'inactive'
        if (verified.status && verified.status === 'inactive') {
            return res.status(401).json({ error: 'Access Removed' });
        }
        req.user = verified;
        next();
    }
    catch (error) {
        res.status(401).json({ message: 'Invalid Token' });
    }
}
module.exports = auth;
