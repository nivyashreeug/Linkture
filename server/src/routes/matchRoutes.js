const express = require('express');
const authenticate = require('../middleware/authMiddleware');
const { getMatches } = require('../controllers/matchController');

const router = express.Router();

router.get('/', authenticate, getMatches);

module.exports = router;