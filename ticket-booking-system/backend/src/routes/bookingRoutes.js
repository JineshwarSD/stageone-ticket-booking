const router = require('express').Router();

const {
  createBooking,
  myBookings,
  dashboard,
  cancelBooking,
} = require('../controllers/bookingController');

const { authenticate } = require('../middleware/auth');

// Create booking
router.post(
  '/:eventId',
  authenticate,
  createBooking
);

// Customer dashboard
router.get(
  '/dashboard',
  authenticate,
  dashboard
);

// My bookings
router.get(
  '/',
  authenticate,
  myBookings
);

// Cancel booking
router.post(
  '/:id/cancel',
  authenticate,
  cancelBooking
);

module.exports = router;