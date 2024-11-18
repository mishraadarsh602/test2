const catchAsync = require('../utils/catchAsync');
const Locale = require('../models/locale');
const ApiError = require('../utils/throwError');
const ApiResponse = require('../utils/apiResponse');
module.exports = {
    getLocale: catchAsync( async(req, res) => {
      let locale;
      if (req.params.langCode) {
        let language = await Locale.findOne({ langCode: req.params.langCode });
        if (language) { locale = language; }
        else  throw new ApiError(404, "Language Doesn\'t exist");
      }
         else {
                locale = await Locale.find({}).select('langCode language');
            }
          return res.status(200).json(
        new ApiResponse(200,'locale fetched Successfully',locale)
      );
        } 
    )
      
}