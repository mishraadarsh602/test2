const App = require('../models/app');
const User = require('../models/user.model');
const Company = require('../models/company');
const BuilderCompany = require('../models/builderCompany');
const { v4: uuidv4 } = require('uuid');
const builderLogsModel=require('../models/logs/logs-builder');
const UserService = require('../service/userService');
const mongoose=require('mongoose');
const appVisitorsModel = require('../models/appVisitors');
const CryptoJS = require("crypto-js");
const userService = new UserService();
const dashboardHelper = require('../helpers/dashboard');
const companyHelper = require('../helpers/company');
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
            let { name, email } = req.body;
            let decodedName = decodeURIComponent(name);
            let decodedEmail = decodeURIComponent(email);
            decodedName = decodedName.replace(/\s/g, "+");
            decodedEmail = decodedEmail.replace(/\s/g, "+");
    
            let decryptedName = CryptoJS.AES.decrypt(decodedName, process.env.CRYPTO_SECRET_KEY).toString(CryptoJS.enc.Utf8);
            let decryptedEmail = CryptoJS.AES.decrypt(decodedEmail, process.env.CRYPTO_SECRET_KEY).toString(CryptoJS.enc.Utf8);
    
            if (!decryptedName || !decryptedEmail) {
                return res.status(401).json({ error: 'Please login ..' });
            }
    
            let userExist = await userService.findUserByEmail(decryptedEmail);
            let companyName = decryptedEmail.split('@')[1].split('.')[0];
    
            if (userExist) {
                const token = await userExist.generateToken();
                res.cookie('token', token, {
                    // httpOnly: false, 
                    maxAge: 24 * 60 * 60 * 1000, // 24 hours
                    // sameSite: 'none',
                    // secure: process.env.NODE_ENV === 'production'
                });
                return res.status(201).json({
                    message: 'User already exists',
                    data: {
                        user: userExist
                    }
                });
            }
    
            const userCreated = await userService.createUser({ name: decryptedName, email: decryptedEmail });
           
            if(userCreated){
                let subDomain = await companyHelper.checkAndUpdateSubdomain(companyName);
                let companyCreated = await companyHelper.createCompany(companyName,subDomain,userCreated._id);
            }
          
            // if (companyCreated) {
            //     appHelper.runBrandGuide(decryptedEmail, sub_domain);
            // }
    
            const token = await userCreated.generateToken();
    
            res.cookie('token', token, {
                // httpOnly: false, // Makes the cookie inaccessible to JavaScript (XSS protection)
                maxAge: 24 * 60 * 60 * 1000, // 24 hours
                // sameSite: 'none',
                // secure: process.env.NODE_ENV === 'production'
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

    createApp: async (req, res) => {
        try {
            let appData = req.body;
            appData['appUUID'] = uuidv4();
            if(appData.agent.type=='weather'){
                appData.name = 'Weather Forecast-' + appData['appUUID'].substring(0,7);
                }
                const userId = req.user ? req.user.userId : null;
                if (!userId) {
                    return res.status(400).json({ error: 'User ID is required' });
                }
            // appData['user'] = userId;   
            appData['user'] = mongoose.Types.ObjectId(userId); // Convert userId to ObjectId
 
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
            const isLive=await App.findOne({parentApp:req.params.appId});      
            if (!app) {
                return res.status(404).json({ error: 'App not found' });
            }
            res.status(200).json({
                message: "App fetched successfully",
                data: app,
                isLive:isLive?true:false
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
            let previousLiveApp=await App.findOne({parentApp:req.body.appId,status:'live'});
            if(previousLiveApp){
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
            appData.parentApp= new mongoose.Types.ObjectId (req.body.appId);
            delete appData['_id'];
            let newApp = new App(appData);           
            let savedApp = await newApp.save();
            res.status(201).json({
                message: "App live successfully",
                data: savedApp,
              });
        } catch (error) {            
            console.log('error is -----> ',error);
          
            createLog({userId:req.user.userId.toString(),error:error.message,appId:req.body.appId})
            res.status(500).json({ error: error.message });
        }
    },

    fetchVisitors:async (req,res)=>{
        try {
            const userId = req.user ? req.user.userId : null;
           const allVisitors=await appVisitorsModel.find({parentApp: (req.params.appId),user:userId,deleted:false},{browser:1,updatedAt:1,createdAt:1,device:1,})      
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
         console.log("req.body11:",req.body)
         let {domain,sub_domain,brand_type} = req.body;
         let email = req.user.email;
         let brandresult =  await  dashboardHelper.runBrandGuide(domain,sub_domain,brand_type,email);
         console.log("brandresult444:",brandresult)
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
            console.log("req:",req)
            console.log("file:",req.file)
            let result =  await  dashboardHelper.uploadToAWS(file);
           
            res.status(201).json({
               data: result,
               message: "File uploaded successfully",
               });
           } catch (error) {
               res.status(500).json({ error: error.message });
           }    
    },

    getCompanyByUserId:async (req,res)=>{
        try {
            const userId = req.user ? req.user.userId : null;
            if (!userId) {
                return res.status(400).json({ error: 'User ID is required' });
            }
            let company = await Company.findOne({ user_id: userId });
            if (!company) {
                return res.status(404).json({ error: 'Company not found' });
            }
            res.status(200).json({
                message: "Company fetched successfully",
                data: company,
              });
        } catch (error) {
            res.status(500).json({ error: error.message });
    }


    },
    getUserCustomBrand:async (req,res)=>{
        try {
            const userId = req.user ? req.user.userId : null;
            if (!userId) {
                return res.status(400).json({ error: 'User ID is required' });
            }
            let company = await Company.findOne({ user_id: userId });
            if (!company) {
                return res.status(404).json({ error: 'Company not found' });
            }
            // let brandDetail = company.userCustomBrandDetail;
            //find data from buildercompany where company id is company._id
            let brandDetail = await BuilderCompany.findOne({ company: company._id });
            if (!brandDetail) {
                return res.status(200).json({ message: 'No Brand Found' });
            }

            
            res.status(200).json({
                message: "User Custom Brand fetched successfully",
                data: brandDetail,
              });
        } catch (error) {
            res.status(500).json({ error: error.message });
    }
   },
   updateBrandGuide:async (req,res)=>{
    try {
        const userId = req.user ? req.user.userId : null;
        if (!userId) {
            return res.status(400).json({ error: 'User ID is required' });
        }
        let company = await Company.findOne({ user_id: userId });
        if (!company) {
            return res.status(404).json({ error: 'Company not found' });
        }
        let brandDetail = await BuilderCompany.findOne({ company: company._id });
        if (!brandDetail) {
            return res.status(404).json({ error: 'Brand Detail not found' });
        }
        let updatedBrandDetail = await BuilderCompany.findOneAndUpdate({ company: company._id }, req.body
        , { new: true });
        if (!updatedBrandDetail) {
            return res.status(404).json({ error: 'Brand Detail not found' });
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
