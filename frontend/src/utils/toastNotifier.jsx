import toast from 'react-hot-toast';
import React from 'react';

// In-memory map to track recently shown toast keys and timestamps
const recentlyShownToasts = new Map();

/**
 * Generate a clean, normalized key for a toast to prevent duplicate popups.
 * Unifies order notifications across Socket.io and FCM push notifications.
 */
export const getToastKey = (message, options = {}) => {
  let textContent = '';
  if (typeof message === 'string') {
    textContent = message;
  } else if (typeof message === 'number') {
    textContent = String(message);
  } else if (message && typeof message === 'object') {
    textContent = message.title || message.message || message.body || '';
  }

  const optionIdStr = options && options.id ? String(options.id) : '';

  // 1. Check if optionIdStr matches status toast pattern e.g. `toast-status-${orderId}-${status}`
  const statusIdMatch = optionIdStr.match(/toast-status-([a-z0-9_-]+)-([a-z0-9_-]+)/i);
  if (statusIdMatch) {
    const [, ordId, statusVal] = statusIdMatch;
    const cleanStatus = statusVal.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanOrd = ordId.toLowerCase().replace(/[^a-z0-9]/g, '');
    return `toast-status-${cleanOrd}-${cleanStatus}`;
  }

  // 2. Check for status update patterns in message or optionIdStr
  const lowerMsg = (textContent + ' ' + optionIdStr).toLowerCase();
  const isStatusMsg = lowerMsg.includes('status updated') || 
                      lowerMsg.includes('status changed') || 
                      lowerMsg.includes('order status') ||
                      lowerMsg.includes('status updated to');

  if (isStatusMsg) {
    // Extract order identifier if present
    const orderIdMatch = textContent.match(/ORD-?\d+/i) || 
                         textContent.match(/[a-f0-9]{24}/i) || 
                         optionIdStr.match(/ORD-?\d+/i) || 
                         optionIdStr.match(/[a-f0-9]{24}/i);

    // Extract status string
    const statusMatch = textContent.match(/(?:status\s+(?:updated|changed)(?:\s+to)?:?\s*)([a-z0-9_\-\s]+)/i);
    let statusVal = statusMatch ? statusMatch[1].trim().toLowerCase().replace(/[^a-z0-9]/g, '') : '';
    
    if (!statusVal) {
      const words = lowerMsg.split(/\s+/);
      statusVal = words[words.length - 1].replace(/[^a-z0-9]/g, '');
    }

    const cleanOrd = orderIdMatch ? orderIdMatch[0].toLowerCase().replace(/[^a-z0-9]/g, '') : '';

    if (cleanOrd && statusVal) {
      return `toast-status-${cleanOrd}-${statusVal}`;
    } else if (statusVal) {
      return `toast-status-${statusVal}`;
    }
  }

  // 3. Fallback to optionIdStr if provided
  if (optionIdStr) {
    return optionIdStr.toLowerCase().replace(/[^a-z0-9_-]/g, '');
  }

  // 4. Default fallback: clean string with orderId extraction
  const orderIdMatch = textContent.match(/ORD-?\d+/i) || textContent.match(/[a-f0-9]{24}/i);
  const orderIdKey = orderIdMatch ? orderIdMatch[0].toLowerCase() : '';

  const cleanStr = textContent
    .toLowerCase()
    .replace(/[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
    .replace(/[^a-z0-9]/g, '');

  if (orderIdKey) {
    let actionKey = 'update';
    if (cleanStr.includes('new') || cleanStr.includes('create') || cleanStr.includes('received')) actionKey = 'new';
    else if (cleanStr.includes('status') || cleanStr.includes('update') || cleanStr.includes('changed')) actionKey = 'status';
    return `order-${actionKey}-${orderIdKey}`;
  }

  return cleanStr || 'default-toast-key';
};

/**
 * Check if toast key should be suppressed (shown within last 4 seconds).
 */
export const shouldSuppressToast = (toastKey, windowMs = 4000) => {
  const now = Date.now();

  const isKeyActive = (key) => {
    if (key && recentlyShownToasts.has(key)) {
      const lastShown = recentlyShownToasts.get(key);
      if (now - lastShown < windowMs) {
        return true;
      }
    }
    return false;
  };

  // Build secondary fallback key for status toasts (e.g. "toast-status-ord1002-cutting" -> "toast-status-cutting")
  let secondaryKey = null;
  if (typeof toastKey === 'string' && toastKey.startsWith('toast-status-')) {
    const parts = toastKey.split('-');
    const statusPart = parts[parts.length - 1];
    if (statusPart && parts.length > 3) {
      secondaryKey = `toast-status-${statusPart}`;
    }
  }

  if (isKeyActive(toastKey) || (secondaryKey && isKeyActive(secondaryKey))) {
    return true; // Suppress duplicate!
  }

  recentlyShownToasts.set(toastKey, now);
  if (secondaryKey) {
    recentlyShownToasts.set(secondaryKey, now);
  }

  setTimeout(() => {
    recentlyShownToasts.delete(toastKey);
    if (secondaryKey) recentlyShownToasts.delete(secondaryKey);
  }, windowMs * 2);

  return false;
};

// Patch react-hot-toast methods globally once on app load
if (toast && !toast.__dedupePatched) {
  toast.__dedupePatched = true;

  const originalSuccess = toast.success?.bind(toast);
  const originalError = toast.error?.bind(toast);
  const originalCustom = toast.custom?.bind(toast);
  const originalLoading = toast.loading?.bind(toast);

  const wrapToastFn = (origFn) => {
    if (!origFn) return () => {};
    return (message, options = {}) => {
      const key = getToastKey(message, options);
      if (shouldSuppressToast(key)) {
        return key;
      }
      return origFn(message, { id: key, ...options });
    };
  };

  toast.success = wrapToastFn(originalSuccess);
  toast.error = wrapToastFn(originalError);
  toast.custom = wrapToastFn(originalCustom);
  toast.loading = (message, options = {}) => {
    const key = getToastKey(message, options);
    return originalLoading ? originalLoading(message, { id: key, ...options }) : key;
  };
}

/**
 * Show a unified, deduplicated toast notification across Customer, Tailor, and Delivery panels.
 * Ensures only ONE toast is rendered from the top (top-center) with consistent styling.
 */
export const showDeduplicatedToast = ({
  id,
  title = 'SewZella Notification',
  message = '',
  type = 'info', // 'success', 'info', 'order', 'status'
  icon
}) => {
  if (!message && !title) return;

  const key = getToastKey(id || `${title} ${message}`, { id });
  if (shouldSuppressToast(key)) {
    return key;
  }

  const displayIcon = icon || (
    type === 'success' ? '✅' :
    type === 'order' ? '🎉' :
    type === 'status' ? '📦' : '🔔'
  );

  return toast.custom(
    (t) => (
      <div
        className={`${
          t.visible ? 'animate-enter' : 'animate-leave'
        } max-w-sm w-full bg-slate-900 text-white shadow-2xl rounded-2xl p-3.5 flex items-center gap-3 border border-primary/30 backdrop-blur-md pointer-events-auto cursor-pointer`}
        onClick={() => toast.dismiss(t.id)}
      >
        <div className="w-9 h-9 rounded-xl bg-[#843D9B]/30 border border-[#843D9B]/50 flex items-center justify-center text-lg shrink-0">
          {displayIcon}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-[11px] font-black uppercase tracking-wider text-purple-300 truncate">
            {title}
          </p>
          <p className="text-xs font-semibold text-slate-100 mt-0.5 line-clamp-2 leading-snug">
            {message}
          </p>
        </div>
      </div>
    ),
    {
      id: key,
      duration: 4500,
      position: 'top-center',
    }
  );
};
