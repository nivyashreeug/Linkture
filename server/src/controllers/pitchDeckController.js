const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const multer = require('multer');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const UPLOADS_DIR = path.resolve(__dirname, '../../uploads/pitch-decks');

// Ensure upload directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext || '.pdf'}`;
    cb(null, safeName);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = file.mimetype;

  if (ext === '.pdf' && (mime === 'application/pdf' || mime === 'application/x-pdf')) {
    cb(null, true);
  } else {
    cb(new ApiError(400, 'Invalid file type. Only PDF documents are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
}).single('pitchDeck');

// Middleware wrapper for multer to catch limits/errors nicely
const handlePitchDeckUpload = (req, res, next) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new ApiError(400, 'File too large. Pitch deck must be under 10MB.'));
      }
      return next(new ApiError(400, `Upload error: ${err.message}`));
    }
    if (err) {
      return next(err);
    }
    next();
  });
};

const uploadPitchDeck = asyncHandler(async (req, res) => {
  if (req.user.role !== 'Startup') {
    throw new ApiError(403, 'Only Startup accounts can upload pitch decks.');
  }

  if (!req.file) {
    throw new ApiError(400, 'Please select a PDF pitch deck file to upload.');
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  // Safely delete previous uploaded pitch deck file if it existed
  if (user.startupProfile?.pitchDeck?.fileName) {
    const oldFileName = path.basename(user.startupProfile.pitchDeck.fileName);
    const oldPath = path.join(UPLOADS_DIR, oldFileName);
    if (fs.existsSync(oldPath)) {
      try {
        fs.unlinkSync(oldPath);
      } catch (err) {
        // Continue even if unlink fails
      }
    }
  }

  const relativeUrl = `/uploads/pitch-decks/${req.file.filename}`;

  const pitchDeckData = {
    originalName: req.file.originalname,
    fileName: req.file.filename,
    filePath: relativeUrl,
    fileSize: req.file.size,
    mimeType: req.file.mimetype,
    uploadedAt: new Date(),
  };

  if (!user.startupProfile) {
    user.startupProfile = {};
  }

  user.startupProfile.pitchDeck = pitchDeckData;
  user.startupProfile.pitchDeckUrl = relativeUrl;

  await user.save();

  const sanitized = await User.findById(user._id).select('-passwordHash -__v -email');

  res.status(200).json({
    success: true,
    message: 'Pitch deck uploaded successfully.',
    pitchDeck: pitchDeckData,
    pitchDeckUrl: relativeUrl,
    user: sanitized,
  });
});

const mongoose = require('mongoose');

const getPitchDeck = asyncHandler(async (req, res) => {
  const targetId = req.query.userId || req.user.id;

  if (!targetId || !mongoose.Types.ObjectId.isValid(targetId)) {
    throw new ApiError(400, 'Invalid user ID.');
  }

  const user = await User.findById(targetId);

  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  if (user.role !== 'Startup') {
    throw new ApiError(400, 'Target user is not a Startup.');
  }

  const pitchDeck = user.startupProfile?.pitchDeck?.fileName ? user.startupProfile.pitchDeck : null;
  const pitchDeckUrl = user.startupProfile?.pitchDeckUrl || '';
  const hasPitchDeck = Boolean(pitchDeck?.fileName || (pitchDeckUrl && pitchDeckUrl.trim().length > 0));

  res.json({
    success: true,
    hasPitchDeck,
    pitchDeck,
    pitchDeckUrl,
  });
});

const deletePitchDeck = asyncHandler(async (req, res) => {
  if (req.user.role !== 'Startup') {
    throw new ApiError(403, 'Only Startup accounts can delete their pitch deck.');
  }

  const user = await User.findById(req.user.id);
  if (!user) {
    throw new ApiError(404, 'User not found.');
  }

  // Delete physical file safely
  if (user.startupProfile?.pitchDeck?.fileName) {
    const fileName = path.basename(user.startupProfile.pitchDeck.fileName);
    const filePath = path.resolve(UPLOADS_DIR, fileName);
    if (filePath.startsWith(UPLOADS_DIR) && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        // continue
      }
    }
  }

  if (user.startupProfile) {
    user.startupProfile.pitchDeck = undefined;
    user.startupProfile.pitchDeckUrl = '';
  }

  user.markModified('startupProfile');
  await user.save();

  const sanitized = await User.findById(user._id).select('-passwordHash -__v -email');

  res.json({
    success: true,
    message: 'Pitch deck deleted successfully.',
    user: sanitized,
  });
});

const downloadPitchDeck = asyncHandler(async (req, res) => {
  const { fileName } = req.params;

  if (!fileName || typeof fileName !== 'string') {
    throw new ApiError(400, 'Filename parameter is required.');
  }

  const safeName = path.basename(fileName);

  // Validate filename structure and extension
  if (!safeName.toLowerCase().endsWith('.pdf') || !/^[a-zA-Z0-9_\-.]+$/.test(safeName)) {
    throw new ApiError(400, 'Invalid pitch deck filename.');
  }

  const filePath = path.resolve(UPLOADS_DIR, safeName);

  // Strict path containment check
  if (!filePath.startsWith(UPLOADS_DIR)) {
    throw new ApiError(403, 'Access denied: Invalid file path.');
  }

  if (!fs.existsSync(filePath)) {
    throw new ApiError(404, 'Pitch deck file not found.');
  }

  res.download(filePath, safeName);
});

module.exports = {
  handlePitchDeckUpload,
  uploadPitchDeck,
  getPitchDeck,
  deletePitchDeck,
  downloadPitchDeck,
};
