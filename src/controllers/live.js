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
            const LiveApp=await App.findOne({parentApp:req.body.parentId,status:'live'},{parentApp:1,type:1});
            const visitorCreated=new appVisitorModel({appId:LiveApp._id,parentApp:LiveApp.parentApp,
                ...req.body,
                user:userId  
             });
            await visitorCreated.save();
            const visitorCount= await appVisitorModel.count({parentApp:LiveApp.parentApp});
            await appModel.findByIdAndUpdate(req.body.parentId,{visitorCount});
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
            const appId=req.params.appId;
            const fetchedApp=await App.findById(appId,{componentCode:1});
            res.status(201).json({
                message: "fetch live preview successfully",
                data: fetchedApp,
              });
        } catch (error) {
            
        }
      
    }
}

