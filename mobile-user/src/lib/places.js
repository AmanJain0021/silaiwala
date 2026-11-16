// Google Places (REST) — native replacement for the web's google.maps.places.Autocomplete widget.
import { GOOGLE_MAPS_API_KEY } from './config';

let session = null;
const newSession = () => `${Date.now()}${Math.random().toString(36).slice(2)}`;

export async function placesAutocomplete(input, { country = 'in' } = {}) {
  if (!input || input.trim().length < 2 || !GOOGLE_MAPS_API_KEY) return [];
  if (!session) session = newSession();
  const url = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(input)}&components=country:${country}&sessiontoken=${session}&key=${GOOGLE_MAPS_API_KEY}`;
  const res = await fetch(url);
  const json = await res.json();
  if (json.status !== 'OK') return [];
  return json.predictions.map((p) => ({
    placeId: p.place_id,
    description: p.description,
    main: p.structured_formatting?.main_text || p.description,
    secondary: p.structured_formatting?.secondary_text || '',
  }));
}

/** Returns { lat, lng, formatted_address, name, address_components } like the web Place object. */
export async function placeDetails(placeId) {
  const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=geometry,formatted_address,name,address_components&sessiontoken=${session || ''}&key=${GOOGLE_MAPS_API_KEY}`;
  session = null;
  const res = await fetch(url);
  const json = await res.json();
  if (json.status !== 'OK') throw new Error('Could not fetch place details');
  const r = json.result;
  return { lat: r.geometry.location.lat, lng: r.geometry.location.lng, formatted_address: r.formatted_address, name: r.name, address_components: r.address_components || [] };
}

/** Forward geocode an address string (web: google.maps.Geocoder().geocode({ address })). */
export async function geocodeAddress(address) {
  if (!address || !GOOGLE_MAPS_API_KEY) return null;
  try {
    const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${GOOGLE_MAPS_API_KEY}`);
    const json = await res.json();
    const loc = json.status === 'OK' ? json.results?.[0]?.geometry?.location : null;
    return loc ? { lat: loc.lat, lng: loc.lng } : null;
  } catch (_) {
    return null;
  }
}
