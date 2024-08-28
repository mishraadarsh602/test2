const Error = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  console.log(':::::::::::::::::::::::::::::::::::::::::::::::::');
  console.log("Error Encountered");
  console.log(err);
  console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>');
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
