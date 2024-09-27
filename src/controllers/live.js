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
const  mongoose = require('mongoose');
async function updateAppVisitor(name, visitorCount) {
    try {
        await appModel.updateOne({ name, status: 'dev' }, { $set: { visitorCount } });
    } catch (error) {
    }
}

async function updateFeatureListCount(name) {
    try {
        const liveApp = await App.findOne({ name }, { agent_type: 1, _id: 0 });        
        await featureListModel.updateOne({ type: liveApp.agent_type }, { $inc: { visitorCount: 1 } });
    } catch (error) {

    }
}
module.exports = {
    generateVisitor:async (req,res)=>{
    try {
      const userId = req.user ? req.user.userId : null;
      if (!userId) {
                return res.status(400).json({ error: 'User ID is required' });
      }
      const name = req.body.name;
      const visitorCreated = new appVisitorModel({
        name,
        user: userId,
                ...req.body
      });
      await visitorCreated.save();
      const visitorCount = await appVisitorModel.count({ name });
      updateAppVisitor(name, visitorCount);
      updateFeatureListCount(name);
      return res.status(200).json({
                message: 'Visits updated successfully',
      });
        } catch (error) {
        }
  },
    getLivePreview:async (req,res)=>{
    try {
      const parameter = req.params.appName;
      let response;
      
      // Check if Redis client is already connected
      if (!redisClient.isOpen) {
        await redisClient.connect();
      }

      let componentCode = await redisClient.get(`componentCode-${parameter}`);
      if (!componentCode) {
        response = await App.findOne({ name: parameter, status: "live" });
  
        // If response not found, try to fetch by _id
        if (!response && mongoose.Types.ObjectId.isValid(parameter)) {
          response = await App.findOne({
            _id: new mongoose.Types.ObjectId(parameter),
            status: "live",
          });
        }

        if (!response) {
          return res.status(404).json({ error: "Page Not Found" });
        }
  
        await redisClient.set(`componentCode-${parameter}`, JSON.stringify(response));
      }

      res.status(201).json({
        message: "Fetched live preview successfully",
        data: componentCode ? JSON.parse(componentCode) : response,
      });
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
};

