import React from 'react';
import { Plus } from 'lucide-react';

const DressIcon = ({ className = "w-4 h-4" }) => (
    <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.8" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <path d="M8 2h8l2 5-3 2v13H9V9L6 7l2-5z" />
        <path d="M10 2v3a2 2 0 0 0 4 0V2" />
    </svg>
);

const PantsIcon = ({ className = "w-4 h-4" }) => (
    <svg 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="1.8" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        className={className}
    >
        <path d="M4 4h16l-1 17-5-1-2-9-2 9-5 1L4 4z" />
        <path d="M4 8h16" />
    </svg>
);

const ItemTabs = ({ items = [], activeTabId, onSelectTab, onAddItem }) => {
    return (
        <div className="w-full flex items-center justify-between gap-2 overflow-x-auto scrollbar-hide py-1">
            {/* Tabs List */}
            <div className="flex items-center gap-2 flex-nowrap">
                {items.map((item) => {
                    const isActive = item.id === activeTabId;
                    const isBottom = item.type === 'bottom' || /bottom|pant|pajama|salwar|trouser|plazo|palazzo|skirt/i.test(item.name);

                    return (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => onSelectTab(item.id)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                                isActive
                                    ? 'bg-[#4A154B] text-white shadow-md shadow-[#4A154B]/20'
                                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200/90'
                            }`}
                        >
                            {isBottom ? (
                                <PantsIcon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-gray-600'}`} />
                            ) : (
                                <DressIcon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-gray-600'}`} />
                            )}
                            <span>{item.name}</span>
                        </button>
                    );
                })}
            </div>

            {/* "+ Add Item" Button */}
            <button
                type="button"
                onClick={onAddItem}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-gray-700 bg-white border border-gray-300 hover:border-[#6C2E9C] hover:text-[#6C2E9C] hover:bg-purple-50/40 transition-all cursor-pointer whitespace-nowrap flex-shrink-0"
            >
                <Plus size={14} strokeWidth={2.2} />
                <span>Add Item</span>
            </button>
        </div>
    );
};

export default ItemTabs;
