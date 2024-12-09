const catchAsync = require("../../utils/catchAsync");
const planModel=require('../../models/plan.model');
const apiResponse=require('../../utils/apiResponse');
const ApiError = require("../../utils/throwError");
module.exports={
    getPlans: catchAsync(async (req, res) => {
        const findAllPlans = await planModel.find({});
        res.status(200).json(
            new apiResponse(200, "Plans fetched successfully", findAllPlans)
        );
    }),
    getPlansById: catchAsync(async (req, res) => {
        const particularPlan = await planModel.findById(req.params.id);
        res.status(200).json(
            new apiResponse(200, "Plan fetched successfully", particularPlan)
        );
    }),
    updatePlanById:catchAsync(async (req, res) => {
        await planModel.updateOne({_id:req.params.id},req.body);
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