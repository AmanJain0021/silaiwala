import React from 'react';
import { FileText } from 'lucide-react';
import { splitAdvanceRemaining } from '../../../../../utils/checkoutBilling';

const inr = (n) => `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`;

/** Label / amount row that never overflows: label wraps, amount never shrinks. */
const Row = ({ label, sub, value, className = 'text-slate-600', valueClassName = 'font-semibold text-slate-900' }) => (
    <div className={`flex items-start justify-between gap-3 text-xs font-medium ${className}`}>
        <div className="min-w-0 flex-1 break-words">
            <span>{label}</span>
            {sub}
        </div>
        <span className={`shrink-0 whitespace-nowrap text-right ${valueClassName}`}>{value}</span>
    </div>
);

const BillDetails = ({ pricing, advancePercentage = 30, baseLabel = 'Stitching Charges' }) => {
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
        gstPercentage = 0,
        discountAmount = 0,
        couponCode = '',
        preDiscountTotal = null,
        membershipDiscount = 0,
        freeDeliveryMinOrder = 0,
        freeDeliveryApplied = false,
        isMembershipPerkApplied = false,
    } = pricing;

    const finalTotal = Math.round(Number(total) || 0);
    const couponDiscount = Math.round(Number(discountAmount) || 0);
    const memberDiscount = Math.round(Number(membershipDiscount) || 0);
    const amountBeforeCoupon = preDiscountTotal != null
        ? Math.round(Number(preDiscountTotal))
        : finalTotal + couponDiscount;
    const { advanceAmount, remainingAmount } = splitAdvanceRemaining(finalTotal, advancePercentage);
    const fullAdvance = advancePercentage >= 100;

    // Taxable value = items + platform fee − membership discount (delivery is not taxed).
    // Computed from the same lines shown above so the bill always adds up on screen.
    const taxableSubtotal = Math.max(
        0,
        Math.round(base) + Math.round(tailorAtHome) + Math.round(addons) + Math.round(fabric) + Math.round(platformFee) - memberDiscount
    );

    const minOrder = Math.round(Number(freeDeliveryMinOrder) || 0);
    const freeByThreshold = freeDeliveryApplied && minOrder > 0;
    const freeByMembership = freeDeliveryApplied && !freeByThreshold && isMembershipPerkApplied;

    return (
        <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-xs mb-4 overflow-hidden">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <FileText size={18} className="text-[#843D9B]" />
                    <span>Bill Details</span>
                </h3>
            </div>

            <div className="space-y-2.5 max-w-xl">
                <Row label={baseLabel} value={inr(base)} />

                {tailorAtHome > 0 && <Row label="Measurement Executive Fee" value={inr(tailorAtHome)} />}
                {addons > 0 && <Row label="Style Add-ons" value={inr(addons)} />}
                {fabric > 0 && <Row label="Fabric Charges" value={inr(fabric)} />}
                {platformFee > 0 && <Row label={`Platform Fee (${platformFeePercentage}%)`} value={inr(platformFee)} />}

                {memberDiscount > 0 && (
                    <Row
                        label="Membership Discount"
                        value={`-${inr(memberDiscount)}`}
                        className="text-emerald-700"
                        valueClassName="font-bold text-emerald-700"
                    />
                )}

                <Row
                    label="Subtotal (taxable)"
                    value={inr(taxableSubtotal)}
                    className="text-slate-500 pt-1.5 border-t border-dashed border-slate-200"
                    valueClassName="font-semibold text-slate-700"
                />

                <Row label={`GST (${gstPercentage}%)`} value={inr(taxes)} />

                <Row
                    label="Delivery"
                    sub={
                        freeByThreshold ? (
                            <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Free on orders {inr(minOrder)} &amp; above</p>
                        ) : freeByMembership ? (
                            <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Free with your membership</p>
                        ) : (!freeDeliveryApplied && minOrder > 0) ? (
                            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Free on orders {inr(minOrder)} &amp; above</p>
                        ) : null
                    }
                    value={delivery > 0 ? inr(delivery) : 'FREE'}
                    valueClassName={delivery > 0 ? 'font-semibold text-slate-900' : 'text-emerald-600 font-bold'}
                />

                {couponDiscount > 0 && (
                    <>
                        <Row
                            label="Amount before coupon"
                            value={inr(amountBeforeCoupon)}
                            className="text-slate-500 pt-1"
                            valueClassName="font-semibold text-slate-700"
                        />
                        <Row
                            label={`Coupon Discount${couponCode ? ` (${couponCode})` : ''}`}
                            value={`-${inr(couponDiscount)}`}
                            className="text-emerald-700 font-bold"
                            valueClassName="font-bold text-emerald-700"
                        />
                    </>
                )}

                <div className="border-t border-slate-200 my-2 pt-2 flex justify-between items-center gap-3">
                    <span className="text-base font-extrabold text-slate-900">Total Amount</span>
                    <span className="text-lg font-black text-[#843D9B] shrink-0 whitespace-nowrap">{inr(finalTotal)}</span>
                </div>

                {!fullAdvance && (
                    <div className="space-y-2 pt-1">
                        <div className="bg-[#FAF5FF] border border-[#F3E8FF] p-3 rounded-2xl flex items-center justify-between gap-3">
                            <div className="min-w-0">
                                <span className="text-xs font-bold text-[#843D9B] block">
                                    Advance Payable ({advancePercentage}%)
                                </span>
                                <span className="text-[9px] text-primary font-bold uppercase tracking-wider">
                                    Required to confirm order
                                </span>
                            </div>
                            <span className="text-base font-black text-[#843D9B] shrink-0 whitespace-nowrap">
                                {inr(advanceAmount)}
                            </span>
                        </div>

                        <Row label="To Pay On Delivery" value={inr(remainingAmount)} className="px-1 text-slate-600 items-center" valueClassName="font-bold text-slate-900" />
                        <p className="text-[10px] text-slate-400 text-center">
                            Advance + on delivery = {inr(finalTotal)} (after tailor accepts)
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BillDetails;
