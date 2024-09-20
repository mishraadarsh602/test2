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
module.exports = {
    generateVisitor:async (req,res)=>{
        try {
            const userId = req.user ? req.user.userId : null;
            if (!userId) {
                return res.status(400).json({ error: 'User ID is required' });
            }
            const liveUrl=req.body.liveUrl;
            const LiveApp=await App.findOne({liveUrl,status:'live'},{parentApp:1,type:1});
            const visitorCreated=new appVisitorModel({appId:LiveApp._id,parentApp:LiveApp.parentApp,
                ...req.body,
                user:userId  
             });
            await visitorCreated.save();
            const visitorCount= await appVisitorModel.count({parentApp:LiveApp.parentApp});
            await appModel.updateOne({liveUrl},{visitorCount});
            await featureListModel.updateOne({type:LiveApp.type},{$inc:{visitorCount:1}})
           return res.status(200).json({
            message:'Visits updated successfully',
           }) 
        } catch (error) {
                // console.log('erorr exist bro-----> ',error);
                
        }
    }, 
    getLivePreview:async (req,res)=>{
        try {
            const liveUrl=req.body.liveUrl;
            const fetchedApp=await App.findOne({liveUrl},{componentCode:1});
            res.status(201).json({
                message: "fetch live preview successfully",
                data: fetchedApp,
              });
        } catch (error) {
                
        }
      
    }
}

