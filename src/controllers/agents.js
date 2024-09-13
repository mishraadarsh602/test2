const GtMetrix = require('../service/gtmetrixService');
const gtmetrixObj = new GtMetrix();

const WeatherApi = require('../service/weatherapiService');
const weatherApiObj = new WeatherApi();

const Api = require('../service/apiService');
const apiObj = new Api();

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
    createApi: async (req,res) =>{
        try {
            console.log("req.body:",req.body);
            const response = await apiObj.createApi(req.body);
            res.status(200).json(response);
        } catch (error) {
            res.status(500).json({ message: 'Failed to retrieve data', error: error.message });
        }
    },
    getAllApi:async (req,res) =>{
        try {
            const response = await apiObj.getAllApi();
            res.status(200).json(response);
        } catch (error) {
            res.status(500).json({ message: 'Failed to retrieve data', error: error.message });
        }
    }

        
}

