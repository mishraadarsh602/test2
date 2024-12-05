const catchAsync = require("../../utils/catchAsync");
const planModel=require('../../models/plan.model');
const apiResponse=require('../../utils/apiResponse');
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
}