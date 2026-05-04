const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const normalizeStringArray = (value) => {
  if (!value) {
    return [];
  }

  const list = Array.isArray(value) ? value : [value];

  return [...new Set(list.map((item) => String(item).trim()).filter(Boolean))];
};

const getRoleKey = (role) => {
  if (role === 'VC') {
    return 'vc';
  }

  if (role === 'Startup') {
    return 'startup';
  }

  return 'student';
};

const buildRoleDetailsUpdate = (role, body, existingRoleDetails = {}) => {
  const existingDetails = existingRoleDetails?.toObject ? existingRoleDetails.toObject() : existingRoleDetails;
  const roleKey = getRoleKey(role);
  const currentDetails = existingDetails[roleKey] || {};
  const incomingDetails = body.roleDetails?.[roleKey] || body.roleDetails || {};

  if (roleKey === 'vc') {
    return {
      ...existingDetails,
      vc: {
        ...currentDetails,
        firmName: incomingDetails.firmName ?? body.firmName ?? currentDetails.firmName ?? '',
        investmentFocus: normalizeStringArray(
          incomingDetails.investmentFocus ?? body.investmentFocus ?? currentDetails.investmentFocus
        ),
      },
    };
  }

  if (roleKey === 'startup') {
    return {
      ...existingDetails,
      startup: {
        ...currentDetails,
        startupName: incomingDetails.startupName ?? body.startupName ?? currentDetails.startupName ?? '',
        domain: incomingDetails.domain ?? body.domain ?? currentDetails.domain ?? '',
        fundingStage: incomingDetails.fundingStage ?? body.fundingStage ?? currentDetails.fundingStage ?? '',
      },
    };
  }

  return {
    ...existingDetails,
    student: {
      ...currentDetails,
      education: incomingDetails.education ?? body.education ?? currentDetails.education ?? '',
      projects: normalizeStringArray(incomingDetails.projects ?? body.projects ?? currentDetails.projects),
    },
  };
};

const updateProfile = asyncHandler(async (request, response) => {
  const user = await User.findById(request.user.id);

  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  const { fullName, bio, avatarUrl, phone, location, socialLinks } = request.body;

  if (fullName !== undefined) {
    user.fullName = fullName;
  }

  if (bio !== undefined) {
    user.bio = bio;
  }

  if (avatarUrl !== undefined) {
    user.avatarUrl = avatarUrl;
  }

  if (phone !== undefined) {
    user.phone = phone;
  }

  if (location !== undefined) {
    user.location = location;
  }

  if (socialLinks !== undefined) {
    user.socialLinks = {
      ...(user.socialLinks?.toObject ? user.socialLinks.toObject() : user.socialLinks),
      ...socialLinks,
    };
  }

  if (request.body.skills !== undefined) {
    user.skills = normalizeStringArray(request.body.skills);
  }

  if (request.body.interests !== undefined) {
    user.interests = normalizeStringArray(request.body.interests);
  }

  // Prevent updating other users' profiles
  if (request.body.id && String(request.body.id) !== String(request.user.id)) {
    throw new ApiError(403, 'Cannot update another user\'s profile.');
  }

  user.roleDetails = buildRoleDetailsUpdate(request.user.role || user.role, request.body, user.roleDetails || {});

  await user.save();

  // Return sanitized user
  const sanitized = await User.findById(user._id).select('-passwordHash -__v -email');

  response.json({
    success: true,
    user: sanitized,
  });
});

const getProfile = asyncHandler(async (request, response) => {
  const user = await User.findById(request.params.id).select('-passwordHash -__v -email');

  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  response.json({
    success: true,
    user,
  });
});

module.exports = {
  updateProfile,
  getProfile,
};