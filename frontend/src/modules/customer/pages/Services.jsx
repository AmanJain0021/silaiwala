import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ShoppingBag, ChevronRight, X } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import ServicesHeader from '../components/services/ServicesHeader';
import ServicesGrid from '../components/services/ServicesGrid';
import TrustBenefits from '../components/services/TrustBenefits';
import useCheckoutStore from '../../../store/checkoutStore';
import { getImageUrl } from '../../../utils/imageUrl';

const Services = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const queryParams = new URLSearchParams(location.search);
    const initialSearch = queryParams.get('search') || '';
    const initialFilter = location.state?.filter || 'All';

    const [searchQuery, setSearchQuery] = useState(initialSearch);
    const [activeFilter, setActiveFilter] = useState(initialFilter);
    const serviceItems = useCheckoutStore((s) => s.serviceItems);
    const removeServiceItem = useCheckoutStore((s) => s.removeServiceItem);
    const setBuyNowMode = useCheckoutStore((s) => s.setBuyNowMode);
    const lockedTailorId = useCheckoutStore((s) => s.lockedTailorId);
    const lockedTailorName = useCheckoutStore((s) => s.lockedTailorName);
    const basketCount = serviceItems?.length || 0;
    const basketTotal = (serviceItems || []).reduce((sum, item) => sum + (item.pricing?.total || 0), 0);

    useEffect(() => {
        if (location.state?.filter) {
            setActiveFilter(location.state.filter);
        }
        const currentSearch = new URLSearchParams(location.search).get('search');
        if (currentSearch !== null) {
            setSearchQuery(currentSearch);
        }
    }, [location.state, location.search]);

    // Keep services page locked to basket tailor (no other tailor catalog)
    useEffect(() => {
        if (!basketCount || !lockedTailorId) return;
        if (location.state?.tailorId === lockedTailorId && location.state?.fromMultiItemBasket) return;
        navigate('/user/services', {
            replace: true,
            state: {
                tailorId: lockedTailorId,
                tailorName: lockedTailorName || 'Selected Tailor',
                fromMultiItemBasket: true,
            },
        });
    }, [basketCount, lockedTailorId, lockedTailorName, location.state?.tailorId, location.state?.fromMultiItemBasket, navigate]);

    return (
        <div className="min-h-screen bg-white pb-28 md:pb-8 font-sans" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            <ServicesHeader 
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                activeFilter={activeFilter}
                setActiveFilter={setActiveFilter}
            />

            {basketCount > 0 && (
                <div className="sticky top-[120px] md:top-20 z-[90] px-4 md:px-6 lg:px-8 pt-2 space-y-2">
                    <div className="bg-primary text-white rounded-2xl px-4 py-3 shadow-lg shadow-primary/25">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center shrink-0">
                                    <ShoppingBag size={16} />
                                </div>
                                <div className="text-left min-w-0">
                                    <p className="text-[11px] font-black uppercase tracking-wider truncate">
                                        Basket · {basketCount} garment{basketCount > 1 ? 's' : ''}
                                    </p>
                                    <p className="text-[10px] font-semibold text-white/80">
                                        Neeche se next service choose karo · ₹{basketTotal.toLocaleString()}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => {
                                    setBuyNowMode(false, null);
                                    navigate('/user/checkout/summary');
                                }}
                                className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-white text-primary px-3 py-2 rounded-xl shrink-0 active:scale-95"
                            >
                                Checkout <ChevronRight size={14} />
                            </button>
                        </div>

                        <div className="mt-3 space-y-2 max-h-40 overflow-y-auto">
                            {serviceItems.map((item, idx) => {
                                const img = getImageUrl(
                                    item.configuration?.selectedStyle?.image ||
                                    item.serviceDetails?.image
                                );
                                const sid = item.serviceDetails?._id || item.serviceDetails?.id;
                                return (
                                    <div
                                        key={item.basketId || idx}
                                        className="flex items-center gap-2 bg-white/10 rounded-xl p-2"
                                    >
                                        <button
                                            type="button"
                                            className="flex items-center gap-2 min-w-0 flex-1 text-left"
                                            onClick={() => {
                                                if (!sid) return;
                                                navigate(`/user/services/${sid}`, {
                                                    state: {
                                                        tailorId: item.serviceDetails?.tailorId,
                                                        tailorName: item.serviceDetails?.tailorName,
                                                        editBasketIndex: idx,
                                                        restoreBasketItem: item,
                                                        fromBasket: true,
                                                    },
                                                });
                                            }}
                                        >
                                            <div className="w-9 h-11 rounded-lg overflow-hidden bg-white/20 shrink-0">
                                                {img ? (
                                                    <img src={img} alt="" className="w-full h-full object-cover" />
                                                ) : null}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[11px] font-bold truncate">
                                                    {item.serviceDetails?.title || `Item ${idx + 1}`}
                                                </p>
                                                <p className="text-[9px] text-white/70 font-semibold">
                                                    {item.configuration?.pending ? 'Pending · tap to fill' : 'Tap to edit'}
                                                </p>
                                            </div>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => removeServiceItem(idx)}
                                            className="p-1.5 rounded-lg bg-white/15 hover:bg-white/25 active:scale-95"
                                            aria-label="Remove"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            <ServicesGrid 
                searchQuery={searchQuery}
                activeFilter={activeFilter}
            />

            <TrustBenefits />
            <BottomNav />
        </div>
    );
};

export default Services;
