const App = require('../models/app');
const User = require('../models/user.model');
const { v4: uuidv4 } = require('uuid');
const frontendLogsModel=require('../models/logs/logs-frontend');
async function createLog(data){
    try {
        let logCreated = new frontendLogsModel(data);
        await logCreated.save();
    } catch (error) {
        // res.status(500).json({ error: error.message });
    }
}
module.exports = {


    createApp: async (req, res) => {
        try {
            let appData = req.body;
            appData['appUUID'] = uuidv4();
            if(appData.agent.type=='weather'){
                appData.name = 'Weather Forecast-' + appData['appUUID'].substring(0,7);
                }
            let newApp = new App(appData);           
            let savedApp = await newApp.save();
            res.status(201).json({
                message: "App created successfully",
                data: savedApp,
              });
        } catch  (error) {
           await createLog({userId:'66d18a4caf4d3c54cdeb44f6',error:error.message})
            res.status(500).json({ error: error.message });
        }
    },
    getAllAppsOfUser: async (req, res) => {
        try {
            // let condition = {
            //     user:req.body.userId,
            //     status:'DEV'
            // };
            // let apps = await App.find(condition).populate('user').lean();
            let apps=await App.find({status:'dev'}).lean();
            if (!apps || apps.length == 0) {
                return res.status(200).json({ message: 'No app found' });
            }
            res.status(200).json({
                message: "All Apps fetched successfully",
                data: apps,
              });
        } catch (error) {      
            await createLog({userId:'66d18a4caf4d3c54cdeb44f6',error:error.message})    
            res.status(500).json({ error: error.message });
        }
    },

    deleteApp: async (req, res) => {
        try {
            const appId = req.params.appId;
            const deletedApp = await App.findByIdAndUpdate(appId, { status: 'deleted' }).exec();
            if (!deletedApp) {
                return res.status(404).json({ error: 'App not found' });
            }
            res.status(200).json({ message: 'App deleted successfully' }); // app: deletedApp
        } catch (error) {
            await createLog({userId:'66d18a4caf4d3c54cdeb44f6',error:error.message})
            res.status(500).json({ error: error.message });
        }
    },
}

