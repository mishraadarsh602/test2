const App = require('../models/app');
const appVisitorModel = require('../models/appVisitors');
const appModel=require('../models/app');
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
    updateVisitorCount:async (req,res)=>{
        try {
            const userId = req.user ? req.user.userId : null;
            if (!userId) {
                return res.status(400).json({ error: 'User ID is required' });
            }
            const LiveApp=await App.findOne({parentApp:req.params.parentId,status:'live'})
            const visitorCreated=new appVisitorModel({appId:LiveApp._id,parentId:LiveApp.parentApp,
                ...req.body,
                userId:userId  
             });
            await visitorCreated.save();
            const visitorCount= await appVisitorModel.count({parentId:LiveApp.parentApp});
            await appModel.findByIdAndUpdate(req.params.parentId,{visitorCount});
           return res.status(200).status({
            message:'Visits updated successfully',
           }) 
        } catch (error) {
                // console.log('erorr exist bro-----> ',error);
                
        }
    }, 
    getLivePreview:async (req,res)=>{
        try {
            const appId=req.params.appId;
            const fetchedApp=await App.findById(appId);
            res.status(201).json({
                message: "fetch live preview successfully",
                data: fetchedApp,
              });
        } catch (error) {
            
        }
      
    }
}

