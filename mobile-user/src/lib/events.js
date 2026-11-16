// Tiny event bus (replaces window.dispatchEvent / CustomEvent used by the web).
const listeners = new Map();
const events = {
  on(name, fn) {
    if (!listeners.has(name)) listeners.set(name, new Set());
    listeners.get(name).add(fn);
    return () => listeners.get(name)?.delete(fn);
  },
  emit(name, payload) {
    listeners.get(name)?.forEach((fn) => {
      try { fn(payload); } catch (_) { /* listener error */ }
    });
  },
};
export default events;
