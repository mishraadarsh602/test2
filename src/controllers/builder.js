const App = require('../models/app');
const User = require('../models/user.model');
const { v4: uuidv4 } = require('uuid');

module.exports = {

    createUser: async (req, res) => {
        try {
            let userData = req.body;
            let newUser = new User(userData);
            let savedUser = await newUser.save();
            res.status(201).json({
                message: "App created successfully",
                data: savedUser,
              });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

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
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    getAppById: async (req, res) => {
        try {
            // let app = await App.findById(req.params.appId).populate('user').lean();
             let app = await App.findById(req.params.appId);
            if (!app) {
                return res.status(404).json({ error: 'App not found' });
            }
            res.status(200).json({
                message: "App fetched successfully",
                data: app,
              });
        } catch (error) {
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
            res.status(500).json({ error: error.message });
        }
    },

    updateApp: async (req, res) => {
        try {
            let appId = req.params.appId;
            // let { name } = req.body;
            let updateData = req.body;

            // if (name) {
            //     let existingApp = await App.findOne({ name, _id: { $ne: appId },status: { $ne: 'DELETED' } }).lean();
            //     if (existingApp) {
            //         return res.status(400).json({ error: 'An app with this name already exists' });
            //     }
            //     updateData.name = name;
            // }

            let updatedApp = await App.findByIdAndUpdate(appId, updateData, { new: true }).lean();
            if (!updatedApp) {
                return res.status(404).json({ error: 'App not found' });
            }

            res.status(200).json({
                message: "App Updated successfully",
                data: updatedApp,
            });
        } catch (error) {
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
            res.status(500).json({ error: error.message });
        }
    },

    checkUniqueApp: async (req, res) => {
        try {
            let name = decodeURIComponent(req.params.name);
            let appId = req.params.appId;
            let existingApp = await App.findOne({ name, _id: { $ne: appId }}).lean();
            if (existingApp) {
                return res.status(200).json({ exists: true });
            } else {
                return res.status(200).json({ exists: false });
            }
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }

}

