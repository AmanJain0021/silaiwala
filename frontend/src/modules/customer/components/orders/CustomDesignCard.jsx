import React from 'react';
import { PenTool, ChevronRight, Calendar, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../../../utils/api';
import toast from 'react-hot-toast';

const CustomDesignCard = ({ design, onPaymentSuccess }) => {
    const navigate = useNavigate();

    const [deliveryRates, setDeliveryRates] = React.useState({ baseFee: 49, perKmRate: 10 });
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
            } catch (err) { console.error("Failed to fetch settings:", err); }

            if (design.pickupAddress?.location?.coordinates && design.tailor?.location?.coordinates) {
                try {
                    const [uLng, uLat] = design.pickupAddress.location.coordinates;
                    const [tLng, tLat] = design.tailor.location.coordinates;
                    const distRes = await api.post('/distance/calculate', { origin: [tLat, tLng], destination: [uLat, uLng] });
                    if (distRes.data.success) setDistanceKm(distRes.data.data.distance);
                } catch (err) { console.error("Distance API calculation failed", err); }
            }
        };
        fetchDistancesAndSettings();
    }, [design.quotationStatus, design.pickupAddress, design.tailor]);

    let deliveryFee = deliveryRates?.baseFee || 49;
    if (distanceKm !== null && distanceKm > 0 && deliveryRates) deliveryFee = Math.round(deliveryRates.baseFee + (distanceKm * deliveryRates.perKmRate));

    const baseAmount = design.quoteAmount || 0;
    const platformFee = Math.round(baseAmount * (platformFeePercentage / 100));
    const taxableAmount = baseAmount + platformFee;
    const taxes = Math.round(taxableAmount * (gstPercentage / 100));
    const finalTotal = baseAmount + deliveryFee + platformFee + taxes;
    
    const advancePaymentAmount = Math.round(finalTotal * (advancePercentage / 100));
    const remainingPaymentAmount = finalTotal - advancePaymentAmount;

    const handleAcceptAndPay = async (e) => {
        e.preventDefault();
        try {
            const rzpOrderRes = await api.post(`/custom-designs/${design._id}/razorpay`, { finalTotal });
            if (!rzpOrderRes.data.success) throw new Error('Razorpay order creation failed');
            const rzpOrder = rzpOrderRes.data.data;

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_8sYbzHWidwe5Zw',
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
                            finalTotal, deliveryFee, platformFee, taxes
                        });
                        if (verifyRes.data.success) {
                            toast.success("Payment successful! Order created.");
                            if (onPaymentSuccess) onPaymentSuccess();
                        }
                    } catch (err) {
                        toast.error('Payment verification failed.');
                    }
                },
                theme: { color: "#843D9B" }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response) { toast.error('Payment failed: ' + response.error.description); });
            rzp.open();
        } catch (err) { toast.error('Failed to initialize payment.'); }
    };

    const getStatusBadgeStyle = (statusStr) => {
        const s = statusStr?.toLowerCase() || '';
        if (['accepted', 'paid'].includes(s)) return 'bg-green-50 text-green-600 border border-green-100';
        if (['pending'].includes(s)) return 'bg-orange-50 text-orange-500 border border-orange-100';
        if (['rejected'].includes(s)) return 'bg-red-50 text-red-500 border border-red-100';
        if (['quoted'].includes(s)) return 'bg-blue-50 text-blue-600 border border-blue-100';
        return 'bg-[#F8F5FF] text-[#843D9B] border border-[#843D9B]/10';
    };

    const formattedDate = design.createdAt ? new Date(design.createdAt).toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short', year: 'numeric'
    }) : "Date Unknown";

    const mainImage = design.images?.[0] || "https://placehold.co/400x500/e6e8f0/843d9b?text=Design";
    const statusText = design.quotationStatus?.replace(/-/g, ' ').toUpperCase() || 'PENDING';
    
    // Action Logic
    const isPaid = design.quotationStatus === 'accepted' && design.advancePaymentStatus === 'paid';
    const hasTracker = isPaid && design.linkedOrderId;

    const navigateToTrack = () => {
        if (hasTracker) navigate(`/user/orders/${design.linkedOrderId._id}/track`);
    };

    return (
        <div className="bg-white rounded-[1.25rem] p-3 border border-gray-100 shadow-[0_2px_10px_rgb(0,0,0,0.02)] hover:shadow-md transition-all group block relative">
            <div 
                className={`flex gap-3 h-full ${hasTracker ? 'cursor-pointer' : ''}`}
                onClick={hasTracker ? navigateToTrack : undefined}
            >
                {/* Left: Large Image */}
                <div className="w-[85px] shrink-0">
                    <div className="w-full aspect-[3/4] rounded-xl overflow-hidden bg-gray-50 border border-gray-100 relative">
                        <img
                            src={mainImage}
                            alt="Design"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            onError={(e) => { e.target.onerror = null; e.target.src = 'https://placehold.co/400x500/e6e8f0/843d9b?text=Design'; }}
                        />
                    </div>
                </div>

                {/* Right: Content Stack */}
                <div className="flex-1 min-w-0 flex flex-col">
                    {/* Row 1: Status, ID, Price */}
                    <div className="flex items-start justify-between gap-1 mb-1">
                        <div className="flex items-center gap-2 flex-wrap flex-1 min-w-0">
                            <span className={`text-[8px] sm:text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded shadow-sm whitespace-nowrap ${getStatusBadgeStyle(design.quotationStatus)}`}>
                                {statusText}
                            </span>
                            <span className="text-[9px] font-bold text-gray-400 whitespace-nowrap">
                                #{design.customDesignId}
                            </span>
                        </div>
                        {design.quoteAmount && (
                            <span className="text-[13px] font-black text-[#843D9B] shrink-0 ml-1">₹{design.quoteAmount}</span>
                        )}
                    </div>

                    {/* Row 2: Title & Arrow */}
                    <div className="flex justify-between items-center mb-1.5 mt-0.5">
                        <h3 className="text-[13px] sm:text-sm font-black text-gray-900 uppercase tracking-tight line-clamp-1 pr-2">
                            CUSTOM DESIGN
                        </h3>
                        {hasTracker && <ChevronRight size={14} className="text-gray-300 shrink-0 group-hover:text-[#843D9B] transition-colors" />}
                    </div>

                    {/* Row 3: Date and Detail */}
                    <div className="flex items-center gap-3.5 text-[9px] sm:text-[10px] font-semibold text-gray-500 mb-2">
                        <div className="flex items-center gap-1 shrink-0">
                            <Calendar size={11} className="text-gray-400" />
                            {formattedDate}
                        </div>
                        <div className="flex items-center gap-1 truncate text-gray-400">
                            Tailor: <span className="font-bold text-gray-700 truncate">{design.tailor?.shopName || 'Assigned'}</span>
                        </div>
                    </div>
                    <p className="text-[10px] text-gray-500 line-clamp-2 mb-2 italic">"{design.description}"</p>

                    {/* Row 4: Action Button or Info */}
                    <div className="flex items-center justify-between gap-2 mt-auto pt-2 border-t border-gray-50/50">
                        {isPaid ? (
                            <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-50 text-green-600 text-[8px] font-black uppercase tracking-wider shrink-0 shadow-sm border border-green-100">
                                <CheckCircle size={10} /> Paid Advance
                            </div>
                        ) : (
                            <div className="flex items-center gap-1 px-2 py-1 rounded-full border border-gray-200 text-gray-500 text-[8px] font-black uppercase tracking-wider bg-gray-50 shrink-0">
                                <PenTool size={10} /> Needs Tailor Review
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Payment Summary Box (Only if quoted) */}
            {design.quotationStatus === 'quoted' && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100 mb-2">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-semibold text-gray-500">Service Quote</span>
                            <span className="text-[10px] font-bold text-gray-900">₹{baseAmount}</span>
                        </div>
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-semibold text-gray-500">Delivery & Pickup {distanceKm > 0 && `(${distanceKm.toFixed(1)} km)`}</span>
                            <span className="text-[10px] font-bold text-gray-900">₹{deliveryFee}</span>
                        </div>
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-semibold text-gray-500">Platform Fee</span>
                            <span className="text-[10px] font-bold text-gray-900">₹{platformFee}</span>
                        </div>
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-semibold text-gray-500">Taxes ({gstPercentage}%)</span>
                            <span className="text-[10px] font-bold text-gray-900">₹{taxes}</span>
                        </div>
                        <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-200">
                            <span className="text-[10px] font-black text-gray-900 uppercase">Project Total</span>
                            <span className="text-[10px] font-black text-gray-900">₹{finalTotal}</span>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                            <span className="text-[11px] font-black text-[#843D9B]">Advance to Pay ({advancePercentage}%)</span>
                            <span className="text-[12px] font-black text-[#843D9B]">₹{advancePaymentAmount}</span>
                        </div>
                        <div className="flex justify-between items-center mt-0.5">
                            <span className="text-[9px] text-gray-500 font-medium">Pay on Delivery</span>
                            <span className="text-[9px] text-gray-500 font-bold">₹{remainingPaymentAmount}</span>
                        </div>
                    </div>
                    <button 
                        onClick={handleAcceptAndPay}
                        className="w-full bg-[#843D9B] text-white py-2.5 rounded-[10px] text-[11px] font-black uppercase tracking-wider hover:bg-[#6b2a80] transition-colors shadow-sm"
                    >
                        Pay Advance ₹{advancePaymentAmount}
                    </button>
                </div>
            )}
        </div>
    );
};

export default CustomDesignCard;
