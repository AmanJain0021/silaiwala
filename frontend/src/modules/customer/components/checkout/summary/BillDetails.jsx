import React, { useState } from 'react';
import { Tag, FileText, Gift, Wallet, ChevronRight, Check } from 'lucide-react';
import { splitAdvanceRemaining } from '../../../../../utils/checkoutBilling';

const BillDetails = ({ pricing, advancePercentage = 25, baseLabel = 'Stitching Charges' }) => {
    const [useWallet, setUseWallet] = useState(false);
    const [couponApplied, setCouponApplied] = useState(false);

    if (!pricing) return null;

    const {
        base = 1000,
        delivery = 0,
        taxes = 237,
        total = 2604,
        addons = 0,
        fabric = 0,
        tailorAtHome = 1357,
        platformFee = 10,
        platformFeePercentage = 1,
        gstPercentage = 10,
        discountAmount = 0,
        subtotalBeforeTax = 2367,
    } = pricing;

    const finalTotal = Math.round(Number(total) || 2604);
    const { advanceAmount, remainingAmount } = splitAdvanceRemaining(finalTotal, advancePercentage);
    const fullAdvance = advancePercentage >= 100;

    const lineItems = subtotalBeforeTax != null
        ? subtotalBeforeTax
        : base + addons + fabric + tailorAtHome + platformFee;

    return (
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-xs mb-4">
            
            {/* Header: Title & Apply Coupon */}
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <FileText size={18} className="text-[#843D9B]" />
                    <span>Bill Details</span>
                </h3>
                <button
                    type="button"
                    onClick={() => setCouponApplied(!couponApplied)}
                    className="border border-purple-200 text-[#843D9B] px-3.5 py-1 rounded-full text-xs font-bold bg-purple-50 hover:bg-purple-100 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                    <Tag size={12} />
                    <span>{couponApplied ? 'Coupon Applied!' : 'Apply Coupon'}</span>
                </button>
            </div>

            <div className="space-y-2.5 max-w-xl">
                <div className="flex justify-between text-xs text-slate-600 font-medium">
                    <span>{baseLabel}</span>
                    <span className="font-semibold text-slate-900">₹{Math.round(base).toLocaleString('en-IN')}</span>
                </div>

                {tailorAtHome > 0 && (
                    <div className="flex justify-between text-xs text-slate-600 font-medium">
                        <span>Measurement Executive Fee</span>
                        <span className="font-semibold text-slate-900">₹{Math.round(tailorAtHome).toLocaleString('en-IN')}</span>
                    </div>
                )}

                {addons > 0 && (
                    <div className="flex justify-between text-xs text-slate-600 font-medium">
                        <span>Style Add-ons</span>
                        <span className="font-semibold text-slate-900">₹{Math.round(addons).toLocaleString('en-IN')}</span>
                    </div>
                )}

                {fabric > 0 && (
                    <div className="flex justify-between text-xs text-slate-600 font-medium">
                        <span>Fabric Charges</span>
                        <span className="font-semibold text-slate-900">₹{Math.round(fabric).toLocaleString('en-IN')}</span>
                    </div>
                )}

                {platformFee > 0 && (
                    <div className="flex justify-between text-xs text-slate-600 font-medium">
                        <span>Platform Fee ({platformFeePercentage}%)</span>
                        <span className="font-semibold text-slate-900">₹{Math.round(platformFee).toLocaleString('en-IN')}</span>
                    </div>
                )}

                <div className="flex justify-between text-xs text-slate-600 font-medium">
                    <div>
                        <span>Standard Delivery</span>
                        <p className="text-[10px] text-emerald-600 font-medium mt-0.5">
                            Free on orders above ₹999
                        </p>
                    </div>
                    <span className="text-emerald-600 font-bold">FREE</span>
                </div>

                <div className="flex justify-between text-xs text-slate-500 font-medium pt-1.5 border-t border-dashed border-slate-200">
                    <span>Subtotal (before GST)</span>
                    <span className="font-semibold text-slate-700">₹{Math.round(lineItems).toLocaleString('en-IN')}</span>
                </div>

                <div className="flex justify-between text-xs text-slate-600 font-medium">
                    <span>GST ({gstPercentage}%)</span>
                    <span className="font-semibold text-slate-900">₹{Math.round(taxes).toLocaleString('en-IN')}</span>
                </div>

                {discountAmount > 0 && (
                    <div className="flex justify-between text-xs text-emerald-700 font-bold">
                        <span>Coupon Discount</span>
                        <span>-₹{Math.round(discountAmount).toLocaleString('en-IN')}</span>
                    </div>
                )}

                <div className="border-t border-slate-200 my-2 pt-2 flex justify-between items-center">
                    <span className="text-base font-extrabold text-slate-900">Total Amount</span>
                    <span className="text-lg font-black text-[#843D9B]">₹{finalTotal.toLocaleString('en-IN')}</span>
                </div>

                {/* Advance Payable Banner */}
                {!fullAdvance && (
                    <div className="space-y-2 pt-1">
                        <div className="bg-[#FAF5FF] border border-[#F3E8FF] p-3 rounded-2xl flex items-center justify-between">
                            <div>
                                <span className="text-xs font-bold text-[#843D9B] block">
                                    Advance Payable ({advancePercentage}%)
                                </span>
                                <span className="text-[9px] text-purple-600 font-bold uppercase tracking-wider">
                                    Required to confirm order
                                </span>
                            </div>
                            <span className="text-base font-black text-[#843D9B]">
                                ₹{advanceAmount.toLocaleString('en-IN')}
                            </span>
                        </div>

                        <div className="flex justify-between items-center px-1 text-xs font-medium text-slate-600">
                            <span>To Pay On Delivery</span>
                            <span className="font-bold text-slate-900">₹{remainingAmount.toLocaleString('en-IN')}</span>
                        </div>
                        <p className="text-[10px] text-slate-400 text-center">
                            Advance + on delivery = ₹{finalTotal.toLocaleString('en-IN')} (after tailor accepts)
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BillDetails;

