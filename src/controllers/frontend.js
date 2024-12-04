const mongoose = require('mongoose'); // Import mongoose
const App = require('../models/app');
const User = require('../models/user.model');
const { v4: uuidv4 } = require('uuid');
const UserService = require('../service/userService');
const featureListModel=require('../models/featureList');
const { OpenAI } = require("openai");
const chatSession = require('../models/chat/chatSession.model');
const catchAsync=require('../utils/catchAsync');
const userService = new UserService();
const moongooseHelper=require('../utils/moongooseHelper');
const apiResponse=require('../utils/apiResponse');
const ApiError=require('../utils/throwError')
const userModel=require('../models/user.model');
const appModel=require('../models/app');
const planModel=require('../models/plan.model');
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
      delete appData['_id'];
      delete appData['parentApp'];
      appData.name = appData.agent_type + '-' + appData['appUUID'].substring(0, 7);
      appData.url=appData.name;
      const userId = req.user ? req.user.userId : null;
      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }
      appData['user'] = new mongoose.Types.ObjectId(userId); // Use new keyword
      appData['thread_id'] = await createThread();
      if (appData.agent_type !== "AI_Tool") {
        let feature = await featureListModel.findOne(
          { type: appData["agent_type"] },
          { componentCode: 1, apis: 1, tool_type: 1, icon:1, description:1 }
        );
        appData["componentCode"] = feature.componentCode;
        appData["apis"] = feature.apis || [];
        appData["tool_type"] = feature.tool_type || '';
        appData["icon"] = feature.icon || '';
        appData["description"] = feature.description || '';
      } else{
        appData["apis"] = [];
      }
      const user = await userService.getUserById(userId);
      if (user?.brandDetails?.enabled && user?.brandDetails?.customBrand) {
        const { logo, primaryColor, secondaryColor, backgroundColor } = user.brandDetails.customBrand;
        appData.header.logo.url = logo || appData.header.logo.url;
        appData.theme.primaryColor = primaryColor || appData.theme.primaryColor;
        appData.theme.secondaryColor = secondaryColor || appData.theme.secondaryColor;
        appData.theme.backgroundColor = backgroundColor || appData.theme.backgroundColor;
      }
      appData.ai['model'] = 'anthropic';
      let newApp = new App(appData);
      newApp["componentCode"] = newApp["componentCode"].replace('${appId}', newApp._id.toString());
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
      res.status(500).json({ error: error.message });
    }
  },
  getAllAppsOfUser:catchAsync(async(req,res)=>{
    const userId = req.user.userId;
    let apps = await App.aggregate([
      {
        $facet: {
          dev: [
            {
              $match: {
                user: moongooseHelper.giveMoongooseObjectId(userId),
                status: "dev",
                $or: [
                  { name: { $regex: req.body.searchParameter, $options: 'i' } },
                  { url: { $regex: req.body.searchParameter, $options: 'i' } }
                ]
              },
            },
            {
              $sort: {
                updatedAt: -1,
              },
            },
            {
              $project: {
                name: 1,
                url: 1,
                status: 1,
                visitorCount: 1,
                type: 1,
                icon:1,
                description:1
              },
            },
          ],
          live: [
            {
              $match: {
                user: moongooseHelper.giveMoongooseObjectId(userId),
                status: "live",
                $or: [
                  { name: { $regex: req.body.searchParameter, $options: 'i' } },
                  { url: { $regex: req.body.searchParameter, $options: 'i' } }
                ]
              },
            },
            {
              $project: {
                _id: 0,
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
      {
        $skip: req.body.skip,
      },

      {
        $limit: req.body.limit,
      },
    ]);
    const appCount = await App.count({
      user: moongooseHelper.giveMoongooseObjectId(userId),
      status: "dev",
      $or: [
        { name: { $regex: req.body.searchParameter, $options: 'i' } },
        { url: { $regex: req.body.searchParameter, $options: 'i' } }
      ]
    });
    const showMore = req.body.skip + req.body.limit < appCount;
    res.status(200).json(
      new apiResponse(200,"All Apps fetched successfully",{apps,showMore},)
    )
  }),

  deleteApp:catchAsync(async(req,res)=>{
    const appId = req.params.appId;
    if (!moongooseHelper.isValidMongooseId(appId)) {
      throw new ApiError(400, "Invalid App ID");
    }
    await App.updateOne({_id:appId,user:req.user.userId}, {
      status: "deleted",
    });
    res.status(200).json(new apiResponse(200, "All Apps fetched successfully"));
  }),
  getFeatureLists: catchAsync(async (req, res) => {
    const { ogSubscriptionId } = await userModel.findOne(
        { _id: req.user.userId },
        { ogSubscriptionId: 1, _id: 0 }
    );
    const { agent } = await planModel
        .findOne({ _id: ogSubscriptionId.split('_')[0] }, { agent: 1 })
        .lean(); // as we need to access property inside agent arrray for that we use lean method
  
    const allFeatureLists = await featureListModel
        .find(
            { active: true },
            { type: 1, icon: 1, visitorCount: 1, title: 1, description: 1, comingSoon: 1 },
        )
        .lean();
  
        const allFeatureTypes=allFeatureLists.map((feature) => feature.type);
    const appUsageCounts = await appModel
        .aggregate([
            { $match: { user: req.user.userId, agent_type: { $in: allFeatureTypes } } },
            { $group: { _id: "$agent_type", count: { $sum: 1 } } },
        ]);
  
    const appUsageMap = new Map();
    appUsageCounts.forEach((item) => appUsageMap.set(item._id,item.count))
   
    const agentMap = new Map();
    agent.map((el) => agentMap.set(el.type, el.totalCount))


    const updatedFeatureLists = allFeatureLists.map((feature) => {
        const appUsedCount = appUsageMap.get(feature.type) || 0;
        const planTotalCount = agentMap.get(feature.type) || 0;
        feature.lock = appUsedCount >= planTotalCount;
        return feature;
    });
    
    res.status(200).json(
        new apiResponse(200, "All featureLists fetched successfully", updatedFeatureLists)
    );
  })
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

