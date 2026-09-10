const mongoose = require('mongoose');
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
        startupName: incomingDetails.startupName ?? body.startupName ?? body.companyName ?? currentDetails.startupName ?? '',
        domain: incomingDetails.domain ?? body.domain ?? body.industry ?? currentDetails.domain ?? '',
        fundingStage: incomingDetails.fundingStage ?? body.fundingStage ?? body.startupStage ?? currentDetails.fundingStage ?? '',
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

  // Prevent updating other users' profiles
  if (request.body.id && String(request.body.id) !== String(request.user.id)) {
    throw new ApiError(403, 'Cannot update another user\'s profile.');
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

  const role = request.user.role || user.role;
  user.roleDetails = buildRoleDetailsUpdate(role, request.body, user.roleDetails || {});

  // Update role-specific profile objects directly
  if (role === 'Startup') {
    const sp = request.body.startupProfile || {};
    const existingSp = user.startupProfile?.toObject ? user.startupProfile.toObject() : (user.startupProfile || {});
    
    user.startupProfile = {
      ...existingSp,
      companyName: sp.companyName ?? request.body.companyName ?? request.body.startupName ?? existingSp.companyName,
      tagline: sp.tagline ?? request.body.tagline ?? existingSp.tagline,
      startupStage: sp.startupStage ?? request.body.startupStage ?? request.body.fundingStage ?? existingSp.startupStage,
      pitchDeckUrl: sp.pitchDeckUrl ?? request.body.pitchDeckUrl ?? existingSp.pitchDeckUrl,
      websiteUrl: sp.websiteUrl ?? request.body.websiteUrl ?? existingSp.websiteUrl,
      industry: sp.industry ?? request.body.industry ?? request.body.domain ?? existingSp.industry,
      problem: sp.problem ?? request.body.problem ?? existingSp.problem,
      solution: sp.solution ?? request.body.solution ?? existingSp.solution,
      businessModel: sp.businessModel ?? request.body.businessModel ?? existingSp.businessModel,
      fundingTarget: sp.fundingTarget !== undefined ? sp.fundingTarget : (request.body.fundingTarget !== undefined ? request.body.fundingTarget : existingSp.fundingTarget),
      foundingYear: sp.foundingYear !== undefined ? sp.foundingYear : (request.body.foundingYear !== undefined ? request.body.foundingYear : existingSp.foundingYear),
      teamSize: sp.teamSize !== undefined ? sp.teamSize : (request.body.teamSize !== undefined ? request.body.teamSize : existingSp.teamSize),
      pitchDeck: existingSp.pitchDeck,
    };
  } else if (role === 'VC') {
    const vp = request.body.vcProfile || {};
    const existingVp = user.vcProfile?.toObject ? user.vcProfile.toObject() : (user.vcProfile || {});
    
    const domainInterests = vp.domainInterests ?? request.body.domainInterests;
    const investmentStage = vp.investmentStage ?? request.body.investmentStage;
    const preferredRegions = vp.preferredRegions ?? request.body.preferredRegions;
    const investmentFocus = vp.investmentFocus ?? request.body.investmentFocus;

    user.vcProfile = {
      ...existingVp,
      firmName: vp.firmName ?? request.body.firmName ?? existingVp.firmName,
      domainInterests: domainInterests !== undefined ? normalizeStringArray(domainInterests) : existingVp.domainInterests,
      investmentFocus: investmentFocus !== undefined ? normalizeStringArray(investmentFocus) : existingVp.investmentFocus,
      investmentStage: investmentStage !== undefined ? normalizeStringArray(investmentStage) : (existingVp.investmentStage || []),
      ticketSizeMin: vp.ticketSizeMin !== undefined ? vp.ticketSizeMin : (request.body.ticketSizeMin !== undefined ? request.body.ticketSizeMin : existingVp.ticketSizeMin),
      ticketSizeMax: vp.ticketSizeMax !== undefined ? vp.ticketSizeMax : (request.body.ticketSizeMax !== undefined ? request.body.ticketSizeMax : existingVp.ticketSizeMax),
      preferredRegions: preferredRegions !== undefined ? normalizeStringArray(preferredRegions) : (existingVp.preferredRegions || []),
      portfolioCount: vp.portfolioCount !== undefined ? vp.portfolioCount : (request.body.portfolioCount !== undefined ? request.body.portfolioCount : existingVp.portfolioCount),
    };
  } else if (role === 'Student') {
    const stp = request.body.studentProfile || {};
    const existingStp = user.studentProfile?.toObject ? user.studentProfile.toObject() : (user.studentProfile || {});

    const studentSkills = stp.skills ?? request.body.skills;
    const projectLinks = stp.projectLinks ?? request.body.projectLinks;
    const completedLessons = stp.completedLessons ?? request.body.completedLessons;
    const savedLessons = stp.savedLessons ?? request.body.savedLessons;

    user.studentProfile = {
      ...existingStp,
      institutionName: stp.institutionName ?? request.body.institutionName ?? request.body.education ?? existingStp.institutionName,
      program: stp.program ?? request.body.program ?? existingStp.program,
      graduationYear: stp.graduationYear !== undefined ? stp.graduationYear : (request.body.graduationYear !== undefined ? request.body.graduationYear : existingStp.graduationYear),
      incubatorName: stp.incubatorName ?? request.body.incubatorName ?? existingStp.incubatorName,
      skills: studentSkills !== undefined ? normalizeStringArray(studentSkills) : (existingStp.skills || []),
      projectLinks: projectLinks !== undefined ? normalizeStringArray(projectLinks) : (existingStp.projectLinks || []),
      completedLessons: completedLessons !== undefined ? [...new Set(completedLessons.map(Number).filter(n => !isNaN(n)))] : (existingStp.completedLessons || []),
      savedLessons: savedLessons !== undefined ? [...new Set(savedLessons.map(Number).filter(n => !isNaN(n)))] : (existingStp.savedLessons || []),
    };
  }

  await user.save();

  // Return sanitized user
  const sanitized = await User.findById(user._id).select('-passwordHash -__v -email');

  response.json({
    success: true,
    user: sanitized,
  });
});

const getProfile = asyncHandler(async (request, response) => {
  const targetId = request.params.id || request.user?.id;

  if (!targetId || !mongoose.Types.ObjectId.isValid(targetId)) {
    throw new ApiError(400, 'Invalid user ID format.');
  }

  const user = await User.findById(targetId).select('-passwordHash -__v -email');

  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  response.json({
    success: true,
    user,
  });
});

const getCurrentProfile = asyncHandler(async (request, response) => {
  const user = await User.findById(request.user.id).select('-passwordHash -__v');

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
  getCurrentProfile,
};