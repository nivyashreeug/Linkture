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

const startupFeed = [
  {
    name: 'LedgerFlow',
    domain: 'FinTech',
    stage: 'Seed',
    location: 'Bangalore, India',
    traction: '23% MoM transaction growth',
    summary: 'Embedded payments infrastructure for mid-market SaaS platforms.',
    matchScore: 98,
  },
  {
    name: 'StackRoute',
    domain: 'SaaS',
    stage: 'Series A',
    location: 'San Francisco, USA',
    traction: '4,200 active teams',
    summary: 'Workflow automation for revenue operations teams.',
    matchScore: 94,
  },
  {
    name: 'PulseGrid',
    domain: 'HealthTech',
    stage: 'Pre-Seed',
    location: 'London, UK',
    traction: '3 hospital pilots secured',
    summary: 'Remote care orchestration for chronic disease monitoring.',
    matchScore: 91,
  },
  {
    name: 'BrightLearn',
    domain: 'EdTech',
    stage: 'Seed',
    location: 'Delhi, India',
    traction: '110 schools onboarded',
    summary: 'AI-guided student performance analytics for hybrid classrooms.',
    matchScore: 88,
  },
  {
    name: 'TerraLoop',
    domain: 'Climate',
    stage: 'MVP',
    location: 'Berlin, Germany',
    traction: 'Pilot contracts with 2 utilities',
    summary: 'Carbon tracking and operational efficiency software for SMEs.',
    matchScore: 86,
  },
  {
    name: 'NexusAI',
    domain: 'AI',
    stage: 'Series A',
    location: 'New York, USA',
    traction: '38 enterprise logos',
    summary: 'Model orchestration platform for regulated industries.',
    matchScore: 96,
  },
];

const getProfile = asyncHandler(async (request, response) => {
  const user = await User.findById(request.user.id);

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
