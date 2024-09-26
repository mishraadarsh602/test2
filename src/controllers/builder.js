const App = require('../models/app');
const User = require('../models/user.model');
const { v4: uuidv4 } = require('uuid');
const builderLogsModel=require('../models/logs/logs-builder');
const UserService = require('../service/userService');
const mongoose=require('mongoose');
const appVisitorsModel = require('../models/appVisitors');
const CryptoJS = require("crypto-js");
const userService = new UserService();
const dashboardHelper = require('../helpers/dashboard');
const { OpenAI } = require("openai");
const redisClient = require('../utils/redisClient');

async function createLog(data) {
    try {
        let logCreated = new builderLogsModel(data);
         await logCreated.save();
    } catch (error) {
        // res.status(500).json({ error: error.message });
    }
}

module.exports = {

    createUser: async (req, res) => {
        try {
            console.log("req.body cerateuser:",req.body)
            let bodyToken  =  req.body.auth;
            let decodedToken = decodeURIComponent(bodyToken);
            decodedToken= decodedToken.replace(/\s/g, "+");
    
            let decryptedToken = CryptoJS.AES.decrypt(decodedToken, process.env.CRYPTO_SECRET_KEY).toString(CryptoJS.enc.Utf8);
            const tokenObject = JSON.parse(decryptedToken);
            const { name, email, userId, companyId, companyName, planId } = tokenObject;
            let userExist = await userService.findUserByEmail(email);
            if (userExist) {
                const token = await userExist.generateToken();
                res.cookie('token', token, {
                    httpOnly: true, // Set to true for production to prevent access via JavaScript
                    maxAge: 24 * 60 * 60 * 1000, // 24 hours
                    sameSite: 'none', // 'lax' or 'strict' for local testing and prodcution
                    secure: true // Set to true for production (requires HTTPS)
                });
                return res.status(201).json({
                    message: 'User already exists',
                    data: {
                        user: userExist
                    }
                });
            }
            const userCreated = await userService.createUser({ name: name, email: email, ogUserId: userId, ogCompanyId: companyId, ogCompanyName: companyName, ogSubscriptionId: planId });    
            const token = await userCreated.generateToken();
    
            res.cookie('token', token, {
                httpOnly: true, // Set to true for production to prevent access via JavaScript
                maxAge: 24 * 60 * 60 * 1000, // 24 hours
                sameSite: 'none', // 'lax' or 'strict' for local testing and prodcution
                secure: true // Set to true for production (requires HTTPS)
            });
    
            res.status(201).json({
                message: "User created successfully",
                data: {
                    user: userCreated
                }
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
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

    getAppByName: async (req, res) => {     
        try {
            // let app = await App.findById(req.params.appId).populate('user').lean();
             let app = await App.findOne({name:req.params.appName});
            const isLive=await App.findOne({parentApp:app._id},{name:1});      
            if (!app) {
                return res.status(404).json({ error: 'App not found' });
            }
            res.status(200).json({
                message: "App fetched successfully",
                data: app,
                isLive:isLive?true:false,
                liveUrl:isLive?isLive.name:app.name
              });
        } catch (error) {
            createLog({userId:req.user.userId,error:error.message,appId:req.params.appId})
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
            createLog({userId:req.user.userId.toString(),error:error.message,appId:req.params.appId})
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
    },
    liveApp:async (req,res)=>{
        try {
            let app=await App.findOne({name:req.params.appName},{_id:1});
            let previousLiveApp=await App.findOne({parentApp:app._id,status:'live'});
            if(previousLiveApp){
                await redisClient.connect();
                await redisClient.del(`componentCode-${previousLiveApp.liveUrl}`);
                await redisClient.quit();
                previousLiveApp.status='old';
                await previousLiveApp.save();
                // changing status of parentApp
                const parentApp=await App.findOne({_id:req.body.appId});
                parentApp.changed=false;
                await parentApp.save();
            }
            let appData = {...req.body.data};
            appData['appUUID'] = uuidv4();
            appData['parentApp']=req.body.appId;
            appData['status']='live';
            appData.parentApp= new mongoose.Types.ObjectId (app._id);
            delete appData['_id'];
            let newApp = new App(appData);           
            let savedApp = await newApp.save();
            res.status(201).json({
                message: "App live successfully",
              });
        } catch (error) {            
          
            createLog({userId:req.user.userId.toString(),error:error.message,appId:req.body.appId})
            res.status(500).json({ error: error.message });
        }
    },

    fetchVisitors:async (req,res)=>{
        try {
            const userId = req.user ? req.user.userId : null;
            const liveNameAggregation=[
                {$match: {
                  name:req.params.appName,
                }},
                {
                  $lookup: {
                    from: 'apps',
                    localField: '_id',
                    foreignField: 'parentApp',
                    as: 'result'
                  }
                },
                {
                  $match: {
                    status:'live'
                  }
                },
                {
                  $project: {
                    name:1,
                    _id:0
                  }
                },
                
              ];
            const liveAppName=await App.aggregate(liveNameAggregation);
            
        const allVisitors=await appVisitorsModel.aggregate([
            {
              $match: {
                name:liveAppName[0]?.name
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
    getBrandGuide:async (req,res)=>{
        try {
         let {domain,brand_type} = req.body;
         let email = req.user.email;
         let brandresult =  await  dashboardHelper.runBrandGuide(domain,brand_type,email);
         res.status(201).json({
            data: brandresult,
            message: "Brand Guide fetched successfully",
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },
    uploadFile:async (req,res)=>{
        try {      
            const {file} = req;

            let result =  await  dashboardHelper.uploadToAWS(file);           
            res.status(201).json({
               data: result,
               message: "File uploaded successfully",
               });
           } catch (error) {
               res.status(500).json({ error: error.message });
           }    
    },
    updateBrandGuide: async (req, res) => {
        try {
            const userId = req.user ? req.user.userId : null;
            if (!userId) {
                return res.status(400).json({ error: 'User ID is required' });
            }
            const brandDetail = req.body;
            const updateFields = {};
            if (brandDetail.custombrand !== undefined) {
                updateFields['brandDetails.customBrand'] = brandDetail.custombrand;
            }
            if (brandDetail.enabled !== undefined) {
                updateFields['brandDetails.enabled'] = brandDetail.enabled;
            }
            const updatedBrandDetail = await User.findByIdAndUpdate(
                userId,
                { 
                    $set: updateFields
                },
                { new: true, upsert: true } // upsert: true will create the document if it doesn't exist
            ).lean();    
            if (!updatedBrandDetail) {
                return res.status(404).json({ error: 'Brand Guide not found' });
            }
    
            res.status(200).json({
                message: "Brand Guide updated successfully",
                data: updatedBrandDetail,
            });
        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    },

     deleteVisitors:async (req, res) => {
         try {
             const { visitorIds } = req.body;
             if (!Array.isArray(visitorIds) || visitorIds.length === 0) {
                 return res.status(400).json({ error: 'No visitor IDs provided' });
             }

             const result = await appVisitorsModel.updateMany(
                 { _id: { $in: visitorIds } },
                 { $set: { deleted: true } }
             );

             res.status(200).json({
                 message: 'Visitors deleted successfully',
             });
        } catch (error) {
            // Log the error
            createLog({ userId: req.user.userId.toString(), error: error.message, appId: req.body.appId });
    
            // Send error response
            res.status(500).json({ error: error.message });
        }
    },
    getPreviewApp:async (req,res)=>{
        try {
            const appId=req.params.appId;
            const fetchedApp=await App.findById(appId);
            res.status(201).json({
                message: "fetch preview app",
                data: fetchedApp,
              });
        } catch (error) {
            
        }
    },
    getOverViewDetails:async (req,res)=>{
        try {
            const appId=req.params.appId;
            
            const userId = req.user ? req.user.userId : null;
            const visitorCounts = await appVisitorsModel.aggregate(
                [
                {
                    $match: {
                        deleted: false ,
                        parentApp:new mongoose.Types.ObjectId(appId),
                        user:new mongoose.Types.ObjectId(userId)
                    }
                },
                {
                    $group: {
                        _id: {
                            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }  
                        },
                        count: { $sum: 1 }  
                    }
                },
                {
                    $sort: { _id: 1 }  
                },
                {
                    $project: {
                        _id: 0,         
                        date: "$_id",    
                        count: 1         
                    }
                }
            ]
        
        );
            res.status(201).json({
                message: "fetch overview successfully",
                data: visitorCounts,
              });

        } catch (error) {
                // console.log('erorr is ----> ',error);
                
        }
    }

}
