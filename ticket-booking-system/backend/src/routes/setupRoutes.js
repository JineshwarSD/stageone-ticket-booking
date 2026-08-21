const express = require('express');

const router = express.Router();

const {
  createAdmin,
} = require('../controllers/setupController');

router.get('/create-admin', createAdmin);

module.exports = router;