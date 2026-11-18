// Google Directions (REST) — native replacement for google.maps.DirectionsService (DRIVING).
import { GOOGLE_MAPS_API_KEY } from './config';

export function decodePolyline(str) {
  let index = 0, lat = 0, lng = 0;
  const coords = [];
  while (index < str.length) {
    let b, shift = 0, result = 0;
    do { b = str.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;
    shift = 0; result = 0;
    do { b = str.charCodeAt(index++) - 63; result |= (b & 0x1f) << shift; shift += 5; } while (b >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;
    coords.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return coords;
}

const fmt = (p) => (typeof p === 'string' ? encodeURIComponent(p) : `${p.lat},${p.lng}`);

/** origin/destination: {lat,lng} or address string. Returns null when no route. */
export async function getDirections(origin, destination) {
  if (!origin || !destination || !GOOGLE_MAPS_API_KEY) return null;
  try {
    const res = await fetch(`https://maps.googleapis.com/maps/api/directions/json?origin=${fmt(origin)}&destination=${fmt(destination)}&mode=driving&key=${GOOGLE_MAPS_API_KEY}`);
    const json = await res.json();
    const route = json.status === 'OK' ? json.routes?.[0] : null;
    const leg = route?.legs?.[0];
    if (!leg) return null;
    return {
      coords: decodePolyline(route.overview_polyline.points),
      distance: leg.distance.text,
      duration: leg.duration.text,
      distanceValue: leg.distance.value,
      durationValue: leg.duration.value,
      endLocation: { lat: leg.end_location.lat, lng: leg.end_location.lng },
      bounds: route.bounds,
    };
  } catch (_) {
    return null;
  }
}
