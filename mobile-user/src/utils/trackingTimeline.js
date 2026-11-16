/** Parse a tracking history event time (ms). Falls back so events keep stable order. */
export function trackingEventTimeMs(event, orderCreatedAt, index = 0) {
  const raw = event?.timestamp ?? event?.updatedAt ?? event?.createdAt;
  if (raw != null && raw !== '') {
    const ms = new Date(raw).getTime();
    if (!Number.isNaN(ms)) return ms;
  }
  const base = orderCreatedAt ? new Date(orderCreatedAt).getTime() : 0;
  if (!Number.isNaN(base) && base > 0) {
    return base + (index + 1) * 60_000;
  }
  return Date.now() - (1000 - index);
}

/** Newest first for admin timeline panels */
export function sortTrackingHistoryNewestFirst(history, orderCreatedAt) {
  return [...(history || [])]
    .map((event, index) => ({
      event,
      sortMs: trackingEventTimeMs(event, orderCreatedAt, index),
    }))
    .sort((a, b) => b.sortMs - a.sortMs)
    .map(({ event, sortMs }) => ({ ...event, _sortMs: sortMs }));
}

export function formatTrackingDateTime(ms) {
  const d = new Date(ms);
  if (Number.isNaN(d.getTime())) return { time: '—', date: '' };
  return {
    time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    date: d.toLocaleDateString(),
  };
}

export function normalizeTrackingStatus(status) {
  return String(status || '')
    .toLowerCase()
    .replace(/^delivery-/, '')
    .trim();
}

/** Oldest → newest (top to bottom journey) */
export function sortTrackingHistoryOldestFirst(history, orderCreatedAt) {
  return [...(history || [])]
    .map((event, index) => ({
      ...event,
      _sortMs: trackingEventTimeMs(event, orderCreatedAt, index),
    }))
    .sort((a, b) => a._sortMs - b._sortMs);
}

function historyCoversOrderStatus(events, orderStatus) {
  const target = normalizeTrackingStatus(orderStatus);
  if (!target) return true;
  return events.some((e) => {
    const n = normalizeTrackingStatus(e.status);
    if (n === target) return true;
    if (target === 'delivered' && (n === 'delivered' || n === 'product-delivered')) return true;
    if (target === 'fabric-received' && (n === 'fabric-received' || n === 'fabric-delivered')) return true;
    return false;
  });
}

const SYNTHETIC_MESSAGES = {
  delivered: 'Order delivered successfully to the customer.',
  'product-delivered': 'Order delivered successfully to the customer.',
  'out-for-delivery': 'Order is out for delivery.',
  'fabric-received': 'Fabric received at tailor workshop.',
  'ready-for-delivery': 'Order is ready for final delivery.',
};

/**
 * Timeline rows aligned with current order.status (adds final step if DB history is missing it).
 */
export function buildDisplayTrackingTimeline(
  history,
  orderStatus,
  { orderCreatedAt, deliveredAt, updatedAt } = {}
) {
  let events = sortTrackingHistoryOldestFirst(history, orderCreatedAt);

  const deduped = [];
  for (const ev of events) {
    const n = normalizeTrackingStatus(ev.status);
    const last = deduped[deduped.length - 1];
    if (last && normalizeTrackingStatus(last.status) === n) {
      deduped[deduped.length - 1] = ev._sortMs >= last._sortMs ? ev : last;
    } else {
      deduped.push(ev);
    }
  }
  events = deduped;

  if (orderStatus && !historyCoversOrderStatus(events, orderStatus)) {
    const norm = normalizeTrackingStatus(orderStatus);
    const ts = deliveredAt || updatedAt || new Date();
    events.push({
      status: orderStatus,
      message:
        SYNTHETIC_MESSAGES[norm] ||
        SYNTHETIC_MESSAGES[orderStatus] ||
        `Order status updated to ${String(orderStatus).replace(/-/g, ' ')}`,
      timestamp: ts,
      _sortMs: trackingEventTimeMs({ timestamp: ts }, orderCreatedAt, events.length),
      _synthetic: true,
    });
  }

  return events.sort((a, b) => a._sortMs - b._sortMs);
}
