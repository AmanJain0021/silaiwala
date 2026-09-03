import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { useRequireAuth } from '../../../hooks/useRequireAuth';
import BookingStepper from '../components/BookingStepper';
import { ArrowLeft, ChevronDown, ChevronUp, ChevronRight, Clock, ShoppingBag, Ruler, CheckCircle2, ShieldCheck, Info, Tag, Scissors, Wand2, MapPin, X, Upload, Camera, Image as ImageIcon, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../utils/cn';
import ServiceHero from '../components/service-detail/ServiceHero';
import DeliverySelector from '../components/service-detail/DeliverySelector';
import MeasurementSelector from '../components/service-detail/MeasurementSelector';
import FabricSelector from '../components/service-detail/FabricSelector';
import DesignUpload from '../components/service-detail/DesignUpload';
import PriceSummary from '../components/service-detail/PriceSummary';
import StyleAddonModal from '../components/service-detail/StyleAddonModal';
import useCheckoutStore from '../../../store/checkoutStore';
import useCartStore from '../../../store/cartStore';
import useMeasurementStore from '../../../store/measurementStore';
import useLocationStore from '../../../store/locationStore';
import useAddressStore from '../../../store/userStore';
import { calculateDistance } from '../../../utils/distance';
import api from '../../../utils/api';
import { getImageUrl } from '../../../utils/imageUrl';
import { sanitizeMeasurementFields } from '../../../utils/measurementFields';

const FAQItem = ({ question, answer }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="border-b border-gray-100 last:border-0">
            <button
                className="w-full flex justify-between items-center py-3 text-left group"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="text-base font-bold text-gray-800 group-hover:text-primary transition-colors">{question}</span>
                {isOpen ? <ChevronUp size={16} className="text-primary" /> : <ChevronDown size={16} className="text-gray-400" />}
            </button>
            <motion.div
                initial={false}
                animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
                className="overflow-hidden"
            >
                <p className="text-[11px] text-gray-500 pb-4 leading-relaxed font-medium">{answer}</p>
            </motion.div>
        </div>
    );
};

const ServiceDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { 
        initializeCheckout, 
        addServiceItem,
        selectServiceIntoBasket,
        serviceItems,
        removeServiceItem,
        updateServiceItem,
        setBuyNowMode,
        serviceDetails: storedDetails 
    } = useCheckoutStore(state => state);
    const cartItems = useCartStore(state => state.items);
    const addMeasurement = useMeasurementStore(state => state.addMeasurement);
    const { requireAuth } = useRequireAuth();

    const [isLoading, setIsLoading] = useState(true);
    const [serviceData, setServiceData] = useState(null);
    const [preSelectedTailor, setPreSelectedTailor] = useState(null);
    const [storeHydrated, setStoreHydrated] = useState(
        () => useCheckoutStore.persist?.hasHydrated?.() ?? true
    );
    const [activeBasketIndex, setActiveBasketIndex] = useState(
        typeof location.state?.editBasketIndex === 'number' ? location.state.editBasketIndex : null
    );

    // SessionStorage Draft Persistence across page refreshes
    const getSavedDraft = () => {
        if (!id) return {};
        try {
            const saved = sessionStorage.getItem(`service_draft_${id}`);
            return saved ? JSON.parse(saved) : {};
        } catch (e) {
            return {};
        }
    };
    const savedDraft = getSavedDraft();
    const restored = location.state?.restoredState || (Object.keys(savedDraft).length > 0 ? savedDraft : {});
    const editBasketIndex =
        activeBasketIndex != null
            ? activeBasketIndex
            : (typeof location.state?.editBasketIndex === 'number' ? location.state.editBasketIndex : null);
    const restoreBasketItem = location.state?.restoreBasketItem || null;

    // Wait for zustand persist so basket items don't "disappear" on first paint
    useEffect(() => {
        const persistApi = useCheckoutStore.persist;
        if (!persistApi?.onFinishHydration) {
            setStoreHydrated(true);
            return undefined;
        }
        if (persistApi.hasHydrated?.()) {
            setStoreHydrated(true);
            return undefined;
        }
        const unsub = persistApi.onFinishHydration(() => setStoreHydrated(true));
        return unsub;
    }, []);

    // Opening a service = it must appear in basket on this page (pending until measurements done)
    useEffect(() => {
        if (!storeHydrated || !serviceData?._id) return;

        const tailorId =
            location.state?.tailorId ||
            preSelectedTailor?._id ||
            preSelectedTailor?.id ||
            useCheckoutStore.getState().lockedTailorId ||
            (typeof serviceData.tailor === 'object'
                ? serviceData.tailor?._id || serviceData.tailor?.id
                : serviceData.tailor) ||
            null;
        const tailorName =
            location.state?.tailorName ||
            preSelectedTailor?.shopName ||
            useCheckoutStore.getState().lockedTailorName ||
            serviceData.tailor?.shopName ||
            'Tailor Partner';

        if (typeof location.state?.editBasketIndex === 'number') {
            setActiveBasketIndex(location.state.editBasketIndex);
            return;
        }

        const sid = String(serviceData._id);
        const items = useCheckoutStore.getState().serviceItems;
        const pendingIdx = items.findIndex((row) => {
            const id = String(row.serviceDetails?._id || row.serviceDetails?.id || '');
            return id === sid && row.configuration?.pending;
        });
        if (pendingIdx >= 0) {
            setActiveBasketIndex(pendingIdx);
            return;
        }

        // Already have a completed row for this service — don't auto-overwrite it
        const completedIdx = items.findIndex((row) => {
            const id = String(row.serviceDetails?._id || row.serviceDetails?.id || '');
            return id === sid && !row.configuration?.pending;
        });
        if (completedIdx >= 0) {
            return;
        }

        const { index, item, blocked } = selectServiceIntoBasket(serviceData, { tailorId, tailorName });
        if (blocked || index < 0 || !item) return;
        setActiveBasketIndex(index);
    }, [storeHydrated, serviceData?._id, preSelectedTailor, location.state?.tailorId, location.state?.editBasketIndex, selectServiceIntoBasket]);

    const [currentStep, setCurrentStep] = useState(restored.currentStep || 'fabric'); // fabric -> details -> review

    const [deliveryType, setDeliveryType] = useState(
        restoreBasketItem?.configuration?.deliveryType || restored.deliveryType || 'standard'
    );
    const [measurementType, setMeasurementType] = useState(
        restoreBasketItem?.configuration?.measurements?.type || restored.measurementType || null
    );
    const [selectedStyle, setSelectedStyle] = useState(
        restoreBasketItem?.configuration?.selectedStyle || restored.selectedStyle || null
    );
    const [isTailorAtHome, setIsTailorAtHome] = useState(
        restoreBasketItem?.configuration?.isTailorAtHome || restored.isTailorAtHome || false
    );
    const [selectedAddons, setSelectedAddons] = useState(
        restoreBasketItem?.configuration?.addons || restored.selectedAddons || []
    );
    const [isUploadingCustomStyle, setIsUploadingCustomStyle] = useState(false);

    const handleCustomStyleUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploadingCustomStyle(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('image', file);

            let imageUrl = null;

            // 1. Try protected /upload endpoint
            try {
                const res = await api.post('/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                if (res.data?.success && res.data?.data) {
                    imageUrl = res.data.data;
                }
            } catch (authErr) {
                console.warn('Protected /upload failed, attempting public upload:', authErr);
                // 2. Try public upload endpoint as fallback
                try {
                    const pubRes = await api.post('/upload/public', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                    if (pubRes.data?.success && pubRes.data?.data) {
                        imageUrl = pubRes.data.data;
                    }
                } catch (pubErr) {
                    console.warn('Public upload endpoint failed:', pubErr);
                }
            }

            // 3. Ultimate Fallback: Base64 FileReader Data URL
            if (!imageUrl) {
                imageUrl = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.onerror = () => resolve(null);
                    reader.readAsDataURL(file);
                });
            }

            if (imageUrl) {
                setSelectedStyle({
                    name: 'Custom Reference Design',
                    image: imageUrl,
                    isCustom: true,
                    description: 'Customer uploaded reference design photo'
                });
                import('react-hot-toast').then(({ toast }) => {
                    toast.success('Style reference photo uploaded!');
                });
            } else {
                import('react-hot-toast').then(({ toast }) => {
                    toast.error('Failed to upload style photo.');
                });
            }
        } catch (err) {
            console.error('Failed to upload custom style image:', err);
            import('react-hot-toast').then(({ toast }) => {
                toast.error('Upload failed. Please try again.');
            });
        } finally {
            setIsUploadingCustomStyle(false);
        }
    };
    const [isAddonModalOpen, setIsAddonModalOpen] = useState(false);
    const [fabricSource, setFabricSource] = useState(
        restoreBasketItem?.configuration?.fabricSource || restored.fabricSource || location.state?.fabricSource || 'customer'
    );
    const [selectedFabric, setSelectedFabric] = useState(
        restoreBasketItem?.configuration?.selectedFabric || restored.selectedFabric || location.state?.selectedFabric || null
    );
    const [selectedSavedProfile, setSelectedSavedProfile] = useState(restored.selectedSavedProfile || null);
    const [measurements, setMeasurements] = useState(
        restoreBasketItem?.configuration?.measurements || restored.measurements || null
    );
    const [visitSettings, setVisitSettings] = useState({ baseFee: 150, perKmFee: 20, freeKm: 3 });
    const [gstPercentage, setGstPercentage] = useState(5);
    const [platformFeePercentage, setPlatformFeePercentage] = useState(5);
    const { addresses, selectedAddressId } = useAddressStore(state => state);
    const selectedAddress = addresses.find(a => a._id === selectedAddressId);
    const storeCoords = useLocationStore(state => state.coordinates);
    const userCoords = selectedAddress?.location?.coordinates ? 
        { lat: selectedAddress.location.coordinates[1], lng: selectedAddress.location.coordinates[0] } : 
        storeCoords;
    const [roadDistanceKm, setRoadDistanceKm] = useState(null);
    const [isCalculatingDistance, setIsCalculatingDistance] = useState(false);

    const [showPriceBreakdown, setShowPriceBreakdown] = useState(false);
    const [formEpoch, setFormEpoch] = useState(0);

    /** Restore fabric/style/measurements UI from a basket row (1st vs 2nd garment). */
    const applyBasketItemToForm = (item) => {
        if (!item?.configuration) return;
        const cfg = item.configuration;
        const m = cfg.measurements || {};

        setDeliveryType(cfg.deliveryType || 'standard');
        setFabricSource(cfg.fabricSource || 'customer');
        setSelectedFabric(cfg.selectedFabric || null);
        setSelectedStyle(cfg.selectedStyle || null);
        setSelectedAddons(Array.isArray(cfg.addons) ? cfg.addons : []);
        setIsTailorAtHome(!!cfg.isTailorAtHome || m?.type === 'home');
        setSelectedSavedProfile(null);

        if (!m || Object.keys(m).length === 0 || cfg.pending) {
            setMeasurementType(null);
            setMeasurements(null);
            setFormEpoch((e) => e + 1);
            return;
        }

        if (m.type === 'home') {
            setMeasurementType('home');
            setMeasurements({ type: 'home' });
        } else if (m.type === 'sample') {
            setMeasurementType('sample');
            setMeasurements({ ...m, type: 'sample' });
        } else if (m.type === 'slip' || m.slipImage || m.image) {
            setMeasurementType('upload');
            setMeasurements({
                type: 'slip',
                slipImage: m.slipImage || m.image || m.url || m.slipUrl || '',
                notes: m.notes || '',
                ...(m.sampleGarment ? { sampleGarment: true } : {}),
            });
        } else if (m.type === 'saved') {
            setMeasurementType('saved');
            setMeasurements({ ...m, type: 'saved' });
        } else {
            const { type, notes, sampleGarment, slipImage, isConfirmed, data, ...dims } = m;
            const dimSource = data && typeof data === 'object' ? data : dims;
            // Open self form so saved chest/waist/etc. are visible for this basket item
            setMeasurementType('new');
            setMeasurements({
                type: 'self',
                isConfirmed: true,
                data: { ...dimSource, notes: notes || dimSource.notes || '' },
                notes: notes || dimSource.notes || '',
                ...(sampleGarment ? { sampleGarment: true } : {}),
                ...(slipImage ? { slipImage } : {}),
            });
        }
        setFormEpoch((e) => e + 1);
    };

    // Basket item click / navigation → show that garment's saved measurements
    useEffect(() => {
        const item = location.state?.restoreBasketItem;
        const idx = location.state?.editBasketIndex;
        if (!item || typeof idx !== 'number') return;
        setActiveBasketIndex(idx);
        applyBasketItemToForm(item);
        requestAnimationFrame(() => {
            document.getElementById('measurement-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    }, [id, location.state?.editBasketIndex, location.state?.restoreBasketItem?.basketId]);

    // Save draft state to sessionStorage so page refresh retains all inputs & confirmations
    useEffect(() => {
        if (!id) return;
        try {
            const draft = {
                deliveryType,
                measurementType,
                selectedStyle,
                isTailorAtHome,
                selectedAddons,
                fabricSource,
                selectedFabric,
                selectedSavedProfile,
                measurements,
                currentStep
            };
            sessionStorage.setItem(`service_draft_${id}`, JSON.stringify(draft));
        } catch (e) {
            console.error("Failed to save service draft:", e);
        }
    }, [id, deliveryType, measurementType, selectedStyle, isTailorAtHome, selectedAddons, fabricSource, selectedFabric, selectedSavedProfile, measurements, currentStep]);

    // Sticky booking bar is always visible (was previously scroll-to-bottom only,
    // which hid "Add Another" / "Book Now" for most users).
    const showFooter = true;

    useEffect(() => {
        let isMounted = true;
        
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const results = await Promise.allSettled([
                    api.get(`/services/${id}`),
                    (location.state?.tailorId || storedDetails?.tailorId) ? 
                        api.get(`/tailors/${location.state?.tailorId || storedDetails?.tailorId}`) : 
                        Promise.resolve(null)
                ]);

                if (!isMounted) return;

                if (results[0].status === 'fulfilled') {
                    const service = results[0].value?.data?.data;
                    if (service) setServiceData(service);
                    
                    // Pre-select tailor if it came directly with the service
                    if (service?.tailor && !results[1].value) {
                        setPreSelectedTailor(service.tailor);
                    }
                }
                if (results[1].status === 'fulfilled' && results[1].value) {
                    setPreSelectedTailor(results[1].value.data.data);
                }
                
                if (location.state?.selectedFabric) {
                    setFabricSource('platform');
                    setSelectedFabric(location.state.selectedFabric);
                }

                // Fetch global settings
                const settingsRes = await api.get('/cms/settings');
                
                if (!isMounted) return;
                
                if (settingsRes.data?.success) {
                    if (settingsRes.data.data?.visitFee) {
                        setVisitSettings(settingsRes.data.data.visitFee);
                    }
                    if (settingsRes.data.data?.pricing?.gstPercentage !== undefined) {
                        setGstPercentage(settingsRes.data.data.pricing.gstPercentage);
                    }
                    if (settingsRes.data.data?.walletConfig?.platformFeePercentage !== undefined) {
                        setPlatformFeePercentage(settingsRes.data.data.walletConfig.platformFeePercentage);
                    }
                }

                // Also fetch addresses so we can resolve selectedAddressId
                useAddressStore.getState().fetchAddresses();
            } catch (error) {
                if (isMounted) console.error('Failed to fetch service/tailor detail:', error);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };
        fetchData();
        
        return () => {
            isMounted = false;
        };
    }, [id, location.state]);

    // Lock tailor as soon as we know it while basket is active
    useEffect(() => {
        if (!serviceItems.length) return;
        useCheckoutStore.getState().ensureLockedTailor({
            tailorId:
                preSelectedTailor?._id ||
                preSelectedTailor?.id ||
                serviceItems[0]?.serviceDetails?.tailorId ||
                (typeof serviceData?.tailor === 'object'
                    ? serviceData.tailor?._id || serviceData.tailor?.id
                    : serviceData?.tailor),
            tailorName:
                preSelectedTailor?.shopName ||
                serviceItems[0]?.serviceDetails?.tailorName ||
                serviceData?.tailor?.shopName ||
                'Tailor Partner',
        });
    }, [serviceItems.length, preSelectedTailor, serviceData]);

    const isAlteration = serviceData?.category?.name?.toLowerCase().includes('alteration') || serviceData?.tags?.some(t => t.toLowerCase().includes('alteration'));

    useEffect(() => {
        if (isAlteration) {
            setFabricSource('customer');
            setMeasurementType('sample');
            setMeasurements({ type: 'sample', notes: 'Partner will pickup garment for alteration' });
        }
    }, [isAlteration]);

    useEffect(() => {
        let isMounted = true;
        
        const fetchRoadDistance = async () => {
            if (!preSelectedTailor || !userCoords || !isTailorAtHome) return;
            
            try {
                setIsCalculatingDistance(true);
                const [tLng, tLat] = preSelectedTailor.location.coordinates;
                let finalULat = userCoords.lat;
                let finalULng = userCoords.lng;

                // If an address is selected but it had no saved coordinates, let's geocode it on the fly via backend
                if (selectedAddress && (!selectedAddress.location?.coordinates || selectedAddress.location.coordinates.length < 2)) {
                    const addressString = `${selectedAddress.street || ''}, ${selectedAddress.city || ''}, ${selectedAddress.state || ''}, ${selectedAddress.zipCode || ''}`;
                    try {
                        const geoRes = await api.get('/distance/forward-geocode', { params: { address: addressString } });
                        if (geoRes.data?.success && geoRes.data?.data) {
                            finalULat = geoRes.data.data.lat;
                            finalULng = geoRes.data.data.lng;
                        }
                    } catch (geoErr) {
                        console.error("Backend forward geocoding failed", geoErr);
                    }
                }
                
                const res = await api.post('/distance/calculate', {
                    origin: [tLat, tLng],
                    destination: [finalULat, finalULng]
                });
                
                if (res.data?.success && isMounted) {
                    setRoadDistanceKm(res.data.data.distance);
                }
            } catch (err) {
                console.error("Failed to fetch road distance:", err);
            } finally {
                if (isMounted) setIsCalculatingDistance(false);
            }
        };

        fetchRoadDistance();
        
        return () => { isMounted = false; };
    }, [preSelectedTailor, userCoords?.lat, userCoords?.lng, selectedAddress?._id, isTailorAtHome]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 pb-40">
                {/* Header Skeleton */}
                <div className="sticky top-0 z-50 bg-white/80 pt-safe px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
                        <div>
                            <div className="w-32 h-4 bg-gray-200 rounded animate-pulse mb-1" />
                            <div className="w-20 h-2 bg-gray-200 rounded animate-pulse" />
                        </div>
                    </div>
                </div>
                
                <div className="max-w-2xl mx-auto px-4 mt-6 space-y-6">
                    {/* Stepper Skeleton */}
                    <div className="flex justify-between px-4 mb-8">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="flex flex-col items-center gap-2">
                                <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
                                <div className="w-12 h-2 bg-gray-200 rounded animate-pulse" />
                            </div>
                        ))}
                    </div>

                    {/* Fabric Option 1 Skeleton */}
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 flex gap-4">
                        <div className="w-16 h-16 bg-gray-200 rounded-xl animate-pulse shrink-0" />
                        <div className="flex-1 space-y-2 py-1">
                            <div className="w-3/4 h-4 bg-gray-200 rounded animate-pulse" />
                            <div className="w-1/2 h-3 bg-gray-200 rounded animate-pulse" />
                            <div className="w-1/4 h-3 bg-gray-200 rounded animate-pulse mt-2" />
                        </div>
                    </div>
                    
                    {/* Fabric Option 2 Skeleton */}
                    <div className="bg-white p-4 rounded-2xl border border-gray-100 flex gap-4">
                        <div className="w-16 h-16 bg-gray-200 rounded-xl animate-pulse shrink-0" />
                        <div className="flex-1 space-y-2 py-1">
                            <div className="w-3/4 h-4 bg-gray-200 rounded animate-pulse" />
                            <div className="w-1/2 h-3 bg-gray-200 rounded animate-pulse" />
                            <div className="w-1/4 h-3 bg-gray-200 rounded animate-pulse mt-2" />
                        </div>
                    </div>

                    {/* Measurement Skeleton */}
                    <div className="bg-white p-5 rounded-2xl border border-gray-100 mt-6">
                        <div className="w-1/3 h-4 bg-gray-200 rounded animate-pulse mb-4" />
                        <div className="space-y-3">
                            <div className="w-full h-12 bg-gray-100 rounded-xl animate-pulse" />
                            <div className="w-full h-12 bg-gray-100 rounded-xl animate-pulse" />
                            <div className="w-full h-12 bg-gray-100 rounded-xl animate-pulse" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!serviceData) return <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-xl font-bold text-gray-900">Service Not Found</h2>
        <button onClick={() => navigate(-1)} className="mt-4 text-primary font-bold underline">Go Back</button>
    </div>;

    // Pricing Logic
    const basePrice = serviceData.basePrice || 0;
    
    const deliveryPrice = deliveryType === 'express' ? 150 : (deliveryType === 'premium' ? 350 : 0);
    const fabricPrice = (fabricSource === 'platform' && selectedFabric) ? selectedFabric.price : 0;
    const addonsPrice = selectedAddons.reduce((sum, a) => sum + a.price, 0);
    
    const calculateVisitPrice = () => {
        if (!isTailorAtHome) return 0;
        if (!preSelectedTailor || !userCoords) return visitSettings.baseFee;

        // Use road distance if available, else fallback to Haversine
        let distance = roadDistanceKm;
        
        if (distance === null) {
            try {
                const [tLng, tLat] = preSelectedTailor.location.coordinates;
                distance = calculateDistance(userCoords.lat, userCoords.lng, tLat, tLng);
            } catch (err) {
                return visitSettings.baseFee;
            }
        }
        
        if (distance <= visitSettings.freeKm) return visitSettings.baseFee;
        
        return Math.round(visitSettings.baseFee + (distance - visitSettings.freeKm) * visitSettings.perKmFee);
    };

    const tailorAtHomePrice = calculateVisitPrice();
    
    // Match backend calculation: Platform fee on base + addons only
    const platformFee = Math.round((basePrice + addonsPrice) * (platformFeePercentage / 100));
    const taxableAmount = basePrice + addonsPrice + fabricPrice + tailorAtHomePrice + platformFee;
    const taxes = Math.round(taxableAmount * (gstPercentage / 100));
    
    // Delivery fee is outside GST calculation on backend
    const currentTotal = taxableAmount + taxes + deliveryPrice;

    // Grand Total (Basket + Current)
    const basketTotal = serviceItems.reduce((sum, item) => sum + item.pricing.total, 0);
    const grandTotal = basketTotal + currentTotal;

    const getDeliveryDays = () => {
        if (deliveryType === 'express') return 10;
        if (deliveryType === 'premium') return 7;
        return 15;
    }

    const resetDraftForm = () => {
        setMeasurementType(null);
        setMeasurements(null);
        setSelectedStyle(null);
        setSelectedAddons([]);
        setSelectedSavedProfile(null);
        setIsTailorAtHome(false);
        setFabricSource('customer');
        setSelectedFabric(null);
        setDeliveryType('standard');
        try {
            sessionStorage.removeItem(`service_draft_${id}`);
        } catch (e) {}
    };

    const handleRemoveBasketItem = (index) => {
        removeServiceItem(index);
        import('react-hot-toast').then(({ toast }) => {
            toast.success('Removed from basket');
        });
    };

    const prepareDraftItem = async () => {
        let finalMeasurements = measurements;
        const measurementLayout = sanitizeMeasurementFields(
            serviceData?.category?.measurementFields || []
        );

        // If user requested to save this measurement profile
        if (measurements?.saveProfile) {
            try {
                const { notes, ...pureMeasurements } = measurements.data;
                await addMeasurement({
                    profileName: measurements.saveProfile.name,
                    garmentType: serviceData.category?.name || "Other",
                    categoryId: serviceData.category?._id || serviceData.category || null,
                    measurements: pureMeasurements,
                    notes: notes
                });
                finalMeasurements = {
                    ...measurements.data,
                    type: 'self',
                    notes: notes || measurements.data?.notes,
                    ...(measurementLayout.length ? { measurementLayout } : {}),
                };
            } catch (err) {
                console.error("Failed to save measurement profile:", err);
            }
        } else if (measurements?.type === 'self' || measurements?.isConfirmed) {
            finalMeasurements = {
                ...(measurements.data || {}),
                type: 'self',
                notes: measurements.data?.notes || measurements.notes || '',
                ...(measurements.sampleGarment ? { sampleGarment: true } : {}),
                ...(measurements.slipAttached || measurements.slipImage || measurements.image
                    ? {
                        slipImage:
                            measurements.slipImage ||
                            measurements.image ||
                            measurements.url ||
                            measurements.slipUrl,
                    }
                    : {}),
                ...(measurementLayout.length ? { measurementLayout } : {}),
            };
        } else if (measurements?.type === 'slip') {
            finalMeasurements = {
                type: 'slip',
                slipImage:
                    measurements.slipImage ||
                    measurements.image ||
                    measurements.url ||
                    measurements.slipUrl ||
                    '',
                notes: measurements.notes || '',
                ...(measurements.sampleGarment ? { sampleGarment: true } : {}),
            };
        } else if (measurements?.type === 'saved') {
            finalMeasurements = {
                ...(measurements.measurements || measurements),
                type: 'saved',
                ...(measurementLayout.length ? { measurementLayout } : {}),
            };
        } else if (measurements?.type === 'sample') {
            finalMeasurements = {
                type: 'sample',
                notes: measurements.notes || 'Partner will pickup sample garment with fabric',
                sampleGarment: true,
            };
        } else if (finalMeasurements && typeof finalMeasurements === 'object' && measurementLayout.length) {
            finalMeasurements = { ...finalMeasurements, measurementLayout };
        }

        return {
            serviceDetails: {
                _id: serviceData._id || serviceData.id,
                id: serviceData._id || serviceData.id,
                title: serviceData.title,
                image: serviceData.image || serviceData.images?.[0] || null,
                basePrice: serviceData.basePrice || 0,
                tags: serviceData.tags || [],
                category: serviceData.category
                    ? {
                        _id: serviceData.category._id,
                        name: serviceData.category.name,
                        measurementFields: serviceData.category.measurementFields || [],
                    }
                    : null,
                tailorId:
                    preSelectedTailor?._id ||
                    preSelectedTailor?.id ||
                    (typeof serviceData?.tailor === 'object'
                        ? (serviceData.tailor?._id || serviceData.tailor?.id || serviceData.tailor?.user?._id)
                        : serviceData?.tailor) ||
                    null,
                tailorName: preSelectedTailor?.shopName || serviceData?.tailor?.shopName || 'Tailor Partner',
                tailorCoordinates: preSelectedTailor?.location?.coordinates || serviceData?.tailor?.location?.coordinates || null
            },
            configuration: { 
                deliveryType, 
                fabricSource, 
                selectedFabric: selectedFabric
                    ? {
                        _id: selectedFabric._id || selectedFabric.id,
                        id: selectedFabric._id || selectedFabric.id,
                        name: selectedFabric.name,
                        price: selectedFabric.price || 0,
                        image: selectedFabric.image || selectedFabric.images?.[0] || null,
                    }
                    : null,
                measurements: finalMeasurements,
                isTailorAtHome,
                selectedStyle: selectedStyle
                    ? {
                        name: selectedStyle.name,
                        image: selectedStyle.image,
                        description: selectedStyle.description,
                        isCustom: !!selectedStyle.isCustom,
                    }
                    : null,
                addons: (selectedAddons || []).map((a) => ({
                    _id: a._id || a.id,
                    name: a.name || a.title,
                    price: Number(a.price) || 0,
                })),
                pending: false,
            },
            pricing: { 
                base: basePrice, 
                delivery: deliveryPrice, 
                fabric: fabricPrice, 
                addons: addonsPrice,
                tailorAtHome: tailorAtHomePrice,
                platformFee,
                taxes, 
                gstPercentage,
                platformFeePercentage,
                total: currentTotal, 
                deliveryDays: getDeliveryDays() 
            },
            basketId: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
        };
    };

    const checkCartConflict = () => {
        const isCurrentAlteration = serviceData?.category?.name?.toLowerCase().includes('alteration') || serviceData?.tags?.some(t => t.toLowerCase().includes('alteration'));

        if (serviceItems && serviceItems.length > 0) {
            const existingItem = serviceItems[0];
            const isExistingAlteration = existingItem.serviceDetails?.category?.name?.toLowerCase().includes('alteration') || existingItem.serviceDetails?.tags?.some(t => t.toLowerCase().includes('alteration'));

            if (isCurrentAlteration !== isExistingAlteration) {
                import('react-hot-toast').then(({ toast }) => {
                    toast.error("This cart already contains a different service type. Please complete this order or clear your cart before adding another service category.");
                });
                return true;
            }
        }
        return false;
    };

    const hasSelfMeasurements = Boolean(
        selectedSavedProfile ||
        measurements?.isConfirmed ||
        measurements?.type === 'self' ||
        (measurements?.data && Object.entries(measurements.data).some(([key, val]) => key !== 'notes' && val !== '' && val != null))
    );

    const isMeasurementValid = Boolean(
        isAlteration ||
        measurementType === 'home' ||
        measurementType === 'sample' ||
        measurements?.sampleGarment ||
        selectedSavedProfile ||
        hasSelfMeasurements ||
        measurements?.isConfirmed ||
        measurements?.type === 'slip' ||
        measurements?.image ||
        measurements?.url ||
        measurements?.slipUrl ||
        measurements?.file
    );



    const getLockedTailor = () => {
        const fromPreselect = preSelectedTailor
            ? {
                id: preSelectedTailor._id || preSelectedTailor.id,
                name: preSelectedTailor.shopName || 'Selected Tailor',
            }
            : null;
        if (fromPreselect?.id) return fromPreselect;

        const fromService = serviceData?.tailor
            ? {
                id: serviceData.tailor._id || serviceData.tailor.id,
                name: serviceData.tailor.shopName || 'Selected Tailor',
            }
            : null;
        if (fromService?.id) return fromService;

        const fromBasket = serviceItems.find((item) => item.serviceDetails?.tailorId);
        if (fromBasket?.serviceDetails?.tailorId) {
            return {
                id: fromBasket.serviceDetails.tailorId,
                name: fromBasket.serviceDetails.tailorName || 'Selected Tailor',
            };
        }
        return null;
    };

    const navigateToAddGarment = () => {
        const locked = getLockedTailor();
        const store = useCheckoutStore.getState();
        const ensured = store.ensureLockedTailor({
            tailorId: store.lockedTailorId || locked?.id,
            tailorName: store.lockedTailorName || locked?.name,
        });
        const tailorId = ensured.tailorId || locked?.id;
        const tailorName = ensured.tailorName || locked?.name;

        if (!tailorId) {
            import('react-hot-toast').then(({ toast }) => {
                toast.error('Please confirm a tailor for this order first');
            });
            return;
        }

        navigate('/user/services', {
            state: {
                tailorId,
                tailorName: tailorName || 'Selected Tailor',
                fromMultiItemBasket: true,
            },
        });
    };

    /** Save current garment into basket, then open catalog for next item */
    const handleSaveAndAddAnother = async () => {
        if (!isMeasurementValid) {
            import('react-hot-toast').then(({ toast }) => {
                toast.error('Please complete measurements for this service before adding another');
            });
            document.getElementById('measurement-section')?.scrollIntoView({ behavior: 'smooth' });
            return;
        }
        if (checkCartConflict()) return;
        const item = await prepareDraftItem();
        const idx =
            editBasketIndex != null && editBasketIndex >= 0
                ? editBasketIndex
                : serviceItems.findIndex((row) => {
                    const sid = String(row.serviceDetails?._id || row.serviceDetails?.id || '');
                    return sid === String(serviceData?._id || id) && row.configuration?.pending;
                });

        if (idx != null && idx >= 0 && idx < serviceItems.length) {
            updateServiceItem(idx, item);
        } else {
            addServiceItem(item);
        }
        setBuyNowMode(false, null);
        setActiveBasketIndex(null);
        resetDraftForm();
        import('react-hot-toast').then(({ toast }) => {
            toast.success('Saved — choose another service');
        });
        navigateToAddGarment();
    };

    const goToCheckoutAfterItemsReady = () => {
        const store = useCheckoutStore.getState();
        const targetTailor =
            preSelectedTailor ||
            serviceData?.tailor ||
            store.lockedTailorId ||
            serviceItems[0]?.serviceDetails?.tailorId;
        if (!targetTailor) {
            navigate('/user/checkout/tailor');
        } else if (isTailorAtHome && selectedAddressId) {
            navigate('/user/checkout/summary');
        } else {
            navigate('/user/checkout/address');
        }
    };

    const handleAddMore = async () => {
        if (!isMeasurementValid) {
            import('react-hot-toast').then(({ toast }) => {
                toast.error('Please complete measurements for this garment first');
            });
            const elem = document.getElementById('measurement-section');
            if (elem) elem.scrollIntoView({ behavior: 'smooth' });
            return;
        }
        if (checkCartConflict()) return;
        const item = await prepareDraftItem();

        const idx =
            editBasketIndex != null && editBasketIndex >= 0
                ? editBasketIndex
                : serviceItems.findIndex((row) => {
                    const sid = String(row.serviceDetails?._id || row.serviceDetails?.id || '');
                    return sid === String(serviceData?._id || id) && row.configuration?.pending;
                });

        if (idx != null && idx >= 0 && idx < serviceItems.length) {
            updateServiceItem(idx, item);
            setBuyNowMode(false, null);
            setActiveBasketIndex(null);
            resetDraftForm();
            import('react-hot-toast').then(({ toast }) => {
                toast.success(`Saved in basket (${useCheckoutStore.getState().serviceItems.length} items)`);
            });
            requestAnimationFrame(() => {
                document.getElementById('order-basket')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
            return;
        }

        addServiceItem(item);
        setBuyNowMode(false, null);
        setActiveBasketIndex(null);
        resetDraftForm();
        import('react-hot-toast').then(({ toast }) => {
            toast.success(`Added to basket (${useCheckoutStore.getState().serviceItems.length} items)`, {
                duration: 3500,
            });
        });
        requestAnimationFrame(() => {
            document.getElementById('order-basket')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
    };

    const handleCheckoutBasket = () => {
        if (!serviceItems.length) return;
        const pending = serviceItems.filter((i) => i.configuration?.pending);
        if (pending.length) {
            import('react-hot-toast').then(({ toast }) => {
                toast.error(`Please complete pending garments first: ${pending.map((p) => p.serviceDetails?.title).join(', ')}`);
            });
            const first = pending[0];
            const sid = first.serviceDetails?._id || first.serviceDetails?.id;
            const idx = serviceItems.findIndex((i) => i.basketId === first.basketId);
            if (sid) openBasketItem(first, idx >= 0 ? idx : 0);
            return;
        }
        if (!requireAuth('Please login to book these services')) return;
        setBuyNowMode(false, null);
        goToCheckoutAfterItemsReady();
    };

    const handleBuyNow = async () => {
        if (!isMeasurementValid) {
            import('react-hot-toast').then(({ toast }) => {
                toast.error('Please complete measurements or select "Tailor at Home" to proceed');
            });
            const elem = document.getElementById('measurement-section');
            if (elem) elem.scrollIntoView({ behavior: 'smooth' });
            return;
        }
        if (!requireAuth('Please login to book this service')) return;
        if (checkCartConflict()) return;
        const item = await prepareDraftItem();

        const idx =
            editBasketIndex != null && editBasketIndex >= 0
                ? editBasketIndex
                : serviceItems.findIndex((row) => {
                    const sid = String(row.serviceDetails?._id || row.serviceDetails?.id || '');
                    return sid === String(serviceData?._id || id) && row.configuration?.pending;
                });

        if (idx != null && idx >= 0 && idx < serviceItems.length) {
            updateServiceItem(idx, item);
            setBuyNowMode(false, null);
            goToCheckoutAfterItemsReady();
            return;
        }

        addServiceItem(item);
        setBuyNowMode(false, null);
        goToCheckoutAfterItemsReady();
    };

    const openBasketItem = (item, idx) => {
        const sid = item.serviceDetails?._id || item.serviceDetails?.id;
        if (!sid) return;

        // Always use latest row from store (measurements included)
        const fresh = useCheckoutStore.getState().serviceItems[idx] || item;

        // Same service page → just restore form (no navigation)
        if (String(sid) === String(id)) {
            setActiveBasketIndex(idx);
            applyBasketItemToForm(fresh);
            requestAnimationFrame(() => {
                document.getElementById('measurement-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
            import('react-hot-toast').then(({ toast }) => {
                toast.success(`Showing measurements for: ${fresh.serviceDetails?.title || 'item'}`);
            });
            return;
        }

        const onServiceDetail = /\/user\/services\/[^/]+$/.test(location.pathname);
        navigate(`/user/services/${sid}`, {
            replace: onServiceDetail,
            state: {
                tailorId: fresh.serviceDetails?.tailorId || useCheckoutStore.getState().lockedTailorId || undefined,
                tailorName: fresh.serviceDetails?.tailorName || useCheckoutStore.getState().lockedTailorName || undefined,
                editBasketIndex: idx,
                restoreBasketItem: fresh,
                fromBasket: true,
                fromMultiItemBasket: true,
            },
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-40 font-sans">
            {/* 1. Header & Stepper Integration */}
            <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl pt-safe">
                <div className="px-5 py-3 flex items-center justify-between border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => navigate(-1)}
                            className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-all active:scale-90"
                            aria-label="Back"
                        >
                            <ArrowLeft size={22} className="text-gray-900" />
                        </button>
                        <div>
                            <h1 className="text-base font-black text-gray-900 leading-none">{serviceData.title}</h1>
                            <p className="text-[10px] text-primary font-bold uppercase tracking-widest mt-1">Configuring Order</p>
                        </div>
                    </div>
                    {serviceItems.length > 0 && (
                        <div className="flex items-center gap-1.5 bg-primary text-white px-3 py-1.5 rounded-full shadow-lg shadow-indigo-100">
                            <ShoppingBag size={12} />
                            <span className="text-[10px] font-black">{serviceItems.length} Items</span>
                        </div>
                    )}
                </div>
                {!isAlteration && (
                    <BookingStepper currentStepId={measurements ? 'review' : (measurementType ? 'details' : 'fabric')} />
                )}
            </div>

            <div className="max-w-2xl mx-auto px-4 mt-4 space-y-3.5 pb-44">

                {/* Selected service — only when basket empty (otherwise basket already shows the same item) */}
                {!(storeHydrated && serviceItems.length > 0) && (
                <section className="bg-white rounded-[1.5rem] p-3.5 border border-primary/15 shadow-sm space-y-3">
                    <div className="flex items-center gap-3">
                        <div className="w-16 h-20 rounded-xl overflow-hidden bg-gray-100 border border-gray-100 shrink-0">
                            <img
                                src={getImageUrl(serviceData.image) || 'https://placehold.co/128x160/e6e8f0/843d9b?text=Service'}
                                alt={serviceData.title}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.currentTarget.src = 'https://placehold.co/128x160/e6e8f0/843d9b?text=Service';
                                }}
                            />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-[9px] font-black uppercase tracking-wider text-primary">Selected service</p>
                            <h2 className="text-sm font-black text-gray-900 truncate">{serviceData.title}</h2>
                            <p className="text-[11px] font-bold text-gray-500 mt-0.5">
                                ₹{(serviceData.basePrice || 0).toLocaleString()}
                                {fabricSource === 'platform' ? ' · Buy fabric' : ' · Your fabric'}
                                {selectedStyle?.name ? ` · ${selectedStyle.name}` : ''}
                                {isMeasurementValid ? ' · Measurements ✓' : ' · Measurements pending'}
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={handleSaveAndAddAnother}
                        className="w-full py-3 rounded-xl bg-primary text-white font-black text-[11px] uppercase tracking-wider active:scale-[0.98] hover:bg-primary-dark transition-all flex items-center justify-center gap-2"
                    >
                        <ShoppingBag size={14} />
                        + Add another service
                    </button>
                </section>
                )}

                {/* Basket — visible as soon as items exist (incl. auto-pending on open) */}
                {storeHydrated && serviceItems.length > 0 && (
                    <section id="order-basket" className="animate-in fade-in slide-in-from-top-4 scroll-mt-24">
                        <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-primary/15 overflow-hidden relative">
                            <div className="flex items-center justify-between mb-3 gap-2">
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    Your order basket ({serviceItems.length})
                                </h3>
                                <button
                                    type="button"
                                    onClick={handleCheckoutBasket}
                                    className="text-[9px] font-black uppercase tracking-wider bg-primary text-white px-3 py-1.5 rounded-lg active:scale-95"
                                >
                                    Checkout
                                </button>
                            </div>
                            <div className="space-y-2.5">
                                <AnimatePresence mode='popLayout'>
                                    {serviceItems.map((item, idx) => {
                                        const thumbSrc = getImageUrl(
                                            item.configuration?.selectedStyle?.image ||
                                            item.configuration?.selectedFabric?.image ||
                                            item.configuration?.selectedFabric?.images?.[0] ||
                                            item.serviceDetails?.image ||
                                            item.serviceDetails?.images?.[0]
                                        );
                                        const measureType = item.configuration?.pending
                                            ? 'Complete details'
                                            : item.configuration?.isTailorAtHome
                                            ? 'Home visit'
                                            : item.configuration?.measurements?.type || 'Custom';
                                        return (
                                        <motion.div 
                                            key={item.basketId || idx}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            className={cn(
                                                "flex items-center justify-between p-3 rounded-2xl border",
                                                editBasketIndex === idx
                                                    ? "bg-primary/5 border-primary/40 ring-1 ring-primary/30"
                                                    : item.configuration?.pending
                                                    ? "bg-amber-50/80 border-amber-200"
                                                    : "bg-gray-50 border-gray-100"
                                            )}
                                        >
                                            <button
                                                type="button"
                                                onClick={() => openBasketItem(item, idx)}
                                                className="flex items-center gap-3 min-w-0 flex-1 text-left active:scale-[0.99] transition-transform"
                                            >
                                                <div className="w-14 h-16 bg-gray-100 rounded-xl flex items-center justify-center text-primary overflow-hidden border border-gray-100 shrink-0">
                                                    {thumbSrc ? (
                                                        <img
                                                            src={thumbSrc}
                                                            alt={item.serviceDetails?.title || `Item ${idx + 1}`}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                e.currentTarget.src = 'https://placehold.co/112x128/e6e8f0/843d9b?text=Item';
                                                            }}
                                                        />
                                                    ) : (
                                                        <Scissors size={18} />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-black text-gray-900 truncate">
                                                        {idx + 1}. {item.serviceDetails?.title}
                                                    </p>
                                                    <p className="text-[9px] text-gray-400 font-bold uppercase mt-0.5">
                                                        {item.configuration?.pending
                                                            ? 'Pending · tap to fill measurements'
                                                            : `₹${Number(item.pricing?.total || 0).toLocaleString()} · ${String(measureType).replace(/-/g, ' ')}`}
                                                    </p>
                                                    <p className="text-[9px] text-primary font-bold mt-0.5">
                                                        {editBasketIndex === idx
                                                            ? 'Editing this item · measurements below'
                                                            : 'Tap to view / edit measurements →'}
                                                    </p>
                                                </div>
                                            </button>
                                            <button 
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRemoveBasketItem(idx);
                                                }}
                                                className="px-2.5 py-2 text-[9px] font-black uppercase tracking-wider text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-all active:scale-95 shrink-0"
                                            >
                                                Remove
                                            </button>
                                        </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                            </div>

                            <div className="mt-4 grid grid-cols-1 gap-2">
                                <button
                                    type="button"
                                    onClick={handleSaveAndAddAnother}
                                    className="w-full py-3 rounded-xl bg-primary text-white font-black text-[11px] uppercase tracking-wider active:scale-[0.98] hover:bg-primary-dark transition-all flex items-center justify-center gap-2"
                                >
                                    <ShoppingBag size={14} />
                                    + Add another service
                                </button>
                            <p className="text-[9px] text-gray-400 font-medium text-center leading-relaxed">
                                Only this tailor’s services can be added. Highlighted row = item you’re editing below.
                            </p>
                            </div>
                        </div>
                    </section>
                )}

                {/* 2. Fabric Choice - The "Fork" */}
                {!isAlteration && (
                    <section className="animate-in fade-in slide-in-from-bottom-2">
                        <FabricSelector
                            selected={fabricSource}
                            onSelect={setFabricSource}
                            selectedFabric={selectedFabric}
                            onSelectFabric={setSelectedFabric}
                            tailor={preSelectedTailor}
                        />
                    </section>
                )}

                {/* 2.5 Style Variant & Custom Photo Upload Section */}
                {!isAlteration && (
                    <section className="animate-in fade-in slide-in-from-bottom-3 duration-400">
                        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-3">
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-primary">
                                    <Scissors size={18} />
                                </div>
                                <div>
                                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest leading-tight">Choose Style Variant / Upload Design</h3>
                                    <p className="text-[10px] text-gray-400 font-bold leading-none mt-0.5">Select a style design or upload your custom reference photo</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2.5">
                                {/* Custom Photo Upload Card */}
                                <div 
                                    className={`p-3 rounded-2xl border transition-all flex flex-col justify-between relative overflow-hidden ${
                                        selectedStyle?.isCustom 
                                            ? 'border-primary bg-purple-50/60 shadow-md ring-2 ring-primary/20' 
                                            : 'border-dashed border-gray-300 bg-gray-50/70 hover:border-purple-300'
                                    }`}
                                >
                                    {selectedStyle?.isCustom && selectedStyle.image ? (
                                        <div className="relative group">
                                            <div className="aspect-[4/3] rounded-xl overflow-hidden mb-2 bg-gray-100">
                                                <img src={selectedStyle.image} alt="Custom Reference" className="w-full h-full object-cover" />
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedStyle(null);
                                                }}
                                                className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full shadow-md hover:bg-red-600 cursor-pointer"
                                                title="Remove photo"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    ) : (
                                        <label className="relative flex flex-col items-center justify-center py-4 cursor-pointer">
                                            {isUploadingCustomStyle ? (
                                                <Loader2 size={24} className="animate-spin text-primary mb-2" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-purple-100 text-primary flex items-center justify-center mb-2 shadow-xs">
                                                    <Upload size={18} />
                                                </div>
                                            )}
                                            <span className="text-xs font-black text-purple-900 text-center">
                                                {isUploadingCustomStyle ? 'Uploading...' : 'Upload Design Photo'}
                                            </span>
                                            <span className="text-[9px] text-gray-400 font-medium text-center mt-0.5">
                                                Photo of preferred design
                                            </span>
                                            <input 
                                                type="file" 
                                                accept="image/*" 
                                                onClick={(e) => { e.target.value = null; }}
                                                onChange={handleCustomStyleUpload} 
                                                disabled={isUploadingCustomStyle} 
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                                            />
                                        </label>
                                    )}

                                    {selectedStyle?.isCustom && (
                                        <div className="mt-1">
                                            <h4 className="text-xs font-black text-purple-900 truncate">Custom Reference Photo</h4>
                                            <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-primary text-white inline-block mt-1">
                                                Uploaded ✓
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Predefined Style Cards (if any exist) */}
                                {((serviceData?.selectedStyles && serviceData.selectedStyles.length > 0) ? serviceData.selectedStyles : serviceData?.category?.styles || []).map((style, idx) => {
                                    const styleName = style.name || style;
                                    const isSelected = selectedStyle?.name === styleName && !selectedStyle?.isCustom;
                                    return (
                                        <div
                                            key={idx}
                                            onClick={() => {
                                                if (isSelected) {
                                                    setSelectedStyle(null);
                                                } else {
                                                    setSelectedStyle({ name: styleName, image: style.image, description: style.description, isCustom: false });
                                                }
                                            }}
                                            className={`p-3 rounded-2xl border cursor-pointer transition-all flex flex-col justify-between relative overflow-hidden ${
                                                isSelected 
                                                    ? 'border-primary bg-purple-50/60 shadow-md ring-2 ring-primary/20' 
                                                    : 'border-gray-100 bg-gray-50/50 hover:border-gray-200'
                                            }`}
                                        >
                                            {style.image && (
                                                <div className="aspect-[4/3] rounded-xl overflow-hidden mb-2 bg-gray-100">
                                                    <img src={style.image} alt={styleName} className="w-full h-full object-cover" />
                                                </div>
                                            )}
                                            <div>
                                                <h4 className={`text-xs font-black truncate ${isSelected ? 'text-purple-900' : 'text-gray-900'}`}>{styleName}</h4>
                                                {style.description && <p className="text-[9px] text-gray-500 font-medium line-clamp-2 mt-0.5">{style.description}</p>}
                                            </div>
                                            <div className="mt-2 flex justify-between items-center">
                                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${isSelected ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'}`}>
                                                    {isSelected ? 'Selected ✓' : 'Select'}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </section>
                )}

                {!isAlteration && (
                    <section id="measurement-section" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="mb-2 px-1 flex items-center justify-between gap-2">
                            <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">
                                Measurements for
                            </p>
                            <span className="text-[10px] font-black uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                                {editBasketIndex != null
                                    ? `${editBasketIndex + 1}. ${serviceItems[editBasketIndex]?.serviceDetails?.title || serviceData?.title || 'Item'}`
                                    : (serviceData?.category?.name || serviceData?.title || 'This garment')}
                            </span>
                        </div>
                        <MeasurementSelector
                            key={`measure-${id}-${editBasketIndex ?? 'x'}-${formEpoch}`}
                            selectedType={measurementType}
                            visitPrice={isCalculatingDistance ? '...' : (tailorAtHomePrice || visitSettings.baseFee)}
                            isDistanceBased={!!preSelectedTailor}
                            measurementFields={serviceData?.category?.measurementFields || []}
                            categoryName={serviceData?.category?.name || serviceData?.title}
                            categoryId={serviceData?.category?._id || serviceData?.category || null}
                            onSelectType={(type) => {
                                if (type === 'home') {
                                    if (hasSelfMeasurements) return;
                                    setMeasurementType('home');
                                    setIsTailorAtHome(true);
                                    setMeasurements({ type: 'home' });
                                } else if (type === 'sample') {
                                    setIsTailorAtHome(false);
                                    setMeasurementType('sample');
                                    setMeasurements((prev) => {
                                        if (prev && (prev.isConfirmed || prev.type === 'self' || prev.type === 'slip' || prev.image || prev.url || prev.slipUrl)) {
                                            return { ...prev, sampleGarment: true };
                                        }
                                        return { type: 'sample', notes: 'Partner will pickup sample garment with fabric' };
                                    });
                                } else if (type) {
                                    setIsTailorAtHome(false);
                                    setMeasurementType(type);
                                } else if (measurementType === 'home') {
                                    setIsTailorAtHome(false);
                                    setMeasurementType(null);
                                    setMeasurements((prev) => (prev?.type === 'home' ? null : prev));
                                }
                                // Collapse after self/slip complete: keep measurements so Book Now stays enabled
                            }}
                            onMeasurementComplete={(data) => {
                                if (!data) return;
                                setMeasurements((prev) => {
                                    if (prev && (prev.isConfirmed || prev.type === 'self') && data.type === 'slip') {
                                        return { ...prev, ...data, type: 'self', slipAttached: true };
                                    }
                                    if (prev?.sampleGarment) {
                                        return { ...prev, ...data, sampleGarment: true };
                                    }
                                    return data;
                                });
                            }}
                            selectedSavedProfile={selectedSavedProfile}
                            onSelectSavedProfile={setSelectedSavedProfile}
                            disableHomeVisit={hasSelfMeasurements}
                            completedSelfData={measurements?.type === 'self' || measurements?.isConfirmed ? measurements : null}
                            completedSlipData={
                                measurements?.type === 'slip' || measurements?.slipImage || measurements?.image || measurements?.url
                                    ? measurements
                                    : null
                            }
                        />
                    </section>
                )}

                {/* 3.5 Style Add-ons Section */}
                <section className="animate-in fade-in slide-in-from-bottom-5 duration-600">
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                        <div className="flex items-center justify-between gap-2 mb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-primary">
                                    <Wand2 size={18} />
                                </div>
                                <div>
                                    <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-widest leading-tight">Style Add-ons</h3>
                                    <p className="text-[9px] text-gray-400 font-bold leading-none mt-0.5">Pockets, Padding, etc.</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setIsAddonModalOpen(true)}
                                className="px-3 py-2 bg-primary/5 text-primary text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-primary/10 transition-all active:scale-95 shrink-0"
                            >
                                {selectedAddons.length > 0 ? 'Edit' : 'Browse'}
                            </button>
                        </div>

                        {selectedAddons.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                                {selectedAddons.map(addon => (
                                    <div key={addon._id} className="flex items-center gap-2 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-xl group">
                                        <div className="w-4 h-4 rounded-full bg-white flex items-center justify-center border border-gray-200">
                                            <CheckCircle2 size={10} className="text-green-500" />
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-700">{addon.name}</span>
                                        <button 
                                            onClick={() => setSelectedAddons(prev => prev.filter(a => a._id !== addon._id))}
                                            className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X size={10} className="text-red-400" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-4 border-2 border-dashed border-gray-100 rounded-2xl text-center">
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">No add-ons selected</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* 4. Delivery Selection */}
                <section className="animate-in fade-in slide-in-from-bottom-6 duration-700">
                    <DeliverySelector selected={deliveryType} onSelect={setDeliveryType} />
                </section>

                {/* 5. Additional Info Card */}
                <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-primary">
                            <Info size={18} />
                        </div>
                        <div>
                            <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest">Order Policies</h3>
                            <p className="text-[10px] text-gray-400 font-bold">Standard terms of service</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="mt-1"><CheckCircle2 size={12} className="text-green-500" /></div>
                            <p className="text-[11px] text-gray-500 font-medium">Free alteration within 7 days of delivery for perfect fitting.</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="mt-1"><CheckCircle2 size={12} className="text-green-500" /></div>
                            <p className="text-[11px] text-gray-500 font-medium">Free cancellation before tailor picks up your fabric.</p>
                        </div>
                    </div>
                </div>

                {/* 6. FAQ Section */}
                <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
                    <h3 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-4 opacity-40">Frequently Asked</h3>
                    <FAQItem question="How do I give my measurements?" answer="You can enter measurements manually, upload a photo of your fitting garment, or request a master visit for home measurements." />
                    <FAQItem question="What if my fabric is short?" answer="The tailor will inspect the fabric upon pickup. If it's insufficient for the design, we'll notify you before cutting." />
                    <FAQItem question="Is GST included?" answer="Yes, all prices shown on the Live Bill include necessary taxes and platform fees." />
                </div>
            </div>

            {/* 7. LIVE BILL - Sticky Transparent Footer */}
            <AnimatePresence>
                {showFooter && (
                    <motion.div 
                        initial={{ y: 200, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 200, opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-2xl border-t border-gray-100 p-3 pb-4 shadow-[0_-10px_40px_rgba(0,0,0,0.08)]"
                    >
                        <div className="max-w-md mx-auto">
                            {/* Live Bill Header - Compact */}
                            <div className="flex justify-between items-center mb-3">
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-1.5 mb-0.5">
                                        <span className="text-[9px] font-black text-primary uppercase tracking-tighter">
                                            Live Bill
                                        </span>
                                        <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                                    </div>
                                    <h4 className="text-xl font-black text-gray-900 flex items-baseline gap-1 leading-none">
                                        ₹{grandTotal.toLocaleString()}
                                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Incl. GST</span>
                                        <button 
                                            onClick={() => setShowPriceBreakdown(!showPriceBreakdown)}
                                            className="ml-1 p-0.5 rounded-full hover:bg-gray-100 transition-colors"
                                        >
                                            {showPriceBreakdown ? <ChevronDown size={14} className="text-gray-500" /> : <ChevronUp size={14} className="text-gray-500" />}
                                        </button>
                                    </h4>
                                </div>
                                <div className="text-right">
                                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-tighter mb-0.5">Est. Arrival</p>
                                    <div className="flex items-center justify-end gap-1 text-primary bg-indigo-50 px-2 py-0.5 rounded-lg border border-primary/10">
                                        <Clock size={10} />
                                        <span className="text-[10px] font-black">{getDeliveryDays()} Days</span>
                                    </div>
                                </div>
                            </div>

                            {/* Quick Breakdown - Mini Tags */}
                            <div className="flex gap-1.5 overflow-x-auto pb-3 no-scrollbar">
                                <div className="shrink-0 bg-gray-50 px-2 py-1 rounded-md border border-gray-100 flex items-center gap-1.5">
                                    <Scissors size={8} className="text-gray-400" />
                                    <span className="text-[9px] font-black text-gray-500 uppercase">Current: ₹{currentTotal}</span>
                                </div>
                                {serviceItems.length > 0 && (
                                    <div className="shrink-0 bg-indigo-50 px-2 py-1 rounded-md border border-primary/10 flex items-center gap-1.5">
                                        <ShoppingBag size={8} className="text-primary" />
                                        <span className="text-[9px] font-black text-primary uppercase">Basket: ₹{basketTotal}</span>
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <AnimatePresence>
                                {showPriceBreakdown && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden mb-3"
                                    >
                                        <div className="bg-gray-50 rounded-xl p-3 border border-gray-100 space-y-1.5 text-xs text-gray-600">
                                            {serviceItems.length > 0 && (
                                                <div className="flex justify-between font-medium">
                                                    <span>Previous Basket Items ({serviceItems.length})</span>
                                                    <span>₹{basketTotal.toLocaleString()}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between">
                                                <span>Current Item Base</span>
                                                <span>₹{basePrice.toLocaleString()}</span>
                                            </div>
                                            {fabricPrice > 0 && (
                                                <div className="flex justify-between text-indigo-600">
                                                    <span>Fabric</span>
                                                    <span>+₹{fabricPrice.toLocaleString()}</span>
                                                </div>
                                            )}
                                            {deliveryPrice > 0 && (
                                                <div className="flex justify-between text-amber-600">
                                                    <span>{deliveryType} Delivery</span>
                                                    <span>+₹{deliveryPrice.toLocaleString()}</span>
                                                </div>
                                            )}
                                            {addonsPrice > 0 && (
                                                <div className="flex justify-between text-emerald-600">
                                                    <span>Style Addons</span>
                                                    <span>+₹{addonsPrice.toLocaleString()}</span>
                                                </div>
                                            )}
                                            {tailorAtHomePrice > 0 && (
                                                <div className="flex justify-between text-sky-600">
                                                    <span>Tailor At Home Fee</span>
                                                    <span>+₹{tailorAtHomePrice.toLocaleString()}</span>
                                                </div>
                                            )}
                                            {platformFee > 0 && (
                                                <div className="flex justify-between text-gray-500">
                                                    <span>Platform Fee</span>
                                                    <span>+₹{platformFee.toLocaleString()}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between text-gray-400 pb-1 border-b border-gray-200">
                                                <span>GST ({gstPercentage}%)</span>
                                                <span>+₹{taxes.toLocaleString()}</span>
                                            </div>
                                            <div className="flex justify-between font-bold text-gray-900 pt-1">
                                                <span>Total Amount</span>
                                                <span>₹{grandTotal.toLocaleString()}</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div>
                                <button
                                    onClick={handleBuyNow}
                                    className={cn(
                                        "w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg cursor-pointer min-h-[52px]",
                                        isMeasurementValid
                                            ? "bg-primary text-white shadow-primary/20 active:scale-[0.98] hover:bg-primary-dark" 
                                            : "bg-gradient-to-r from-gray-200 to-gray-300 text-gray-600 hover:from-gray-300 hover:to-gray-400"
                                    )}
                                >
                                    {isMeasurementValid ? (
                                        editBasketIndex != null ? (
                                            <>Save Changes <ChevronRight size={16} /></>
                                        ) : serviceItems.length > 0 ? (
                                            <>Book All ({serviceItems.length + 1}) <ChevronRight size={16} /></>
                                        ) : (
                                            <>Book Now <ChevronRight size={16} /></>
                                        )
                                    ) : (
                                        <>Enter Details to Proceed <ChevronUp size={14} className="text-gray-500 animate-bounce" /></>
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modals */}
            <StyleAddonModal
                isOpen={isAddonModalOpen}
                onClose={() => setIsAddonModalOpen(false)}
                selectedAddons={selectedAddons}
                onUpdate={setSelectedAddons}
                category={serviceData.category}
                serviceTitle={serviceData.title}
                directStyleAddons={serviceData.category?.styleAddons || []}
            />
        </div>
    );
};

export default ServiceDetail;
