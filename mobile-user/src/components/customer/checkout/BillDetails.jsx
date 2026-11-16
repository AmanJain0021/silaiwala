// Port of modules/customer/components/checkout/summary/BillDetails.jsx (converted with scripts/web2rn.js, then reviewed)
import React from "react";
import { FileText } from "lucide-react-native";
import { splitAdvanceRemaining } from "../../../utils/checkoutBilling";
import { Box, Txt, I, Scroll } from '../../ui/primitives';
const BillDetails = ({
  pricing,
  advancePercentage = 25,
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
    subtotalBeforeTax = null
  } = pricing;
  const finalTotal = Math.round(Number(total) || 0);
  const couponDiscount = Math.round(Number(discountAmount) || 0);
  const amountBeforeCoupon = preDiscountTotal != null ? Math.round(Number(preDiscountTotal)) : finalTotal + couponDiscount;
  const {
    advanceAmount,
    remainingAmount
  } = splitAdvanceRemaining(finalTotal, advancePercentage);
  const fullAdvance = advancePercentage >= 100;
  const lineItems = subtotalBeforeTax != null ? subtotalBeforeTax : base + addons + fabric + tailorAtHome + platformFee;
  return <Box className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-xs mb-4">
            <Box className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                <Txt className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <I icon={FileText} size={18} className="text-[#843D9B]" />
                    <Txt>Bill Details</Txt>
                </Txt>
            </Box>

            <Box className="space-y-2.5 max-w-xl">
                <Box className="flex justify-between text-xs text-slate-600 font-medium">
                    <Txt>{baseLabel}</Txt>
                    <Txt className="font-semibold text-slate-900">₹{Math.round(base).toLocaleString('en-IN')}</Txt>
                </Box>

                {tailorAtHome > 0 && <Box className="flex justify-between text-xs text-slate-600 font-medium">
                        <Txt>Measurement Executive Fee</Txt>
                        <Txt className="font-semibold text-slate-900">
                            ₹{Math.round(tailorAtHome).toLocaleString('en-IN')}
                        </Txt>
                    </Box>}

                {addons > 0 && <Box className="flex justify-between text-xs text-slate-600 font-medium">
                        <Txt>Style Add-ons</Txt>
                        <Txt className="font-semibold text-slate-900">₹{Math.round(addons).toLocaleString('en-IN')}</Txt>
                    </Box>}

                {fabric > 0 && <Box className="flex justify-between text-xs text-slate-600 font-medium">
                        <Txt>Fabric Charges</Txt>
                        <Txt className="font-semibold text-slate-900">₹{Math.round(fabric).toLocaleString('en-IN')}</Txt>
                    </Box>}

                {platformFee > 0 && <Box className="flex justify-between text-xs text-slate-600 font-medium">
                        <Txt>Platform Fee ({platformFeePercentage}%)</Txt>
                        <Txt className="font-semibold text-slate-900">
                            ₹{Math.round(platformFee).toLocaleString('en-IN')}
                        </Txt>
                    </Box>}

                <Box className="flex justify-between text-xs text-slate-600 font-medium">
                    <Box>
                        <Txt>Standard Delivery</Txt>
                        {(pricing.freeDeliveryMinOrder > 0 || pricing.freeDeliveryApplied) && <Txt className="text-[10px] text-emerald-600 font-medium mt-0.5">
                                Free on orders ₹{Math.round(Number(pricing.freeDeliveryMinOrder) || 0).toLocaleString('en-IN')} &amp; above
                            </Txt>}
                    </Box>
                    <Txt className={delivery > 0 ? 'font-semibold text-slate-900' : 'text-emerald-600 font-bold'}>
                        {delivery > 0 ? `₹${Math.round(delivery).toLocaleString('en-IN')}` : 'FREE'}
                    </Txt>
                </Box>

                <Box className="flex justify-between text-xs text-slate-500 font-medium pt-1.5 border-t border-dashed border-slate-200">
                    <Txt>Subtotal (before GST)</Txt>
                    <Txt className="font-semibold text-slate-700">₹{Math.round(lineItems).toLocaleString('en-IN')}</Txt>
                </Box>

                <Box className="flex justify-between text-xs text-slate-600 font-medium">
                    <Txt>GST ({gstPercentage}%)</Txt>
                    <Txt className="font-semibold text-slate-900">₹{Math.round(taxes).toLocaleString('en-IN')}</Txt>
                </Box>

                {couponDiscount > 0 && <>
                        <Box className="flex justify-between text-xs text-slate-500 font-medium pt-1">
                            <Txt>Amount before coupon</Txt>
                            <Txt className="font-semibold text-slate-700">₹{amountBeforeCoupon.toLocaleString('en-IN')}</Txt>
                        </Box>
                        <Box className="flex justify-between text-xs text-emerald-700 font-bold">
                            <Txt>Coupon Discount{couponCode ? ` (${couponCode})` : ''}</Txt>
                            <Txt>-₹{couponDiscount.toLocaleString('en-IN')}</Txt>
                        </Box>
                    </>}

                <Box className="border-t border-slate-200 my-2 pt-2 flex justify-between items-center">
                    <Txt className="text-base font-extrabold text-slate-900">Total Amount</Txt>
                    <Txt className="text-lg font-black text-[#843D9B]">₹{finalTotal.toLocaleString('en-IN')}</Txt>
                </Box>

                {!fullAdvance && <Box className="space-y-2 pt-1">
                        <Box className="bg-[#FAF5FF] border border-[#F3E8FF] p-3 rounded-2xl flex items-center justify-between">
                            <Box>
                                <Txt className="text-xs font-bold text-[#843D9B] block">
                                    Advance Payable ({advancePercentage}%)
                                </Txt>
                                <Txt className="text-[9px] text-primary font-bold uppercase tracking-wider">
                                    Required to confirm order
                                </Txt>
                            </Box>
                            <Txt className="text-base font-black text-[#843D9B]">
                                ₹{advanceAmount.toLocaleString('en-IN')}
                            </Txt>
                        </Box>

                        <Box className="flex justify-between items-center px-1 text-xs font-medium text-slate-600">
                            <Txt>To Pay On Delivery</Txt>
                            <Txt className="font-bold text-slate-900">₹{remainingAmount.toLocaleString('en-IN')}</Txt>
                        </Box>
                        <Txt className="text-[10px] text-slate-400 text-center">
                            Advance + on delivery = ₹{finalTotal.toLocaleString('en-IN')} (after tailor accepts)
                        </Txt>
                    </Box>}
            </Box>
        </Box>;
};
export default BillDetails;