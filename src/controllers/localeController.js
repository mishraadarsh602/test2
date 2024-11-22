const catchAsync = require("../utils/catchAsync");
const Locale = require("../models/locale");
const ApiResponse = require("../utils/apiResponse");

module.exports = {

  createLocale: catchAsync(async (req, res) => {
    const { langCode, language, fields } = req.body;

    if (!langCode || !language || !fields) {
      return res
        .status(400)
        .json(new ApiResponse(400, "All fields are required"));
    }

    try {
      
      const existingLocale = await Locale.findOne({ langCode, language });
      if (existingLocale) {
        return res
          .status(400)
          .json(
            new ApiResponse(
              400,
              "Locale with this langCode and language already exists"
            )
          );
      }

  
      const locale = await Locale.create({ langCode, language, fields });

      res
        .status(201)
        .json(new ApiResponse(201, "Locale created successfully", locale));
    } catch (error) {
      throw error; 
    }
  }),

 
  getLocale: catchAsync(async (req, res) => {
    let locale;

    if (req.params.langCode) {
     
      const language = await Locale.findOne({ langCode: req.params.langCode });
      if (!language) {
        return res
          .status(404)
          .json(new ApiResponse(404, "Language doesn't exist"));
      }
      locale = language;
    } else {
      
      locale = await Locale.find({}).select("langCode language");
    }

    res
      .status(200)
      .json(new ApiResponse(200, "Locale fetched successfully", locale));
  }),


  updateLocale: catchAsync(async (req, res) => {
    const { langCode } = req.params;
    const updates = req.body;

    
    if (langCode === "en") {
      return res
        .status(403)
        .json(new ApiResponse(403, "English language cannot be updated"));
    }

 
    const updatedLocale = await Locale.findOneAndUpdate({ langCode }, updates, {
      new: true,
      runValidators: true,
    });

    if (!updatedLocale) {
      return res.status(404).json(new ApiResponse(404, "Locale not found"));
    }

    res
      .status(200)
      .json(new ApiResponse(200, "Locale updated successfully", updatedLocale));
  }),


  deleteLocale: catchAsync(async (req, res) => {
    const { langCode } = req.params;

   
    if (langCode === "en") {
      return res
        .status(403)
        .json(new ApiResponse(403, "English language cannot be deleted"));
    }

   
    const deletedLocale = await Locale.findOneAndDelete({ langCode });
    if (!deletedLocale) {
      return res.status(404).json(new ApiResponse(404, "Locale not found"));
    }

    res
      .status(200)
      .json(new ApiResponse(200, "Locale deleted successfully", deletedLocale));
  }),
};
