const jwt = require('jsonwebtoken');
// const secretKey = "jwt-secret-cGmzBNH2wUo&list=PLwGdqUZWnOp2Z3eFOgtOGvOWIk4e8Bsr_";
const secretKey = process.env.JWT_SECRET_KEY;
const auth = async (req, res, next) => {
    try {
     
        const token = req.cookies.token;
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
