const Joi = require('joi');
const ApiError = require('../utils/ApiError');

const roleKey = (role) => {
  if (role === 'VC') return 'vc';
  if (role === 'Startup') return 'startup';
  return 'student';
};

const profileUpdateSchema = (userRole) => {
  const rk = roleKey(userRole);

  const base = Joi.object({
    fullName: Joi.string().trim().min(2).max(100).optional(),
    bio: Joi.string().trim().max(600).optional().allow(null, ''),
    avatarUrl: Joi.string().uri().optional().allow('', null),
    phone: Joi.string().trim().optional().allow('', null),
    location: Joi.string().trim().optional().allow('', null),
    socialLinks: Joi.object().optional(),
    skills: Joi.array().items(Joi.string().trim()).optional(),
    interests: Joi.array().items(Joi.string().trim()).optional(),
    roleDetails: Joi.object().optional(),
  });

  // require roleDetails for the user's role to be present and non-empty when provided
  const roleDetailsRequirement = Joi.object({
    [rk]: Joi.object().min(1).required(),
  });

  return base.concat(roleDetailsRequirement).unknown(true);
};

const validateProfileUpdate = (req, res, next) => {
  try {
    const schema = profileUpdateSchema(req.user.role || req.body.role);
    const { error } = schema.validate(req.body, { abortEarly: false, allowUnknown: true });

    if (error) {
      return next(new ApiError(400, 'Validation error', error.details.map((d) => d.message)));
    }

    return next();
  } catch (err) {
    return next(err);
  }
};

module.exports = validateProfileUpdate;
