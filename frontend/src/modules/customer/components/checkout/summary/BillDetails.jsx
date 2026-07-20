import React from 'react';
import { Tag } from 'lucide-react';
import { splitAdvanceRemaining } from '../../../../../utils/checkoutBilling';

const BillDetails = ({ pricing, advancePercentage = 50, baseLabel = 'Stitching Charges' }) => {
    if (!pricing) return null;

    const {
        base = 0,
        delivery = 0,
        taxes = 0,
        total = 0,
        addons = 0,
        fabric = 0,
        tailorAtHome = 0,
        platformFee = 0,
        platformFeePercentage = 0,
        gstPercentage = 5,
        discountAmount = 0,
        subtotalBeforeTax,
    } = pricing;

    const finalTotal = Math.round(Number(total) || 0);
    const { advanceAmount, remainingAmount } = splitAdvanceRemaining(finalTotal, advancePercentage);
    const fullAdvance = advancePercentage >= 100;

    const lineItems = subtotalBeforeTax != null
        ? subtotalBeforeTax
        : base + addons + fabric + tailorAtHome + platformFee;

    return (
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm mb-4">
            <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Tag size={14} className="text-primary" />
                Bill Details
            </h3>

            <div className="space-y-2.5">
                <div className="flex justify-between text-xs text-gray-600">
                    <span>{baseLabel}</span>
                    <span>₹{Math.round(base).toLocaleString('en-IN')}</span>
                </div>

                {addons > 0 && (
                    <div className="flex justify-between text-xs text-gray-600">
                        <span>Style Add-ons</span>
                        <span>₹{Math.round(addons).toLocaleString('en-IN')}</span>
                    </div>
                )}

                {fabric > 0 && (
                    <div className="flex justify-between text-xs text-gray-600">
                        <span>Fabric Charges</span>
                        <span>₹{Math.round(fabric).toLocaleString('en-IN')}</span>
                    </div>
                )}

                {tailorAtHome > 0 && (
                    <div className="flex justify-between text-xs text-gray-600">
                        <span>Tailor Visit Fee</span>
                        <span>₹{Math.round(tailorAtHome).toLocaleString('en-IN')}</span>
                    </div>
                )}

                {delivery > 0 ? (
                    <div className="flex justify-between text-xs text-gray-600">
                        <span>Delivery Charges</span>
                        <span>₹{Math.round(delivery).toLocaleString('en-IN')}</span>
                    </div>
                ) : (
                    <div className="flex justify-between text-xs text-gray-600">
                        <div>
                            <span>Standard Delivery</span>
                            {pricing.freeDeliveryApplied && (
                                <p className="text-[9px] text-green-600 font-medium mt-0.5">
                                    Free on orders above ₹{pricing.freeDeliveryMinOrder ?? '—'}
                                </p>
                            )}
                        </div>
                        <span className="text-green-600 font-medium">FREE</span>
                    </div>
                )}

                {platformFee > 0 && (
                    <div className="flex justify-between text-xs text-gray-600">
                        <span>Platform Fee ({platformFeePercentage}%)</span>
                        <span>₹{Math.round(platformFee).toLocaleString('en-IN')}</span>
                    </div>
                )}

                <div className="flex justify-between text-xs text-gray-500 pt-1 border-t border-dashed border-gray-100">
                    <span>Subtotal (before GST)</span>
                    <span>₹{Math.round(lineItems).toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between text-xs text-gray-600">
                    <span>GST ({gstPercentage}%)</span>
                    <span>₹{Math.round(taxes).toLocaleString('en-IN')}</span>
                </div>

                {discountAmount > 0 && (
                    <div className="flex justify-between text-xs text-green-700 font-medium">
                        <span>Coupon / Discount</span>
                        <span>-₹{Math.round(discountAmount).toLocaleString('en-IN')}</span>
                    </div>
                )}

                <div className="h-px bg-gray-100 my-1" />

                <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-gray-900">Total Amount</span>
                    <span className="text-sm font-black text-[#843D9B]">₹{finalTotal.toLocaleString('en-IN')}</span>
                </div>

                <div className="w-full border-t border-dashed border-gray-200 my-3" />

                {!fullAdvance && (
                    <>
                        <div className="flex justify-between items-center bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100">
                            <div>
                                <span className="text-xs font-bold text-[#843D9B] block">
                                    Advance Payable ({advancePercentage}%)
                                </span>
                                <span className="text-[9px] text-[#843D9B]/70 font-semibold uppercase tracking-wider">
                                    Required to confirm order
                                </span>
                            </div>
                            <span className="text-sm font-black text-[#843D9B]">
                                ₹{advanceAmount.toLocaleString('en-IN')}
                            </span>
                        </div>

                        <div className="flex justify-between items-center px-2.5 pt-1">
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                To Pay on Delivery
                            </span>
                            <span className="text-xs font-bold text-gray-600">
                                ₹{remainingAmount.toLocaleString('en-IN')}
                            </span>
                        </div>
                        <p className="text-[9px] text-gray-400 text-center px-2">
                            Advance + on delivery = ₹{finalTotal.toLocaleString('en-IN')} (after tailor accepts)
                        </p>
                    </>
                )}

                {fullAdvance && (
                    <div className="flex justify-between items-center bg-indigo-50/50 p-2.5 rounded-xl border border-indigo-100">
                        <span className="text-xs font-bold text-[#843D9B]">Payable Now (100%)</span>
                        <span className="text-sm font-black text-[#843D9B]">₹{finalTotal.toLocaleString('en-IN')}</span>
                    </div>
                )}
            </div>

            {discountAmount > 0 && (
                <div className="mt-3 bg-green-50 rounded-lg p-2 text-[10px] text-green-700 text-center font-medium border border-green-100">
                    You saved ₹{Math.round(discountAmount).toLocaleString('en-IN')} on this order!
                </div>
            )}
        </div>
    );
};

export default BillDetails;
