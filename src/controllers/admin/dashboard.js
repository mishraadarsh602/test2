const featureListModel = require('../../models/featureList');
const catchAsync = require('../../utils/catchAsync');
const apiResponse = require('../../utils/apiResponse');
const userModel = require('../../models/user.model');
const appModel = require('../../models/app');
const appLeadsModel = require('../../models/appLeads');
const appVisitorsModel = require('../../models/appVisitors');

const getFeatureLists = catchAsync(async (req, res) => {
  const { search = "", type = "", page = 1, limit = 10 } = req.query;

  // Create a search query for filtering feature lists based on search keywords
  const searchQuery = {
    $or: [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { type: { $regex: search, $options: "i" } },
    ],
  };

  // If a type filter is provided, add it to the search query
  if (type) {
    searchQuery.type = type;
  }

  // Convert pagination parameters to integers
  const pageNum = parseInt(page, 10);
  const pageLimit = parseInt(limit, 10);
  const skip = (pageNum - 1) * pageLimit;

  // Get the total count of matching documents
  const totalCount = await featureListModel.countDocuments(searchQuery);

  // Fetch paginated feature lists with sorting by creation date
  const allFeatureLists = await featureListModel
    .find(searchQuery)
    .skip(skip)
    .limit(pageLimit)
    .sort({ createdAt: -1 });

  // Fetch all distinct types of features from the feature list model
  const featureAllListTypes = await featureListModel.distinct("type");

  // Create a pagination object for easier frontend usage
  const pagination = {
    totalCount,
    currentPage: pageNum,
    totalPages: Math.ceil(totalCount / pageLimit),
    pageSize: pageLimit,
  };

  // Send the response with paginated feature lists and distinct feature types
  res.status(200).json(
    new apiResponse(200, "Feature lists fetched successfully", {
      featureLists: allFeatureLists,
      pagination,
      featureAllListTypes,
    })
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



const getCreationStats = catchAsync(async (req, res) => {
    console.log("req.query:",req.query)
    const { startDate, endDate } = req.query;
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end - 30 * 24 * 60 * 60 * 1000);
    const userStats = await userModel.aggregate([
        {
            $match: {
                createdAt: { $gte: start, $lte: end }
            }
        },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                count: { $sum: 1 },
                companies: { $addToSet: "$ogCompanyId" }
            }
        },
        {
            $project: {
                date: "$_id",
                userCount: "$count",
                companyCount: { $size: "$companies" },
                _id: 0
            }
        },
        { $sort: { date: 1 } }
    ]);

    const appStats = await appModel.aggregate([
        {
            $match: {
                createdAt: { $gte: start, $lte: end }
            }
        },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                count: { $sum: 1 }
            }
        },
        {
            $project: {
                date: "$_id",
                appCount: "$count",
                _id: 0
            }
        },
        { $sort: { date: 1 } }
    ]);

    const dateMap = new Map();
    userStats.forEach(stat => {
        dateMap.set(stat.date, {
            date: stat.date,
            userCount: stat.userCount,
            companyCount: stat.companyCount,
            appCount: 0
        });
    });

    appStats.forEach(stat => {
        if (dateMap.has(stat.date)) {
            dateMap.get(stat.date).appCount = stat.appCount;
        } else {
            dateMap.set(stat.date, {
                date: stat.date,
                userCount: 0,
                companyCount: 0,
                appCount: stat.appCount
            });
        }
    });

    const combinedStats = Array.from(dateMap.values());
    res.status(200).json(
        new apiResponse(200, "Creation statistics fetched successfully", {
            stats: combinedStats
        })
    );
});


module.exports = {
    getFeatureLists,
    getFeatureListById,
    createFeatureList,
    updateFeatureList,
    toggleActiveStatus, 
    getAllCounts,
    getCreationStats
};
