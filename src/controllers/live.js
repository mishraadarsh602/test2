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
            const name=req.params.appName;
            let response;
            await redisClient.connect();
            let componentCode=await redisClient.get(`componentCode-${name}`);
            if(!componentCode){
            response=await App.findOne({name:name,status:'live'});            
            await redisClient.set(`componentCode-${name}`,JSON.stringify(response));
            }
            await  redisClient.quit();
            res.status(201).json({
                message: "fetch live preview successfully",
                data: componentCode?JSON.parse(componentCode):response,
              });
        } catch (error) {

        }   
                
        }
}

