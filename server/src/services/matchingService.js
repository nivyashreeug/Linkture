const User = require('../models/User');
const Connection = require('../models/Connection');

const MATCH_RULES = {
  Student: ['Startup'],
  Startup: ['Student', 'VC'],
  VC: ['Startup'],
};

const normalizeStringArray = (value) => {
  if (!value) {
    return [];
  }

  const list = Array.isArray(value) ? value : [value];

  return [...new Set(list.map((item) => String(item).trim().toLowerCase()).filter(Boolean))];
};

const getComplementaryRoles = (role) => MATCH_RULES[role] || [];

const calculateOverlap = (sourceValues, targetValues) => {
  const targetSet = new Set(targetValues);
  return sourceValues.filter((value) => targetSet.has(value));
};

const buildMatchScore = (currentUser, candidate) => {
  const currentSkills = normalizeStringArray(currentUser.skills);
  const currentInterests = normalizeStringArray(currentUser.interests);
  const candidateSkills = normalizeStringArray(candidate.skills);
  const candidateInterests = normalizeStringArray(candidate.interests);

  const sharedSkills = calculateOverlap(currentSkills, candidateSkills);
  const sharedInterests = calculateOverlap(currentInterests, candidateInterests);

  const skillWeight = 4;
  const interestWeight = 2;

  const score = sharedSkills.length * skillWeight + sharedInterests.length * interestWeight;

  return {
    score,
    sharedSkills,
    sharedInterests,
  };
};

const getMatchesForUser = async (currentUser) => {
  const allowedRoles = getComplementaryRoles(currentUser.role);

  if (!allowedRoles.length) {
    return [];
  }

  // Find active and pending connection user IDs to exclude from recommendation feed
  const activeConnections = await Connection.find({
    $or: [{ requester: currentUser._id }, { recipient: currentUser._id }],
    status: { $in: ['accepted', 'pending'] },
  }).select('requester recipient');

  const excludedIds = [currentUser._id];
  activeConnections.forEach((conn) => {
    if (String(conn.requester) === String(currentUser._id)) {
      excludedIds.push(conn.recipient);
    } else {
      excludedIds.push(conn.requester);
    }
  });

  // fetch complementary role candidates excluding current user & existing connections
  const candidates = await User.find({
    _id: { $nin: excludedIds },
    role: { $in: allowedRoles },
    isActive: true,
  }).select('-passwordHash -__v -email');

  const scoredMatches = candidates
    .map((candidate) => {
      const { score: baseScore, sharedSkills, sharedInterests } = buildMatchScore(currentUser, candidate);

      // role-based bonus: prefer specific complementary pairs
      let roleBonus = 0;
      if (currentUser.role === 'Student' && candidate.role === 'Startup') roleBonus = 6;
      else if (currentUser.role === 'Startup' && candidate.role === 'Student') roleBonus = 6;
      else if (currentUser.role === 'Startup' && candidate.role === 'VC') roleBonus = 5;
      else if (currentUser.role === 'VC' && candidate.role === 'Startup') roleBonus = 5;

      const totalScore = baseScore + roleBonus;

      return {
        user: candidate,
        matchScore: totalScore,
        baseScore,
        sharedSkills,
        sharedInterests,
        roleBonus,
      };
    })
    .filter((match) => match.matchScore > 0)
    .sort((left, right) => right.matchScore - left.matchScore)
    .slice(0, 10);

  return scoredMatches;
};

module.exports = {
  getMatchesForUser,
};