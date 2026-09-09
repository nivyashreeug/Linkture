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

module.exports = {
  getProfile,
  getVcDashboard,
};

