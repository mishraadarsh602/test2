const App = require('../models/app');
const User = require('../models/user.model');
const { v4: uuidv4 } = require('uuid');
const UserService = require('../service/userService');
const mongoose=require('mongoose');
const appVisitorsModel = require('../models/appVisitors');
const CryptoJS = require("crypto-js");
const userService = new UserService();
const dashboardHelper = require('../helpers/dashboard');
const { OpenAI } = require("openai");
const redisClient = require('../utils/redisClient');
const catchAsync=require('../utils/catchAsync');
const moongooseHelper=require('../utils/moongooseHelper');
const apiResponse=require('../utils/apiResponse');
const ApiError=require('../utils/throwError');
const { default: axios } = require('axios');
const chatSession = require('../models/chat/chatSession.model');
const ApiResponse = require('../utils/apiResponse');
const openai = new OpenAI({ apiKey: process.env.OPEN_AI_KEY });



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
    logoutUser:async (req,res)=>{
        try {
            res.clearCookie('token', {
                httpOnly: true,
                sameSite: 'none',
                secure: true
            });
            res.status(200).json({
                message: "User logged out successfully"
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
      getAppByUrl:catchAsync(async(req,res)=>{
           let app = await App.findOne({url:req.params.url,user:req.user.userId,status:'dev'}).lean();
           if (!app) {
            throw new ApiError(404, "App not found");
          }
          let liveApp=await App.findOne({parentApp:app._id,status:'live'},{url:1,_id:0});     
          res.status(200).json(
            new apiResponse(200, "App fetched successfully",{...app,isLive: !!liveApp,})
           );
        }),
  updateApp:catchAsync(async (req, res) => {
    if (!moongooseHelper.isValidMongooseId(req.params.id)) {
      throw new ApiError(404, "AppId not valid");
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
            delete updateData['visitorCount']; // as user may increase the visitors by visiting live app and but update the previous data in builder  so visitor count again set to previous
            if(updateData.isLive){
              updateData['changed']=true;
            }
            await App.updateOne({ _id: req.params.id,user: req.user.userId}, updateData,).lean();
            res.status(200).json(
              new apiResponse(200, "App updated successfully")
            );
    }),

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
    liveApp:catchAsync(async (req,res)=>{
      let appId=req.params.appId;
        if (!moongooseHelper.isValidMongooseId(appId)) {
          throw new ApiError(404, "AppId not valid");
        }
        const parentApp=await App.findOne({_id:appId,user:req.user.userId});
            if(!parentApp){
              throw new ApiError(404, "App not found");
            }
            let previousLiveApp=await App.findOne({parentApp:appId,user:req.user.userId,status:'live'});
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
            res.status(201).json(
              new apiResponse(201, "App live successfully")
            );
    }),

  
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

    getPreviewApp:catchAsync(async(req,res)=>{
      let appId=req.params.appId;
      if (!moongooseHelper.isValidMongooseId(appId)) {
        throw new ApiError(404, "AppId not valid");
      }
      const fetchedApp=await App.findOne({_id:appId});
      res.status(200).json(
        new apiResponse(200, "App fetched successfully",fetchedApp)
      )
    }),

    fixError :async (req,res)=>{
        try {
          let fetchedApp = await App.findOne({ url: req.body.appName,
            status: 'dev'});
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
        //   fetchedApp.apis.forEach((fetchedApi, index) => {
        //     const originalApi = originalApis[index];

        //     // If the original API exists, compare the domains
        //     if (
        //       originalApi &&
        //       extractDomain(fetchedApi.api) !== extractDomain(originalApi.api)
        //     ) {
        //       // Only update if the domain is different
        //       originalApis[index].api = fetchedApi.api;
        //     }
        //   });

          // Using Promise.all() with map() to handle asynchronous operations
        const results = await Promise.all(
            fetchedApp.apis.map(async (fetchedApi, index) => {
              const originalApi = originalApis[index];
              if (
                fetchedApi &&
                fetchedApi.api &&
                originalApi &&
                originalApi.api
              ) {
                if (
                  extractDomain(fetchedApi.api) !== extractDomain(originalApi.api)
                ) {
                  originalApis[index].api = fetchedApi.api; // Update originalApis
                  return { success: true, index, newApi: fetchedApi.api }; // Return a success result
                }
              }
              return { success: false, index }; // Return a failure result
            })
          );
  
          // Check results
          results.forEach((result) => {
            if (result.success) {
                fetchedApp.apis[0].api = originalApis[0].api;
            } else {
              console.log(`No update needed for index ${result.index}`);
            }
          });
          // Update app componentCode and save
        //   fetchedApp.apis = originalApis;
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

  callAPI: async (req, res) => {
    try {
      const appId = req.query.appId;

      let appData = await App.findOne({
        _id: appId,
      });

      let api = appData.apis[0].api;

      // Regular expression to match variations of 'YOUR_API_KEY' or 'API_KEY'
      const regex = /(YOUR[-_]?API[-_]?KEY|ENTER[-_]?API[-_]?KEY|<API[-_]?KEY>)/i;

      // Replace the placeholder with the actual API key
      api = api.replace(regex, appData.apis[0].key);

      // Parse original API URL
      const originalRequestUrl = new URL(api, `http://${req.headers.host}`);
      const originalQueryParameters = Object.fromEntries(originalRequestUrl.searchParams);
      console.log("Original Query Parameters:", originalQueryParameters);

      // Parse incoming request URL
      const customRequestUrl = new URL(req.url, `http://${req.headers.host}`);
      const customQueryParameters = Object.fromEntries(customRequestUrl.searchParams);
      console.log("Incoming Query Parameters:", customQueryParameters);

      // Replace variables in the original API URL with actual values dynamically
      api = api.replace(/\$\{(.*?)\}/g, (match, expression) => {
        const trimmedExpression = expression.trim();
        console.log(`Checking for replacement: ${trimmedExpression}`, match);

        // Handle encodeURIComponent cases
        if (trimmedExpression.startsWith('encodeURIComponent(') && trimmedExpression.endsWith(')')) {
          const paramName = trimmedExpression.slice(19, -1); // Extract parameter name
          const key = Object.keys(originalQueryParameters).find(
            (keyName) => originalQueryParameters[keyName] === `\${${paramName}}`
          );
          if (key && key in customQueryParameters) {
            const encodedValue = encodeURIComponent(customQueryParameters[key]);
            console.log(`Replacing ${match} with encoded value: ${encodedValue}`);
            return encodedValue;
          }
        } else {
          // Handle regular parameter replacement
          const key = Object.keys(originalQueryParameters).find(
            (keyName) => originalQueryParameters[keyName] === match
          );
          if (key && key in customQueryParameters) {
            const value = customQueryParameters[key];
            console.log(`Replacing ${match} with ${value}`);
            return value || "";
          }
        }

        return ""; // Fallback if no replacement found
      });

      console.log("api get hit:", api);

      const response = await axios.get(api, {
        responseType: "arraybuffer",
      });

      const contentType = response.headers["content-type"];
      res.setHeader("Content-Type", contentType);
      console.log(`API Response of content Type ${contentType}`, response)
      res.send(response.data);
    } catch (error) {
      console.log("error is ----> ", error);
      res.status(500).send(error.toString());
    }
  },

  callAI: async (req, res) => {
    try {
      const appId = req.params.appId;
      if (!appId) {
        return res.status(400).json({ error: 'APP ID is required' });
      }
      const appDetails = await App.findOne({_id: appId}, { ai: 1 });
      const response = await axios.post(
        "https://api.anthropic.com/v1/messages",
        {
          model: "claude-3-5-sonnet-20240620", // Using Claude model
          max_tokens: 8000,
          messages: [
            {
              role: "user",
              content: JSON.stringify(req.body) + 'You must return email with html format only, no extra text allowed.',
            },
          ],
        },
        {
          headers: {
            "content-type": "application/json",
            "x-api-key": appDetails.ai['key'],
            "anthropic-version": "2023-06-01",
          },
        }
      );

      return res.status(200).json({ suggestion: response.data.content[0].text })
    } catch (error) {
      console.log("erorr is ----> ", error);
      res.send(error);
    }
  },
  
  toolEnhance: async (req, res) => {
    try {
        const appUrl = req.body.appUrl;
        const selectedOptions = req.body.selectedOptions;
        const app = await App.findOne({
          url: appUrl,
          user: new mongoose.Types.ObjectId(req.user.userId),
          status: 'dev'
        });
        let aiUserThreadPrompt = '';
        let prompt = '';
        for (let i = 0; i < selectedOptions.length; i++) {
          switch (selectedOptions[i]) {
            case "enhance_UI":
              prompt +=
                "Please enhance the overall UI while keeping the design consistent with the current theme. Make sure the elements are visually appealing without changing the existing structure or functionality. ";
              break;
            case "error_handling":
              prompt +=
                "Improve error handling in the code, ensuring proper handling of edge cases, try-catch blocks, and meaningful error messages. ";
              break;
            case "responsiveness":
              prompt +=
                "Make the component fully responsive for various screen sizes including mobile, tablet, and desktop, ensuring that the layout adjusts gracefully across all devices. ";
              break;
            case "functional_issue":
              prompt += `Resolve any functional issues or bugs present in the code without changing the UI design, API structure, or code patterns. `;
              break;
            case "enhance_contrast":
              prompt +=
                "Improve the color contrast to ensure better readability and accessibility for visually impaired users, adhering to WCAG 2.1 guidelines. ";
              break;
            case "more_colorful":
              prompt +=
                "Enhance the color scheme by adding more vibrant and engaging colors, while still maintaining a professional and consistent look. ";
              break;
            default:
              prompt += "";
              break;
          }
        }

        
        aiUserThreadPrompt = prompt;
        prompt += `\nEnsure that all React hooks are written with the full 'React' prefix, e.g., React.useState(). 
                  Create React element without any import statement. The following header is already added:
                  import React, {useState, useEffect, useContext, useReducer, useCallback, useMemo, useRef, useImperativeHandle, useLayoutEffect, useDebugValue, useTransition, useDeferredValue, useId, useSyncExternalStore, useInsertionEffect} from 'react'; import * as LucideIcons from 'lucide-react'; import { useLocation } from 'react-router-dom'; 
                  You must return code only, no extra text allowed. like this 
                   Output structure:
                    function AppName(){
                        ...
                    }
                    return AppName;
                  `;
        prompt += `This is my code: ${app.componentCode}`;

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
          app.thread_id,
          {
            role: "user",
            content: `This was my requirement ${aiUserThreadPrompt}, And this is the latest code output: ${response.data.content[0].text} `,
          },
          {
            role: "assistant",
            content: 'Ok, thanks for the update. I have got the current code.',
          }
        );

        app.componentCode = response.data.content[0].text;

        const urlRegex = /fetch\((['"`])([^'"`]+)\1\)/;
        let originalApis = []; // Array to store original API objects
  
        // Replace URLs in the code while extracting them
        app.componentCode = app.componentCode.replace(
          urlRegex,
          (matchedUrl) => {
            // Extract the full URL from the matched string
            const fullUrl = matchedUrl.match(/(['"`])([^'"`]+)\1/)[2]; // URL is in the second capture group
            if (fullUrl.startsWith(process.env.BACKEND_URL)) {
              originalApis = app.apis;
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
            paramsArray.push(`appId=${app._id}`); // Ensure to append appId

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

        const results = await Promise.all(
          app.apis.map(async (fetchedApi, index) => {
            const originalApi = originalApis[index];
            if (
              fetchedApi &&
              fetchedApi.api &&
              originalApi &&
              originalApi.api
            ) {
              if (
                extractDomain(fetchedApi.api) !== extractDomain(originalApi.api)
              ) {
                originalApis[index].api = fetchedApi.api; // Update originalApis
                return { success: true, index, newApi: fetchedApi.api }; // Return a success result
              }
            }
            return { success: false, index }; // Return a failure result
          })
        );

        // Check results
        results.forEach((result) => {
          if (result.success) {
              app.apis[0].api = originalApis[0].api;
          } else {
            console.log(`No update needed for index ${result.index}`);
          }
        });
        // Update app componentCode and save
      //   app.apis = originalApis;
        await app.save();

        // Find the existing chat session
        let oldChatSession = await chatSession
          .findOne({
            agentId: new mongoose.Types.ObjectId(app._id),
          });

          if(oldChatSession.messages[oldChatSession.messages.length - 1].role === 'assistant'){
              oldChatSession.messages[oldChatSession.messages.length - 1].code = app.componentCode;
              await oldChatSession.save();
          }

        return res.status(200).json({suggestion: response.data.content[0].text })
        } catch (error) {
      console.log("erorr is ----> ",error);
      res.send(error);
    }
  },

  checkUniqueUrl:catchAsync( async(req,res)=>{
        const url=req.body.url;
        const appId=req.body.appId;
        if(!moongooseHelper.isValidMongooseId(appId)){
          throw new ApiError(404, "AppId not valid");
        }
        let existingApp = await App.findOne({ url,
          status: {
            $ne: 'deleted'
        }
         }).collation({ locale: 'en', strength: 2 }).lean();
        if(existingApp && existingApp._id==appId){
          return res.status(200).json(
            new ApiResponse(200,"",{url:existingApp.url})
          )
        }
        if (existingApp) {
            return res.status(409 ).json({ error: 'url already exists' });
        } 
        await App.updateOne({_id:appId},{$set:{url,changed:true}})
        return res.status(200).json(
          new ApiResponse(200,"Url updated successfully",{url})
        )
  }),

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
    saveTransactionDetails: async (req, res) => {
        try {
            let { key, token, appId, description, currency, amount, paymentMethod, paymentStatus, email } = req.body;
            if(paymentMethod == 'stripeCheckout'){
                    let transactionObj = {
                        paymentStatus: paymentStatus,
                        description: description,
                        amount: isNaN(amount)?0:amount/100,
                        currency: currency,
                        email:email,
                        id: token
                    }
                    await appVisitorsModel.updateOne({ _id: key }, { $set: { transaction_status: paymentStatus, transaction_completed: true, transaction_json: JSON.stringify(transactionObj), transaction_mode: paymentMethod, amount:isNaN(amount)?0:amount/100, currency:currency } });
                    res.status(201).json({
                        message: "Transaction details saved successfully",
                        data: transactionObj,
                    });

                } 
            } catch (err) {
                let visit = await appVisitorsModel.findOne({ _id: req.body.key });
                if (!visit.transaction_completed) {
                    let payment_error = 'Payment Failed with code: ' + err.code + ' - ' + err.message;
                    await appVisitorsModel.updateOne({ _id: req.body.key }, { $set: { transaction_status: payment_error, transaction_completed: false, transaction_json: JSON.stringify(err), transaction_mode: req.body.paymentMethod } });
                }

                // return response.error(res, err);
                    res.status(500).json({ error: err.message });
            }
    },
}

// Helper function to extract the domain from a URL
function extractDomain(url) {
    const domain = url.split('/')[2]; // Extracts the domain part of the URL
    return domain;
}

