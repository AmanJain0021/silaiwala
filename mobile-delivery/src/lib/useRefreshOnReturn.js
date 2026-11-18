// Tabs stay mounted for instant switching, but the web re-fetches whenever a page is opened.
// Returns a key that changes when the screen regains focus after being away for a while, so the
// page re-mounts and reloads its data; quick tab switches stay instant.
import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';

export default function useRefreshOnReturn(afterMs = 15000) {
  const [key, setKey] = useState(0);
  const leftAt = useRef(0);
  useFocusEffect(useCallback(() => {
    if (leftAt.current && Date.now() - leftAt.current > afterMs) setKey((k) => k + 1);
    return () => { leftAt.current = Date.now(); };
  }, [afterMs]));
  return key;
}
