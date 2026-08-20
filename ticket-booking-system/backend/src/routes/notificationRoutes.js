const router = require('express').Router();

const {
  getNotifications,
  markAsRead,
  markAllAsRead,
} = require('../controllers/notificationController');

const {
  authenticate,
} = require('../middleware/auth');

router.get(
  '/',
  authenticate,
  getNotifications
);

router.patch(
  '/:id/read',
  authenticate,
  markAsRead
);

router.patch(
  '/read-all',
  authenticate,
  markAllAsRead
);

module.exports = router;