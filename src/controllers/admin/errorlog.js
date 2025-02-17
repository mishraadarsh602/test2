const mongoose = require("mongoose");
const errorLogs = require("../../models/logs/errorLogs");
const apiResponse = require("../../utils/apiResponse");
const catchAsync = require("../../utils/catchAsync");

const getErrorLogs = catchAsync(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const { startDate, statusCode, error, requestPath, userId } = req.query;

  let filter = {};

  if (startDate) {
    filter.createdAt = { $gte: new Date(startDate) };
  }

  if (statusCode) {
    filter.statusCode = parseInt(statusCode);
  }


  if (error) {
    filter.error = { $regex: error, $options: "i" };
  }

  if (requestPath) {
    filter.requestPath = { $regex: requestPath, $options: "i" };
  }


  if (userId) {
    if (userId === "null") {
     
      filter.userId = null;
    } else if (mongoose.Types.ObjectId.isValid(userId)) {
    
      filter.$or = [
        { userId: userId },
        { "userId.name": { $regex: userId, $options: "i" } }, 
        { "userId.email": { $regex: userId, $options: "i" } }, 
      ];
    } else {
      
      return res.status(200).json(
        new apiResponse(200, "Error logs fetched successfully", {
          errorLogs: [],
          pagination: {
            totalCount: 0,
            totalPages: 0,
            currentPage: page,
            itemsPerPage: limit,
          },
        })
      );
    }
  }

  
  const totalCount = await errorLogs.countDocuments(filter);

  
  const allErrorLogs = await errorLogs
    .find(filter)
    .populate("userId", "name email")
    .skip(skip)
    .limit(limit);

  const totalPages = Math.ceil(totalCount / limit);

  res.status(200).json(
    new apiResponse(200, "Error logs fetched successfully", {
      errorLogs: allErrorLogs,
      pagination: {
        totalCount,
        totalPages,
        currentPage: page,
        itemsPerPage: limit,
      },
    })
  );
});

module.exports = {
  getErrorLogs,
};
