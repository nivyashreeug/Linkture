const bcrypt = require('bcryptjs');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { signToken } = require('../services/jwtService');

const buildRoleProfile = (role, body) => {
  if (role === 'VC') {
    return {
      vcProfile: {
        domainInterests: body.domainInterests || [],
        investmentStage: body.investmentStage || [],
        ticketSizeMin: body.ticketSizeMin,
        ticketSizeMax: body.ticketSizeMax,
        preferredRegions: body.preferredRegions || [],
        portfolioCount: body.portfolioCount,
      },
    };
  }

  if (role === 'Startup') {
    return {
      startupProfile: {
        companyName: body.companyName,
        startupStage: body.startupStage,
        pitchDeckUrl: body.pitchDeckUrl,
        websiteUrl: body.websiteUrl,
        industry: body.industry,
        foundingYear: body.foundingYear,
        teamSize: body.teamSize,
      },
    };
  }

  return {
    studentProfile: {
      institutionName: body.institutionName,
      program: body.program,
      graduationYear: body.graduationYear,
      incubatorName: body.incubatorName,
      skills: body.skills || [],
      projectLinks: body.projectLinks || [],
    },
  };
};

const sanitizeUser = (user) => user.toJSON();

const register = asyncHandler(async (request, response) => {
  const { fullName, email, password, role, avatarUrl, bio, phone, location, socialLinks = {} } = request.body;

  if (!fullName || !email || !password || !role) {
    throw new ApiError(400, 'fullName, email, password, and role are required.');
  }

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new ApiError(409, 'A user with this email already exists.');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const profileFields = buildRoleProfile(role, request.body);

  const user = await User.create({
    fullName,
    email,
    passwordHash,
    role,
    avatarUrl,
    bio,
    phone,
    location,
    socialLinks,
    ...profileFields,
  });

  const token = signToken({ id: user._id.toString(), role: user.role, email: user.email });

  response.status(201).json({
    success: true,
    token,
    user: sanitizeUser(user),
  });
});

const login = asyncHandler(async (request, response) => {
  const { email, password, role } = request.body;

  if (!email || !password || !role) {
    throw new ApiError(400, 'email, password, and role are required.');
  }

  const user = await User.findOne({ email }).select('+passwordHash');

  if (!user) {
    throw new ApiError(401, 'Invalid credentials.');
  }

  if (user.role !== role) {
    throw new ApiError(403, 'This account is not registered as that role.');
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);

  if (!passwordMatches) {
    throw new ApiError(401, 'Invalid credentials.');
  }

  user.lastLoginAt = new Date();
  await user.save();

  const token = signToken({ id: user._id.toString(), role: user.role, email: user.email });

  response.json({
    success: true,
    token,
    user: sanitizeUser(user),
  });
});

const me = asyncHandler(async (request, response) => {
  const user = await User.findById(request.user.id);

  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  response.json({
    success: true,
    user: sanitizeUser(user),
  });
});

module.exports = {
  register,
  login,
  me,
};
