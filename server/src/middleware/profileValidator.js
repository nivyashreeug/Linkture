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

const profileUpdateSchema = Joi.object({
  id: Joi.string().optional(),
  fullName: Joi.string().trim().min(2).max(100).optional(),
  bio: Joi.string().trim().max(600).optional().allow(null, ''),
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
  // Flat role detail helpers accepted by buildRoleDetailsUpdate
  firmName: Joi.string().trim().optional().allow('', null),
  investmentFocus: stringOrArray.optional(),
  startupName: Joi.string().trim().optional().allow('', null),
  domain: Joi.string().trim().optional().allow('', null),
  fundingStage: Joi.string().trim().optional().allow('', null),
  education: Joi.string().trim().optional().allow('', null),
  projects: stringOrArray.optional(),
  vcProfile: Joi.object().optional(),
  startupProfile: Joi.object().optional(),
  studentProfile: Joi.object().optional(),
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

