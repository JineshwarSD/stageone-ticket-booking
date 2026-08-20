const router = require('express').Router();
const { createVenue, listVenues, getVenue } = require('../controllers/venueController');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/', authenticate, authorize('ADMIN'), createVenue);
router.get('/', authenticate, listVenues);
router.get('/:id', authenticate, getVenue);

module.exports = router;
