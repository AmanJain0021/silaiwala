import React from 'react';
import { Tag } from 'lucide-react';

const BillDetails = ({ pricing }) => {
    if (!pricing) return null;

    const { base, delivery, taxes, total } = pricing;

    return (
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm mb-4">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Tag size={14} className="text-primary" />
                Bill Details
            </h3>

            <div className="space-y-2.5">
                <div className="flex justify-between text-xs text-gray-600">
                    <span>Stitching Charges</span>
                    <span>₹{base}</span>
                </div>

                {pricing.addons > 0 && (
                    <div className="flex justify-between text-xs text-gray-600">
                        <span>Style Add-ons</span>
                        <span>₹{pricing.addons}</span>
                    </div>
                )}

                {pricing.tailorAtHome > 0 && (
                    <div className="flex justify-between text-xs text-gray-600">
                        <span>Tailor Visit Fee</span>
                        <span>₹{pricing.tailorAtHome}</span>
                    </div>
                )}

                {delivery > 0 ? (
                    <div className="flex justify-between text-xs text-gray-600">
                        <span>Express Delivery Fee</span>
                        <span>₹{delivery}</span>
                    </div>
                ) : (
                    <div className="flex justify-between text-xs text-gray-600">
                        <span>Standard Delivery</span>
                        <span className="text-green-600 font-medium">FREE</span>
                    </div>
                )}

                <div className="flex justify-between text-xs text-gray-600">
                    <span>Platform Fee</span>
                    <span>₹10</span>
                </div>

                <div className="flex justify-between text-xs text-gray-600">
                    <span>GST ({pricing.gstPercentage || 5}%)</span>
                    <span>₹{taxes}</span>
                </div>

                <div className="h-px bg-gray-100 my-1" />

                <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-900">Total Amount</span>
                    <span className="text-sm font-bold text-primary">₹{total + 10}</span>
                </div>
            </div>

            <div className="mt-3 bg-green-50 rounded-lg p-2 text-[10px] text-green-700 text-center font-medium border border-green-100">
                You saved ₹200 on this order!
            </div>
        </div>
    );
};

export default BillDetails;
