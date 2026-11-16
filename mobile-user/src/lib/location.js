// Native replacement for navigator.geolocation (foreground only; permission asked on first use).
import * as Location from 'expo-location';

export class LocationError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code; // 'denied' | 'unavailable' | 'timeout'
  }
}

export async function getCurrentPosition({ timeout = 8000, highAccuracy = true } = {}) {
  let { status } = await Location.getForegroundPermissionsAsync();
  if (status !== 'granted') ({ status } = await Location.requestForegroundPermissionsAsync());
  if (status !== 'granted') throw new LocationError('denied', 'Location permission denied or unavailable.');
  const enabled = await Location.hasServicesEnabledAsync().catch(() => true);
  if (!enabled) throw new LocationError('unavailable', 'Location services are turned off.');
  const pos = await Promise.race([
    Location.getCurrentPositionAsync({ accuracy: highAccuracy ? Location.Accuracy.High : Location.Accuracy.Balanced }),
    new Promise((_, rej) => setTimeout(() => rej(new LocationError('timeout', 'Location request timed out.')), timeout)),
  ]).catch(async (e) => {
    if (e instanceof LocationError && e.code === 'timeout') {
      const last = await Location.getLastKnownPositionAsync().catch(() => null);
      if (last) return last;
    }
    throw e;
  });
  return { coords: { latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy } };
}

export function watchPosition(onPos, onErr, { distanceInterval = 10 } = {}) {
  let sub = null;
  let cancelled = false;
  (async () => {
    try {
      let { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') ({ status } = await Location.requestForegroundPermissionsAsync());
      if (status !== 'granted') throw new LocationError('denied', 'Location permission denied.');
      sub = await Location.watchPositionAsync({ accuracy: Location.Accuracy.High, distanceInterval, timeInterval: 5000 }, (p) => {
        onPos({ coords: { latitude: p.coords.latitude, longitude: p.coords.longitude, accuracy: p.coords.accuracy, heading: p.coords.heading, speed: p.coords.speed } });
      });
      if (cancelled) sub.remove();
    } catch (e) {
      onErr?.(e);
    }
  })();
  return () => { cancelled = true; sub?.remove(); };
}
