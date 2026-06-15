import React from 'react';
import { Tag } from 'lucide-react';

const BillDetails = ({ pricing, advancePercentage = 50 }) => {
    if (!pricing) return null;

    const { base, delivery, taxes, total } = pricing;
    const finalTotal = total + 10;
    const advanceAmount = Math.round(finalTotal * (advancePercentage / 100));
    const remainingAmount = finalTotal - advanceAmount;

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
                    <span className="text-sm font-black text-[#2D2F6E]">₹{finalTotal}</span>
                </div>

                <div className="w-full border-t border-dashed border-gray-200 my-3"></div>

                <div className="flex justify-between items-center bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100">
                    <div>
                        <span className="text-xs font-bold text-[#2D2F6E] block">Advance Payable ({advancePercentage}%)</span>
                        <span className="text-[9px] text-[#2D2F6E]/70 font-semibold uppercase tracking-wider">Required to confirm order</span>
                    </div>
                    <span className="text-sm font-black text-[#2D2F6E]">₹{advanceAmount}</span>
                </div>

                <div className="flex justify-between items-center px-2.5 pt-1">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">To Pay on Delivery</span>
                    <span className="text-xs font-bold text-gray-600">₹{remainingAmount}</span>
                </div>
            </div>

            <div className="mt-3 bg-green-50 rounded-lg p-2 text-[10px] text-green-700 text-center font-medium border border-green-100">
                You saved ₹200 on this order!
            </div>
        </div>
    );
};

export default BillDetails;
