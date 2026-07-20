import React from 'react';
import { buildDisplayTrackingTimeline, formatTrackingDateTime } from '../../../utils/trackingTimeline';

/**
 * Vertical tracking timeline: oldest at top, latest at bottom; completed path highlighted.
 */
const OrderTrackingTimeline = ({
  history,
  orderStatus,
  orderCreatedAt,
  deliveredAt,
  updatedAt,
  accent = 'brand',
}) => {
  const events = buildDisplayTrackingTimeline(history, orderStatus, {
    orderCreatedAt,
    deliveredAt,
    updatedAt,
  });

  const dotActive = accent === 'brand' ? 'bg-[#843D9B]' : 'bg-primary';
  const dotRing = accent === 'brand' ? 'ring-[#843D9B]/25' : 'ring-primary/25';
  const lineActive = accent === 'brand' ? 'bg-[#843D9B]/35' : 'bg-primary/35';
  const cardActive = accent === 'brand' ? 'border-[#843D9B]/30 bg-[#843D9B]/[0.03]' : 'border-primary/30 bg-primary/[0.03]';

  if (events.length === 0) {
    return (
      <p className="text-[10px] text-gray-400 font-medium italic">No tracking updates yet.</p>
    );
  }

  return (
    <div className="relative pl-6">
      {events.map((event, idx) => {
        const isLast = idx === events.length - 1;
        const { time, date } = formatTrackingDateTime(event._sortMs);
        const label = (event.status || 'update').replace(/-/g, ' ');

        return (
          <div key={`${event.status}-${event._sortMs}-${idx}`} className="relative pb-6 last:pb-0">
            {idx < events.length - 1 && (
              <span
                className={`absolute left-[11px] top-4 bottom-0 w-0.5 -translate-x-1/2 ${lineActive}`}
                aria-hidden
              />
            )}
            <span
              className={`absolute -left-[19px] top-1.5 h-3.5 w-3.5 rounded-full border-2 border-white shadow-sm ${dotActive} ${
                isLast ? `ring-2 ${dotRing} scale-110` : ''
              }`}
              aria-hidden
            />
            <div
              className={`p-3 rounded-xl border shadow-sm ${
                isLast ? cardActive : 'border-gray-100 bg-white'
              }`}
            >
              <div className="flex justify-between items-start gap-2">
                <p className="text-[11px] font-black text-gray-900 uppercase tracking-tight">{label}</p>
                <p className="text-[9px] text-gray-400 font-bold shrink-0 text-right">
                  {time}
                  {date ? ` • ${date}` : ''}
                </p>
              </div>
              {event.message && (
                <p className="text-[10px] text-gray-500 font-medium mt-1 leading-relaxed">{event.message}</p>
              )}
              {event.proof && (
                <a
                  href={event.proof}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 block w-20 h-20 rounded-lg overflow-hidden border border-gray-100"
                >
                  <img src={event.proof} alt="Proof" className="w-full h-full object-cover" />
                </a>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default OrderTrackingTimeline;
