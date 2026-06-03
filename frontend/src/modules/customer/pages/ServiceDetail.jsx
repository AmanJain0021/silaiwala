import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import BookingStepper from '../components/BookingStepper';
import { ArrowLeft, ChevronDown, ChevronUp, ChevronRight, Clock, ShoppingBag, Ruler, CheckCircle2, ShieldCheck, Info, Tag, Scissors, Wand2, MapPin, X } from 'lucide-react';
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
import useMeasurementStore from '../../../store/measurementStore';
import useLocationStore from '../../../store/locationStore';
import { calculateDistance } from '../../../utils/distance';
import api from '../../../utils/api';

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
        serviceItems,
        removeServiceItem,
        setBuyNowMode,
        serviceDetails: storedDetails 
    } = useCheckoutStore(state => state);
    const addMeasurement = useMeasurementStore(state => state.addMeasurement);

    const [isLoading, setIsLoading] = useState(true);
    const [serviceData, setServiceData] = useState(null);
    const [preSelectedTailor, setPreSelectedTailor] = useState(null);

    // Initial check for current step based on selections
    const [currentStep, setCurrentStep] = useState('fabric'); // fabric -> details -> review

    const [deliveryType, setDeliveryType] = useState('standard');
    const [measurementType, setMeasurementType] = useState(null);
    const [isTailorAtHome, setIsTailorAtHome] = useState(false);
    const [selectedAddons, setSelectedAddons] = useState([]);
    const [isAddonModalOpen, setIsAddonModalOpen] = useState(false);
    const [fabricSource, setFabricSource] = useState(location.state?.fabricSource || 'customer');
    const [selectedFabric, setSelectedFabric] = useState(location.state?.selectedFabric || null);
    const [selectedSavedProfile, setSelectedSavedProfile] = useState(null);
    const [measurements, setMeasurements] = useState(null);
    const [visitSettings, setVisitSettings] = useState({ baseFee: 150, perKmFee: 20, freeKm: 3 });
    const [gstPercentage, setGstPercentage] = useState(5);
    const userCoords = useLocationStore(state => state.coordinates);

    const [showFooter, setShowFooter] = useState(false);
    const [showPriceBreakdown, setShowPriceBreakdown] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            const isBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 80;
            setShowFooter(isBottom);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const results = await Promise.allSettled([
                    api.get(`/services/${id}`),
                    (location.state?.tailorId || storedDetails?.tailorId) ? 
                        api.get(`/tailors/${location.state?.tailorId || storedDetails?.tailorId}`) : 
                        Promise.resolve(null)
                ]);

                if (results[0].status === 'fulfilled') {
                    const service = results[0].value.data.data;
                    setServiceData(service);
                    // Pre-select tailor if it came directly with the service
                    if (service.tailor && !results[1].value) {
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
                if (settingsRes.data.success) {
                    if (settingsRes.data.data.visitFee) {
                        setVisitSettings(settingsRes.data.data.visitFee);
                    }
                    if (settingsRes.data.data.pricing?.gstPercentage !== undefined) {
                        setGstPercentage(settingsRes.data.data.pricing.gstPercentage);
                    }
                }
            } catch (error) {
                console.error('Failed to fetch service/tailor detail:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchData();
    }, [id, location.state]);

    if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>;

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
        // If no tailor selected yet, show base fee
        if (!preSelectedTailor || !userCoords) return visitSettings.baseFee;

        try {
            const [tLng, tLat] = preSelectedTailor.location.coordinates;
            const distance = calculateDistance(userCoords.lat, userCoords.lng, tLat, tLng);
            
            if (distance <= visitSettings.freeKm) return visitSettings.baseFee;
            
            return Math.round(visitSettings.baseFee + (distance - visitSettings.freeKm) * visitSettings.perKmFee);
        } catch (err) {
            return visitSettings.baseFee;
        }
    };

    const tailorAtHomePrice = calculateVisitPrice();
    const subtotal = basePrice + deliveryPrice + fabricPrice + addonsPrice + tailorAtHomePrice;
    const taxes = Math.round(subtotal * (gstPercentage / 100));
    const currentTotal = subtotal + taxes;

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
        setSelectedAddons([]);
        setSelectedSavedProfile(null);
        setIsTailorAtHome(false);
        // Delivery type, fabric source can persist as defaults
    };

    const prepareDraftItem = async () => {
        let finalMeasurements = measurements;

        // If user requested to save this measurement profile
        if (measurements?.saveProfile) {
            try {
                await addMeasurement({
                    profileName: measurements.saveProfile.name,
                    garmentType: serviceData.category?.name || "Other",
                    measurements: measurements.data,
                    notes: measurements.data.notes
                });
                finalMeasurements = measurements.data;
            } catch (err) {
                console.error("Failed to save measurement profile:", err);
            }
        } else if (measurements?.type === 'self') {
            finalMeasurements = { ...measurements.data, type: 'self' };
        } else if (measurements?.type === 'slip' || measurements?.type === 'saved') {
            finalMeasurements = measurements.type === 'saved' ? { ...(measurements.measurements || {}), type: 'saved' } : measurements;
        }

        return {
            serviceDetails: {
                ...serviceData,
                tailorId: preSelectedTailor?._id || serviceData?.tailor?._id || null,
                tailorName: preSelectedTailor?.shopName || preSelectedTailor?.user?.name || serviceData?.tailor?.shopName || serviceData?.tailor?.user?.name || null,
                tailorCoordinates: preSelectedTailor?.location?.coordinates || serviceData?.tailor?.location?.coordinates || null
            },
            configuration: { 
                deliveryType, 
                fabricSource, 
                selectedFabric, 
                measurements: finalMeasurements,
                isTailorAtHome,
                addons: selectedAddons
            },
            pricing: { 
                base: basePrice, 
                delivery: deliveryPrice, 
                fabric: fabricPrice, 
                addons: addonsPrice,
                tailorAtHome: tailorAtHomePrice,
                taxes, 
                gstPercentage,
                total: currentTotal, 
                deliveryDays: getDeliveryDays() 
            },
            basketId: Date.now() + Math.random() // Unique ID for key mapping
        };
    };

    const handleAddMore = async () => {
        const item = await prepareDraftItem();
        addServiceItem(item);
        resetDraftForm();
        // Stay on page and show a success toast
        import('react-hot-toast').then(({ toast }) => {
            toast.success('Item added to basket', {
                icon: '🛒',
                style: {
                    borderRadius: '10px',
                    background: '#333',
                    color: '#fff',
                },
            });
        });
    };

    const handleBuyNow = async () => {
        const item = await prepareDraftItem();
        
        // Use 'Book Now' mode instead of adding to basket
        setBuyNowMode(true, item);
        
        // Auto-select logic: if the service belongs to a tailor OR user came from tailor profile
        const targetTailor = preSelectedTailor || serviceData?.tailor;
        if (!targetTailor) {
            navigate('/user/checkout/tailor');
        } else {
            navigate('/user/checkout/address');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-40 font-sans">
            {/* 1. Header & Stepper Integration */}
            <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl pt-safe">
                <div className="px-5 py-3 flex items-center justify-between border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 transition-all active:scale-90">
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
                <BookingStepper currentStepId={measurements ? 'review' : (measurementType ? 'details' : 'fabric')} />
            </div>

            <div className="max-w-2xl mx-auto px-4 mt-4 space-y-3.5">

                {/* Basket Summary Card */}
                {serviceItems.length > 0 && (
                    <section className="animate-in fade-in slide-in-from-top-4">
                        <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 overflow-hidden relative">
                            <div className="absolute top-0 right-0 p-6 opacity-5 rotate-12 pointer-events-none">
                                <ShoppingBag size={80} />
                            </div>
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Current Basket</h3>
                            <div className="space-y-3">
                                <AnimatePresence mode='popLayout'>
                                    {serviceItems.map((item, idx) => (
                                        <motion.div 
                                            key={item.basketId || idx}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            className="flex items-center justify-between bg-gray-50/50 p-3 rounded-2xl border border-gray-100"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-primary shadow-sm">
                                                    <Scissors size={18} />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-black text-gray-900">Item #{idx + 1}: {item.serviceDetails.title}</p>
                                                    <p className="text-[9px] text-gray-400 font-bold uppercase">₹{item.pricing.total}</p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    removeServiceItem(idx);
                                                }}
                                                className="p-2 text-gray-400 hover:text-error hover:bg-indigo-50 rounded-lg transition-all active:scale-95"
                                            >
                                                <X size={16} />
                                            </button>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </div>
                    </section>
                )}

                {/* 2. Fabric Choice - The "Fork" */}
                {/* ... existing code ... */}

                {/* 2. Fabric Choice - The "Fork" */}
                <section className="animate-in fade-in slide-in-from-bottom-2">
                    <FabricSelector
                        selected={fabricSource}
                        onSelect={setFabricSource}
                        selectedFabric={selectedFabric}
                        onSelectFabric={setSelectedFabric}
                        tailor={preSelectedTailor}
                    />
                </section>

                {/* 3. Measurements Section */}
                <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <MeasurementSelector
                        selectedType={measurementType}
                        visitPrice={tailorAtHomePrice || visitSettings.baseFee}
                        isDistanceBased={!!preSelectedTailor}
                        onSelectType={(type) => {
                            if (type === 'home') {
                                setIsTailorAtHome(true);
                                setMeasurementType('home');
                                setMeasurements({ type: 'home', notes: 'Tailor will visit home' });
                            } else if (type === 'sample') {
                                setIsTailorAtHome(false);
                                setMeasurementType('sample');
                                setMeasurements({ type: 'sample', notes: 'Partner will pickup sample garment with fabric' });
                            } else {
                                setIsTailorAtHome(false);
                                setMeasurementType(type);
                            }
                        }}
                        onMeasurementComplete={setMeasurements}
                        selectedSavedProfile={selectedSavedProfile}
                        onSelectSavedProfile={setSelectedSavedProfile}
                    />
                </section>

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

                            <div className="flex gap-2">
                                <button
                                    onClick={handleAddMore}
                                    disabled={!measurementType || (measurementType !== 'saved' && !measurements)}
                                    className={cn(
                                        "flex-1 py-2.5 rounded-lg font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all border-2",
                                        measurementType && (measurementType === 'saved' || measurements) 
                                            ? "border-primary text-primary hover:bg-indigo-50 active:scale-95" 
                                            : "border-gray-100 text-gray-300 cursor-not-allowed"
                                    )}
                                >
                                    <Tag size={16} /> Add to Basket
                                </button>
                                
                                <button
                                    onClick={handleBuyNow}
                                    disabled={!measurementType || (measurementType !== 'saved' && !measurements)}
                                    className={cn(
                                        "flex-[2.5] py-2.5 rounded-lg font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg",
                                        measurementType && (measurementType === 'saved' || measurements)
                                            ? "bg-primary text-white shadow-indigo-100 active:scale-[0.98] hover:bg-primary-dark" 
                                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                                    )}
                                >
                                    {measurementType && (measurementType === 'saved' || measurements) ? (
                                        <>Book Now <ChevronRight size={16} /></>
                                    ) : (
                                        <>Enter Details to Proceed</>
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
                category={serviceData.category?.name || serviceData.category}
            />
        </div>
    );
};

export default ServiceDetail;
