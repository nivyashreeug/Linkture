const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const { getMatchesForUser } = require('../services/matchingService');

const getMatches = asyncHandler(async (request, response) => {
  const currentUser = await User.findById(request.user.id).select('-passwordHash -__v -email');

  if (!currentUser) {
    return response.status(404).json({
      success: false,
      message: 'User not found.',
    });
  }

  const matches = await getMatchesForUser(currentUser);

  const results = matches.map((match) => ({
    ...(match.user.toJSON ? match.user.toJSON() : match.user),
    matchScore: match.matchScore,
    sharedSkills: match.sharedSkills,
    sharedInterests: match.sharedInterests,
  }));

  response.json({
    success: true,
    count: results.length,
    matches: results,
  });
});

module.exports = {
  getMatches,
};