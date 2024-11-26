const App = require("../../models/app");
const ApiResponse = require("../../utils/apiResponse");
const catchAsync = require("../../utils/catchAsync");

exports.getApps = catchAsync(async (req, res) => {
  const { page = 1, limit = 10, name = "", id = "", url = "" } = req.query;

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const skip = (pageNum - 1) * limitNum;

  let searchQuery = {};

  if (id) {
   
    searchQuery = { _id: id };
  } else if (name) {

    searchQuery = { name: { $regex: name, $options: "i" } };
  } else if (url) {
  
    searchQuery = { url: { $regex: url, $options: "i" } };
  }

  const apps = await App.find(searchQuery)
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(limitNum);

  const total = await App.countDocuments(searchQuery);

  const pagination = {
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(total / limitNum),
  };

  res
    .status(200)
    .json(
      new ApiResponse(200, "Apps fetched successfully", { apps, pagination })
    );
});



