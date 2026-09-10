const express = require('express');
const authenticate = require('../middleware/authMiddleware');
const {
  sendRequest,
  getConnections,
  updateStatus,
  getConnectionStatus,
} = require('../controllers/connectionController');

const router = express.Router();

router.post('/request', authenticate, sendRequest);
router.get('/', authenticate, getConnections);
router.patch('/:id', authenticate, updateStatus);
router.get('/status/:targetUserId', authenticate, getConnectionStatus);

module.exports = router;
