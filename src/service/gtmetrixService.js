const axios = require('axios');
require('dotenv').config();

const GTMETRIX_API_BASE_URL = 'https://gtmetrix.com/api/2.0';
const gtmetrixApiInstance = axios.create({
    baseURL: GTMETRIX_API_BASE_URL,
    headers: {
        'Authorization': `Basic ${Buffer.from(`${process.env.GTMETRIX_API_KEY}:`).toString('base64')}`,
        'Content-Type': 'application/vnd.api+json'
    }
});

module.exports =  class GtMetrix {
    
    async testUrl(data) {
        try {
            let response = await gtmetrixApiInstance.post('/tests', data);
            let urlTestData = response.data;
            async function pingTestIdForReport(testId) {
                let getUrlReport = async (resolve, reject) => {
                    try {
                        let response = await gtmetrixApiInstance.get(`/tests/${testId}`);
                        if (response.data.data.type === 'report') {
                            resolve(response.data);
                        } else {
                            setTimeout(() => getUrlReport(resolve, reject), 1000);
                        }
                    } catch (error) {
                        reject(error);
                    }
                };
                return new Promise(getUrlReport);
            }
            
            let urlReportData = await pingTestIdForReport(urlTestData.data.id);
            return {urlTestData,urlReportData}
        } catch (error) {
            console.error('Error starting GTmetrix test:', error.message);
            throw error;
        }
    };

};
