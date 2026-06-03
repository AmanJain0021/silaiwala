const express = require('express');
const { calculateDistance } = require('../controllers/distance.controller');

const router = express.Router();

router.post('/calculate', calculateDistance);

module.exports = router;
