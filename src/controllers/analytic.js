const App = require('../models/app');
const appVisitorModel = require('../models/appVisitors');
const appModel=require('../models/app');
const featureListModel=require('../models/featureList');
const appVisitorsModel = require('../models/appVisitors');
const { default: mongoose } = require('mongoose');
async function updateAppVisitor(id, visitorCount) {
    try {
        await appModel.updateOne({ _id:id, status: 'dev' }, { $set: { visitorCount } });
    } catch (error) {
        
    }
}

async function updateFeatureListCount(id) {
    try {
        const liveApp = await App.findOne({ _id:id }, { agent_type: 1, _id: 0 });        
        await featureListModel.updateOne({ type: liveApp.agent_type }, { $inc: { visitorCount: 1 } });
    } catch (error) {

    }   
}
module.exports={
    calculatorStats: async(req, res) => {
        try {
            let app=req.body.appId;
            let data = await appVisitorModel.aggregate([
                {
                    $match: {
                        app: new mongoose.Types.ObjectId(app)
                    }
                },
                {
                    $group: {
                        _id: {
                            $dateToString: {
                                format: "%Y-%m-%d",
                                date: "$createdAt"
                            }
                        },
                        dailyCount: { $sum: 1 },
                        totalVisitors: { $sum: 1 }
                    }
                },
                {
                    $group: {
                        _id: null,
                        traffic: {
                            $push: {
                                date: "$_id",
                                count: "$dailyCount"
                            }
                        },
                        visitorCount: { $sum: "$totalVisitors" }
                    }
                },
                {
                    $project: {
                        _id: 0,
                        traffic: 1,
                        visitorCount: 1
                    }
                }
            ]
            )
            
            return res.status(200).json({
                message: 'calc stats fetched successfully',
                data:data?data[0]:null
            })
        } catch (error) {
        }
    },
    generateVisitor: async (req, res) => {
        try {
            const userId = req.user ? req.user.userId : null;
            if (!userId) {
                return res.status(400).json({ error: 'User ID is required' });
            }
            const visitorCreated = new appVisitorModel({
                user: userId,
                ...req.body
            });
            await visitorCreated.save();
            const visitorCount = await appVisitorModel.count({ _id: req.body.app });
            updateAppVisitor(req.body.app, visitorCount);
            updateFeatureListCount(req.body.app,);

            return res.status(200).json({
                message: 'Visits updated successfully',
            });
        } catch (error) {

        }
    },
    fetchVisitors:async (req,res)=>{
        try {
        const liveApp=await App.findOne({parentApp:req.body.appId},{_id:1});
        if(!liveApp){
            return res.status(200).json({data:[]});
        }
        const allVisitors=await appVisitorsModel.aggregate([
            {
              $match: {
                live_app: new mongoose.Types.ObjectId( liveApp._id)
              }
            },
            {
              $addFields: {
                date:{
                 $dateToString: {
                    format: "%d %b %Y %H:%M:%S",  
                    date: "$createdAt", 
                  }
                }
              }
            },
            {
             $project: {
               date:1,
              createdAt:0,
               updatedAt:0,
               browser:1,updatedAt:1,createdAt:1,device:1
             }
            }
          ])
           res.status(201).json({
                message: "fetch visitors successfully",
                data: allVisitors,
              });
        } catch (error) {
            createLog({userId:req.user.userId.toString(),error:error.message,appId:req.body.appId})
            res.status(500).json({ error: error.message });
        }
    },
}