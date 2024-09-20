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
    generateVisitor:async (req,res)=>{
        try {
            const userId = req.user ? req.user.userId : null;
            if (!userId) {
                return res.status(400).json({ error: 'User ID is required' });
            }
            const LiveApp=await App.findOne({parentApp:req.body.parentId,status:'live'})
            const visitorCreated=new appVisitorModel({appId:LiveApp._id,parentApp:LiveApp.parentApp,
                ...req.body,
                user:userId  
             });
            await visitorCreated.save();
            const visitorCount= await appVisitorModel.count({parentApp:LiveApp.parentApp});
            await appModel.findByIdAndUpdate(req.body.parentId,{visitorCount});
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
            const fetchedApp=await App.findById(appId,{componentCode:1});
            res.status(201).json({
                message: "fetch live preview successfully",
                data: fetchedApp,
              });
        } catch (error) {
            
        }
      
    }
}

