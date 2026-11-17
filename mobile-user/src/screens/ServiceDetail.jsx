// Port of modules/customer/pages/ServiceDetail.jsx — logic copied from the web file (see scripts in MEMORY), JSX re-built natively.
import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ChevronDown, ChevronUp, ChevronRight, Clock, ShoppingBag, CheckCircle2, Info, Scissors, Wand2, X, Upload } from 'lucide-react-native';
import { useParams, useNavigate, useLocation } from '../lib/nav';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRequireAuth } from '../hooks/useRequireAuth';
import toast from '../lib/toast';
import api from '../lib/api';
import { sessionStore } from '../lib/storage';
import { pickImage, fileToDataUrl } from '../lib/files';
import useCheckoutStore from '../store/checkoutStore';
import useCartStore from '../store/cartStore';
import useMeasurementStore from '../store/measurementStore';
import useLocationStore from '../store/locationStore';
import useAddressStore from '../store/userStore';
import { calculateDistance } from '../utils/distance';
import { getImageUrl } from '../utils/imageUrl';
import { sanitizeMeasurementFields } from '../utils/measurementFields';
import Screen from '../components/common/Screen';
import BookingStepper from '../components/customer/BookingStepper';
import DeliverySelector from '../components/customer/service-detail/DeliverySelector';
import MeasurementSelector from '../components/customer/service-detail/MeasurementSelector';
import MeasurementSchedulePicker, { formatYYYYMMDD } from '../components/customer/checkout/MeasurementSchedulePicker';
import FabricSelector from '../components/customer/service-detail/FabricSelector';
import CustomizationSelector from '../components/customer/service-detail/CustomizationSelector';
import StyleAddonModal from '../components/customer/service-detail/StyleAddonModal';
import Spin from '../components/ui/Spin';
import { Box, Txt, Btn, Img, I, Scroll } from '../components/ui/primitives';

const IMG_FALLBACK = 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800';

const FAQItem = ({ question, answer }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Box className="border-b border-gray-100">
      <Btn className="w-full flex flex-row justify-between items-center py-3 text-left" onPress={() => setIsOpen(!isOpen)}>
        <Txt className="text-base font-bold text-gray-800 flex-1">{question}</Txt>
        <I icon={isOpen ? ChevronUp : ChevronDown} size={16} color={isOpen ? '#843D9B' : '#9ca3af'} />
      </Btn>
      {isOpen && <Txt className="text-[11px] text-gray-500 pb-4 leading-relaxed font-medium">{answer}</Txt>}
    </Box>
  );
};

const ServiceDetail = () => {
    // section offsets for scrollIntoView equivalents
    const scrollRef = useRef(null);
    const sectionY = useRef({});
    const scrollToSection = (name) => {
        const y = sectionY.current[name];
        if (scrollRef.current && y != null) scrollRef.current.scrollTo({ y: Math.max(0, y - 12), animated: true });
    };
    const onSectionLayout = (name) => (e) => { sectionY.current[name] = e.nativeEvent.layout.y; };

    const bottomInset = useSafeAreaInsets().bottom;
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

    // Only restore draft if explicitly editing a basket item or navigating back with restoredState
    const isExplicitBasketRestore = Boolean(
        location.state?.restoreBasketItem ||
        typeof location.state?.editBasketIndex === 'number' ||
        location.state?.restoredState
    );
    const getSavedDraft = () => {
        if (!id || !isExplicitBasketRestore) return {};
        try {
            const saved = sessionStore.getItem(`service_draft_${id}`);
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

    // Arriving to edit a specific item from basket
    useEffect(() => {
        if (typeof location.state?.editBasketIndex === 'number') {
            setActiveBasketIndex(location.state.editBasketIndex);
        }
    }, [location.state?.editBasketIndex]);

    // Clean up any stale unconfirmed pending items or duplicate items from previous visits
    useEffect(() => {
        if (!storeHydrated) return;
        const currentItems = useCheckoutStore.getState().serviceItems;
        const seen = new Set();
        const deduplicated = [];
        let hadDuplicates = false;
        for (const it of currentItems) {
            const sid = String(it.serviceDetails?._id || it.serviceDetails?.id || '');
            if (it.configuration?.pending) {
                hadDuplicates = true;
                continue;
            }
            if (sid && seen.has(sid)) {
                hadDuplicates = true;
                continue; // Deduplicate accidental double adds
            }
            if (sid) seen.add(sid);
            deduplicated.push(it);
        }
        if (hadDuplicates) {
            useCheckoutStore.setState({ serviceItems: deduplicated });
        }
    }, [storeHydrated]);

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
    const [measurementSchedule, setMeasurementSchedule] = useState(() => ({
        scheduledDate: restoreBasketItem?.configuration?.scheduledDate || restored.measurementSchedule?.scheduledDate || restored.scheduledDate || '',
        scheduledTimeSlot: restoreBasketItem?.configuration?.scheduledTimeSlot || restored.measurementSchedule?.scheduledTimeSlot || restored.scheduledTimeSlot || 'ASAP',
        scheduledTime: restoreBasketItem?.configuration?.scheduledTime || restored.measurementSchedule?.scheduledTime || restored.scheduledTime || null,
        isAsap: restoreBasketItem?.configuration?.isAsap ?? (restored.measurementSchedule?.isAsap ?? (restored.isAsap ?? true)),
    }));
    const [selectedAddons, setSelectedAddons] = useState(
        restoreBasketItem?.configuration?.addons || restored.selectedAddons || []
    );
    const [selectedCustomizations, setSelectedCustomizations] = useState(
        restoreBasketItem?.configuration?.customizations || restored.selectedCustomizations || {}
    );
    const [catalogCustomizations, setCatalogCustomizations] = useState([]);
    const [isUploadingCustomStyle, setIsUploadingCustomStyle] = useState(false);

    const handleCustomStyleUpload = async () => {
        if (isUploadingCustomStyle) return;
        const file = await pickImage({ base64: true });
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
                imageUrl = fileToDataUrl(file);
            }

            if (imageUrl) {
                setSelectedStyle({
                    name: 'Custom Reference Design',
                    image: imageUrl,
                    isCustom: true,
                    description: 'Customer uploaded reference design photo'
                });
                Promise.resolve({ toast }).then(({ toast }) => {
                    toast.success('Style reference photo uploaded!');
                });
            } else {
                Promise.resolve({ toast }).then(({ toast }) => {
                    toast.error('Failed to upload style photo.');
                });
            }
        } catch (err) {
            console.error('Failed to upload custom style image:', err);
            Promise.resolve({ toast }).then(({ toast }) => {
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
        setSelectedCustomizations(cfg.customizations || {});
        setIsTailorAtHome(!!cfg.isTailorAtHome || m?.type === 'home');
        if (cfg.scheduledDate || cfg.scheduledTimeSlot || cfg.measurementSchedule) {
            setMeasurementSchedule({
                scheduledDate: cfg.scheduledDate || cfg.measurementSchedule?.scheduledDate || '',
                scheduledTimeSlot: cfg.scheduledTimeSlot || cfg.measurementSchedule?.scheduledTimeSlot || 'ASAP',
                scheduledTime: cfg.scheduledTime || cfg.measurementSchedule?.scheduledTime || null,
                isAsap: cfg.isAsap ?? (cfg.measurementSchedule?.isAsap ?? true),
            });
        }
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
            scrollToSection('measurement-section');
        });
    }, [id, location.state?.editBasketIndex, location.state?.restoreBasketItem?.basketId]);

    // Save draft state to sessionStore so page refresh retains all inputs & confirmations
    useEffect(() => {
        if (!id) return;
        try {
            const draft = {
                deliveryType,
                measurementType,
                selectedStyle,
                isTailorAtHome,
                measurementSchedule,
                selectedAddons,
                selectedCustomizations,
                fabricSource,
                selectedFabric,
                selectedSavedProfile,
                measurements,
                currentStep
            };
            sessionStore.setItem(`service_draft_${id}`, JSON.stringify(draft));
        } catch (e) {
            console.error("Failed to save service draft:", e);
        }
    }, [id, deliveryType, measurementType, selectedStyle, isTailorAtHome, measurementSchedule, selectedAddons, selectedCustomizations, fabricSource, selectedFabric, selectedSavedProfile, measurements, currentStep]);

    // Sticky booking bar is always visible (was previously scroll-to-bottom only,
    // which hid "Add Another" / "Book Now" for most users).
    const showFooter = true;

    useEffect(() => {
        let isMounted = true;
        
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const targetTailorId = location.state?.tailorId || null;
                const results = await Promise.allSettled([
                    api.get(`/services/${id}`),
                    targetTailorId ? api.get(`/tailors/${targetTailorId}`) : Promise.resolve(null)
                ]);

                if (!isMounted) return;

                if (results[0].status === 'fulfilled') {
                    const service = results[0].value?.data?.data;
                    if (service) {
                        setServiceData(service);
                        // Default to the service's own tailor
                        if (service.tailor) {
                            setPreSelectedTailor(service.tailor);
                        }
                    }
                }
                if (results[1]?.status === 'fulfilled' && results[1].value?.data?.data) {
                    setPreSelectedTailor(results[1].value.data.data);
                }
                
                if (location.state?.selectedFabric) {
                    setFabricSource('platform');
                    setSelectedFabric(location.state.selectedFabric);
                }

                // Fetch global settings and customization catalog
                const [settingsRes, addonsRes] = await Promise.all([
                    api.get('/cms/settings'),
                    api.get('/style-addons?isActive=true')
                ]);
                
                if (!isMounted) return;

                if (addonsRes.data?.success) {
                    setCatalogCustomizations(addonsRes.data.data || []);
                }
                
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
            <Screen className="bg-gray-50">
                <Box className="z-50 bg-white/80 px-5 py-3 border-b border-gray-100 flex items-center justify-between">
                    <Box className="flex items-center gap-3">
                        <Box className="w-8 h-8 bg-gray-200 rounded-full" />
                        <Box>
                            <Box className="w-32 h-4 bg-gray-200 rounded mb-1" />
                            <Box className="w-20 h-2 bg-gray-200 rounded" />
                        </Box>
                    </Box>
                </Box>
                <Box className="px-4 mt-6 space-y-6">
                    <Box className="flex justify-between px-4 mb-8">
                        {[1, 2, 3].map((i) => (
                            <Box key={i} className="flex flex-col items-center gap-2">
                                <Box className="w-8 h-8 bg-gray-200 rounded-full" />
                                <Box className="w-12 h-2 bg-gray-200 rounded" />
                            </Box>
                        ))}
                    </Box>
                    {[1, 2].map((i) => (
                        <Box key={i} className="bg-white p-4 rounded-2xl border border-gray-100 flex gap-4">
                            <Box className="w-16 h-16 bg-gray-200 rounded-xl shrink-0" />
                            <Box className="flex-1 space-y-2 py-1">
                                <Box className="w-3/4 h-4 bg-gray-200 rounded" />
                                <Box className="w-1/2 h-3 bg-gray-200 rounded" />
                                <Box className="w-1/4 h-3 bg-gray-200 rounded mt-2" />
                            </Box>
                        </Box>
                    ))}
                    <Box className="bg-white p-5 rounded-2xl border border-gray-100 mt-6">
                        <Box className="w-1/3 h-4 bg-gray-200 rounded mb-4" />
                        <Box className="space-y-3">
                            <Box className="w-full h-12 bg-gray-100 rounded-xl" />
                            <Box className="w-full h-12 bg-gray-100 rounded-xl" />
                            <Box className="w-full h-12 bg-gray-100 rounded-xl" />
                        </Box>
                    </Box>
                </Box>
            </Screen>
        );
    }

    if (!serviceData) {
        return (
            <Screen className="bg-white">
                <Box className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                    <Txt className="text-xl font-bold text-gray-900">Service Not Found</Txt>
                    <Btn onPress={() => navigate(-1)} className="mt-4 text-primary font-bold underline">Go Back</Btn>
                </Box>
            </Screen>
        );
    }

    // Pricing Logic
    const basePrice = serviceData.basePrice || 0;
    
    const deliveryPrice = deliveryType === 'express' ? 150 : (deliveryType === 'premium' ? 350 : 0);
    const fabricPrice = (fabricSource === 'platform' && selectedFabric) ? selectedFabric.price : 0;
    const addonsPrice = selectedAddons.reduce((sum, a) => sum + a.price, 0);
    const customizationsPrice = Object.values(selectedCustomizations || {}).reduce((sum, item) => {
        if (item && item.enabled && item.price) {
            return sum + (Number(item.price) || 0);
        }
        return sum;
    }, 0);
    
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
        
        if (distance <= visitSettings.freeKm) return visitSettings.baseFee || 99;
        
        const calculated = Math.round((visitSettings.baseFee || 99) + (distance - visitSettings.freeKm) * (visitSettings.perKmFee || 8));
        const maxFee = visitSettings.maxFee || 299;
        return Math.min(calculated, maxFee);
    };

    const tailorAtHomePrice = calculateVisitPrice();

    // Check if this service is already present in the basket
    const existingIndex = serviceItems.findIndex((row) => {
        const sid = String(row.serviceDetails?._id || row.serviceDetails?.id || '');
        return sid === String(serviceData?._id || id);
    });

    // Active item index in basket
    const activeIndex = editBasketIndex != null && editBasketIndex >= 0
        ? editBasketIndex
        : existingIndex;

    // Other items in basket (excluding current item being edited/viewed)
    const otherBasketItems = activeIndex >= 0
        ? serviceItems.filter((_, idx) => idx !== activeIndex)
        : serviceItems;

    // Check if another basket item already covers the Home Visit fee for this order
    const isVisitCoveredInOrder = otherBasketItems.some(
        i => i.configuration?.isTailorAtHome || i.isTailorAtHome || (Number(i.pricing?.tailorAtHome) > 0)
    );
    const activeItemVisitFee = (isTailorAtHome && !isVisitCoveredInOrder) ? tailorAtHomePrice : 0;
    
    // Match backend calculation: Platform fee on base + addons + customizations
    const platformFee = Math.round((basePrice + addonsPrice + customizationsPrice) * (platformFeePercentage / 100));
    const taxableAmount = basePrice + addonsPrice + customizationsPrice + fabricPrice + activeItemVisitFee + platformFee;
    const taxes = Math.round(taxableAmount * (gstPercentage / 100));
    
    // Delivery fee is outside GST calculation on backend
    // Current Total for active service configuration
    const currentTotal = taxableAmount + taxes + deliveryPrice;

    // Accurately compute order totals matching backend checkoutPricing.js exactly:
    const otherBase = otherBasketItems.reduce((sum, item) => sum + (Number(item.pricing?.base) || 0), 0);
    const otherAddons = otherBasketItems.reduce((sum, item) => sum + (Number(item.pricing?.addons) || 0), 0);
    const otherCustomizations = otherBasketItems.reduce((sum, item) => sum + (Number(item.pricing?.customizations) || 0), 0);
    const otherFabric = otherBasketItems.reduce((sum, item) => sum + (Number(item.pricing?.fabric) || 0), 0);
    const otherBasketTotal = otherBasketItems.reduce((sum, item) => {
        const itemTotal = Number(item.pricing?.total) || Number(item.totalPrice) || 
            ((Number(item.pricing?.base) || 0) + (Number(item.pricing?.addons) || 0) + (Number(item.pricing?.customizations) || 0) + (Number(item.pricing?.fabric) || 0));
        return sum + itemTotal;
    }, 0);

    const totalOrderBase = otherBase + basePrice;
    const totalOrderAddons = otherAddons + addonsPrice;
    const totalOrderCusts = otherCustomizations + customizationsPrice;
    const totalOrderFabric = otherFabric + fabricPrice;

    // Visit fee is charged once if any item in basket (or current form) has tailor at home
    const hasOrderHomeVisit = isTailorAtHome || otherBasketItems.some(i => i.configuration?.isTailorAtHome || i.isTailorAtHome || (Number(i.pricing?.tailorAtHome) > 0));
    const effectiveVisitFee = hasOrderHomeVisit ? tailorAtHomePrice : 0;

    // Delivery fee is charged once if any item needs delivery
    const hasOrderDelivery = (deliveryPrice > 0) || otherBasketItems.some(i => i.configuration?.deliveryType && i.configuration.deliveryType !== 'self');
    const effectiveDeliveryFee = hasOrderDelivery ? deliveryPrice : 0;

    const totalOrderPlatformFee = Math.round((totalOrderBase + totalOrderAddons + totalOrderCusts) * (platformFeePercentage / 100));
    const totalOrderTaxable = totalOrderBase + totalOrderAddons + totalOrderCusts + totalOrderFabric + effectiveVisitFee + totalOrderPlatformFee;
    const totalOrderTaxes = Math.round(totalOrderTaxable * (gstPercentage / 100));

    // Grand Total (Accurate across all basket items without double-counting shared fees)
    const grandTotal = Math.round(totalOrderTaxable + totalOrderTaxes + effectiveDeliveryFee);

    const getDeliveryDays = () => {
        if (deliveryType === 'express') return 10;
        if (deliveryType === 'premium') return 7;
        return 15;
    };

    const resetDraftForm = () => {
        setMeasurementType(null);
        setMeasurements(null);
        setSelectedStyle(null);
        setSelectedAddons([]);
        setSelectedCustomizations({});
        setSelectedSavedProfile(null);
        setIsTailorAtHome(false);
        setFabricSource('customer');
        setSelectedFabric(null);
        setDeliveryType('standard');
        setMeasurementSchedule({
            scheduledDate: '',
            scheduledTimeSlot: 'ASAP',
            scheduledTime: null,
            isAsap: true,
        });
        try {
            sessionStore.removeItem(`service_draft_${id}`);
        } catch (e) {}
    };

    const handleRemoveBasketItem = (index) => {
        removeServiceItem(index);
        Promise.resolve({ toast }).then(({ toast }) => {
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
                scheduledDate: isTailorAtHome ? (measurementSchedule.scheduledDate || formatYYYYMMDD(new Date())) : null,
                scheduledTimeSlot: isTailorAtHome ? (measurementSchedule.isAsap ? 'ASAP' : (measurementSchedule.scheduledTimeSlot || 'ASAP')) : null,
                scheduledTime: isTailorAtHome ? (measurementSchedule.isAsap ? null : measurementSchedule.scheduledTime) : null,
                isAsap: isTailorAtHome ? !!measurementSchedule.isAsap : true,
                measurementSchedule: isTailorAtHome ? measurementSchedule : null,
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
                customizations: selectedCustomizations,
                pending: false,
            },
            pricing: { 
                base: basePrice, 
                delivery: deliveryPrice, 
                fabric: fabricPrice, 
                addons: addonsPrice,
                customizations: customizationsPrice,
                tailorAtHome: activeItemVisitFee,
                platformFee,
                taxes, 
                gstPercentage,
                platformFeePercentage,
                total: basePrice + addonsPrice + customizationsPrice + fabricPrice, 
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
                Promise.resolve({ toast }).then(({ toast }) => {
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
            Promise.resolve({ toast }).then(({ toast }) => {
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
            Promise.resolve({ toast }).then(({ toast }) => {
                toast.error('Please complete measurements for this service before adding another');
            });
            scrollToSection('measurement-section');
            return;
        }
        if (checkCartConflict()) return;
        const item = await prepareDraftItem();
        const idx = editBasketIndex != null && editBasketIndex >= 0 ? editBasketIndex : -1;

        if (idx >= 0 && idx < serviceItems.length) {
            updateServiceItem(idx, item);
        } else {
            addServiceItem(item);
        }
        setBuyNowMode(false, null);
        setActiveBasketIndex(null);
        resetDraftForm();
        Promise.resolve({ toast }).then(({ toast }) => {
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
        } else {
            navigate('/user/checkout/address');
        }
    };

    const handleAddMore = async () => {
        if (!isMeasurementValid) {
            Promise.resolve({ toast }).then(({ toast }) => {
                toast.error('Please complete measurements for this garment first');
            });
            scrollToSection('measurement-section');
            return;
        }
        if (checkCartConflict()) return;
        const item = await prepareDraftItem();

        const existingIdx = serviceItems.findIndex((row) => {
            const sid = String(row.serviceDetails?._id || row.serviceDetails?.id || '');
            return sid === String(serviceData?._id || id);
        });
        const idx = editBasketIndex != null && editBasketIndex >= 0 ? editBasketIndex : existingIdx;

        if (idx >= 0 && idx < serviceItems.length) {
            updateServiceItem(idx, item);
            setBuyNowMode(false, null);
            setActiveBasketIndex(null);
            resetDraftForm();
            Promise.resolve({ toast }).then(({ toast }) => {
                toast.success(`Saved in basket (${useCheckoutStore.getState().serviceItems.length} items)`);
            });
            requestAnimationFrame(() => {
                scrollToSection('order-basket');
            });
            return;
        }

        addServiceItem(item);
        setBuyNowMode(false, null);
        setActiveBasketIndex(null);
        resetDraftForm();
        Promise.resolve({ toast }).then(({ toast }) => {
            toast.success(`Added to basket (${useCheckoutStore.getState().serviceItems.length} items)`, {
                duration: 3500,
            });
        });
        requestAnimationFrame(() => {
            scrollToSection('order-basket');
        });
    };

    const handleCheckoutBasket = () => {
        if (!serviceItems.length) return;
        if (!requireAuth('Please login to book these services')) return;
        setBuyNowMode(false, null);
        goToCheckoutAfterItemsReady();
    };

    const handleBuyNow = async () => {
        if (!isMeasurementValid) {
            Promise.resolve({ toast }).then(({ toast }) => {
                toast.error('Please complete measurements or select "Tailor at Home" to proceed');
            });
            scrollToSection('measurement-section');
            return;
        }
        if (!requireAuth('Please login to book this service')) return;
        if (checkCartConflict()) return;
        const item = await prepareDraftItem();

        const existingIdx = serviceItems.findIndex((row) => {
            const sid = String(row.serviceDetails?._id || row.serviceDetails?.id || '');
            return sid === String(serviceData?._id || id);
        });
        const idx = editBasketIndex != null && editBasketIndex >= 0 ? editBasketIndex : existingIdx;

        if (idx >= 0 && idx < serviceItems.length) {
            updateServiceItem(idx, item);
            setBuyNowMode(false, null);
        } else if (serviceItems.length > 0) {
            addServiceItem(item);
            setBuyNowMode(false, null);
        } else {
            // Direct single service checkout: use buyNowMode so if user presses Back, basket remains clean!
            setBuyNowMode(true, item);
        }
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
                scrollToSection('measurement-section');
            });
            Promise.resolve({ toast }).then(({ toast }) => {
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

    const styleOptions = (serviceData?.selectedStyles && serviceData.selectedStyles.length > 0) ? serviceData.selectedStyles : serviceData?.category?.styles || [];

    return (
        <Screen className="bg-white" bottom={false}>
            <Box className="flex-1 bg-gray-50 font-sans">
                {/* 1. Header & Stepper */}
                <Box className="z-50 bg-white/80">
                    <Box className="px-5 py-3 flex items-center justify-between border-b border-gray-100">
                        <Box className="flex items-center gap-3 flex-1 min-w-0">
                            <Btn onPress={() => navigate(-1)} className="p-2 -ml-2 rounded-full" accessibilityLabel="Back">
                                <I icon={ArrowLeft} size={22} color="#111827" />
                            </Btn>
                            <Box className="flex-1 min-w-0">
                                <Txt className="text-base font-black text-gray-900 leading-none" numberOfLines={1}>{serviceData.title}</Txt>
                                <Txt className="text-[10px] text-primary font-bold uppercase tracking-widest mt-1">Configuring Order</Txt>
                            </Box>
                        </Box>
                        {serviceItems.length > 0 && (
                            <Box className="flex items-center gap-1.5 bg-primary px-3 py-1.5 rounded-full shadow-lg shadow-indigo-100">
                                <I icon={ShoppingBag} size={12} color="#fff" />
                                <Txt className="text-[10px] font-black text-white">{serviceItems.length} Items</Txt>
                            </Box>
                        )}
                    </Box>
                    {!isAlteration && <BookingStepper currentStepId={measurements ? 'review' : (measurementType ? 'details' : 'fabric')} />}
                </Box>

                <Scroll ref={scrollRef} className="flex-1" contentClassName="px-4 mt-4 space-y-3.5 pb-80">
                    {/* Current service header */}
                    <Box className="bg-white rounded-[1.5rem] p-3.5 border border-primary/15 shadow-sm space-y-3">
                        <Box className="flex items-center gap-3">
                            <Box className="w-16 h-20 rounded-xl overflow-hidden bg-gray-100 border border-gray-100 shrink-0">
                                <Img src={getImageUrl(serviceData.image) || IMG_FALLBACK} fallback={IMG_FALLBACK} alt={serviceData.title} className="w-full h-full object-cover" />
                            </Box>
                            <Box className="min-w-0 flex-1">
                                <Box className="flex items-center justify-between gap-1">
                                    <Txt className="text-[9px] font-black uppercase tracking-wider text-primary flex-1" numberOfLines={1}>{preSelectedTailor?.shopName ? `By ${preSelectedTailor.shopName}` : 'Selected Service'}</Txt>
                                    <Txt className="text-sm font-black text-primary">₹{(serviceData.basePrice || 0).toLocaleString()}</Txt>
                                </Box>
                                <Txt className="text-sm font-black text-gray-900 truncate mt-0.5">{serviceData.title}</Txt>
                                <Txt className="text-[11px] font-medium text-gray-500 mt-0.5">
                                    {fabricSource === 'platform' ? 'Tailor Fabric' : 'Customer Fabric'}
                                    {selectedStyle?.name ? ` · ${selectedStyle.name}` : ''}
                                    {isMeasurementValid ? ' · Measurements ✓' : ' · Measurements required'}
                                </Txt>
                            </Box>
                        </Box>
                        <Btn onPress={handleSaveAndAddAnother} className="w-full py-2.5 rounded-xl bg-primary/10 text-primary font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-2">
                            <I icon={ShoppingBag} size={14} />
                            <Txt>+ Add another service to order</Txt>
                        </Btn>
                    </Box>

                    {/* Basket */}
                    {storeHydrated && serviceItems.length > 0 && (
                        <Box onLayout={onSectionLayout('order-basket')}>
                            <Box className="bg-white rounded-[2rem] p-5 shadow-sm border border-primary/15 overflow-hidden relative">
                                <Box className="flex items-center justify-between mb-3 gap-2">
                                    <Txt className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Your order basket ({serviceItems.length})</Txt>
                                    <Btn onPress={handleCheckoutBasket} className="text-[9px] font-black uppercase tracking-wider bg-primary text-white px-3 py-1.5 rounded-lg">Checkout</Btn>
                                </Box>
                                <Box className="space-y-2.5">
                                    {serviceItems.map((item, idx) => {
                                        const thumbSrc = getImageUrl(item.configuration?.selectedStyle?.image || item.configuration?.selectedFabric?.image || item.configuration?.selectedFabric?.images?.[0] || item.serviceDetails?.image || item.serviceDetails?.images?.[0]);
                                        const measureType = item.configuration?.pending ? 'Complete details' : item.configuration?.isTailorAtHome ? 'Home visit' : item.configuration?.measurements?.type || 'Custom';
                                        const rowCls = editBasketIndex === idx ? 'bg-primary/5 border-primary/40 ring-1 ring-primary/30' : item.configuration?.pending ? 'bg-amber-50/80 border-amber-200' : 'bg-gray-50 border-gray-100';
                                        return (
                                            <Box key={item.basketId || idx} className={`flex items-center justify-between p-3 rounded-2xl border ${rowCls}`}>
                                                <Btn onPress={() => openBasketItem(item, idx)} className="flex items-center gap-3 min-w-0 flex-1 text-left">
                                                    <Box className="w-14 h-16 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden border border-gray-100 shrink-0">
                                                        {thumbSrc ? <Img src={thumbSrc} fallback="https://placehold.co/112x128/e6e8f0/843d9b/png?text=Item" className="w-full h-full object-cover" /> : <I icon={Scissors} size={18} color="#843D9B" />}
                                                    </Box>
                                                    <Box className="min-w-0 flex-1">
                                                        <Txt className="text-xs font-black text-gray-900 truncate">{idx + 1}. {item.serviceDetails?.title}</Txt>
                                                        <Txt className="text-[9px] text-gray-400 font-bold uppercase mt-0.5">
                                                            {item.configuration?.pending ? 'Pending · tap to fill measurements' : `₹${Number(item.pricing?.total || 0).toLocaleString()} · ${String(measureType).replace(/-/g, ' ')}`}
                                                        </Txt>
                                                        <Txt className="text-[9px] text-primary font-bold mt-0.5">{editBasketIndex === idx ? 'Editing this item · measurements below' : 'Tap to view / edit measurements →'}</Txt>
                                                    </Box>
                                                </Btn>
                                                <Btn onPress={() => handleRemoveBasketItem(idx)} className="px-2.5 py-2 text-[9px] font-black uppercase tracking-wider text-red-500 bg-red-50 rounded-xl shrink-0">Remove</Btn>
                                            </Box>
                                        );
                                    })}
                                </Box>
                                <Box className="mt-4 gap-2">
                                    <Btn onPress={handleSaveAndAddAnother} className="w-full py-3 rounded-xl bg-primary text-white font-black text-[11px] uppercase tracking-wider flex items-center justify-center gap-2">
                                        <I icon={ShoppingBag} size={14} />
                                        <Txt>+ Add another service</Txt>
                                    </Btn>
                                    <Txt className="text-[9px] text-gray-400 font-medium text-center leading-relaxed">Only this tailor’s services can be added. Highlighted row = item you’re editing below.</Txt>
                                </Box>
                            </Box>
                        </Box>
                    )}

                    {/* 2. Fabric choice */}
                    {!isAlteration && (
                        <FabricSelector selected={fabricSource} onSelect={setFabricSource} selectedFabric={selectedFabric} onSelectFabric={setSelectedFabric} tailor={preSelectedTailor} />
                    )}

                    {/* 2.5 Style variant & custom photo */}
                    {!isAlteration && (
                        <Box className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-3">
                            <Box className="flex items-center gap-3 mb-3">
                                <Box className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                                    <I icon={Scissors} size={18} color="#843D9B" />
                                </Box>
                                <Box className="flex-1">
                                    <Txt className="text-xs font-black text-gray-900 uppercase tracking-widest leading-tight">Choose Style Variant / Upload Design</Txt>
                                    <Txt className="text-[10px] text-gray-400 font-bold leading-none mt-0.5">Select a style design or upload your custom reference photo</Txt>
                                </Box>
                            </Box>
                            <Box className="grid grid-cols-2 gap-2.5">
                                <Box className={`p-3 rounded-2xl border flex flex-col justify-between relative overflow-hidden ${selectedStyle?.isCustom ? 'border-primary bg-purple-50/60 shadow-md ring-2 ring-primary/20' : 'border-dashed border-gray-300 bg-gray-50/70'}`}>
                                    {selectedStyle?.isCustom && selectedStyle.image ? (
                                        <Box className="relative">
                                            <Box className="aspect-[4/3] rounded-xl overflow-hidden mb-2 bg-gray-100">
                                                <Img src={selectedStyle.image} alt="Custom Reference" className="w-full h-full object-cover" />
                                            </Box>
                                            <Btn onPress={() => setSelectedStyle(null)} className="absolute top-1 right-1 p-1 bg-red-500 rounded-full shadow-md" accessibilityLabel="Remove photo">
                                                <I icon={X} size={12} color="#fff" />
                                            </Btn>
                                        </Box>
                                    ) : (
                                        <Btn onPress={handleCustomStyleUpload} disabled={isUploadingCustomStyle} className="relative flex flex-col items-center justify-center py-4">
                                            {isUploadingCustomStyle ? (
                                                <Spin size={24} color="#843D9B" style={{ marginBottom: 8 }} />
                                            ) : (
                                                <Box className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center mb-2 shadow-xs">
                                                    <I icon={Upload} size={18} color="#843D9B" />
                                                </Box>
                                            )}
                                            <Txt className="text-xs font-black text-purple-900 text-center">{isUploadingCustomStyle ? 'Uploading...' : 'Upload Design Photo'}</Txt>
                                            <Txt className="text-[9px] text-gray-400 font-medium text-center mt-0.5">Photo of preferred design</Txt>
                                        </Btn>
                                    )}
                                    {selectedStyle?.isCustom && (
                                        <Box className="mt-1">
                                            <Txt className="text-xs font-black text-purple-900 truncate">Custom Reference Photo</Txt>
                                            <Txt className="text-[8px] font-black uppercase px-2 py-0.5 rounded-full bg-primary text-white mt-1">Uploaded ✓</Txt>
                                        </Box>
                                    )}
                                </Box>
                                {styleOptions.map((style, idx) => {
                                    const styleName = style.name || style;
                                    const isSelected = selectedStyle?.name === styleName && !selectedStyle?.isCustom;
                                    return (
                                        <Btn key={idx} onPress={() => (isSelected ? setSelectedStyle(null) : setSelectedStyle({ name: styleName, image: style.image, description: style.description, isCustom: false }))}
                                            className={`p-3 rounded-2xl border flex flex-col justify-between relative overflow-hidden text-left ${isSelected ? 'border-primary bg-purple-50/60 shadow-md ring-2 ring-primary/20' : 'border-gray-100 bg-gray-50/50'}`}>
                                            {!!style.image && (
                                                <Box className="aspect-[4/3] rounded-xl overflow-hidden mb-2 bg-gray-100">
                                                    <Img src={getImageUrl(style.image)} alt={styleName} className="w-full h-full object-cover" />
                                                </Box>
                                            )}
                                            <Box>
                                                <Txt className={`text-xs font-black truncate ${isSelected ? 'text-purple-900' : 'text-gray-900'}`}>{styleName}</Txt>
                                                {!!style.description && <Txt className="text-[9px] text-gray-500 font-medium line-clamp-2 mt-0.5">{style.description}</Txt>}
                                            </Box>
                                            <Box className="mt-2 flex justify-between items-center">
                                                <Txt className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${isSelected ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'}`}>{isSelected ? 'Selected ✓' : 'Select'}</Txt>
                                            </Box>
                                        </Btn>
                                    );
                                })}
                            </Box>
                        </Box>
                    )}

                    {/* 2.6 Customizations */}
                    {!isAlteration && (
                        <CustomizationSelector categoryName={serviceData?.category?.name || serviceData?.title} catalogAddons={catalogCustomizations} selectedCustomizations={selectedCustomizations} onChange={setSelectedCustomizations} />
                    )}

                    {/* 3. Measurements */}
                    {!isAlteration && (
                        <Box onLayout={onSectionLayout('measurement-section')}>
                            <Box className="mb-2 px-1 flex items-center justify-between gap-2">
                                <Txt className="text-[10px] font-black uppercase tracking-wider text-gray-400">Measurements for</Txt>
                                <Txt className="text-[10px] font-black uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-full" numberOfLines={1}>
                                    {editBasketIndex != null ? `${editBasketIndex + 1}. ${serviceItems[editBasketIndex]?.serviceDetails?.title || serviceData?.title || 'Item'}` : (serviceData?.category?.name || serviceData?.title || 'This garment')}
                                </Txt>
                            </Box>
                            <MeasurementSelector
                                key={`measure-${id}-${editBasketIndex ?? 'x'}-${formEpoch}`}
                                selectedType={measurementType}
                                visitPrice={isCalculatingDistance ? '...' : (tailorAtHomePrice || visitSettings.baseFee)}
                                isDistanceBased={!!preSelectedTailor}
                                measurementFields={serviceData?.category?.measurementFields || []}
                                categoryName={serviceData?.category?.name || serviceData?.title}
                                categoryId={serviceData?.category?._id || serviceData?.category || null}
                                isVisitCoveredInOrder={isVisitCoveredInOrder}
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
                                            if (prev && (prev.isConfirmed || prev.type === 'self' || prev.type === 'slip' || prev.image || prev.url || prev.slipUrl)) return { ...prev, sampleGarment: true };
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
                                }}
                                onMeasurementComplete={(data) => {
                                    if (!data) return;
                                    setMeasurements((prev) => {
                                        if (prev && (prev.isConfirmed || prev.type === 'self') && data.type === 'slip') return { ...prev, ...data, type: 'self', slipAttached: true };
                                        if (prev?.sampleGarment) return { ...prev, ...data, sampleGarment: true };
                                        return data;
                                    });
                                }}
                                selectedSavedProfile={selectedSavedProfile}
                                onSelectSavedProfile={setSelectedSavedProfile}
                                disableHomeVisit={hasSelfMeasurements}
                                completedSelfData={measurements?.type === 'self' || measurements?.isConfirmed ? measurements : null}
                                completedSlipData={measurements?.type === 'slip' || measurements?.slipImage || measurements?.image || measurements?.url ? measurements : null}
                            />
                            {isTailorAtHome && (
                                <Box className="mt-3">
                                    <MeasurementSchedulePicker value={measurementSchedule} onChange={setMeasurementSchedule} />
                                </Box>
                            )}
                        </Box>
                    )}

                    {/* 3.5 Style add-ons */}
                    <Box className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
                        <Box className="flex items-center justify-between gap-2 mb-3">
                            <Box className="flex items-center gap-3 flex-1">
                                <Box className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                                    <I icon={Wand2} size={18} color="#843D9B" />
                                </Box>
                                <Box>
                                    <Txt className="text-[11px] font-black text-gray-900 uppercase tracking-widest leading-tight">Style Add-ons</Txt>
                                    <Txt className="text-[9px] text-gray-400 font-bold leading-none mt-0.5">Pockets, Padding, etc.</Txt>
                                </Box>
                            </Box>
                            <Btn onPress={() => setIsAddonModalOpen(true)} className="px-3 py-2 bg-primary/5 text-primary text-[9px] font-black uppercase tracking-widest rounded-lg shrink-0">
                                {selectedAddons.length > 0 ? 'Edit' : 'Browse'}
                            </Btn>
                        </Box>
                        {selectedAddons.length > 0 ? (
                            <Box className="flex flex-wrap gap-2">
                                {selectedAddons.map((addon) => (
                                    <Box key={addon._id} className="flex items-center gap-2 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-xl">
                                        <Box className="w-4 h-4 rounded-full bg-white flex items-center justify-center border border-gray-200">
                                            <I icon={CheckCircle2} size={10} color="#22c55e" />
                                        </Box>
                                        <Txt className="text-[10px] font-bold text-gray-700">{addon.name}</Txt>
                                        <Btn onPress={() => setSelectedAddons((prev) => prev.filter((a) => a._id !== addon._id))} className="ml-1" hitSlop={8}>
                                            <I icon={X} size={10} color="#f87171" />
                                        </Btn>
                                    </Box>
                                ))}
                            </Box>
                        ) : (
                            <Box className="p-4 border-2 border-dashed border-gray-100 rounded-2xl items-center">
                                <Txt className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">No add-ons selected</Txt>
                            </Box>
                        )}
                    </Box>

                    {/* 4. Delivery */}
                    <DeliverySelector selected={deliveryType} onSelect={setDeliveryType} />

                    {/* 5. Policies */}
                    <Box className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
                        <Box className="flex items-center gap-3 mb-4">
                            <Box className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                                <I icon={Info} size={18} color="#843D9B" />
                            </Box>
                            <Box>
                                <Txt className="text-xs font-black text-gray-900 uppercase tracking-widest">Order Policies</Txt>
                                <Txt className="text-[10px] text-gray-400 font-bold">Standard terms of service</Txt>
                            </Box>
                        </Box>
                        <Box className="space-y-4">
                            {['Free alteration within 7 days of delivery for perfect fitting.', 'Free cancellation before tailor picks up your fabric.'].map((t) => (
                                <Box key={t} className="flex items-start gap-3">
                                    <Box className="mt-1"><I icon={CheckCircle2} size={12} color="#22c55e" /></Box>
                                    <Txt className="text-[11px] text-gray-500 font-medium flex-1">{t}</Txt>
                                </Box>
                            ))}
                        </Box>
                    </Box>

                    {/* 6. FAQ */}
                    <Box className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100">
                        <Txt className="text-xs font-black text-gray-900 uppercase tracking-widest mb-4 opacity-40">Frequently Asked</Txt>
                        <FAQItem question="How do I give my measurements?" answer="You can enter measurements manually, upload a photo of your fitting garment, or request a master visit for home measurements." />
                        <FAQItem question="What if my fabric is short?" answer="The tailor will inspect the fabric upon pickup. If it's insufficient for the design, we'll notify you before cutting." />
                        <FAQItem question="Is GST included?" answer="Yes, all prices shown on the Live Bill include necessary taxes and platform fees." />
                    </Box>
                </Scroll>

                {/* 7. Live bill footer */}
                {showFooter && (
                    <Box className="absolute bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 p-3 pb-4 shadow-[0_-10px_40px_rgba(0,0,0,0.08)]" style={{ elevation: 16, paddingBottom: 16 + bottomInset }}>
                        <Box className="w-full max-w-md mx-auto">
                            <Box className="flex justify-between items-center mb-3">
                                <Box className="flex flex-col">
                                    <Box className="flex items-center gap-1.5 mb-0.5">
                                        <Txt className="text-[9px] font-black text-primary uppercase tracking-tighter">Live Bill</Txt>
                                        <Box className="w-1.5 h-1.5 rounded-full bg-green-500" />
                                    </Box>
                                    <Box className="flex flex-row items-end gap-1">
                                        <Txt className="text-xl font-black text-gray-900 leading-none">₹{grandTotal.toLocaleString()}</Txt>
                                        <Txt className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Incl. GST</Txt>
                                        <Btn onPress={() => setShowPriceBreakdown(!showPriceBreakdown)} className="ml-1 p-0.5 rounded-full" hitSlop={8}>
                                            <I icon={showPriceBreakdown ? ChevronDown : ChevronUp} size={14} color="#6b7280" />
                                        </Btn>
                                    </Box>
                                </Box>
                                <Box className="items-end">
                                    <Txt className="text-[8px] font-black text-gray-400 uppercase tracking-tighter mb-0.5">Est. Arrival</Txt>
                                    <Box className="flex items-center justify-end gap-1 bg-indigo-50 px-2 py-0.5 rounded-lg border border-primary/10">
                                        <I icon={Clock} size={10} color="#843D9B" />
                                        <Txt className="text-[10px] font-black text-primary">{getDeliveryDays()} Days</Txt>
                                    </Box>
                                </Box>
                            </Box>
                            <Scroll horizontal contentClassName="flex gap-1.5 pb-3">
                                <Box className="shrink-0 bg-gray-50 px-2 py-1 rounded-md border border-gray-100 flex items-center gap-1.5">
                                    <I icon={Scissors} size={8} color="#9ca3af" />
                                    <Txt className="text-[9px] font-black text-gray-500 uppercase">Current: ₹{currentTotal}</Txt>
                                </Box>
                                {otherBasketItems.length > 0 && (
                                    <Box className="shrink-0 bg-indigo-50 px-2 py-1 rounded-md border border-primary/10 flex items-center gap-1.5">
                                        <I icon={ShoppingBag} size={8} color="#843D9B" />
                                        <Txt className="text-[9px] font-black text-primary uppercase">Basket: ₹{otherBasketTotal}</Txt>
                                    </Box>
                                )}
                            </Scroll>
                            {showPriceBreakdown && (
                                <Box className="overflow-hidden mb-3">
                                    <Box className="bg-gray-50 rounded-xl p-3 border border-gray-100 space-y-1.5 text-xs text-gray-600">
                                        {otherBasketItems.length > 0 && <Row l={`Other Basket Items (${otherBasketItems.length})`} r={`₹${otherBasketTotal.toLocaleString()}`} cls="font-medium text-primary" />}
                                        <Row l="Current Item Base" r={`₹${basePrice.toLocaleString()}`} />
                                        {fabricPrice > 0 && <Row l="Fabric" r={`+₹${fabricPrice.toLocaleString()}`} cls="text-indigo-600" />}
                                        {deliveryPrice > 0 && <Row l={`${deliveryType} Delivery`} r={`+₹${deliveryPrice.toLocaleString()}`} cls="text-amber-600" />}
                                        {addonsPrice > 0 && <Row l="Style Addons" r={`+₹${addonsPrice.toLocaleString()}`} cls="text-emerald-600" />}
                                        {customizationsPrice > 0 && <Row l="Customizations" r={`+₹${customizationsPrice.toLocaleString()}`} cls="text-purple-600" />}
                                        {isTailorAtHome && (
                                            <Box className="flex justify-between">
                                                <Txt className="text-sky-600">Tailor At Home Visit</Txt>
                                                {isVisitCoveredInOrder ? <Txt className="text-emerald-600 font-bold">Covered in Order (₹0)</Txt> : <Txt className="text-sky-600">{`+₹${tailorAtHomePrice.toLocaleString()}`}</Txt>}
                                            </Box>
                                        )}
                                        {platformFee > 0 && <Row l="Platform Fee" r={`+₹${platformFee.toLocaleString()}`} cls="text-gray-500" />}
                                        <Row l={`GST (${gstPercentage}%)`} r={`+₹${taxes.toLocaleString()}`} cls="text-gray-400 pb-1 border-b border-gray-200" />
                                        <Row l="Total Amount" r={`₹${grandTotal.toLocaleString()}`} cls="font-bold text-gray-900 pt-1" />
                                    </Box>
                                </Box>
                            )}
                            <Btn onPress={handleBuyNow}
                                className={`w-full py-3.5 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg min-h-[52px] ${isMeasurementValid ? 'bg-primary text-white shadow-primary/20' : 'bg-gradient-to-r from-gray-200 to-gray-300 text-gray-600'}`}>
                                {isMeasurementValid ? (
                                    <>
                                        <Txt>{editBasketIndex != null ? 'Save Changes' : location.state?.fromMultiItemBasket && serviceItems.length > 0 ? `Book All (${serviceItems.length + 1})` : 'Book Now'}</Txt>
                                        <I icon={ChevronRight} size={16} />
                                    </>
                                ) : (
                                    <>
                                        <Txt>Enter Details to Proceed</Txt>
                                        <I icon={ChevronUp} size={14} color="#6b7280" />
                                    </>
                                )}
                            </Btn>
                        </Box>
                    </Box>
                )}
            </Box>

            <StyleAddonModal isOpen={isAddonModalOpen} onClose={() => setIsAddonModalOpen(false)} selectedAddons={selectedAddons} onUpdate={setSelectedAddons}
                category={serviceData.category} serviceTitle={serviceData.title} directStyleAddons={serviceData.category?.styleAddons || []} />
        </Screen>
    );
};

const Row = ({ l, r, cls = '' }) => (
    <Box className={`flex justify-between ${cls}`}>
        <Txt>{l}</Txt>
        <Txt>{r}</Txt>
    </Box>
);

export default ServiceDetail;
