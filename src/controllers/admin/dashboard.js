const mongoose = require('mongoose');
const { OpenAI } = require("openai");
const featureListModel = require('../../models/featureList');
const catchAsync = require('../../utils/catchAsync');
const apiResponse = require('../../utils/apiResponse');
const userModel = require('../../models/user.model');
const appModel = require('../../models/app');
const appVisitorsModel = require('../../models/appVisitors');

const getFeatureLists = catchAsync(async (req, res) => {
  const { search = "", type = "", page = 1, limit = 10 } = req.query;

 
  const searchQuery = {
    $or: [
      { title: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { type: { $regex: search, $options: "i" } },
    ],
  };

  if (type) {
    searchQuery.type = type;
  }


  const pageNum = parseInt(page, 10);
  const pageLimit = parseInt(limit, 10);
  const skip = (pageNum - 1) * pageLimit;


  const totalCount = await featureListModel.countDocuments(searchQuery);


  const allFeatureLists = await featureListModel
    .find(searchQuery,{ title: 1, description: 1, type: 1, active: 1, visitorCount: 1 })
    .skip(skip)
    .limit(pageLimit)
    .sort({title: 1} );

 
  const featureAllListTypes = await featureListModel.distinct("type");


  const pagination = {
    totalCount,
    currentPage: pageNum,
    totalPages: Math.ceil(totalCount / pageLimit),
    pageSize: pageLimit,
  };

  
  res.status(200).json(
    new apiResponse(200, "Feature lists fetched successfully", {
      featureLists: allFeatureLists,
      pagination,
      featureAllListTypes,
    })
  );
});


const getVisitorsList = catchAsync(async (req, res) => {
    const visitorStats = await featureListModel
      .find({}, { visitorCount: 1, title: 1, _id: 1 })
      .sort({ visitorCount: -1 })
      .lean();
  
    res.status(200).json(
      new apiResponse(200, "Visitor counts fetched successfully", visitorStats)
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
    const [userCount, featureListCount, visitorStats, appCount] = await Promise.all([
        userModel.countDocuments({}),
        featureListModel.countDocuments({}),
        appVisitorsModel.aggregate([
            {
                $group: {
                    _id: '$type',
                    count: { $sum: 1 }
                }
            }
        ]),
        appModel.countDocuments({ status: 'dev' })  // Modified this line to filter by status
    ]);

    // Convert visitor stats array to counts by type
    const visitorCounts = visitorStats.reduce((acc, stat) => {
        acc[`${stat._id.toLowerCase()}Count`] = stat.count;
        return acc;
    }, { visitorCount: 0, leadCount: 0 });

    res.status(200).json(
        new apiResponse(200, "Counts fetched successfully", {
            userCount,
            featureListCount,
            ...visitorCounts,
            appCount
        })
    );
});



const getCreationStats = catchAsync(async (req, res) => {
    const { startDate, endDate } = req.query;
    // Convert strings to Date objects and handle timezone consistently
    const end = endDate ? new Date(new Date(endDate).setHours(23, 59, 59, 999)) : new Date();
    const start = startDate ? new Date(new Date(startDate).setHours(0, 0, 0, 0)) : new Date(end - 30 * 24 * 60 * 60 * 1000);

    // Run both aggregations in parallel
    const [userStats, appStats] = await Promise.all([
        userModel.aggregate([
            {
                $match: {
                    createdAt: { $gte: start, $lte: end }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" },
                        day: { $dayOfMonth: "$createdAt" }
                    },
                    userCount: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: {
                        $dateToString: {
                            date: {
                                $dateFromParts: {
                                    year: "$_id.year",
                                    month: "$_id.month",
                                    day: "$_id.day"
                                }
                            },
                            format: "%Y-%m-%d"
                        }
                    },
                    userCount: 1
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]),

        appModel.aggregate([
            {
                $match: {
                    createdAt: { $gte: start, $lte: end }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" },
                        day: { $dayOfMonth: "$createdAt" }
                    },
                    appCount: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: {
                        $dateToString: {
                            date: {
                                $dateFromParts: {
                                    year: "$_id.year",
                                    month: "$_id.month",
                                    day: "$_id.day"
                                }
                            },
                            format: "%Y-%m-%d"
                        }
                    },
                    appCount: 1
                }
            },
            {
                $sort: { _id: 1 }
            }
        ])
    ]);

    // Generate all dates in range
    const dates = [];
    const currentDate = new Date(start);
    while (currentDate <= end) {
        dates.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
    }

    // Create base stats object with all dates
    const dateMap = dates.reduce((acc, date) => {
        acc[date] = {
            date,
            userCount: 0,
            appCount: 0
        };
        return acc;
    }, {});

    // Fill in actual stats
    userStats.forEach(stat => {
        if (dateMap[stat._id]) {
            dateMap[stat._id].userCount = stat.userCount;
        }
    });

    appStats.forEach(stat => {
        if (dateMap[stat._id]) {
            dateMap[stat._id].appCount = stat.appCount;
        }
    });

    const combinedStats = Object.values(dateMap);
    
    res.status(200).json(
        new apiResponse(200, "Creation statistics fetched successfully", {
            stats: combinedStats
        })
    );
});

const findTargetUser = async (data) => {
    if (mongoose.Types.ObjectId.isValid(data)) {
        return await userModel.findOne({ _id: data }).lean();
    }
    return await userModel.findOne({ ogCompanyName: data }).lean();
};

const duplicateApp = catchAsync(async (req, res) => {
    const { appId, data } = req.body;
    if (!appId || !data) {
        return res.status(400).json(
            new apiResponse(400, "App ID and user data are required")
        );
    }
    try {
        const [targetUser, originalApp] = await Promise.all([
            findTargetUser(data),
            appModel.findById(appId),
        ]);

        if (!targetUser) {
            return res.status(404).json(
                new apiResponse(404, "Target user or company not found")
            );
        }
        if (!originalApp) {
            return res.status(404).json(
                new apiResponse(404, "Original app not found")
            );
        }

        originalApp.noOfCopies += 1;
        const copyCount = originalApp.url.match(/copied-/g) ? Number(originalApp.url.split('-')[1].split('x')[0]) : 0;
        const baseUrl = copyCount >= 1 ?
            `${originalApp.url.replace(`${copyCount}x`, `${copyCount + 1}x`)}-${originalApp.noOfCopies}`
            : `copied-${copyCount + 1}x-${originalApp.url}-${originalApp.noOfCopies}`;

        let uniqueUrl = baseUrl;

        for (let counter = 1; await appModel.exists({ url: uniqueUrl }); counter++) {
            uniqueUrl = `${baseUrl}-${counter}`;
        }

        const duplicatedAppData = {
            ...originalApp.toObject(),
            user: targetUser._id,
            visitorCount: 0,
            url: uniqueUrl,
            name: uniqueUrl,
            noOfCopies: 0,
        };
        delete duplicatedAppData._id;
        const duplicatedApp = await appModel.create(duplicatedAppData);

        await originalApp.save();

        if (originalApp.componentCode) {
            const thread_id = await createThread();
            const updatedComponentCode = originalApp.componentCode.replace(
                new RegExp(appId, "g"), 
                duplicatedApp._id.toString() 
            );

            await appModel.findByIdAndUpdate(duplicatedApp._id, {
                componentCode: updatedComponentCode,
                thread_id,
            });
        }
        return res.status(201).json(
            new apiResponse(201, "App duplicated successfully", duplicatedApp)
        );
    } catch (error) {
        console.error("Error duplicating app:", { appId, data, error });
        return res.status(500).json(
            new apiResponse(500, "An error occurred while duplicating the app", error.message)
        );
    }
});

async function createThread() {
    if (process.env.OPENAI_API_KEY) {
      try {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const thread = await openai.beta.threads.create();
        return thread.id;
      } catch (error) {
        console.log('Thred Creation Error:', error)
        return '';
      }
    }
  }



module.exports = {
    getFeatureLists,
    getFeatureListById,
    createFeatureList,
    updateFeatureList,
    toggleActiveStatus, 
    getAllCounts,
    getCreationStats,
    duplicateApp,
    getVisitorsList
};
