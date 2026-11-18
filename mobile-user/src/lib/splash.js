// Keeps the native splash for at least 1 second from app start and until the first route has settled,
// so no blank frame shows between the splash and the first screen. A safety timer always releases it.
import { useEffect } from 'react';
import { usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';

const MIN_SPLASH_MS = 1000;
const ROUTE_SETTLE_MS = 300;
const MAX_WAIT_MS = 4000;
const jsStartedAt = Date.now();
let hidden = false;

const elapsedSinceStart = () => {
  try {
    const start = performance.rnStartupTiming?.startTime;
    if (start > 0) return performance.now() - start;
  } catch (_) { /* fall back to JS start */ }
  return Date.now() - jsStartedAt;
};

const hideSplash = () => {
  if (hidden) return;
  hidden = true;
  SplashScreen.hide();
};

SplashScreen.setOptions({ duration: 200, fade: true });

export function SplashGate() {
  const pathname = usePathname();
  useEffect(() => {
    const timer = setTimeout(hideSplash, MAX_WAIT_MS);
    return () => clearTimeout(timer);
  }, []);
  useEffect(() => {
    const remaining = Math.min(MIN_SPLASH_MS, Math.max(0, MIN_SPLASH_MS - elapsedSinceStart()));
    const timer = setTimeout(hideSplash, Math.max(remaining, ROUTE_SETTLE_MS));
    return () => clearTimeout(timer);
  }, [pathname]);
  return null;
}
