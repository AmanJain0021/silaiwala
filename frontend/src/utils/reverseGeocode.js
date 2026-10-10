/**
 * Reverse geocoding utility with multi-tier fallback:
 * 1. Google Maps Geocoder (if loaded and active)
 * 2. Backend /distance/geocode endpoint (if backend is running)
 * 3. OpenStreetMap Nominatim API (free, highly accurate worldwide)
 * 4. BigDataCloud reverse geocode client API (fast fallback)
 * 5. Coordinate-based fallback so user is never blocked
 */

export async function reverseGeocode(lat, lng) {
    if (!lat || !lng) {
        return {
            formattedAddress: '',
            area: '',
            city: '',
            state: '',
            pincode: ''
        };
    }

    const numLat = parseFloat(lat);
    const numLng = parseFloat(lng);

    // Tier 1: Try Google Maps Geocoder if available
    if (typeof window !== 'undefined' && window.google?.maps?.Geocoder) {
        try {
            const geocoder = new window.google.maps.Geocoder();
            const response = await new Promise((resolve, reject) => {
                geocoder.geocode({ location: { lat: numLat, lng: numLng } }, (results, status) => {
                    if (status === 'OK' && results && results.length > 0) {
                        resolve(results);
                    } else {
                        reject(new Error(`Google Geocoder status: ${status}`));
                    }
                });
            });

            if (response && response[0]) {
                const result = response[0];
                let city = '', state = '', pincode = '', locality = '', sublocality = '', route = '';

                result.address_components?.forEach(comp => {
                    if (comp.types.includes('locality')) city = comp.long_name;
                    if (comp.types.includes('administrative_area_level_1')) state = comp.long_name;
                    if (comp.types.includes('postal_code')) pincode = comp.long_name;
                    if (comp.types.includes('sublocality_level_1') || comp.types.includes('sublocality')) sublocality = comp.long_name;
                    if (comp.types.includes('route')) route = comp.long_name;
                    if (comp.types.includes('neighborhood')) locality = comp.long_name;
                });

                const area = sublocality || locality || route || (result.formatted_address ? result.formatted_address.split(',')[0] : '');

                return {
                    formattedAddress: result.formatted_address,
                    area: area || 'Current Location',
                    city,
                    state,
                    pincode,
                    source: 'google'
                };
            }
        } catch (err) {
            console.warn('[reverseGeocode] Google Geocoder failed or denied, trying fallbacks...', err.message);
        }
    }

    // Tier 2: Try Backend API (/api/v1/distance/geocode)
    try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);

        const res = await fetch(`${apiUrl}/distance/geocode?lat=${numLat}&lng=${numLng}`, {
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.ok) {
            const json = await res.json();
            if (json.success && json.data && json.data.address && json.data.address !== 'Development Mode Location') {
                return {
                    formattedAddress: json.data.address,
                    area: json.data.street || json.data.city || json.data.address.split(',')[0],
                    city: json.data.city || '',
                    state: json.data.state || '',
                    pincode: json.data.pincode || '',
                    source: 'backend'
                };
            }
        }
    } catch (err) {
        // Backend not running or timeout, continue to direct public APIs
    }

    // Tier 3: OpenStreetMap Nominatim
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${numLat}&lon=${numLng}`, {
            headers: { 'Accept-Language': 'en' },
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.ok) {
            const data = await res.json();
            if (data && data.display_name) {
                const addr = data.address || {};
                const area = addr.suburb || addr.neighbourhood || addr.village || addr.road || addr.county || data.display_name.split(',')[0];
                const city = addr.city || addr.town || addr.county || addr.state_district || '';
                const state = addr.state || '';
                const pincode = addr.postcode || '';

                return {
                    formattedAddress: data.display_name,
                    area: area.trim(),
                    city: city.trim(),
                    state: state.trim(),
                    pincode: pincode.trim(),
                    source: 'nominatim'
                };
            }
        }
    } catch (err) {
        console.warn('[reverseGeocode] Nominatim failed, trying BigDataCloud...', err.message);
    }

    // Tier 4: BigDataCloud free client reverse geocode
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${numLat}&longitude=${numLng}&localityLanguage=en`, {
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.ok) {
            const data = await res.json();
            if (data) {
                const area = data.locality || data.city || 'Nearby Area';
                const city = data.city || data.locality || '';
                const state = data.principalSubdivision || '';
                const pincode = data.postcode || '';
                const parts = [data.locality, data.city, data.principalSubdivision, data.postcode, data.countryName].filter(Boolean);
                const formattedAddress = parts.length > 0 ? parts.join(', ') : `Location (${numLat.toFixed(4)}, ${numLng.toFixed(4)})`;

                return {
                    formattedAddress,
                    area,
                    city,
                    state,
                    pincode,
                    source: 'bigdatacloud'
                };
            }
        }
    } catch (err) {
        console.warn('[reverseGeocode] BigDataCloud failed...', err.message);
    }

    // Tier 5: Safe coordinate fallback (ensures user is never blocked)
    const fallbackCoord = `${numLat.toFixed(4)}, ${numLng.toFixed(4)}`;
    return {
        formattedAddress: `Pinned Location (${fallbackCoord})`,
        area: 'Pinned Location',
        city: '',
        state: '',
        pincode: '',
        source: 'coordinates'
    };
}
