import React from 'react';
import { buildMeasurementDisplayRows } from '../../utils/measurementFields';

/**
 * Renders measurement values with optional section headings (from service schema).
 * Headings are full-width; values sit in a 2-col grid under each section.
 */
const MeasurementDataDisplay = ({
    measurements,
    layoutFields,
    className = '',
    emptyText = 'No measurement values',
}) => {
    const rows = buildMeasurementDisplayRows(measurements, layoutFields);
    if (!rows.length) {
        return <p className="text-[11px] text-gray-400 font-medium italic">{emptyText}</p>;
    }

    const sections = [];
    let current = { heading: null, values: [] };
    rows.forEach((row) => {
        if (row.type === 'heading') {
            if (current.heading || current.values.length) sections.push(current);
            current = { heading: row.label, values: [] };
        } else {
            current.values.push(row);
        }
    });
    if (current.heading || current.values.length) sections.push(current);

    return (
        <div className={`space-y-4 ${className}`}>
            {sections.map((sec, sIdx) => (
                <div key={`sec-${sIdx}-${sec.heading || 'values'}`} className="space-y-2">
                    {sec.heading && (
                        <p className="text-[10px] font-black uppercase tracking-[0.14em] text-primary border-b border-primary/15 pb-1.5">
                            {sec.heading}
                        </p>
                    )}
                    <div className="grid grid-cols-2 gap-2">
                        {sec.values.map((row) => {
                            const isImage =
                                typeof row.value === 'string' &&
                                (row.value.startsWith('data:image') ||
                                    /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)/i.test(row.value));
                            return (
                                <div
                                    key={row.key}
                                    className={`bg-gray-50 rounded-xl p-3 border border-gray-100 ${isImage ? 'col-span-2' : ''}`}
                                >
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                                        {row.label}
                                    </p>
                                    {isImage ? (
                                        <img
                                            src={row.value}
                                            alt={row.label}
                                            className="w-full max-h-60 object-contain rounded-xl border border-gray-200 bg-white"
                                        />
                                    ) : (
                                        <p className="text-[14px] font-black text-gray-900">
                                            {typeof row.value === 'number'
                                                ? `${row.value}"`
                                                : String(row.value)}
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default MeasurementDataDisplay;
