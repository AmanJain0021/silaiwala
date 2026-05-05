import React from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';

const CartItem = ({ item, onUpdateQuantity, onRemove }) => {
    return (
        <div className="flex gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm animate-in slide-in-from-bottom-2">
            {/* Image */}
            <div className="w-20 h-24 shrink-0 rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
                <img
                    src={item.images ? item.images[0] : item.image}
                    alt={item.title}
                    className="w-full h-full object-cover"
                />
            </div>

            {/* Details */}
            <div className="flex-1 flex flex-col justify-between">
                <div>
                    <div className="flex justify-between items-start gap-2">
                        <h3 className="text-sm font-bold text-gray-900 line-clamp-2">{item.title}</h3>
                        <button
                            onClick={() => onRemove(item.cartId)}
                            className="text-gray-400 hover:text-error transition-colors p-1 -mr-2 -mt-2"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-bold bg-gray-100 px-2 py-0.5 rounded text-gray-600 uppercase">
                            Size: {item.selectedSize}
                        </span>
                        <div className="flex items-center gap-1">
                            <span className="w-3 h-3 rounded-full border border-gray-200 shadow-sm" style={{ backgroundColor: item.selectedColor === 'Teal Green' ? '#1e3932' : item.selectedColor === 'Ruby Red' ? '#e11d48' : item.selectedColor === 'Mustard' ? '#facc15' : item.selectedColor }}></span>
                            <span className="text-[10px] text-gray-500">{item.selectedColor}</span>
                        </div>
                    </div>
                </div>

                <div className="flex justify-between items-end mt-2">
                    <div className="font-bold text-[#2D2F6E]">₹{item.price}</div>

                    {/* Quantity Control */}
                    <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1 border border-gray-200">
                        <button
                            onClick={() => onUpdateQuantity(item.cartId, item.quantity - 1)}
                            className="w-6 h-6 flex items-center justify-center bg-white rounded shadow-sm text-gray-600 hover:text-[#2D2F6E] active:scale-90 transition-all"
                        >
                            <Minus size={12} />
                        </button>
                        <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                        <button
                            onClick={() => onUpdateQuantity(item.cartId, item.quantity + 1)}
                            className="w-6 h-6 flex items-center justify-center bg-[#2D2F6E] rounded shadow-sm text-white hover:bg-[#1E1F4D] active:scale-90 transition-all"
                        >
                            <Plus size={12} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartItem;
