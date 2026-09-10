const express = require('express');
const authenticate = require('../middleware/authMiddleware');
const authorizeRoles = require('../middleware/roleMiddleware');
const {
  handlePitchDeckUpload,
  uploadPitchDeck,
  getPitchDeck,
  deletePitchDeck,
  downloadPitchDeck,
} = require('../controllers/pitchDeckController');

const router = express.Router();

router.post('/', authenticate, authorizeRoles('Startup'), handlePitchDeckUpload, uploadPitchDeck);
router.get('/', authenticate, getPitchDeck);
router.delete('/', authenticate, authorizeRoles('Startup'), deletePitchDeck);
router.get('/download/:fileName', authenticate, downloadPitchDeck);

module.exports = router;
