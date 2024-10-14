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
const { default: axios } = require('axios');
const chatSession = require('../models/chat/chatSession.model');
const openai = new OpenAI({ apiKey: process.env.OPEN_AI_KEY });

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
            const { name, email, userId, companyId, companyName, planId, exp } = tokenObject;
            if (!exp || exp < Date.now()) {
                return res.status(401).json({ error: 'Token expired' });
            }
            let userExist = await userService.findUserByEmail(email);
            if (userExist) {
                const token = await userExist.generateToken();
                res.cookie('token', token, {
                    httpOnly: true, 
                    maxAge: 24 * 60 * 60 * 1000, 
                    sameSite: 'none', 
                    secure: true 
                });               
                userExist.ogSubscriptionId=planId;
                await userExist.save();

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
                httpOnly: true,
                maxAge: 24 * 60 * 60 * 1000, 
                sameSite: 'none', 
                secure: true 
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

    getAppByUrl: async (req, res) => {     
        try {
             let app = await App.findOne({url:req.params.url},).lean();
             if (!app) {
                return res.status(404).json({ error: 'App not found' });
            }
            let liveApp=await App.findOne({parentApp:app._id,status:'live'},{url:1,_id:0});            
            res.status(200).json({
                message: "App fetched successfully",
                data:{...app,isLive: !!liveApp,url:liveApp?liveApp.url:app.url},
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
           
            let apps = await App.find({ user: userId, status: 'dev' });
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
            const userId = req.user ? req.user.userId : null;
            if (!userId) {
                return res.status(400).json({ error: 'User ID is required' });
            }
            // let { name } = req.body;
            let updateData = req.body;

            // if (name) {
            //     let existingApp = await App.findOne({ name, _id: { $ne: appId },status: { $ne: 'DELETED' } }).lean();
            //     if (existingApp) {
            //         return res.status(400).json({ error: 'An app with this name already exists' });
            //     }
            //     updateData.name = name;
            // }

            for(let i = 0; i < req.body.apis.length; i++){
                if(req.body.apis[i].api.startsWith(process.env.BACKEND_URL)){
                    throw new Error("This URL is not allowed");
                }
                if(req.body.apis[i].api.trim() === ''){
                    throw new Error("This URL is not allowed");
                }
            }

            let updatedApp = await App.findOneAndUpdate({ _id: req.params.id }, updateData, { new: true }).lean();
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

    checkUniqueAppName: async (req, res) => {
        try {
            const userId = req.user ? req.user.userId : null;
            if (!userId) {
                return res.status(400).json({ error: 'User ID is required' });
            }
            let name = decodeURIComponent(req.body.name);
            let appId = req.body.appId;
            let existingApp = await App.findOne({ user: userId, status: 'dev', name }).lean();
            if (existingApp) {
                return res.status(409 ).json({ error: 'Name already exists' });
            } 
            await App.updateOne({_id:appId},{$set:{name,changed:true}})
            return res.status(200).json({message:'name updated successfully'})
        } catch (error) {   
            res.status(500).json({ error: error.message });
        }
    },
    liveApp:async (req,res)=>{
        try {
            let id=req.params._id;
            let previousLiveApp=await App.findOne({parentApp:req.params.appId,status:'live'});
            const parentApp=await App.findOne({_id:req.params.appId});
            if(previousLiveApp){
                previousLiveApp.status='old';
                if (!redisClient.isOpen) {
                    await redisClient.connect();
                }
                // deleting redis apps
                redisClient.del(`app-${previousLiveApp.url}`)
                redisClient.del(`app-${previousLiveApp._id}`)
                await previousLiveApp.save();
                // changing status of parentApp
                parentApp.changed=false;
                await parentApp.save();
            }
            let appData = JSON.parse(JSON.stringify(parentApp));
            appData['appUUID'] = uuidv4();
            appData['parentApp']=parentApp._id;
            appData['status']='live';
            delete appData['_id'];
            let newApp = new App(appData);  
            await newApp.save();         
            res.status(201).json({
                message: "App live successfully",
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

    fixError :async (req,res)=>{
        try {
          let fetchedApp = await App.findOne({ url: req.body.appName });
            let prompt = `This is my code : ${fetchedApp.componentCode}, This is Error: ${req.body.errorMessage}.
            You need to resolve this issue from my code without changing any UI design, API, code structure and regenerate new correct code by eliminating error.
            Follow the code pattern in terms of function usage, API calls, and element creation. 
            **Ensure that all React hooks are written with the full 'React' prefix, e.g., React.useState().** 
            Create React element without any import statement. I have this header added already import React, {useState, useEffect, useContext, useReducer, useCallback, useMemo, useRef, useImperativeHandle, useLayoutEffect, useDebugValue, useTransition, useDeferredValue, useId, useSyncExternalStore, useInsertionEffect} from 'react'; import * as LucideIcons from 'lucide-react'; import { useLocation } from 'react-router-dom'; 
            Note: Input is code and output will be only one code file which will run as JSX. You must return code only no extra text allowed.
            Output structure:
                function AppName(){
                    ...
                }
                return AppName;
            `;

          const response = await axios.post(
            "https://api.anthropic.com/v1/messages",
            {
              model: "claude-3-5-sonnet-20240620", // Using Claude model
              max_tokens: 8000,
              messages: [
                {
                  role: "user",
                  content: prompt,
                },
              ],
            },
            {
              headers: {
                "content-type": "application/json",
                "x-api-key": process.env["ANTHROPIC_API_KEY"],
                "anthropic-version": "2023-06-01",
              },
            }
          );

          await openai.beta.threads.messages.create(
            fetchedApp.thread_id,
            {
              role: "user",
              content: `resolve this issue in my code : ${req.body.errorMessage}`,
            },
            {
              role: "assistant",
              content: response.data.content[0].text,
            }
          );

          fetchedApp.componentCode = response.data.content[0].text;

          const urlRegex = /fetch\((['"`])([^'"`]+)\1\)/;
          let originalApis = []; // Array to store original API objects
    
          // Replace URLs in the code while extracting them
          fetchedApp.componentCode = fetchedApp.componentCode.replace(
            urlRegex,
            (matchedUrl) => {
              // Extract the full URL from the matched string
              const fullUrl = matchedUrl.match(/(['"`])([^'"`]+)\1/)[2]; // URL is in the second capture group
              if (fullUrl.startsWith(process.env.BACKEND_URL)) {
                originalApis = fetchedApp.apis;
                return `fetch(\`${fullUrl}\`)`;
              }
              // Store the matched URL as an object in the array
              originalApis.push({ api: fullUrl });

              // Use a regex to extract existing query parameters
              const existingParams = {};
              const paramRegex = /[?&]([^=]+)=([^&]*)/g;
              let match;

              // Find and store existing parameters
              while ((match = paramRegex.exec(fullUrl)) !== null) {
                existingParams[match[1]] = match[2];
              }

              // Build a new query string with existing and new parameters
              const paramsArray = [];
              paramsArray.push(`appId=${fetchedApp._id}`); // Ensure to append appId

              // Preserve existing parameters, including `${city}`
              for (const [key, value] of Object.entries(existingParams)) {
                paramsArray.push(`${key}=${value}`);
              }

              // Join parameters with '&' to form the new query string
              const newQueryString = paramsArray.join("&");

              // Construct the new URL with the updated query string
              return `fetch(\`${process.env.BACKEND_URL}/builder/callAPI?${newQueryString}\`)`;
            }
          );

        //   // Updating apis array based on domain comparison
          fetchedApp.apis.forEach((fetchedApi, index) => {
            const originalApi = originalApis[index];

            // If the original API exists, compare the domains
            if (
              originalApi &&
              extractDomain(fetchedApi.api) !== extractDomain(originalApi.api)
            ) {
              // Only update if the domain is different
              originalApis[index].api = fetchedApi.api;
            }
          });
          // Update app componentCode and save
          fetchedApp.apis = originalApis;
          await fetchedApp.save();

          // Find the existing chat session
          let oldChatSession = await chatSession
            .findOne({
              agentId: new mongoose.Types.ObjectId(fetchedApp._id),
            });

            if(oldChatSession.messages[oldChatSession.messages.length - 1].role === 'assistant'){
                oldChatSession.messages[oldChatSession.messages.length - 1].code = fetchedApp.componentCode;
                await oldChatSession.save();
            }

            res.status(201).json({
                message: "Regenerated Successfully",
                data: fetchedApp
              });
        } catch (error) {
            createLog({userId:req.user.userId.toString(),error:error.message,appId:req.body.appId})
            res.status(500).json({ error: error.message });
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
    },

  callAPI: async (req, res) => {
    try {
      console.log();
      const appId = req.query.appId; // Change here to get appId from the query

      let appData = await App.findOne({
        _id: appId,
      });

      let api = appData.apis[0].api;

      // Create a URL object from the original API to parse query parameters
      const originalRequestUrl = new URL(api, `http://${req.headers.host}`); // Constructing the full URL for parsing
      const originalQueryParameters = Object.fromEntries(
        originalRequestUrl.searchParams
      ); // Extract query parameters

      // Log the original query parameters
      console.log("Original Query Parameters:", originalQueryParameters);

      // Create a URL object from req.url to parse query parameters
      const customRequestUrl = new URL(req.url, `http://${req.headers.host}`); // Constructing the full URL for parsing
      const customQueryParameters = Object.fromEntries(
        customRequestUrl.searchParams
      ); // Extract query parameters

      // Log the incoming query parameters for debugging
      console.log("Incoming Query Parameters:", customQueryParameters);
      // Replace variables in the original API URL with actual values dynamically
      api = api.replace(/\$\{(.*?)\}/g, (match, variableName) => {
        let key = variableName.trim();
        console.log(`Checking for replacement: ${key}`, match); // Debugging output
        console.log(originalQueryParameters);
        key = Object.keys(originalQueryParameters).find(
          (keyName) => originalQueryParameters[keyName] === match
        );
        console.log(`Checking for replacement: ${key}`, match); // Debugging output
        if (key in customQueryParameters) {
          // Check if the key exists in incoming query parameters
          const value = customQueryParameters[key];
          console.log(`Replacing ${match} with ${value}`); // Debugging output
          return value || ""; // Replace with the corresponding value from incoming query parameters
        }
        return ""; // Fallback if the key does not exist
      });
      console.log(api);

      const response = await axios.get(api, {
        responseType: "arraybuffer", // Handle any kind of response (binary, JSON, etc.)
      });

      // Determine the type of content
      const contentType = response.headers["content-type"];

      // Send response headers so the frontend can interpret it
      res.setHeader("Content-Type", contentType);

      // Forward the data as-is (whether it's binary, JSON, or text)
      res.send(response.data);
    } catch (error) {
      console.log("erorr is ----> ",error);
      res.send(error);
    }
  },

  callAI: async (req, res) => {
    try {
      console.log();
      const userPrompt = req.body.prompt; // Change here to get appId from the query
      let prompt = `${userPrompt}`;

          const response = await axios.post(
            "https://api.anthropic.com/v1/messages",
            {
              model: "claude-3-5-sonnet-20240620", // Using Claude model
              max_tokens: 8000,
              messages: [
                {
                  role: "user",
                  content: prompt,
                },
              ],
            },
            {
              headers: {
                "content-type": "application/json",
                "x-api-key": process.env["ANTHROPIC_API_KEY"],
                "anthropic-version": "2023-06-01",
              },
            }
          );
     
      res.send(response.data.content[0].text);
    } catch (error) {
      console.log("erorr is ----> ",error);
      res.send(error);
    }
  },
  
  checkUniqueUrl:async(req,res)=>{
    try {
        const url=req.body.url;
        const appId=req.body.appId;
        let existingApp = await App.findOne({ url, _id: { $ne: appId }}).lean();
        if (existingApp) {
            return res.status(409 ).json({ error: 'url already exists' });
        } 
        await App.updateOne({_id:appId},{$set:{url,changed:true}})
        return res.status(200).json({message:'url updated successfully'})
    } catch (error) {    
    }   
  },
  createStripeCheckoutSession: async (req, res) => {
    try {
        let { amount, currency, billingAddress, shippingAddress, mobileNo, description,publicKey,secretKey } = req.body;
        const stripe = require('stripe')(secretKey);
        const createPrice = await stripe.prices.create({
            unit_amount: amount, 
            currency: currency,
            product_data: {
                name: description ? description : "Pay",
            },
            billing_scheme: 'per_unit' 
        });
        const sessionConfig = {
            ui_mode: 'embedded',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: createPrice.id,
                    quantity: 1,
                },
            ],
            mode: 'payment',
            redirect_on_completion: 'never',
            billing_address_collection: billingAddress ? "required" : "auto",
            phone_number_collection: {
                enabled: mobileNo ? true : false,
            },
            expires_at: Math.floor(Date.now() / 1000) + (3600 * 2), // Configured to expire after 2 hours
        };
        if (shippingAddress) {
            sessionConfig.shipping_address_collection = {
                allowed_countries: ['AC', 'AD', 'AE', 'AF', 'AG', 'AI', 'AL', 'AM', 'AO', 'AQ', 'AR', 'AT', 'AU', 'AW', 'AX', 'AZ', 'BA', 'BB', 'BD', 'BE', 'BF', 'BG', 'BH', 'BI', 'BJ', 'BL', 'BM', 'BN', 'BO', 'BQ', 'BR', 'BS', 'BT', 'BV', 'BW', 'BY', 'BZ', 'CA', 'CD', 'CF', 'CG', 'CH', 'CI', 'CK', 'CL', 'CM', 'CN', 'CO', 'CR', 'CV', 'CW', 'CY', 'CZ', 'DE', 'DJ', 'DK', 'DM', 'DO', 'DZ', 'EC', 'EE', 'EG', 'EH', 'ER', 'ES', 'ET', 'FI', 'FJ', 'FK', 'FO', 'FR', 'GA', 'GB', 'GD', 'GE', 'GF', 'GG', 'GH', 'GI', 'GL', 'GM', 'GN', 'GP', 'GQ', 'GR', 'GS', 'GT', 'GU', 'GW', 'GY', 'HK', 'HN', 'HR', 'HT', 'HU', 'ID', 'IE', 'IL', 'IM', 'IN', 'IO', 'IQ', 'IS', 'IT', 'JE', 'JM', 'JO', 'JP', 'KE', 'KG', 'KH', 'KI', 'KM', 'KN', 'KR', 'KW', 'KY', 'KZ', 'LA', 'LB', 'LC', 'LI', 'LK', 'LR', 'LS', 'LT', 'LU', 'LV', 'LY', 'MA', 'MC', 'MD', 'ME', 'MF', 'MG', 'MK', 'ML', 'MM', 'MN', 'MO', 'MQ', 'MR', 'MS', 'MT', 'MU', 'MV', 'MW', 'MX', 'MY', 'MZ', 'NA', 'NC', 'NE', 'NG', 'NI', 'NL', 'NO', 'NP', 'NR', 'NU', 'NZ', 'OM', 'PA', 'PE', 'PF', 'PG', 'PH', 'PK', 'PL', 'PM', 'PN', 'PR', 'PS', 'PT', 'PY', 'QA', 'RE', 'RO', 'RS', 'RU', 'RW', 'SA', 'SB', 'SC', 'SE', 'SG', 'SH', 'SI', 'SJ', 'SK', 'SL', 'SM', 'SN', 'SO', 'SR', 'SS', 'ST', 'SV', 'SX', 'SZ', 'TA', 'TC', 'TD', 'TF', 'TG', 'TH', 'TJ', 'TK', 'TL', 'TM', 'TN', 'TO', 'TR', 'TT', 'TV', 'TW', 'TZ', 'UA', 'UG', 'US', 'UY', 'UZ', 'VA', 'VC', 'VE', 'VG', 'VN', 'VU', 'WF', 'WS', 'XK', 'YE', 'YT', 'ZA', 'ZM', 'ZW'],
            };
        }
        const session = await stripe.checkout.sessions.create(sessionConfig);
        // return response.ok(res, { session });
        res.status(201).json({
            message: "Session created successfully",
            data: session,
          });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
  },
  retrieveStripeCheckoutSession: async (req, res) => {
    const stripe_user_secret_key = req.query.secret_key;
    const stripe = require('stripe')(stripe_user_secret_key);
    const session = await stripe.checkout.sessions.retrieve(req.query.session_id);
    res.status(201).json({
        message: "Session retrieve successfully",
        data: session,
      });
    },
}

// Helper function to extract the domain from a URL
function extractDomain(url) {
    const domain = url.split('/')[2]; // Extracts the domain part of the URL
    return domain;
}