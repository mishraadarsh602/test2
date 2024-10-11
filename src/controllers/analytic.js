const App = require('../models/app');
const appVisitorModel = require('../models/appVisitors');
const appModel=require('../models/app');
const featureListModel=require('../models/featureList');
const { default: mongoose } = require('mongoose');
const Bowser = require("bowser"); 

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
            let results=await appVisitorModel.find({
                app,
                createdAt: {
                    $gte: new Date(req.body.startDate), 
                    $lt: new Date(req.body.endDate) 
                }
        
        },{browser:1,createdAt:1,_id:0,device:1}).lean();
            let response={
                trafficStats:{},
                devices:{},
                browser:{},
                totalVisitors:results.length
            }
            results.forEach((el) => {
                let formattedDate=el.createdAt.toLocaleDateString('en-GB')

                // traffic Stats or page Views
                response.trafficStats[formattedDate] = (response.trafficStats[formattedDate] || 0) + 1;

                // browsers
                response.browser[el.browser] = (response.browser[el.browser] || 0) + 1;

                // devices
                response.devices[el.device] = (response.browser[el.device] || 0) + 1;

              });
            return res.status(200).json({
                message: 'calc stats fetched successfully',
                data:response
            })
        } catch (error) {
        }
    },

    generateVisitor: async (req, res) => {
        try {
            const browser = Bowser.getParser(req.body.userAgent).parsedResult.browser.name;
            const visitorCreated = new appVisitorModel({
                ...req.body,
                browser
                    
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