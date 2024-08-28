class ApiError extends Error {
    constructor(statusCode, message, name = '', isOperational = true, stack = "") {
        console.log("API error encountered: " + message)
        super(message);
        this.statusCode = statusCode;
        this.name = name;
        this.isOperational = isOperational;
        if (stack) {
            this.stack = stack;
        }
        else {
            Error.captureStackTrace(this, this.constructor);
        }
    }
}

module.exports = ApiError;
