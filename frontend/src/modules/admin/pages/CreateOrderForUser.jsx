import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, X, Plus, User, Phone, ChevronDown, ChevronUp, ChevronRight, ChevronLeft,
    IndianRupee, CheckCircle2, Clock, Scissors, MapPin, Loader2,
    ShoppingBag, Ruler, CreditCard, Package, AlertTriangle, Star, Mail,
    Home, Building, Briefcase, Navigation, Upload, Camera, Image as ImageIcon,
    Sparkles, Check, Info, ShieldCheck, Tag, Calendar, Truck, ArrowRight,
    RefreshCw, Users
} from 'lucide-react';
import api from '../../../utils/api';
import { toast } from 'react-hot-toast';
import { useJsApiLoader, GoogleMap, MarkerF } from '@react-google-maps/api';
import PlacesAutocompleteField from '../../../shared/components/PlacesAutocompleteField';
import ImageUploader from '../../../components/Common/ImageUploader';
import SafeImage from '../../../components/Common/SafeImage';

const GOOGLE_MAPS_LIBRARIES = ['places', 'geometry', 'drawing'];

const STEPS = [
    { label: 'Customer', icon: User, key: 'customer' },
    { label: 'Service', icon: Scissors, key: 'service' },
    { label: 'Tailor', icon: Star, key: 'tailor' },
    { label: 'Details', icon: Ruler, key: 'details' },
    { label: 'Address', icon: MapPin, key: 'address' },
    { label: 'Review', icon: CreditCard, key: 'review' },
];

const mapContainerStyle = { width: '100%', height: '240px', borderRadius: '16px' };
const defaultCenter = { lat: 20.5937, lng: 78.9629 };

const CreateOrderForUser = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Google Maps Script (using shared loader)
    const { isLoaded: mapsLoaded } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
        libraries: GOOGLE_MAPS_LIBRARIES,
    });

    // ═══ Step 1: Customer State ═══
    const [customerSearch, setCustomerSearch] = useState('');
    const [customers, setCustomers] = useState([]);
    const [customersLoading, setCustomersLoading] = useState(false);
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerProfile, setCustomerProfile] = useState(null);
    const [savedMeasurementProfiles, setSavedMeasurementProfiles] = useState([]);

    // ═══ Step 2: Service State ═══
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [services, setServices] = useState([]);
    const [servicesLoading, setServicesLoading] = useState(false);
    const [selectedService, setSelectedService] = useState(null);
    const [selectedStyleVariant, setSelectedStyleVariant] = useState(null);
    const [fabricSource, setFabricSource] = useState('customer');
    const [deliveryType, setDeliveryType] = useState('standard');

    // ═══ Step 3: Tailor State ═══
    const [tailors, setTailors] = useState([]);
    const [tailorsLoading, setTailorsLoading] = useState(false);
    const [selectedTailor, setSelectedTailor] = useState(null);

    // ═══ Step 4: Details & Measurements State ═══
    const [measurementMethod, setMeasurementMethod] = useState('shop');
    const [selectedSavedProfileId, setSelectedSavedProfileId] = useState(null);
    const [measurementData, setMeasurementData] = useState({});
    const [measurementNotes, setMeasurementNotes] = useState('');
    const [slipImage, setSlipImage] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [styleAddons, setStyleAddons] = useState([]);
    const [availableAddons, setAvailableAddons] = useState([]);

    // ═══ Step 5: Address State ═══
    const [addressMode, setAddressMode] = useState('saved');
    const [selectedSavedAddress, setSelectedSavedAddress] = useState(null);
    const [newAddress, setNewAddress] = useState({
        street: '', city: '', state: '', zipCode: '', receiverName: '', phone: '',
        location: { type: 'Point', coordinates: [0, 0] }
    });
    const [mapCenter, setMapCenter] = useState(defaultCenter);
    const [mapMarker, setMapMarker] = useState(null);

    // ═══ Step 6: Review & Payment State ═══
    const [promoCode, setPromoCode] = useState('');
    const [promoDiscount, setPromoDiscount] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState('skip'); // 'skip' | 'advance_cash' | 'full_cash'
    const [scheduledDate, setScheduledDate] = useState(() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    });
    const [scheduledTimeSlot, setScheduledTimeSlot] = useState('12:00 PM - 3:00 PM');
    const [priceSummary, setPriceSummary] = useState(null);
    const [priceLoading, setPriceLoading] = useState(false);

    // ═══ STEP 1: Fetch / Search Customers ═══
    const fetchCustomers = useCallback(async (q = '') => {
        setCustomersLoading(true);
        try {
            const params = { role: 'customer', limit: 100 };
            if (q && q.trim().length > 0) {
                params.search = q.trim();
            }
            const res = await api.get('/admin/users', { params });
            const users = res.data?.data?.users || res.data?.data || res.data?.users || [];
            setCustomers(Array.isArray(users) ? users : []);
        } catch (err) {
            console.error('Failed to load customers:', err);
            toast.error('Failed to load customers');
            setCustomers([]);
        } finally {
            setCustomersLoading(false);
        }
    }, []);

    // Load all customers initially
    useEffect(() => {
        fetchCustomers('');
    }, [fetchCustomers]);

    // Live search debounced
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchCustomers(customerSearch);
        }, 350);
        return () => clearTimeout(timer);
    }, [customerSearch, fetchCustomers]);

    const selectCustomer = async (user) => {
        setSelectedCustomer(user);
        const addrs = user.addresses || [];
        setCustomerProfile({ addresses: addrs });
        if (addrs.length > 0) {
            const defaultAddr = addrs.find(a => a.isDefault) || addrs[0];
            setSelectedSavedAddress(defaultAddr);
            setAddressMode('saved');
        } else {
            setAddressMode('new');
        }

        // Fetch customer saved measurement profiles
        try {
            const mRes = await api.get('/measurements', { params: { user: user._id } });
            if (mRes.data?.data) {
                setSavedMeasurementProfiles(mRes.data.data);
            }
        } catch { }
    };

    // ═══ STEP 2: Categories & Services ═══
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await api.get('/admin/categories');
                const list = res.data?.data || [];
                setCategories(list);
                if (list.length > 0 && !selectedCategory) {
                    setSelectedCategory(list[0]);
                }
            } catch { }
        };
        fetchCategories();
    }, []);

    const loadServices = useCallback(async (categoryId) => {
        setServicesLoading(true);
        try {
            const res = await api.get('/services', { params: { category: categoryId, status: 'approved', limit: 100 } });
            const list = res.data?.data?.services || res.data?.data || [];
            setServices(Array.isArray(list) ? list : []);
        } catch {
            setServices([]);
        } finally {
            setServicesLoading(false);
        }
    }, []);

    useEffect(() => {
        if (selectedCategory) {
            loadServices(selectedCategory._id);
        }
    }, [selectedCategory, loadServices]);

    // ═══ STEP 3: Load Tailors (Rich from /customers/tailors) ═══
    useEffect(() => {
        if (!selectedService) return;
        const fetchTailors = async () => {
            setTailorsLoading(true);
            try {
                const res = await api.get('/customers/tailors');
                let list = res.data?.data || [];
                if (!Array.isArray(list) || list.length === 0) {
                    // Fallback to admin users
                    const fallbackRes = await api.get('/admin/users', { params: { role: 'tailor', limit: 50 } });
                    list = fallbackRes.data?.data?.users || fallbackRes.data?.data || [];
                }
                setTailors(list);

                // Auto-select original service owner tailor if available
                if (selectedService.tailor) {
                    const ownerTailorId = String(selectedService.tailor?._id || selectedService.tailor?.user?._id || selectedService.tailor);
                    const matched = list.find(t => 
                        String(t._id) === ownerTailorId || 
                        String(t.user?._id) === ownerTailorId ||
                        String(t.user) === ownerTailorId
                    );
                    if (matched) setSelectedTailor(matched);
                }
            } catch {
                setTailors([]);
            } finally {
                setTailorsLoading(false);
            }
        };
        fetchTailors();
    }, [selectedService]);

    // ═══ STEP 4: Style Addons ═══
    useEffect(() => {
        const fetchAddons = async () => {
            try {
                const res = await api.get('/style-addons', { params: { limit: 100 } });
                setAvailableAddons(res.data?.data || []);
            } catch { }
        };
        fetchAddons();
    }, []);

    // Dynamic measurement fields strictly resolved for the active service and category
    const activeMeasurementFields = useMemo(() => {
        // 1. Resolve full Category object (contains admin-defined measurementFields if set)
        const catId = selectedService?.category?._id || selectedService?.category || selectedCategory?._id;
        const cat = categories.find(c => String(c._id) === String(catId)) || selectedCategory;

        if (cat?.measurementFields && Array.isArray(cat.measurementFields) && cat.measurementFields.length > 0) {
            return cat.measurementFields;
        }

        // 2. Intelligent fallback matched to the specific service / category title
        const name = `${selectedService?.title || ''} ${cat?.name || ''}`.toLowerCase();

        if (name.includes('blouse')) {
            return [
                { type: 'heading', key: 'h_blouse', label: 'Blouse Specifications' },
                { type: 'field', key: 'chest', label: 'Bust / Chest (in)', placeholder: '34', isRequired: true },
                { type: 'field', key: 'underbust', label: 'Underbust / Lower Bust (in)', placeholder: '30', isRequired: true },
                { type: 'field', key: 'shoulder', label: 'Shoulder (in)', placeholder: '14', isRequired: true },
                { type: 'field', key: 'length', label: 'Blouse Length (in)', placeholder: '14', isRequired: true },
                { type: 'field', key: 'frontNeck', label: 'Front Neck Depth (in)', placeholder: '7', isRequired: false },
                { type: 'field', key: 'backNeck', label: 'Back Neck Depth (in)', placeholder: '8', isRequired: false },
                { type: 'field', key: 'sleeveLength', label: 'Sleeve Length (in)', placeholder: '10', isRequired: false }
            ];
        }

        if (name.includes('shirt')) {
            return [
                { type: 'heading', key: 'h_shirt', label: 'Shirt Specifications' },
                { type: 'field', key: 'chest', label: 'Chest (in)', placeholder: '38', isRequired: true },
                { type: 'field', key: 'waist', label: 'Waist (in)', placeholder: '34', isRequired: true },
                { type: 'field', key: 'shoulder', label: 'Shoulder (in)', placeholder: '17', isRequired: true },
                { type: 'field', key: 'length', label: 'Full Length (in)', placeholder: '30', isRequired: true },
                { type: 'field', key: 'sleeveLength', label: 'Sleeve Length (in)', placeholder: '24', isRequired: true },
                { type: 'field', key: 'neck', label: 'Collar Size (in)', placeholder: '15', isRequired: false }
            ];
        }

        if (name.includes('pant') || name.includes('trouser') || name.includes('pajama') || name.includes('pyjama')) {
            return [
                { type: 'heading', key: 'h_pant', label: 'Pant / Trouser Specifications' },
                { type: 'field', key: 'waist', label: 'Waist (in)', placeholder: '32', isRequired: true },
                { type: 'field', key: 'hips', label: 'Hips (in)', placeholder: '38', isRequired: true },
                { type: 'field', key: 'length', label: 'Full Length / Inseam (in)', placeholder: '40', isRequired: true },
                { type: 'field', key: 'thigh', label: 'Thigh Width (in)', placeholder: '22', isRequired: false },
                { type: 'field', key: 'bottom', label: 'Bottom Opening (in)', placeholder: '14', isRequired: false }
            ];
        }

        if (name.includes('suit') || name.includes('shalwar') || name.includes('salwar') || name.includes('lehenga') || name.includes('anarkali')) {
            return [
                { type: 'heading', key: 'h_top', label: 'Top / Kurta / Choli' },
                { type: 'field', key: 'chest', label: 'Bust / Chest (in)', placeholder: '36', isRequired: true },
                { type: 'field', key: 'waist', label: 'Waist (in)', placeholder: '30', isRequired: true },
                { type: 'field', key: 'shoulder', label: 'Shoulder (in)', placeholder: '14.5', isRequired: true },
                { type: 'field', key: 'length', label: 'Top Length (in)', placeholder: '38', isRequired: true },
                { type: 'field', key: 'sleeveLength', label: 'Sleeve Length (in)', placeholder: '17', isRequired: false },
                { type: 'field', key: 'neck', label: 'Front Neck Depth (in)', placeholder: '6.5', isRequired: false },
                { type: 'heading', key: 'h_bottom', label: 'Bottom / Salwar / Pant' },
                { type: 'field', key: 'hips', label: 'Hips (in)', placeholder: '38', isRequired: true },
                { type: 'field', key: 'bottomLength', label: 'Bottom Length (in)', placeholder: '40', isRequired: true },
                { type: 'field', key: 'bottom', label: 'Bottom Opening / Mohri (in)', placeholder: '14', isRequired: false }
            ];
        }

        // Default: Kurta / Kurti
        return [
            { type: 'heading', key: 'h_kurta', label: 'Top / Kurta Specifications' },
            { type: 'field', key: 'chest', label: 'Chest / Bust (in)', placeholder: '36', isRequired: true },
            { type: 'field', key: 'waist', label: 'Waist (in)', placeholder: '30', isRequired: true },
            { type: 'field', key: 'hips', label: 'Hips (in)', placeholder: '38', isRequired: true },
            { type: 'field', key: 'shoulder', label: 'Shoulder (in)', placeholder: '14.5', isRequired: true },
            { type: 'heading', key: 'h_length', label: 'Length & Sleeves' },
            { type: 'field', key: 'length', label: 'Full Length (in)', placeholder: '42', isRequired: true },
            { type: 'field', key: 'sleeveLength', label: 'Sleeve Length (in)', placeholder: '17', isRequired: false },
            { type: 'field', key: 'neck', label: 'Front Neck Depth (in)', placeholder: '6.5', isRequired: false }
        ];
    }, [selectedService, selectedCategory, categories]);

    // ═══ STEP 6: Price Calculation ═══
    const calculatePrice = useCallback(async () => {
        if (!selectedService || !selectedTailor) return;
        setPriceLoading(true);
        try {
            const deliveryAddress = addressMode === 'saved' && selectedSavedAddress
                ? selectedSavedAddress
                : newAddress;

            const tailorUserId = selectedTailor.user?._id || selectedTailor.user?.id || selectedTailor._id;

            const res = await api.post('/orders/price-summary', {
                items: [{
                    service: selectedService._id,
                    pricing: {
                        base: Number(selectedService.basePrice) || 0,
                        addons: styleAddons.reduce((s, a) => s + (Number(a.price) || 0), 0),
                        fabric: 0
                    },
                    configuration: {
                        fabricSource,
                        deliveryType,
                        isTailorAtHome: measurementMethod === 'home',
                        addons: styleAddons,
                    },
                    serviceDetails: {
                        tailorId: tailorUserId,
                        tailorCoordinates: selectedTailor.location?.coordinates || undefined
                    },
                    quantity,
                }],
                deliveryAddress,
                promoCode: promoCode || undefined,
            });

            if (res.data?.success && res.data.data) {
                setPriceSummary(res.data.data);
            }
        } catch (err) {
            console.error('Price calculation error:', err);
            const base = (Number(selectedService.basePrice) || 0) * quantity;
            const addonsTotal = styleAddons.reduce((s, a) => s + (Number(a.price) || 0), 0);
            const homeFee = measurementMethod === 'home' ? 150 : 0;
            const platformFee = Math.round(base * 0.05);
            const gst = Math.round((base + addonsTotal + homeFee + platformFee) * 0.05);
            const total = base + addonsTotal + homeFee + platformFee + gst;
            setPriceSummary({
                total,
                base,
                addons: addonsTotal,
                tailorAtHome: homeFee,
                platformFee,
                taxes: gst,
                delivery: 0,
                discountAmount: 0
            });
        } finally {
            setPriceLoading(false);
        }
    }, [selectedService, selectedTailor, fabricSource, deliveryType, measurementMethod, styleAddons, quantity, addressMode, selectedSavedAddress, newAddress, promoCode]);

    useEffect(() => {
        if (currentStep === 5) calculatePrice();
    }, [currentStep, calculatePrice]);

    // ═══ Map Click ═══
    const handleMapClick = (e) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        setMapMarker({ lat, lng });
        setNewAddress(prev => ({
            ...prev,
            location: { type: 'Point', coordinates: [lng, lat] }
        }));
        if (window.google) {
            const geocoder = new window.google.maps.Geocoder();
            geocoder.geocode({ location: { lat, lng } }, (results, status) => {
                if (status === 'OK' && results[0]) {
                    const addr = results[0];
                    let city = '', state = '', zipCode = '';
                    addr.address_components?.forEach(c => {
                        if (c.types.includes('locality')) city = c.long_name;
                        if (c.types.includes('administrative_area_level_1')) state = c.long_name;
                        if (c.types.includes('postal_code')) zipCode = c.long_name;
                    });
                    setNewAddress(prev => ({
                        ...prev,
                        street: addr.formatted_address || prev.street,
                        city: city || prev.city,
                        state: state || prev.state,
                        zipCode: zipCode || prev.zipCode,
                        location: { type: 'Point', coordinates: [lng, lat] }
                    }));
                }
            });
        }
    };

    // ═══ SUBMIT ORDER ═══
    const handleSubmitOrder = async () => {
        setIsSubmitting(true);
        try {
            const deliveryAddress = addressMode === 'saved' && selectedSavedAddress
                ? {
                    street: selectedSavedAddress.street,
                    city: selectedSavedAddress.city,
                    state: selectedSavedAddress.state,
                    zipCode: selectedSavedAddress.zipCode,
                    location: selectedSavedAddress.location,
                    receiverName: selectedSavedAddress.receiverName || selectedCustomer.name,
                    phone: selectedSavedAddress.phone || selectedCustomer.phoneNumber,
                }
                : {
                    street: newAddress.street,
                    city: newAddress.city,
                    state: newAddress.state,
                    zipCode: newAddress.zipCode,
                    location: newAddress.location,
                    receiverName: newAddress.receiverName || selectedCustomer.name,
                    phone: newAddress.phone || selectedCustomer.phoneNumber,
                };

            // Build measurement payload matching schema
            let measurements = { type: measurementMethod };
            const currentCat = categories.find(c => String(c._id) === String(selectedService?.category?._id || selectedService?.category || selectedCategory?._id)) || selectedCategory;
            const garmentTitle = selectedCategory?.name || selectedService?.title || 'Custom Stitching';

            if (measurementMethod === 'self') {
                const data = {};
                activeMeasurementFields.forEach(f => {
                    const key = f.key || f.id || f.name;
                    if (f.type !== 'heading' && measurementData[key]) {
                        data[key] = measurementData[key];
                    }
                });
                measurements = {
                    type: 'self',
                    ...data,
                    measurementLayout: activeMeasurementFields,
                    garmentType: garmentTitle,
                    categoryId: currentCat?._id,
                    notes: measurementNotes
                };
            } else if (measurementMethod === 'slip') {
                measurements = {
                    type: 'slip',
                    slipImage,
                    notes: measurementNotes,
                    garmentType: garmentTitle,
                    categoryId: currentCat?._id
                };
            } else if (measurementMethod === 'home') {
                measurements = {
                    type: 'home',
                    notes: measurementNotes,
                    garmentType: garmentTitle,
                    categoryId: currentCat?._id
                };
            } else {
                measurements = {
                    type: 'shop',
                    notes: measurementNotes,
                    garmentType: garmentTitle,
                    categoryId: currentCat?._id
                };
            }

            const tailorUserId = selectedTailor.user?._id || selectedTailor.user?.id || selectedTailor._id;

            const orderPayload = {
                customerId: selectedCustomer._id,
                tailorId: tailorUserId,
                items: [{
                    service: selectedService._id,
                    fabricSource,
                    deliveryType,
                    quantity,
                    price: Number(selectedService.basePrice) || 0,
                    measurements,
                    isTailorAtHome: measurementMethod === 'home',
                    selectedStyle: selectedStyleVariant ? { name: selectedStyleVariant.name, image: selectedStyleVariant.image } : null,
                    styleAddons: styleAddons.map(a => ({
                        _id: a._id,
                        name: a.name,
                        price: Number(a.price) || 0,
                        image: a.image || '',
                    })),
                }],
                totalAmount: priceSummary?.total || 0,
                deliveryAddress,
                isMeasurementHome: measurementMethod === 'home',
                promoCode: promoCode || undefined,
                scheduledDate: scheduledDate || undefined,
                scheduledTimeSlot: scheduledTimeSlot || undefined,
            };

            const res = await api.post('/orders', orderPayload);

            if (res.data?.success) {
                const createdOrder = res.data.data;

                // Handle payment status update if collected in cash
                if (paymentMethod === 'full_cash' && createdOrder?._id) {
                    try {
                        await api.put(`/admin/orders/${createdOrder._id}/status`, { paymentStatus: 'paid' });
                    } catch (_) { }
                } else if (paymentMethod === 'advance_cash' && createdOrder?._id) {
                    try {
                        await api.put(`/admin/orders/${createdOrder._id}/status`, { paymentStatus: 'advance_paid' });
                    } catch (_) { }
                }

                toast.success(`Order #${createdOrder?.orderId || ''} created successfully for ${selectedCustomer.name}!`, {
                    duration: 5000,
                    icon: '🎉'
                });
                navigate('/admin/orders/assisted');
            } else {
                throw new Error(res.data?.message || 'Order creation failed');
            }
        } catch (err) {
            console.error('Order creation error:', err);
            toast.error(err.response?.data?.message || err.message || 'Failed to create order');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ═══ Step Validation ═══
    const canProceed = () => {
        switch (currentStep) {
            case 0: return !!selectedCustomer;
            case 1: return !!selectedService;
            case 2: return !!selectedTailor;
            case 3: return true;
            case 4: return (addressMode === 'saved' && selectedSavedAddress) ||
                (addressMode !== 'saved' && newAddress.street && newAddress.city);
            case 5: return !!priceSummary;
            default: return false;
        }
    };

    const nextStep = () => { if (canProceed() && currentStep < STEPS.length - 1) setCurrentStep(currentStep + 1); };
    const prevStep = () => { if (currentStep > 0) setCurrentStep(currentStep - 1); };

    return (
        <div className="space-y-6 max-w-6xl mx-auto pb-12 font-sans">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                        <Scissors className="text-[#843D9B]" size={26} />
                        Create Online Order for Customer
                    </h1>
                    <p className="text-xs text-gray-500 font-medium mt-1">
                        Configure custom stitching, choose fabric & tailor, set measurements and place order on customer's behalf
                    </p>
                </div>
                <button
                    onClick={() => navigate('/admin/orders')}
                    className="px-4 py-2 text-xs font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all self-start sm:self-auto"
                >
                    Cancel
                </button>
            </div>

            {/* Stepper Progress Bar */}
            <div className="bg-white rounded-2xl border border-gray-100 p-3 sm:p-4 shadow-sm">
                <div className="flex items-center justify-between overflow-x-auto no-scrollbar gap-2">
                    {STEPS.map((step, i) => {
                        const Icon = step.icon;
                        const isActive = i === currentStep;
                        const isDone = i < currentStep;
                        return (
                            <React.Fragment key={step.key}>
                                <button
                                    onClick={() => { if (isDone) setCurrentStep(i); }}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all text-xs font-black uppercase tracking-wider shrink-0 ${
                                        isActive
                                            ? 'bg-[#843D9B] text-white shadow-lg shadow-purple-900/20 ring-2 ring-purple-300'
                                            : isDone
                                            ? 'bg-emerald-50 text-emerald-700 cursor-pointer hover:bg-emerald-100'
                                            : 'bg-gray-50 text-gray-400'
                                    }`}
                                >
                                    {isDone ? <CheckCircle2 size={16} /> : <Icon size={16} />}
                                    <span>{i + 1}. {step.label}</span>
                                </button>
                                {i < STEPS.length - 1 && (
                                    <div className={`flex-1 h-0.5 min-w-4 rounded ${isDone ? 'bg-emerald-400' : 'bg-gray-200'}`} />
                                )}
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>

            {/* Main Step Container */}
            <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm min-h-[480px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentStep}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.15 }}
                    >
                        {/* ══════════════════════════════════════
                            STEP 1: CUSTOMER SELECTION
                        ══════════════════════════════════════ */}
                        {currentStep === 0 && (
                            <div className="space-y-6">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div>
                                        <h2 className="text-lg font-black text-gray-900 flex items-center gap-2">
                                            <Users className="text-[#843D9B]" size={22} />
                                            Step 1: Select Customer
                                        </h2>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            Choose a registered customer to create an order on their behalf, or search below
                                        </p>
                                    </div>
                                    {!selectedCustomer && (
                                        <div className="flex items-center gap-2 self-start sm:self-auto">
                                            <span className="text-xs font-bold bg-purple-50 text-[#843D9B] px-3 py-1.5 rounded-xl border border-purple-100 flex items-center gap-1.5">
                                                <User size={13} />
                                                {customersLoading ? 'Loading...' : `${customers.length} Customers`}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => fetchCustomers(customerSearch)}
                                                disabled={customersLoading}
                                                title="Refresh list"
                                                className="p-2 text-gray-500 hover:text-[#843D9B] hover:bg-purple-50 rounded-xl border border-gray-200 transition-all disabled:opacity-50"
                                            >
                                                <RefreshCw size={15} className={customersLoading ? 'animate-spin text-[#843D9B]' : ''} />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {selectedCustomer ? (
                                    <div className="bg-gradient-to-r from-purple-50 via-pink-50/50 to-white border-2 border-purple-200 rounded-2xl p-6 shadow-sm">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-2xl bg-[#843D9B] text-white flex items-center justify-center font-black text-xl shadow-md ring-4 ring-purple-100">
                                                    {selectedCustomer.name?.slice(0, 2)?.toUpperCase() || 'CU'}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="font-black text-base text-gray-900">{selectedCustomer.name}</h3>
                                                        <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-black flex items-center gap-1">
                                                            <CheckCircle2 size={11} /> Selected
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600 mt-1">
                                                        {selectedCustomer.email && (
                                                            <span className="flex items-center gap-1.5 font-medium">
                                                                <Mail size={13} className="text-[#843D9B]" /> {selectedCustomer.email}
                                                            </span>
                                                        )}
                                                        {selectedCustomer.phoneNumber && (
                                                            <span className="flex items-center gap-1.5 font-medium">
                                                                <Phone size={13} className="text-[#843D9B]" /> {selectedCustomer.phoneNumber}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-500">
                                                        <span>Orders: <strong className="text-gray-800">{selectedCustomer.orderCount || 0}</strong></span>
                                                        <span>•</span>
                                                        <span>Total Spent: <strong className="text-gray-800">₹{selectedCustomer.totalSpent || 0}</strong></span>
                                                        <span>•</span>
                                                        <span>Addresses: <strong className="text-gray-800">{customerProfile?.addresses?.length || 0} saved</strong></span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 self-start sm:self-center">
                                                <button
                                                    onClick={() => {
                                                        setSelectedCustomer(null);
                                                        setCustomerProfile(null);
                                                        setSelectedSavedAddress(null);
                                                        setSavedMeasurementProfiles([]);
                                                    }}
                                                    className="px-4 py-2 text-xs font-bold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl transition-all shadow-sm"
                                                >
                                                    Change Customer
                                                </button>
                                                <button
                                                    onClick={nextStep}
                                                    className="px-5 py-2 text-xs font-black text-white bg-[#843D9B] hover:bg-[#733587] rounded-xl transition-all shadow-md flex items-center gap-1.5"
                                                >
                                                    Continue <ArrowRight size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {/* Search Filter Bar */}
                                        <div className="relative max-w-xl">
                                            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                            <input
                                                type="text"
                                                placeholder="Search by customer name, phone number, or email..."
                                                value={customerSearch}
                                                onChange={(e) => setCustomerSearch(e.target.value)}
                                                className="w-full pl-11 pr-10 py-3 bg-white border-2 border-gray-200 rounded-2xl text-sm font-semibold focus:outline-none focus:border-[#843D9B] focus:ring-4 focus:ring-purple-100 transition-all placeholder:text-gray-400"
                                            />
                                            {customerSearch ? (
                                                <button
                                                    type="button"
                                                    onClick={() => setCustomerSearch('')}
                                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                                                >
                                                    <X size={16} />
                                                </button>
                                            ) : customersLoading ? (
                                                <Loader2 size={18} className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-[#843D9B]" />
                                            ) : null}
                                        </div>

                                        {/* Customer List / Grid */}
                                        {customersLoading && customers.length === 0 ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
                                                {[1, 2, 3, 4, 5, 6].map(n => (
                                                    <div key={n} className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 animate-pulse flex items-start gap-3">
                                                        <div className="w-12 h-12 rounded-xl bg-gray-200 shrink-0" />
                                                        <div className="space-y-2 flex-1">
                                                            <div className="h-4 bg-gray-200 rounded w-3/4" />
                                                            <div className="h-3 bg-gray-200 rounded w-1/2" />
                                                            <div className="h-3 bg-gray-200 rounded w-2/3" />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : customers.length > 0 ? (
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between text-xs text-gray-500 font-bold px-1">
                                                    <span>Showing {customers.length} registered customer{customers.length === 1 ? '' : 's'}</span>
                                                    {customerSearch && (
                                                        <span className="text-[#843D9B]">Filtered by "{customerSearch}"</span>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 max-h-[520px] overflow-y-auto pr-1">
                                                    {customers.map(u => (
                                                        <div
                                                            key={u._id}
                                                            onClick={() => selectCustomer(u)}
                                                            className="group p-4 bg-white hover:bg-purple-50/40 rounded-2xl border-2 border-gray-100 hover:border-purple-300 transition-all cursor-pointer shadow-sm hover:shadow-md flex flex-col justify-between"
                                                        >
                                                            <div className="flex items-start gap-3">
                                                                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 text-[#843D9B] flex items-center justify-center font-black text-sm shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                                                                    {u.name?.slice(0, 2)?.toUpperCase() || 'CU'}
                                                                </div>
                                                                <div className="min-w-0 flex-1">
                                                                    <div className="flex items-center justify-between gap-1">
                                                                        <h4 className="font-black text-sm text-gray-900 group-hover:text-[#843D9B] transition-colors truncate">
                                                                            {u.name || 'Unnamed'}
                                                                        </h4>
                                                                        {u.orderCount > 0 && (
                                                                            <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-black shrink-0">
                                                                                {u.orderCount} ord
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-xs text-gray-600 mt-1 flex items-center gap-1.5 truncate">
                                                                        <Phone size={12} className="text-gray-400 shrink-0" />
                                                                        <span>{u.phoneNumber || 'No phone'}</span>
                                                                    </p>
                                                                    <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1.5 truncate">
                                                                        <Mail size={12} className="text-gray-400 shrink-0" />
                                                                        <span className="truncate">{u.email || 'No email'}</span>
                                                                    </p>
                                                                </div>
                                                            </div>

                                                            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500 font-medium">
                                                                <span>Spent: <strong className="text-gray-800">₹{u.totalSpent || 0}</strong></span>
                                                                <span className="text-[11px] font-bold text-[#843D9B] group-hover:underline flex items-center gap-0.5">
                                                                    Select <ChevronRight size={13} />
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center py-12 bg-gray-50/60 rounded-2xl border-2 border-dashed border-gray-200">
                                                <User size={36} className="mx-auto text-gray-300 mb-2" />
                                                <p className="text-sm font-bold text-gray-600">
                                                    {customerSearch ? `No customer found matching "${customerSearch}"` : 'No registered customers found'}
                                                </p>
                                                <p className="text-xs text-gray-400 mt-1">
                                                    {customerSearch ? 'Try searching by a different name, phone number or email.' : 'Customers who register on Silaiwala will appear here.'}
                                                </p>
                                                {customerSearch && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setCustomerSearch('')}
                                                        className="mt-3 px-4 py-1.5 text-xs font-bold text-[#843D9B] bg-purple-50 hover:bg-purple-100 rounded-xl transition-all"
                                                    >
                                                        Clear Search
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ══════════════════════════════════════
                            STEP 2: SERVICE & CONFIGURATION
                        ══════════════════════════════════════ */}
                        {currentStep === 1 && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-lg font-black text-gray-900">Step 2: Select Stitching Service</h2>
                                    <p className="text-xs text-gray-500 mt-0.5">Choose the outfit type, fabric source and delivery priority</p>
                                </div>

                                {/* Category Pills */}
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-2 block">
                                        Select Garment Category
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {categories.map(cat => {
                                            const isSelected = selectedCategory?._id === cat._id;
                                            return (
                                                <button
                                                    key={cat._id}
                                                    onClick={() => {
                                                        setSelectedCategory(cat);
                                                        setSelectedService(null);
                                                        setSelectedStyleVariant(null);
                                                    }}
                                                    className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all border ${
                                                        isSelected
                                                            ? 'bg-[#843D9B] text-white border-[#843D9B] shadow-md shadow-purple-900/20'
                                                            : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-[#843D9B] hover:text-[#843D9B]'
                                                    }`}
                                                >
                                                    {cat.name}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Services Grid */}
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-2 block">
                                        Available Services in {selectedCategory?.name || 'Category'}
                                    </label>

                                    {servicesLoading ? (
                                        <div className="flex items-center justify-center py-16">
                                            <Loader2 size={30} className="animate-spin text-[#843D9B]" />
                                        </div>
                                    ) : services.length === 0 ? (
                                        <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                            <Scissors size={32} className="mx-auto text-gray-300 mb-2" />
                                            <p className="text-xs font-bold text-gray-500">No active services found in this category</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {services.map(svc => {
                                                const isSelected = selectedService?._id === svc._id;
                                                const imgSrc = svc.image && svc.image !== 'no-photo.jpg'
                                                    ? svc.image
                                                    : 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=400&q=80';

                                                return (
                                                    <div
                                                        key={svc._id}
                                                        onClick={() => {
                                                            if (selectedService?._id !== svc._id) {
                                                                setSelectedService(svc);
                                                                setSelectedStyleVariant(svc.selectedStyles?.[0] || null);
                                                                setMeasurementData({});
                                                                setSelectedSavedProfileId(null);
                                                            }
                                                        }}
                                                        className={`rounded-2xl border-2 p-4 transition-all cursor-pointer relative flex flex-col justify-between ${
                                                            isSelected
                                                                ? 'border-[#843D9B] bg-purple-50/50 shadow-lg shadow-purple-900/10 ring-2 ring-purple-300'
                                                                : 'border-gray-100 hover:border-gray-300 bg-white hover:shadow-sm'
                                                        }`}
                                                    >
                                                        {isSelected && (
                                                            <div className="absolute top-3 right-3 bg-[#843D9B] text-white p-1 rounded-full shadow-md z-10">
                                                                <Check size={14} strokeWidth={3} />
                                                            </div>
                                                        )}

                                                        <div className="flex gap-4">
                                                            <div className="w-20 h-24 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-100 relative">
                                                                <img
                                                                    src={imgSrc}
                                                                    alt={svc.title}
                                                                    className="w-full h-full object-cover"
                                                                    onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=400&q=80'; }}
                                                                />
                                                            </div>

                                                            <div className="flex-1 min-w-0">
                                                                <span className="text-[9px] font-black uppercase tracking-wider text-[#843D9B] bg-purple-100/60 px-2 py-0.5 rounded-md">
                                                                    {svc.category?.name || 'Stitching'}
                                                                </span>
                                                                <h3 className="font-black text-sm text-gray-900 mt-1 line-clamp-1">{svc.title}</h3>
                                                                <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{svc.description}</p>
                                                                <div className="flex items-center gap-2 mt-2">
                                                                    <span className="text-base font-black text-[#843D9B]">₹{svc.basePrice}</span>
                                                                    <span className="text-[10px] text-gray-400 font-semibold">• {svc.deliveryTime || '3-5 Days'}</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {svc.rating && (
                                                            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-100 text-[10px] text-gray-500 font-semibold">
                                                                <span className="flex items-center gap-1 text-amber-500 font-bold">
                                                                    <Star size={12} fill="currentColor" /> {svc.rating}
                                                                </span>
                                                                <span>({svc.reviewsCount || 12} reviews)</span>
                                                                <span className="ml-auto text-emerald-600 font-bold">Free Alterations</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>

                                {/* Style Variants (if available on service) */}
                                {selectedService?.selectedStyles && selectedService.selectedStyles.length > 0 && (
                                    <div className="pt-4 border-t border-gray-100">
                                        <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-2 block">
                                            Select Style Pattern / Variant
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {selectedService.selectedStyles.map((style, idx) => {
                                                const isSelected = selectedStyleVariant?.name === style.name;
                                                return (
                                                    <button
                                                        key={idx}
                                                        onClick={() => setSelectedStyleVariant(style)}
                                                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                                                            isSelected
                                                                ? 'bg-[#843D9B] text-white border-[#843D9B]'
                                                                : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-purple-300'
                                                        }`}
                                                    >
                                                        {style.name}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}

                                {/* Fabric Source & Delivery Priority Cards */}
                                {selectedService && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-100">
                                        {/* Fabric Source Selection */}
                                        <div>
                                            <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-2 block">
                                                Fabric Source
                                            </label>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div
                                                    onClick={() => setFabricSource('customer')}
                                                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                                                        fabricSource === 'customer'
                                                            ? 'border-[#843D9B] bg-purple-50/60 shadow-sm'
                                                            : 'border-gray-200 hover:border-gray-300 bg-white'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <span className="text-xl">👗</span>
                                                        {fabricSource === 'customer' && <Check size={16} className="text-[#843D9B]" />}
                                                    </div>
                                                    <p className="font-bold text-xs text-gray-900">Customer's Own Fabric</p>
                                                    <p className="text-[10px] text-gray-500 mt-1">Delivery partner will pick up cloth from customer doorstep.</p>
                                                </div>

                                                <div
                                                    onClick={() => setFabricSource('platform')}
                                                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                                                        fabricSource === 'platform'
                                                            ? 'border-[#843D9B] bg-purple-50/60 shadow-sm'
                                                            : 'border-gray-200 hover:border-gray-300 bg-white'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <span className="text-xl">🏪</span>
                                                        {fabricSource === 'platform' && <Check size={16} className="text-[#843D9B]" />}
                                                    </div>
                                                    <p className="font-bold text-xs text-gray-900">Platform / Tailor Fabric</p>
                                                    <p className="text-[10px] text-gray-500 mt-1">Tailor will supply premium fabric matching the design.</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Delivery Priority */}
                                        <div>
                                            <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-2 block">
                                                Delivery Speed & Type
                                            </label>
                                            <div className="grid grid-cols-3 gap-2">
                                                {[
                                                    { key: 'standard', name: 'Standard', time: '3-5 Days', tag: 'Included' },
                                                    { key: 'express', name: 'Express', time: '2 Days', tag: 'Fast' },
                                                    { key: 'premium', name: 'Premium', time: '24 Hours', tag: 'Urgent' }
                                                ].map(d => (
                                                    <div
                                                        key={d.key}
                                                        onClick={() => setDeliveryType(d.key)}
                                                        className={`p-3 rounded-2xl border-2 cursor-pointer text-center transition-all ${
                                                            deliveryType === d.key
                                                                ? 'border-[#843D9B] bg-purple-50/60 shadow-sm'
                                                                : 'border-gray-200 hover:border-gray-300 bg-white'
                                                        }`}
                                                    >
                                                        <span className="text-[9px] font-bold text-[#843D9B] uppercase block">{d.tag}</span>
                                                        <p className="font-black text-xs text-gray-900 mt-0.5">{d.name}</p>
                                                        <p className="text-[10px] text-gray-500 mt-0.5">{d.time}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ══════════════════════════════════════
                            STEP 3: TAILOR BOUTIQUE SELECTION
                        ══════════════════════════════════════ */}
                        {currentStep === 2 && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-lg font-black text-gray-900">Step 3: Select Tailor Boutique</h2>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        Choose master tailor partner for <strong>{selectedService?.title}</strong>
                                    </p>
                                </div>

                                {tailorsLoading ? (
                                    <div className="flex items-center justify-center py-20">
                                        <Loader2 size={32} className="animate-spin text-[#843D9B]" />
                                    </div>
                                ) : tailors.length === 0 ? (
                                    <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                                        <Building size={32} className="mx-auto text-gray-300 mb-2" />
                                        <p className="text-xs font-bold text-gray-500">No tailor partners found</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {tailors.map(t => {
                                            const tailorId = t._id;
                                            const tailorUserId = t.user?._id || t.user?.id || t._id;
                                            const isSelected = selectedTailor?._id === tailorId || selectedTailor?.user?._id === tailorUserId;
                                            const isServiceOwner = selectedService?.tailor?._id === tailorId || selectedService?.tailor === tailorId;
                                            const shopName = t.shopName || t.name || 'Tailor Partner';
                                            const avatar = t.user?.profileImage || t.profileImage;

                                            return (
                                                <div
                                                    key={t._id}
                                                    onClick={() => setSelectedTailor(t)}
                                                    className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                                                        isSelected
                                                            ? 'border-[#843D9B] bg-purple-50/60 shadow-lg shadow-purple-900/10 ring-2 ring-purple-300'
                                                            : 'border-gray-100 hover:border-gray-300 bg-white hover:shadow-sm'
                                                    }`}
                                                >
                                                    {isServiceOwner && (
                                                        <span className="absolute -top-2.5 right-4 bg-emerald-600 text-white text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-sm">
                                                            Catalog Creator
                                                        </span>
                                                    )}

                                                    <div className="flex items-start gap-4">
                                                        <div className="w-16 h-16 rounded-2xl overflow-hidden bg-purple-100 text-[#843D9B] flex items-center justify-center font-black text-lg shrink-0 border border-gray-100">
                                                            {avatar ? (
                                                                <img src={avatar} alt={shopName} className="w-full h-full object-cover" />
                                                            ) : (
                                                                <span>{shopName.slice(0, 2).toUpperCase()}</span>
                                                            )}
                                                        </div>

                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between">
                                                                <h3 className="font-black text-sm text-gray-900 truncate">{shopName}</h3>
                                                                {isSelected && <CheckCircle2 size={18} className="text-[#843D9B] shrink-0 ml-1" />}
                                                            </div>
                                                            <p className="text-[11px] text-gray-500 font-medium truncate mt-0.5">
                                                                Master: {t.user?.name || t.name || 'Master Tailor'}
                                                            </p>
                                                            <div className="flex items-center gap-2 mt-2">
                                                                <span className="flex items-center gap-1 text-[11px] font-bold text-amber-500">
                                                                    <Star size={12} fill="currentColor" /> {t.rating || '4.8'}
                                                                </span>
                                                                <span className="text-[10px] text-gray-400">({t.reviewsCount || 24}+ reviews)</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                                                        <span className="flex items-center gap-1 truncate text-gray-600">
                                                            <MapPin size={12} className="text-gray-400 shrink-0" />
                                                            {t.address?.city || t.city || 'Verified Hub'}
                                                        </span>
                                                        <span className="text-[10px] bg-purple-100 text-[#843D9B] font-bold px-2 py-0.5 rounded-md shrink-0">
                                                            {t.specializations?.[0] || 'Expert Fit'}
                                                        </span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ══════════════════════════════════════
                            STEP 4: MEASUREMENTS & CUSTOMIZATIONS
                        ══════════════════════════════════════ */}
                        {currentStep === 3 && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-lg font-black text-gray-900">Step 4: Measurements & Custom Fit</h2>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        Choose measurement method or select customer's saved profile
                                    </p>
                                </div>

                                {/* Measurement Method 4 Cards */}
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-2 block">
                                        Measurement Option
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                                        {[
                                            {
                                                key: 'home',
                                                title: 'Tailor at Home',
                                                tag: 'RECOMMENDED',
                                                tagColor: 'bg-emerald-100 text-emerald-800',
                                                desc: 'Executive visits home with measurement tape.',
                                                icon: Home
                                            },
                                            {
                                                key: 'self',
                                                title: 'Self Measure',
                                                tag: 'INSTANT',
                                                tagColor: 'bg-blue-100 text-blue-800',
                                                desc: 'Enter inches for chest, waist, length, etc.',
                                                icon: Ruler
                                            },
                                            {
                                                key: 'slip',
                                                title: 'Upload Slip',
                                                tag: 'PHOTO',
                                                tagColor: 'bg-amber-100 text-amber-800',
                                                desc: 'Upload photo of previous tailor slip or sample.',
                                                icon: Camera
                                            },
                                            {
                                                key: 'shop',
                                                title: 'Shop Visit',
                                                tag: 'STORE',
                                                tagColor: 'bg-gray-100 text-gray-700',
                                                desc: 'Customer will visit tailor boutique in person.',
                                                icon: Building
                                            }
                                        ].map(m => {
                                            const isSelected = measurementMethod === m.key;
                                            const Icon = m.icon;
                                            return (
                                                <div
                                                    key={m.key}
                                                    onClick={() => setMeasurementMethod(m.key)}
                                                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                                                        isSelected
                                                            ? 'border-[#843D9B] bg-purple-50/60 shadow-md ring-2 ring-purple-300'
                                                            : 'border-gray-200 hover:border-gray-300 bg-white'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className={`p-2 rounded-xl ${isSelected ? 'bg-[#843D9B] text-white' : 'bg-gray-100 text-gray-600'}`}>
                                                            <Icon size={18} />
                                                        </div>
                                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${m.tagColor}`}>
                                                            {m.tag}
                                                        </span>
                                                    </div>
                                                    <h3 className="font-black text-sm text-gray-900">{m.title}</h3>
                                                    <p className="text-[11px] text-gray-500 mt-1 leading-snug">{m.desc}</p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Saved Measurement Profiles (if customer has any) */}
                                {savedMeasurementProfiles.length > 0 && measurementMethod === 'self' && (
                                    <div className="p-4 bg-purple-50/50 rounded-2xl border border-purple-100">
                                        <p className="text-xs font-bold text-[#843D9B] mb-2 flex items-center gap-1.5">
                                            <Sparkles size={14} /> Quick-Fill from Customer Saved Profiles:
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            {savedMeasurementProfiles.map(p => (
                                                <button
                                                    key={p._id}
                                                    onClick={() => {
                                                        setSelectedSavedProfileId(p._id);
                                                        setMeasurementData(p.measurements || {});
                                                        toast.success(`Loaded ${p.profileName || 'profile'}`);
                                                    }}
                                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                                                        selectedSavedProfileId === p._id
                                                            ? 'bg-[#843D9B] text-white border-[#843D9B]'
                                                            : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300'
                                                    }`}
                                                >
                                                    {p.profileName || p.garmentType}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Self-Measure Form */}
                                {measurementMethod === 'self' && (
                                    <div className="bg-gray-50/70 rounded-2xl p-6 border border-gray-100 space-y-4">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-200">
                                            <div className="flex items-center gap-2.5">
                                                <div className="w-8 h-8 rounded-xl bg-purple-100 text-[#843D9B] flex items-center justify-center font-bold shadow-sm">
                                                    <Ruler size={17} />
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-black uppercase tracking-wider text-gray-900">
                                                        Measurement Form: <span className="text-[#843D9B]">{selectedService?.title || selectedCategory?.name || 'Selected Service'}</span>
                                                    </h4>
                                                    <p className="text-[10px] text-gray-500 font-medium">
                                                        Accurate fields configured specifically for this service outfit (in inches)
                                                    </p>
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-black bg-purple-100 text-[#843D9B] px-3 py-1 rounded-full uppercase tracking-wider self-start sm:self-auto">
                                                {selectedCategory?.name || 'Service Form'}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 pt-1">
                                            {activeMeasurementFields.map((field, idx) => {
                                                if (field.type === 'heading') {
                                                    return (
                                                        <div key={field.key || `heading_${idx}`} className="col-span-full font-black text-xs text-[#843D9B] uppercase tracking-wider border-b border-purple-100 pb-1.5 mt-2 flex items-center gap-1.5">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-[#843D9B]" />
                                                            {field.label}
                                                        </div>
                                                    );
                                                }
                                                const fieldKey = field.key || field.id || field.name;
                                                return (
                                                    <div key={fieldKey}>
                                                        <label className="text-[11px] font-bold text-gray-700 mb-1 flex items-center justify-between">
                                                            <span className="truncate">{field.label}</span>
                                                            {field.isRequired && <span className="text-red-500 font-black ml-0.5">*</span>}
                                                        </label>
                                                        <div className="relative">
                                                            <input
                                                                type="text"
                                                                placeholder={field.placeholder || 'e.g. 36'}
                                                                value={measurementData[fieldKey] || ''}
                                                                onChange={(e) => {
                                                                    const val = e.target.value;
                                                                    if (val === '' || /^\d*\.?\d*$/.test(val)) {
                                                                        setMeasurementData(prev => ({ ...prev, [fieldKey]: val }));
                                                                    }
                                                                }}
                                                                className="w-full px-3 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#843D9B] focus:ring-2 focus:ring-purple-100 shadow-xs"
                                                            />
                                                            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-bold pointer-events-none">
                                                                in
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <div>
                                            <label className="text-[11px] font-bold text-gray-600 mb-1 block">
                                                Special Fitting Instructions / Notes
                                            </label>
                                            <textarea
                                                rows={2}
                                                placeholder="e.g. Keep 1 inch loose around waist, deep neck, straight fit sleeves..."
                                                value={measurementNotes}
                                                onChange={(e) => setMeasurementNotes(e.target.value)}
                                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#843D9B]"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Upload Slip Form */}
                                {measurementMethod === 'slip' && (
                                    <div className="bg-gray-50/70 rounded-2xl p-6 border border-gray-100 space-y-4">
                                        <label className="text-xs font-black uppercase tracking-wider text-gray-700 block">
                                            Upload Measurement Slip / Previous Garment Fitting Photo
                                        </label>
                                        <ImageUploader
                                            label="Upload Slip Photo"
                                            value={slipImage}
                                            onChange={(url) => setSlipImage(url)}
                                        />
                                        <div>
                                            <label className="text-[11px] font-bold text-gray-600 mb-1 block">
                                                Notes for Slip
                                            </label>
                                            <textarea
                                                rows={2}
                                                placeholder="Any note about measurements written on the slip..."
                                                value={measurementNotes}
                                                onChange={(e) => setMeasurementNotes(e.target.value)}
                                                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#843D9B]"
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Quantity & Optional Style Addons */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-gray-100">
                                    <div>
                                        <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-2 block">
                                            Quantity
                                        </label>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                                className="w-11 h-11 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-black text-lg transition-colors"
                                            >
                                                −
                                            </button>
                                            <span className="text-xl font-black w-10 text-center">{quantity}</span>
                                            <button
                                                onClick={() => setQuantity(quantity + 1)}
                                                className="w-11 h-11 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center font-black text-lg transition-colors"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>

                                    <div className="md:col-span-2">
                                        <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider mb-2 block">
                                            Style Addons & Embellishments (Optional)
                                        </label>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                            {availableAddons.slice(0, 9).map(addon => {
                                                const isSelected = styleAddons.some(a => a._id === addon._id);
                                                return (
                                                    <div
                                                        key={addon._id}
                                                        onClick={() => {
                                                            if (isSelected) setStyleAddons(styleAddons.filter(a => a._id !== addon._id));
                                                            else setStyleAddons([...styleAddons, addon]);
                                                        }}
                                                        className={`p-2.5 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                                                            isSelected
                                                                ? 'border-[#843D9B] bg-purple-50/60'
                                                                : 'border-gray-200 hover:border-gray-300 bg-white'
                                                        }`}
                                                    >
                                                        <div className="min-w-0 pr-1">
                                                            <p className="font-bold text-xs text-gray-900 truncate">{addon.name}</p>
                                                            <p className="text-[10px] font-black text-[#843D9B] mt-0.5">+₹{addon.price}</p>
                                                        </div>
                                                        {isSelected && <Check size={14} className="text-[#843D9B] shrink-0" />}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ══════════════════════════════════════
                            STEP 5: DELIVERY ADDRESS (MAP API)
                        ══════════════════════════════════════ */}
                        {currentStep === 4 && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-lg font-black text-gray-900">Step 5: Delivery & Pickup Address</h2>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        Select from saved addresses or search location via Google Maps
                                    </p>
                                </div>

                                {/* Mode Switcher */}
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setAddressMode('saved')}
                                        disabled={!customerProfile?.addresses?.length}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                                            addressMode === 'saved'
                                                ? 'bg-[#843D9B] text-white border-[#843D9B]'
                                                : !customerProfile?.addresses?.length
                                                ? 'bg-gray-50 text-gray-300 border-gray-100 cursor-not-allowed'
                                                : 'bg-white text-gray-700 border-gray-200'
                                        }`}
                                    >
                                        Saved Addresses ({customerProfile?.addresses?.length || 0})
                                    </button>
                                    <button
                                        onClick={() => setAddressMode('new')}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                                            addressMode === 'new'
                                                ? 'bg-[#843D9B] text-white border-[#843D9B]'
                                                : 'bg-white text-gray-700 border-gray-200'
                                        }`}
                                    >
                                        Enter Address
                                    </button>
                                    <button
                                        onClick={() => setAddressMode('map')}
                                        className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                                            addressMode === 'map'
                                                ? 'bg-[#843D9B] text-white border-[#843D9B]'
                                                : 'bg-white text-gray-700 border-gray-200'
                                        }`}
                                    >
                                        📍 Pin on Google Map
                                    </button>
                                </div>

                                {/* Saved Addresses List */}
                                {addressMode === 'saved' && customerProfile?.addresses?.length > 0 && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {customerProfile.addresses.map((addr, i) => {
                                            const isSelected = selectedSavedAddress === addr;
                                            return (
                                                <div
                                                    key={i}
                                                    onClick={() => setSelectedSavedAddress(addr)}
                                                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                                                        isSelected
                                                            ? 'border-[#843D9B] bg-purple-50/60 shadow-md ring-2 ring-purple-300'
                                                            : 'border-gray-200 hover:border-gray-300 bg-white'
                                                    }`}
                                                >
                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <span className="text-xs font-black uppercase text-[#843D9B] bg-purple-100 px-2 py-0.5 rounded-md">
                                                            {addr.type || 'Home'}
                                                        </span>
                                                        {addr.isDefault && (
                                                            <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                                                                Default
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs font-bold text-gray-900 mt-2">{addr.street}</p>
                                                    <p className="text-[11px] text-gray-500 mt-0.5">
                                                        {addr.city}, {addr.state} - {addr.zipCode}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400 mt-1">
                                                        📞 {addr.receiverName || selectedCustomer.name} ({addr.phone || selectedCustomer.phoneNumber || 'N/A'})
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {/* New Address / Map Mode */}
                                {(addressMode === 'new' || addressMode === 'map') && (
                                    <div className="space-y-4 max-w-3xl">
                                        {/* Google Places Autocomplete Search */}
                                        {mapsLoaded && (
                                            <PlacesAutocompleteField
                                                label="Search Area, Landmark or Society (Google Places)"
                                                placeholder="Type locality or street address..."
                                                value={newAddress.street}
                                                onChange={(val) => setNewAddress(prev => ({ ...prev, street: val }))}
                                                onPlaceSelect={(place) => {
                                                    setNewAddress(prev => ({
                                                        ...prev,
                                                        street: place.address,
                                                        city: place.city || prev.city,
                                                        state: place.state || prev.state,
                                                        zipCode: place.pincode || prev.zipCode,
                                                        location: {
                                                            type: 'Point',
                                                            coordinates: [place.longitude, place.latitude]
                                                        }
                                                    }));
                                                    setMapCenter({ lat: place.latitude, lng: place.longitude });
                                                    setMapMarker({ lat: place.latitude, lng: place.longitude });
                                                }}
                                                onClear={() => setNewAddress(prev => ({ ...prev, street: '' }))}
                                            />
                                        )}

                                        {/* Google Map Viewer */}
                                        {addressMode === 'map' && mapsLoaded && (
                                            <div className="rounded-2xl overflow-hidden border-2 border-purple-200 shadow-sm relative">
                                                <GoogleMap
                                                    mapContainerStyle={mapContainerStyle}
                                                    center={mapMarker || mapCenter}
                                                    zoom={mapMarker ? 15 : 5}
                                                    onClick={handleMapClick}
                                                    options={{ disableDefaultUI: true, zoomControl: true }}
                                                >
                                                    {mapMarker && <MarkerF position={mapMarker} />}
                                                </GoogleMap>
                                                <p className="text-[10px] text-gray-600 bg-white/95 px-3 py-1.5 absolute bottom-2 left-2 rounded-lg font-semibold shadow">
                                                    📍 Click anywhere on map to drop pin & auto-detect address
                                                </p>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                                            <div className="sm:col-span-2">
                                                <label className="text-[11px] font-bold text-gray-600 mb-1 block">Full Street Address *</label>
                                                <input
                                                    type="text"
                                                    value={newAddress.street}
                                                    onChange={(e) => setNewAddress(prev => ({ ...prev, street: e.target.value }))}
                                                    placeholder="Flat / House no, Building name, Street"
                                                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#843D9B]"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[11px] font-bold text-gray-600 mb-1 block">City *</label>
                                                <input
                                                    type="text"
                                                    value={newAddress.city}
                                                    onChange={(e) => setNewAddress(prev => ({ ...prev, city: e.target.value }))}
                                                    placeholder="e.g. New Delhi"
                                                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#843D9B]"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[11px] font-bold text-gray-600 mb-1 block">Pincode *</label>
                                                <input
                                                    type="text"
                                                    value={newAddress.zipCode}
                                                    onChange={(e) => setNewAddress(prev => ({ ...prev, zipCode: e.target.value }))}
                                                    placeholder="e.g. 110092"
                                                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#843D9B]"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[11px] font-bold text-gray-600 mb-1 block">Contact Name</label>
                                                <input
                                                    type="text"
                                                    value={newAddress.receiverName}
                                                    onChange={(e) => setNewAddress(prev => ({ ...prev, receiverName: e.target.value }))}
                                                    placeholder={selectedCustomer?.name || 'Customer Name'}
                                                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#843D9B]"
                                                />
                                            </div>
                                            <div>
                                                <label className="text-[11px] font-bold text-gray-600 mb-1 block">Contact Phone Number</label>
                                                <input
                                                    type="text"
                                                    value={newAddress.phone}
                                                    onChange={(e) => setNewAddress(prev => ({ ...prev, phone: e.target.value }))}
                                                    placeholder={selectedCustomer?.phoneNumber || '10-digit mobile number'}
                                                    className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#843D9B]"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ══════════════════════════════════════
                            STEP 6: REVIEW & BILL BREAKDOWN
                        ══════════════════════════════════════ */}
                        {currentStep === 5 && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="text-lg font-black text-gray-900">Step 6: Review Order & Billing</h2>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        Verify all order parameters, schedule date, and select payment handling
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    {/* Left: Order Items Summary */}
                                    <div className="lg:col-span-2 space-y-4">
                                        {/* Outfit Card */}
                                        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                                            <div className="flex items-start gap-4">
                                                <div className="w-20 h-24 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-100">
                                                    <img
                                                        src={selectedService?.image || 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=400&q=80'}
                                                        alt={selectedService?.title}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <span className="text-[9px] font-black uppercase tracking-wider text-[#843D9B] bg-purple-100 px-2 py-0.5 rounded">
                                                                {selectedService?.category?.name || 'Custom Stitching'}
                                                            </span>
                                                            <h3 className="font-black text-base text-gray-900 mt-1">{selectedService?.title}</h3>
                                                        </div>
                                                        <span className="text-base font-black text-[#843D9B]">
                                                            ₹{(selectedService?.basePrice || 0) * quantity}
                                                        </span>
                                                    </div>

                                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                                        <span className="text-[10px] bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full font-bold">
                                                            Qty: {quantity}
                                                        </span>
                                                        <span className="text-[10px] bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full font-bold">
                                                            {fabricSource === 'customer' ? '👗 Customer Fabric' : '🏪 Platform Fabric'}
                                                        </span>
                                                        <span className="text-[10px] bg-gray-100 text-gray-700 px-2.5 py-0.5 rounded-full font-bold capitalize">
                                                            🚀 {deliveryType} Delivery
                                                        </span>
                                                        {selectedStyleVariant && (
                                                            <span className="text-[10px] bg-purple-100 text-[#843D9B] px-2.5 py-0.5 rounded-full font-bold">
                                                                Pattern: {selectedStyleVariant.name}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Tailor & Customer Quick Card */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                                                <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Tailor Boutique</p>
                                                <p className="font-black text-sm text-gray-900">{selectedTailor?.shopName || selectedTailor?.name}</p>
                                                <p className="text-xs text-gray-500 mt-0.5">Master: {selectedTailor?.user?.name || selectedTailor?.name}</p>
                                            </div>

                                            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                                                <p className="text-[10px] uppercase font-bold text-gray-400 mb-1">Ordering For Customer</p>
                                                <p className="font-black text-sm text-gray-900">{selectedCustomer?.name}</p>
                                                <p className="text-xs text-gray-500 mt-0.5">{selectedCustomer?.phoneNumber || selectedCustomer?.email}</p>
                                            </div>
                                        </div>

                                        {/* Measurement Summary */}
                                        <div className="bg-blue-50/60 rounded-2xl p-4 border border-blue-100">
                                            <div className="flex items-center justify-between mb-2">
                                                <p className="text-xs font-black text-blue-900 flex items-center gap-1.5">
                                                    <Ruler size={16} className="text-blue-600" />
                                                    Measurement: <span className="capitalize">{measurementMethod === 'home' ? 'Tailor at Home (Home Visit)' : measurementMethod === 'slip' ? 'Slip Photo Uploaded' : measurementMethod === 'self' ? 'Self Measured' : 'Shop Visit'}</span>
                                                </p>
                                            </div>

                                            {measurementMethod === 'self' && Object.keys(measurementData).length > 0 && (
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {Object.entries(measurementData).filter(([, v]) => v).map(([k, v]) => (
                                                        <span key={k} className="text-[10px] bg-white text-gray-700 rounded-lg px-2.5 py-1 font-bold border border-blue-100 shadow-2xs">
                                                            {k}: {v}"
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {measurementMethod === 'slip' && slipImage && (
                                                <div className="mt-2 flex items-center gap-3">
                                                    <img src={slipImage} alt="Slip" className="w-14 h-14 rounded-lg object-cover border border-blue-200" />
                                                    <p className="text-xs text-blue-800 font-semibold">Slip photo attached for tailoring unit</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Schedule Picker */}
                                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
                                            <p className="text-xs font-black text-gray-900 flex items-center gap-2">
                                                <Calendar size={16} className="text-[#843D9B]" />
                                                {measurementMethod === 'home' ? 'Home Measurement Visit Schedule' : 'Preferred Stitching Date & Time'}
                                            </p>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Scheduled Date</label>
                                                    <input
                                                        type="date"
                                                        value={scheduledDate}
                                                        min={new Date().toISOString().split('T')[0]}
                                                        onChange={(e) => setScheduledDate(e.target.value)}
                                                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#843D9B]"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Time Slot</label>
                                                    <select
                                                        value={scheduledTimeSlot}
                                                        onChange={(e) => setScheduledTimeSlot(e.target.value)}
                                                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#843D9B]"
                                                    >
                                                        <option value="9:00 AM - 12:00 PM">Morning (9:00 AM - 12:00 PM)</option>
                                                        <option value="12:00 PM - 3:00 PM">Afternoon (12:00 PM - 3:00 PM)</option>
                                                        <option value="3:00 PM - 6:00 PM">Evening (3:00 PM - 6:00 PM)</option>
                                                        <option value="6:00 PM - 9:00 PM">Night (6:00 PM - 9:00 PM)</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Payment Collection Option */}
                                        <div className="space-y-2">
                                            <label className="text-[10px] uppercase font-bold text-gray-400 tracking-wider block">
                                                Payment Status for This Order
                                            </label>
                                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                                {[
                                                    { key: 'skip', label: 'Payment Pending', desc: 'Customer pays online in user app' },
                                                    { key: 'advance_cash', label: 'Advance Paid', desc: '50% advance collected in cash' },
                                                    { key: 'full_cash', label: 'Full Paid', desc: '100% amount collected' },
                                                ].map(p => (
                                                    <div
                                                        key={p.key}
                                                        onClick={() => setPaymentMethod(p.key)}
                                                        className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                                                            paymentMethod === p.key
                                                                ? 'border-[#843D9B] bg-purple-50/60'
                                                                : 'border-gray-200 hover:border-gray-300 bg-white'
                                                        }`}
                                                    >
                                                        <p className="font-bold text-xs text-gray-900">{p.label}</p>
                                                        <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">{p.desc}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: Bill Details Card */}
                                    <div>
                                        <div className="bg-gradient-to-br from-gray-950 via-gray-900 to-purple-950 rounded-3xl p-6 text-white shadow-xl sticky top-6 space-y-4">
                                            <div className="flex items-center justify-between pb-3 border-b border-white/10">
                                                <h3 className="font-black text-sm uppercase tracking-wider text-purple-200 flex items-center gap-2">
                                                    <CreditCard size={16} /> Bill Details
                                                </h3>
                                                <span className="text-[10px] bg-white/10 px-2.5 py-0.5 rounded-full font-bold">
                                                    Verified
                                                </span>
                                            </div>

                                            {/* Promo Code Input */}
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    placeholder="Promo Code"
                                                    value={promoCode}
                                                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-xl text-xs font-bold uppercase placeholder:text-gray-400 focus:outline-none focus:border-purple-300"
                                                />
                                                <button
                                                    onClick={calculatePrice}
                                                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all shrink-0"
                                                >
                                                    Apply
                                                </button>
                                            </div>

                                            {priceLoading ? (
                                                <div className="py-8 flex justify-center">
                                                    <Loader2 size={24} className="animate-spin text-purple-300" />
                                                </div>
                                            ) : priceSummary ? (
                                                <div className="space-y-2.5 text-xs text-gray-300">
                                                    <div className="flex justify-between">
                                                        <span>Service Subtotal ({quantity}x)</span>
                                                        <span className="font-bold text-white">₹{priceSummary.base}</span>
                                                    </div>

                                                    {priceSummary.addons > 0 && (
                                                        <div className="flex justify-between">
                                                            <span>Style Addons</span>
                                                            <span className="font-bold text-purple-300">+₹{priceSummary.addons}</span>
                                                        </div>
                                                    )}

                                                    {priceSummary.tailorAtHome > 0 && (
                                                        <div className="flex justify-between">
                                                            <span>Tailor at Home Visit Fee</span>
                                                            <span className="font-bold text-emerald-300">+₹{priceSummary.tailorAtHome}</span>
                                                        </div>
                                                    )}

                                                    {priceSummary.platformFee > 0 && (
                                                        <div className="flex justify-between">
                                                            <span>Platform Fee</span>
                                                            <span className="font-bold text-white">+₹{priceSummary.platformFee}</span>
                                                        </div>
                                                    )}

                                                    {priceSummary.taxes > 0 && (
                                                        <div className="flex justify-between">
                                                            <span>GST (5%)</span>
                                                            <span className="font-bold text-white">+₹{priceSummary.taxes}</span>
                                                        </div>
                                                    )}

                                                    <div className="flex justify-between">
                                                        <span>Delivery Charges</span>
                                                        <span className="font-bold text-white">
                                                            {priceSummary.freeDeliveryApplied || priceSummary.delivery === 0 ? (
                                                                <span className="text-emerald-400 uppercase font-black">FREE</span>
                                                            ) : (
                                                                `₹${priceSummary.delivery}`
                                                            )}
                                                        </span>
                                                    </div>

                                                    {priceSummary.discountAmount > 0 && (
                                                        <div className="flex justify-between text-emerald-400 font-bold">
                                                            <span>Promo Discount</span>
                                                            <span>-₹{priceSummary.discountAmount}</span>
                                                        </div>
                                                    )}

                                                    {/* Total and Split */}
                                                    <div className="pt-3 border-t border-white/10 space-y-2">
                                                        <div className="flex justify-between items-baseline">
                                                            <span className="font-black text-sm uppercase tracking-wide text-white">Grand Total</span>
                                                            <span className="font-black text-2xl text-white">₹{priceSummary.total}</span>
                                                        </div>

                                                        <div className="p-3 bg-white/5 rounded-xl border border-white/10 space-y-1.5 text-[11px]">
                                                            <div className="flex justify-between text-purple-200">
                                                                <span>Advance Due (50%):</span>
                                                                <span className="font-bold">₹{Math.round(priceSummary.total / 2)}</span>
                                                            </div>
                                                            <div className="flex justify-between text-gray-400">
                                                                <span>Remaining on Delivery:</span>
                                                                <span className="font-bold">₹{priceSummary.total - Math.round(priceSummary.total / 2)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : null}

                                            <button
                                                onClick={handleSubmitOrder}
                                                disabled={isSubmitting || !priceSummary}
                                                className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 active:scale-[0.99] text-white rounded-2xl font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-950 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                                            >
                                                {isSubmitting ? (
                                                    <>
                                                        <Loader2 size={18} className="animate-spin" />
                                                        Creating Order...
                                                    </>
                                                ) : (
                                                    <>
                                                        <CheckCircle2 size={18} />
                                                        Confirm & Place Order
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Stepper Footer Buttons */}
            <div className="flex items-center justify-between">
                <button
                    onClick={prevStep}
                    disabled={currentStep === 0}
                    className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all ${
                        currentStep === 0
                            ? 'text-gray-300 cursor-not-allowed bg-gray-100'
                            : 'text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 shadow-sm'
                    }`}
                >
                    <ChevronLeft size={16} /> Back
                </button>

                {currentStep < STEPS.length - 1 && (
                    <button
                        onClick={nextStep}
                        disabled={!canProceed()}
                        className={`flex items-center gap-2 px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-wider transition-all ${
                            canProceed()
                                ? 'bg-[#843D9B] text-white hover:bg-[#682498] shadow-lg shadow-purple-900/20'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                    >
                        Continue <ChevronRight size={16} />
                    </button>
                )}
            </div>
        </div>
    );
};

export default CreateOrderForUser;
