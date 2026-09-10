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

  const results = matches.map((match) => {
    const userObj = match.user.toJSON ? match.user.toJSON() : match.user;
    return {
      ...userObj,
      name:
        userObj.startupProfile?.companyName ||
        userObj.roleDetails?.startup?.startupName ||
        userObj.roleDetails?.vc?.firmName ||
        userObj.fullName,
      domain:
        userObj.startupProfile?.industry ||
        userObj.roleDetails?.startup?.domain ||
        (Array.isArray(userObj.vcProfile?.domainInterests) && userObj.vcProfile.domainInterests[0]) ||
        (Array.isArray(userObj.interests) && userObj.interests[0]) ||
        'General',
      matchScore: match.matchScore,
      sharedSkills: match.sharedSkills,
      sharedInterests: match.sharedInterests,
      connectionStatus: 'none',
      connectionId: null,
    };
  });

  response.json({
    success: true,
    count: results.length,
    matches: results,
  });
});

module.exports = {
  getMatches,
};