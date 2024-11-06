const featureListModel = require('../../models/featureList');
const catchAsync = require('../../utils/catchAsync');
const apiResponse = require('../../utils/apiResponse');
const userModel = require('../../models/user.model');
const appModel = require('../../models/app');
const appLeadsModel = require('../../models/appLeads');
const appVisitorsModel = require('../../models/appVisitors');

// Controller for getting all feature lists
const getFeatureLists = catchAsync(async (req, res) => {
    const allFeatureLists = await featureListModel.find({});
    res.status(200).json(
        new apiResponse(200, "All feature lists fetched successfully", allFeatureLists)
    );
});

// Controller for getting a feature list by ID
const getFeatureListById = catchAsync(async (req, res) => {
    const { id } = req.params;
    const featureList = await featureListModel.findById(id);
    if (!featureList) {
        return res.status(404).json(
            new apiResponse(404, "Feature list not found")
        );
    }
    res.status(200).json(
        new apiResponse(200, "Feature list fetched successfully", featureList)
    );
});

// Controller for creating a new feature list
const createFeatureList = catchAsync(async (req, res) => {
    const { type, title, description, active, comingSoon, apis, componentCode, icon, visitorCount, tool_type, rank } = req.body;

    // Validate required fields
    if (!type || !title || !description || !componentCode || !icon) {
        return res.status(400).json(
            new apiResponse(400, "Required fields are missing")
        );
    }

    const newFeatureList = new featureListModel({
        type,
        title,
        description,
        active,
        comingSoon,
        apis,
        componentCode,
        icon,
        visitorCount,
        tool_type,
        rank
    });

    await newFeatureList.save();
    res.status(201).json(
        new apiResponse(201, "Feature list created successfully", newFeatureList)
    );
});

// Controller for updating a feature list by ID
const updateFeatureList = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { type, title, description, active, comingSoon, apis, componentCode, icon, visitorCount, tool_type, rank } = req.body;

    // Validate required fields
    if (!type || !title || !description || !componentCode || !icon) {
        return res.status(400).json(
            new apiResponse(400, "Required fields are missing")
        );
    }

    const updatedFeatureList = await featureListModel.findByIdAndUpdate(
        id,
        {
            type,
            title,
            description,
            active,
            comingSoon,
            apis,
            componentCode,
            icon,
            visitorCount,
            tool_type,
            rank
        },
        { new: true }
    );

    if (!updatedFeatureList) {
        return res.status(404).json(
            new apiResponse(404, "Feature list not found")
        );
    }

    res.status(200).json(
        new apiResponse(200, "Feature list updated successfully", updatedFeatureList)
    );
});

// Controller for toggling the active status of a feature list
const toggleActiveStatus = catchAsync(async (req, res) => {
    const { id } = req.params;

    // Find the feature list by id
    const featureList = await featureListModel.findById(id);
    if (!featureList) {
        return res.status(404).json(
            new apiResponse(404, "Feature list not found")
        );
    }

    // Toggle the active status
    featureList.active = !featureList.active;

    // Save the updated feature list
    await featureList.save();

    res.status(200).json(
        new apiResponse(200, "Feature list active status toggled successfully", featureList)
    );
});

const getUsersCount = catchAsync(async (req, res) => {
    const userCount = await userModel.countDocuments({});
    res.status(200).json(
        new apiResponse(200, "User count fetched successfully", userCount)
    );
});

const getFeaturesCount = catchAsync(async (req, res) => {
    const featureListCount = await featureListModel.countDocuments({});
    res.status(200).json(
        new apiResponse(200, "Feature list count fetched successfully", featureListCount)
    );
});


const getLeadsCount = catchAsync(async (req, res) => {
    const leadCount = await appLeadsModel.countDocuments({});
    res.status(200).json(
        new apiResponse(200, "Lead count fetched successfully", leadCount)
    );

});

const getVisitorsCount = catchAsync(async (req, res) => {
    const visitorCount = await appVisitorsModel.countDocuments({});
    res.status(200).json(
        new apiResponse(200, "Visitor count fetched successfully", visitorCount)
    );
});

const getAppsCount = catchAsync(async (req, res) => {
    const appCount = await appModel.countDocuments({});
    res.status(200).json(
        new apiResponse(200, "App count fetched successfully", appCount)
    );
});



module.exports = {
    getFeatureLists,
    getFeatureListById,
    createFeatureList,
    updateFeatureList,
    toggleActiveStatus, 
    getUsersCount,
    getFeaturesCount,
    getAppsCount,
    getLeadsCount,
    getVisitorsCount
};
