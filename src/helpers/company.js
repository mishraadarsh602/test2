const mongoose = require('mongoose');
const Company = require('../models/company');
module.exports = {

    createCompany: async (companyName,sub_domain,userId) => {
        try {
            const company = new Company({ 
                name: companyName, 
                sub_domain: sub_domain ,
                user_id: userId
            });
            await company.save();
            return company;
        } catch (err) {
            console.error(err);
            return null;
            // Handle the error appropriately
        }

    },
    async checkAndUpdateSubdomain(sub_domain) {
        let isExist = await Company.findOne({ sub_domain: sub_domain }).lean();
        while (isExist || sub_domain.length <= 2) {
          const randomNo = Math.floor(Math.random() * 1000);
          sub_domain = `${sub_domain}${randomNo}`;
          isExist = await Company.findOne({ sub_domain: sub_domain }).lean();
        }
        return sub_domain;
      },
      
}

