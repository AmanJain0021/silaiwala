// Port of modules/customer/components/orders/CustomDesignCard.jsx (converted with scripts/web2rn.js, then reviewed)
import Razorpay from '../../../lib/razorpay';
import { RAZORPAY_KEY_ID } from '../../../lib/config';
import React from "react";
import { PenTool, ChevronRight, Calendar, CheckCircle } from "lucide-react-native";
import { useNavigate } from '../../../lib/nav';
import api from "../../../lib/api";
import toast from '../../../lib/toast';
import { Box, Btn, Img, Txt, I, Scroll } from '../../ui/primitives';
const CustomDesignCard = ({
  design,
  onPaymentSuccess
}) => {
  const navigate = useNavigate();
  const [deliveryRates, setDeliveryRates] = React.useState({
    baseFee: 49,
    perKmRate: 10
  });
  const [platformFeePercentage, setPlatformFeePercentage] = React.useState(5);
  const [gstPercentage, setGstPercentage] = React.useState(18);
  const [advancePercentage, setAdvancePercentage] = React.useState(50);
  const [distanceKm, setDistanceKm] = React.useState(null);
  React.useEffect(() => {
    const fetchDistancesAndSettings = async () => {
      if (design.quotationStatus !== 'quoted') return;
      try {
        const res = await api.get('/cms/settings');
        if (res.data.success) {
          if (res.data.data?.walletConfig?.platformFeePercentage) setPlatformFeePercentage(res.data.data.walletConfig.platformFeePercentage);
          if (res.data.data?.walletConfig?.advancePercentage) setAdvancePercentage(res.data.data.walletConfig.advancePercentage);
          if (res.data.data?.deliveryRates) setDeliveryRates(res.data.data.deliveryRates);
          if (res.data.data?.pricing?.gstPercentage !== undefined) setGstPercentage(res.data.data.pricing.gstPercentage);
        }
      } catch (err) {
        console.error("Failed to fetch settings:", err);
      }
      if (design.pickupAddress?.location?.coordinates && design.tailor?.location?.coordinates) {
        try {
          const [uLng, uLat] = design.pickupAddress.location.coordinates;
          const [tLng, tLat] = design.tailor.location.coordinates;
          const distRes = await api.post('/distance/calculate', {
            origin: [tLat, tLng],
            destination: [uLat, uLng]
          });
          if (distRes.data.success) setDistanceKm(distRes.data.data.distance);
        } catch (err) {
          console.error("Distance API calculation failed", err);
        }
      }
    };
    fetchDistancesAndSettings();
  }, [design.quotationStatus, design.pickupAddress, design.tailor]);
  let deliveryFee = deliveryRates?.baseFee || 49;
  if (distanceKm !== null && distanceKm > 0 && deliveryRates) deliveryFee = Math.round(deliveryRates.baseFee + distanceKm * deliveryRates.perKmRate);
  const baseAmount = design.quoteAmount || 0;
  const platformFee = Math.round(baseAmount * (platformFeePercentage / 100));
  const taxableAmount = baseAmount + platformFee;
  const taxes = Math.round(taxableAmount * (gstPercentage / 100));
  const finalTotal = baseAmount + deliveryFee + platformFee + taxes;
  const advancePaymentAmount = Math.round(finalTotal * (advancePercentage / 100));
  const remainingPaymentAmount = finalTotal - advancePaymentAmount;
  const handleAcceptAndPay = async e => {
    try {
      const rzpOrderRes = await api.post(`/custom-designs/${design._id}/razorpay`, {
        finalTotal
      });
      if (!rzpOrderRes.data.success) throw new Error('Razorpay order creation failed');
      const rzpOrder = rzpOrderRes.data.data;
      const options = {
        key: rzpOrder.key || RAZORPAY_KEY_ID,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        name: "SilaiWala",
        description: "Custom Design Payment",
        order_id: rzpOrder.id,
        handler: async function (response) {
          try {
            const verifyRes = await api.post(`/custom-designs/${design._id}/verify`, {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              finalTotal,
              deliveryFee,
              platformFee,
              taxes
            });
            if (verifyRes.data.success) {
              toast.success("Payment successful! Order created.");
              if (onPaymentSuccess) onPaymentSuccess();
            }
          } catch (err) {
            toast.error('Payment verification failed.');
          }
        },
        theme: {
          color: "#843D9B"
        }
      };
      const rzp = new Razorpay(options);
      rzp.on('payment.failed', function (response) {
        toast.error('Payment failed: ' + response.error.description);
      });
      rzp.open();
    } catch (err) {
      toast.error('Failed to initialize payment.');
    }
  };
  const getStatusBadgeStyle = statusStr => {
    const s = statusStr?.toLowerCase() || '';
    if (['accepted', 'paid'].includes(s)) return 'bg-green-50 text-green-600 border border-green-100';
    if (['pending'].includes(s)) return 'bg-orange-50 text-orange-500 border border-orange-100';
    if (['rejected'].includes(s)) return 'bg-red-50 text-red-500 border border-red-100';
    if (['quoted'].includes(s)) return 'bg-blue-50 text-blue-600 border border-blue-100';
    return 'bg-[#F8F5FF] text-[#843D9B] border border-[#843D9B]/10';
  };
  const formattedDate = design.createdAt ? new Date(design.createdAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  }) : "Date Unknown";
  const mainImage = design.images?.[0] || "https://placehold.co/400x500/e6e8f0/843d9b?text=Design";
  const statusText = design.quotationStatus?.replace(/-/g, ' ').toUpperCase() || 'PENDING';

  // Action Logic
  const isPaid = design.quotationStatus === 'accepted' && design.advancePaymentStatus === 'paid';
  const hasTracker = isPaid && design.linkedOrderId;
  const navigateToTrack = () => {
    if (hasTracker) navigate(`/user/orders/${design.linkedOrderId._id}/track`);
  };
  return <Box className="bg-white rounded-[1.25rem] p-3 border border-gray-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] hover:shadow-md transition-all group block relative">
            <Btn className={`block ${`flex gap-3 h-full ${hasTracker ? 'cursor-pointer' : ''}`}`} onPress={hasTracker ? navigateToTrack : undefined}>
                {/* Left: Large Image */}
                <Box className="w-[85px] shrink-0">
                    <Box className="w-full aspect-[3/4] rounded-xl overflow-hidden bg-gray-50 border border-gray-100 relative">
                        <Img src={mainImage} alt="Design" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" fallback="https://placehold.co/400x500/e6e8f0/843d9b?text=Design" />
                    </Box>
                </Box>

                {/* Right: Content Stack */}
                <Box className="flex-1 min-w-0 flex flex-col">
                    {/* Row 1: Status, ID, Price */}
                    <Box className="flex items-start justify-between gap-1 mb-1">
                        <Box className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
                            <Txt className={`text-[8px] sm:text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap ${getStatusBadgeStyle(design.quotationStatus)}`}>
                                {statusText}
                            </Txt>
                            <Txt className="text-[9px] font-bold text-gray-400 whitespace-nowrap">
                                #{design.customDesignId}
                            </Txt>
                        </Box>
                        {design.quoteAmount && <Txt className="text-[13px] font-black text-[#843D9B] shrink-0 ml-1">₹{design.quoteAmount}</Txt>}
                    </Box>

                    {/* Row 2: Title & Arrow */}
                    <Box className="flex justify-between items-center mb-1.5 mt-0.5">
                        <Txt className="text-[13px] sm:text-sm font-black text-gray-900 uppercase tracking-tight line-clamp-1 pr-2">
                            CUSTOM DESIGN
                        </Txt>
                        {hasTracker && <I icon={ChevronRight} size={14} className="text-gray-300 shrink-0 group-hover:text-[#843D9B] transition-colors" />}
                    </Box>

                    {/* Row 3: Date and Detail */}
                    <Box className="flex items-center gap-3.5 text-[9px] sm:text-[10px] font-semibold text-gray-500 mb-2">
                        <Box className="flex items-center gap-1 shrink-0">
                            <I icon={Calendar} size={11} className="text-gray-400" />
                            {formattedDate}
                        </Box>
                        <Box className="flex items-center gap-1 truncate text-gray-400">
                            Tailor: <Txt className="font-bold text-gray-700 truncate">{design.tailor?.shopName || 'Assigned'}</Txt>
                        </Box>
                    </Box>
                    <Txt className="text-[10px] text-gray-500 line-clamp-2 mb-2 italic">"{design.description}"</Txt>

                    {/* Row 4: Action Button or Info */}
                    <Box className="flex items-center justify-between gap-2 mt-auto pt-2 border-t border-gray-50/50">
                        {isPaid ? <Box className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-50 text-green-600 text-[8px] font-black uppercase tracking-wider shrink-0 shadow-sm border border-green-100">
                                <I icon={CheckCircle} size={10} /> Paid Advance
                            </Box> : <Box className="flex items-center gap-1 px-2 py-1 rounded-full border border-gray-200 text-gray-500 text-[8px] font-black uppercase tracking-wider bg-gray-50 shrink-0">
                                <I icon={PenTool} size={10} /> Needs Tailor Review
                            </Box>}
                    </Box>
                </Box>
            </Btn>

            {/* Payment Summary Box (Only if quoted) */}
            {design.quotationStatus === 'quoted' && <Box className="mt-3 pt-3 border-t border-gray-100">
                    <Box className="bg-gray-50/80 rounded-xl p-3 border border-gray-100 mb-2">
                        <Box className="flex justify-between items-center mb-1">
                            <Txt className="text-[10px] font-semibold text-gray-500">Service Quote</Txt>
                            <Txt className="text-[10px] font-bold text-gray-900">₹{baseAmount}</Txt>
                        </Box>
                        <Box className="flex justify-between items-center mb-1">
                            <Txt className="text-[10px] font-semibold text-gray-500">Delivery & Pickup {distanceKm > 0 && `(${distanceKm.toFixed(1)} km)`}</Txt>
                            <Txt className="text-[10px] font-bold text-gray-900">₹{deliveryFee}</Txt>
                        </Box>
                        <Box className="flex justify-between items-center mb-1">
                            <Txt className="text-[10px] font-semibold text-gray-500">Platform Fee</Txt>
                            <Txt className="text-[10px] font-bold text-gray-900">₹{platformFee}</Txt>
                        </Box>
                        <Box className="flex justify-between items-center mb-1">
                            <Txt className="text-[10px] font-semibold text-gray-500">Taxes ({gstPercentage}%)</Txt>
                            <Txt className="text-[10px] font-bold text-gray-900">₹{taxes}</Txt>
                        </Box>
                        <Box className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200">
                            <Txt className="text-[10px] font-black text-gray-900 uppercase">Project Total</Txt>
                            <Txt className="text-[10px] font-black text-gray-900">₹{finalTotal}</Txt>
                        </Box>
                        <Box className="flex justify-between items-center mt-1">
                            <Txt className="text-[11px] font-black text-[#843D9B]">Advance to Pay ({advancePercentage}%)</Txt>
                            <Txt className="text-[12px] font-black text-[#843D9B]">₹{advancePaymentAmount}</Txt>
                        </Box>
                        <Box className="flex justify-between items-center mt-0.5">
                            <Txt className="text-[9px] text-gray-500 font-medium">Pay on Delivery</Txt>
                            <Txt className="text-[9px] text-gray-500 font-bold">₹{remainingPaymentAmount}</Txt>
                        </Box>
                    </Box>
                    <Btn onPress={handleAcceptAndPay} className="w-full bg-[#843D9B] text-white py-2.5 rounded-[10px] text-[11px] font-black uppercase tracking-wider hover:bg-[#6b2a80] transition-colors shadow-sm">
                        Pay Advance ₹{advancePaymentAmount}
                    </Btn>
                </Box>}
        </Box>;
};
export default CustomDesignCard;
