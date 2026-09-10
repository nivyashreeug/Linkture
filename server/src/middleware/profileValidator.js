const Joi = require('joi');
const ApiError = require('../utils/ApiError');

const stringOrArray = Joi.alternatives().try(
  Joi.array().items(Joi.string().trim()),
  Joi.string().trim().allow('')
);

const socialLinksSchema = Joi.object({
  linkedin: Joi.string().trim().optional().allow('', null),
  twitter: Joi.string().trim().optional().allow('', null),
  website: Joi.string().trim().optional().allow('', null),
}).optional();

const vcDetailsSchema = Joi.object({
  firmName: Joi.string().trim().optional().allow('', null),
  investmentFocus: stringOrArray.optional(),
}).optional();

const startupDetailsSchema = Joi.object({
  startupName: Joi.string().trim().optional().allow('', null),
  domain: Joi.string().trim().optional().allow('', null),
  fundingStage: Joi.string().trim().optional().allow('', null),
}).optional();

const studentDetailsSchema = Joi.object({
  education: Joi.string().trim().optional().allow('', null),
  projects: stringOrArray.optional(),
}).optional();

const startupProfileSchema = Joi.object({
  companyName: Joi.string().trim().optional().allow('', null),
  tagline: Joi.string().trim().max(300).optional().allow('', null),
  startupStage: Joi.string().valid('Idea', 'MVP', 'Pre-Seed', 'Seed', 'Series A', 'Series B+').optional().allow('', null),
  pitchDeckUrl: Joi.string().optional().allow('', null),
  websiteUrl: Joi.string().uri().optional().allow('', null),
  industry: Joi.string().trim().optional().allow('', null),
  problem: Joi.string().trim().max(2000).optional().allow('', null),
  solution: Joi.string().trim().max(2000).optional().allow('', null),
  businessModel: Joi.string().trim().max(2000).optional().allow('', null),
  fundingTarget: Joi.number().min(0).optional().allow(null),
  foundingYear: Joi.number().integer().min(1900).max(new Date().getFullYear()).optional().allow(null),
  teamSize: Joi.number().integer().min(1).optional().allow(null),
}).optional();

const vcProfileSchema = Joi.object({
  firmName: Joi.string().trim().optional().allow('', null),
  domainInterests: stringOrArray.optional(),
  investmentFocus: stringOrArray.optional(),
  investmentStage: stringOrArray.optional(),
  ticketSizeMin: Joi.number().min(0).optional().allow(null),
  ticketSizeMax: Joi.number().min(0).optional().allow(null),
  preferredRegions: stringOrArray.optional(),
  portfolioCount: Joi.number().integer().min(0).optional().allow(null),
}).optional();

const studentProfileSchema = Joi.object({
  institutionName: Joi.string().trim().optional().allow('', null),
  program: Joi.string().trim().optional().allow('', null),
  graduationYear: Joi.number().integer().min(1900).max(new Date().getFullYear() + 10).optional().allow(null),
  incubatorName: Joi.string().trim().optional().allow('', null),
  skills: stringOrArray.optional(),
  projectLinks: stringOrArray.optional(),
  completedLessons: Joi.array().items(Joi.number().integer()).optional(),
  savedLessons: Joi.array().items(Joi.number().integer()).optional(),
}).optional();

const profileUpdateSchema = Joi.object({
  id: Joi.string().optional(),
  fullName: Joi.string().trim().min(2).max(100).optional(),
  bio: Joi.string().trim().max(1000).optional().allow(null, ''),
  avatarUrl: Joi.string().uri().optional().allow('', null),
  phone: Joi.string().trim().max(30).optional().allow('', null),
  location: Joi.string().trim().max(120).optional().allow('', null),
  socialLinks: socialLinksSchema,
  skills: stringOrArray.optional(),
  interests: stringOrArray.optional(),
  roleDetails: Joi.object({
    vc: vcDetailsSchema,
    startup: startupDetailsSchema,
    student: studentDetailsSchema,
  }).optional(),
  // Flat role detail helpers
  firmName: Joi.string().trim().optional().allow('', null),
  investmentFocus: stringOrArray.optional(),
  startupName: Joi.string().trim().optional().allow('', null),
  domain: Joi.string().trim().optional().allow('', null),
  fundingStage: Joi.string().trim().optional().allow('', null),
  education: Joi.string().trim().optional().allow('', null),
  projects: stringOrArray.optional(),
  // Nested profile schemas
  vcProfile: vcProfileSchema,
  startupProfile: startupProfileSchema,
  studentProfile: studentProfileSchema,
  // Direct flat field helpers for Startup
  companyName: Joi.string().trim().optional().allow('', null),
  tagline: Joi.string().trim().max(300).optional().allow('', null),
  startupStage: Joi.string().valid('Idea', 'MVP', 'Pre-Seed', 'Seed', 'Series A', 'Series B+').optional().allow('', null),
  pitchDeckUrl: Joi.string().optional().allow('', null),
  websiteUrl: Joi.string().uri().optional().allow('', null),
  industry: Joi.string().trim().optional().allow('', null),
  problem: Joi.string().trim().max(2000).optional().allow('', null),
  solution: Joi.string().trim().max(2000).optional().allow('', null),
  businessModel: Joi.string().trim().max(2000).optional().allow('', null),
  fundingTarget: Joi.number().min(0).optional().allow(null),
  foundingYear: Joi.number().integer().min(1900).max(new Date().getFullYear()).optional().allow(null),
  teamSize: Joi.number().integer().min(1).optional().allow(null),
  // Direct flat field helpers for VC
  domainInterests: stringOrArray.optional(),
  investmentStage: stringOrArray.optional(),
  ticketSizeMin: Joi.number().min(0).optional().allow(null),
  ticketSizeMax: Joi.number().min(0).optional().allow(null),
  preferredRegions: stringOrArray.optional(),
  portfolioCount: Joi.number().integer().min(0).optional().allow(null),
  // Direct flat field helpers for Student
  institutionName: Joi.string().trim().optional().allow('', null),
  program: Joi.string().trim().optional().allow('', null),
  graduationYear: Joi.number().integer().min(1900).max(new Date().getFullYear() + 10).optional().allow(null),
  incubatorName: Joi.string().trim().optional().allow('', null),
  projectLinks: stringOrArray.optional(),
  completedLessons: Joi.array().items(Joi.number().integer()).optional(),
  savedLessons: Joi.array().items(Joi.number().integer()).optional(),
  role: Joi.string().valid('VC', 'Startup', 'Student').optional(),
}).unknown(false);

const validateProfileUpdate = (req, res, next) => {
  try {
    const { error } = profileUpdateSchema.validate(req.body, { abortEarly: false });

    if (error) {
      return next(new ApiError(400, 'Validation error', error.details.map((d) => d.message)));
    }

    return next();
  } catch (err) {
    return next(err);
  }
};

module.exports = validateProfileUpdate;

