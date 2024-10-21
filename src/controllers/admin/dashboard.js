
const featureListModel = require('../../models/featureList');
const catchAsync = require('../../utils/catchAsync');
const apiResponse = require('../../utils/apiResponse');
module.exports = {
    getFeatureLists: catchAsync(async (req, res) => {
        const allFeatureLists = await featureListModel.find({});
        res.status(200).json(
            new apiResponse(200, "All featureLists fetched successfully", allFeatureLists)
        )
    }
    )
}


