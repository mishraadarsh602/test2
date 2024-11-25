
const App = require("../../models/app"); 
const ApiResponse = require("../../utils/apiResponse"); 
const catchAsync = require("../../utils/catchAsync");





exports.getApps = catchAsync(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;


  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 10;
  const skip = (pageNum - 1) * limitNum;


  const apps = await App.find()
    .sort({ updatedAt: -1 }) 
    .skip(skip)
    .limit(limitNum);

 
  const total = await App.countDocuments();


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
