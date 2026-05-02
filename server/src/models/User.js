const mongoose = require('mongoose');

const socialLinksSchema = new mongoose.Schema(
  {
    linkedin: { type: String, trim: true },
    twitter: { type: String, trim: true },
    website: { type: String, trim: true },
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
    vcProfile: {
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
      startupStage: {
        type: String,
        enum: ['Idea', 'MVP', 'Pre-Seed', 'Seed', 'Series A', 'Series B+'],
      },
      pitchDeckUrl: {
        type: String,
        trim: true,
        validate: {
          validator: function (value) {
            return this.role !== 'Startup' || Boolean(value);
          },
          message: 'Startup users must provide a pitch deck URL.',
        },
      },
      websiteUrl: {
        type: String,
        trim: true,
      },
      industry: {
        type: String,
        trim: true,
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

userSchema.index({ email: 1 }, { unique: true });

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
