const mongoose = require('mongoose'); // Import mongoose
const App = require('../models/app');
const User = require('../models/user.model');
const { v4: uuidv4 } = require('uuid');
const frontendLogsModel=require('../models/logs/logs-frontend');
const UserService = require('../service/userService');
const featureListModel=require('../models/featureList');
const { OpenAI } = require("openai");
const chatSession = require('../models/chat/chatSession.model');

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
      appData.name = appData.agent_type + '-' + appData['appUUID'].substring(0, 7);
      const userId = req.user ? req.user.userId : null;
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }
      appData['user'] = new mongoose.Types.ObjectId(userId); // Use new keyword

      appData['thread_id'] = await createThread();

      if (appData.agent_type !== "AI_Tool") {
        let feature = await featureListModel.findOne(
          { type: appData["agent_type"] },
          { componentCode: 1 }
        );
        appData["componentCode"] = feature.componentCode;
      }

      appData['liveUrl']= appData.name;
      let newApp = new App(appData);
      let savedApp = await newApp.save();

      // Creating first message in db for premade

      if (appData.agent_type !== "AI_Tool") {
        const oldChatSession = await chatSession
          .findOne({
            agentId: new mongoose.Types.ObjectId(savedApp._id),
            userId: new mongoose.Types.ObjectId(userId),
          })
          .lean();

        // Ensure oldChatSession exists before proceeding
        if (!oldChatSession) {
          await chatSession.create({
            agentId: new mongoose.Types.ObjectId(savedApp._id),
            userId: new mongoose.Types.ObjectId(userId),
            sessionId: uuidv4(), // Create a unique sessionId
            conversationId: uuidv4(), // Create a unique sessionId
            startTime: new Date(),
            lastTime: new Date(),
            date: new Date(),
            messages: [
              {
                sno: 1,
                role: "assistant",
                content: "Hello, I'm your AI Assistant. How can I help you?",
                image: [""],
              },
            ],
          });
        }
      }

      res.status(201).json({
        message: "App created successfully",
        data: savedApp,
      });
    } catch (error) {
      await createLog({ userId: req.user.userId, error: error.message });
      res.status(500).json({ error: error.message });
    }
  },
    getAllAppsOfUser: async (req, res) => {
        try {
            const userId = req.user ? req.user.userId : null;
            const regexPattern = new RegExp(`^${req.body.name}`, 'i');
            if (!userId) {
                return res.status(400).json({ error: 'User ID is required' });
            }
           
            // let apps = await App.find({ status: 'dev', user: userId }).sort({ createdAt: -1 });
          let apps = await App.aggregate([
            {
              $facet: {
                dev: [
                  {
                    $match: {
                      user: new mongoose.Types.ObjectId(userId),
                      status: "dev",
                      name: { $regex:regexPattern}
                    },
                  },
                  {
                    $sort:{
                        createdAt:-1
                    }
                  },
                  {
                    $project: {
                      name: 1,
                      status: 1,
                      visitorCount:1,
                      type:1
                    },
                  },
                ],
                live: [
                  {
                    $match: {
                      user: new mongoose.Types.ObjectId(userId),
                      status: "live",
                    },
                  },
                  {
                    $project: {
                    _id:0,
                      parentApp: 1,
                    },
                  },
                ],
              },
            },

            {
              $unwind: {
                path: "$dev",
              },
            },

            {
              $project: {
                dev: 1,
                live: {
                  $cond: {
                    if: {
                      $in: [
                        "$dev._id",
                        {
                          $map: {
                            input: "$live",
                            as: "liveDoc",
                            in: "$$liveDoc.parentApp",
                          },
                        },
                      ],
                    },
                    then: true,
                    else: false,
                  },
                },
              },
            },
            {
              $replaceRoot: {
                newRoot: { $mergeObjects: ["$dev", { live: "$live" }] },
              },
            },
            // {
            //   $match: {
            //     status: "dev",
            //   },
          // },
            {
              $skip:req.body.skip
            },

            {
              $limit:req.body.limit
            },
          ]);
    
            // if (!apps || apps.length == 0) {
            //     return res.status(200).json({ message: 'No app found'});
            // }
            const appCount=await App.count({user:new mongoose.Types.ObjectId(userId),status:'dev',  name: { $regex:regexPattern}});
            const showMore=(req.body.skip+req.body.limit)<appCount;
            res.status(200).json({
                message: "All Apps fetched successfully",
                data: apps,
                showMore
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
            createLog({userId:req.user.userId,error:error.message})
            res.status(500).json({ error: error.message });
        }
    },
    getFeatureLists:async (req,res)=>{
      try {
        const allFeatureLists=await featureListModel.find({active:true},{type:1,icon:1,visitorCount:1,title:1,description:1,comingSoon:1});
        res.status(200).json({
          message: "All featureLists fetched successfully",
          data: allFeatureLists,
      });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    },
    // searchApp:async (req,res)=>{
    //   try {
    //     const userId = req.user ? req.user.userId : null;
    //     if (!userId) {
    //         return res.status(400).json({ error: 'User ID is required' });
    //     }
    //     const regexPattern = new RegExp(`^${req.body.name}`, 'i');
    //     const results = await App.find(
    //       { name: { $regex: regexPattern }, user: userId },
    //       { name: 1, status: 1, visitorCount: 1, type: 1 }
    //     )
    //       .skip(req.body.skip)
    //       .limit(req.body.limit);

    //   const appCount=await App.count({user:new mongoose.Types.ObjectId(userId),status:'dev',  name: { $regex:regexPattern}});
    //   const showMore=(req.body.skip+req.body.limit)<appCount;
    //     res.status(200).json({
    //       message: "All featureLists fetched successfully",
    //       data: results,
    //       showMore
    //   });
    //   } catch (error) {
    //     res.status(500).json({ error: error.message });
    //   }
    // },
  
}

async function createThread() {
  if (process.env.OPENAI_API_KEY) {
    try {
      const openai = new OpenAI({ apiKey: process.env.OPEN_AI_KEY });
      const thread = await openai.beta.threads.create();
      return thread.id;
    } catch (error) {
      console.log('Thred Creation Error:', error)
      return '';
    }
  }
}

