import React, { useEffect, useState } from 'react';
import { Tag, ArrowLeft, Percent, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../../utils/api';

const Coupons = () => {
    const navigate = useNavigate();
    const [offers, setOffers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const res = await api.get('/customers/promo-codes');
                setOffers(res.data?.data || []);
            } catch (err) {
                if (err?.name !== 'CanceledError') setOffers([]);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 pb-24">
            <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center cursor-pointer"
                >
                    <ArrowLeft size={18} className="text-gray-700" />
                </button>
                <h1 className="text-sm md:text-xl font-black text-gray-900">My Coupons & Offers</h1>
            </div>

            <div className="max-w-lg mx-auto px-4 py-6">
                {loading ? (
                    <div className="flex justify-center py-16 text-gray-400 gap-2 text-xs font-bold">
                        <Loader2 size={18} className="animate-spin" /> Loading…
                    </div>
                ) : offers.length === 0 ? (
                    <div className="text-center py-16 px-6">
                        <div className="w-16 h-16 bg-purple-50 text-[#843D9B] rounded-full flex items-center justify-center mx-auto mb-4">
                            <Tag size={28} />
                        </div>
                        <h2 className="text-xl font-black text-gray-900 mb-3">No Coupons Available</h2>
                        <p className="text-sm text-gray-500 font-medium">
                            You don't have any active coupons right now. Check back later for exciting offers and
                            discounts!
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {offers.map((offer) => (
                            <div
                                key={offer.code}
                                className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center gap-3 shadow-xs"
                            >
                                <div className="w-11 h-11 rounded-xl bg-purple-50 text-[#843D9B] flex items-center justify-center shrink-0">
                                    <Percent size={18} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-sm font-black text-gray-900 tracking-wide">
                                            {offer.code}
                                        </span>
                                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                                            {offer.discountType === 'percentage'
                                                ? `${offer.discountValue}% OFF`
                                                : `₹${offer.discountValue} OFF`}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {offer.description ||
                                            (offer.minOrderAmount
                                                ? `Min order ₹${offer.minOrderAmount}`
                                                : 'Valid at checkout')}
                                    </p>
                                </div>
                            </div>
                        ))}
                        <p className="text-[11px] text-center text-gray-400 font-medium pt-2">
                            Apply these codes on the checkout summary page
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Coupons;
