const App = require('../models/app');
const appVisitorModel = require('../models/appVisitors');
const appModel=require('../models/app');
const featureListModel=require('../models/featureList');
// const frontendLogsModel=require('../models/logs/logs-frontend');
// async function createLog(data){
//     try {
//         let logCreated = new frontendLogsModel(data);
//         await logCreated.save();
//     } catch (error) {
//         // res.status(500).json({ error: error.message });
//     }
// }
const redisClient=require('../utils/redisClient');
const appLeadsModel=require('../models/appLeads');
const  mongoose = require('mongoose');
module.exports = {
    getLivePreview:async (req,res)=>{
    try {
      const parameter = req.params.url;
      let response;
      
      // Check if Redis client is already connected
      if (!redisClient.isOpen) {
        await redisClient.connect();
      }

      let app = await redisClient.get(`app-${parameter}`);
      if (!app) {
        response = await App.findOne({ url: parameter, status: "live" });
        
        // If response not found, try to fetch by _id
        if (!response && mongoose.Types.ObjectId.isValid(parameter)) {
          response = await App.findOne({
            _id: new mongoose.Types.ObjectId(parameter),
            status: "live",
          });
        }

        if (!response) {
          return res.status(405).json({ error: "Page Not Found" });
        }
        await redisClient.set(`app-${parameter}`, JSON.stringify(response));
      }

      res.status(201).json({
        message: "Fetched live preview successfully",
        data: app ? JSON.parse(app) : response,
      });
    } catch (error) {    
      res.status(500).json({ error: "Internal Server Error" });
    }
  },
  saveLead:async (req,res)=>{
    try {
      const userId = req.user ? req.user.userId : null;
      if (!userId) {
                return res.status(400).json({ error: 'User ID is required' });
      }

      let body={...req.body,user:userId,parentApp: new mongoose.Types.ObjectId(req.params.appId)}
      const data=await appLeadsModel(body);
      await data.save();
      return res.status(200).json({
        message: 'lead save successfully',
});
    } catch (error) {

    }
   
  }

};

