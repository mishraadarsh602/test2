const GtMetrix = require('../service/gtmetrixService');
const gtmetrixObj = new GtMetrix();

const WeatherApi = require('../service/weatherapiService');
const weatherApiObj = new WeatherApi();
const App = require('../models/app');

module.exports = {

    getGtMetrixReport: async (req, res) => {
        try {
            const response = await gtmetrixObj.testUrl(req.body);
            res.status(200).json(response);
        } catch (error) {
            res.status(500).json({ message: 'Failed to start GTmetrix test', error: error.message });
        }
    },

    getCurrentWeather: async (req,res) =>{
        let location = req.query.location;
        try {
            const response = await weatherApiObj.currentWeather(location);
            res.status(200).json(response);
        } catch (error) {
            res.status(500).json({ message: 'Failed to retrieve data', error: error.message });
        }
    },

    getAllLocations: async (req,res) =>{
        let location = req.params.query;
        try {
            const response = await weatherApiObj.searchLocation(location);
            res.status(200).json(response);
        } catch (error) {
            res.status(500).json({ message: 'Failed to retrieve data', error: error.message });
        }
    },

    createApp: async (req, res) => {
        try {
            console.log("req.body", req.body);
            const app = new App(req.body);
            const response = await app.save();
            res.status(200).json({
                success: true,
                data: response
            });
            
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to create app',
                error: error.message
            });
        }
    },
    fetchAppById: async (req, res) => {
        try {
            const response = await App.findById(req.query.appId);
    
            if (!response) {
                return res.status(404).json({
                    success: false,
                    message: 'No app found with the provided ID'
                });
            }
    
            res.status(200).json({
                success: true,
                data: response
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to fetch app',
                error: error.message
            });
        }
    },
    updateApp: async (req, res) => {
        try {
            console.log("req.body1", req.body);
            const response = await App.findOneAndUpdate(
                { _id: req.body._id },
                { $set: req.body },
                { new: true } // Return the updated document
            );
    
            if (!response) {
                return res.status(404).json({
                    success: false,
                    message: 'No app found with the provided ID'
                });
            }
    
            res.status(200).json({
                success: true,
                message: 'App updated successfully',
                data: response
            });
        } catch (error) {
            res.status(500).json({
                success: false,
                message: 'Failed to update app',
                error: error.message
            });
        }
    }
        
}

