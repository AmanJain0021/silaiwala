import React from 'react';
import { ArrowRight, Info } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PriceSummary = ({ basePrice, deliveryPrice, fabricPrice = 0, deliveryDays, gstPercentage = 5, onProceed }) => {
    const navigate = useNavigate();
    const total = basePrice + deliveryPrice + fabricPrice;
    const taxes = Math.round(total * (gstPercentage / 100)); // Dynamic GST
    const grandTotal = total + taxes;

    // Calculate Estimated Date
    const today = new Date();
    const deliveryDate = new Date(today);
    deliveryDate.setDate(today.getDate() + deliveryDays);
    const dateString = deliveryDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

    return (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-50 md:static md:shadow-none md:border md:rounded-2xl md:p-6 md:sticky md:top-24">

            {/* Desktop View Details */}
            <div className="hidden md:block mb-4 space-y-2">
                <div className="flex justify-between text-sm text-gray-600">
                    <span>Stitching Base Price</span>
                    <span>₹{basePrice}</span>
                </div>
                {fabricPrice > 0 && (
                    <div className="flex justify-between text-sm text-gray-600">
                        <span>Fabric Price</span>
                        <span className="text-primary">₹{fabricPrice}</span>
                    </div>
                )}
                {deliveryPrice > 0 && (
                    <div className="flex justify-between text-sm text-gray-600">
                        <span>Express Delivery</span>
                        <span className="text-primary">+₹{deliveryPrice}</span>
                    </div>
                )}
                <div className="flex justify-between text-sm text-gray-600">
                    <span>GST ({gstPercentage}%)</span>
                    <span>₹{taxes}</span>
                </div>
                <div className="h-px bg-gray-100 my-2" />
            </div>

            <div className="flex items-center justify-between md:flex-col md:items-stretch md:gap-4">
                <div>
                    <p className="text-[10px] text-gray-500 md:hidden">Total Amount</p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-xl font-bold text-gray-900">₹{grandTotal}</span>
                        <span className="text-xs text-gray-400 font-medium line-through md:hidden">₹{grandTotal + 200}</span>
                    </div>
                    <p className="text-[10px] text-green-600 font-medium flex items-center gap-1 mt-0.5 md:justify-center">
                        <Info size={10} />
                        Get it by {dateString}
                    </p>
                </div>

                <button
                    onClick={onProceed ? onProceed : () => navigate('/user/checkout/address')}
                    className="bg-primary text-white px-6 py-3 rounded-xl font-bold text-sm shadow-lg hover:bg-primary-dark active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                    Proceed to Checkout <ArrowRight size={16} />
                </button>
            </div>
        </div>
    );
};

export default PriceSummary;
