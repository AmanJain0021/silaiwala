import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, X, Plus, Package, User, Phone, Ruler, ChevronDown, ChevronUp,
    IndianRupee, StickyNote, CheckCircle2, Clock, Scissors, Upload, Image as ImageIcon, AlertTriangle, Receipt, Truck, MapPin, Star
} from 'lucide-react';
import api from '../../../utils/api';
import { toast } from 'react-hot-toast';
import OfflineOrderReceiptModal from '../components/OfflineOrderReceiptModal';
import OfflineProductionPipeline from '../components/OfflineProductionPipeline';
import {
    OFFLINE_STATUS_TABS,
    getOfflineStatusLabel,
    offlineStatusStyle,
    normalizeOfflineStatus,
} from '../constants/offlineOrderStatus';

const MEASUREMENT_FIELDS = [
    { key: 'chest', label: 'Chest / Bust' },
    { key: 'waist', label: 'Waist' },
    { key: 'hips', label: 'Hips' },
    { key: 'shoulder', label: 'Shoulder' },
    { key: 'length', label: 'Length' },
    { key: 'neck', label: 'Neck' },
    { key: 'sleeve', label: 'Sleeve' },
    { key: 'inseam', label: 'Inseam' },
];

const CUSTOMIZATION_SLOTS = [
    { key: 'neck', label: 'Neck Design', categoryMatch: 'Neck' },
    { key: 'sleeve', label: 'Sleeve Style', categoryMatch: 'Sleeve' },
    { key: 'bottom', label: 'Bottom Style', categoryMatch: 'Bottom' },
    { key: 'embroidery', label: 'Embroidery', categoryMatch: 'Embroidery', checkbox: true },
    { key: 'lacePiping', label: 'Lace / Piping', categoryMatch: 'Lace', checkbox: true },
    { key: 'lining', label: 'Lining', checkboxOnly: true },
];

const emptyForm = {
    offlineCustomer: '',
    garmentType: 'Suit',
    stitchingPackage: 'basic',
    stitchingCharges: 800,
    fabricSource: 'customer',
    status: 'accepted',
    priority: 'normal',
    notes: '',
    measurementUnit: 'inches',
    measurements: emptyMeasurements(),
    measurementPhotos: [],
    savedMeasurementLabel: '',
    selectedSavedMeasurementIdx: '',
    styleAddons: [],
    customizations: emptyCustomizations(),
    discountType: 'amount',
    discountValue: '',
    advancePaid: '',
    shopTailor: '',
    fulfillmentMethod: 'pickup',
    deliveryAddress: '',
    deliveryFee: '',
    deliveryNotes: '',
};

const emptyMeasurements = () =>
    Object.fromEntries(MEASUREMENT_FIELDS.map((f) => [f.key, '']));

const emptyCustomizations = () => ({
    neck: { name: '', price: 0, refImage: '', enabled: false },
    sleeve: { name: '', price: 0, refImage: '', enabled: false },
    bottom: { name: '', price: 0, refImage: '', enabled: false },
    lining: { name: 'Lining', price: 0, refImage: '', enabled: false },
    embroidery: { name: '', price: 0, refImage: '', enabled: false },
    lacePiping: { name: '', price: 0, refImage: '', enabled: false },
});

const paymentStyle = (status) => {
    switch (status) {
        case 'paid': return 'bg-green-100 text-green-700 border-green-200';
        case 'partial': return 'bg-amber-100 text-amber-700 border-amber-200';
        default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
};

const formatPackageLabel = (pkg) => {
    if (!pkg) return '—';
    if (typeof pkg === 'string') return pkg;
    if (typeof pkg === 'object') return pkg.name || pkg.id || '—';
    return String(pkg);
};

const formatGarmentLabel = (garment) => {
    if (!garment) return '—';
    if (typeof garment === 'string') return garment;
    if (typeof garment === 'object') return garment.name || garment.label || '—';
    return String(garment);
};

const AdminOfflineOrders = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState(emptyForm);
    const [showMeasurements, setShowMeasurements] = useState(true);
    const [showCustomizations, setShowCustomizations] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [customerOptions, setCustomerOptions] = useState([]);
    const [customerSearch, setCustomerSearch] = useState('');
    const [isLoadingCustomers, setIsLoadingCustomers] = useState(false);
    const [prefillCustomerLabel, setPrefillCustomerLabel] = useState('');
    const [selectedCustomerDetail, setSelectedCustomerDetail] = useState(null);
    const [stats, setStats] = useState(null);
    const [receiptOrder, setReceiptOrder] = useState(null);
    const [completeOrder, setCompleteOrder] = useState(null);
    const [completeForm, setCompleteForm] = useState({
        amountReceived: '',
        customerRating: '',
        customerReview: '',
        saveMeasurements: true,
    });
    const [isCompleting, setIsCompleting] = useState(false);
    const [pendingFulfillmentOnly, setPendingFulfillmentOnly] = useState(false);
    const [packages, setPackages] = useState([]);
    const [garmentTypes, setGarmentTypes] = useState(['Suit', 'Pheran', 'Blouse', 'Kurti', 'Lehenga']);
    const [styleAddonsCatalog, setStyleAddonsCatalog] = useState([]);
    const [tailors, setTailors] = useState([]);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);

    const allGarmentTypes = useMemo(() => {
        const defaultList = ['Shirt', 'Pant', 'Suit', 'Kurta', 'Blouse', 'Skirt', 'Lehenga', 'Sherwani', 'Anarkali', 'Jacket/Blazer', 'Alteration', 'Pheran', 'Kurti'];
        return Array.from(new Set([...defaultList, ...(garmentTypes || [])]));
    }, [garmentTypes]);

    const fetchStats = useCallback(async () => {
        try {
            const res = await api.get('/admin/offline-orders/stats');
            if (res.data?.success) setStats(res.data.data);
        } catch {
            /* non-blocking */
        }
    }, []);

    const fetchMeta = useCallback(async () => {
        try {
            const [metaRes, addonsRes, tailorsRes] = await Promise.all([
                api.get('/admin/offline-orders/meta'),
                api.get('/style-addons'),
                api.get('/admin/users?role=tailor&limit=100'),
            ]);
            if (metaRes.data?.data?.packages) setPackages(metaRes.data.data.packages);
            if (metaRes.data?.data?.garmentTypes) setGarmentTypes(metaRes.data.data.garmentTypes);
            setStyleAddonsCatalog((addonsRes.data?.data || []).filter((a) => a.isActive !== false));
            setTailors(tailorsRes.data?.data || []);
        } catch (error) {
            if (error?.name === 'CanceledError') return;
            console.error('Failed to load offline order meta:', error);
        }
    }, []);

    const fetchOrders = useCallback(async () => {
        setIsLoading(true);
        try {
            const params = { limit: 100 };
            if (statusFilter) params.status = statusFilter;
            if (searchQuery.trim()) params.search = searchQuery.trim();
            const customerId = searchParams.get('customer');
            if (customerId) params.offlineCustomer = customerId;
            if (pendingFulfillmentOnly) params.pendingFulfillment = 'true';

            const res = await api.get('/admin/offline-orders', { params });
            setOrders(res.data.data || []);
        } catch (error) {
            if (error?.name === 'CanceledError' || error?.message?.toLowerCase().includes('cancel')) return;
            toast.error('Failed to load offline orders');
        } finally {
            setIsLoading(false);
        }
    }, [statusFilter, searchQuery, searchParams, pendingFulfillmentOnly]);

    useEffect(() => {
        fetchStats();
        fetchMeta();
    }, [fetchStats, fetchMeta]);

    useEffect(() => {
        const t = setTimeout(fetchOrders, searchQuery ? 300 : 0);
        return () => clearTimeout(t);
    }, [fetchOrders, searchQuery]);

    const loadCustomerDetail = async (customerId) => {
        if (!customerId) {
            setSelectedCustomerDetail(null);
            return;
        }
        try {
            const res = await api.get(`/admin/offline-customers/${customerId}`);
            setSelectedCustomerDetail(res.data.data.customer);
        } catch {
            setSelectedCustomerDetail(null);
        }
    };

    useEffect(() => {
        const customerId = searchParams.get('customer');
        const openNew = searchParams.get('new') === '1';
        if (!customerId || !openNew) return;

        (async () => {
            try {
                const res = await api.get(`/admin/offline-customers/${customerId}`);
                const c = res.data.data.customer;
                const pkg = packages[0];
                setFormData((prev) => ({
                    ...prev,
                    ...emptyForm,
                    offlineCustomer: c._id,
                    stitchingPackage: pkg?.id || 'basic',
                    stitchingCharges: pkg?.defaultPrice || 800,
                    measurements: emptyMeasurements(),
                    customizations: emptyCustomizations(),
                }));
                setPrefillCustomerLabel(`${c.name} · ${c.phone}`);
                setCustomerOptions([{ _id: c._id, name: c.name, phone: c.phone }]);
                setSelectedCustomerDetail(c);
                setIsModalOpen(true);
                setSearchParams((prev) => {
                    const next = new URLSearchParams(prev);
                    next.delete('new');
                    return next;
                }, { replace: true });
            } catch {
                /* ignore */
            }
        })();
    }, [searchParams, setSearchParams, packages]);

    const fetchCustomerOptions = async (term = '') => {
        setIsLoadingCustomers(true);
        try {
            const res = await api.get('/admin/offline-customers', {
                params: { isActive: 'true', limit: 30, ...(term ? { search: term } : {}) },
            });
            setCustomerOptions(res.data.data || []);
        } catch (error) {
            if (error?.name === 'CanceledError' || error?.message?.toLowerCase().includes('cancel')) return;
            toast.error('Failed to load customers');
        } finally {
            setIsLoadingCustomers(false);
        }
    };

    useEffect(() => {
        if (!isModalOpen) return;
        const t = setTimeout(() => fetchCustomerOptions(customerSearch), customerSearch ? 250 : 0);
        return () => clearTimeout(t);
    }, [isModalOpen, customerSearch]);

    const addOnsTotal = useMemo(() => {
        const styleList = Array.isArray(formData.styleAddons) ? formData.styleAddons : [];
        const fromStyle = styleList.reduce((sum, a) => sum + (Number(a?.price) || 0), 0);

        const custObj = (formData.customizations && typeof formData.customizations === 'object')
            ? formData.customizations
            : {};

        const fromCustom = Object.entries(custObj).reduce((sum, [key, c]) => {
            if (!c || typeof c !== 'object') return sum;
            if (!c.enabled && !c.name) return sum;
            if (['lining', 'embroidery', 'lacePiping'].includes(key) && !c.enabled) return sum;
            if (['neck', 'sleeve', 'bottom'].includes(key) && !c.name) return sum;
            return sum + (Number(c.price) || 0);
        }, 0);
        return fromStyle + fromCustom;
    }, [formData.styleAddons, formData.customizations]);

    const discountAmount = useMemo(() => {
        const deliveryFee =
            formData.fulfillmentMethod === 'home_delivery' ? Number(formData.deliveryFee) || 0 : 0;
        const subtotal = (Number(formData.stitchingCharges) || 0) + addOnsTotal + deliveryFee;
        const raw = Number(formData.discountValue) || 0;
        if (formData.discountType === 'percent') {
            return Math.round((subtotal * Math.min(raw, 100)) / 100);
        }
        return Math.min(raw, subtotal);
    }, [
        formData.stitchingCharges,
        formData.discountValue,
        formData.discountType,
        formData.fulfillmentMethod,
        formData.deliveryFee,
        addOnsTotal,
    ]);

    const computedTotal = useMemo(() => {
        const deliveryFee =
            formData.fulfillmentMethod === 'home_delivery' ? Number(formData.deliveryFee) || 0 : 0;
        return Math.max(
            0,
            (Number(formData.stitchingCharges) || 0) + addOnsTotal + deliveryFee - discountAmount
        );
    }, [
        formData.stitchingCharges,
        formData.fulfillmentMethod,
        formData.deliveryFee,
        addOnsTotal,
        discountAmount,
    ]);

    const balanceDue = Math.max(0, computedTotal - (Number(formData.advancePaid) || 0));

    const openCreateModal = () => {
        const customerId = searchParams.get('customer');
        const pkg = packages.find((p) => p.id === 'basic') || packages[0];
        setFormData({
            ...emptyForm,
            offlineCustomer: customerId || '',
            stitchingPackage: pkg?.id || 'basic',
            stitchingCharges: pkg?.defaultPrice || 800,
            measurements: emptyMeasurements(),
            customizations: emptyCustomizations(),
            measurementPhotos: [],
            styleAddons: [],
        });
        setShowMeasurements(true);
        setShowCustomizations(true);
        setCustomerSearch('');
        setPrefillCustomerLabel('');
        setSelectedCustomerDetail(null);
        setIsModalOpen(true);
        if (customerId) {
            api.get(`/admin/offline-customers/${customerId}`)
                .then((res) => {
                    const c = res.data.data.customer;
                    setPrefillCustomerLabel(`${c.name} · ${c.phone}`);
                    setCustomerOptions([{ _id: c._id, name: c.name, phone: c.phone }]);
                    setSelectedCustomerDetail(c);
                    setFormData((prev) => ({ ...prev, offlineCustomer: c._id }));
                })
                .catch(() => {});
        }
    };

    const selectCustomer = async (c) => {
        setFormData((prev) => ({
            ...prev,
            offlineCustomer: c._id,
            selectedSavedMeasurementIdx: '',
            savedMeasurementLabel: '',
        }));
        setPrefillCustomerLabel(`${c.name} · ${c.phone}`);
        await loadCustomerDetail(c._id);
    };

    const applySavedMeasurement = (idx) => {
        const profiles = selectedCustomerDetail?.savedMeasurements || [];
        const profile = profiles[idx];
        if (!profile) return;
        const measurements = emptyMeasurements();
        Object.entries(profile.measurements || {}).forEach(([key, value]) => {
            measurements[key] = value ?? '';
        });
        setFormData((prev) => ({
            ...prev,
            selectedSavedMeasurementIdx: String(idx),
            savedMeasurementLabel: profile.label || profile.garmentType || '',
            garmentType: profile.garmentType || prev.garmentType,
            measurementUnit: profile.unit || 'inches',
            measurements,
        }));
    };

    const selectPackage = (pkgId) => {
        const pkg = packages.find((p) => p.id === pkgId);
        setFormData((prev) => ({
            ...prev,
            stitchingPackage: pkgId,
            stitchingCharges: pkg?.defaultPrice ?? prev.stitchingCharges,
        }));
    };

    const addonsForSlot = (slot) => {
        if (slot.checkboxOnly) return [];
        return styleAddonsCatalog.filter((a) =>
            (a.category || '').toLowerCase().includes(slot.categoryMatch.toLowerCase())
        );
    };

    const setCustomization = (key, patch) => {
        setFormData((prev) => ({
            ...prev,
            customizations: {
                ...prev.customizations,
                [key]: { ...prev.customizations[key], ...patch },
            },
        }));
    };

    const toggleStyleAddon = (addon) => {
        setFormData((prev) => {
            const exists = prev.styleAddons.find((a) => a.addon === addon._id);
            if (exists) {
                return {
                    ...prev,
                    styleAddons: prev.styleAddons.filter((a) => a.addon !== addon._id),
                };
            }
            return {
                ...prev,
                styleAddons: [
                    ...prev.styleAddons,
                    {
                        addon: addon._id,
                        name: addon.name,
                        category: addon.category,
                        price: addon.price,
                        refImage: addon.image || '',
                    },
                ],
            };
        });
    };

    const uploadMeasurementPhoto = async (file) => {
        if (!file) return;
        setUploadingPhoto(true);
        try {
            const body = new FormData();
            body.append('file', file);
            body.append('folder', 'offline/measurements');
            const res = await api.post('/upload', body, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const url = res.data?.data?.url || res.data?.url || res.data?.data;
            if (!url || typeof url !== 'string') {
                toast.error('Upload succeeded but no URL returned');
                return;
            }
            setFormData((prev) => ({
                ...prev,
                measurementPhotos: [...prev.measurementPhotos, url],
            }));
            toast.success('Photo uploaded');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Photo upload failed');
        } finally {
            setUploadingPhoto(false);
        }
    };

    const buildMeasurementsPayload = () => {
        const out = {};
        MEASUREMENT_FIELDS.forEach(({ key }) => {
            const raw = formData.measurements[key];
            if (raw !== '' && raw !== null && raw !== undefined) {
                const n = Number(raw);
                if (!Number.isNaN(n) && n > 0) out[key] = n;
            }
        });
        return out;
    };

    const openReceiptForOrder = async (order) => {
        try {
            const res = await api.get(`/admin/offline-orders/${order._id}`);
            setReceiptOrder(res.data.data);
        } catch {
            toast.error('Could not load receipt');
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!formData.offlineCustomer) {
            toast.error('Select an offline customer');
            return;
        }
        if (!(formData.garmentType || '').trim()) {
            toast.error('Garment type is required');
            return;
        }
        if (
            formData.fulfillmentMethod === 'home_delivery' &&
            !(formData.deliveryAddress || selectedCustomerDetail?.address || '').trim()
        ) {
            toast.error('Delivery address is required for home delivery');
            return;
        }
        if ((Number(formData.advancePaid) || 0) > computedTotal) {
            toast.error('Advance cannot exceed total');
            return;
        }

        setIsSaving(true);
        try {
            const createRes = await api.post('/admin/offline-orders', {
                offlineCustomer: formData.offlineCustomer,
                garmentType: formData.garmentType.trim(),
                stitchingPackage: formData.stitchingPackage,
                stitchingCharges: Number(formData.stitchingCharges) || 0,
                fabricSource: formData.fabricSource,
                measurements: buildMeasurementsPayload(),
                measurementUnit: formData.measurementUnit,
                measurementPhotos: formData.measurementPhotos,
                savedMeasurementLabel: formData.savedMeasurementLabel,
                styleAddons: formData.styleAddons,
                customizations: formData.customizations,
                addOnsTotal,
                discountType: formData.discountType,
                discountValue: Number(formData.discountValue) || 0,
                totalAmount: computedTotal,
                advancePaid: Number(formData.advancePaid) || 0,
                status: formData.status,
                priority: formData.priority,
                notes: formData.notes.trim(),
                shopTailor: formData.shopTailor || undefined,
                fulfillmentMethod: formData.fulfillmentMethod,
                deliveryAddress:
                    formData.fulfillmentMethod === 'home_delivery'
                        ? (formData.deliveryAddress || selectedCustomerDetail?.address || '').trim()
                        : '',
                deliveryFee:
                    formData.fulfillmentMethod === 'home_delivery'
                        ? Number(formData.deliveryFee) || 0
                        : 0,
                deliveryNotes: formData.deliveryNotes.trim(),
            });
            toast.success('Offline order created');
            setIsModalOpen(false);
            setFormData(emptyForm);
            fetchOrders();
            fetchStats();
            await openReceiptForOrder(createRes.data.data);
        } catch (error) {
            if (error?.name === 'CanceledError' || error?.message?.toLowerCase().includes('cancel')) return;
            toast.error(error.response?.data?.message || 'Failed to create order');
        } finally {
            setIsSaving(false);
        }
    };

    const openDetail = async (order) => {
        try {
            const res = await api.get(`/admin/offline-orders/${order._id}`);
            setSelectedOrder(res.data.data);
        } catch (error) {
            if (error?.name === 'CanceledError' || error?.message?.toLowerCase().includes('cancel')) return;
            toast.error('Failed to load order');
        }
    };

    const handleStatusUpdate = async (status) => {
        if (!selectedOrder) return;
        if (
            selectedOrder.status === status ||
            (normalizeOfflineStatus(selectedOrder.status) === status && status !== 'cancelled')
        ) {
            return;
        }
        setIsUpdatingStatus(true);
        try {
            const res = await api.patch(`/admin/offline-orders/${selectedOrder._id}/status`, { status });
            setSelectedOrder(res.data.data);
            toast.success(`Status updated to ${getOfflineStatusLabel(status)}`);
            fetchOrders();
            fetchStats();
        } catch (error) {
            if (error?.name === 'CanceledError' || error?.message?.toLowerCase().includes('cancel')) return;
            toast.error(error.response?.data?.message || 'Failed to update status');
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handlePaymentUpdate = async () => {
        if (!selectedOrder) return;
        const raw = window.prompt(
            'Update advance / amount received (₹)',
            String(selectedOrder.advancePaid || 0)
        );
        if (raw === null) return;
        const advancePaid = Number(raw);
        if (Number.isNaN(advancePaid) || advancePaid < 0) {
            toast.error('Invalid amount');
            return;
        }
        if (advancePaid > (selectedOrder.totalAmount || 0)) {
            toast.error('Advance cannot exceed total');
            return;
        }
        setIsUpdatingStatus(true);
        try {
            const res = await api.put(`/admin/offline-orders/${selectedOrder._id}`, { advancePaid });
            setSelectedOrder(res.data.data);
            toast.success('Payment updated');
            fetchOrders();
            fetchStats();
        } catch (error) {
            if (error?.name === 'CanceledError' || error?.message?.toLowerCase().includes('cancel')) return;
            toast.error(error.response?.data?.message || 'Failed to update payment');
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const openCompleteModal = (order) => {
        const balance = Math.max(0, (order.totalAmount || 0) - (order.advancePaid || 0));
        setCompleteOrder(order);
        setCompleteForm({
            amountReceived: String(balance),
            customerRating: '',
            customerReview: '',
            saveMeasurements: true,
        });
    };

    const handleOutForDelivery = async () => {
        if (!selectedOrder) return;
        setIsUpdatingStatus(true);
        try {
            const res = await api.patch(`/admin/offline-orders/${selectedOrder._id}/out-for-delivery`);
            setSelectedOrder(res.data.data);
            toast.success('Marked out for delivery');
            fetchOrders();
            fetchStats();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update');
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    const handleCompleteOrder = async (e) => {
        e.preventDefault();
        if (!completeOrder) return;
        setIsCompleting(true);
        try {
            const res = await api.post(`/admin/offline-orders/${completeOrder._id}/complete`, {
                amountReceived: Number(completeForm.amountReceived) || 0,
                collectFullBalance: false,
                customerRating: completeForm.customerRating
                    ? Number(completeForm.customerRating)
                    : undefined,
                customerReview: completeForm.customerReview.trim(),
                saveMeasurements: completeForm.saveMeasurements,
            });
            toast.success(
                res.data.meta?.measurementsSaved
                    ? 'Order completed · measurements saved'
                    : 'Order completed'
            );
            setCompleteOrder(null);
            setSelectedOrder(res.data.data);
            fetchOrders();
            fetchStats();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to complete order');
        } finally {
            setIsCompleting(false);
        }
    };

    const customerFilterId = searchParams.get('customer');
    const measurementsMap =
        selectedOrder?.measurements instanceof Map
            ? Object.fromEntries(selectedOrder.measurements)
            : selectedOrder?.measurements || {};

    const extraAddons = styleAddonsCatalog.filter(
        (a) =>
            !CUSTOMIZATION_SLOTS.some(
                (s) => s.categoryMatch && (a.category || '').toLowerCase().includes(s.categoryMatch.toLowerCase())
            )
    );

    return (
        <div className="h-full flex flex-col space-y-6 relative">
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Offline Orders</h1>
                    <p className="text-xs text-gray-500 font-medium mt-1">
                        Walk-in shop orders — separate from online marketplace orders
                    </p>
                    {customerFilterId && (
                        <button
                            onClick={() => setSearchParams({})}
                            className="mt-2 text-[10px] font-bold text-primary uppercase tracking-wider hover:underline"
                        >
                            Clear customer filter
                        </button>
                    )}
                </div>
                <button
                    onClick={openCreateModal}
                    className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-xs font-black rounded-xl hover:bg-primary-dark shadow-lg shadow-primary/20 transition-all uppercase tracking-wider w-full sm:w-auto justify-center"
                >
                    <Plus size={16} /> New Offline Order
                </button>
            </div>

            {stats && (
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Revenue</p>
                        <p className="text-lg font-black text-primary mt-1">
                            ₹{(stats.totalRevenue || 0).toLocaleString()}
                        </p>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Collected</p>
                        <p className="text-lg font-black text-gray-900 mt-1">
                            ₹{(stats.totalCollected || 0).toLocaleString()}
                        </p>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Pending ₹</p>
                        <p className="text-lg font-black text-amber-600 mt-1">
                            ₹{(stats.pendingPayments || 0).toLocaleString()}
                        </p>
                    </div>
                    <div className="bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Orders</p>
                        <p className="text-lg font-black text-gray-900 mt-1">{stats.totalOrders || 0}</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => {
                            setPendingFulfillmentOnly(true);
                            setStatusFilter('');
                        }}
                        className={`bg-white border rounded-2xl p-4 shadow-sm text-left transition-all ${
                            pendingFulfillmentOnly
                                ? 'border-primary ring-2 ring-primary/20'
                                : 'border-gray-100 hover:border-primary/40'
                        }`}
                    >
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1">
                            <Truck size={10} /> Awaiting handoff
                        </p>
                        <p className="text-lg font-black text-indigo-700 mt-1">
                            {stats.pendingFulfillment || 0}
                        </p>
                        <p className="text-[9px] text-gray-400 mt-0.5">
                            Pickup {stats.pendingPickup || 0} · Delivery {stats.pendingHomeDelivery || 0}
                        </p>
                    </button>
                </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex bg-gray-50 p-1 rounded-xl w-full sm:w-auto overflow-x-auto no-scrollbar">
                    {OFFLINE_STATUS_TABS.map((tab) => (
                        <button
                            key={tab.key || 'all'}
                            onClick={() => {
                                setPendingFulfillmentOnly(false);
                                setStatusFilter(tab.key);
                            }}
                            className={`px-3 py-2 text-xs font-bold rounded-lg whitespace-nowrap transition-all ${
                                !pendingFulfillmentOnly && statusFilter === tab.key
                                    ? 'bg-white text-primary shadow-sm'
                                    : 'text-gray-500 hover:text-gray-900'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
                <div className="relative flex-1 sm:w-64 w-full">
                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search order, customer, garment..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 text-xs font-semibold bg-gray-50 border border-transparent focus:border-gray-200 rounded-xl outline-none transition-all"
                    />
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex-1 overflow-hidden flex flex-col relative min-h-[280px]">
                {isLoading && (
                    <div className="w-full h-1 bg-gray-100 overflow-hidden absolute top-0 left-0 z-10">
                        <div className="h-full bg-primary animate-pulse w-1/3" />
                    </div>
                )}

                {!isLoading && orders.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 space-y-3 p-12">
                        <Package size={48} className="opacity-20" />
                        <p className="text-sm font-semibold">No offline orders found</p>
                        <p className="text-xs text-gray-400 text-center">
                            Create an order against an{' '}
                            <Link to="/admin/offline-customers" className="text-primary font-bold hover:underline">
                                offline customer
                            </Link>
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left whitespace-nowrap">
                            <thead>
                                <tr className="bg-gray-50/50 text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em] border-b border-gray-100">
                                    <th className="px-6 py-4">Order</th>
                                    <th className="px-6 py-4">Customer</th>
                                    <th className="px-6 py-4">Garment</th>
                                    <th className="px-6 py-4">Package</th>
                                    <th className="px-6 py-4">Amount</th>
                                    <th className="px-6 py-4">Payment</th>
                                    <th className="px-6 py-4">Handoff</th>
                                    <th className="px-6 py-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {orders.map((order) => (
                                    <tr
                                        key={order._id}
                                        onClick={() => openDetail(order)}
                                        className="hover:bg-primary/5 transition-colors cursor-pointer group"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-gray-900 group-hover:text-primary">
                                                    {order.orderId}
                                                </span>
                                                <span className="text-[10px] text-gray-400 font-medium">
                                                    {order.priority === 'urgent' ? '⚡ Urgent · ' : ''}
                                                    {order.createdAt
                                                        ? new Date(order.createdAt).toLocaleDateString()
                                                        : ''}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-gray-800">
                                                    {order.offlineCustomer?.name || '—'}
                                                </span>
                                                <span className="text-[10px] text-gray-500">
                                                    {order.offlineCustomer?.phone || ''}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-xs font-bold text-gray-700">{formatGarmentLabel(order.garmentType)}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-[10px] font-black uppercase tracking-wider text-primary">
                                                {formatPackageLabel(order.stitchingPackage)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-black text-primary">
                                                ₹{(order.totalAmount || 0).toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-lg text-[9px] font-black border uppercase tracking-wider ${paymentStyle(order.paymentStatus)}`}>
                                                {order.paymentStatus}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-600">
                                                {order.fulfillmentMethod === 'home_delivery' ? (
                                                    <><Truck size={12} className="text-indigo-600" /> Delivery</>
                                                ) : (
                                                    <><Package size={12} className="text-primary" /> Pickup</>
                                                )}
                                            </span>
                                            {order.fulfillmentStatus === 'out_for_delivery' && (
                                                <p className="text-[9px] text-indigo-600 font-bold mt-0.5">Out for delivery</p>
                                            )}
                                            {order.fulfillmentStatus === 'awaiting_pickup' && (
                                                <p className="text-[9px] text-amber-600 font-bold mt-0.5">Awaiting pickup</p>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-lg text-[9px] font-black border uppercase tracking-wider ${offlineStatusStyle(order.status)}`}>
                                                {getOfflineStatusLabel(order.status)}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Detail drawer */}
            <AnimatePresence>
                {selectedOrder && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
                            onClick={() => setSelectedOrder(null)}
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed top-0 right-0 h-full w-full sm:w-[450px] bg-white shadow-2xl z-50 flex flex-col border-l border-gray-100"
                        >
                            <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-gray-50">
                                <div className="min-w-0">
                                    <p className="text-[10px] font-bold text-primary uppercase tracking-wider">
                                        Offline Order {selectedOrder.priority === 'urgent' ? '· Urgent' : ''}
                                    </p>
                                    <h2 className="text-xl font-black tracking-tight text-gray-900 mt-1">
                                        {selectedOrder.orderId}
                                    </h2>
                                    <p className="text-xs text-gray-500 font-medium mt-1 truncate">
                                        {formatGarmentLabel(selectedOrder.garmentType)}
                                        {selectedOrder.stitchingPackage
                                            ? ` · ${formatPackageLabel(selectedOrder.stitchingPackage)}`
                                            : ''}
                                    </p>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        <span className={`px-2 py-0.5 rounded text-[9px] uppercase tracking-wider font-bold border ${offlineStatusStyle(selectedOrder.status)}`}>
                                            {getOfflineStatusLabel(selectedOrder.status)}
                                        </span>
                                        <span className={`px-2 py-0.5 rounded text-[9px] uppercase tracking-wider font-bold border ${paymentStyle(selectedOrder.paymentStatus)}`}>
                                            {selectedOrder.paymentStatus}
                                        </span>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedOrder(null)}
                                    className="p-2 text-gray-400 hover:text-gray-900 bg-white border border-gray-200 rounded-full shadow-sm shrink-0"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="bg-white border border-gray-100 p-4 rounded-2xl text-center">
                                        <IndianRupee size={18} className="mx-auto text-primary mb-1" />
                                        <p className="text-xl font-black text-gray-900">
                                            ₹{(selectedOrder.totalAmount || 0).toLocaleString()}
                                        </p>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                                            Total
                                        </p>
                                    </div>
                                    <div className="bg-white border border-gray-100 p-4 rounded-2xl text-center">
                                        <CheckCircle2 size={18} className="mx-auto text-primary mb-1" />
                                        <p className="text-xl font-black text-gray-900">
                                            ₹{(selectedOrder.advancePaid || 0).toLocaleString()}
                                        </p>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                                            Received
                                        </p>
                                    </div>
                                </div>

                                <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl text-xs font-bold text-amber-800">
                                    Balance due: ₹
                                    {Math.max(
                                        0,
                                        (selectedOrder.totalAmount || 0) - (selectedOrder.advancePaid || 0)
                                    ).toLocaleString()}
                                </div>

                                <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-2 text-xs">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Stitching</span>
                                        <span className="font-bold">₹{(selectedOrder.stitchingCharges || 0).toLocaleString()}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Add-ons</span>
                                        <span className="font-bold">₹{(selectedOrder.addOnsTotal || 0).toLocaleString()}</span>
                                    </div>
                                    {(selectedOrder.deliveryFee || 0) > 0 && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Delivery fee</span>
                                            <span className="font-bold">₹{selectedOrder.deliveryFee.toLocaleString()}</span>
                                        </div>
                                    )}
                                    {(selectedOrder.discountAmount || 0) > 0 && (
                                        <div className="flex justify-between text-green-700">
                                            <span>Discount</span>
                                            <span className="font-bold">-₹{selectedOrder.discountAmount.toLocaleString()}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Fabric</span>
                                        <span className="font-bold capitalize">{selectedOrder.fabricSource || 'customer'}</span>
                                    </div>
                                    {selectedOrder.shopTailor?.name && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-500">Tailor</span>
                                            <span className="font-bold">{selectedOrder.shopTailor.name}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between items-start gap-2">
                                        <span className="text-gray-500">Handoff</span>
                                        <span className="font-bold text-right">
                                            {selectedOrder.fulfillmentMethod === 'home_delivery'
                                                ? 'Home delivery'
                                                : 'Customer pickup'}
                                            {selectedOrder.deliveryAddress && (
                                                <span className="block text-[10px] font-medium text-gray-500 mt-0.5">
                                                    {selectedOrder.deliveryAddress}
                                                </span>
                                            )}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                                        <User size={12} /> Customer
                                    </h3>
                                    <div className="bg-white p-4 rounded-2xl border border-gray-100 space-y-2">
                                        <p className="text-sm font-bold text-gray-900">
                                            {selectedOrder.offlineCustomer?.name}
                                        </p>
                                        <div className="flex items-center gap-2 text-xs text-gray-600">
                                            <Phone size={14} className="text-primary" />
                                            {selectedOrder.offlineCustomer?.phone}
                                        </div>
                                    </div>
                                </div>

                                {Object.keys(measurementsMap).length > 0 && (
                                    <div className="space-y-3">
                                        <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                                            <Ruler size={12} /> Measurements ({selectedOrder.measurementUnit || 'inches'})
                                        </h3>
                                        <div className="grid grid-cols-2 gap-2">
                                            {Object.entries(measurementsMap).map(([key, val]) => (
                                                <div key={key} className="bg-gray-50 border border-gray-100 rounded-xl px-3 py-2">
                                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{key}</p>
                                                    <p className="text-sm font-black text-gray-900">{val}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {(selectedOrder.measurementPhotos || []).length > 0 && (
                                    <div className="flex flex-wrap gap-2">
                                        {selectedOrder.measurementPhotos.map((url) => (
                                            <a key={url} href={url} target="_blank" rel="noreferrer" className="block h-16 w-16 rounded-xl overflow-hidden border border-gray-100">
                                                <img src={url} alt="Measurement" className="h-full w-full object-cover" />
                                            </a>
                                        ))}
                                    </div>
                                )}

                                {selectedOrder.notes && (
                                    <div className="space-y-2">
                                        <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                                            <StickyNote size={12} /> Notes
                                        </h3>
                                        <p className="text-xs font-medium text-gray-700 bg-gray-50 border border-gray-100 rounded-xl p-3">
                                            {selectedOrder.notes}
                                        </p>
                                    </div>
                                )}

                                <div className="space-y-3">
                                    <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest flex items-center gap-2">
                                        <Clock size={12} /> Production pipeline
                                    </h3>
                                    <OfflineProductionPipeline
                                        currentStatus={selectedOrder.status}
                                        onSelectStatus={handleStatusUpdate}
                                        disabled={isUpdatingStatus}
                                    />
                                </div>

                                {(selectedOrder.history || []).length > 0 && (
                                    <div className="space-y-2">
                                        <h3 className="text-[10px] font-black uppercase text-gray-400 tracking-widest">
                                            Activity log
                                        </h3>
                                        <div className="space-y-2 max-h-40 overflow-y-auto">
                                            {[...(selectedOrder.history || [])].reverse().slice(0, 8).map((h, i) => (
                                                <div key={i} className="text-[10px] border-l-2 border-primary/20 pl-2 py-0.5">
                                                    <span className="font-bold text-gray-800">
                                                        {getOfflineStatusLabel(h.status)}
                                                    </span>
                                                    {h.message && (
                                                        <span className="text-gray-500"> — {h.message}</span>
                                                    )}
                                                    {h.timestamp && (
                                                        <p className="text-gray-400">
                                                            {new Date(h.timestamp).toLocaleString()}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 border-t border-gray-100 bg-white space-y-2">
                                {selectedOrder.status === 'ready' &&
                                    selectedOrder.fulfillmentMethod === 'home_delivery' &&
                                    selectedOrder.fulfillmentStatus !== 'out_for_delivery' && (
                                        <button
                                            type="button"
                                            onClick={handleOutForDelivery}
                                            disabled={isUpdatingStatus}
                                            className="w-full py-3 border border-indigo-200 text-indigo-700 text-xs font-black rounded-xl hover:bg-indigo-50 transition-all uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-60"
                                        >
                                            <Truck size={14} /> Out for Delivery
                                        </button>
                                    )}
                                {selectedOrder.status === 'ready' && (
                                    <button
                                        type="button"
                                        onClick={() => openCompleteModal(selectedOrder)}
                                        disabled={isUpdatingStatus}
                                        className="w-full py-3 bg-green-600 text-white text-xs font-black rounded-xl hover:bg-green-700 shadow-lg shadow-green-600/20 transition-all uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-60"
                                    >
                                        <CheckCircle2 size={14} />
                                        {selectedOrder.fulfillmentMethod === 'home_delivery'
                                            ? 'Complete Delivery'
                                            : 'Mark Picked Up'}
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => openReceiptForOrder(selectedOrder)}
                                    className="w-full py-3 border border-primary/30 text-primary text-xs font-black rounded-xl hover:bg-primary/5 transition-all uppercase tracking-widest flex items-center justify-center gap-2"
                                >
                                    <Receipt size={14} /> View / Print Receipt
                                </button>
                                <button
                                    onClick={handlePaymentUpdate}
                                    disabled={isUpdatingStatus}
                                    className="w-full py-3 bg-primary text-white text-xs font-black rounded-xl hover:bg-primary-dark shadow-lg shadow-primary/20 transition-all uppercase tracking-widest disabled:opacity-60"
                                >
                                    Update Payment Received
                                </button>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Create modal — Phase 2 full form */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
                        onClick={() => setIsModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
                        >
                            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
                                <h2 className="text-lg font-black tracking-tight text-gray-900">
                                    New Offline Order
                                </h2>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="p-2 bg-white border border-gray-200 text-gray-400 hover:text-gray-900 rounded-full shadow-sm"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleCreate} className="p-5 flex-1 overflow-y-auto space-y-5">
                                {/* Customer */}
                                <div>
                                    <label className="block text-[10px] font-semibold uppercase text-gray-500 tracking-wider mb-1.5">
                                        Offline Customer *
                                    </label>
                                    {prefillCustomerLabel && formData.offlineCustomer ? (
                                        <div className="flex items-center justify-between gap-2 px-4 py-3 bg-primary/5 border border-primary/20 rounded-xl">
                                            <span className="text-sm font-bold text-gray-900 truncate">
                                                {prefillCustomerLabel}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setFormData({ ...formData, offlineCustomer: '' });
                                                    setPrefillCustomerLabel('');
                                                    setSelectedCustomerDetail(null);
                                                }}
                                                className="text-[10px] font-bold text-primary uppercase shrink-0"
                                            >
                                                Change
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <input
                                                type="text"
                                                value={customerSearch}
                                                onChange={(e) => setCustomerSearch(e.target.value)}
                                                placeholder="Search customer by name or phone..."
                                                className="w-full px-4 py-3 mb-2 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-primary"
                                            />
                                            <div className="max-h-36 overflow-y-auto border border-gray-100 rounded-xl divide-y divide-gray-50">
                                                {isLoadingCustomers ? (
                                                    <p className="p-3 text-xs text-gray-400 text-center">Loading...</p>
                                                ) : customerOptions.length === 0 ? (
                                                    <p className="p-3 text-xs text-gray-400 text-center">
                                                        No customers —{' '}
                                                        <Link to="/admin/offline-customers" className="text-primary font-bold">
                                                            add one
                                                        </Link>
                                                    </p>
                                                ) : (
                                                    customerOptions.map((c) => (
                                                        <button
                                                            key={c._id}
                                                            type="button"
                                                            onClick={() => selectCustomer(c)}
                                                            className={`w-full text-left px-4 py-2.5 text-sm hover:bg-primary/5 transition-colors ${
                                                                formData.offlineCustomer === c._id
                                                                    ? 'bg-primary/10 font-bold'
                                                                    : 'font-medium text-gray-700'
                                                            }`}
                                                        >
                                                            {c.name}
                                                            <span className="text-[10px] text-gray-400 ml-2">{c.phone}</span>
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Garment + fabric */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-semibold uppercase text-gray-500 tracking-wider mb-1.5">
                                            Garment / Service Type *
                                        </label>
                                        <div className="space-y-2">
                                            <div className="relative flex items-center">
                                                <input
                                                    type="text"
                                                    list="garment-options-list-modal"
                                                    value={formData.garmentType}
                                                    onChange={(e) => setFormData({ ...formData, garmentType: e.target.value })}
                                                    placeholder="Type or pick garment / service (e.g. Shirt, Suit)..."
                                                    className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-primary pr-28"
                                                    required
                                                />
                                                <select
                                                    value={allGarmentTypes.includes(formData.garmentType) ? formData.garmentType : ''}
                                                    onChange={(e) => {
                                                        if (e.target.value) {
                                                            setFormData({ ...formData, garmentType: e.target.value });
                                                        }
                                                    }}
                                                    className="absolute right-2 px-2 py-1.5 text-xs font-bold bg-gray-100 border border-gray-200 rounded-lg text-gray-700 outline-none cursor-pointer hover:bg-gray-200 transition-colors max-w-[105px]"
                                                >
                                                    <option value="">Category</option>
                                                    {allGarmentTypes.map((g) => (
                                                        <option key={g} value={g}>{g}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <datalist id="garment-options-list-modal">
                                                {allGarmentTypes.map((g) => (
                                                    <option key={g} value={g} />
                                                ))}
                                            </datalist>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-semibold uppercase text-gray-500 tracking-wider mb-1.5">
                                            Fabric Source
                                        </label>
                                        <div className="flex gap-2">
                                            {[
                                                { id: 'customer', label: 'Customer Fabric' },
                                                { id: 'sewzella', label: 'Sewzella Fabric' },
                                            ].map((opt) => (
                                                <button
                                                    key={opt.id}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, fabricSource: opt.id })}
                                                    className={`flex-1 py-3 px-2 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${
                                                        formData.fabricSource === opt.id
                                                            ? 'bg-primary text-white border-primary'
                                                            : 'bg-white text-gray-500 border-gray-200'
                                                    }`}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Package */}
                                <div>
                                    <label className="block text-[10px] font-semibold uppercase text-gray-500 tracking-wider mb-1.5">
                                        Stitching Package
                                    </label>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                        {packages.map((pkg) => (
                                            <button
                                                key={pkg.id}
                                                type="button"
                                                onClick={() => selectPackage(pkg.id)}
                                                className={`text-left p-3 rounded-2xl border transition-all ${
                                                    formData.stitchingPackage === pkg.id
                                                        ? 'border-primary bg-primary/5'
                                                        : 'border-gray-100 bg-white'
                                                }`}
                                            >
                                                <p className="text-xs font-black text-gray-900">{pkg.name}</p>
                                                <p className="text-[10px] text-gray-400 mt-0.5 line-clamp-2">{pkg.description}</p>
                                                <p className="text-sm font-black text-primary mt-2">
                                                    ₹{pkg.defaultPrice.toLocaleString()}
                                                </p>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Measurements */}
                                <div className="border border-gray-100 rounded-2xl overflow-hidden">
                                    <button
                                        type="button"
                                        onClick={() => setShowMeasurements((v) => !v)}
                                        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 text-xs font-bold text-gray-700"
                                    >
                                        <span className="flex items-center gap-2">
                                            <Ruler size={14} className="text-primary" />
                                            Measurements
                                        </span>
                                        {showMeasurements ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </button>
                                    {showMeasurements && (
                                        <div className="p-4 space-y-3">
                                            {(selectedCustomerDetail?.savedMeasurements || []).length > 0 && (
                                                <div>
                                                    <label className="block text-[10px] font-semibold uppercase text-gray-500 tracking-wider mb-1.5">
                                                        Use saved measurement
                                                    </label>
                                                    <select
                                                        value={formData.selectedSavedMeasurementIdx}
                                                        onChange={(e) => {
                                                            if (e.target.value === '') return;
                                                            applySavedMeasurement(Number(e.target.value));
                                                        }}
                                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-primary"
                                                    >
                                                        <option value="">Enter new measurements</option>
                                                        {selectedCustomerDetail.savedMeasurements.map((p, idx) => (
                                                            <option key={idx} value={idx}>
                                                                {p.label || p.garmentType} ({p.unit || 'inches'})
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            )}
                                            <div className="flex gap-2">
                                                {['inches', 'cm'].map((u) => (
                                                    <button
                                                        key={u}
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, measurementUnit: u })}
                                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border ${
                                                            formData.measurementUnit === u
                                                                ? 'bg-primary text-white border-primary'
                                                                : 'bg-white text-gray-500 border-gray-200'
                                                        }`}
                                                    >
                                                        {u}
                                                    </button>
                                                ))}
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                {MEASUREMENT_FIELDS.map((field) => (
                                                    <div key={field.key}>
                                                        <label className="block text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">
                                                            {field.label}
                                                        </label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            step="0.1"
                                                            value={formData.measurements[field.key]}
                                                            onChange={(e) =>
                                                                setFormData({
                                                                    ...formData,
                                                                    measurements: {
                                                                        ...formData.measurements,
                                                                        [field.key]: e.target.value,
                                                                    },
                                                                })
                                                            }
                                                            placeholder="0.0"
                                                            className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-primary"
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-semibold uppercase text-gray-500 tracking-wider mb-1.5">
                                                    Measurement Photos (optional)
                                                </label>
                                                <label className="flex items-center justify-center gap-2 px-4 py-3 border border-dashed border-gray-200 rounded-xl text-xs font-bold text-gray-500 cursor-pointer hover:border-primary hover:text-primary">
                                                    <Upload size={14} />
                                                    {uploadingPhoto ? 'Uploading...' : 'Upload photo'}
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        disabled={uploadingPhoto}
                                                        onChange={(e) => uploadMeasurementPhoto(e.target.files?.[0])}
                                                    />
                                                </label>
                                                {formData.measurementPhotos.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 mt-2">
                                                        {formData.measurementPhotos.map((url) => (
                                                            <div key={url} className="relative h-14 w-14 rounded-lg overflow-hidden border border-gray-100">
                                                                <img src={url} alt="" className="h-full w-full object-cover" />
                                                                <button
                                                                    type="button"
                                                                    onClick={() =>
                                                                        setFormData((prev) => ({
                                                                            ...prev,
                                                                            measurementPhotos: prev.measurementPhotos.filter((u) => u !== url),
                                                                        }))
                                                                    }
                                                                    className="absolute top-0.5 right-0.5 bg-black/50 text-white rounded-full p-0.5"
                                                                >
                                                                    <X size={10} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Customizations */}
                                <div className="border border-gray-100 rounded-2xl overflow-hidden">
                                    <button
                                        type="button"
                                        onClick={() => setShowCustomizations((v) => !v)}
                                        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 text-xs font-bold text-gray-700"
                                    >
                                        <span className="flex items-center gap-2">
                                            <Scissors size={14} className="text-primary" />
                                            Customizations
                                        </span>
                                        {showCustomizations ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </button>
                                    {showCustomizations && (
                                        <div className="p-4 space-y-4">
                                            {CUSTOMIZATION_SLOTS.map((slot) => {
                                                const options = addonsForSlot(slot);
                                                const current = formData.customizations[slot.key];
                                                if (slot.checkboxOnly) {
                                                    return (
                                                        <label key={slot.key} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-gray-100">
                                                            <span className="text-xs font-bold text-gray-800">{slot.label}</span>
                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    type="number"
                                                                    min="0"
                                                                    placeholder="Price"
                                                                    value={current.price || ''}
                                                                    onChange={(e) =>
                                                                        setCustomization(slot.key, {
                                                                            enabled: true,
                                                                            name: slot.label,
                                                                            price: Number(e.target.value) || 0,
                                                                        })
                                                                    }
                                                                    className="w-24 px-2 py-1.5 border border-gray-200 rounded-lg text-xs outline-none focus:border-primary"
                                                                />
                                                                <input
                                                                    type="checkbox"
                                                                    checked={!!current.enabled}
                                                                    onChange={(e) =>
                                                                        setCustomization(slot.key, {
                                                                            enabled: e.target.checked,
                                                                            name: slot.label,
                                                                        })
                                                                    }
                                                                    className="h-4 w-4 accent-primary"
                                                                />
                                                            </div>
                                                        </label>
                                                    );
                                                }
                                                return (
                                                    <div key={slot.key}>
                                                        <label className="block text-[10px] font-semibold uppercase text-gray-500 tracking-wider mb-1.5">
                                                            {slot.label}
                                                        </label>
                                                        {options.length > 0 ? (
                                                            <select
                                                                value={current.name || ''}
                                                                onChange={(e) => {
                                                                    const opt = options.find((o) => o.name === e.target.value);
                                                                    setCustomization(slot.key, {
                                                                        name: opt?.name || '',
                                                                        price: opt?.price || 0,
                                                                        refImage: opt?.image || '',
                                                                        addon: opt?._id,
                                                                        enabled: !!opt,
                                                                    });
                                                                }}
                                                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-primary"
                                                            >
                                                                <option value="">None</option>
                                                                {options.map((o) => (
                                                                    <option key={o._id} value={o.name}>
                                                                        {o.name} — ₹{o.price}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        ) : (
                                                            <input
                                                                type="text"
                                                                value={current.name || ''}
                                                                onChange={(e) =>
                                                                    setCustomization(slot.key, {
                                                                        name: e.target.value,
                                                                        enabled: !!e.target.value,
                                                                    })
                                                                }
                                                                placeholder={`${slot.label} (manual)`}
                                                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-primary"
                                                            />
                                                        )}
                                                    </div>
                                                );
                                            })}

                                            {extraAddons.length > 0 && (
                                                <div>
                                                    <label className="block text-[10px] font-semibold uppercase text-gray-500 tracking-wider mb-1.5">
                                                        Extra Style Add-ons
                                                    </label>
                                                    <div className="flex flex-wrap gap-2">
                                                        {extraAddons.slice(0, 12).map((addon) => {
                                                            const selected = formData.styleAddons.some((a) => a.addon === addon._id);
                                                            return (
                                                                <button
                                                                    key={addon._id}
                                                                    type="button"
                                                                    onClick={() => toggleStyleAddon(addon)}
                                                                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold border transition-all ${
                                                                        selected
                                                                            ? 'bg-primary text-white border-primary'
                                                                            : 'bg-white text-gray-600 border-gray-200'
                                                                    }`}
                                                                >
                                                                    {addon.name} · ₹{addon.price}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Pricing */}
                                <div className="bg-primary-soft/40 border border-primary/10 rounded-2xl p-4 space-y-3">
                                    <h3 className="text-[10px] font-black uppercase text-gray-500 tracking-widest flex items-center gap-2">
                                        <IndianRupee size={12} /> Pricing
                                    </h3>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">
                                                Stitching Charges
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={formData.stitchingCharges}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, stitchingCharges: e.target.value })
                                                }
                                                className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-primary"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">
                                                Add-ons Total
                                            </label>
                                            <div className="px-3 py-2.5 bg-gray-50 border border-gray-100 rounded-xl text-sm font-black text-gray-800">
                                                ₹{addOnsTotal.toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                    {formData.fulfillmentMethod === 'home_delivery' && (
                                        <div className="flex justify-between items-center text-xs bg-indigo-50 border border-indigo-100 rounded-xl px-3 py-2">
                                            <span className="font-bold text-indigo-700">Delivery fee</span>
                                            <span className="font-black text-indigo-900">
                                                ₹{(Number(formData.deliveryFee) || 0).toLocaleString()}
                                            </span>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-[100px_1fr] gap-3">
                                        <select
                                            value={formData.discountType}
                                            onChange={(e) =>
                                                setFormData({ ...formData, discountType: e.target.value })
                                            }
                                            className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-primary"
                                        >
                                            <option value="amount">₹ Off</option>
                                            <option value="percent">% Off</option>
                                        </select>
                                        <input
                                            type="number"
                                            min="0"
                                            value={formData.discountValue}
                                            onChange={(e) =>
                                                setFormData({ ...formData, discountValue: e.target.value })
                                            }
                                            placeholder="Discount"
                                            className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-primary"
                                        />
                                    </div>
                                    <div className="flex justify-between items-center pt-1">
                                        <span className="text-xs font-bold text-gray-500">
                                            Discount applied: ₹{discountAmount.toLocaleString()}
                                        </span>
                                        <span className="text-lg font-black text-primary">
                                            Total ₹{computedTotal.toLocaleString()}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">
                                                Advance Received
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={formData.advancePaid}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, advancePaid: e.target.value })
                                                }
                                                placeholder="0"
                                                className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-primary"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">
                                                Balance Due
                                            </label>
                                            <div className="px-3 py-2.5 bg-amber-50 border border-amber-100 rounded-xl text-sm font-black text-amber-700">
                                                ₹{balanceDue.toLocaleString()}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Fulfillment */}
                                <div className="space-y-3">
                                    <label className="block text-[10px] font-semibold uppercase text-gray-500 tracking-wider">
                                        Handoff
                                    </label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { id: 'pickup', label: 'Customer Pickup', icon: Package },
                                            { id: 'home_delivery', label: 'Home Delivery', icon: Truck },
                                        ].map((opt) => (
                                            <button
                                                key={opt.id}
                                                type="button"
                                                onClick={() => {
                                                    const next = {
                                                        ...formData,
                                                        fulfillmentMethod: opt.id,
                                                    };
                                                    if (
                                                        opt.id === 'home_delivery' &&
                                                        !formData.deliveryAddress &&
                                                        selectedCustomerDetail?.address
                                                    ) {
                                                        next.deliveryAddress = selectedCustomerDetail.address;
                                                    }
                                                    if (opt.id === 'pickup') {
                                                        next.deliveryFee = '';
                                                    }
                                                    setFormData(next);
                                                }}
                                                className={`py-3 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all flex items-center justify-center gap-2 ${
                                                    formData.fulfillmentMethod === opt.id
                                                        ? 'bg-primary text-white border-primary'
                                                        : 'bg-white text-gray-500 border-gray-200'
                                                }`}
                                            >
                                                <opt.icon size={14} /> {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                    {formData.fulfillmentMethod === 'home_delivery' && (
                                        <div className="space-y-3 bg-indigo-50/50 border border-indigo-100 rounded-2xl p-4">
                                            <div>
                                                <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1 flex items-center gap-1">
                                                    <MapPin size={10} /> Delivery address
                                                </label>
                                                <textarea
                                                    rows={2}
                                                    required
                                                    value={formData.deliveryAddress}
                                                    onChange={(e) =>
                                                        setFormData({ ...formData, deliveryAddress: e.target.value })
                                                    }
                                                    placeholder="House / street / locality"
                                                    className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-primary resize-none"
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">
                                                        Delivery fee (₹)
                                                    </label>
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        value={formData.deliveryFee}
                                                        onChange={(e) =>
                                                            setFormData({ ...formData, deliveryFee: e.target.value })
                                                        }
                                                        placeholder="0"
                                                        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-primary"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[9px] font-bold text-gray-400 uppercase mb-1">
                                                        Delivery notes
                                                    </label>
                                                    <input
                                                        type="text"
                                                        value={formData.deliveryNotes}
                                                        onChange={(e) =>
                                                            setFormData({ ...formData, deliveryNotes: e.target.value })
                                                        }
                                                        placeholder="Landmark, timing..."
                                                        className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-primary"
                                                    />
                                                </div>
                                            </div>
                                            <p className="text-[9px] text-indigo-700/80 font-medium">
                                                {/* TODO: Partner broadcast bridge later — shop staff completes handoff for now */}
                                                Home delivery is completed by shop staff (not marketplace delivery partners yet).
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Tailor + priority */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-semibold uppercase text-gray-500 tracking-wider mb-1.5">
                                            Assign Tailor
                                        </label>
                                        <select
                                            value={formData.shopTailor}
                                            onChange={(e) =>
                                                setFormData({ ...formData, shopTailor: e.target.value })
                                            }
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-primary"
                                        >
                                            <option value="">Unassigned</option>
                                            {tailors.map((t) => (
                                                <option key={t._id} value={t._id}>
                                                    {t.name} {t.phoneNumber ? `· ${t.phoneNumber}` : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-semibold uppercase text-gray-500 tracking-wider mb-1.5">
                                            Priority
                                        </label>
                                        <div className="flex gap-2">
                                            {[
                                                { id: 'normal', label: 'Normal' },
                                                { id: 'urgent', label: 'Urgent', icon: AlertTriangle },
                                            ].map((opt) => (
                                                <button
                                                    key={opt.id}
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, priority: opt.id })}
                                                    className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all ${
                                                        formData.priority === opt.id
                                                            ? opt.id === 'urgent'
                                                                ? 'bg-amber-500 text-white border-amber-500'
                                                                : 'bg-primary text-white border-primary'
                                                            : 'bg-white text-gray-500 border-gray-200'
                                                    }`}
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-semibold uppercase text-gray-500 tracking-wider mb-1.5">
                                        Tailoring Notes
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={formData.notes}
                                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                        placeholder="Fabric, design notes, due date..."
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-primary resize-none"
                                    />
                                </div>

                                <div className="pt-1 flex gap-3 sticky bottom-0 bg-white pb-1">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 py-3 border border-gray-200 text-gray-600 text-xs font-black rounded-xl hover:bg-gray-50 uppercase tracking-widest"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSaving}
                                        className="flex-1 py-3 bg-primary text-white text-xs font-black rounded-xl hover:bg-primary-dark shadow-lg shadow-primary/20 uppercase tracking-widest disabled:opacity-60"
                                    >
                                        {isSaving ? 'Creating...' : 'Create Order'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <OfflineOrderReceiptModal order={receiptOrder} onClose={() => setReceiptOrder(null)} />

            <AnimatePresence>
                {completeOrder && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[80] flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 16 }}
                            className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
                        >
                            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                                <div>
                                    <h2 className="text-lg font-black text-gray-900">
                                        {completeOrder.fulfillmentMethod === 'home_delivery'
                                            ? 'Complete delivery'
                                            : 'Complete pickup'}
                                    </h2>
                                    <p className="text-xs text-gray-500">{completeOrder.orderId}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setCompleteOrder(null)}
                                    className="p-2 rounded-full border border-gray-200 text-gray-400"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                            <form onSubmit={handleCompleteOrder} className="p-5 space-y-4">
                                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3 text-center">
                                    <p className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">
                                        Balance due
                                    </p>
                                    <p className="text-xl font-black text-amber-800">
                                        ₹
                                        {Math.max(
                                            0,
                                            (completeOrder.totalAmount || 0) - (completeOrder.advancePaid || 0)
                                        ).toLocaleString()}
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-semibold uppercase text-gray-500 tracking-wider mb-1.5">
                                        Amount collected now (₹)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={completeForm.amountReceived}
                                        onChange={(e) =>
                                            setCompleteForm({ ...completeForm, amountReceived: e.target.value })
                                        }
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-primary"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-semibold uppercase text-gray-500 tracking-wider mb-1.5 flex items-center gap-1">
                                        <Star size={12} /> Customer rating (optional)
                                    </label>
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map((n) => (
                                            <button
                                                key={n}
                                                type="button"
                                                onClick={() =>
                                                    setCompleteForm({
                                                        ...completeForm,
                                                        customerRating: String(n),
                                                    })
                                                }
                                                className={`flex-1 py-2 rounded-xl text-xs font-black border ${
                                                    Number(completeForm.customerRating) === n
                                                        ? 'bg-amber-400 text-white border-amber-400'
                                                        : 'bg-white text-gray-500 border-gray-200'
                                                }`}
                                            >
                                                {n}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-semibold uppercase text-gray-500 tracking-wider mb-1.5">
                                        Review note
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={completeForm.customerReview}
                                        onChange={(e) =>
                                            setCompleteForm({ ...completeForm, customerReview: e.target.value })
                                        }
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium outline-none focus:border-primary resize-none"
                                        placeholder="Optional feedback"
                                    />
                                </div>
                                <label className="flex items-center gap-2 text-xs font-bold text-gray-700">
                                    <input
                                        type="checkbox"
                                        checked={completeForm.saveMeasurements}
                                        onChange={(e) =>
                                            setCompleteForm({
                                                ...completeForm,
                                                saveMeasurements: e.target.checked,
                                            })
                                        }
                                        className="rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    Save measurements to customer profile
                                </label>
                                <button
                                    type="submit"
                                    disabled={isCompleting}
                                    className="w-full py-3 bg-green-600 text-white text-xs font-black rounded-xl hover:bg-green-700 uppercase tracking-widest disabled:opacity-60"
                                >
                                    {isCompleting ? 'Saving...' : 'Confirm completion'}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminOfflineOrders;
