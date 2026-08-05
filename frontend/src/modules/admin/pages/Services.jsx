import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, MoreHorizontal, X, Tag, Clock, CheckCircle2, Package, Plus, Edit2, Trash2, Eye, ShieldCheck, Mail, Phone, MapPin, User, Check, Layers } from 'lucide-react';
import api from '../../../utils/api';
import { toast } from 'react-hot-toast';

const AdminServices = () => {
    const [selectedTab, setSelectedTab] = useState('Stitching Categories');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [categoriesData, setCategoriesData] = useState([]);
    const [tailorServices, setTailorServices] = useState([]);
    const [pendingServices, setPendingServices] = useState([]);
    const [pendingProducts, setPendingProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [newService, setNewService] = useState({ title: '', price: '', minPrice: '', maxPrice: '', deliveryTime: '', description: '', type: 'service', gender: 'all', image: 'https://cdn-icons-png.flaticon.com/128/9284/9284227.png' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isImageUploading, setIsImageUploading] = useState(false);
    const [viewingDetailItem, setViewingDetailItem] = useState(null); // { item, itemType: 'service'|'product', isPending: boolean }
    const [detailRejectReason, setDetailRejectReason] = useState('');

    const tabs = ['Stitching Categories', 'Tailor Services', 'Pending Approvals', 'Pricing & Commissions'];

    const [platformSettings, setPlatformSettings] = useState({
        stitchingCommission: 15,
        readymadeCommission: 10,
        basePickupFee: 40,
        perKmCharge: 8
    });

    const fetchCategories = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/admin/categories?type=service');
            setCategoriesData(res.data.data);
        } catch (error) {
            if (error?.name === 'CanceledError' || error?.message?.toLowerCase().includes('cancel')) return;
            console.error('Failed to fetch categories:', error);
            toast.error('Failed to load categories');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchTailorServices = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/services');
            setTailorServices(res.data.data);
        } catch (error) {
            if (error?.name === 'CanceledError' || error?.message?.toLowerCase().includes('cancel')) return;
            console.error('Failed to fetch tailor services:', error);
            toast.error('Failed to load tailor services');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchPendingServices = async () => {
        setIsLoading(true);
        try {
            const [svcRes, prodRes] = await Promise.all([
                api.get('/admin/tailors/services/pending'),
                api.get('/admin/tailors/products/pending'),
            ]);
            setPendingServices(svcRes.data.data);
            setPendingProducts(prodRes.data.data);
        } catch (error) {
            if (error?.name === 'CanceledError' || error?.message?.toLowerCase().includes('cancel')) return;
            console.error('Failed to fetch pending approvals:', error);
            toast.error('Failed to load pending approvals');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchSettings = async () => {
        try {
            const res = await api.get('/admin/settings');
            if (res.data?.data) {
                const s = res.data.data;
                setPlatformSettings({
                    stitchingCommission: s.walletConfig?.platformFeePercentage ?? s.commissions?.stitchingPercentage ?? 15,
                    readymadeCommission: s.commissions?.readymadePercentage ?? 10,
                    basePickupFee: s.deliveryRates?.baseFee ?? 40,
                    perKmCharge: s.deliveryRates?.perKmRate ?? 8
                });
            }
        } catch (error) {
            if (error?.name === 'CanceledError' || error?.message?.toLowerCase().includes('cancel')) return;
            console.error('Failed to fetch settings:', error);
        }
    };

    useEffect(() => {
        if (selectedTab === 'Stitching Categories') {
            fetchCategories();
        } else if (selectedTab === 'Tailor Services') {
            fetchTailorServices();
        } else if (selectedTab === 'Pending Approvals') {
            fetchPendingServices();
        } else if (selectedTab === 'Pricing & Commissions') {
            fetchSettings();
        }
    }, [selectedTab]);

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);

        setIsImageUploading(true);
        try {
            const res = await api.post('/upload', formData);
            setNewService({ ...newService, image: res.data.data });
            toast.success('Image uploaded successfully');
        } catch (error) {
            if (error?.name === 'CanceledError' || error?.message?.toLowerCase().includes('cancel')) return;
            console.error('Upload failed:', error);
            toast.error('Image upload failed');
        } finally {
            setIsImageUploading(false);
        }
    };

    const handleEditImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file || !editingCategory) return;

        const formData = new FormData();
        formData.append('image', file);

        setIsImageUploading(true);
        try {
            const res = await api.post('/upload', formData);
            setEditingCategory({ ...editingCategory, image: res.data.data });
            toast.success('Image uploaded successfully');
        } catch (error) {
            if (error?.name === 'CanceledError' || error?.message?.toLowerCase().includes('cancel')) return;
            console.error('Upload failed:', error);
            toast.error('Image upload failed');
        } finally {
            setIsImageUploading(false);
        }
    };

    const handleEditSetting = async (key, currentVal, title) => {
        const inputVal = window.prompt(`Enter new value for ${title}:`, currentVal);
        if (inputVal === null || inputVal.trim() === '') return;
        const numVal = Number(inputVal);
        if (isNaN(numVal) || numVal < 0) {
            return toast.error('Value must be a valid non-negative number');
        }

        try {
            let payload = {};
            if (key === 'stitchingCommission') {
                payload = { walletConfig: { platformFeePercentage: numVal }, commissions: { stitchingPercentage: numVal } };
            } else if (key === 'readymadeCommission') {
                payload = { commissions: { readymadePercentage: numVal } };
            } else if (key === 'basePickupFee') {
                payload = { deliveryRates: { baseFee: numVal } };
            } else if (key === 'perKmCharge') {
                payload = { deliveryRates: { perKmRate: numVal } };
            }
            await api.put('/admin/settings', payload);
            toast.success(`${title} updated successfully`);
            fetchSettings();
        } catch (error) {
            if (error?.name === 'CanceledError' || error?.message?.toLowerCase().includes('cancel')) return;
            console.error('Failed to update setting:', error);
            toast.error('Failed to update setting');
        }
    };

    const handleEditTailorService = async (service) => {
        const inputVal = window.prompt(`Edit Base Price for "${service.title}":`, service.basePrice || service.price || 0);
        if (inputVal === null || inputVal.trim() === '') return;
        const numVal = Number(inputVal);
        if (isNaN(numVal) || numVal < 0) {
            return toast.error('Base price cannot be negative');
        }
        try {
            await api.put(`/services/${service._id}`, { basePrice: numVal, status: 'approved', isActive: true });
            toast.success('Service updated successfully');
            fetchTailorServices();
        } catch (error) {
            if (error?.name === 'CanceledError' || error?.message?.toLowerCase().includes('cancel')) return;
            console.error('Failed to update service:', error);
            toast.error('Failed to update service');
        }
    };

    const handleAddService = async () => {
        if (!newService.title || newService.price === '' || newService.price === null || newService.price === undefined) {
            return toast.error('Please fill all required fields');
        }
        if (Number(newService.price) < 0) {
            return toast.error('Base price cannot be negative');
        }
        const minP = newService.minPrice !== '' ? Number(newService.minPrice) : null;
        const maxP = newService.maxPrice !== '' ? Number(newService.maxPrice) : null;
        if (minP !== null && minP < 0) return toast.error('Minimum price cannot be negative');
        if (maxP !== null && maxP < 0) return toast.error('Maximum price cannot be negative');
        if (minP !== null && maxP !== null && maxP < minP) return toast.error('Maximum price must be ≥ minimum price');
        if ((minP !== null && maxP === null) || (minP === null && maxP !== null)) return toast.error('Please set both min and max price, or leave both empty');
        setIsSubmitting(true);
        try {
            const payload = {
                name: newService.title,
                basePrice: Number(newService.price),
                deliveryTime: newService.deliveryTime,
                description: newService.description,
                image: newService.image,
                type: newService.type || 'service',
                gender: newService.gender || 'all'
            };
            if (minP !== null) payload.minPrice = minP;
            if (maxP !== null) payload.maxPrice = maxP;
            await api.post('/admin/categories', payload);
            toast.success('Category added successfully');
            setIsAddModalOpen(false);
            setNewService({ title: '', price: '', minPrice: '', maxPrice: '', deliveryTime: '', description: '', type: 'service', gender: 'all', image: 'https://cdn-icons-png.flaticon.com/128/9284/9284227.png' });
            fetchCategories();
        } catch (error) {
            if (error?.name === 'CanceledError' || error?.message?.toLowerCase().includes('cancel')) return;
            console.error('Failed to add service:', error);
            toast.error(error.response?.data?.message || 'Failed to add category');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditService = async () => {
        if (!editingCategory || !editingCategory.name || editingCategory.basePrice === '' || editingCategory.basePrice === null || editingCategory.basePrice === undefined) {
            return toast.error('Please fill all required fields');
        }
        if (Number(editingCategory.basePrice) < 0) {
            return toast.error('Base price cannot be negative');
        }
        const minP = editingCategory.minPrice !== '' ? Number(editingCategory.minPrice) : null;
        const maxP = editingCategory.maxPrice !== '' ? Number(editingCategory.maxPrice) : null;
        if (minP !== null && minP < 0) return toast.error('Minimum price cannot be negative');
        if (maxP !== null && maxP < 0) return toast.error('Maximum price cannot be negative');
        if (minP !== null && maxP !== null && maxP < minP) return toast.error('Maximum price must be ≥ minimum price');
        if ((minP !== null && maxP === null) || (minP === null && maxP !== null)) return toast.error('Please set both min and max price, or leave both empty');
        setIsSubmitting(true);
        try {
            const payload = {
                name: editingCategory.name,
                basePrice: Number(editingCategory.basePrice),
                deliveryTime: editingCategory.deliveryTime,
                description: editingCategory.description,
                image: editingCategory.image,
                minPrice: minP,
                maxPrice: maxP,
            };
            await api.put(`/admin/categories/${editingCategory._id}`, payload);
            toast.success('Category updated successfully');
            setIsEditModalOpen(false);
            setEditingCategory(null);
            fetchCategories();
        } catch (error) {
            if (error?.name === 'CanceledError' || error?.message?.toLowerCase().includes('cancel')) return;
            console.error('Failed to edit category:', error);
            toast.error(error.response?.data?.message || 'Failed to update category');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteService = async (id) => {
        if (!window.confirm('Delete this category?')) return;
        try {
            await api.delete(`/admin/categories/${id}`);
            toast.success('Category deleted');
            fetchCategories();
        } catch (error) {
            if (error?.name === 'CanceledError' || error?.message?.toLowerCase().includes('cancel')) return;
            console.error('Failed to delete service:', error);
            toast.error('Failed to delete category');
        }
    };

    const handleApproveService = async (id) => {
        try {
            await api.patch(`/admin/tailors/services/${id}/approve`);
            toast.success('Service approved');
            if (viewingDetailItem) setViewingDetailItem(null);
            fetchPendingServices();
        } catch (error) {
            toast.error('Failed to approve service');
        }
    };

    const handleRejectService = async (id, customReason = null) => {
        let reason = customReason;
        if (reason === null) {
            reason = window.prompt("Enter reason for rejection:");
            if (reason === null) return;
        }
        try {
            await api.patch(`/admin/tailors/services/${id}/reject`, { reason });
            toast.success('Service rejected');
            if (viewingDetailItem) setViewingDetailItem(null);
            fetchPendingServices();
        } catch (error) {
            toast.error('Failed to reject service');
        }
    };

    const handleApproveProduct = async (id) => {
        try {
            await api.patch(`/admin/tailors/products/${id}/approve`);
            toast.success('Product approved');
            if (viewingDetailItem) setViewingDetailItem(null);
            fetchPendingServices();
        } catch (error) {
            toast.error('Failed to approve product');
        }
    };

    const handleRejectProduct = async (id, customReason = null) => {
        let reason = customReason;
        if (reason === null) {
            reason = window.prompt("Enter reason for rejection:");
            if (reason === null) return;
        }
        try {
            await api.patch(`/admin/tailors/products/${id}/reject`, { reason });
            toast.success('Product rejected');
            if (viewingDetailItem) setViewingDetailItem(null);
            fetchPendingServices();
        } catch (error) {
            toast.error('Failed to reject product');
        }
    };

    const filteredCategories = categoriesData.filter(s => 
        (s.name || s.title || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredTailorServices = tailorServices.filter(s => 
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.tailor?.shopName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const servicesByCategory = filteredTailorServices.reduce((acc, curr) => {
        const catName = curr.category?.name || 'Uncategorized';
        if (!acc[catName]) acc[catName] = [];
        acc[catName].push(curr);
        return acc;
    }, {});

    return (
        <div className="h-full flex flex-col space-y-6 relative">
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Service & Pricing Control</h1>
                    <p className="text-xs text-gray-500 font-medium mt-1">Manage stitching categories, base prices, and platform rules</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-xs font-black rounded-xl hover:bg-primary-dark shadow-lg shadow-green-900/20 transition-all uppercase tracking-widest"
                >
                    <Plus size={16} /> Add Category
                </button>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex bg-gray-50 p-1 rounded-xl w-full sm:w-auto overflow-x-auto no-scrollbar">
                    {tabs.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setSelectedTab(tab)}
                            className={`px-4 py-2 text-xs font-bold rounded-lg whitespace-nowrap transition-all flex items-center gap-2 ${selectedTab === tab ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                            type="text" 
                            placeholder="Search services..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-xs font-semibold bg-gray-50 border border-transparent focus:border-gray-200 rounded-xl outline-none transition-all" 
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex-1 overflow-hidden flex flex-col">
                {selectedTab === 'Stitching Categories' ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left whitespace-nowrap">
                            <thead>
                                <tr className="bg-gray-50/50 text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em] border-b border-gray-100">
                                    <th className="px-6 py-4">Service Details</th>
                                    <th className="px-6 py-4">Price Range</th>
                                    <th className="px-6 py-4">Est. Delivery</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredCategories.map((service) => (
                                    <tr
                                        key={service._id}
                                        className="hover:bg-primary/5 transition-colors group"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center relative">
                                                    <img src={service.image || 'https://cdn-icons-png.flaticon.com/128/9284/9284227.png'} alt={service.name} className="w-full h-full object-cover" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-black text-gray-900">{service.name}</span>
                                                    <span className="text-[10px] text-gray-400 font-medium group-hover:text-gray-600 line-clamp-1 max-w-[200px]">
                                                        {service.description}
                                                    </span>
                                                    {service.productCount > 0 && (
                                                        <span className="mt-1 text-[9px] font-bold text-primary bg-indigo-50 px-1.5 py-0.5 rounded-md w-fit">
                                                            {service.productCount} Linked Products
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {service.minPrice != null && service.maxPrice != null ? (
                                                <span className="text-sm font-black text-primary">₹{service.minPrice} – ₹{service.maxPrice}</span>
                                            ) : (
                                                <span className="text-sm font-black text-primary">₹{service.basePrice || service.price || '—'}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
                                                <Clock size={14} className="text-gray-400" /> {service.deliveryTime || 'N/A'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 rounded-lg text-[9px] font-black border uppercase tracking-wider bg-green-100 text-green-700 border-green-200">
                                                Active
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button 
                                                    onClick={() => {
                                                        setEditingCategory({
                                                            _id: service._id,
                                                            name: service.name || service.title || '',
                                                            minPrice: service.minPrice ?? '',
                                                            maxPrice: service.maxPrice ?? '',
                                                            basePrice: service.basePrice ?? service.price ?? '',
                                                            deliveryTime: service.deliveryTime || '',
                                                            description: service.description || '',
                                                            image: service.image || 'https://cdn-icons-png.flaticon.com/128/9284/9284227.png'
                                                        });
                                                        setIsEditModalOpen(true);
                                                    }}
                                                    className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all border border-transparent"
                                                    title="Edit Category"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteService(service._id)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-transparent"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : selectedTab === 'Tailor Services' ? (
                    <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
                        {isLoading ? (
                            <div className="h-full flex items-center justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                            </div>
                        ) : Object.keys(servicesByCategory).length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2">
                                <Package size={48} className="opacity-20" />
                                <p className="text-sm font-bold">No services found</p>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {Object.entries(servicesByCategory).map(([category, services]) => (
                                    <div key={category} className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <Tag size={16} className="text-primary" />
                                            <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">{category}</h3>
                                            <div className="h-px bg-gray-100 flex-1"></div>
                                            <span className="text-[10px] font-bold text-gray-400">{services.length} Services</span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {services.map((service) => (
                                                <div 
                                                    key={service._id} 
                                                    onClick={() => setViewingDetailItem({ item: service, itemType: 'service', isPending: false })}
                                                    className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden cursor-pointer"
                                                >
                                                    <div className="flex gap-4">
                                                        <div className="h-16 w-16 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden shrink-0">
                                                            <img 
                                                                src={service.image || 'https://cdn-icons-png.flaticon.com/128/9284/9284227.png'} 
                                                                alt={service.title} 
                                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                                                                onError={(e) => e.target.src = 'https://cdn-icons-png.flaticon.com/128/9284/9284227.png'}
                                                            />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex justify-between items-start">
                                                                <h4 className="text-sm font-black text-gray-900 truncate pr-2">{service.title}</h4>
                                                                <div className="flex items-center gap-1.5 shrink-0">
                                                                    <span className="text-xs font-black text-primary">₹{service.basePrice || service.price}</span>
                                                                    <button 
                                                                        onClick={(e) => { e.stopPropagation(); handleEditTailorService(service); }}
                                                                        className="p-1 text-gray-400 hover:text-primary rounded-lg transition-colors cursor-pointer"
                                                                        title="Edit Base Price"
                                                                    >
                                                                        <Edit2 size={12} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 mt-1">
                                                                <div className="h-4 w-4 rounded-full bg-gray-100 flex items-center justify-center text-[8px] font-bold text-gray-500">
                                                                    {service.tailor?.shopName?.[0]}
                                                                </div>
                                                                <span className="text-[10px] font-bold text-gray-500 truncate">{service.tailor?.shopName}</span>
                                                            </div>
                                                            <div className="flex items-center justify-between gap-3 mt-3">
                                                                <div className="flex items-center gap-1 text-[9px] font-bold text-gray-400">
                                                                    <Clock size={12} /> {service.deliveryTime}
                                                                </div>
                                                                <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                                                                    <Eye size={10} /> Details
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                ) : selectedTab === 'Pending Approvals' ? (
                    <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
                        {isLoading ? (
                            <div className="h-full flex items-center justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                            </div>
                        ) : pendingServices.length === 0 && pendingProducts.length === 0 ? (
                            <motion.div className="h-full flex flex-col items-center justify-center text-gray-400 space-y-2">
                                <Package size={48} className="opacity-20" />
                                <p className="text-sm font-bold">No pending approvals</p>
                            </motion.div>
                        ) : (
                            <div className="space-y-10">
                                {pendingServices.length > 0 && (
                                    <div>
                                        <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-4">
                                            Stitching services ({pendingServices.length})
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {pendingServices.map((service) => (
                                    <div 
                                        key={service._id} 
                                        onClick={() => setViewingDetailItem({ item: service, itemType: 'service', isPending: true })}
                                        className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden flex flex-col justify-between cursor-pointer border-l-4 border-l-yellow-400"
                                    >
                                        <div className="flex gap-4 mb-4">
                                            <div className="h-16 w-16 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden shrink-0">
                                                <img 
                                                    src={service.image || 'https://cdn-icons-png.flaticon.com/128/9284/9284227.png'} 
                                                    alt={service.title} 
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                                                    onError={(e) => e.target.src = 'https://cdn-icons-png.flaticon.com/128/9284/9284227.png'}
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <h4 className="text-sm font-black text-gray-900 truncate pr-2 group-hover:text-primary transition-colors">{service.title}</h4>
                                                    <span className="text-xs font-black text-primary">₹{service.basePrice}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    <span className="text-[10px] font-bold text-gray-500 truncate">Tailor: {service.tailor?.shopName}</span>
                                                </div>
                                                <div className="flex items-center justify-between gap-3 mt-3">
                                                    <div className="flex items-center gap-1 text-[9px] font-bold text-gray-400">
                                                        <Clock size={12} /> {service.deliveryTime}
                                                    </div>
                                                    <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                                                        <Eye size={10} /> Full Details
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 pt-2 border-t border-gray-50" onClick={(e) => e.stopPropagation()}>
                                            <button 
                                                onClick={() => handleApproveService(service._id)}
                                                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black py-2 rounded-xl uppercase tracking-widest transition-colors shadow-sm cursor-pointer"
                                            >
                                                Approve
                                            </button>
                                            <button 
                                                onClick={() => handleRejectService(service._id)}
                                                className="flex-1 bg-red-500 hover:bg-red-600 text-white text-[10px] font-black py-2 rounded-xl uppercase tracking-widest transition-colors shadow-sm cursor-pointer"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    </div>
                                ))}
                                        </div>
                                    </div>
                                )}
                                {pendingProducts.length > 0 && (
                                    <div>
                                        <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 mb-4">
                                            Garments & fabrics ({pendingProducts.length})
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {pendingProducts.map((product) => (
                                                <div 
                                                    key={product._id} 
                                                    onClick={() => setViewingDetailItem({ item: product, itemType: 'product', isPending: true })}
                                                    className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all flex flex-col justify-between cursor-pointer border-l-4 border-l-indigo-400 group"
                                                >
                                                    <div className="flex gap-4 mb-4">
                                                        <div className="h-16 w-16 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden shrink-0">
                                                            <img
                                                                src={product.image || product.images?.[0] || 'https://cdn-icons-png.flaticon.com/128/9284/9284227.png'}
                                                                alt={product.name}
                                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                            />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="text-sm font-black text-gray-900 truncate group-hover:text-primary transition-colors">{product.name}</h4>
                                                            <span className="text-[9px] font-black uppercase text-indigo-600">
                                                                {product.productType === 'fabric' ? 'Fabric' : 'Garment'}
                                                            </span>
                                                            <p className="text-xs font-black text-primary mt-1">₹{product.price}</p>
                                                            <div className="flex items-center justify-between gap-2 mt-1">
                                                                <p className="text-[10px] text-gray-500 truncate">Tailor: {product.tailor?.shopName}</p>
                                                                <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md flex items-center gap-1">
                                                                    <Eye size={10} /> Details
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2 pt-2 border-t border-gray-50" onClick={(e) => e.stopPropagation()}>
                                                        <button
                                                            onClick={() => handleApproveProduct(product._id)}
                                                            className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white text-[10px] font-black py-2 rounded-xl uppercase transition-colors cursor-pointer"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() => handleRejectProduct(product._id)}
                                                            className="flex-1 bg-red-500 hover:bg-red-600 text-white text-[10px] font-black py-2 rounded-xl uppercase transition-colors cursor-pointer"
                                                        >
                                                            Reject
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="p-6 overflow-y-auto space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                                <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                                    <h3 className="text-sm font-black text-gray-900 tracking-tight">Platform Commission</h3>
                                    <p className="text-[10px] text-gray-500 font-medium mt-0.5">Global commission rates per order type</p>
                                </div>
                                <div className="p-5 space-y-4">
                                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                                        <div>
                                            <p className="text-xs font-bold text-gray-900">Stitching Services</p>
                                            <p className="text-[10px] text-gray-500 mt-0.5">Applied to tailor orders</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg font-black text-primary">{platformSettings.stitchingCommission}%</span>
                                            <button 
                                                onClick={() => handleEditSetting('stitchingCommission', platformSettings.stitchingCommission, 'Stitching Services Commission (%)')}
                                                className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
                                            >
                                                Edit
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                                        <div>
                                            <p className="text-xs font-bold text-gray-900">Readymade Store</p>
                                            <p className="text-[10px] text-gray-500 mt-0.5">Applied to marketplace vendors</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg font-black text-primary">{platformSettings.readymadeCommission}%</span>
                                            <button 
                                                onClick={() => handleEditSetting('readymadeCommission', platformSettings.readymadeCommission, 'Readymade Store Commission (%)')}
                                                className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
                                            >
                                                Edit
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden flex flex-col">
                                <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                                    <h3 className="text-sm font-black text-gray-900 tracking-tight">Delivery Charges</h3>
                                    <p className="text-[10px] text-gray-500 font-medium mt-0.5">Base rates for pickup and delivery</p>
                                </div>
                                <div className="p-5 space-y-4">
                                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                                        <div>
                                            <p className="text-xs font-bold text-gray-900">Base Pickup Fee</p>
                                            <p className="text-[10px] text-gray-500 mt-0.5">For first 5km</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg font-black text-gray-900">₹{platformSettings.basePickupFee}</span>
                                            <button 
                                                onClick={() => handleEditSetting('basePickupFee', platformSettings.basePickupFee, 'Base Pickup Fee (₹)')}
                                                className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
                                            >
                                                Edit
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                                        <div>
                                            <p className="text-xs font-bold text-gray-900">Per KM Charge</p>
                                            <p className="text-[10px] text-gray-500 mt-0.5">Beyond base distance</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg font-black text-gray-900">₹{platformSettings.perKmCharge}</span>
                                            <button 
                                                onClick={() => handleEditSetting('perKmCharge', platformSettings.perKmCharge, 'Per KM Charge (₹)')}
                                                className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
                                            >
                                                Edit
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <AnimatePresence>
                {isAddModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setIsAddModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <h2 className="text-lg font-black tracking-tight text-gray-900">Add New Category</h2>
                                <button onClick={() => setIsAddModalOpen(false)} className="p-2 bg-white border border-gray-200 text-gray-400 hover:text-gray-900 rounded-full transition-colors shadow-sm">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6 flex-1 overflow-y-auto space-y-5 custom-scrollbar">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1.5">Category Title</label>
                                    <input 
                                        type="text" 
                                        value={newService.title}
                                        onChange={e => setNewService({...newService, title: e.target.value})}
                                        placeholder="e.g. Designer Saree" 
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:border-primary transition-colors shadow-sm" 
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1.5">Target Audience / Filter Tag</label>
                                    <div className="space-y-2">
                                        <select
                                            value={['all', 'women', 'men', 'bridal', 'kids'].includes(newService.gender) ? newService.gender : 'custom'}
                                            onChange={e => {
                                                if (e.target.value === 'custom') {
                                                    setNewService({ ...newService, gender: '' });
                                                } else {
                                                    setNewService({ ...newService, gender: e.target.value });
                                                }
                                            }}
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:border-primary transition-colors shadow-sm cursor-pointer"
                                        >
                                            <option value="all">All / Unisex</option>
                                            <option value="women">Women</option>
                                            <option value="men">Men</option>
                                            <option value="bridal">Bridal</option>
                                            <option value="kids">Kids</option>
                                            <option value="custom">✍️ + Type Custom Tag (e.g. Indo-Western, Festive)...</option>
                                        </select>
                                        {(!['all', 'women', 'men', 'bridal', 'kids'].includes(newService.gender) || newService.gender === '') && (
                                            <input
                                                type="text"
                                                value={newService.gender}
                                                onChange={e => setNewService({ ...newService, gender: e.target.value })}
                                                placeholder="Enter custom filter tag (e.g. Indo-Western, Festive, Ethnic)"
                                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 outline-none focus:border-primary focus:bg-white transition-all shadow-sm"
                                            />
                                        )}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1.5">Suggested Price (₹)</label>
                                        <input 
                                            type="number" 
                                            min="0"
                                            onKeyDown={(e) => { if (e.key === '-') e.preventDefault(); }}
                                            value={newService.price}
                                            onChange={e => {
                                                const val = e.target.value;
                                                if (val !== '' && Number(val) < 0) {
                                                    toast.error('Base price cannot be negative');
                                                    return;
                                                }
                                                setNewService({...newService, price: val});
                                            }}
                                            placeholder="400" 
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:border-primary transition-colors shadow-sm" 
                                        />
                                        <p className="text-[9px] text-gray-400 font-medium mt-1">Default shown to tailors as hint</p>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1.5">Est. Delivery Time</label>
                                        <input 
                                            type="text" 
                                            value={newService.deliveryTime}
                                            onChange={e => setNewService({...newService, deliveryTime: e.target.value})}
                                            placeholder="3-5 days" 
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:border-primary transition-colors shadow-sm" 
                                        />
                                    </div>
                                </div>
                                <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-4 space-y-3">
                                    <p className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">Tailor Price Band</p>
                                    <p className="text-[10px] text-gray-500 font-medium -mt-1">Tailors must set their price within this range when creating services under this category.</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1.5">Min Price (₹)</label>
                                            <input 
                                                type="number" 
                                                min="0"
                                                onKeyDown={(e) => { if (e.key === '-') e.preventDefault(); }}
                                                value={newService.minPrice}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    if (val !== '' && Number(val) < 0) return;
                                                    setNewService({...newService, minPrice: val});
                                                }}
                                                placeholder="200" 
                                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:border-indigo-400 transition-colors shadow-sm" 
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1.5">Max Price (₹)</label>
                                            <input 
                                                type="number" 
                                                min="0"
                                                onKeyDown={(e) => { if (e.key === '-') e.preventDefault(); }}
                                                value={newService.maxPrice}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    if (val !== '' && Number(val) < 0) return;
                                                    setNewService({...newService, maxPrice: val});
                                                }}
                                                placeholder="1000" 
                                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:border-indigo-400 transition-colors shadow-sm" 
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1.5">Description</label>
                                    <textarea 
                                        rows={3} 
                                        value={newService.description}
                                        onChange={e => setNewService({...newService, description: e.target.value})}
                                        placeholder="Describe the service..." 
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:border-primary transition-colors shadow-sm resize-none"
                                    ></textarea>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1.5">Category Image</label>
                                    <div className="flex gap-4 items-center">
                                        <div className="h-16 w-16 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                                            <img src={newService.image} alt="Preview" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <div className="relative">
                                                <input 
                                                    type="file" 
                                                    accept="image/*"
                                                    onChange={handleImageUpload}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                                                    disabled={isImageUploading}
                                                />
                                                <div className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-500 flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
                                                    {isImageUploading ? (
                                                        <div className="w-4 h-4 border-2 border-primary border-t-transparent animate-spin rounded-full" />
                                                    ) : (
                                                        <Plus size={14} />
                                                    )}
                                                    {isImageUploading ? 'Uploading...' : 'Upload Image File'}
                                                </div>
                                            </div>
                                            <input 
                                                type="text" 
                                                value={newService.image}
                                                onChange={e => setNewService({...newService, image: e.target.value})}
                                                placeholder="Or paste IMAGE URL here..." 
                                                className="w-full px-4 py-2 bg-gray-50 border border-transparent rounded-lg text-[10px] font-medium text-gray-500 outline-none focus:bg-white focus:border-gray-200 transition-all" 
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                                <button onClick={() => setIsAddModalOpen(false)} className="px-6 py-3 bg-white border border-gray-200 text-gray-600 text-xs font-black rounded-xl hover:bg-gray-50 transition-colors uppercase tracking-widest">
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleAddService}
                                    disabled={isSubmitting}
                                    className="px-6 py-3 bg-primary text-white text-xs font-black rounded-xl hover:bg-primary-dark shadow-lg shadow-green-900/20 transition-all uppercase tracking-widest disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Saving...' : 'Save Category'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {isEditModalOpen && editingCategory && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => { setIsEditModalOpen(false); setEditingCategory(null); }}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <h2 className="text-lg font-black tracking-tight text-gray-900">Edit Category</h2>
                                <button onClick={() => { setIsEditModalOpen(false); setEditingCategory(null); }} className="p-2 bg-white border border-gray-200 text-gray-400 hover:text-gray-900 rounded-full transition-colors shadow-sm">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6 flex-1 overflow-y-auto space-y-5 custom-scrollbar">
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1.5">Category Title</label>
                                    <input 
                                        type="text" 
                                        value={editingCategory.name}
                                        onChange={e => setEditingCategory({...editingCategory, name: e.target.value})}
                                        placeholder="e.g. Designer Saree" 
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:border-primary transition-colors shadow-sm" 
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1.5">Target Audience / Filter Tag</label>
                                    <div className="space-y-2">
                                        <select
                                            value={['all', 'women', 'men', 'bridal', 'kids'].includes(editingCategory.gender) ? editingCategory.gender : 'custom'}
                                            onChange={e => {
                                                if (e.target.value === 'custom') {
                                                    setEditingCategory({ ...editingCategory, gender: '' });
                                                } else {
                                                    setEditingCategory({ ...editingCategory, gender: e.target.value });
                                                }
                                            }}
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:border-primary transition-colors shadow-sm cursor-pointer"
                                        >
                                            <option value="all">All / Unisex</option>
                                            <option value="women">Women</option>
                                            <option value="men">Men</option>
                                            <option value="bridal">Bridal</option>
                                            <option value="kids">Kids</option>
                                            <option value="custom">✍️ + Type Custom Tag (e.g. Indo-Western, Festive)...</option>
                                        </select>
                                        {(!['all', 'women', 'men', 'bridal', 'kids'].includes(editingCategory.gender) || editingCategory.gender === '') && (
                                            <input
                                                type="text"
                                                value={editingCategory.gender}
                                                onChange={e => setEditingCategory({ ...editingCategory, gender: e.target.value })}
                                                placeholder="Enter custom filter tag (e.g. Indo-Western, Festive, Ethnic)"
                                                className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold text-gray-900 outline-none focus:border-primary focus:bg-white transition-all shadow-sm"
                                            />
                                        )}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1.5">Suggested Price (₹)</label>
                                        <input 
                                            type="number" 
                                            min="0"
                                            onKeyDown={(e) => { if (e.key === '-') e.preventDefault(); }}
                                            value={editingCategory.basePrice}
                                            onChange={e => {
                                                const val = e.target.value;
                                                if (val !== '' && Number(val) < 0) {
                                                    toast.error('Base price cannot be negative');
                                                    return;
                                                }
                                                setEditingCategory({...editingCategory, basePrice: val});
                                            }}
                                            placeholder="400" 
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:border-primary transition-colors shadow-sm" 
                                        />
                                        <p className="text-[9px] text-gray-400 font-medium mt-1">Default shown to tailors as hint</p>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1.5">Est. Delivery Time</label>
                                        <input 
                                            type="text" 
                                            value={editingCategory.deliveryTime}
                                            onChange={e => setEditingCategory({...editingCategory, deliveryTime: e.target.value})}
                                            placeholder="3-5 days" 
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:border-primary transition-colors shadow-sm" 
                                        />
                                    </div>
                                </div>
                                <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-4 space-y-3">
                                    <p className="text-[10px] font-black uppercase text-indigo-600 tracking-widest">Tailor Price Band</p>
                                    <p className="text-[10px] text-gray-500 font-medium -mt-1">Tailors must set their price within this range when creating services under this category.</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1.5">Min Price (₹)</label>
                                            <input 
                                                type="number" 
                                                min="0"
                                                onKeyDown={(e) => { if (e.key === '-') e.preventDefault(); }}
                                                value={editingCategory.minPrice}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    if (val !== '' && Number(val) < 0) return;
                                                    setEditingCategory({...editingCategory, minPrice: val});
                                                }}
                                                placeholder="200" 
                                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:border-indigo-400 transition-colors shadow-sm" 
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1.5">Max Price (₹)</label>
                                            <input 
                                                type="number" 
                                                min="0"
                                                onKeyDown={(e) => { if (e.key === '-') e.preventDefault(); }}
                                                value={editingCategory.maxPrice}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    if (val !== '' && Number(val) < 0) return;
                                                    setEditingCategory({...editingCategory, maxPrice: val});
                                                }}
                                                placeholder="1000" 
                                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:border-indigo-400 transition-colors shadow-sm" 
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1.5">Description</label>
                                    <textarea 
                                        rows={3} 
                                        value={editingCategory.description}
                                        onChange={e => setEditingCategory({...editingCategory, description: e.target.value})}
                                        placeholder="Describe the service..." 
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:border-primary transition-colors shadow-sm resize-none"
                                    ></textarea>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1.5">Category Image</label>
                                    <div className="flex gap-4 items-center">
                                        <div className="h-16 w-16 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                                            <img src={editingCategory.image} alt="Preview" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1 space-y-2">
                                            <div className="relative">
                                                <input 
                                                    type="file" 
                                                    accept="image/*"
                                                    onChange={handleEditImageUpload}
                                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                                                    disabled={isImageUploading}
                                                />
                                                <div className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-500 flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
                                                    {isImageUploading ? (
                                                        <div className="w-4 h-4 border-2 border-primary border-t-transparent animate-spin rounded-full" />
                                                    ) : (
                                                        <Plus size={14} />
                                                    )}
                                                    {isImageUploading ? 'Uploading...' : 'Upload Image File'}
                                                </div>
                                            </div>
                                            <input 
                                                type="text" 
                                                value={editingCategory.image}
                                                onChange={e => setEditingCategory({...editingCategory, image: e.target.value})}
                                                placeholder="Or paste IMAGE URL here..." 
                                                className="w-full px-4 py-2 bg-gray-50 border border-transparent rounded-lg text-[10px] font-medium text-gray-500 outline-none focus:bg-white focus:border-gray-200 transition-all" 
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                                <button onClick={() => { setIsEditModalOpen(false); setEditingCategory(null); }} className="px-6 py-3 bg-white border border-gray-200 text-gray-600 text-xs font-black rounded-xl hover:bg-gray-50 transition-colors uppercase tracking-widest">
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleEditService}
                                    disabled={isSubmitting}
                                    className="px-6 py-3 bg-primary text-white text-xs font-black rounded-xl hover:bg-primary-dark shadow-lg shadow-green-900/20 transition-all uppercase tracking-widest disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Updating...' : 'Update Category'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Full Item Detail Modal */}
            <AnimatePresence>
                {viewingDetailItem && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-md z-50 flex items-center justify-center p-4"
                        onClick={() => setViewingDetailItem(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            {/* Modal Header */}
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-600 border border-indigo-100">
                                            {viewingDetailItem.itemType === 'service' ? 'Stitching Service' : (viewingDetailItem.item?.productType === 'fabric' ? 'Fabric' : 'Garment')}
                                        </span>
                                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border ${
                                            viewingDetailItem.item?.status === 'approved' || viewingDetailItem.item?.isActive
                                                ? 'bg-green-50 text-green-700 border-green-200'
                                                : viewingDetailItem.item?.status === 'rejected'
                                                ? 'bg-red-50 text-red-700 border-red-200'
                                                : 'bg-yellow-50 text-yellow-700 border-yellow-200'
                                        }`}>
                                            {viewingDetailItem.item?.status || (viewingDetailItem.item?.isActive ? 'active' : 'pending')}
                                        </span>
                                    </div>
                                    <h2 className="text-xl font-black tracking-tight text-gray-900 mt-1">
                                        {viewingDetailItem.item?.title || viewingDetailItem.item?.name}
                                    </h2>
                                </div>
                                <button
                                    onClick={() => setViewingDetailItem(null)}
                                    className="p-2 bg-white border border-gray-200 text-gray-400 hover:text-gray-900 rounded-full transition-colors shadow-sm cursor-pointer"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 flex-1 overflow-y-auto space-y-6 custom-scrollbar">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* Left: Image & Quick Specs */}
                                    <div className="space-y-4">
                                        <div className="aspect-square rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden relative shadow-sm">
                                            <img
                                                src={viewingDetailItem.item?.image || viewingDetailItem.item?.images?.[0] || 'https://cdn-icons-png.flaticon.com/128/9284/9284227.png'}
                                                alt=""
                                                className="w-full h-full object-cover"
                                                onError={(e) => e.target.src = 'https://cdn-icons-png.flaticon.com/128/9284/9284227.png'}
                                            />
                                        </div>

                                        {/* Price & Delivery Card */}
                                        <div className="bg-primary/5 border border-primary/10 rounded-2xl p-4 flex justify-between items-center">
                                            <div>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Listed Price</p>
                                                <p className="text-2xl font-black text-primary">₹{viewingDetailItem.item?.basePrice || viewingDetailItem.item?.price || 0}</p>
                                            </div>
                                            {viewingDetailItem.item?.deliveryTime && (
                                                <div className="text-right">
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Est. Delivery</p>
                                                    <p className="text-xs font-bold text-gray-800 flex items-center gap-1 justify-end mt-0.5">
                                                        <Clock size={12} className="text-primary" /> {viewingDetailItem.item?.deliveryTime}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right: Category, Tailor & Description Details */}
                                    <div className="space-y-4">
                                        {/* Category Info */}
                                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 space-y-2">
                                            <div className="flex items-center gap-2 text-xs font-black text-gray-700">
                                                <Tag size={14} className="text-primary" />
                                                Category: <span className="text-primary">{viewingDetailItem.item?.category?.name || 'Uncategorized'}</span>
                                            </div>
                                            {viewingDetailItem.item?.category?.minPrice != null && viewingDetailItem.item?.category?.maxPrice != null && (
                                                <div className="text-[10px] font-bold text-indigo-600 bg-indigo-50/80 px-2.5 py-1 rounded-lg w-fit">
                                                    Category Price Band: ₹{viewingDetailItem.item.category.minPrice} – ₹{viewingDetailItem.item.category.maxPrice}
                                                </div>
                                            )}
                                            {viewingDetailItem.item?.category?.basePrice != null && viewingDetailItem.item?.category?.minPrice == null && (
                                                <div className="text-[10px] font-bold text-gray-500">
                                                    Suggested Price: ₹{viewingDetailItem.item.category.basePrice}
                                                </div>
                                            )}
                                        </div>

                                        {/* Description */}
                                        <div>
                                            <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest mb-1">Description</h4>
                                            <p className="text-xs text-gray-700 font-medium leading-relaxed bg-white border border-gray-100 rounded-xl p-3">
                                                {viewingDetailItem.item?.description || 'No description provided.'}
                                            </p>
                                        </div>

                                        {/* Tailor Info */}
                                        <div className="bg-white border border-gray-100 rounded-2xl p-4 space-y-2.5 shadow-sm">
                                            <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Tailor Profile</h4>
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center font-bold text-gray-600 text-sm shrink-0 border border-gray-200">
                                                    {viewingDetailItem.item?.tailor?.shopName?.[0] || 'T'}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-black text-gray-900 truncate">
                                                        {viewingDetailItem.item?.tailor?.shopName || 'Tailor Shop'}
                                                    </p>
                                                    {viewingDetailItem.item?.tailor?.user?.name && (
                                                        <p className="text-[10px] text-gray-500 font-semibold flex items-center gap-1">
                                                            <User size={10} /> Owner: {viewingDetailItem.item.tailor.user.name}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            {(viewingDetailItem.item?.tailor?.user?.email || viewingDetailItem.item?.tailor?.user?.phone) && (
                                                <div className="pt-2 border-t border-gray-100 grid grid-cols-1 gap-1 text-[10px] font-medium text-gray-500">
                                                    {viewingDetailItem.item.tailor.user.email && (
                                                        <div className="flex items-center gap-1.5 truncate">
                                                            <Mail size={11} className="text-gray-400" /> {viewingDetailItem.item.tailor.user.email}
                                                        </div>
                                                    )}
                                                    {viewingDetailItem.item.tailor.user.phone && (
                                                        <div className="flex items-center gap-1.5 truncate">
                                                            <Phone size={11} className="text-gray-400" /> {viewingDetailItem.item.tailor.user.phone}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* Optional Rejection Reason Input inside modal */}
                                        {viewingDetailItem.isPending && (
                                            <div>
                                                <label className="block text-[10px] font-black uppercase text-red-500 tracking-widest mb-1">
                                                    Rejection Reason (Optional)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={detailRejectReason}
                                                    onChange={(e) => setDetailRejectReason(e.target.value)}
                                                    placeholder="Specify why if rejecting..."
                                                    className="w-full px-3 py-2 bg-red-50/50 border border-red-100 rounded-xl text-xs font-semibold text-gray-800 outline-none focus:border-red-300"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer / Actions */}
                            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between gap-3">
                                <button
                                    onClick={() => setViewingDetailItem(null)}
                                    className="px-6 py-3 bg-white border border-gray-200 text-gray-600 text-xs font-black rounded-xl hover:bg-gray-50 transition-colors uppercase tracking-widest"
                                >
                                    Close
                                </button>

                                {viewingDetailItem.isPending && (
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => {
                                                if (viewingDetailItem.itemType === 'service') {
                                                    handleRejectService(viewingDetailItem.item._id, detailRejectReason || null);
                                                } else {
                                                    handleRejectProduct(viewingDetailItem.item._id, detailRejectReason || null);
                                                }
                                            }}
                                            className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white text-xs font-black rounded-xl shadow-lg shadow-red-500/20 transition-all uppercase tracking-widest cursor-pointer"
                                        >
                                            Reject
                                        </button>
                                        <button
                                            onClick={() => {
                                                if (viewingDetailItem.itemType === 'service') {
                                                    handleApproveService(viewingDetailItem.item._id);
                                                } else {
                                                    handleApproveProduct(viewingDetailItem.item._id);
                                                }
                                            }}
                                            className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white text-xs font-black rounded-xl shadow-lg shadow-green-500/20 transition-all uppercase tracking-widest cursor-pointer flex items-center gap-1.5"
                                        >
                                            <Check size={14} /> Approve
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminServices;
