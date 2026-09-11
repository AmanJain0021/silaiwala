/**
 * Singleton Google Maps Configuration
 * Crucial: Keeps the exact same memory reference for 'libraries'
 * to avoid React-Google-Maps "@react-google-maps/api" Loader collision errors
 * and unwanted blank screens / re-renders.
 */
export const GOOGLE_MAPS_LIBRARIES = ['places', 'geometry', 'drawing'];
export const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
export const DEFAULT_MAP_CENTER = { lat: 28.6139, lng: 77.2090 }; // Delhi default
