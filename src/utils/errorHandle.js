const ErrorLogsModel=require('../models/logs/errorLogs');
const logErrorToDatabase = async (err, req) => {
  try {
    const errorLog = new ErrorLogsModel({
      userId: req.user ? req.user.userId : null,
      error: err.message || 'Unknown Error',
      statusCode: err.statusCode || 500,
      requestPath: req.path,
      requestBody: req.body
    });
    await errorLog.save();
  } catch (error) {

  }
};
const Error = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  console.log(':::::::::::::::::::::::::::::::::::::::::::::::::');
  console.log("Error Encountered");
  console.log(err);
  console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
  logErrorToDatabase(err, req);
  return res.status(statusCode).json({
    success: false,
    error: {
      code: err.statusCode,
      trace: null,
      message: err.message,
    },
  });
};

module.exports = {
  Error,
};
