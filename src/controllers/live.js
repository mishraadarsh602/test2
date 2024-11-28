const App = require('../models/app');
const appVisitorModel = require('../models/appVisitors');
const appModel=require('../models/app');
const featureListModel=require('../models/featureList');
const redisClient=require('../utils/redisClient');
const  mongoose = require('mongoose');
const catchAsync=require('../utils/catchAsync');
const moongooseHelper=require('../utils/moongooseHelper');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/throwError');
module.exports = {
    getLivePreview:catchAsync(
      async (req,res)=>{
      const parameter = req.params.url;
      let response;
      
      // Check if Redis client is already connected
      if (!redisClient.isOpen) {
        await redisClient.connect();
      }

      let app = await redisClient.get(`app-${parameter}`);
      let redisResponse=JSON.parse(app);
      if (!redisResponse) {
        response = await App.findOne({ url: parameter, status: "live" }, { apis: 0, thread_id: 0 }
        ).collation({ locale: 'en', strength: 2 });
        
       
        // If response not found, try to fetch by _id
        if (!response && moongooseHelper.isValidMongooseId(parameter)) {
          response = await App.findOne({
            _id: new moongooseHelper.giveMoongooseObjectId(parameter),
            status: "live",
          }, { apis: 0, thread_id: 0 });
        }

        if (!response) {
         throw new ApiError(404,"App Not Found" )
        }
        await redisClient.set(`app-${parameter}`, JSON.stringify(response));
      }

      res.status(200).json(
        new ApiResponse(200,"Fetched live preview successfully",app ? redisResponse : response)
      );
  }),
};

