const express = require('express');

const router = express.Router();

const {
  getPendingOrganizers,
  approveOrganizer,
  rejectOrganizer,
} = require('../controllers/adminOrganizerController');


// ============================================================
// GET ALL PENDING ORGANIZERS
// ============================================================

router.get(
  '/pending',
  getPendingOrganizers
);


// ============================================================
// APPROVE ORGANIZER
// ============================================================

router.patch(
  '/:id/approve',
  approveOrganizer
);


// ============================================================
// REJECT ORGANIZER
// ============================================================

router.patch(
  '/:id/reject',
  rejectOrganizer
);


module.exports = router;