const router = require('express').Router();

const {
  getAnalytics,
} = require('../controllers/analyticsController');

const {
  authenticate,
} = require('../middleware/auth');


// Admin and organiser analytics
router.get(
  '/',
  authenticate,
  getAnalytics
);


module.exports = router;