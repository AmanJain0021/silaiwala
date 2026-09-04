import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Plus, Edit2, Trash2, Scissors, Upload, ToggleLeft, ToggleRight, Image as ImageIcon, Loader2, Sparkles, CheckCircle2, Layers } from 'lucide-react';
import api from '../../../utils/api';
import { toast } from 'react-hot-toast';

const CUSTOMIZATION_SLOTS = [
    { key: 'all', label: 'All Customizations' },
    { key: 'neck', label: 'Neck Design' },
    { key: 'sleeve', label: 'Sleeve Style' },
    { key: 'bottom', label: 'Bottom Style' },
    { key: 'embroidery', label: 'Embroidery' },
    { key: 'lacePiping', label: 'Lace / Piping' },
    { key: 'lining', label: 'Lining' },
    { key: 'other', label: 'Other Customization' }
];

const AdminCustomizations = () => {
    const [customizations, setCustomizations] = useState([]);
    const [categoryList, setCategoryList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '0',
        image: '',
        category: 'All',
        customizationType: 'neck',
    });

    const fetchCategories = async () => {
        try {
            const res = await api.get('/admin/categories?type=service');
            if (res.data?.success && res.data.data?.length > 0) {
                setCategoryList(res.data.data.map(c => c.name));
            }
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        }
    };

    const fetchCustomizations = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/style-addons?addonType=customization');
            setCustomizations(res.data?.data || []);
        } catch (error) {
            console.error('Failed to fetch customizations:', error);
            toast.error('Failed to load customizations catalog');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCustomizations();
        fetchCategories();
    }, []);

    const handleImageUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const fd = new FormData();
            fd.append('file', file);
            fd.append('image', file);
            
            let url = null;
            try {
                const res = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                url = res.data?.data;
            } catch (err) {
                const pubRes = await api.post('/upload/public', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                url = pubRes.data?.data;
            }

            if (!url) {
                url = await new Promise(res => {
                    const reader = new FileReader();
                    reader.onloadend = () => res(reader.result);
                    reader.readAsDataURL(file);
                });
            }

            setFormData(prev => ({ ...prev, image: url }));
            toast.success('Photo uploaded!');
        } catch (err) {
            console.error('Upload failed:', err);
            toast.error('Failed to upload image');
        } finally {
            setIsUploading(false);
        }
    };

    const openModal = (item = null, slotType = 'neck') => {
        if (item) {
            setEditingItem(item);
            setFormData({
                name: item.name || '',
                description: item.description || '',
                price: item.price !== undefined ? String(item.price) : '0',
                image: item.image || '',
                category: item.category || 'All',
                customizationType: item.customizationType || 'neck',
            });
        } else {
            setEditingItem(null);
            setFormData({
                name: '',
                description: '',
                price: '0',
                image: '',
                category: 'All',
                customizationType: slotType !== 'all' ? slotType : 'neck',
            });
        }
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) return toast.error('Please enter a customization name');

        setIsSubmitting(true);
        try {
            const payload = {
                name: formData.name.trim(),
                description: formData.description.trim(),
                price: Number(formData.price) || 0,
                image: formData.image,
                category: formData.category || 'All',
                addonType: 'customization',
                customizationType: formData.customizationType,
                isActive: editingItem ? editingItem.isActive : true,
            };

            if (editingItem) {
                await api.put(`/style-addons/${editingItem._id}`, payload);
                toast.success('Customization updated');
            } else {
                await api.post('/style-addons', payload);
                toast.success('Customization option added');
            }

            setIsModalOpen(false);
            fetchCustomizations();
        } catch (error) {
            console.error('Failed to save customization:', error);
            toast.error(error.response?.data?.message || 'Failed to save');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this customization option?')) return;
        try {
            await api.delete(`/style-addons/${id}`);
            toast.success('Customization deleted');
            fetchCustomizations();
        } catch (error) {
            console.error('Failed to delete:', error);
            toast.error('Failed to delete option');
        }
    };

    const handleToggleActive = async (item) => {
        const nextState = !item.isActive;
        setCustomizations(prev => prev.map(c => c._id === item._id ? { ...c, isActive: nextState } : c));
        try {
            await api.put(`/style-addons/${item._id}`, { isActive: nextState });
            toast.success(nextState ? 'Option activated' : 'Option deactivated');
        } catch (err) {
            setCustomizations(prev => prev.map(c => c._id === item._id ? { ...c, isActive: item.isActive } : c));
            toast.error('Failed to update status');
        }
    };

    const filteredItems = customizations.filter(item => {
        const matchesTab = activeTab === 'all' || item.customizationType === activeTab;
        const q = searchQuery.toLowerCase();
        const matchesQuery = !q || (item.name || '').toLowerCase().includes(q) || (item.category || '').toLowerCase().includes(q);
        return matchesTab && matchesQuery;
    });

    return (
        <div className="space-y-6 pb-12">
            {/* Top Header Card */}
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-50 text-primary border border-purple-100 inline-block mb-1">
                        Catalog Management
                    </span>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Order Customizations Catalog</h1>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">
                        Manage catalog design options for Neck Designs, Sleeve Styles, Bottom Styles, Embroidery, Lace/Piping & Lining with photos and prices.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-60">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search customizations..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 text-xs font-medium bg-gray-50 border border-gray-200 focus:border-primary focus:bg-white rounded-xl outline-none transition-all shadow-xs"
                        />
                    </div>

                    <button
                        onClick={() => openModal(null, activeTab)}
                        className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-dark shadow-md shadow-purple-900/20 transition-all uppercase tracking-wider cursor-pointer shrink-0"
                    >
                        <Plus size={16} /> Add Customization
                    </button>
                </div>
            </div>

            {/* Customization Slot Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
                {CUSTOMIZATION_SLOTS.map(slot => (
                    <button
                        key={slot.key}
                        onClick={() => setActiveTab(slot.key)}
                        className={`px-4 py-2.5 rounded-2xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap cursor-pointer border ${
                            activeTab === slot.key
                                ? 'bg-primary text-white border-primary shadow-md'
                                : 'bg-white text-gray-700 border-gray-200 hover:border-purple-300'
                        }`}
                    >
                        {slot.label}
                    </button>
                ))}
            </div>

            {/* Grid List */}
            {isLoading ? (
                <div className="flex justify-center items-center py-20">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            ) : filteredItems.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-xs">
                    <div className="w-16 h-16 bg-purple-50 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
                        <Scissors size={28} />
                    </div>
                    <h3 className="text-base font-bold text-gray-900 mb-1">No Customization Options Found</h3>
                    <p className="text-xs text-gray-400 mb-4 max-w-sm mx-auto">
                        Add photo reference options for Neck Designs, Sleeve Styles, Bottom Styles, Embroidery, etc.
                    </p>
                    <button
                        onClick={() => openModal(null, activeTab)}
                        className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-md cursor-pointer"
                    >
                        + Add Customization
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredItems.map(item => (
                        <div
                            key={item._id}
                            className={`bg-white rounded-3xl border transition-all p-4 flex flex-col justify-between shadow-xs ${
                                item.isActive ? 'border-gray-100 hover:border-purple-200' : 'border-gray-200 opacity-60 bg-gray-50/50'
                            }`}
                        >
                            <div>
                                <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-gray-100 mb-3 relative group">
                                    {item.image ? (
                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                                            <ImageIcon size={32} />
                                            <span className="text-[10px] mt-1 font-bold">No Photo</span>
                                        </div>
                                    )}

                                    <div className="absolute top-2 left-2 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-[9px] font-black uppercase tracking-wider">
                                        {item.customizationType || 'neck'}
                                    </div>

                                    <button
                                        onClick={() => handleToggleActive(item)}
                                        className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 shadow-md text-gray-700 hover:text-primary transition-colors cursor-pointer"
                                        title={item.isActive ? 'Deactivate' : 'Activate'}
                                    >
                                        {item.isActive ? <ToggleRight size={18} className="text-green-600" /> : <ToggleLeft size={18} className="text-gray-400" />}
                                    </button>
                                </div>

                                <div className="flex items-start justify-between gap-2 mb-1">
                                    <h3 className="font-black text-sm text-gray-900 truncate">{item.name}</h3>
                                    <span className="text-sm font-black text-primary shrink-0">
                                        {item.price > 0 ? `₹${item.price}` : 'Free'}
                                    </span>
                                </div>

                                <p className="text-[10px] font-medium text-gray-500 line-clamp-2 mb-3">
                                    {item.description || `Applicable for: ${item.category || 'All Services'}`}
                                </p>
                            </div>

                            <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                                <span className="text-[9px] font-black uppercase text-purple-900 bg-purple-50 px-2 py-0.5 rounded-md">
                                    {item.category || 'All'}
                                </span>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => openModal(item)}
                                        className="p-1.5 text-gray-500 hover:text-primary hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                                        title="Edit"
                                    >
                                        <Edit2 size={14} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(item._id)}
                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                        title="Delete"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal for Add / Edit */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-gray-100 overflow-hidden"
                        >
                            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
                                <h3 className="text-base font-black text-gray-900 uppercase tracking-wider">
                                    {editingItem ? 'Edit Customization Option' : 'New Customization Option'}
                                </h3>
                                <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer">
                                    <X size={18} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1">
                                        Customization Category / Slot
                                    </label>
                                    <select
                                        value={formData.customizationType}
                                        onChange={(e) => setFormData({ ...formData, customizationType: e.target.value })}
                                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-primary focus:bg-white"
                                    >
                                        <option value="neck">Neck Design</option>
                                        <option value="sleeve">Sleeve Style</option>
                                        <option value="bottom">Bottom Style</option>
                                        <option value="embroidery">Embroidery</option>
                                        <option value="lacePiping">Lace / Piping</option>
                                        <option value="lining">Lining</option>
                                        <option value="other">Other Customization</option>
                                    </select>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1">
                                            Customization Name *
                                        </label>
                                        <input
                                            type="text"
                                            required
                                            placeholder="e.g. Round Neck / Gotapatti Lace"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none focus:border-primary focus:bg-white"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1">
                                            Price (₹)
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            placeholder="0"
                                            value={formData.price}
                                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none focus:border-primary focus:bg-white"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1">
                                        Applicable Service / Garment Category
                                    </label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold outline-none focus:border-primary focus:bg-white"
                                    >
                                        <option value="All">All Services</option>
                                        {categoryList.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Photo Upload */}
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1">
                                        Design Photo / Reference Image
                                    </label>
                                    <div className="flex items-center gap-3">
                                        <div className="w-16 h-16 rounded-xl border border-gray-200 bg-gray-50 overflow-hidden flex items-center justify-center shrink-0">
                                            {formData.image ? (
                                                <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <ImageIcon size={20} className="text-gray-300" />
                                            )}
                                        </div>

                                        <label className="flex-1 border-2 border-dashed border-purple-200 rounded-xl p-3 flex items-center justify-center gap-2 cursor-pointer hover:bg-purple-50/50 transition-colors relative">
                                            {isUploading ? (
                                                <Loader2 size={16} className="animate-spin text-primary" />
                                            ) : (
                                                <Upload size={16} className="text-primary" />
                                            )}
                                            <span className="text-xs font-bold text-purple-900">
                                                {isUploading ? 'Uploading...' : (formData.image ? 'Change Photo' : 'Upload Design Photo')}
                                            </span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                disabled={isUploading}
                                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                            />
                                        </label>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-wider text-gray-500 mb-1">
                                        Description / Duration Notes
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Traditional gotapatti border lace (takes 1 day)"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium outline-none focus:border-primary focus:bg-white"
                                    />
                                </div>

                                <div className="pt-4 flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setIsModalOpen(false)}
                                        className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-xs font-bold hover:bg-gray-50 cursor-pointer"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="flex-1 py-2.5 rounded-xl bg-primary text-white text-xs font-bold shadow-md hover:bg-primary-dark transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                    >
                                        {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                                        {editingItem ? 'Update Option' : 'Save Option'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminCustomizations;
