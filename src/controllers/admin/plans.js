const catchAsync = require("../../utils/catchAsync");
const planModel=require('../../models/plan.model');
const apiResponse=require('../../utils/apiResponse');
const ApiError = require("../../utils/throwError");
const CryptoJS = require("crypto-js");
const ApiResponse = require("../../utils/apiResponse");
const planFeaturesModel = require("../../models/planFeatures.model");
const plansModel=require('../../models/plan.model');
module.exports={
    getPlans: catchAsync(async (req, res) => {
        const findAllPlans = await planModel.find({},{_id:0});
        res.status(200).json(
            new apiResponse(200, "Plans fetched successfully", findAllPlans)
        );
    }),
    getPlanByName: catchAsync(async (req, res) => {
        const particularPlan = await planModel.findOne({planName:req.params.planName}).lean();
        const encryptedId = CryptoJS.AES.encrypt(particularPlan._id.toString(), process.env.PLANS_SECRET_KEY).toString();
        particularPlan._id=encryptedId;
        res.status(200).json(
            new apiResponse(200, "Plan fetched successfully", particularPlan)
        );
    }),
    updatePlanById:catchAsync(async (req, res) => {
        const decryptedId = CryptoJS.AES.decrypt(req.body.id, process.env.PLANS_SECRET_KEY).toString(CryptoJS.enc.Utf8);
        const { totalAppsCount, totalLeadsCount } = req.body.updates;
        await planModel.updateOne({ _id: (decryptedId) },
            {
                $set: {
                    totalAppsCount,
                    totalLeadsCount
                }
            });
        res.status(200).json(
            new apiResponse(200, "Plan updated successfully")
        );
    }),
    createPlan:catchAsync(async(req,res,next)=>{
    const planExist=await planModel.findOne({planName:req.body.planName});
    if(planExist){
        return next(new ApiError(409, "Plan Already Exist"));
    }
      const planCreated= new planModel(req.body);
      await planCreated.save();
      const {planName,totalAppsCount,totalLeadsCount}=planCreated;
      res.status(200).json(
        new apiResponse(200, "Plan Created successfully ",{planName,totalAppsCount,totalLeadsCount})
      ); 
    }),
    getPlanFeatures:catchAsync(async(req,res,next)=>{
      const { search, limit, skip } = req.body;
      const searchStage = {
        $match: {
          $or: [
            {
              _id: { $regex: search, $options: "i" }
            },
            {
              parent_feature: {
                $regex: search,
                $options: "i"
              }
            }
          ]
        }
      }
      
      const response = await planFeaturesModel.aggregate(
        [
          {
            $facet: {
              parentFeatures: [
                {
                  $match: {
                    parent_feature: null
                  }
                },
                {
                  $group: {
                    _id: null,
                    parent: { $push: "$_id" }
                  }
                }
              ],
              apps: [
                searchStage,
                { $skip: skip },
                { $limit: limit },
              ],
              count: [
                searchStage,
                {
                  $group: {
                    _id: null,
                    myCount: { $sum: 1 }
                  }
                }
              ]
            }
          }
          ,
          {
            $project: {
              count: {
                $arrayElemAt: ["$count.myCount", 0]
              },
              apps: 1,

              parentFeatures: {
                $arrayElemAt: ["$parentFeatures.parent", 0]
              },

            }
          }
        ]
      )
      const plans=await plansModel.find({},{planName:1,features:1,_id:0});
      
        res.status(200).json(
            new apiResponse(200, "Features fetched successfully ",{...response[0],plans})
          ); 
    }),
    deletePlanFeature:catchAsync(async(req,res)=>{
      const {id}=req.params;
      let feature = await planFeaturesModel.findById(id);
     
      if(feature.parent_feature){
        await planFeaturesModel.findByIdAndUpdate(feature.parent_feature, {
          $pull: {
            'sub_features': feature._id
          }
        });
      }

      await planFeaturesModel.updateMany({
        parent_feature:id
      },{parent_feature:null})

      await planFeaturesModel.deleteOne({_id:id});
      res.status(200).json(
        new ApiResponse(200,'Feature Deleted Successfully')
      )
    }),
    updateFeature:catchAsync(async(req,res)=>{
      const {_id}=req.body;
      let feature = await planFeaturesModel.findById(_id);
      if(feature.parent_feature !== req.body.parent_feature){
        await planFeaturesModel.updateMany({},{
          $pull:{
            sub_features:feature._id
          }
        })

        await planFeaturesModel.updateMany({_id:req.body.parent_feature},{
          $push:{
            sub_features:feature._id
          }
        })
      }

      let response = await planFeaturesModel.findByIdAndUpdate(_id, {
        $set: req.body
      }, { new: true })

      res.status(200).json(
        new ApiResponse(200,'Feature Deleted Successfully',response)
      )
    }),

}