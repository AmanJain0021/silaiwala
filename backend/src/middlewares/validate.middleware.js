const { validationResult } = require('express-validator');
const ErrorResponse = require("../utils/errorResponse.js");

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    return next();
  }
  
  const extractedErrors = [];
  errors.array().map(err => extractedErrors.push(err.msg));

  return next(new ErrorResponse(extractedErrors[0], 400));
};

module.exports = validate;
