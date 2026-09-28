import React, { useState, useEffect } from 'react';
import { 
    Plus, 
    Trash2, 
    Edit3, 
    Search, 
    Scissors, 
    Layers, 
    ShoppingBag, 
    Package, 
    ChevronRight, 
    X, 
    Clock, 
    Star, 
    Camera,
    CheckCircle2,
    PauseCircle,
    PlayCircle,
    ShieldCheck,
    Check,
    AlertCircle,
    RotateCcw
} from 'lucide-react';
import { Button } from '../components/UIElements';
import api from '../services/api';
import toast from 'react-hot-toast';
import SafeImage from '../../../components/Common/SafeImage';
import GarmentForm from '../components/GarmentForm';
import { compressImage } from '../../../utils/imageCompression';

const Products = () => {
    const [activeTab, setActiveTab] = useState('samples'); // 'samples' | 'fabrics' | 'garments'
    const [samples, setSamples] = useState([]);
    const [fabrics, setFabrics] = useState([]);
    const [garments, setGarments] = useState([]);
    const [categories, setCategories] = useState([]); // All categories from backend
    const [subcategories, setSubcategories] = useState([]); // Subcategories for fabrics
    const [selectedParent, setSelectedParent] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    // Modal state for Fabrics (and legacy products)
    const [showModal, setShowModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isImageUploading, setIsImageUploading] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [newItem, setNewItem] = useState({
        title: '',
        name: '',
        description: '',
        image: '',
        basePrice: '',
        price: '',
        deliveryTime: '2-4 DAYS',
        stock: '',
        category: '',
        serviceType: 'STITCHING',
        selectedStyles: [],
        tags: '',
        sizes: '',
        colors: ''
    });

    // ── STITCHING SERVICES SPECIFIC STATE ──
    // Tailors select from Admin-created categories. Photo & Title are official Admin data.
    const [serviceFilter, setServiceFilter] = useState('all'); // 'all' | 'offered' | 'available'
    const [serviceModalOpen, setServiceModalOpen] = useState(false);
    const [selectedAdminCategory, setSelectedAdminCategory] = useState(null);
    const [editServiceId, setEditServiceId] = useState(null);
    const [serviceForm, setServiceForm] = useState({
        basePrice: '',
        deliveryTime: '3-5 DAYS',
        selectedStyles: []
    });

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [servicesRes, productsRes, catsRes] = await Promise.all([
                api.get('/tailors/services'),
                api.get('/tailors/products'),
                api.get('/products/categories')
            ]);

            const sRaw = servicesRes.data.data || (Array.isArray(servicesRes.data) ? servicesRes.data : []);
            setSamples(sRaw);

            const pRaw = productsRes.data.data || (Array.isArray(productsRes.data) ? productsRes.data : []);
            setFabrics(pRaw.filter(p => p.productType === 'fabric' || !p.productType));
            setGarments(pRaw.filter(p => p.productType === 'store_item'));

            if (catsRes.data.success) {
                setCategories(catsRes.data.data || []);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load services and products.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        if (showModal || serviceModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [showModal, serviceModalOpen]);

    // Fetch subcategories for Fabric selection
    useEffect(() => {
        const fetchSubcats = async () => {
            if (!selectedParent || activeTab !== 'fabrics') {
                setSubcategories([]);
                return;
            }
            try {
                const res = await api.get('/products/categories', {
                    params: { parent: selectedParent, type: 'fabric' }
                });
                if (res.data.success) {
                    setSubcategories(res.data.data || []);
                }
            } catch (err) {
                console.error('Error fetching subcategories:', err);
            }
        };
        fetchSubcats();
    }, [selectedParent, activeTab]);

    // ── STITCHING SERVICES HANDLERS ──
    const handleOpenServiceModal = (adminCat, existingService = null) => {
        setSelectedAdminCategory(adminCat);
        setEditServiceId(existingService?._id || null);

        // Pre-fill styles: if existing service has selectedStyles, use them; otherwise select all admin styles by default
        let initialStyles = [];
        if (existingService?.selectedStyles && existingService.selectedStyles.length > 0) {
            initialStyles = existingService.selectedStyles;
        } else if (adminCat.styles && adminCat.styles.length > 0) {
            initialStyles = adminCat.styles.map(s => ({
                name: s.name,
                image: s.image,
                description: s.description
            }));
        }

        setServiceForm({
            basePrice: existingService?.basePrice != null 
                ? String(existingService.basePrice) 
                : (adminCat.basePrice != null ? String(adminCat.basePrice) : (adminCat.minPrice != null ? String(adminCat.minPrice) : '')),
            deliveryTime: existingService?.deliveryTime || adminCat.deliveryTime || '3-5 DAYS',
            selectedStyles: initialStyles
        });
        setServiceModalOpen(true);
    };

    const handleCloseServiceModal = () => {
        setServiceModalOpen(false);
        setSelectedAdminCategory(null);
        setEditServiceId(null);
        setServiceForm({
            basePrice: '',
            deliveryTime: '3-5 DAYS',
            selectedStyles: []
        });
    };

    const handleSaveService = async (e) => {
        e.preventDefault();
        if (!selectedAdminCategory) return;

        const price = Number(serviceForm.basePrice);
        if (isNaN(price) || price <= 0) {
            toast.error("Please enter a valid stitching price greater than 0");
            return;
        }

        if (selectedAdminCategory.minPrice != null && price < selectedAdminCategory.minPrice) {
            toast.error(`Price cannot be less than minimum allowed price of ₹${selectedAdminCategory.minPrice} for ${selectedAdminCategory.name}`);
            return;
        }

        if (selectedAdminCategory.maxPrice != null && price > selectedAdminCategory.maxPrice) {
            toast.error(`Price cannot be more than maximum allowed price of ₹${selectedAdminCategory.maxPrice} for ${selectedAdminCategory.name}`);
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                category: selectedAdminCategory._id,
                basePrice: price,
                deliveryTime: serviceForm.deliveryTime || '3-5 DAYS',
                selectedStyles: serviceForm.selectedStyles || []
            };

            let res;
            if (editServiceId) {
                res = await api.patch(`/tailors/services/${editServiceId}`, payload);
            } else {
                res = await api.post('/tailors/services', payload);
            }

            if (res.data?.success) {
                toast.success(res.data.message || `"${selectedAdminCategory.name}" submitted for Admin approval!`);
                handleCloseServiceModal();
                fetchData();
            }
        } catch (err) {
            console.error('Error saving service:', err);
            toast.error(err.response?.data?.message || 'Failed to save service');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleToggleService = async (serviceId, serviceTitle, e) => {
        if (e) e.stopPropagation();
        try {
            const res = await api.patch(`/tailors/services/${serviceId}/toggle`);
            if (res.data?.success) {
                toast.success(res.data.message || `Updated status for "${serviceTitle}"`);
                fetchData();
            }
        } catch (err) {
            console.error('Toggle error:', err);
            toast.error(err.response?.data?.message || 'Failed to update service status');
        }
    };

    const handleDeleteService = async (serviceId, serviceTitle, e) => {
        if (e) e.stopPropagation();
        if (window.confirm(`Are you sure you want to stop offering "${serviceTitle}" in your shop?`)) {
            try {
                await api.delete(`/tailors/services/${serviceId}`);
                toast.success(`Removed "${serviceTitle}" from your shop`);
                fetchData();
            } catch (err) {
                console.error('Delete error:', err);
                toast.error(err.response?.data?.message || 'Failed to delete service');
            }
        }
    };

    // ── FABRICS & GARMENTS HANDLERS (Unchanged) ──
    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImageUploading(true);
        try {
            const compressedFile = await compressImage(file, 1200, 0.8);
            const formData = new FormData();
            formData.append('image', compressedFile);

            let imageUrl = '';
            try {
                const res = await api.post('/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                const rawData = res.data?.data;
                imageUrl = rawData?.url || (Array.isArray(rawData) ? rawData[0] : rawData) || res.data?.url;
            } catch (err) {
                const res = await api.post('/upload/public', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                imageUrl = res.data?.data?.url || res.data?.url;
            }

            if (imageUrl) {
                setNewItem(prev => ({ ...prev, image: imageUrl }));
                toast.success('Image uploaded successfully!');
            }
        } catch (err) {
            console.error('Upload error:', err);
            toast.error('Image upload failed. Try again.');
        } finally {
            setIsImageUploading(false);
        }
    };

    const handleFabricSubmit = async (e) => {
        e.preventDefault();

        if (!newItem.category && (activeTab === 'garments' || (activeTab === 'fabrics' && !selectedParent))) {
            toast.error('Please select an Admin-created Category first!');
            return;
        }

        if (!newItem.image) {
            toast.error(`Please upload an image for your ${activeTab === 'fabrics' ? 'fabric' : 'product'}!`);
            return;
        }

        setIsSubmitting(true);
        try {
            const endpoint = isEditing ? `/tailors/products/${editId}` : '/tailors/products';
            const finalName = newItem.name || newItem.title || '';
            const payload = { 
                ...newItem, 
                title: finalName,
                name: finalName,
                ...(newItem.category || selectedParent ? { category: newItem.category || selectedParent } : {}),
                stock: parseInt(String(newItem.stock).replace(/\D/g, ''), 10) || 0,
                productType: activeTab === 'garments' ? 'store_item' : 'fabric',
                ...(activeTab === 'garments' ? {
                    sizes: typeof newItem.sizes === 'string' ? newItem.sizes.split(',').map(s => s.trim()).filter(Boolean) : newItem.sizes,
                    colors: typeof newItem.colors === 'string' ? newItem.colors.split(',').map(c => ({ name: c.trim(), hex: '#000000' })).filter(c => c.name) : newItem.colors
                } : {})
            };

            const res = isEditing
                ? await api.patch(endpoint, payload)
                : await api.post(endpoint, payload);

            if (res.data.success) {
                closeModal();
                fetchData();
                toast.success(res.data.message || (isEditing ? 'Updated successfully!' : 'Published product!'));
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Something went wrong');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditFabric = (item) => {
        setIsEditing(true);
        setEditId(item._id);
        setNewItem({
            ...newItem,
            name: item.name || item.title,
            description: item.description,
            image: item.image || (item.images && item.images[0]),
            price: item.price,
            stock: item.stock,
            category: item.category?._id || item.category,
            sizes: item.sizes ? item.sizes.join(', ') : '',
            colors: item.colors ? item.colors.map(c => c.name).join(', ') : ''
        });

        if (item.category?.parentCategory) {
            setSelectedParent(item.category.parentCategory);
        }
        setShowModal(true);
    };

    const handleDeleteProduct = async (id, type) => {
        const typeLabel = type === 'fabrics' ? 'fabric' : 'garment';
        if (window.confirm(`Are you sure you want to delete this ${typeLabel}?`)) {
            try {
                await api.delete(`/tailors/products/${id}`);
                toast.success(`${typeLabel} deleted successfully!`);
                fetchData();
            } catch (error) {
                console.error('Delete error:', error);
                toast.error(`Failed to delete ${typeLabel}`);
            }
        }
    };

    const closeModal = () => {
        setShowModal(false);
        setIsEditing(false);
        setEditId(null);
        setNewItem({
            title: '', name: '', description: '', image: '',
            basePrice: '', price: '', deliveryTime: '2-4 DAYS',
            stock: '', category: '', serviceType: 'STITCHING', selectedStyles: [],
            tags: '', sizes: '', colors: ''
        });
        setSelectedParent('');
        setSubcategories([]);
    };

    // ── ADMIN SERVICE CATEGORIES FILTERING ──
    // Admin defines official categories with type 'service' (or 'garment' / default)
    const adminServiceCategories = categories.filter(c => c.type === 'service' || c.type === 'garment' || !c.type);

    const filteredAdminServices = adminServiceCategories.filter(cat => {
        const matchesSearch = cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (cat.description || '').toLowerCase().includes(searchQuery.toLowerCase());
        if (!matchesSearch) return false;

        const myService = samples.find(s => (s.category?._id || s.category) === cat._id);
        if (serviceFilter === 'offered') return Boolean(myService);
        if (serviceFilter === 'active') return myService && myService.status === 'approved' && myService.isActive !== false;
        if (serviceFilter === 'pending') return myService && myService.status === 'pending';
        if (serviceFilter === 'available') return !myService;
        return true;
    });

    const offeredServicesCount = adminServiceCategories.filter(cat => 
        samples.some(s => (s.category?._id || s.category) === cat._id)
    ).length;

    const activeServicesCount = adminServiceCategories.filter(cat => {
        const s = samples.find(x => (x.category?._id || x.category) === cat._id);
        return s && s.status === 'approved' && s.isActive !== false;
    }).length;

    const pendingServicesCount = adminServiceCategories.filter(cat => {
        const s = samples.find(x => (x.category?._id || x.category) === cat._id);
        return s && s.status === 'pending';
    }).length;

    // Filters for Fabrics & Garments
    const productsToShow = activeTab === 'fabrics' ? fabrics : garments;
    const filteredProducts = productsToShow.filter(item =>
        (item.title || item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.category?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto font-['Plus_Jakarta_Sans',sans-serif]">
            
            {/* Top Heading */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h3 className="text-2xl sm:text-3xl font-black text-[#843D9B] tracking-tight leading-none">
                        {activeTab === 'samples' ? 'Stitching Services' : activeTab === 'fabrics' ? 'Fabric Inventory' : 'Ready-made Garments'}
                    </h3>
                    <p className="text-xs font-semibold text-gray-500 mt-2">
                        {activeTab === 'samples' 
                            ? 'Select the stitching services you provide. Official photos and titles are provided by SewZella.' 
                            : activeTab === 'fabrics' 
                                ? 'Manage fabric materials available at your shop' 
                                : 'Manage ready-made store garments'}
                    </p>
                </div>

                {activeTab !== 'samples' && (
                    <button
                        onClick={() => {
                            setIsEditing(false);
                            setShowModal(true);
                        }}
                        className="w-full sm:w-auto justify-center flex items-center gap-2 px-5 py-3.5 bg-gradient-to-r from-[#843D9B] to-[#B35BCB] text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-lg shadow-[#843D9B]/15 hover:shadow-xl hover:shadow-[#843D9B]/20 hover:scale-[1.02] active:scale-95 transition-all duration-300 cursor-pointer"
                    >
                        <Plus size={16} strokeWidth={3} />
                        <span>Add {activeTab === 'fabrics' ? 'Fabric' : 'Garment'}</span>
                    </button>
                )}
            </div>

            {/* Main Tabs */}
            <div className="flex p-1 bg-white border border-gray-100 rounded-2xl gap-1 shadow-xs">
                <button
                    onClick={() => { setActiveTab('samples'); setSearchQuery(''); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all duration-200 cursor-pointer ${
                        activeTab === 'samples' 
                            ? 'bg-[#843D9B] text-white shadow-md shadow-[#843D9B]/20' 
                            : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                    }`}
                >
                    <Scissors size={15} /> 
                    <span>Services</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ml-1 ${
                        activeTab === 'samples' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                        {offeredServicesCount}
                    </span>
                </button>

                <button
                    onClick={() => { setActiveTab('fabrics'); setSearchQuery(''); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all duration-200 cursor-pointer ${
                        activeTab === 'fabrics' 
                            ? 'bg-[#843D9B] text-white shadow-md shadow-[#843D9B]/20' 
                            : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                    }`}
                >
                    <ShoppingBag size={15} /> 
                    <span>Fabrics</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ml-1 ${
                        activeTab === 'fabrics' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                        {fabrics.length}
                    </span>
                </button>

                <button
                    onClick={() => { setActiveTab('garments'); setSearchQuery(''); }}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-extrabold uppercase tracking-wider rounded-xl transition-all duration-200 cursor-pointer ${
                        activeTab === 'garments' 
                            ? 'bg-[#843D9B] text-white shadow-md shadow-[#843D9B]/20' 
                            : 'text-gray-500 hover:text-gray-800 hover:bg-gray-50'
                    }`}
                >
                    <Package size={15} /> 
                    <span>Garments</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-black ml-1 ${
                        activeTab === 'garments' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                    }`}>
                        {garments.length}
                    </span>
                </button>
            </div>

            {/* Search & Sub-filters */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                <div className="relative flex-1 max-w-md">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder={activeTab === 'samples' ? "Search services (e.g. Kurti, Blouse)..." : "Search products..."}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-2.5 bg-white border border-gray-200/90 rounded-xl text-xs font-semibold placeholder:text-gray-400 focus:outline-none focus:border-[#843D9B] focus:ring-2 focus:ring-[#843D9B]/10 shadow-xs transition-all"
                    />
                </div>

                {/* Service Filter Tabs (All / Active / Pending / Available) */}
                {activeTab === 'samples' && (
                    <div className="flex bg-gray-100/80 p-1 rounded-xl gap-1 shrink-0 text-xs font-bold overflow-x-auto">
                        <button
                            onClick={() => setServiceFilter('all')}
                            className={`px-3 py-1.5 rounded-lg transition-all shrink-0 ${
                                serviceFilter === 'all' ? 'bg-white text-[#843D9B] shadow-xs' : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            All ({adminServiceCategories.length})
                        </button>
                        <button
                            onClick={() => setServiceFilter('active')}
                            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shrink-0 ${
                                serviceFilter === 'active' ? 'bg-white text-emerald-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            <span>Active in Shop</span>
                            <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded-full">
                                {activeServicesCount}
                            </span>
                        </button>
                        <button
                            onClick={() => setServiceFilter('pending')}
                            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shrink-0 ${
                                serviceFilter === 'pending' ? 'bg-white text-amber-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            <span>Pending Approval</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                                pendingServicesCount > 0 ? 'bg-amber-200 text-amber-900 font-black' : 'bg-gray-200 text-gray-600'
                            }`}>
                                {pendingServicesCount}
                            </span>
                        </button>
                        <button
                            onClick={() => setServiceFilter('available')}
                            className={`px-3 py-1.5 rounded-lg transition-all shrink-0 ${
                                serviceFilter === 'available' ? 'bg-white text-[#843D9B] shadow-xs' : 'text-gray-600 hover:text-gray-900'
                            }`}
                        >
                            Available to Add ({Math.max(0, adminServiceCategories.length - offeredServicesCount)})
                        </button>
                    </div>
                )}
            </div>

            {/* ═══ TAB 1: STITCHING SERVICES (Official Admin Catalog) ═══ */}
            {activeTab === 'samples' && (
                <div>
                    {isLoading ? (
                        <div className="py-20 text-center">
                            <div className="h-8 w-8 border-3 border-[#843D9B] border-t-transparent animate-spin rounded-full mx-auto mb-3" />
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading Platform Services...</p>
                        </div>
                    ) : filteredAdminServices.length === 0 ? (
                        <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-gray-200 p-8">
                            <Scissors size={32} className="mx-auto text-gray-300 mb-3" />
                            <h4 className="text-sm font-bold text-gray-700">No Services Found</h4>
                            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                                {searchQuery 
                                    ? `No services match "${searchQuery}". Try a different keyword.` 
                                    : 'No service categories configured yet by Admin.'}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                            {filteredAdminServices.map((cat) => {
                                const myService = samples.find(s => (s.category?._id || s.category) === cat._id);
                                const isOffered = Boolean(myService);
                                const isActive = myService?.isActive !== false;

                                const isPending = isOffered && myService?.status === 'pending';
                                const isRejected = isOffered && myService?.status === 'rejected';
                                const isApproved = isOffered && myService?.status === 'approved';

                                return (
                                    <div 
                                        key={cat._id}
                                        className={`group bg-white rounded-3xl border transition-all duration-300 flex flex-col overflow-hidden relative ${
                                            isOffered 
                                                ? (isPending 
                                                    ? 'border-amber-300 bg-amber-50/15 ring-1 ring-amber-400/40 shadow-sm'
                                                    : isRejected
                                                        ? 'border-red-300 bg-red-50/20 shadow-sm'
                                                        : isActive 
                                                            ? 'border-emerald-200/80 shadow-md shadow-emerald-500/5 ring-1 ring-emerald-500/20' 
                                                            : 'border-gray-200 bg-gray-50/40') 
                                                : 'border-gray-200/80 hover:border-[#843D9B]/50 hover:shadow-xl hover:-translate-y-1'
                                        }`}
                                    >
                                        {/* Top Image: Official Admin Photo */}
                                        <div className="aspect-[16/11] bg-gray-100 relative overflow-hidden">
                                            <SafeImage
                                                src={cat.image || myService?.image}
                                                alt={cat.name}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            />

                                            {/* Status Badge */}
                                            <div className="absolute top-3 left-3 z-10">
                                                {isOffered ? (
                                                    isPending ? (
                                                        <span className="inline-flex items-center gap-1 bg-amber-500/95 backdrop-blur-md text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-md animate-pulse">
                                                            <Clock size={12} strokeWidth={2.5} />
                                                            Pending Approval
                                                        </span>
                                                    ) : isRejected ? (
                                                        <span className="inline-flex items-center gap-1 bg-red-600/95 backdrop-blur-md text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-md">
                                                            <X size={12} strokeWidth={2.5} />
                                                            Rejected
                                                        </span>
                                                    ) : isActive ? (
                                                        <span className="inline-flex items-center gap-1 bg-emerald-600/95 backdrop-blur-md text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-md">
                                                            <CheckCircle2 size={12} strokeWidth={3} />
                                                            Active in Shop
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 bg-slate-700/95 backdrop-blur-md text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-md">
                                                            <PauseCircle size={12} strokeWidth={2.5} />
                                                            Paused
                                                        </span>
                                                    )
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md">
                                                        Not Offered
                                                    </span>
                                                )}
                                            </div>

                                            {/* Verified platform service icon */}
                                            <div className="absolute top-3 right-3 z-10">
                                                <span className="h-7 w-7 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-[#843D9B] shadow-sm" title="Official SewZella Service">
                                                    <ShieldCheck size={16} />
                                                </span>
                                            </div>
                                        </div>

                                        {/* Card Body */}
                                        <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                                            <div>
                                                <div className="flex items-center justify-between gap-2 mb-1">
                                                    <span className="text-[9px] font-black text-[#843D9B] uppercase tracking-wider">
                                                        {cat.gender ? `${cat.gender.toUpperCase()} WEAR` : 'CUSTOM STITCHING'}
                                                    </span>
                                                    {cat.styles && cat.styles.length > 0 && (
                                                        <span className="text-[9px] font-bold text-gray-400">
                                                            {cat.styles.length} Styles
                                                        </span>
                                                    )}
                                                </div>

                                                <h4 className="text-base font-extrabold text-gray-900 tracking-tight leading-snug line-clamp-1 group-hover:text-[#843D9B] transition-colors">
                                                    {cat.name}
                                                </h4>

                                                {cat.description && (
                                                    <p className="text-[11px] text-gray-500 font-medium line-clamp-2 mt-1 leading-relaxed">
                                                        {cat.description}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Pending / Rejection Banner */}
                                            {isPending && (
                                                <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-2.5 text-[11px] text-amber-900 font-medium space-y-1">
                                                    <div className="flex items-center gap-1.5 font-bold text-amber-800">
                                                        <Clock size={13} className="text-amber-600 shrink-0" />
                                                        <span>Pending Admin Approval</span>
                                                    </div>
                                                    <p className="text-[10px] text-amber-700 leading-snug">
                                                        Admin is reviewing your price & turnaround. Once approved, it will be visible on customer app.
                                                    </p>
                                                </div>
                                            )}

                                            {isRejected && (
                                                <div className="bg-red-50 border border-red-200 rounded-2xl p-2.5 text-[11px] text-red-900 font-medium space-y-1">
                                                    <div className="flex items-center gap-1.5 font-bold text-red-800">
                                                        <AlertCircle size={13} className="text-red-600 shrink-0" />
                                                        <span>Service Not Approved</span>
                                                    </div>
                                                    <p className="text-[10px] text-red-700 leading-snug">
                                                        {myService.rejectionReason || "Please adjust your price or turnaround to meet platform requirements."}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Pricing & Turnaround Section */}
                                            <div className="pt-3 border-t border-gray-100 space-y-2.5">
                                                {isOffered ? (
                                                    <div>
                                                        <div className="flex items-baseline justify-between">
                                                            <div>
                                                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">Your Price</span>
                                                                <span className="text-xl font-black text-[#843D9B] tracking-tight">
                                                                    ₹{myService.basePrice}
                                                                </span>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">Turnaround</span>
                                                                <span className="text-xs font-bold text-gray-700 flex items-center gap-1 justify-end">
                                                                    <Clock size={11} className="text-[#843D9B]" />
                                                                    {myService.deliveryTime || '3-5 DAYS'}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {cat.minPrice != null && cat.maxPrice != null && (
                                                            <p className="text-[9px] font-semibold text-gray-400 mt-1">
                                                                Allowed Band: ₹{cat.minPrice} – ₹{cat.maxPrice}
                                                            </p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div>
                                                        <div className="flex items-baseline justify-between">
                                                            <div>
                                                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">Suggested Price</span>
                                                                <span className="text-lg font-black text-gray-900 tracking-tight">
                                                                    ₹{cat.basePrice || cat.minPrice || 499}
                                                                </span>
                                                            </div>
                                                            {cat.minPrice != null && cat.maxPrice != null && (
                                                                <div className="text-right">
                                                                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">Price Range</span>
                                                                    <span className="text-xs font-bold text-gray-600">
                                                                        ₹{cat.minPrice} – ₹{cat.maxPrice}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Action Buttons */}
                                                {isOffered ? (
                                                    <div className="flex items-center gap-2 pt-1">
                                                        {isPending ? (
                                                            /* Pending: Show In-Review disabled badge + Edit & Delete */
                                                            <>
                                                                <div className="flex-1 py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 bg-amber-100 text-amber-800 border border-amber-200">
                                                                    <Clock size={13} className="text-amber-700 animate-spin" />
                                                                    <span>Under Review</span>
                                                                </div>
                                                                <button
                                                                    onClick={() => handleOpenServiceModal(cat, myService)}
                                                                    className="p-2 rounded-xl bg-gray-50 hover:bg-[#843D9B] hover:text-white text-gray-600 transition-colors border border-gray-200 cursor-pointer shadow-xs"
                                                                    title="Edit price or styles"
                                                                >
                                                                    <Edit3 size={14} />
                                                                </button>
                                                                <button
                                                                    onClick={(e) => handleDeleteService(myService._id, cat.name, e)}
                                                                    className="p-2 rounded-xl bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 transition-colors border border-rose-100 cursor-pointer shadow-xs"
                                                                    title="Cancel approval request"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </>
                                                        ) : isRejected ? (
                                                            /* Rejected: Show Edit & Re-submit button + Delete */
                                                            <>
                                                                <button
                                                                    onClick={() => handleOpenServiceModal(cat, myService)}
                                                                    className="flex-1 py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 text-white transition-all cursor-pointer shadow-sm shadow-red-600/20 active:scale-95"
                                                                >
                                                                    <RotateCcw size={13} />
                                                                    <span>Edit & Re-submit</span>
                                                                </button>
                                                                <button
                                                                    onClick={(e) => handleDeleteService(myService._id, cat.name, e)}
                                                                    className="p-2 rounded-xl bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 transition-colors border border-rose-100 cursor-pointer shadow-xs"
                                                                    title="Remove service"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            /* Approved: Toggle Pause / Resume + Edit + Delete */
                                                            <>
                                                                <button
                                                                    onClick={(e) => handleToggleService(myService._id, cat.name, e)}
                                                                    className={`flex-1 py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                                                                        isActive 
                                                                            ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200' 
                                                                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                                                                    }`}
                                                                    title={isActive ? 'Pause offering this service' : 'Resume offering this service'}
                                                                >
                                                                    {isActive ? <PauseCircle size={14} /> : <PlayCircle size={14} />}
                                                                    <span>{isActive ? 'Pause' : 'Resume'}</span>
                                                                </button>
                                                                <button
                                                                    onClick={() => handleOpenServiceModal(cat, myService)}
                                                                    className="p-2 rounded-xl bg-gray-50 hover:bg-[#843D9B] hover:text-white text-gray-600 transition-colors border border-gray-200 cursor-pointer shadow-xs"
                                                                    title="Edit your price and styles"
                                                                >
                                                                    <Edit3 size={14} />
                                                                </button>
                                                                <button
                                                                    onClick={(e) => handleDeleteService(myService._id, cat.name, e)}
                                                                    className="p-2 rounded-xl bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 transition-colors border border-rose-100 cursor-pointer shadow-xs"
                                                                    title="Remove service from your shop"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handleOpenServiceModal(cat)}
                                                        className="w-full py-2.5 px-4 bg-gradient-to-r from-[#843D9B] to-[#9E47BA] hover:from-[#732F87] hover:to-[#843D9B] text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md shadow-[#843D9B]/15 hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95"
                                                    >
                                                        <Plus size={15} strokeWidth={3} />
                                                        <span>Offer This Service</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ═══ TAB 2 & 3: FABRICS & GARMENTS ═══ */}
            {activeTab !== 'samples' && (
                <div>
                    {isLoading ? (
                        <div className="py-20 text-center">
                            <div className="h-8 w-8 border-3 border-[#843D9B] border-t-transparent animate-spin rounded-full mx-auto mb-3" />
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading inventory...</p>
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-gray-200 p-8">
                            <ShoppingBag size={32} className="mx-auto text-gray-300 mb-3" />
                            <h4 className="text-sm font-bold text-gray-700">No {activeTab === 'fabrics' ? 'Fabrics' : 'Garments'} Found</h4>
                            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                                You haven't added any {activeTab === 'fabrics' ? 'fabrics' : 'garments'} to your shop yet.
                            </p>
                            <button
                                onClick={() => { setIsEditing(false); setShowModal(true); }}
                                className="mt-4 px-5 py-2.5 bg-[#843D9B] text-white text-xs font-bold rounded-xl shadow-md cursor-pointer hover:bg-[#6E3082] transition-colors"
                            >
                                + Add {activeTab === 'fabrics' ? 'Fabric' : 'Garment'}
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                            {filteredProducts.map((item) => {
                                const currentPrice = item.price || item.basePrice || 0;
                                const originalPrice = item.discountPrice || item.originalPrice || 0;
                                const isOutOfStock = item.stock <= 0;

                                return (
                                    <div 
                                        key={item._id} 
                                        onClick={() => handleEditFabric(item)}
                                        className="group relative bg-white border border-gray-100 rounded-3xl overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1 shadow-xs cursor-pointer"
                                    >
                                        <div className="aspect-[4/5] bg-gray-50 relative overflow-hidden">
                                            <SafeImage
                                                src={item.image || item.images?.[0]}
                                                alt={item.name || item.title}
                                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            />
                                            <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
                                                {isOutOfStock ? (
                                                    <span className="bg-rose-500/90 text-white text-[8px] font-black px-2 py-0.5 rounded-full shadow-md uppercase">
                                                        Out of Stock
                                                    </span>
                                                ) : (
                                                    <span className="bg-emerald-500/90 text-white text-[8px] font-black px-2 py-0.5 rounded-full shadow-md uppercase">
                                                        In Stock
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="p-4 flex-1 flex flex-col justify-between">
                                            <div>
                                                <span className="text-[9px] text-[#843D9B] uppercase tracking-wider font-extrabold truncate block mb-1">
                                                    {item.category?.name || 'General'}
                                                </span>
                                                <h4 className="text-sm font-extrabold text-gray-900 line-clamp-1 tracking-tight group-hover:text-[#843D9B] transition-colors">
                                                    {item.name || item.title}
                                                </h4>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1 flex items-center gap-1">
                                                    <Package size={11} className="text-[#843D9B]" /> 
                                                    {item.stock || 0} {activeTab === 'fabrics' ? 'M Available' : 'In Stock'}
                                                </p>
                                            </div>

                                            <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between">
                                                <div>
                                                    <span className="text-[8px] font-black text-gray-400 uppercase tracking-wider block">Price</span>
                                                    <span className="text-base font-black text-[#843D9B]">
                                                        ₹{currentPrice.toLocaleString()}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleEditFabric(item); }}
                                                        className="h-7 w-7 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-[#843D9B] hover:text-white transition-colors border border-gray-200"
                                                    >
                                                        <Edit3 size={12} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleDeleteProduct(item._id, activeTab); }}
                                                        className="h-7 w-7 rounded-lg bg-rose-50 flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-colors border border-rose-100"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}

            {/* ═══ DIALOG: OFFER / CONFIGURE STITCHING SERVICE ═══ */}
            {/* Tailor sets ONLY price and delivery days. Photo & Title are from Admin Category. */}
            {serviceModalOpen && selectedAdminCategory && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                        
                        {/* Header Banner with Admin Official Photo & Title */}
                        <div className="relative bg-gradient-to-br from-[#843D9B] to-[#5C236E] text-white p-6">
                            <button
                                onClick={handleCloseServiceModal}
                                className="absolute top-4 right-4 h-8 w-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer"
                            >
                                <X size={18} />
                            </button>

                            <div className="flex items-center gap-4">
                                <div className="h-16 w-16 rounded-2xl bg-white/10 border border-white/20 overflow-hidden shrink-0 shadow-inner">
                                    <SafeImage
                                        src={selectedAdminCategory.image}
                                        alt={selectedAdminCategory.name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="flex-1 min-w-0 pr-6">
                                    <div className="inline-flex items-center gap-1 bg-white/20 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full mb-1">
                                        <ShieldCheck size={11} />
                                        Official Platform Service
                                    </div>
                                    <h3 className="text-xl font-black text-white tracking-tight leading-snug truncate">
                                        {selectedAdminCategory.name}
                                    </h3>
                                    <p className="text-xs text-white/80 line-clamp-1 mt-0.5">
                                        {selectedAdminCategory.description || 'Custom tailoring service for your shop'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Notice for Tailor */}
                        <div className="px-6 py-2.5 bg-[#F4EFFF] border-b border-[#E9DFFE] flex items-center gap-2">
                            <span className="text-xs">🛡️</span>
                            <p className="text-[11px] font-semibold text-[#843D9B]">
                                Admin Approval Workflow: Once you submit your price, the request goes to Admin for review. Once approved, it will be visible to customers.
                            </p>
                        </div>

                        {/* Form Body */}
                        <form id="service-form" onSubmit={handleSaveService} className="p-6 overflow-y-auto space-y-5 custom-scrollbar flex-1">
                            
                            {/* 1. Stitching Price Input with Strict Admin Min-Max Bounds */}
                            {(() => {
                                const price = Number(serviceForm.basePrice);
                                const isBelowMin = selectedAdminCategory.minPrice != null && price && price < selectedAdminCategory.minPrice;
                                const isAboveMax = selectedAdminCategory.maxPrice != null && price && price > selectedAdminCategory.maxPrice;
                                const isOutOfRange = isBelowMin || isAboveMax;

                                return (
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between items-center">
                                            <label className="text-xs font-black text-gray-800 uppercase tracking-wide">
                                                Your Stitching Price (₹) *
                                            </label>
                                            {selectedAdminCategory.minPrice != null && selectedAdminCategory.maxPrice != null && (
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                                    isOutOfRange ? 'bg-red-50 text-red-600 border border-red-200' : 'text-[#843D9B] bg-[#843D9B]/10'
                                                }`}>
                                                    Allowed: ₹{selectedAdminCategory.minPrice} – ₹{selectedAdminCategory.maxPrice}
                                                </span>
                                            )}
                                        </div>

                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-black text-base">₹</span>
                                            <input
                                                type="number"
                                                required
                                                min={selectedAdminCategory.minPrice || 1}
                                                max={selectedAdminCategory.maxPrice || 50000}
                                                value={serviceForm.basePrice}
                                                onChange={(e) => setServiceForm({ ...serviceForm, basePrice: e.target.value })}
                                                placeholder={String(selectedAdminCategory.basePrice || selectedAdminCategory.minPrice || '499')}
                                                className={`w-full pl-9 pr-4 py-3 bg-gray-50 border rounded-2xl text-base font-extrabold text-gray-900 focus:bg-white focus:outline-none transition-all shadow-xs ${
                                                    isOutOfRange 
                                                        ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/15' 
                                                        : 'border-gray-200 focus:border-[#843D9B] focus:ring-2 focus:ring-[#843D9B]/15'
                                                }`}
                                            />
                                        </div>

                                        {/* Real-time Range Status Banner */}
                                        {isBelowMin && (
                                            <p className="text-[11px] font-bold text-red-600 bg-red-50 p-2 rounded-xl border border-red-100 flex items-center gap-1.5 mt-1">
                                                <span>⚠️</span>
                                                <span>Price cannot be lower than ₹{selectedAdminCategory.minPrice} (Admin minimum limit).</span>
                                            </p>
                                        )}
                                        {isAboveMax && (
                                            <p className="text-[11px] font-bold text-red-600 bg-red-50 p-2 rounded-xl border border-red-100 flex items-center gap-1.5 mt-1">
                                                <span>⚠️</span>
                                                <span>Price cannot exceed ₹{selectedAdminCategory.maxPrice} (Admin maximum limit).</span>
                                            </p>
                                        )}
                                        {!isOutOfRange && price > 0 && selectedAdminCategory.minPrice != null && selectedAdminCategory.maxPrice != null && (
                                            <p className="text-[11px] font-bold text-emerald-700 bg-emerald-50 p-2 rounded-xl border border-emerald-100 flex items-center gap-1.5 mt-1">
                                                <span>✓</span>
                                                <span>Valid Price: ₹{price} is within the Admin allowed range (₹{selectedAdminCategory.minPrice} – ₹{selectedAdminCategory.maxPrice}).</span>
                                            </p>
                                        )}
                                    </div>
                                );
                            })()}

                            {/* 2. Estimated Turnaround / Delivery Days */}
                            <div className="space-y-2">
                                <label className="text-xs font-black text-gray-800 uppercase tracking-wide">
                                    Estimated Stitching & Delivery Time *
                                </label>
                                <div className="grid grid-cols-3 gap-2">
                                    {['2-3 DAYS', '3-5 DAYS', '5-7 DAYS'].map((preset) => (
                                        <button
                                            type="button"
                                            key={preset}
                                            onClick={() => setServiceForm({ ...serviceForm, deliveryTime: preset })}
                                            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                                                serviceForm.deliveryTime === preset
                                                    ? 'bg-[#843D9B] text-white border-[#843D9B] shadow-sm'
                                                    : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300'
                                            }`}
                                        >
                                            {preset}
                                        </button>
                                    ))}
                                </div>
                                <input
                                    type="text"
                                    value={serviceForm.deliveryTime}
                                    onChange={(e) => setServiceForm({ ...serviceForm, deliveryTime: e.target.value })}
                                    placeholder="Or enter custom time (e.g. 4 DAYS)"
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#843D9B] transition-all"
                                />
                            </div>

                            {/* 3. Style Variants (If Category has Styles) */}
                            {selectedAdminCategory.styles && selectedAdminCategory.styles.length > 0 && (
                                <div className="space-y-2.5 pt-2 border-t border-gray-100">
                                    <div className="flex justify-between items-center">
                                        <label className="text-xs font-black text-gray-800 uppercase tracking-wide">
                                            Styles You Can Stitch
                                        </label>
                                        <span className="text-[10px] font-bold text-gray-400">
                                            {serviceForm.selectedStyles.length} of {selectedAdminCategory.styles.length} Selected
                                        </span>
                                    </div>
                                    <p className="text-[11px] text-gray-500 font-medium">
                                        Uncheck any styles that you do not support for this garment:
                                    </p>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                                        {selectedAdminCategory.styles.map((style, idx) => {
                                            const isSelected = serviceForm.selectedStyles.some(s => (s.name || s) === style.name);
                                            return (
                                                <div
                                                    key={idx}
                                                    onClick={() => {
                                                        let newSel;
                                                        if (isSelected) {
                                                            newSel = serviceForm.selectedStyles.filter(s => (s.name || s) !== style.name);
                                                        } else {
                                                            newSel = [...serviceForm.selectedStyles, { 
                                                                name: style.name, 
                                                                image: style.image, 
                                                                description: style.description 
                                                            }];
                                                        }
                                                        setServiceForm({ ...serviceForm, selectedStyles: newSel });
                                                    }}
                                                    className={`p-2.5 rounded-2xl border cursor-pointer transition-all flex items-center gap-3 ${
                                                        isSelected 
                                                            ? 'border-[#843D9B] bg-[#843D9B]/5 ring-1 ring-[#843D9B]/20 shadow-xs' 
                                                            : 'border-gray-200 bg-gray-50/50 hover:border-gray-300'
                                                    }`}
                                                >
                                                    {style.image ? (
                                                        <img src={style.image} alt={style.name} className="w-10 h-10 rounded-xl object-cover shrink-0" />
                                                    ) : (
                                                        <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#843D9B] flex items-center justify-center font-bold text-sm shrink-0">
                                                            ✂️
                                                        </div>
                                                    )}
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`text-xs font-bold truncate ${isSelected ? 'text-[#843D9B]' : 'text-gray-900'}`}>
                                                            {style.name}
                                                        </p>
                                                        {style.description && (
                                                            <p className="text-[10px] text-gray-400 truncate">{style.description}</p>
                                                        )}
                                                    </div>
                                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs shrink-0 ${
                                                        isSelected ? 'bg-[#843D9B] border-[#843D9B] text-white' : 'border-gray-300 bg-white'
                                                    }`}>
                                                        {isSelected && <Check size={12} strokeWidth={3} />}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </form>

                        {/* Modal Footer with Strict Admin Price Range Guard */}
                        {(() => {
                            const curPrice = Number(serviceForm.basePrice);
                            const hasPrice = serviceForm.basePrice !== '' && !isNaN(curPrice) && curPrice > 0;
                            const isBelowMin = selectedAdminCategory?.minPrice != null && hasPrice && curPrice < selectedAdminCategory.minPrice;
                            const isAboveMax = selectedAdminCategory?.maxPrice != null && hasPrice && curPrice > selectedAdminCategory.maxPrice;
                            const isPriceInvalid = !hasPrice || isBelowMin || isAboveMax;

                            return (
                                <div className="p-5 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3">
                                    <div className="text-[11px] font-bold">
                                        {isBelowMin ? (
                                            <span className="text-red-600 flex items-center gap-1.5">
                                                <span>⚠️</span> Below Min limit (Min: ₹{selectedAdminCategory.minPrice})
                                            </span>
                                        ) : isAboveMax ? (
                                            <span className="text-red-600 flex items-center gap-1.5">
                                                <span>⚠️</span> Exceeds Max limit (Max: ₹{selectedAdminCategory.maxPrice})
                                            </span>
                                        ) : !hasPrice ? (
                                            <span className="text-gray-400">
                                                Enter price {selectedAdminCategory?.minPrice != null ? `(₹${selectedAdminCategory.minPrice} - ₹${selectedAdminCategory.maxPrice || '∞'})` : ''}
                                            </span>
                                        ) : (
                                            <span className="text-emerald-700 flex items-center gap-1.5">
                                                <span>✓</span> Price is within Admin allowed range
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={handleCloseServiceModal}
                                            className="px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            form="service-form"
                                            disabled={isSubmitting || isPriceInvalid}
                                            className="px-6 py-2.5 bg-[#843D9B] hover:bg-[#6D2883] text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-[#843D9B]/20 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                                        >
                                            {isSubmitting ? 'Submitting...' : editServiceId ? 'Submit Changes for Approval' : 'Submit for Admin Approval'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                </div>
            )}

            {/* ═══ MODAL: FABRIC / READYMADE GARMENTS (Unchanged) ═══ */}
            {showModal && activeTab === 'garments' ? (
                <GarmentForm 
                    initialData={isEditing ? garments.find(g => g._id === editId) : null}
                    categories={categories.filter(c => c.type === 'product' && !c.parentCategory)}
                    onClose={closeModal}
                    onSubmitSuccess={() => {
                        closeModal();
                        fetchData();
                    }}
                />
            ) : showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h4 className="text-xl font-black text-[#843D9B]">
                                    {isEditing ? 'Update' : 'Add New'} Fabric
                                </h4>
                                <p className="text-xs text-gray-400 mt-0.5">List your available fabric materials</p>
                            </div>
                            <button onClick={closeModal} className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200">
                                <X size={16} />
                            </button>
                        </div>

                        <form id="fabric-form" onSubmit={handleFabricSubmit} className="p-6 overflow-y-auto space-y-4 custom-scrollbar flex-1">
                            <div>
                                <label className="text-xs font-bold text-gray-700 block mb-1">Fabric Category *</label>
                                <select
                                    required
                                    value={selectedParent}
                                    onChange={(e) => { setSelectedParent(e.target.value); setNewItem({ ...newItem, category: '' }); }}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#843D9B]"
                                >
                                    <option value="">Select Fabric Type</option>
                                    {categories.filter(c => c.type === 'product' && !c.parentCategory).map(c => (
                                        <option key={c._id} value={c._id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            {selectedParent && subcategories.length > 0 && (
                                <div>
                                    <label className="text-xs font-bold text-gray-700 block mb-1">Sub-Material *</label>
                                    <select
                                        required
                                        value={newItem.category}
                                        onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#843D9B]"
                                    >
                                        <option value="">Select Material</option>
                                        {subcategories.map(c => (
                                            <option key={c._id} value={c._id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div>
                                <label className="text-xs font-bold text-gray-700 block mb-1">Fabric Name *</label>
                                <input
                                    required
                                    placeholder="e.g. Pure Chanderi Silk"
                                    value={newItem.name}
                                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#843D9B]"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-xs font-bold text-gray-700 block mb-1">Price / Meter (₹) *</label>
                                    <input
                                        required
                                        type="number"
                                        value={newItem.price}
                                        onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#843D9B]"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-700 block mb-1">Available Stock (Meters) *</label>
                                    <input
                                        required
                                        type="number"
                                        value={newItem.stock}
                                        onChange={(e) => setNewItem({ ...newItem, stock: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#843D9B]"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-gray-700 block mb-1">Fabric Photo *</label>
                                <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-2xl border border-gray-200">
                                    <div className="h-16 w-16 rounded-xl bg-white border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                                        {newItem.image ? (
                                            <img src={newItem.image} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <ShoppingBag size={20} className="text-gray-300" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                            disabled={isImageUploading}
                                            className="text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-[#843D9B] file:text-white hover:file:bg-[#6D2883] cursor-pointer"
                                        />
                                    </div>
                                </div>
                            </div>
                        </form>

                        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                            <button onClick={closeModal} className="px-5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600">
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="fabric-form"
                                disabled={isSubmitting}
                                className="px-6 py-2 bg-[#843D9B] text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md hover:bg-[#6D2883]"
                            >
                                {isSubmitting ? 'Saving...' : 'Save Fabric'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Products;
