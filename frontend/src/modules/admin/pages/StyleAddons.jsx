import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Plus, Edit2, Trash2, Sparkles, Tag, ToggleLeft, ToggleRight, Image, Scissors, Layers, CheckCircle2 } from 'lucide-react';
import api from '../../../utils/api';
import { toast } from 'react-hot-toast';

const AdminStyleAddons = () => {
    const [addons, setAddons] = useState([]);
    const [categoryList, setCategoryList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAddon, setEditingAddon] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isImageUploading, setIsImageUploading] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        image: '',
        category: '',
        referenceImages: { left: '', right: '', front: '', back: '' }
    });

    const [isCreatingCategory, setIsCreatingCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');

    const fetchCategories = async () => {
        try {
            const res = await api.get('/admin/categories?type=service');
            if (res.data.success && res.data.data.length > 0) {
                const names = res.data.data.map(c => c.name);
                setCategoryList(names);
            } else {
                setCategoryList([]);
            }
        } catch (error) {
            if (error?.name === 'CanceledError' || error?.message?.toLowerCase().includes('cancel')) return;
            console.error('Failed to fetch categories:', error);
            setCategoryList([]);
        }
    };

    const fetchAddons = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/style-addons?addonType=embellishment');
            setAddons(res.data.data || []);
        } catch (error) {
            if (error?.name === 'CanceledError' || error?.message?.toLowerCase().includes('cancel')) return;
            console.error('Failed to fetch style addons:', error);
            toast.error('Failed to load style add-ons');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAddons();
        fetchCategories();
    }, []);

    const handleImageUpload = async (e, type = 'main') => {
        const file = e.target.files[0];
        if (!file) return;

        const fd = new FormData();
        fd.append('image', file);

        setIsImageUploading(true);
        try {
            const res = await api.post('/upload', fd, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            if (type === 'main') {
                setFormData({ ...formData, image: res.data.data });
            } else {
                setFormData({
                    ...formData,
                    referenceImages: { ...formData.referenceImages, [type]: res.data.data }
                });
            }
            toast.success('Image uploaded');
        } catch (error) {
            if (error?.name === 'CanceledError' || error?.message?.toLowerCase().includes('cancel')) return;
            console.error('Upload failed:', error);
            toast.error('Image upload failed');
        } finally {
            setIsImageUploading(false);
        }
    };

    const openAddModalForCategory = (categoryName) => {
        setEditingAddon(null);
        setFormData({ 
            name: '', description: '', price: '100', image: '', category: categoryName || (categoryList[0] || 'All'),
            referenceImages: { left: '', right: '', front: '', back: '' }
        });
        setIsCreatingCategory(false);
        setNewCategoryName('');
        setIsModalOpen(true);
    };

    const openEditModal = (addon) => {
        setEditingAddon(addon);
        setFormData({
            name: addon.name,
            description: addon.description,
            price: addon.price,
            image: addon.image,
            category: addon.category,
            referenceImages: addon.referenceImages || { left: '', right: '', front: '', back: '' }
        });
        setIsCreatingCategory(false);
        setNewCategoryName('');
        setIsModalOpen(true);
    };

    const handleSubmit = async () => {
        let finalCategory = formData.category;

        if (isCreatingCategory) {
            if (!newCategoryName.trim()) return toast.error('Please enter a new category name');
            finalCategory = newCategoryName.trim();
        }

        if (!formData.name || formData.price === '' || !finalCategory || !formData.description) {
            return toast.error('Please fill all required fields');
        }
        
        setIsSubmitting(true);
        try {
            if (isCreatingCategory) {
                try {
                    await api.post('/admin/categories', { name: finalCategory, type: 'garment' });
                    fetchCategories();
                } catch (catError) {
                    console.error('Category creation error:', catError);
                }
            }

            if (editingAddon) {
                await api.put(`/style-addons/${editingAddon._id}`, {
                    ...formData,
                    category: finalCategory,
                    price: Number(formData.price),
                    addonType: 'embellishment'
                });
                toast.success(`Add-on updated for ${finalCategory}`);
            } else {
                await api.post('/style-addons', {
                    ...formData,
                    category: finalCategory,
                    price: Number(formData.price),
                    addonType: 'embellishment'
                });
                toast.success(`Add-on created for ${finalCategory}`);
            }
            setIsModalOpen(false);
            fetchAddons();
        } catch (error) {
            if (error?.name === 'CanceledError' || error?.message?.toLowerCase().includes('cancel')) return;
            console.error('Failed to save style addon:', error);
            toast.error(error.response?.data?.message || 'Failed to save');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this style add-on?')) return;
        try {
            await api.delete(`/style-addons/${id}`);
            toast.success('Style add-on deleted');
            fetchAddons();
        } catch (error) {
            if (error?.name === 'CanceledError' || error?.message?.toLowerCase().includes('cancel')) return;
            console.error('Failed to delete:', error);
            toast.error('Failed to delete');
        }
    };

    const handleToggleActive = async (addon) => {
        try {
            await api.put(`/style-addons/${addon._id}`, { isActive: !addon.isActive });
            toast.success(`Add-on ${addon.isActive ? 'deactivated' : 'activated'}`);
            fetchAddons();
        } catch (error) {
            if (error?.name === 'CanceledError' || error?.message?.toLowerCase().includes('cancel')) return;
            toast.error('Failed to update status');
        }
    };

    // Filter add-ons by search term
    const searchFilteredAddons = addons.filter(a => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (a.name || '').toLowerCase().includes(q) ||
               (a.description || '').toLowerCase().includes(q) ||
               (a.category || '').toLowerCase().includes(q);
    });

    // Combine all service categories (including custom ones from existing add-ons)
    const allServiceCategories = Array.from(new Set([
        'All',
        ...categoryList,
        ...addons.map(a => a.category).filter(Boolean)
    ]));

    return (
        <div className="h-full flex flex-col space-y-6 relative pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-xs">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-50 text-purple-700 border border-purple-100">
                            Service-Wise Add-ons
                        </span>
                    </div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight mt-1">Style Add-ons by Service</h1>
                    <p className="text-xs text-gray-500 font-medium mt-0.5">
                        Define design add-ons (Pockets, Piping, Padding, Slits) directly under each Service.
                    </p>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    {/* Search Input */}
                    <div className="relative flex-1 sm:w-64">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search add-ons or services..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 text-xs font-medium bg-gray-50 border border-gray-200 focus:border-purple-500 focus:bg-white rounded-xl outline-none transition-all shadow-xs"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                <X size={14} />
                            </button>
                        )}
                    </div>

                    <button
                        onClick={() => openAddModalForCategory('Kurta/Kurti')}
                        className="flex items-center gap-2 px-4 py-2.5 bg-[#843D9B] text-white text-xs font-bold rounded-xl hover:bg-[#1E1F4D] shadow-lg shadow-purple-900/20 transition-all uppercase tracking-wider shrink-0 cursor-pointer"
                    >
                        <Plus size={16} /> New Add-on
                    </button>
                </div>
            </div>

            {/* Service-Wise Cards Section */}
            {isLoading ? (
                <div className="flex justify-center items-center py-20">
                    <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (
                <div className="space-y-6">
                    {allServiceCategories.map(categoryName => {
                        const serviceAddons = searchFilteredAddons.filter(a => {
                            if (categoryName === 'All') return a.category === 'All';
                            return a.category === categoryName;
                        });

                        // Don't render empty search results for non-matching categories when searching
                        if (searchQuery && serviceAddons.length === 0) return null;

                        return (
                            <div 
                                key={categoryName}
                                className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden transition-all hover:border-purple-200"
                            >
                                {/* Service Card Header */}
                                <div className="p-5 bg-gradient-to-r from-gray-50 via-purple-50/20 to-white border-b border-gray-100 flex flex-wrap justify-between items-center gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-black text-sm shadow-xs">
                                            {categoryName === 'All' ? <Layers size={18} /> : <Scissors size={18} />}
                                        </div>
                                        <div>
                                            <h3 className="text-base font-black text-gray-900 tracking-tight flex items-center gap-2">
                                                {categoryName === 'All' ? 'Universal Add-ons (All Services)' : categoryName}
                                                <span className="px-2.5 py-0.5 bg-purple-100 text-purple-800 rounded-full text-[10px] font-black tracking-wide">
                                                    {serviceAddons.length} {serviceAddons.length === 1 ? 'Add-on' : 'Add-ons'}
                                                </span>
                                            </h3>
                                            <p className="text-[11px] text-gray-500 font-medium">
                                                {categoryName === 'All' 
                                                    ? 'Add-ons available across all clothing services' 
                                                    : `Style options & upgrades specifically for ${categoryName}`}
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => openAddModalForCategory(categoryName)}
                                        className="px-4 py-2 bg-purple-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 hover:bg-purple-700 transition-all shadow-md shadow-purple-900/10 cursor-pointer"
                                    >
                                        <Plus size={14} /> Add Add-on to {categoryName === 'All' ? 'All Services' : categoryName}
                                    </button>
                                </div>

                                {/* Add-ons Table / Grid inside this Service Card */}
                                <div className="p-5">
                                    {serviceAddons.length === 0 ? (
                                        <div className="py-8 text-center bg-gray-50/60 rounded-2xl border border-dashed border-gray-200">
                                            <Sparkles size={24} className="mx-auto text-purple-300 mb-2" />
                                            <p className="text-xs font-bold text-gray-700">No add-ons created for {categoryName} yet</p>
                                            <p className="text-[11px] text-gray-400 mt-0.5">Click the button above to add custom add-ons like Pockets, Piping, or Lining for this service.</p>
                                            <button
                                                onClick={() => openAddModalForCategory(categoryName)}
                                                className="mt-3 px-3.5 py-1.5 bg-white border border-purple-200 text-purple-700 hover:bg-purple-50 rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1 cursor-pointer"
                                            >
                                                <Plus size={12} /> Add First Add-on
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {serviceAddons.map(addon => (
                                                <motion.div
                                                    key={addon._id}
                                                    layout
                                                    initial={{ opacity: 0, scale: 0.95 }}
                                                    animate={{ opacity: 1, scale: 1 }}
                                                    className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                                                        addon.isActive !== false 
                                                            ? 'bg-white border-gray-200 hover:border-purple-300 hover:shadow-md' 
                                                            : 'bg-gray-50 border-gray-200 opacity-60'
                                                    }`}
                                                >
                                                    <div>
                                                        {/* Top Row: Thumbnail + Title & Price */}
                                                        <div className="flex items-start gap-3">
                                                            <div className="w-14 h-14 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden shrink-0 relative">
                                                                {addon.image ? (
                                                                    <img 
                                                                        src={addon.image} 
                                                                        alt={addon.name} 
                                                                        className="w-full h-full object-cover"
                                                                        onError={(e) => { e.target.src = 'https://cdn-icons-png.flaticon.com/128/9284/9284227.png'; }}
                                                                    />
                                                                ) : (
                                                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                                        <Image size={20} />
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex justify-between items-start gap-1">
                                                                    <h4 className="text-xs font-black text-gray-900 truncate">{addon.name}</h4>
                                                                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[11px] font-black shrink-0">
                                                                        ₹{addon.price}
                                                                    </span>
                                                                </div>
                                                                <p className="text-[11px] text-gray-500 font-medium line-clamp-2 mt-1">
                                                                    {addon.description || 'No description provided.'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Card Action Controls */}
                                                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100">
                                                        <button
                                                            onClick={() => handleToggleActive(addon)}
                                                            className={`flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                                                                addon.isActive !== false 
                                                                    ? 'bg-green-50 text-green-700 hover:bg-green-100' 
                                                                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                                            }`}
                                                        >
                                                            {addon.isActive !== false ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                                                            {addon.isActive !== false ? 'Active' : 'Inactive'}
                                                        </button>

                                                        <div className="flex items-center gap-1">
                                                            <button
                                                                onClick={() => openEditModal(addon)}
                                                                className="p-1.5 text-gray-500 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                                                                title="Edit Add-on"
                                                            >
                                                                <Edit2 size={14} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(addon._id)}
                                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                                                                title="Delete Add-on"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Add / Edit Add-on Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={() => setIsModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                        >
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <div>
                                    <h2 className="text-lg font-black tracking-tight text-gray-900">
                                        {editingAddon ? 'Edit Style Add-on' : 'Add New Style Add-on'}
                                    </h2>
                                    <p className="text-[11px] text-purple-700 font-bold mt-0.5">
                                        Target Service: <span className="bg-purple-100 px-2 py-0.5 rounded-md">{formData.category || 'All Services'}</span>
                                    </p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 bg-white border border-gray-200 text-gray-400 hover:text-gray-900 rounded-full transition-colors shadow-xs cursor-pointer">
                                    <X size={18} />
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto space-y-4 custom-scrollbar">
                                {/* Service Category Selector */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Service / Garment Type</label>
                                    <select
                                        value={formData.category}
                                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-900 outline-none focus:border-purple-600 transition-colors shadow-xs cursor-pointer"
                                    >
                                        <option value="All">All Categories (Universal Add-on)</option>
                                        {Array.from(new Set([...categoryList, ...addons.map(a => a.category).filter(Boolean)])).filter(c => c !== 'All').sort().map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Add-on Name */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Add-on Name *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. Side Pocket, Padded Cups, Bottom Slit"
                                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-900 outline-none focus:border-purple-600 transition-colors shadow-xs"
                                    />
                                </div>

                                {/* Add-on Price */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Additional Price (₹) *</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-gray-400">₹</span>
                                        <input
                                            type="number"
                                            value={formData.price}
                                            onChange={e => setFormData({ ...formData, price: e.target.value })}
                                            placeholder="100"
                                            className="w-full pl-8 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-900 outline-none focus:border-purple-600 transition-colors shadow-xs"
                                        />
                                    </div>
                                </div>

                                {/* Description */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Description *</label>
                                    <textarea
                                        rows={3}
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Explain this style add-on to the customer..."
                                        className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-900 outline-none focus:border-purple-600 transition-colors shadow-xs resize-none"
                                    />
                                </div>

                                {/* Image Photo Upload */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1">Reference Image Photo (Optional)</label>
                                    <div className="flex items-center gap-3">
                                        <div className="w-14 h-14 rounded-xl bg-gray-50 border border-gray-200 overflow-hidden shrink-0 relative flex items-center justify-center">
                                            {formData.image ? (
                                                <img src={formData.image} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <Image size={20} className="text-gray-300" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                id="addon-img-upload"
                                                className="hidden"
                                            />
                                            <label
                                                htmlFor="addon-img-upload"
                                                className="inline-block px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                                            >
                                                {isImageUploading ? 'Uploading...' : 'Choose Image File'}
                                            </label>
                                            <p className="text-[10px] text-gray-400 mt-1">Upload reference photo of this design option</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-5 py-2.5 bg-white border border-gray-200 text-gray-600 text-xs font-bold rounded-xl hover:bg-gray-50 transition-colors uppercase tracking-wider cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="px-5 py-2.5 bg-purple-600 text-white text-xs font-bold rounded-xl hover:bg-purple-700 shadow-md shadow-purple-900/20 transition-all uppercase tracking-wider disabled:opacity-50 cursor-pointer"
                                >
                                    {isSubmitting ? 'Saving...' : (editingAddon ? 'Update Add-on' : 'Save Add-on')}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminStyleAddons;
