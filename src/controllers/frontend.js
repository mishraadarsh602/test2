const mongoose = require('mongoose'); // Import mongoose
const App = require('../models/app');
const User = require('../models/user.model');
const { v4: uuidv4 } = require('uuid');
const frontendLogsModel=require('../models/logs/logs-frontend');
const UserService = require('../service/userService');

const userService = new UserService();
async function createLog(data){
    try {
        let logCreated = new frontendLogsModel(data);
        await logCreated.save();
    } catch (error) {
        // res.status(500).json({ error: error.message });
    }
}
module.exports = {

    getUserDetail: async (req, res) => { 
        console.log("req.user:",req.user)  
            try {
                let user = await User.findById(req.user.userId.toString());
                if (!user) {
                    return res.status(404).json({ error: 'User not found' });
                }
                res.status(200).json({
                    message: "User fetched successfully",
                    data: user,
                  });
            } catch (error) {
                res.status(500).json({ error: error.message });
            }
        },
    
    createApp: async (req, res) => {
        try {
            let appData = req.body;
            appData['appUUID'] = uuidv4();
            if (appData.agent.type == 'weather') {
                appData.name = 'Weather Forecast-' + appData['appUUID'].substring(0, 7);
            }
            const userId = req.user ? req.user.userId : null;
            if (!userId) {
                return res.status(400).json({ error: 'User ID is required' });
            }
            appData['user'] = new mongoose.Types.ObjectId(userId); // Use new keyword
    
            let newApp = new App(appData);
            let savedApp = await newApp.save();
            res.status(201).json({
                message: "App created successfully",
                data: savedApp,
            });
        } catch (error) {
            await createLog({ userId:req.user.userId, error: error.message });
            res.status(500).json({ error: error.message });
        }
    },
    getAllAppsOfUser: async (req, res) => {
        try {
            const userId = req.user ? req.user.userId : null;
            if (!userId) {
                return res.status(400).json({ error: 'User ID is required' });
            }
           
            let apps = await App.find({ status: 'dev', user: userId });
            if (!apps || apps.length == 0) {
                return res.status(200).json({ message: 'No app found' });
            }
            res.status(200).json({
                message: "All Apps fetched successfully",
                data: apps,
            });
        } catch (error) {      
            await createLog({userId:req.user.userId,error:error.message})    
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
            createLog({userId:'66d18a4caf4d3c54cdeb44f6',error:error.message})
            res.status(500).json({ error: error.message });
        }
    },
}

