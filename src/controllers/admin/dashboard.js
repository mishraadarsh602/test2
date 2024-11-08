const featureListModel = require('../../models/featureList');
const catchAsync = require('../../utils/catchAsync');
const apiResponse = require('../../utils/apiResponse');
const userModel = require('../../models/user.model');
const appModel = require('../../models/app');
const appLeadsModel = require('../../models/appLeads');
const appVisitorsModel = require('../../models/appVisitors');

const getFeatureLists = catchAsync(async (req, res) => {
 
    const { search = '', type = '', page = 1, limit = 10 } = req.query;

    const searchQuery = {
        $or: [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } },
            { type: { $regex: search, $options: 'i' } },
        ]
    };

   
    if (type) {
        searchQuery.type = type; 
    }

  
    const pageNum = parseInt(page, 10);
    const pageLimit = parseInt(limit, 10);


    const skip = (pageNum - 1) * pageLimit;


    const totalCount = await featureListModel.countDocuments(searchQuery);

  
    const allFeatureLists = await featureListModel.find(searchQuery)
        .skip(skip)
        .limit(pageLimit)
        .sort({ createdAt: -1 });  // 
    const pagination = {
        totalCount,
        currentPage: pageNum,
        totalPages: Math.ceil(totalCount / pageLimit),
        pageSize: pageLimit
    };

    res.status(200).json(
        new apiResponse(200, "Feature lists fetched successfully", {
            featureLists: allFeatureLists,
            pagination
        })
    );
});

const getFeatureTypes = catchAsync(async (req, res) => {
  
    const featureTypes = await featureListModel.distinct('type');
    
   
    res.status(200).json(
        new apiResponse(200, 'Feature types fetched successfully', { types: featureTypes })
    );
});

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

const createFeatureList = catchAsync(async (req, res) => {
    const { type, title, description, active, comingSoon, apis, componentCode, icon, visitorCount, tool_type, rank } = req.body;

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

const updateFeatureList = catchAsync(async (req, res) => {
    const { id } = req.params;
    const { type, title, description, active, comingSoon, apis, componentCode, icon, visitorCount, tool_type, rank } = req.body;

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

const toggleActiveStatus = catchAsync(async (req, res) => {
    const { id } = req.params;
    const featureList = await featureListModel.findById(id);
    if (!featureList) {
        return res.status(404).json(
            new apiResponse(404, "Feature list not found")
        );
    }
    featureList.active = !featureList.active;
    await featureList.save();
    res.status(200).json(
        new apiResponse(200, "Feature list active status toggled successfully", featureList)
    );
});


const getAllCounts = catchAsync(async (req, res) => {
    const [userCount, featureListCount, leadCount, visitorCount, appCount] = await Promise.all([
        userModel.countDocuments({}),
        featureListModel.countDocuments({}),
        appLeadsModel.countDocuments({}),
        appVisitorsModel.countDocuments({}),
        appModel.countDocuments({})
    ]);

    res.status(200).json(
        new apiResponse(200, "Counts fetched successfully", {
            userCount,
            featureListCount,
            leadCount,
            visitorCount,
            appCount
        })
    );
});

module.exports = {
    getFeatureLists,
    getFeatureListById,
    getFeatureTypes,
    createFeatureList,
    updateFeatureList,
    toggleActiveStatus, 
    getAllCounts
};
