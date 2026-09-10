const express = require('express');
const authenticate = require('../middleware/authMiddleware');
const validateProfileUpdate = require('../middleware/profileValidator');
const { getProfile, getCurrentProfile, updateProfile } = require('../controllers/profileController');

const router = express.Router();

router.get('/', authenticate, getCurrentProfile);
router.get('/:id', authenticate, getProfile);
router.put('/', authenticate, validateProfileUpdate, updateProfile);
router.patch('/', authenticate, validateProfileUpdate, updateProfile);

module.exports = router;