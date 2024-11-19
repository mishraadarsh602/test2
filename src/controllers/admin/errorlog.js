const errorLogs = require("../../models/logs/errorLogs");
const apiResponse = require("../../utils/apiResponse");
const catchAsync = require("../../utils/catchAsync");

// Get all error logs with pagination
const getErrorLogs = catchAsync(async (req, res) => {
  // Extract pagination parameters from the query
  const page = parseInt(req.query.page) || 1; // Default to page 1
  const limit = parseInt(req.query.limit) || 10; // Default to 10 items per page
  const skip = (page - 1) * limit; // Calculate the number of documents to skip

  // Fetch the total count of error logs
  const totalCount = await errorLogs.countDocuments();

  // Fetch the paginated error logs and populate the user details
  const allErrorLogs = await errorLogs
    .find()
    .populate("userId", "name email")
    .skip(skip)
    .limit(limit);

  // Calculate total pages
  const totalPages = Math.ceil(totalCount / limit);

  // Send the response with paginated error logs
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
