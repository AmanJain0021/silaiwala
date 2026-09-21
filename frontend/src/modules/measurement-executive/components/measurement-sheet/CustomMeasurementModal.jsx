import React, { useState } from 'react';
import { X } from 'lucide-react';

const CustomMeasurementModal = ({ isOpen, onClose, onAdd }) => {
    const [name, setName] = useState('');
    const [value, setValue] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onAdd({
            key: name.toLowerCase().replace(/\s+/g, '_'),
            label: name.trim(),
            value: value.trim() || '0.0',
            unit: 'in'
        });
        setName('');
        setValue('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-gray-900">Add Custom Measurement</h3>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Measurement Name
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Wrist, Cross Back, Calf"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-900 focus:outline-none focus:border-[#6C2E9C] focus:ring-2 focus:ring-purple-100"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Value (in inches)
                        </label>
                        <input
                            type="number"
                            step="0.1"
                            placeholder="e.g. 12.5"
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-900 focus:outline-none focus:border-[#6C2E9C] focus:ring-2 focus:ring-purple-100"
                        />
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-[#581C87] hover:bg-[#4A154B] transition-colors shadow-md shadow-purple-900/20"
                        >
                            Add Measurement
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default CustomMeasurementModal;
