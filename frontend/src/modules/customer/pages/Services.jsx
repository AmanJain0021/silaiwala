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
    const clearCheckout = useCheckoutStore((s) => s.clearCheckout);
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

    // Drop stale multi-item navigation flag when basket is empty
    useEffect(() => {
        if (basketCount === 0) {
            const store = useCheckoutStore.getState();
            if (store.lockedTailorId || store.lockedTailorName) {
                useCheckoutStore.setState({ lockedTailorId: null, lockedTailorName: null });
            }
            if (location.state?.fromMultiItemBasket && !location.state?.tailorId) {
                navigate('/user/services', {
                    replace: true,
                    state: location.state?.filter ? { filter: location.state.filter } : {},
                });
            }
        }
    }, [basketCount, location.state?.fromMultiItemBasket, location.state?.tailorId, location.state?.filter, navigate]);

    // Only lock to tailor if user explicitly arrived via "+ Add another service" multi-item flow
    useEffect(() => {
        if (!basketCount || !location.state?.fromMultiItemBasket) return;
        const { tailorId, tailorName } = useCheckoutStore.getState().ensureLockedTailor({
            tailorId: lockedTailorId,
            tailorName: lockedTailorName,
        });
        if (!tailorId) return;
        if (String(location.state?.tailorId || '') === String(tailorId)) {
            return;
        }
        navigate('/user/services', {
            replace: true,
            state: {
                ...location.state,
                tailorId,
                tailorName: tailorName || 'Selected Tailor',
                fromMultiItemBasket: true,
            },
        });
    }, [basketCount, lockedTailorId, lockedTailorName, location.state, navigate]);

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
                            <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                    type="button"
                                    onClick={() => {
                                        clearCheckout();
                                        navigate('/user/services', { replace: true, state: {} });
                                        import('react-hot-toast').then(({ toast }) => {
                                            toast.success('Basket cleared');
                                        });
                                    }}
                                    className="text-[10px] font-black uppercase tracking-wider bg-white/20 hover:bg-white/30 text-white px-2.5 py-2 rounded-xl active:scale-95 cursor-pointer"
                                >
                                    Clear
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setBuyNowMode(false, null);
                                        navigate('/user/checkout/summary');
                                    }}
                                    className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-white text-primary px-3 py-2 rounded-xl shrink-0 active:scale-95 cursor-pointer"
                                >
                                    Checkout <ChevronRight size={14} />
                                </button>
                            </div>
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
