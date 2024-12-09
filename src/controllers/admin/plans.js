const catchAsync = require("../../utils/catchAsync");
const planModel=require('../../models/plan.model');
const apiResponse=require('../../utils/apiResponse');
const ApiError = require("../../utils/throwError");
const CryptoJS = require("crypto-js");
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

}