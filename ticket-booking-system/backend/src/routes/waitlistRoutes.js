const router = require('express').Router();
const {
  joinWaitlist,
  myWaitlist,
  leaveWaitlist,
  getOffer,
  completeOffer,
} = require('../controllers/waitlistController');
const { authenticate } = require('../middleware/auth');

router.post('/:eventId/join', authenticate, joinWaitlist);
router.get('/', authenticate, myWaitlist);
router.post('/:id/leave', authenticate, leaveWaitlist);
router.get('/offer/:token', authenticate, getOffer);
router.post('/offer/:token/complete', authenticate, completeOffer);

module.exports = router;
