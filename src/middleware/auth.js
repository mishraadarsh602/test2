const jwt = require('jsonwebtoken');
// const secretKey = "jwt-secret-cGmzBNH2wUo&list=PLwGdqUZWnOp2Z3eFOgtOGvOWIk4e8Bsr_";
const secretKey = process.env.JWT_SECRET_KEY;
const auth = async (req, res, next) => {
    try {
        const cookieHeader = req.headers.cookie;
        if (!cookieHeader) return res.status(401).json({ error: 'Access Denied' });
        const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
            const [key, value] = cookie.trim().split('=');
            acc[key] = value;
            return acc;
        }, {});
        let token = cookies.token;
        if (token) {
            token = token.replace(/\s+/g, ''); // Remove all whitespace characters
        }
        if(!token) return res.status(401).json({ error: 'Access Denied' });
        const verified = jwt.verify(token, secretKey);
        req.user = verified;
        next();
    }
    catch (error) {
        res.status(401).json({ message: 'Invalid Token' });
    }
}
module.exports = auth;
