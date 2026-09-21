import React, { useState } from 'react';
import { X } from 'lucide-react';

const AddItemModal = ({ isOpen, onClose, onAdd }) => {
    const [name, setName] = useState('');
    const [type, setType] = useState('top');

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!name.trim()) return;
        onAdd({
            id: `item_${Date.now()}`,
            name: name.trim(),
            type,
        });
        setName('');
        setType('top');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
            <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-gray-900">Add New Garment Item</h3>
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
                            Item Name
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Suit 3, Dupatta, Palazzo"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-900 focus:outline-none focus:border-[#6C2E9C] focus:ring-2 focus:ring-purple-100"
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                            Garment Type
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setType('top')}
                                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                                    type === 'top'
                                        ? 'bg-[#581C87] text-white border-[#581C87]'
                                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                                }`}
                            >
                                Top (Kameez/Shirt)
                            </button>
                            <button
                                type="button"
                                onClick={() => setType('bottom')}
                                className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all ${
                                    type === 'bottom'
                                        ? 'bg-[#581C87] text-white border-[#581C87]'
                                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                                }`}
                            >
                                Bottom (Salwar/Pant)
                            </button>
                        </div>
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
                            Add Item
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddItemModal;
