const errorLogs = require("../../models/logs/errorLogs");
const apiResponse = require("../../utils/apiResponse");
const catchAsync = require("../../utils/catchAsync");


const getErrorLogs = catchAsync(async (req, res) => {

  const page = parseInt(req.query.page) || 1; 
  const limit = parseInt(req.query.limit) || 10; 
  const skip = (page - 1) * limit; 

  const totalCount = await errorLogs.countDocuments();

 
  const allErrorLogs = await errorLogs
    .find()
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
