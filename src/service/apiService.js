const Api = require('../models/api.model');
module.exports = class ApiService {
    async getAllApi() {
        try {
            return await Api.find();
        } catch (error) {
            console.error(`Error finding apis`, error);
        }
    };
    async createApi(data) {
        try {
        const createApi = new Api(data);
        const savedUser = createApi.save()
        return savedUser;
        } catch (error) {
            console.log(error.message);
        }
    };

};
