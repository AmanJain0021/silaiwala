const asyncHandler = require("../../../utils/asyncHandler");
const ErrorResponse = require("../../../utils/errorResponse");
const axios = require("axios");

// Haversine formula fallback
const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
    return R * c; // Distance in km
};

/**
 * @desc    Calculate distance between two coordinates
 * @route   POST /api/v1/distance/calculate
 * @access  Public
 */
exports.calculateDistance = asyncHandler(async (req, res, next) => {
    const { origin, destination } = req.body;

    if (!origin || !destination || origin.length !== 2 || destination.length !== 2) {
        return next(new ErrorResponse("Please provide valid origin [lat, lng] and destination [lat, lng]", 400));
    }

    const [origLat, origLng] = origin;
    const [destLat, destLng] = destination;

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    // Default to haversine if no key
    if (!apiKey || apiKey === 'your_google_maps_api_key' || apiKey === 'your_backend_google_maps_api_key_here') {
        const straightDistance = calculateHaversineDistance(origLat, origLng, destLat, destLng);
        return res.status(200).json({
            success: true,
            data: {
                distance: straightDistance,
                method: 'haversine (fallback)'
            }
        });
    }

    try {
        const response = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
            params: {
                origins: `${origLat},${origLng}`,
                destinations: `${destLat},${destLng}`,
                key: apiKey
            }
        });

        const data = response.data;
        if (data.status === 'OK' && data.rows[0].elements[0].status === 'OK') {
            // distance in meters
            const distanceMeters = data.rows[0].elements[0].distance.value;
            const distanceKm = distanceMeters / 1000;
            return res.status(200).json({
                success: true,
                data: {
                    distance: distanceKm,
                    method: 'google_routes_api'
                }
            });
        } else {
            // Google Maps API returned a non-OK status for the element (e.g. ZERO_RESULTS, MAX_ROUTE_LENGTH_EXCEEDED)
            throw new Error('Google Maps API returned a non-OK status');
        }
    } catch (error) {
        console.error("Distance Matrix API Failed:", error.message);
        // Fallback to Haversine
        const straightDistance = calculateHaversineDistance(origLat, origLng, destLat, destLng);
        return res.status(200).json({
            success: true,
            data: {
                distance: straightDistance,
                method: 'haversine (fallback after api fail)'
            }
        });
    }
});

/**
 * @desc    Reverse geocode coordinates to get address details
 * @route   GET /api/v1/distance/geocode
 * @access  Public
 */
exports.geocode = asyncHandler(async (req, res, next) => {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
        return next(new ErrorResponse("Please provide valid lat and lng parameters", 400));
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    if (!apiKey || apiKey === 'your_google_maps_api_key' || apiKey === 'your_backend_google_maps_api_key_here') {
        return res.status(200).json({
            success: true,
            data: {
                address: "Development Mode Location",
                city: "LocalCity",
                state: "LocalState",
                pincode: "000000",
                street: "Local Street",
                raw: {}
            }
        });
    }

    try {
        const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
            params: {
                latlng: `${lat},${lng}`,
                key: apiKey
            }
        });

        const data = response.data;
        if (data.status === 'OK' && data.results.length > 0) {
            const result = data.results[0];
            const address = result.formatted_address;
            
            let city = "";
            let state = "";
            let pincode = "";
            let street = "";
            
            result.address_components.forEach(comp => {
                if (comp.types.includes('locality')) city = comp.long_name;
                if (comp.types.includes('administrative_area_level_1')) state = comp.long_name;
                if (comp.types.includes('postal_code')) pincode = comp.long_name;
                if (comp.types.includes('route')) street = comp.long_name;
            });

            return res.status(200).json({
                success: true,
                data: {
                    address,
                    city,
                    state,
                    pincode,
                    street,
                    raw: result
                }
            });
        } else {
            throw new Error(data.error_message || 'Google Maps Geocoding failed or returned no results');
        }
    } catch (error) {
        console.error("Geocoding API Failed:", error.message);
        return res.status(200).json({
            success: true,
            data: {
                address: "Unknown Location",
                city: "Unknown",
                state: "Unknown",
                pincode: "000000",
                street: "Unknown",
                raw: {}
            }
        });
    }
});
