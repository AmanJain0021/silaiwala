import React from 'react';
import { Truck, Zap, Crown } from 'lucide-react';

const DeliveryComparison = () => {
    return (
        <div className="bg-gray-50 py-8 px-4 border-y border-gray-100">
            <div className="max-w-md mx-auto text-center mb-6">
                <h2 className="text-lg font-bold text-gray-900">Choose Your Delivery Speed</h2>
                <p className="text-xs text-gray-500 mt-1">Select the timeline that fits your schedule.</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
                {/* Normal */}
                <div className="bg-white p-4 rounded-xl border border-gray-100 text-center shadow-sm">
                    <div className="w-10 h-10 mx-auto bg-indigo-50 rounded-full flex items-center justify-center text-primary mb-2">
                        <Truck size={20} />
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm">Normal</h3>
                    <p className="text-[10px] text-gray-500 mt-0.5">15 Days</p>
                    <p className="text-xs font-semibold text-green-600 mt-2">Free</p>
                </div>

                {/* Express */}
                <div className="bg-white p-4 rounded-xl border-2 border-primary text-center shadow-md relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-primary text-white text-[8px] font-bold px-2 py-0.5 rounded-bl-lg">
                        POPULAR
                    </div>
                    <div className="w-10 h-10 mx-auto bg-green-50 rounded-full flex items-center justify-center text-primary mb-2">
                        <Zap size={20} fill="currentColor" />
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm">Express</h3>
                    <p className="text-[10px] text-gray-500 mt-0.5">10 Days</p>
                    <p className="text-xs font-semibold text-primary mt-2">+₹100</p>
                </div>

                {/* Premium */}
                <div className="bg-white p-4 rounded-xl border border-gray-100 text-center shadow-sm opacity-80 hover:opacity-100 transition-opacity">
                    <div className="w-10 h-10 mx-auto bg-indigo-50 rounded-full flex items-center justify-center text-primary mb-2">
                        <Crown size={20} />
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm">Premium</h3>
                    <p className="text-[10px] text-gray-500 mt-0.5">7 Days</p>
                    <p className="text-xs font-semibold text-primary mt-2">+₹250</p>
                </div>
            </div>
        </div>
    );
};

export default DeliveryComparison;
