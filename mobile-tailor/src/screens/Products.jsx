// Port of modules/tailor/pages/Products.jsx (converted with scripts/web2rn.js, then reviewed)
import Spin from '../components/ui/Spin';
import { confirm } from '../lib/alert';
import Select from '../components/ui/Select';
import { pickImage } from '../lib/files';
import { Dialog, Sheet } from '../components/ui/Sheet';
import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit3, Search, Scissors, Layers, ShoppingBag, Package, ChevronRight, X, Clock, Star, Camera, CheckCircle2, PauseCircle, PlayCircle, ShieldCheck, Check, AlertCircle, RotateCcw } from "lucide-react-native";
import { Button } from "../components/tailor/UIElements";
import api from "../lib/api";
import toast from '../lib/toast';
import SafeImage from "../components/common/SafeImage";
import GarmentForm from "../components/tailor/GarmentForm";
import { compressImage } from "../utils/imageCompression";
import { Box, Txt, Btn, I, Input, Img, Scroll } from '../components/ui/primitives';
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
      const [servicesRes, productsRes, catsRes] = await Promise.all([api.get('/tailors/services'), api.get('/tailors/products'), api.get('/products/categories')]);
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
    } else {
    }
    return () => {
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
          params: {
            parent: selectedParent,
            type: 'fabric'
          }
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
      basePrice: existingService?.basePrice != null ? String(existingService.basePrice) : adminCat.basePrice != null ? String(adminCat.basePrice) : adminCat.minPrice != null ? String(adminCat.minPrice) : '',
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
  const handleSaveService = async e => {
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
    if (e) {}
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
    if (e) {}
    if (await confirm(`Are you sure you want to stop offering "${serviceTitle}" in your shop?`)) {
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
  const handleImageUpload = async () => {
    const file = await pickImage();
    if (!file) return;
    setIsImageUploading(true);
    try {
      const compressedFile = await compressImage(file, 1200, 0.8);
      const formData = new FormData();
      formData.append('image', compressedFile);
      let imageUrl = '';
      try {
        const res = await api.post('/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        const rawData = res.data?.data;
        imageUrl = rawData?.url || (Array.isArray(rawData) ? rawData[0] : rawData) || res.data?.url;
      } catch (err) {
        const res = await api.post('/upload/public', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        imageUrl = res.data?.data?.url || res.data?.url;
      }
      if (imageUrl) {
        setNewItem(prev => ({
          ...prev,
          image: imageUrl
        }));
        toast.success('Image uploaded successfully!');
      }
    } catch (err) {
      console.error('Upload error:', err);
      toast.error('Image upload failed. Try again.');
    } finally {
      setIsImageUploading(false);
    }
  };
  const handleFabricSubmit = async e => {
    if (!newItem.category && (activeTab === 'garments' || activeTab === 'fabrics' && !selectedParent)) {
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
        ...(newItem.category || selectedParent ? {
          category: newItem.category || selectedParent
        } : {}),
        stock: parseInt(String(newItem.stock).replace(/\D/g, ''), 10) || 0,
        productType: activeTab === 'garments' ? 'store_item' : 'fabric',
        ...(activeTab === 'garments' ? {
          sizes: typeof newItem.sizes === 'string' ? newItem.sizes.split(',').map(s => s.trim()).filter(Boolean) : newItem.sizes,
          colors: typeof newItem.colors === 'string' ? newItem.colors.split(',').map(c => ({
            name: c.trim(),
            hex: '#000000'
          })).filter(c => c.name) : newItem.colors
        } : {})
      };
      const res = isEditing ? await api.patch(endpoint, payload) : await api.post(endpoint, payload);
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
  const handleEditFabric = item => {
    setIsEditing(true);
    setEditId(item._id);
    setNewItem({
      ...newItem,
      name: item.name || item.title,
      description: item.description,
      image: item.image || item.images && item.images[0],
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
    if (await confirm(`Are you sure you want to delete this ${typeLabel}?`)) {
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
    setSelectedParent('');
    setSubcategories([]);
  };

  // ── ADMIN SERVICE CATEGORIES FILTERING ──
  // Admin defines official categories with type 'service' (or 'garment' / default)
  const adminServiceCategories = categories.filter(c => c.type === 'service' || c.type === 'garment' || !c.type);
  const filteredAdminServices = adminServiceCategories.filter(cat => {
    const matchesSearch = cat.name.toLowerCase().includes(searchQuery.toLowerCase()) || (cat.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    const myService = samples.find(s => (s.category?._id || s.category) === cat._id);
    if (serviceFilter === 'offered') return Boolean(myService);
    if (serviceFilter === 'active') return myService && myService.status === 'approved' && myService.isActive !== false;
    if (serviceFilter === 'pending') return myService && myService.status === 'pending';
    if (serviceFilter === 'available') return !myService;
    return true;
  });
  const offeredServicesCount = adminServiceCategories.filter(cat => samples.some(s => (s.category?._id || s.category) === cat._id)).length;
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
  const filteredProducts = productsToShow.filter(item => (item.title || item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (item.category?.name || '').toLowerCase().includes(searchQuery.toLowerCase()));
  return <Box className="w-full max-w-7xl mx-auto space-y-4 sm:space-y-6 px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6 pb-28 md:pb-12 font-['Plus_Jakarta_Sans',sans-serif] min-w-0 overflow-x-hidden">
            
            {/* Top Heading */}
            <Box className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
                <Box className="min-w-0 flex-1">
                    <Txt className="text-xl sm:text-2xl md:text-3xl font-black text-gray-900 tracking-tight leading-tight">
                        {activeTab === 'samples' ? 'Stitching Services' : activeTab === 'fabrics' ? 'Fabric Inventory' : 'Ready-made Garments'}
                    </Txt>
                    <Txt className="text-xs font-medium text-gray-500 mt-1 max-w-2xl leading-relaxed">
                        {activeTab === 'samples' ? 'Select the stitching services you provide. Official photos and titles are provided by SewZella.' : activeTab === 'fabrics' ? 'Manage fabric materials available at your shop' : 'Manage ready-made store garments'}
                    </Txt>
                </Box>

                {activeTab !== 'samples' && <Btn onPress={() => {
        setIsEditing(false);
        setShowModal(true);
      }} className="w-full sm:w-auto shrink-0 justify-center flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 bg-gradient-to-r from-[#843D9B] to-[#9E47BA] hover:from-[#732F87] hover:to-[#843D9B] text-white text-xs font-bold rounded-xl sm:rounded-2xl shadow-md shadow-[#843D9B]/15 hover:shadow-lg active:scale-95 transition-all duration-200 cursor-pointer">
                        <I icon={Plus} size={16} strokeWidth={2.5} />
                        <Txt>Add {activeTab === 'fabrics' ? 'Fabric' : 'Garment'}</Txt>
                    </Btn>}
            </Box>

            {/* Main Tabs - 3 Equal Columns, zero overflow on mobile */}
            <Box className="grid grid-cols-3 p-1 sm:p-1.5 bg-gray-100/90 border border-gray-200/60 rounded-2xl gap-1 shadow-xs">
                <Btn onPress={() => {
        setActiveTab('samples');
        setSearchQuery('');
      }} className={`flex items-center justify-center gap-1 sm:gap-2 py-2.5 sm:py-3 px-1 sm:px-3 text-[11px] sm:text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer min-w-0 ${activeTab === 'samples' ? 'bg-[#843D9B] text-white shadow-md shadow-[#843D9B]/25 font-black' : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'}`}>
                    <I icon={Scissors} size={14} className="shrink-0" /> 
                    <Txt className="truncate">Services</Txt>
                    <Txt className={`text-[10px] px-1.5 py-0.5 rounded-full font-black shrink-0 ${activeTab === 'samples' ? 'bg-white/20 text-white' : 'bg-white text-gray-700 shadow-2xs'}`}>
                        {offeredServicesCount}
                    </Txt>
                </Btn>

                <Btn onPress={() => {
        setActiveTab('fabrics');
        setSearchQuery('');
      }} className={`flex items-center justify-center gap-1 sm:gap-2 py-2.5 sm:py-3 px-1 sm:px-3 text-[11px] sm:text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer min-w-0 ${activeTab === 'fabrics' ? 'bg-[#843D9B] text-white shadow-md shadow-[#843D9B]/25 font-black' : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'}`}>
                    <I icon={ShoppingBag} size={14} className="shrink-0" /> 
                    <Txt className="truncate">Fabrics</Txt>
                    <Txt className={`text-[10px] px-1.5 py-0.5 rounded-full font-black shrink-0 ${activeTab === 'fabrics' ? 'bg-white/20 text-white' : 'bg-white text-gray-700 shadow-2xs'}`}>
                        {fabrics.length}
                    </Txt>
                </Btn>

                <Btn onPress={() => {
        setActiveTab('garments');
        setSearchQuery('');
      }} className={`flex items-center justify-center gap-1 sm:gap-2 py-2.5 sm:py-3 px-1 sm:px-3 text-[11px] sm:text-xs font-bold rounded-xl transition-all duration-200 cursor-pointer min-w-0 ${activeTab === 'garments' ? 'bg-[#843D9B] text-white shadow-md shadow-[#843D9B]/25 font-black' : 'text-gray-600 hover:text-gray-900 hover:bg-white/60'}`}>
                    <I icon={Package} size={14} className="shrink-0" /> 
                    <Txt className="truncate">Garments</Txt>
                    <Txt className={`text-[10px] px-1.5 py-0.5 rounded-full font-black shrink-0 ${activeTab === 'garments' ? 'bg-white/20 text-white' : 'bg-white text-gray-700 shadow-2xs'}`}>
                        {garments.length}
                    </Txt>
                </Btn>
            </Box>

            {/* Search & Sub-filters */}
            <Box className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 items-stretch sm:items-center justify-between min-w-0">
                <Box className="relative flex-1 max-w-md w-full">
                    <I icon={Search} size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <Input placeholder={activeTab === 'samples' ? "Search services (e.g. Kurti, Blouse)..." : "Search products..."} value={searchQuery} onChangeText={e => setSearchQuery(e)} className="w-full pl-10 pr-4 py-2 sm:py-2.5 bg-white border border-gray-200/90 rounded-xl text-xs font-medium placeholder:text-gray-400 focus:outline-none focus:border-[#843D9B] focus:ring-2 focus:ring-[#843D9B]/10 shadow-xs transition-all" />
                </Box>

                {/* Service Filter Tabs (All / Active / Pending / Available) */}
                {activeTab === 'samples' && <Scroll contentClassName="flex p-1 gap-1" className="bg-gray-100/90 rounded-xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden shrink-0 max-w-full" horizontal>
                        <Btn onPress={() => setServiceFilter('all')} className={`px-3 py-1.5 rounded-lg transition-all shrink-0 text-xs font-bold cursor-pointer whitespace-nowrap ${serviceFilter === 'all' ? 'bg-white text-[#843D9B] shadow-xs' : 'text-gray-600 hover:text-gray-900'}`}>
                            All ({adminServiceCategories.length})
                        </Btn>
                        <Btn onPress={() => setServiceFilter('active')} className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shrink-0 text-xs font-bold cursor-pointer whitespace-nowrap ${serviceFilter === 'active' ? 'bg-white text-emerald-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'}`}>
                            <Txt>Active in Shop</Txt>
                            <Txt className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                                {activeServicesCount}
                            </Txt>
                        </Btn>
                        <Btn onPress={() => setServiceFilter('pending')} className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 shrink-0 text-xs font-bold cursor-pointer whitespace-nowrap ${serviceFilter === 'pending' ? 'bg-white text-amber-700 shadow-xs' : 'text-gray-600 hover:text-gray-900'}`}>
                            <Txt>Pending</Txt>
                            <Txt className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${pendingServicesCount > 0 ? 'bg-amber-200 text-amber-900' : 'bg-gray-200 text-gray-600'}`}>
                                {pendingServicesCount}
                            </Txt>
                        </Btn>
                        <Btn onPress={() => setServiceFilter('available')} className={`px-3 py-1.5 rounded-lg transition-all shrink-0 text-xs font-bold cursor-pointer whitespace-nowrap ${serviceFilter === 'available' ? 'bg-white text-[#843D9B] shadow-xs' : 'text-gray-600 hover:text-gray-900'}`}>
                            Available to Add ({Math.max(0, adminServiceCategories.length - offeredServicesCount)})
                        </Btn>
                    </Scroll>}
            </Box>

            {/* ═══ TAB 1: STITCHING SERVICES (Official Admin Catalog) ═══ */}
            {activeTab === 'samples' && <Box>
                    {isLoading ? <Box className="py-20 text-center">
                            <Spin size={32} className="text-[#843D9B]" />
                            <Txt className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading Platform Services...</Txt>
                        </Box> : filteredAdminServices.length === 0 ? <Box className="py-16 text-center bg-white rounded-3xl border border-dashed border-gray-200 p-8">
                            <I icon={Scissors} size={32} className="mx-auto text-gray-300 mb-3" />
                            <Txt className="text-sm font-bold text-gray-700">No Services Found</Txt>
                            <Txt className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                                {searchQuery ? `No services match "${searchQuery}". Try a different keyword.` : 'No service categories configured yet by Admin.'}
                            </Txt>
                        </Box> : <Box className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                            {filteredAdminServices.map(cat => {
          const myService = samples.find(s => (s.category?._id || s.category) === cat._id);
          const isOffered = Boolean(myService);
          const isActive = myService?.isActive !== false;
          const isPending = isOffered && myService?.status === 'pending';
          const isRejected = isOffered && myService?.status === 'rejected';
          const isApproved = isOffered && myService?.status === 'approved';
          return <Box key={cat._id} className={`group bg-white rounded-2xl sm:rounded-3xl border transition-all duration-300 flex flex-col overflow-hidden relative ${isOffered ? isPending ? 'border-amber-300 bg-amber-50/15 ring-1 ring-amber-400/40 shadow-sm' : isRejected ? 'border-red-300 bg-red-50/20 shadow-sm' : isActive ? 'border-emerald-200/80 shadow-md shadow-emerald-500/5 ring-1 ring-emerald-500/20' : 'border-gray-200 bg-gray-50/40' : 'border-gray-200/80 hover:border-[#843D9B]/50 hover:shadow-xl hover:-translate-y-1'}`}>
                                        {/* Top Image: Official Admin Photo */}
                                        <Box className="aspect-[16/10] bg-gray-100 relative overflow-hidden">
                                            <SafeImage src={cat.image || myService?.image} alt={cat.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />

                                            {/* Status Badge */}
                                            <Box className="absolute top-3 left-3 z-10">
                                                {isOffered ? isPending ? <Txt className="inline-flex items-center gap-1 bg-amber-500/95 backdrop-blur-md text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-md animate-pulse">
                                                            <I icon={Clock} size={12} strokeWidth={2.5} />
                                                            Pending Approval
                                                        </Txt> : isRejected ? <Txt className="inline-flex items-center gap-1 bg-red-600/95 backdrop-blur-md text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-md">
                                                            <I icon={X} size={12} strokeWidth={2.5} />
                                                            Rejected
                                                        </Txt> : isActive ? <Txt className="inline-flex items-center gap-1 bg-emerald-600/95 backdrop-blur-md text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-md">
                                                            <I icon={CheckCircle2} size={12} strokeWidth={3} />
                                                            Active in Shop
                                                        </Txt> : <Txt className="inline-flex items-center gap-1 bg-slate-700/95 backdrop-blur-md text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-md">
                                                            <I icon={PauseCircle} size={12} strokeWidth={2.5} />
                                                            Paused
                                                        </Txt> : <Txt className="inline-flex items-center gap-1 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md">
                                                        Not Offered
                                                    </Txt>}
                                            </Box>

                                            {/* Verified platform service icon */}
                                            <Box className="absolute top-3 right-3 z-10">
                                                <Txt className="h-7 w-7 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center text-[#843D9B] shadow-sm">
                                                    <I icon={ShieldCheck} size={16} />
                                                </Txt>
                                            </Box>
                                        </Box>

                                        {/* Card Body */}
                                        <Box className="p-4 flex-1 flex flex-col justify-between space-y-3">
                                            <Box>
                                                <Box className="flex items-center justify-between gap-2 mb-1">
                                                    <Txt className="text-[9px] font-black text-[#843D9B] uppercase tracking-wider">
                                                        {cat.gender ? `${cat.gender.toUpperCase()} WEAR` : 'CUSTOM STITCHING'}
                                                    </Txt>
                                                    {cat.styles && cat.styles.length > 0 && <Txt className="text-[9px] font-bold text-gray-400">
                                                            {cat.styles.length} Styles
                                                        </Txt>}
                                                </Box>

                                                <Txt className="text-base font-extrabold text-gray-900 tracking-tight leading-snug line-clamp-1 group-hover:text-[#843D9B] transition-colors">
                                                    {cat.name}
                                                </Txt>

                                                {cat.description && <Txt className="text-[11px] text-gray-500 font-medium line-clamp-2 mt-1 leading-relaxed">
                                                        {cat.description}
                                                    </Txt>}
                                            </Box>

                                            {/* Pending / Rejection Banner */}
                                            {isPending && <Box className="bg-amber-50 border border-amber-200/90 rounded-2xl p-2.5 text-[11px] text-amber-900 font-medium space-y-1">
                                                    <Box className="flex items-center gap-1.5 font-bold text-amber-800">
                                                        <I icon={Clock} size={13} className="text-amber-600 shrink-0" />
                                                        <Txt>Pending Admin Approval</Txt>
                                                    </Box>
                                                    <Txt className="text-[10px] text-amber-700 leading-snug">
                                                        Admin is reviewing your price & turnaround. Once approved, it will be visible on customer app.
                                                    </Txt>
                                                </Box>}

                                            {isRejected && <Box className="bg-red-50 border border-red-200 rounded-2xl p-2.5 text-[11px] text-red-900 font-medium space-y-1">
                                                    <Box className="flex items-center gap-1.5 font-bold text-red-800">
                                                        <I icon={AlertCircle} size={13} className="text-red-600 shrink-0" />
                                                        <Txt>Service Not Approved</Txt>
                                                    </Box>
                                                    <Txt className="text-[10px] text-red-700 leading-snug">
                                                        {myService.rejectionReason || "Please adjust your price or turnaround to meet platform requirements."}
                                                    </Txt>
                                                </Box>}

                                            {/* Pricing & Turnaround Section */}
                                            <Box className="pt-3 border-t border-gray-100 space-y-2.5">
                                                {isOffered ? <Box>
                                                        <Box className="flex items-baseline justify-between">
                                                            <Box>
                                                                <Txt className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">Your Price</Txt>
                                                                <Txt className="text-xl font-black text-[#843D9B] tracking-tight">
                                                                    ₹{myService.basePrice}
                                                                </Txt>
                                                            </Box>
                                                            <Box className="text-right">
                                                                <Txt className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">Turnaround</Txt>
                                                                <Txt className="text-xs font-bold text-gray-700 flex items-center gap-1 justify-end">
                                                                    <I icon={Clock} size={11} className="text-[#843D9B]" />
                                                                    {myService.deliveryTime || '3-5 DAYS'}
                                                                </Txt>
                                                            </Box>
                                                        </Box>

                                                        {cat.minPrice != null && cat.maxPrice != null && <Txt className="text-[9px] font-semibold text-gray-400 mt-1">
                                                                Allowed Band: ₹{cat.minPrice} – ₹{cat.maxPrice}
                                                            </Txt>}
                                                    </Box> : <Box>
                                                        <Box className="flex items-baseline justify-between">
                                                            <Box>
                                                                <Txt className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">Suggested Price</Txt>
                                                                <Txt className="text-lg font-black text-gray-900 tracking-tight">
                                                                    ₹{cat.basePrice || cat.minPrice || 499}
                                                                </Txt>
                                                            </Box>
                                                            {cat.minPrice != null && cat.maxPrice != null && <Box className="text-right">
                                                                    <Txt className="text-[9px] font-black text-gray-400 uppercase tracking-wider block">Price Range</Txt>
                                                                    <Txt className="text-xs font-bold text-gray-600">
                                                                        ₹{cat.minPrice} – ₹{cat.maxPrice}
                                                                    </Txt>
                                                                </Box>}
                                                        </Box>
                                                    </Box>}

                                                {/* Action Buttons */}
                                                {isOffered ? <Box className="flex items-center gap-2 pt-1">
                                                        {isPending ? (/* Pending: Show In-Review disabled badge + Edit & Delete */
                  <>
                                                                <Box className="flex-1 py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 bg-amber-100 text-amber-800 border border-amber-200">
                                                                    <I icon={Clock} size={13} className="text-amber-700 animate-spin" />
                                                                    <Txt>Under Review</Txt>
                                                                </Box>
                                                                <Btn onPress={() => handleOpenServiceModal(cat, myService)} className="p-2 rounded-xl bg-gray-50 hover:bg-[#843D9B] hover:text-white text-gray-600 transition-colors border border-gray-200 cursor-pointer shadow-xs">
                                                                    <I icon={Edit3} size={14} />
                                                                </Btn>
                                                                <Btn onPress={e => handleDeleteService(myService._id, cat.name, e)} className="p-2 rounded-xl bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 transition-colors border border-rose-100 cursor-pointer shadow-xs">
                                                                    <I icon={Trash2} size={14} />
                                                                </Btn>
                                                            </>) : isRejected ? (/* Rejected: Show Edit & Re-submit button + Delete */
                  <>
                                                                <Btn onPress={() => handleOpenServiceModal(cat, myService)} className="flex-1 py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 text-white transition-all cursor-pointer shadow-sm shadow-red-600/20 active:scale-95">
                                                                    <I icon={RotateCcw} size={13} />
                                                                    <Txt>Edit & Re-submit</Txt>
                                                                </Btn>
                                                                <Btn onPress={e => handleDeleteService(myService._id, cat.name, e)} className="p-2 rounded-xl bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 transition-colors border border-rose-100 cursor-pointer shadow-xs">
                                                                    <I icon={Trash2} size={14} />
                                                                </Btn>
                                                            </>) : (/* Approved: Toggle Pause / Resume + Edit + Delete */
                  <>
                                                                <Btn onPress={e => handleToggleService(myService._id, cat.name, e)} className={`flex-1 py-2 px-3 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer ${isActive ? 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'}`}>
                                                                    {isActive ? <I icon={PauseCircle} size={14} /> : <I icon={PlayCircle} size={14} />}
                                                                    <Txt>{isActive ? 'Pause' : 'Resume'}</Txt>
                                                                </Btn>
                                                                <Btn onPress={() => handleOpenServiceModal(cat, myService)} className="p-2 rounded-xl bg-gray-50 hover:bg-[#843D9B] hover:text-white text-gray-600 transition-colors border border-gray-200 cursor-pointer shadow-xs">
                                                                    <I icon={Edit3} size={14} />
                                                                </Btn>
                                                                <Btn onPress={e => handleDeleteService(myService._id, cat.name, e)} className="p-2 rounded-xl bg-rose-50 hover:bg-rose-600 hover:text-white text-rose-600 transition-colors border border-rose-100 cursor-pointer shadow-xs">
                                                                    <I icon={Trash2} size={14} />
                                                                </Btn>
                                                            </>)}
                                                    </Box> : <Btn onPress={() => handleOpenServiceModal(cat)} className="w-full py-2.5 px-4 bg-gradient-to-r from-[#843D9B] to-[#9E47BA] hover:from-[#732F87] hover:to-[#843D9B] text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md shadow-[#843D9B]/15 hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-95">
                                                        <I icon={Plus} size={15} strokeWidth={3} />
                                                        <Txt>Offer This Service</Txt>
                                                    </Btn>}
                                            </Box>
                                        </Box>
                                    </Box>;
        })}
                        </Box>}
                </Box>}

            {/* ═══ TAB 2 & 3: FABRICS & GARMENTS ═══ */}
            {activeTab !== 'samples' && <Box>
                    {isLoading ? <Box className="py-20 text-center">
                            <Spin size={32} className="text-[#843D9B]" />
                            <Txt className="text-xs font-bold text-gray-400 uppercase tracking-widest">Loading inventory...</Txt>
                        </Box> : filteredProducts.length === 0 ? <Box className="py-16 text-center bg-white rounded-3xl border border-dashed border-gray-200 p-8">
                            <I icon={ShoppingBag} size={32} className="mx-auto text-gray-300 mb-3" />
                            <Txt className="text-sm font-bold text-gray-700">No {activeTab === 'fabrics' ? 'Fabrics' : 'Garments'} Found</Txt>
                            <Txt className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
                                You haven't added any {activeTab === 'fabrics' ? 'fabrics' : 'garments'} to your shop yet.
                            </Txt>
                            <Btn onPress={() => {
          setIsEditing(false);
          setShowModal(true);
        }} className="mt-4 px-5 py-2.5 bg-[#843D9B] text-white text-xs font-bold rounded-xl shadow-md cursor-pointer hover:bg-[#6E3082] transition-colors">
                                + Add {activeTab === 'fabrics' ? 'Fabric' : 'Garment'}
                            </Btn>
                        </Box> : <Box className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-4 md:gap-6">
                            {filteredProducts.map(item => {
          const currentPrice = item.price || item.basePrice || 0;
          const originalPrice = item.discountPrice || item.originalPrice || 0;
          const isOutOfStock = item.stock <= 0;
          return <Btn key={item._id} onPress={() => handleEditFabric(item)} className="block group relative bg-white border border-gray-100/90 rounded-2xl sm:rounded-3xl overflow-hidden flex flex-col transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 shadow-2xs cursor-pointer">
                                        <Box className="aspect-[4/5] bg-gray-50 relative overflow-hidden">
                                            <SafeImage src={item.image || item.images?.[0]} alt={item.name || item.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                                            <Box className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1">
                                                {isOutOfStock ? <Txt className="bg-rose-500/90 text-white text-[8px] font-black px-1.5 sm:px-2 py-0.5 rounded-full shadow-md uppercase tracking-wider">
                                                        Out of Stock
                                                    </Txt> : <Txt className="bg-emerald-500/90 text-white text-[8px] font-black px-1.5 sm:px-2 py-0.5 rounded-full shadow-md uppercase tracking-wider">
                                                        In Stock
                                                    </Txt>}
                                            </Box>
                                        </Box>

                                        <Box className="p-3 sm:p-4 flex-1 flex flex-col justify-between">
                                            <Box>
                                                <Txt className="text-[9px] text-[#843D9B] uppercase tracking-wider font-extrabold truncate block mb-0.5">
                                                    {item.category?.name || 'General'}
                                                </Txt>
                                                <Txt className="text-xs sm:text-sm font-extrabold text-gray-900 line-clamp-1 tracking-tight group-hover:text-[#843D9B] transition-colors">
                                                    {item.name || item.title}
                                                </Txt>
                                                <Txt className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1 flex items-center gap-1">
                                                    <I icon={Package} size={11} className="text-[#843D9B] shrink-0" /> 
                                                    <Txt>{item.stock || 0} {activeTab === 'fabrics' ? 'M Available' : 'In Stock'}</Txt>
                                                </Txt>
                                            </Box>

                                            <Box className="mt-2.5 pt-2.5 sm:mt-3 sm:pt-3 border-t border-gray-100 flex items-center justify-between gap-1">
                                                <Box className="min-w-0">
                                                    <Txt className="text-[8px] font-black text-gray-400 uppercase tracking-wider block">Price</Txt>
                                                    <Txt className="text-sm sm:text-base font-black text-[#843D9B] truncate block">
                                                        ₹{currentPrice.toLocaleString()}
                                                    </Txt>
                                                </Box>
                                                <Box className="flex items-center gap-1 shrink-0">
                                                    <Btn onPress={e => {
                    handleEditFabric(item);
                  }} className="h-7 w-7 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-[#843D9B] hover:text-white transition-colors border border-gray-200 cursor-pointer">
                                                        <I icon={Edit3} size={12} />
                                                    </Btn>
                                                    <Btn onPress={e => {
                    handleDeleteProduct(item._id, activeTab);
                  }} className="h-7 w-7 rounded-lg bg-rose-50 flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-colors border border-rose-100 cursor-pointer">
                                                        <I icon={Trash2} size={12} />
                                                    </Btn>
                                                </Box>
                                            </Box>
                                        </Box>
                                    </Btn>;
        })}
                        </Box>}
                </Box>}

            {/* ═══ DIALOG: OFFER / CONFIGURE STITCHING SERVICE ═══ */}
            {/* Tailor sets ONLY price and delivery days. Photo & Title are from Admin Category. */}
            {serviceModalOpen && selectedAdminCategory && <Dialog visible={!!(serviceModalOpen && selectedAdminCategory)} onClose={() => setServiceModalOpen(false)} className={`bg-white w-full max-w-xl rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[90vh]`}>
<Box className="flex-shrink flex flex-col overflow-hidden">
                        
                        {/* Header Banner with Admin Official Photo & Title */}
                        <Box className="relative bg-gradient-to-br from-[#843D9B] to-[#5C236E] text-white p-4 sm:p-6">
                            <Btn onPress={handleCloseServiceModal} className="absolute top-3.5 right-3.5 sm:top-4 sm:right-4 h-8 w-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-colors cursor-pointer">
                                <I icon={X} size={18} />
                            </Btn>

                            <Box className="flex items-center gap-3 sm:gap-4">
                                <Box className="h-14 w-14 sm:h-16 sm:w-16 rounded-xl sm:rounded-2xl bg-white/10 border border-white/20 overflow-hidden shrink-0 shadow-inner">
                                    <SafeImage src={selectedAdminCategory.image} alt={selectedAdminCategory.name} className="w-full h-full object-cover" />
                                </Box>
                                <Box className="flex-1 min-w-0 pr-6">
                                    <Box className="inline-flex items-center gap-1 bg-white/20 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full mb-1">
                                        <I icon={ShieldCheck} size={11} />
                                        Official Platform Service
                                    </Box>
                                    <Txt className="text-lg sm:text-xl font-black text-white tracking-tight leading-snug truncate">
                                        {selectedAdminCategory.name}
                                    </Txt>
                                    <Txt className="text-xs text-white/80 line-clamp-1 mt-0.5">
                                        {selectedAdminCategory.description || 'Custom tailoring service for your shop'}
                                    </Txt>
                                </Box>
                            </Box>
                        </Box>

                        {/* Notice for Tailor */}
                        <Box className="px-4 sm:px-6 py-2.5 bg-[#F4EFFF] border-b border-[#E9DFFE] flex items-center gap-2">
                            <Txt className="text-xs">🛡️</Txt>
                            <Txt className="text-[11px] font-semibold text-[#843D9B] leading-tight">
                                Admin Approval Workflow: Once you submit your price, the request goes to Admin for review. Once approved, it will be visible to customers.
                            </Txt>
                        </Box>

                        {/* Form Body */}
                        <Scroll contentClassName="p-4 space-y-4" className="sm:p-6 sm:space-y-5 custom-scrollbar flex-1" nestedScrollEnabled>
                            
                            {/* 1. Stitching Price Input with Strict Admin Min-Max Bounds */}
                            {(() => {
            const price = Number(serviceForm.basePrice);
            const isBelowMin = selectedAdminCategory.minPrice != null && price && price < selectedAdminCategory.minPrice;
            const isAboveMax = selectedAdminCategory.maxPrice != null && price && price > selectedAdminCategory.maxPrice;
            const isOutOfRange = isBelowMin || isAboveMax;
            return <Box className="space-y-1.5">
                                        <Box className="flex justify-between items-center">
                                            <Txt className="text-xs font-black text-gray-800 uppercase tracking-wide">
                                                Your Stitching Price (₹) *
                                            </Txt>
                                            {selectedAdminCategory.minPrice != null && selectedAdminCategory.maxPrice != null && <Txt className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${isOutOfRange ? 'bg-red-50 text-red-600 border border-red-200' : 'text-[#843D9B] bg-[#843D9B]/10'}`}>
                                                    Allowed: ₹{selectedAdminCategory.minPrice} – ₹{selectedAdminCategory.maxPrice}
                                                </Txt>}
                                        </Box>

                                        <Box className="relative">
                                            <Txt className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-black text-base">₹</Txt>
                                            <Input value={serviceForm.basePrice} onChangeText={e => setServiceForm({
                  ...serviceForm,
                  basePrice: e
                })} placeholder={String(selectedAdminCategory.basePrice || selectedAdminCategory.minPrice || '499')} className={`w-full pl-9 pr-4 py-3 bg-gray-50 border rounded-2xl text-base font-extrabold text-gray-900 focus:bg-white focus:outline-none transition-all shadow-xs ${isOutOfRange ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-500/15' : 'border-gray-200 focus:border-[#843D9B] focus:ring-2 focus:ring-[#843D9B]/15'}`} keyboardType="numeric" />
                                        </Box>

                                        {/* Real-time Range Status Banner */}
                                        {isBelowMin && <Txt className="text-[11px] font-bold text-red-600 bg-red-50 p-2 rounded-xl border border-red-100 flex items-center gap-1.5 mt-1">
                                                <Txt>⚠️</Txt>
                                                <Txt>Price cannot be lower than ₹{selectedAdminCategory.minPrice} (Admin minimum limit).</Txt>
                                            </Txt>}
                                        {isAboveMax && <Txt className="text-[11px] font-bold text-red-600 bg-red-50 p-2 rounded-xl border border-red-100 flex items-center gap-1.5 mt-1">
                                                <Txt>⚠️</Txt>
                                                <Txt>Price cannot exceed ₹{selectedAdminCategory.maxPrice} (Admin maximum limit).</Txt>
                                            </Txt>}
                                        {!isOutOfRange && price > 0 && selectedAdminCategory.minPrice != null && selectedAdminCategory.maxPrice != null && <Txt className="text-[11px] font-bold text-emerald-700 bg-emerald-50 p-2 rounded-xl border border-emerald-100 flex items-center gap-1.5 mt-1">
                                                <Txt>✓</Txt>
                                                <Txt>Valid Price: ₹{price} is within the Admin allowed range (₹{selectedAdminCategory.minPrice} – ₹{selectedAdminCategory.maxPrice}).</Txt>
                                            </Txt>}
                                    </Box>;
          })()}

                            {/* 2. Estimated Turnaround / Delivery Days */}
                            <Box className="space-y-2">
                                <Txt className="text-xs font-black text-gray-800 uppercase tracking-wide">
                                    Estimated Stitching & Delivery Time *
                                </Txt>
                                <Box className="grid grid-cols-3 gap-2">
                                    {['2-3 DAYS', '3-5 DAYS', '5-7 DAYS'].map(preset => <Btn key={preset} onPress={() => setServiceForm({
                ...serviceForm,
                deliveryTime: preset
              })} className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${serviceForm.deliveryTime === preset ? 'bg-[#843D9B] text-white border-[#843D9B] shadow-sm' : 'bg-gray-50 text-gray-700 border-gray-200 hover:border-gray-300'}`}>
                                            {preset}
                                        </Btn>)}
                                </Box>
                                <Input value={serviceForm.deliveryTime} onChangeText={e => setServiceForm({
              ...serviceForm,
              deliveryTime: e
            })} placeholder="Or enter custom time (e.g. 4 DAYS)" className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-[#843D9B] transition-all" />
                            </Box>

                            {/* 3. Style Variants (If Category has Styles) */}
                            {selectedAdminCategory.styles && selectedAdminCategory.styles.length > 0 && <Box className="space-y-2.5 pt-2 border-t border-gray-100">
                                    <Box className="flex justify-between items-center">
                                        <Txt className="text-xs font-black text-gray-800 uppercase tracking-wide">
                                            Styles You Can Stitch
                                        </Txt>
                                        <Txt className="text-[10px] font-bold text-gray-400">
                                            {serviceForm.selectedStyles.length} of {selectedAdminCategory.styles.length} Selected
                                        </Txt>
                                    </Box>
                                    <Txt className="text-[11px] text-gray-500 font-medium">
                                        Uncheck any styles that you do not support for this garment:
                                    </Txt>

                                    <Box className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                                        {selectedAdminCategory.styles.map((style, idx) => {
                const isSelected = serviceForm.selectedStyles.some(s => (s.name || s) === style.name);
                return <Btn key={idx} onPress={() => {
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
                  setServiceForm({
                    ...serviceForm,
                    selectedStyles: newSel
                  });
                }} className={`block ${`p-2.5 rounded-2xl border cursor-pointer transition-all flex items-center gap-3 ${isSelected ? 'border-[#843D9B] bg-[#843D9B]/5 ring-1 ring-[#843D9B]/20 shadow-xs' : 'border-gray-200 bg-gray-50/50 hover:border-gray-300'}`}`}>
                                                    {style.image ? <Img src={style.image} alt={style.name} className="w-10 h-10 rounded-xl object-cover shrink-0" /> : <Box className="w-10 h-10 rounded-xl bg-purple-50 text-[#843D9B] flex items-center justify-center font-bold text-sm shrink-0">
                                                            ✂️
                                                        </Box>}
                                                    <Box className="flex-1 min-w-0">
                                                        <Txt className={`text-xs font-bold truncate ${isSelected ? 'text-[#843D9B]' : 'text-gray-900'}`}>
                                                            {style.name}
                                                        </Txt>
                                                        {style.description && <Txt className="text-[10px] text-gray-400 truncate">{style.description}</Txt>}
                                                    </Box>
                                                    <Box className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs shrink-0 ${isSelected ? 'bg-[#843D9B] border-[#843D9B] text-white' : 'border-gray-300 bg-white'}`}>
                                                        {isSelected && <I icon={Check} size={12} strokeWidth={3} />}
                                                    </Box>
                                                </Btn>;
              })}
                                    </Box>
                                </Box>}
                        </Scroll>

                        {/* Modal Footer with Strict Admin Price Range Guard */}
                        {(() => {
          const curPrice = Number(serviceForm.basePrice);
          const hasPrice = serviceForm.basePrice !== '' && !isNaN(curPrice) && curPrice > 0;
          const isBelowMin = selectedAdminCategory?.minPrice != null && hasPrice && curPrice < selectedAdminCategory.minPrice;
          const isAboveMax = selectedAdminCategory?.maxPrice != null && hasPrice && curPrice > selectedAdminCategory.maxPrice;
          const isPriceInvalid = !hasPrice || isBelowMin || isAboveMax;
          return <Box className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                                    <Box className="text-[11px] font-bold">
                                        {isBelowMin ? <Txt className="text-red-600 flex items-center gap-1.5">
                                                <Txt>⚠️</Txt> Below Min limit (Min: ₹{selectedAdminCategory.minPrice})
                                            </Txt> : isAboveMax ? <Txt className="text-red-600 flex items-center gap-1.5">
                                                <Txt>⚠️</Txt> Exceeds Max limit (Max: ₹{selectedAdminCategory.maxPrice})
                                            </Txt> : !hasPrice ? <Txt className="text-gray-400">
                                                Enter price {selectedAdminCategory?.minPrice != null ? `(₹${selectedAdminCategory.minPrice} - ₹${selectedAdminCategory.maxPrice || '∞'})` : ''}
                                            </Txt> : <Txt className="text-emerald-700 flex items-center gap-1.5">
                                                <Txt>✓</Txt> Price is within Admin allowed range
                                            </Txt>}
                                    </Box>
                                    <Box className="flex items-center gap-2 sm:gap-3 justify-end">
                                        <Btn onPress={handleCloseServiceModal} className="flex-1 sm:flex-none px-4 sm:px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer text-center">
                                            Cancel
                                        </Btn>
                                        <Btn onPress={handleSaveService} form="service-form" disabled={isSubmitting || isPriceInvalid} className="flex-1 sm:flex-none px-5 sm:px-6 py-2.5 bg-[#843D9B] hover:bg-[#6D2883] text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md shadow-[#843D9B]/20 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer text-center">
                                            {isSubmitting ? 'Submitting...' : editServiceId ? 'Save Changes' : 'Submit for Approval'}
                                        </Btn>
                                    </Box>
                                </Box>;
        })()}
                    </Box>
</Dialog>}

            {/* ═══ MODAL: FABRIC / READYMADE GARMENTS (Unchanged) ═══ */}
            {showModal && activeTab === 'garments' ? <GarmentForm initialData={isEditing ? garments.find(g => g._id === editId) : null} categories={categories.filter(c => c.type === 'product' && !c.parentCategory)} onClose={closeModal} onSubmitSuccess={() => {
      closeModal();
      fetchData();
    }} /> : showModal && <Dialog visible={!!(showModal)} onClose={closeModal} className={`bg-white w-full max-w-2xl rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[92vh] sm:max-h-[90vh]`}>
<Box className="flex-shrink flex flex-col overflow-hidden">
                        <Box className="p-4 sm:p-6 border-b border-gray-100 flex items-center justify-between">
                            <Box>
                                <Txt className="text-lg sm:text-xl font-black text-[#843D9B]">
                                    {isEditing ? 'Update' : 'Add New'} Fabric
                                </Txt>
                                <Txt className="text-xs text-gray-400 mt-0.5">List your available fabric materials</Txt>
                            </Box>
                            <Btn onPress={closeModal} className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 cursor-pointer">
                                <I icon={X} size={16} />
                            </Btn>
                        </Box>

                        <Scroll contentClassName="p-4 space-y-4" className="sm:p-6 custom-scrollbar flex-1" nestedScrollEnabled>
                            <Box>
                                <Txt className="text-xs font-bold text-gray-700 block mb-1">Fabric Category *</Txt>
                                <Select value={selectedParent} onChange={e => {
              setSelectedParent(e);
              setNewItem({
                ...newItem,
                category: ''
              });
            }} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#843D9B]" placeholder="Select Fabric Type" options={[{ value: '', label: 'Select Fabric Type' }, ...categories.filter(c => c.type === 'product' && !c.parentCategory).map(c => ({ value: c._id, label: c.name }))]} />
                            </Box>

                            {selectedParent && subcategories.length > 0 && <Box>
                                    <Txt className="text-xs font-bold text-gray-700 block mb-1">Sub-Material *</Txt>
                                    <Select value={newItem.category} onChange={e => setNewItem({
              ...newItem,
              category: e
            })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#843D9B]" placeholder="Select Material" options={[{ value: '', label: 'Select Material' }, ...subcategories.map(c => ({ value: c._id, label: c.name }))]} />
                                </Box>}

                            <Box>
                                <Txt className="text-xs font-bold text-gray-700 block mb-1">Fabric Name *</Txt>
                                <Input placeholder="e.g. Pure Chanderi Silk" value={newItem.name} onChangeText={e => setNewItem({
              ...newItem,
              name: e
            })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#843D9B]" />
                            </Box>

                            <Box className="grid grid-cols-2 gap-3">
                                <Box>
                                    <Txt className="text-xs font-bold text-gray-700 block mb-1">Price / Meter (₹) *</Txt>
                                    <Input value={newItem.price} onChangeText={e => setNewItem({
                ...newItem,
                price: e
              })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#843D9B]" keyboardType="numeric" />
                                </Box>
                                <Box>
                                    <Txt className="text-xs font-bold text-gray-700 block mb-1">Available Stock (Meters) *</Txt>
                                    <Input value={newItem.stock} onChangeText={e => setNewItem({
                ...newItem,
                stock: e
              })} className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#843D9B]" keyboardType="numeric" />
                                </Box>
                            </Box>

                            <Box>
                                <Txt className="text-xs font-bold text-gray-700 block mb-1">Fabric Photo *</Txt>
                                <Box className="flex items-center gap-4 p-3 bg-gray-50 rounded-2xl border border-gray-200">
                                    <Box className="h-16 w-16 rounded-xl bg-white border border-gray-200 overflow-hidden shrink-0 flex items-center justify-center">
                                        {newItem.image ? <Img src={newItem.image} alt="Preview" className="w-full h-full object-cover" /> : <I icon={ShoppingBag} size={20} className="text-gray-300" />}
                                    </Box>
                                    <Box className="flex-1">
                                        <Box className="flex items-center gap-3">
                                            <Btn onPress={handleImageUpload} disabled={isImageUploading} className="py-1.5 px-3 rounded-lg bg-[#843D9B] disabled:opacity-50">
                                                <Txt className="text-xs font-bold text-white">Choose File</Txt>
                                            </Btn>
                                            <Txt className="text-xs text-gray-500">{isImageUploading ? 'Uploading...' : 'No file chosen'}</Txt>
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>
                        </Scroll>

                        <Box className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                            <Btn onPress={closeModal} className="px-5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-600">
                                Cancel
                            </Btn>
                            <Btn onPress={handleFabricSubmit} form="fabric-form" disabled={isSubmitting} className="px-6 py-2 bg-[#843D9B] text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-md hover:bg-[#6D2883]">
                                {isSubmitting ? 'Saving...' : 'Save Fabric'}
                            </Btn>
                        </Box>
                    </Box>
</Dialog>}
        </Box>;
};
export default Products;
