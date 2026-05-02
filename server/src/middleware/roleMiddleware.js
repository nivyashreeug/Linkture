const ApiError = require('../utils/ApiError');

const authorizeRoles = (...allowedRoles) => {
  return (request, response, next) => {
    if (!request.user || !allowedRoles.includes(request.user.role)) {
      return next(new ApiError(403, 'You do not have permission to access this resource.'));
    }

    return next();
  };
};

module.exports = authorizeRoles;
