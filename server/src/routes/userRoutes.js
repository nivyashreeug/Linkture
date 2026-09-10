const express = require('express');
const {
  getProfile,
  getVcDashboard,
  getStartups,
  getInvestors,
} = require('../controllers/userController');
const authenticate = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');

const router = express.Router();

router.get('/profile', authenticate, getProfile);
router.get('/vc/dashboard', authenticate, authorizeRoles('VC'), getVcDashboard);
router.get('/startups', authenticate, getStartups);
router.get('/investors', authenticate, getInvestors);

module.exports = router;

