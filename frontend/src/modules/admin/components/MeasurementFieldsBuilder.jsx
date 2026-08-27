import React from 'react';
import { Plus, Trash2, Type, ChevronUp, ChevronDown, GripVertical } from 'lucide-react';
import { isHeadingField } from '../../../utils/measurementFields';

/**
 * Admin UI: build ordered measurement form (headings + fields) with easy reorder.
 */
const MeasurementFieldsBuilder = ({ fields = [], onChange, presets = [], onLoadPreset }) => {
    const list = Array.isArray(fields) ? fields : [];

    const update = (next) => onChange(next);

    const moveItem = (from, to) => {
        if (to < 0 || to >= list.length) return;
        const copy = [...list];
        const [item] = copy.splice(from, 1);
        copy.splice(to, 0, item);
        update(copy);
    };

    const removeAt = (idx) => update(list.filter((_, i) => i !== idx));

    const patchAt = (idx, patch) => {
        const copy = [...list];
        copy[idx] = { ...copy[idx], ...patch };
        update(copy);
    };

    const insertAt = (idx, item) => {
        const copy = [...list];
        copy.splice(idx, 0, item);
        update(copy);
    };

    const append = (item) => update([...list, item]);

    const onLabelChange = (idx, newLabel, isHeading) => {
        const copy = [...list];
        copy[idx] = { ...copy[idx], label: newLabel };
        if (isHeading) {
            copy[idx].type = 'heading';
            copy[idx].isRequired = false;
        } else {
            const autoKey = newLabel.toLowerCase().replace(/[^a-z0-9]/g, '');
            if (!copy[idx].key || copy[idx].key === copy[idx]._autoKey) {
                copy[idx].key = autoKey;
                copy[idx]._autoKey = autoKey;
            }
            copy[idx].type = 'field';
        }
        update(copy);
    };

    return (
        <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4 space-y-3">
            <div className="flex justify-between items-start gap-2">
                <div>
                    <p className="text-[10px] font-black uppercase text-indigo-700 tracking-widest">
                        Dynamic Measurement Fields
                    </p>
                    <p className="text-[10px] text-gray-500 font-medium mt-0.5">
                        Heading → fields → next heading. Use ↑ ↓ to reorder. Customer, tailor &amp; admin see the same order.
                    </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                    <button
                        type="button"
                        onClick={() =>
                            append({
                                type: 'heading',
                                key: '',
                                label: '',
                                placeholder: '',
                                isRequired: false,
                            })
                        }
                        className="px-3 py-1 bg-white text-indigo-700 border border-indigo-200 rounded-lg text-[10px] font-bold flex items-center gap-1 hover:bg-indigo-50 transition-all cursor-pointer shadow-xs"
                    >
                        <Type size={12} /> Add Heading
                    </button>
                    <button
                        type="button"
                        onClick={() =>
                            append({
                                type: 'field',
                                key: '',
                                label: '',
                                placeholder: '34',
                                isRequired: true,
                            })
                        }
                        className="px-3 py-1 bg-indigo-600 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 hover:bg-indigo-700 transition-all cursor-pointer shadow-xs"
                    >
                        <Plus size={12} /> Add Field
                    </button>
                </div>
            </div>

            {presets.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1 pb-1 border-y border-indigo-100/60">
                    <span className="text-[9px] font-black uppercase text-indigo-900 tracking-wider">
                        ⚡ 1-Click Field Templates:
                    </span>
                    {presets.map((preset) => (
                        <button
                            key={preset.key}
                            type="button"
                            onClick={() => onLoadPreset?.(preset)}
                            className="px-2 py-0.5 bg-indigo-100/80 hover:bg-indigo-200 text-indigo-800 rounded-md text-[9px] font-bold transition-all shadow-2xs cursor-pointer"
                        >
                            + {preset.name}
                        </button>
                    ))}
                </div>
            )}

            {list.length === 0 ? (
                <p className="text-[10px] text-gray-400 italic">
                    No rows yet. Add a Heading (e.g. Top), then Add Field under it. Or pick a template above.
                </p>
            ) : (
                <div className="space-y-2">
                    {list.map((field, idx) => {
                        const isHeading = isHeadingField(field);
                        const isFirst = idx === 0;
                        const isLast = idx === list.length - 1;

                        return (
                            <div
                                key={idx}
                                className={`rounded-xl border shadow-2xs overflow-hidden ${
                                    isHeading
                                        ? 'bg-indigo-100/70 border-indigo-200'
                                        : 'bg-white border-indigo-100'
                                }`}
                            >
                                <div className="flex gap-0">
                                    {/* Reorder column */}
                                    <div className="flex flex-col items-center justify-center gap-0.5 px-1.5 py-2 bg-black/[0.03] border-r border-indigo-100/80 shrink-0">
                                        <span className="text-[8px] font-black text-indigo-400 tabular-nums mb-0.5">
                                            {idx + 1}
                                        </span>
                                        <button
                                            type="button"
                                            disabled={isFirst}
                                            onClick={() => moveItem(idx, idx - 1)}
                                            className="p-1 rounded-md text-indigo-700 hover:bg-white disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                                            title="Move up"
                                        >
                                            <ChevronUp size={16} strokeWidth={2.5} />
                                        </button>
                                        <GripVertical size={12} className="text-indigo-300 my-0.5" />
                                        <button
                                            type="button"
                                            disabled={isLast}
                                            onClick={() => moveItem(idx, idx + 1)}
                                            className="p-1 rounded-md text-indigo-700 hover:bg-white disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
                                            title="Move down"
                                        >
                                            <ChevronDown size={16} strokeWidth={2.5} />
                                        </button>
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 p-3 flex flex-col gap-2 min-w-0">
                                        <div className="flex items-start gap-2">
                                            <div className="flex-1 space-y-1 min-w-0">
                                                <div className="flex items-center justify-between gap-2 flex-wrap">
                                                    <span
                                                        className={`text-[9px] font-black uppercase tracking-wider ${
                                                            isHeading ? 'text-indigo-800' : 'text-indigo-900/70'
                                                        }`}
                                                    >
                                                        {isHeading
                                                            ? 'Section heading'
                                                            : 'Field label'}
                                                    </span>
                                                    {!isHeading && field.key ? (
                                                        <span className="text-[8px] font-mono font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                                                            key: {field.key}
                                                        </span>
                                                    ) : null}
                                                </div>
                                                <input
                                                    type="text"
                                                    value={field.label || ''}
                                                    onChange={(e) =>
                                                        onLabelChange(idx, e.target.value, isHeading)
                                                    }
                                                    placeholder={
                                                        isHeading
                                                            ? 'e.g. Top, Bottom, Sleeve Details'
                                                            : 'e.g. Chest / Bust, Waist'
                                                    }
                                                    className="w-full px-3 py-1.5 bg-white/90 border border-gray-200 rounded-lg text-xs font-bold text-gray-900 outline-none focus:border-indigo-500 focus:bg-white transition-all"
                                                />
                                            </div>

                                            {!isHeading && (
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        patchAt(idx, {
                                                            isRequired:
                                                                field.isRequired === false ? true : false,
                                                        })
                                                    }
                                                    className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all shrink-0 mt-4 ${
                                                        field.isRequired !== false
                                                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                            : 'bg-gray-100 text-gray-500 border border-gray-200'
                                                    }`}
                                                >
                                                    {field.isRequired !== false ? 'Required ✓' : 'Optional'}
                                                </button>
                                            )}

                                            <button
                                                type="button"
                                                onClick={() => removeAt(idx)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors shrink-0 mt-3.5"
                                                title={isHeading ? 'Delete heading' : 'Delete field'}
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>

                                        {!isHeading && (
                                            <div className="flex items-center gap-2 pt-1 border-t border-indigo-50">
                                                <span className="text-[9px] font-medium text-gray-400 shrink-0">
                                                    Sample Inch:
                                                </span>
                                                <input
                                                    type="text"
                                                    value={field.placeholder || ''}
                                                    onChange={(e) =>
                                                        patchAt(idx, { placeholder: e.target.value })
                                                    }
                                                    placeholder="e.g. 34"
                                                    className="flex-1 px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-lg text-[10px] font-medium text-gray-800 outline-none focus:border-indigo-500 focus:bg-white transition-all"
                                                />
                                            </div>
                                        )}

                                        {/* Insert below — easy mid-list add */}
                                        <div className="flex flex-wrap gap-1.5 pt-1 border-t border-dashed border-indigo-100/80">
                                            <span className="text-[8px] font-bold text-gray-400 uppercase tracking-wider self-center mr-0.5">
                                                Insert below:
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    insertAt(idx + 1, {
                                                        type: 'heading',
                                                        key: '',
                                                        label: '',
                                                        placeholder: '',
                                                        isRequired: false,
                                                    })
                                                }
                                                className="px-2 py-0.5 text-[9px] font-bold text-indigo-700 bg-white border border-indigo-200 rounded-md hover:bg-indigo-50"
                                            >
                                                + Heading
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    insertAt(idx + 1, {
                                                        type: 'field',
                                                        key: '',
                                                        label: '',
                                                        placeholder: '34',
                                                        isRequired: true,
                                                    })
                                                }
                                                className="px-2 py-0.5 text-[9px] font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                                            >
                                                + Field
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default MeasurementFieldsBuilder;
