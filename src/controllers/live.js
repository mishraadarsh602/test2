const App = require('../models/app');
const appVisitors = require('../models/appVisitors');
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
    getLiveApp:async (req,res)=>{
        try {
            const LiveApp=await App.findOne({parentApp:req.params.parentId,status:'live'})
            const visitorCreated=new appVisitors({appId:LiveApp._id,parentId:LiveApp.parentApp,userId:'66d18a4caf4d3c54cdeb44f6'});
            await visitorCreated.save();
            const response= await appVisitorModel.count();
            console.log('count of response is  -----> ',response);
           return res.status(200).status({
            message:'Live app fetched successfully',
            data:LiveApp
           }) 
        } catch (error) {
                console.log('erorr exist bro-----> ',error);
                
        }
    }
}

