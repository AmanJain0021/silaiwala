// Port of modules/customer/components/checkout/summary/BillDetails.jsx (converted with scripts/web2rn.js, then reviewed)
import React from "react";
import { FileText } from "lucide-react-native";
import { splitAdvanceRemaining } from "../../../utils/checkoutBilling";
import { Box, Txt, I } from '../../ui/primitives';

const inr = n => `₹${Math.round(Number(n) || 0).toLocaleString('en-IN')}`;

/** Label / amount row that never overflows: label wraps, amount never shrinks. */
const Row = ({
  label,
  sub,
  value,
  className = 'text-slate-600',
  valueClassName = 'font-semibold text-slate-900'
}) => <Box className={`flex flex-row items-start justify-between gap-3 ${className}`}>
    <Box className="flex-1 min-w-0">
      <Txt className={`text-xs font-medium ${className}`}>{label}</Txt>
      {sub}
    </Box>
    <Txt className={`text-xs shrink-0 text-right ${valueClassName}`} numberOfLines={1}>{value}</Txt>
  </Box>;

const BillDetails = ({
  pricing,
  advancePercentage = 30,
  baseLabel = 'Stitching Charges'
}) => {
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
    isMembershipPerkApplied = false
  } = pricing;
  const finalTotal = Math.round(Number(total) || 0);
  const couponDiscount = Math.round(Number(discountAmount) || 0);
  const memberDiscount = Math.round(Number(membershipDiscount) || 0);
  const amountBeforeCoupon = preDiscountTotal != null ? Math.round(Number(preDiscountTotal)) : finalTotal + couponDiscount;
  const {
    advanceAmount,
    remainingAmount
  } = splitAdvanceRemaining(finalTotal, advancePercentage);
  const fullAdvance = advancePercentage >= 100;

  // Taxable value = items + platform fee − membership discount (delivery is not taxed),
  // built from the lines shown so the bill always adds up on screen.
  const taxableSubtotal = Math.max(0, Math.round(base) + Math.round(tailorAtHome) + Math.round(addons) + Math.round(fabric) + Math.round(platformFee) - memberDiscount);
  const minOrder = Math.round(Number(freeDeliveryMinOrder) || 0);
  const freeByThreshold = freeDeliveryApplied && minOrder > 0;
  const freeByMembership = freeDeliveryApplied && !freeByThreshold && isMembershipPerkApplied;
  const deliveryHint = freeByThreshold ? <Txt className="text-[10px] text-emerald-600 font-medium mt-0.5">Free on orders {inr(minOrder)} & above</Txt> : freeByMembership ? <Txt className="text-[10px] text-emerald-600 font-medium mt-0.5">Free with your membership</Txt> : !freeDeliveryApplied && minOrder > 0 ? <Txt className="text-[10px] text-slate-400 font-medium mt-0.5">Free on orders {inr(minOrder)} & above</Txt> : null;

  return <Box className="bg-white rounded-3xl p-4 border border-slate-100 shadow-xs mb-4 overflow-hidden">
            <Box className="flex flex-row items-center justify-between mb-4 pb-2 border-b border-slate-100">
                <Box className="flex flex-row items-center gap-2">
                    <I icon={FileText} size={18} className="text-[#843D9B]" />
                    <Txt className="text-sm font-bold text-slate-900">Bill Details</Txt>
                </Box>
            </Box>

            <Box className="space-y-2.5">
                <Row label={baseLabel} value={inr(base)} />
                {tailorAtHome > 0 && <Row label="Measurement Executive Fee" value={inr(tailorAtHome)} />}
                {addons > 0 && <Row label="Style Add-ons" value={inr(addons)} />}
                {fabric > 0 && <Row label="Fabric Charges" value={inr(fabric)} />}
                {platformFee > 0 && <Row label={`Platform Fee (${platformFeePercentage}%)`} value={inr(platformFee)} />}
                {memberDiscount > 0 && <Row label="Membership Discount" value={`-${inr(memberDiscount)}`} className="text-emerald-700" valueClassName="font-bold text-emerald-700" />}

                <Box className="pt-1.5 border-t border-dashed border-slate-200">
                    <Row label="Subtotal (taxable)" value={inr(taxableSubtotal)} className="text-slate-500" valueClassName="font-semibold text-slate-700" />
                </Box>

                <Row label={`GST (${gstPercentage}%)`} value={inr(taxes)} />

                <Row label="Delivery" sub={deliveryHint} value={delivery > 0 ? inr(delivery) : 'FREE'} valueClassName={delivery > 0 ? 'font-semibold text-slate-900' : 'text-emerald-600 font-bold'} />

                {couponDiscount > 0 && <>
                        <Row label="Amount before coupon" value={inr(amountBeforeCoupon)} className="text-slate-500" valueClassName="font-semibold text-slate-700" />
                        <Row label={`Coupon Discount${couponCode ? ` (${couponCode})` : ''}`} value={`-${inr(couponDiscount)}`} className="text-emerald-700" valueClassName="font-bold text-emerald-700" />
                    </>}

                <Box className="border-t border-slate-200 my-2 pt-2 flex flex-row justify-between items-center gap-3">
                    <Txt className="text-base font-extrabold text-slate-900 flex-1">Total Amount</Txt>
                    <Txt className="text-lg font-black text-[#843D9B] shrink-0" numberOfLines={1}>{inr(finalTotal)}</Txt>
                </Box>

                {!fullAdvance && <Box className="space-y-2 pt-1">
                        <Box className="bg-[#FAF5FF] border border-[#F3E8FF] p-3 rounded-2xl flex flex-row items-center justify-between gap-3">
                            <Box className="flex-1 min-w-0">
                                <Txt className="text-xs font-bold text-[#843D9B]">
                                    Advance Payable ({advancePercentage}%)
                                </Txt>
                                <Txt className="text-[9px] text-primary font-bold uppercase tracking-wider">
                                    Required to confirm order
                                </Txt>
                            </Box>
                            <Txt className="text-base font-black text-[#843D9B] shrink-0" numberOfLines={1}>
                                {inr(advanceAmount)}
                            </Txt>
                        </Box>

                        <Box className="px-1">
                            <Row label="To Pay On Delivery" value={inr(remainingAmount)} valueClassName="font-bold text-slate-900" />
                        </Box>
                        <Txt className="text-[10px] text-slate-400 text-center">
                            Advance + on delivery = {inr(finalTotal)} (after tailor accepts)
                        </Txt>
                    </Box>}
            </Box>
        </Box>;
};
export default BillDetails;
