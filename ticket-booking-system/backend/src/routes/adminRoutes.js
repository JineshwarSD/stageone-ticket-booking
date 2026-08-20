const express = require('express');

const router = express.Router();

const {
  authenticate,
} = require('../middleware/auth');

const {
  dashboardStats,
  analytics,
  getPendingOrganizers,
  approveOrganizer,
  rejectOrganizer,
} = require('../controllers/adminController');


// ============================================================
// ADMIN DASHBOARD
// ============================================================

router.get(
  '/dashboard/stats',
  authenticate,
  dashboardStats
);


// ============================================================
// ADMIN ANALYTICS
// ============================================================

router.get(
  '/analytics',
  authenticate,
  analytics
);


// ============================================================
// PENDING ORGANIZERS
// ============================================================

router.get(
  '/organizers/pending',
  authenticate,
  getPendingOrganizers
);


// ============================================================
// APPROVE ORGANIZER
// ============================================================

router.patch(
  '/organizers/:id/approve',
  authenticate,
  approveOrganizer
);


// ============================================================
// REJECT ORGANIZER
// ============================================================

router.patch(
  '/organizers/:id/reject',
  authenticate,
  rejectOrganizer
);


module.exports = router;