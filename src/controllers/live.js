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
async function updateAppVisitor(liveUrl, visitorCount) {
    try {
        await appModel.updateOne({ liveUrl, status: 'dev' }, { $set: { visitorCount } });
    } catch (error) {
    }
}

async function updateFeatureListCount(liveUrl, agentType) {
    try {
        const liveApp = await App.findOne({ liveUrl }, { type: 1, _id: 0 });
        await featureListModel.updateOne({ type: liveApp.type }, { $inc: { visitorCount: 1 } });
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
            const liveUrl = req.body.name;
            const visitorCreated = new appVisitorModel({
                liveUrl: liveUrl,
                user: userId,
                ...req.body
            });
            await visitorCreated.save();
            const visitorCount = await appVisitorModel.count({ liveUrl });
            updateAppVisitor(liveUrl, visitorCount);
            updateFeatureListCount(liveUrl);
            return res.status(200).json({
                message: 'Visits updated successfully',
            });
        } catch (error) {
        }
    }, 
    getLivePreview:async (req,res)=>{
        try {
            const liveUrl=req.body.name;
            let response;
            await redisClient.connect();
            let componentCode=await redisClient.get(`componentCode-${liveUrl}`);
            if(!componentCode){
            response=await App.findOne({liveUrl},{componentCode:1,_id:0});            
            await redisClient.set(`componentCode-${liveUrl}`,response.componentCode);
            }
            await  redisClient.quit();
            res.status(201).json({
                message: "fetch live preview successfully",
                data: componentCode?{componentCode}:response,
              });
        } catch (error) {
                    
        }   
                
        }
}

