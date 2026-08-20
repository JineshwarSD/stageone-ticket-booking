const router = require('express').Router();
const { createEvent, listEvents, getEvent, eventSummary } = require('../controllers/eventController');
const { authenticate, authorize } = require('../middleware/auth');

router.post('/', authenticate, authorize('ORGANISER', 'ADMIN'), createEvent);
router.get('/', authenticate, listEvents);
router.get('/:id', authenticate, getEvent);
router.get('/:id/summary', authenticate, authorize('ORGANISER', 'ADMIN'), eventSummary);

module.exports = router;
