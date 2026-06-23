import React from 'react';
import { Clock, Ruler, ChevronRight, CheckCircle, IndianRupee } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../../../utils/api';
import toast from 'react-hot-toast';

const AlterationCard = ({ alteration, onPaymentSuccess }) => {
    const navigate = useNavigate();

    const handleAcceptAndPay = async () => {
        try {
            const rzpOrderRes = await api.post(`/alterations/${alteration._id}/razorpay`);
            if (!rzpOrderRes.data.success) throw new Error('Razorpay order creation failed');
            const rzpOrder = rzpOrderRes.data.data;

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_8sYbzHWidwe5Zw',
                amount: rzpOrder.amount,
                currency: rzpOrder.currency,
                name: "SilaiWala",
                description: "Alteration Payment",
                order_id: rzpOrder.id,
                handler: async function (response) {
                    try {
                        const verifyRes = await api.post(`/alterations/${alteration._id}/verify`, {
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature
                        });

                        if (verifyRes.data.success) {
                            toast.success("Payment successful! Order created.");
                            if (onPaymentSuccess) onPaymentSuccess();
                        }
                    } catch (err) {
                        console.error('Verification failed:', err);
                        toast.error('Payment verification failed.');
                    }
                },
                theme: { color: "#843D9B" }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function (response) {
                toast.error('Payment failed: ' + response.error.description);
            });
            rzp.open();
        } catch (err) {
            console.error('Payment initialization failed:', err);
            toast.error('Failed to initialize payment.');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'quoted': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'accepted': return 'bg-green-100 text-green-700 border-green-200';
            case 'rejected': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    return (
        <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm relative overflow-hidden flex flex-col gap-3">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                        <Ruler size={14} className="text-[#843D9B]" />
                    </div>
                    <div>
                        <p className="text-[10px] text-gray-500 font-medium">Alteration ID</p>
                        <h3 className="text-sm font-bold text-gray-900">{alteration.alterationId}</h3>
                    </div>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(alteration.quotationStatus)}`}>
                    {alteration.quotationStatus}
                </span>
            </div>

            <div className="bg-gray-50 rounded-xl p-3 flex gap-3 items-center">
                <div className="w-12 h-12 rounded-lg bg-gray-200 overflow-hidden shrink-0">
                    {alteration.images && alteration.images[0] && (
                        <img src={alteration.images[0]} alt="Garment" className="w-full h-full object-cover" />
                    )}
                </div>
                <div className="flex-1">
                    <p className="text-xs text-gray-700 line-clamp-2">{alteration.description}</p>
                </div>
            </div>

            <div className="flex justify-between items-end mt-1">
                <div>
                    <p className="text-[10px] text-gray-500">Tailor</p>
                    <p className="text-xs font-bold text-gray-900">{alteration.tailor?.name || 'Assigned Tailor'}</p>
                </div>
                {alteration.quotationStatus === 'quoted' && (
                    <div className="text-right">
                        <p className="text-[10px] text-gray-500">Quote Amount</p>
                        <p className="text-sm font-bold text-[#843D9B]">₹{alteration.quoteAmount}</p>
                    </div>
                )}
                {alteration.quotationStatus === 'accepted' && alteration.paymentStatus === 'paid' && (
                    <div className="text-right">
                        <p className="text-[10px] text-green-600 font-bold flex items-center justify-end gap-1"><CheckCircle size={12}/> Paid ₹{alteration.quoteAmount}</p>
                        {alteration.linkedOrderId && (
                            <button onClick={() => navigate(`/user/orders/${alteration.linkedOrderId._id}/track`)} className="text-[10px] text-[#843D9B] font-bold underline mt-1">Track Order</button>
                        )}
                    </div>
                )}
            </div>

            {alteration.quotationStatus === 'quoted' && (
                <div className="mt-2 pt-3 border-t border-gray-100 flex gap-2">
                    <button 
                        onClick={handleAcceptAndPay}
                        className="flex-1 bg-[#843D9B] text-white py-2.5 rounded-xl text-xs font-bold hover:bg-[#1E1F4D] transition-colors"
                    >
                        Accept & Pay ₹{alteration.quoteAmount}
                    </button>
                </div>
            )}
        </div>
    );
};

export default AlterationCard;
