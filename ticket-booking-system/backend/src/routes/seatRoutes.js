const router = require('express').Router();
const { getSeatMap, holdSeats, releaseSeats } = require('../controllers/seatController');
const { authenticate } = require('../middleware/auth');

router.get('/:eventId/seatmap', authenticate, getSeatMap);
router.post('/:eventId/hold', authenticate, holdSeats);
router.post('/:eventId/release', authenticate, releaseSeats);

module.exports = router;
