const express = require('express');
const { getProfile, getVcDashboard } = require('../controllers/userController');
const authenticate = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

const router = express.Router();

router.get('/profile', authenticate, getProfile);
router.get('/vc/dashboard', authenticate, authorizeRoles('VC'), getVcDashboard);

module.exports = router;
