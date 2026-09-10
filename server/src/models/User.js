const mongoose = require('mongoose');

const socialLinksSchema = new mongoose.Schema(
  {
    linkedin: { type: String, trim: true },
    twitter: { type: String, trim: true },
    website: { type: String, trim: true },
  },
  { _id: false }
);

const studentRoleDetailsSchema = new mongoose.Schema(
  {
    education: {
      type: String,
      trim: true,
    },
    projects: {
      type: [String],
      default: [],
    },
  },
  { _id: false }
);

const startupRoleDetailsSchema = new mongoose.Schema(
  {
    startupName: {
      type: String,
      trim: true,
    },
    domain: {
      type: String,
      trim: true,
    },
    fundingStage: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const vcRoleDetailsSchema = new mongoose.Schema(
  {
    firmName: {
      type: String,
      trim: true,
    },
    investmentFocus: {
      type: [String],
      default: [],
    },
  },
  { _id: false }
);

const roleDetailsSchema = new mongoose.Schema(
  {
    student: {
      type: studentRoleDetailsSchema,
      default: () => ({}),
    },
    startup: {
      type: startupRoleDetailsSchema,
      default: () => ({}),
    },
    vc: {
      type: vcRoleDetailsSchema,
      default: () => ({}),
    },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: ['VC', 'Startup', 'Student'],
      required: true,
      index: true,
    },
    avatarUrl: {
      type: String,
      trim: true,
    },
    bio: {
      type: String,
      trim: true,
      maxlength: 600,
    },
    phone: {
      type: String,
      trim: true,
    },
    location: {
      type: String,
      trim: true,
    },
    socialLinks: {
      type: socialLinksSchema,
      default: () => ({}),
    },
    skills: {
      type: [String],
      default: [],
    },
    interests: {
      type: [String],
      default: [],
    },
    roleDetails: {
      type: roleDetailsSchema,
      default: () => ({}),
    },
    vcProfile: {
      firmName: {
        type: String,
        trim: true,
      },
      domainInterests: {
        type: [String],
        default: undefined,
        validate: {
          validator: function (values) {
            return this.role !== 'VC' || (Array.isArray(values) && values.length > 0);
          },
          message: 'VC users must provide at least one domain interest.',
        },
      },
      investmentFocus: {
        type: [String],
        default: [],
      },
      investmentStage: {
        type: [String],
        default: [],
      },
      ticketSizeMin: {
        type: Number,
        min: 0,
      },
      ticketSizeMax: {
        type: Number,
        min: 0,
      },
      preferredRegions: {
        type: [String],
        default: [],
      },
      portfolioCount: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
    startupProfile: {
      companyName: {
        type: String,
        trim: true,
      },
      tagline: {
        type: String,
        trim: true,
      },
      startupStage: {
        type: String,
        enum: ['Idea', 'MVP', 'Pre-Seed', 'Seed', 'Series A', 'Series B+'],
      },
      pitchDeckUrl: {
        type: String,
        trim: true,
        validate: {
          validator: function (value) {
            return this.role !== 'Startup' || !this.isNew || Boolean(value) || Boolean(this.startupProfile?.pitchDeck?.filePath);
          },
          message: 'Startup users must provide a pitch deck URL.',
        },
      },
      pitchDeck: {
        originalName: { type: String, trim: true },
        fileName: { type: String, trim: true },
        filePath: { type: String, trim: true },
        fileSize: { type: Number },
        mimeType: { type: String },
        uploadedAt: { type: Date },
      },
      websiteUrl: {
        type: String,
        trim: true,
      },
      industry: {
        type: String,
        trim: true,
      },
      problem: {
        type: String,
        trim: true,
      },
      solution: {
        type: String,
        trim: true,
      },
      businessModel: {
        type: String,
        trim: true,
      },
      fundingTarget: {
        type: Number,
        min: 0,
      },
      foundingYear: {
        type: Number,
        min: 1900,
        max: new Date().getFullYear(),
      },
      teamSize: {
        type: Number,
        min: 1,
      },
    },
    studentProfile: {
      institutionName: {
        type: String,
        trim: true,
      },
      program: {
        type: String,
        trim: true,
      },
      graduationYear: {
        type: Number,
        min: 1900,
        max: new Date().getFullYear() + 10,
      },
      incubatorName: {
        type: String,
        trim: true,
      },
      skills: {
        type: [String],
        default: [],
      },
      projectLinks: {
        type: [String],
        default: [],
      },
      completedLessons: {
        type: [Number],
        default: [],
      },
      savedLessons: {
        type: [Number],
        default: [],
      },
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastLoginAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Multikey indexes for arrays used in matching. These speed up queries like { role: X, skills: { $in: [...] } }
userSchema.index({ skills: 1 });
userSchema.index({ interests: 1 });
// Compound indexes combining role with array fields are helpful for role-scoped matches.
userSchema.index({ role: 1, skills: 1 });
userSchema.index({ role: 1, interests: 1 });

userSchema.set('toJSON', {
  transform: function (document, returnedObject) {
    returnedObject.id = returnedObject._id;
    delete returnedObject._id;
    delete returnedObject.passwordHash;
    delete returnedObject.__v;
    return returnedObject;
  },
});

module.exports = mongoose.model('User', userSchema);
