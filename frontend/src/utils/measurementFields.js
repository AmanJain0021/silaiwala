/** Helpers for admin dynamic measurement fields (fields + section headings). */

export const isHeadingField = (field) =>
    !!field && (field.type === 'heading' || field.isHeading === true);

export const getInputFields = (fields = []) =>
    (Array.isArray(fields) ? fields : []).filter(
        (f) => !isHeadingField(f) && (f.key || f.id || f.name)
    );

export const getFieldKey = (field) =>
    field?.key || field?.id || field?.name || field?.label || '';

export const slugifyLabel = (label = '') =>
    String(label)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '')
        .slice(0, 40) || `h_${Date.now().toString(36).slice(-4)}`;

/** Normalize before saving to API */
export const sanitizeMeasurementFields = (fields = []) =>
    (Array.isArray(fields) ? fields : [])
        .map((f, idx) => {
            if (isHeadingField(f)) {
                const label = String(f.label || '').trim();
                if (!label) return null;
                return {
                    type: 'heading',
                    key: f.key?.trim() || `heading_${slugifyLabel(label)}_${idx}`,
                    label,
                    placeholder: '',
                    isRequired: false,
                };
            }
            const label = String(f.label || '').trim();
            const key = String(f.key || '').trim() || slugifyLabel(label);
            if (!label || !key) return null;
            return {
                type: 'field',
                key,
                label,
                placeholder: f.placeholder || '',
                isRequired: f.isRequired !== false,
            };
        })
        .filter(Boolean);

const META_KEYS = new Set([
    'type',
    'slipImage',
    'image',
    'url',
    'slipUrl',
    'file',
    'notes',
    'isConfirmed',
    'saveProfile',
    'sampleGarment',
    'slipAttached',
    'data',
    'measurementLayout',
    'categoryId',
    'garmentType',
    'unit',
    'items',
    '__multi',
]);

/**
 * Build ordered display rows for tailor/admin/customer.
 * Uses measurementLayout (saved with order) when present.
 */
export const buildMeasurementDisplayRows = (measurements, layoutFields) => {
    if (!measurements) return [];
    const mObj =
        measurements instanceof Map
            ? Object.fromEntries(measurements)
            : typeof measurements === 'object'
              ? measurements
              : {};

    const layout =
        (Array.isArray(layoutFields) && layoutFields.length > 0
            ? layoutFields
            : Array.isArray(mObj.measurementLayout)
              ? mObj.measurementLayout
              : null) || null;

    const rows = [];

    if (layout && layout.length > 0) {
        layout.forEach((item) => {
            if (isHeadingField(item)) {
                rows.push({ type: 'heading', label: item.label });
                return;
            }
            const key = getFieldKey(item);
            if (!key || META_KEYS.has(key)) return;
            const value = mObj[key];
            if (value === undefined || value === null || value === '') return;
            if (typeof value === 'object') return;
            rows.push({
                type: 'value',
                key,
                label: item.label || key,
                value,
            });
        });
        // Any extra keys not in layout
        Object.entries(mObj).forEach(([key, value]) => {
            if (META_KEYS.has(key)) return;
            if (value === undefined || value === null || value === '' || typeof value === 'object') return;
            if (rows.some((r) => r.type === 'value' && r.key === key)) return;
            rows.push({
                type: 'value',
                key,
                label: key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()).trim(),
                value,
            });
        });
        return rows;
    }

    Object.entries(mObj).forEach(([key, value]) => {
        if (META_KEYS.has(key)) return;
        if (value === undefined || value === null || value === '' || typeof value === 'object') return;
        rows.push({
            type: 'value',
            key,
            label: key.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase()).trim(),
            value,
        });
    });
    return rows;
};
