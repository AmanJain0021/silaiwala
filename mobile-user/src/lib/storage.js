/*
 * localStorage replacement. Values are hydrated into memory before the first
 * render (see hydrateStorage in app/_layout), so reads are synchronous like the
 * web. Writes go to memory immediately and persist asynchronously.
 * Auth tokens live in SecureStore; everything else in AsyncStorage.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

const SECURE_KEYS = new Set(['token']);
const PREFIX = 'sz:';
const mem = new Map();
let hydrated = false;

export async function hydrateStorage() {
  if (hydrated) return;
  try {
    const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith(PREFIX));
    const pairs = await AsyncStorage.multiGet(keys);
    pairs.forEach(([k, v]) => { if (v != null) mem.set(k.slice(PREFIX.length), v); });
  } catch (_) { /* start empty */ }
  for (const k of SECURE_KEYS) {
    try {
      const v = await SecureStore.getItemAsync(k);
      if (v != null) mem.set(k, v);
    } catch (_) { /* unavailable */ }
  }
  hydrated = true;
}

const storage = {
  getItem(key) {
    return mem.has(key) ? mem.get(key) : null;
  },
  setItem(key, value) {
    const v = String(value);
    mem.set(key, v);
    if (SECURE_KEYS.has(key)) SecureStore.setItemAsync(key, v).catch(() => {});
    else AsyncStorage.setItem(PREFIX + key, v).catch(() => {});
  },
  removeItem(key) {
    mem.delete(key);
    if (SECURE_KEYS.has(key)) SecureStore.deleteItemAsync(key).catch(() => {});
    else AsyncStorage.removeItem(PREFIX + key).catch(() => {});
  },
  clearSession() {
    // sessionStorage equivalent: keys written with the "session:" prefix
    for (const k of [...mem.keys()]) if (k.startsWith('session:')) storage.removeItem(k);
  },
};

// zustand `persist` storage adapter
export const zustandStorage = {
  getItem: (name) => storage.getItem(name),
  setItem: (name, value) => storage.setItem(name, value),
  removeItem: (name) => storage.removeItem(name),
};

// sessionStorage-like API (cleared on logout, persisted per web semantics only within a run)
const sessionMem = new Map();
export const sessionStore = {
  getItem: (k) => (sessionMem.has(k) ? sessionMem.get(k) : null),
  setItem: (k, v) => sessionMem.set(k, String(v)),
  removeItem: (k) => sessionMem.delete(k),
  clear: () => sessionMem.clear(),
};

export default storage;
