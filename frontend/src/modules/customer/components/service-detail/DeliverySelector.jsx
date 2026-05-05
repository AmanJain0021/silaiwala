import React from 'react';
import { Truck, Zap, Crown } from 'lucide-react';
import { cn } from '../../../../utils/cn';

const options = [
    {
        id: 'standard',
        label: 'Standard',
        days: 15,
        price: 0,
        icon: Truck,
        color: 'text-primary',
        bg: 'bg-indigo-50',
    },
    {
        id: 'express',
        label: 'Express',
        days: 10,
        price: 150,
        icon: Zap,
        color: 'text-primary',
        bg: 'bg-green-50',
        badge: 'POPULAR'
    },
    {
        id: 'premium',
        label: 'Premium',
        days: 7,
        price: 350,
        icon: Crown,
        color: 'text-primary',
        bg: 'bg-indigo-50',
    }
];

const DeliverySelector = ({ selected, onSelect }) => {
    const getEstimatedDate = (days) => {
        const date = new Date();
        date.setDate(date.getDate() + days);
        return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    };

    return (
        <div className="bg-white rounded-2xl p-4 mb-4 shadow-sm border border-gray-100">
            <h3 className="text-sm font-bold text-gray-900 mb-3">Choose Delivery Speed</h3>
            <div className="grid grid-cols-3 gap-3">
                {options.map((opt) => {
                    const isSelected = selected === opt.id;
                    const Icon = opt.icon;
                    const estDate = getEstimatedDate(opt.days);

                    return (
                        <div
                            key={opt.id}
                            onClick={() => onSelect(opt.id)}
                            className={cn(
                                "relative p-3 rounded-xl border cursor-pointer transition-all duration-200 text-center flex flex-col items-center justify-between min-h-[140px]",
                                isSelected ? "border-primary bg-primary-soft shadow-md ring-1 ring-primary" : "border-gray-100 hover:border-gray-200"
                            )}
                        >
                            {opt.badge && (
                                <div className="absolute top-0 right-0 bg-primary text-white text-[8px] font-bold px-1.5 py-0.5 rounded-bl-lg rounded-tr-lg">
                                    {opt.badge}
                                </div>
                            )}

                            <div>
                                <div className={cn("w-8 h-8 mx-auto rounded-full flex items-center justify-center mb-2 transition-transform", opt.bg, opt.color, isSelected && "scale-110")}>
                                    <Icon size={16} />
                                </div>

                                <p className={cn("text-[11px] font-bold mb-0.5", isSelected ? "text-primary" : "text-gray-700")}>{opt.label}</p>
                                <p className="text-[9px] text-gray-500 font-medium">{opt.days} Days</p>
                                <p className="text-[9px] text-primary font-black uppercase mt-1">by {estDate}</p>
                            </div>

                            <p className={cn("text-[10px] font-black mt-2", opt.price > 0 ? opt.color : "text-green-600")}>
                                {opt.price > 0 ? `+₹${opt.price}` : 'FREE'}
                            </p>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default DeliverySelector;
