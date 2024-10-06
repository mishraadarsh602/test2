const App = require('../models/app');
const appVisitorModel = require('../models/appVisitors');
const appModel=require('../models/app');
const featureListModel=require('../models/featureList');
const { default: mongoose } = require('mongoose');

async function updateCount(req) {
    try {
        await appModel.updateOne({ _id: req.body.app }, { $inc: { visitorCount: 1 } });
        await featureListModel.updateOne({ type: req.body.agent_type }, { $inc: { visitorCount: 1 } });
    } catch (error) {
        console.log(error)
    }
}


module.exports={
    calculatorStats: async(req, res) => {
        try {
            let app=req.body.appId;
            let data = await appVisitorModel.aggregate([
                {
                    $match: {
                        app: new mongoose.Types.ObjectId(app),
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
            if (!req.body.user) {
                return res.status(400).json({ error: 'User ID is required' });
            }
            const visitorCreated = new appVisitorModel({
                ...req.body
            });
            await visitorCreated.save();
            updateCount(req)

            return res.status(200).json({
                message: 'Visits updated successfully',
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

    fetchVisitors:async (req,res)=>{
        try {
        const allVisitors=await appVisitorModel.aggregate([
            {
              $match: {
                app: new mongoose.Types.ObjectId(req.body.appId),
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
               browser:1,updatedAt:1,createdAt:1,device:1,
               utm_source:1,
               utm_medium:1,
               utm_campaign:1,
               utm_term:1,
               utm_content:1,
             }
            }
          ])
           res.status(201).json({
                message: "fetch visitors successfully",
                data: allVisitors,
              });
        } catch (error) {
            // createLog({userId:req.user.userId.toString(),error:error.message,appId:req.body.appId})
            res.status(500).json({ error: error.message });
        }
    },
}