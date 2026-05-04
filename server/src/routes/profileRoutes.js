const express = require('express');
const authenticate = require('../middleware/authMiddleware');
const validateProfileUpdate = require('../middleware/profileValidator');
const { getProfile, updateProfile } = require('../controllers/profileController');

const router = express.Router();

router.get('/:id', authenticate, getProfile);
router.put('/', authenticate, validateProfileUpdate, updateProfile);

module.exports = router;