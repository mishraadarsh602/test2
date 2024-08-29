const axios = require('axios');
require('dotenv').config();

const WEATHER_API_BASE_URL = 'http://api.weatherapi.com/v1';
const weatherApiInstance = axios.create({
    baseURL: WEATHER_API_BASE_URL,
    headers: {
        'Content-Type': 'application/vnd.api+json'
    },
    // params: {
    //     key: process.env.WEATHER_API_KEY
    // }
});

module.exports = class WeatherApi {

    async currentWeather(location) {
        try {
            let apiType = 'current.json';
            // let apiURL = `/${apiType}?key=${process.env.WEATHER_API_KEY}&q=${location}&aqi=yes`;
            // const response = await axios.get(`${WEATHER_API_BASE_URL}/${apiType}?key=${process.env.WEATHER_API_KEY}&q=${location}&aqi=yes`);
            // const response = await weatherApiInstance.get(apiURL);
            const response = await weatherApiInstance.get(`/${apiType}`, {
                params: { key: process.env.WEATHER_API_KEY, q: location, aqi: 'yes' }
            });
            return response.data;
        } catch (error) {
            console.error(error.message);
            throw error;
        }
    };

    async searchLocation(location) {
        try {
            let apiType = 'search.json';
            const response = await weatherApiInstance.get(`/${apiType}`, {
                params: { key: process.env.WEATHER_API_KEY, q: location }
            });
            return response.data;
        } catch (error) {
            console.error(error.message);
            throw error;
        }
    };
};
