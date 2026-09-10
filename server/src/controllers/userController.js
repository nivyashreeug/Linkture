const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const investmentDomains = ['FinTech', 'SaaS', 'HealthTech', 'EdTech', 'Climate', 'AI'];

const marketTrendData = [
  { month: 'Jan', FinTech: 28, SaaS: 34, HealthTech: 21, EdTech: 18, Climate: 12, AI: 31 },
  { month: 'Feb', FinTech: 31, SaaS: 37, HealthTech: 24, EdTech: 22, Climate: 15, AI: 35 },
  { month: 'Mar', FinTech: 35, SaaS: 41, HealthTech: 29, EdTech: 25, Climate: 18, AI: 39 },
  { month: 'Apr', FinTech: 39, SaaS: 45, HealthTech: 33, EdTech: 28, Climate: 22, AI: 43 },
  { month: 'May', FinTech: 42, SaaS: 49, HealthTech: 36, EdTech: 31, Climate: 25, AI: 47 },
  { month: 'Jun', FinTech: 46, SaaS: 53, HealthTech: 39, EdTech: 34, Climate: 29, AI: 52 },
];

const portfolioCompanies = [
  { name: 'LedgerFlow', domain: 'FinTech', stage: 'Seed', valuation: '$18M', allocation: 24 },
  { name: 'StackRoute', domain: 'SaaS', stage: 'Series A', valuation: '$42M', allocation: 18 },
  { name: 'PulseGrid', domain: 'HealthTech', stage: 'Pre-Seed', valuation: '$9M', allocation: 15 },
  { name: 'BrightLearn', domain: 'EdTech', stage: 'Seed', valuation: '$12M', allocation: 13 },
  { name: 'TerraLoop', domain: 'Climate', stage: 'MVP', valuation: '$7M', allocation: 11 },
  { name: 'NexusAI', domain: 'AI', stage: 'Series A', valuation: '$34M', allocation: 19 },
];

const getProfile = asyncHandler(async (request, response) => {
  const user = await User.findById(request.user.id).select('-passwordHash -__v');

  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  response.json({
    success: true,
    user,
  });
});

const getVcDashboard = asyncHandler(async (request, response) => {
  const user = await User.findById(request.user.id);

  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  if (user.role !== 'VC') {
    throw new ApiError(403, 'Only VC users can access this dashboard payload.');
  }

  const selectedDomains = user.vcProfile?.domainInterests?.length ? user.vcProfile.domainInterests : ['FinTech', 'SaaS'];

  // Fetch real registered startups from MongoDB
  const startups = await User.find({ role: 'Startup', isActive: true })
    .select('-passwordHash -__v -email')
    .sort({ createdAt: -1 })
    .lean();

  const startupFeed = startups.map((startup) => {
    const domain =
      startup.startupProfile?.industry ||
      startup.roleDetails?.startup?.domain ||
      (Array.isArray(startup.interests) && startup.interests[0]) ||
      'General';

    const isDomainMatch = selectedDomains.some(
      (sd) => sd && sd.toLowerCase() === domain.toLowerCase()
    );

    let matchScore = isDomainMatch ? 88 : 70;
    if (startup.startupProfile?.pitchDeckUrl) matchScore += 5;
    if (startup.isVerified) matchScore += 4;
    if (startup.bio) matchScore += 3;
    matchScore = Math.min(99, Math.max(50, matchScore));

    const traction = startup.startupProfile?.teamSize
      ? `${startup.startupProfile.teamSize} team member${startup.startupProfile.teamSize > 1 ? 's' : ''}`
      : startup.isVerified
        ? 'Verified startup'
        : 'Active profile';

    return {
      id: startup._id.toString(),
      _id: startup._id.toString(),
      name:
        startup.startupProfile?.companyName ||
        startup.roleDetails?.startup?.startupName ||
        startup.fullName,
      domain,
      stage:
        startup.startupProfile?.startupStage ||
        startup.roleDetails?.startup?.fundingStage ||
        'Seed',
      location: startup.location || 'Not specified',
      traction,
      summary: startup.bio || 'No company bio provided yet.',
      matchScore,
      pitchDeckUrl: startup.startupProfile?.pitchDeckUrl || '',
      websiteUrl: startup.startupProfile?.websiteUrl || '',
      foundingYear: startup.startupProfile?.foundingYear,
      teamSize: startup.startupProfile?.teamSize,
      skills: startup.skills || [],
      interests: startup.interests || [],
      isVerified: startup.isVerified || false,
      createdAt: startup.createdAt,
    };
  });

  const filteredPortfolio = portfolioCompanies.filter((company) => selectedDomains.includes(company.domain));
  const sourcePortfolio = filteredPortfolio.length ? filteredPortfolio : portfolioCompanies;

  const portfolioDistribution = investmentDomains
    .map((domain) => ({
      name: domain,
      value: sourcePortfolio
        .filter((company) => company.domain === domain)
        .reduce((sum, company) => sum + company.allocation, 0),
    }))
    .filter((entry) => entry.value > 0);

  const marketTrends = marketTrendData.map((point) => {
    const series = { month: point.month };

    selectedDomains.forEach((domain) => {
      series[domain] = point[domain];
    });

    return series;
  });

  response.json({
    success: true,
    data: {
      selectedDomains,
      marketTrends,
      portfolioDistribution,
      startupFeed,
      portfolioCompanies,
      investmentDomains,
    },
  });
});

const Connection = require('../models/Connection');

const getStartups = asyncHandler(async (request, response) => {
  const { q, industry, domain, stage, fundingStage, location } = request.query;
  const page = Math.max(1, parseInt(request.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(request.query.limit, 10) || 10));

  const mongoQuery = { role: 'Startup', isActive: true };
  const andConditions = [];

  const targetDomain = industry || domain;
  if (targetDomain && String(targetDomain).trim()) {
    const domainRegex = new RegExp(`^${String(targetDomain).trim()}$`, 'i');
    andConditions.push({
      $or: [
        { 'startupProfile.industry': domainRegex },
        { 'roleDetails.startup.domain': domainRegex },
        { interests: domainRegex },
      ],
    });
  }

  const targetStage = stage || fundingStage;
  if (targetStage && String(targetStage).trim()) {
    const stageRegex = new RegExp(`^${String(targetStage).trim()}$`, 'i');
    andConditions.push({
      $or: [
        { 'startupProfile.startupStage': stageRegex },
        { 'roleDetails.startup.fundingStage': stageRegex },
      ],
    });
  }

  if (location && String(location).trim()) {
    andConditions.push({
      location: new RegExp(String(location).trim(), 'i'),
    });
  }

  if (q && String(q).trim()) {
    const searchRegex = new RegExp(String(q).trim(), 'i');
    andConditions.push({
      $or: [
        { fullName: searchRegex },
        { 'startupProfile.companyName': searchRegex },
        { 'roleDetails.startup.startupName': searchRegex },
        { 'startupProfile.industry': searchRegex },
        { 'roleDetails.startup.domain': searchRegex },
        { bio: searchRegex },
        { location: searchRegex },
        { skills: searchRegex },
        { interests: searchRegex },
      ],
    });
  }

  if (andConditions.length > 0) {
    mongoQuery.$and = andConditions;
  }

  const total = await User.countDocuments(mongoQuery);
  const startups = await User.find(mongoQuery)
    .select('-passwordHash -__v -email')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  let connectionMap = new Map();
  if (request.user?.id) {
    const userConnections = await Connection.find({
      $or: [{ requester: request.user.id }, { recipient: request.user.id }],
    }).select('requester recipient status');

    userConnections.forEach((conn) => {
      const isRequester = String(conn.requester) === String(request.user.id);
      const otherId = isRequester ? String(conn.recipient) : String(conn.requester);
      let status = conn.status;
      if (conn.status === 'pending') {
        status = isRequester ? 'pending_sent' : 'pending_received';
      }
      connectionMap.set(otherId, { status, connectionId: conn._id });
    });
  }

  const formattedStartups = startups.map((s) => {
    const conn = connectionMap.get(s._id.toString()) || { status: 'none', connectionId: null };
    return {
      id: s._id.toString(),
      _id: s._id.toString(),
      name: s.startupProfile?.companyName || s.roleDetails?.startup?.startupName || s.fullName,
      domain: s.startupProfile?.industry || s.roleDetails?.startup?.domain || (Array.isArray(s.interests) && s.interests[0]) || 'General',
      stage: s.startupProfile?.startupStage || s.roleDetails?.startup?.fundingStage || 'Seed',
      location: s.location || 'Not specified',
      summary: s.bio || 'No company bio provided yet.',
      tagline: s.startupProfile?.tagline || '',
      problem: s.startupProfile?.problem || '',
      solution: s.startupProfile?.solution || '',
      businessModel: s.startupProfile?.businessModel || '',
      fundingTarget: s.startupProfile?.fundingTarget,
      pitchDeck: s.startupProfile?.pitchDeck,
      pitchDeckUrl: s.startupProfile?.pitchDeckUrl || '',
      websiteUrl: s.startupProfile?.websiteUrl || '',
      teamSize: s.startupProfile?.teamSize,
      foundingYear: s.startupProfile?.foundingYear,
      skills: s.skills || [],
      interests: s.interests || [],
      isVerified: s.isVerified || false,
      connectionStatus: conn.status,
      connectionId: conn.connectionId,
      createdAt: s.createdAt,
    };
  });

  response.json({
    success: true,
    count: formattedStartups.length,
    data: {
      startups: formattedStartups,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    },
  });
});

const getInvestors = asyncHandler(async (request, response) => {
  const { q, domain, stage, investmentStage, location } = request.query;
  const page = Math.max(1, parseInt(request.query.page, 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(request.query.limit, 10) || 10));

  const mongoQuery = { role: 'VC', isActive: true };
  const andConditions = [];

  const targetDomain = domain;
  if (targetDomain && String(targetDomain).trim()) {
    const domainRegex = new RegExp(`^${String(targetDomain).trim()}$`, 'i');
    andConditions.push({
      $or: [
        { 'vcProfile.domainInterests': domainRegex },
        { 'roleDetails.vc.investmentFocus': domainRegex },
        { interests: domainRegex },
      ],
    });
  }

  const targetStage = stage || investmentStage;
  if (targetStage && String(targetStage).trim()) {
    const stageRegex = new RegExp(`^${String(targetStage).trim()}$`, 'i');
    andConditions.push({
      'vcProfile.investmentStage': stageRegex,
    });
  }

  if (location && String(location).trim()) {
    andConditions.push({
      location: new RegExp(String(location).trim(), 'i'),
    });
  }

  if (q && String(q).trim()) {
    const searchRegex = new RegExp(String(q).trim(), 'i');
    andConditions.push({
      $or: [
        { fullName: searchRegex },
        { 'roleDetails.vc.firmName': searchRegex },
        { 'vcProfile.domainInterests': searchRegex },
        { 'roleDetails.vc.investmentFocus': searchRegex },
        { bio: searchRegex },
        { location: searchRegex },
        { skills: searchRegex },
        { interests: searchRegex },
      ],
    });
  }

  if (andConditions.length > 0) {
    mongoQuery.$and = andConditions;
  }

  const total = await User.countDocuments(mongoQuery);
  const investors = await User.find(mongoQuery)
    .select('-passwordHash -__v -email')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  let connectionMap = new Map();
  if (request.user?.id) {
    const userConnections = await Connection.find({
      $or: [{ requester: request.user.id }, { recipient: request.user.id }],
    }).select('requester recipient status');

    userConnections.forEach((conn) => {
      const isRequester = String(conn.requester) === String(request.user.id);
      const otherId = isRequester ? String(conn.recipient) : String(conn.requester);
      let status = conn.status;
      if (conn.status === 'pending') {
        status = isRequester ? 'pending_sent' : 'pending_received';
      }
      connectionMap.set(otherId, { status, connectionId: conn._id });
    });
  }

  const formattedInvestors = investors.map((inv) => {
    const conn = connectionMap.get(inv._id.toString()) || { status: 'none', connectionId: null };
    return {
      id: inv._id.toString(),
      _id: inv._id.toString(),
      name: inv.roleDetails?.vc?.firmName || inv.fullName,
      firmName: inv.roleDetails?.vc?.firmName || 'Independent Investor',
      fullName: inv.fullName,
      domains: inv.vcProfile?.domainInterests || inv.roleDetails?.vc?.investmentFocus || inv.interests || [],
      investmentStage: inv.vcProfile?.investmentStage || [],
      location: inv.location || 'Not specified',
      bio: inv.bio || 'No investor bio provided yet.',
      ticketSizeMin: inv.vcProfile?.ticketSizeMin,
      ticketSizeMax: inv.vcProfile?.ticketSizeMax,
      preferredRegions: inv.vcProfile?.preferredRegions || [],
      portfolioCount: inv.vcProfile?.portfolioCount || 0,
      skills: inv.skills || [],
      interests: inv.interests || [],
      isVerified: inv.isVerified || false,
      connectionStatus: conn.status,
      connectionId: conn.connectionId,
      createdAt: inv.createdAt,
    };
  });

  response.json({
    success: true,
    count: formattedInvestors.length,
    data: {
      investors: formattedInvestors,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    },
  });
});

module.exports = {
  getProfile,
  getVcDashboard,
  getStartups,
  getInvestors,
};

