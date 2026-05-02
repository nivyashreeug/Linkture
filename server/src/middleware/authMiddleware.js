const { verifyToken } = require('../services/jwtService');
const ApiError = require('../utils/ApiError');

const authenticate = (request, response, next) => {
  const authHeader = request.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new ApiError(401, 'Authentication token is required.'));
  }

  try {
    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);
    request.user = payload;
    return next();
  } catch (error) {
    return next(new ApiError(401, 'Invalid or expired token.'));
  }
};

module.exports = authenticate;
