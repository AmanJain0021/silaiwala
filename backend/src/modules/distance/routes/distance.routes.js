const express = require('express');
const { calculateDistance, geocode, forwardGeocode } = require('../controllers/distance.controller');

const router = express.Router();

router.post('/calculate', calculateDistance);
router.get('/geocode', geocode);
router.get('/forward-geocode', forwardGeocode);

module.exports = router;
