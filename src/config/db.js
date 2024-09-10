const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        const DB_URL = process.env.MONGO_URI;
        mongoose.connect(DB_URL);
        mongoose.set('debug', true);
        const db = mongoose.connection;

        db.on('error', console.error.bind(console, "Error connecting to db"));

        db.on('connected', function () {
            console.log('[1]Mongoose connection open ');
        });

        db.once('open', () => {
            console.log('[2] MONGO_DB CONNECTIONS SUCCESSFULL');
        });

        db.on('error', function (err) {
            console.error('[4]Mongoose default error: ' + err);
        });

        db.on('disconnected', function () {
            console.log('[3]Mongoose default connection disconnected');
        });

        process.on('SIGINT', function () {
            db.close();
        });
    } catch (err) {
        console.log('connection error =>', err);
    }
};

module.exports = connectDB;
