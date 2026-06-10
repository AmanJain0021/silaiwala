const express = require('express');
const { calculateDistance, geocode } = require('../controllers/distance.controller');

const router = express.Router();

router.post('/calculate', calculateDistance);
router.get('/geocode', geocode);

module.exports = router;
