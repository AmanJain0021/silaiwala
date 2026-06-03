import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Plus, Edit2, Trash2, Sparkles, Tag, ToggleLeft, ToggleRight, Image } from 'lucide-react';
import api from '../../../utils/api';
import { toast } from 'react-hot-toast';

const AdminStyleAddons = () => {
    const [addons, setAddons] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
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
    });

    const [categoryOptions, setCategoryOptions] = useState([]);

    const fetchCategories = async () => {
        try {
            const res = await api.get('/products/categories?type=garment');
            if (res.data.success) {
                setCategoryOptions(res.data.data.map(c => c.name));
            }
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        }
    };

    const fetchAddons = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/style-addons');
            setAddons(res.data.data || []);
        } catch (error) {
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

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const fd = new FormData();
        fd.append('image', file);

        setIsImageUploading(true);
        try {
            const res = await api.post('/upload', fd, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setFormData({ ...formData, image: res.data.data });
            toast.success('Image uploaded');
        } catch (error) {
            console.error('Upload failed:', error);
            toast.error('Image upload failed');
        } finally {
            setIsImageUploading(false);
        }
    };

    const openAddModal = () => {
        setEditingAddon(null);
        setFormData({ name: '', description: '', price: '', image: '', category: '' });
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
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async () => {
        if (!formData.name || !formData.price || !formData.category || !formData.description) {
            return toast.error('Please fill all required fields');
        }
        setIsSubmitting(true);
        try {
            if (editingAddon) {
                await api.put(`/style-addons/${editingAddon._id}`, {
                    ...formData,
                    price: Number(formData.price),
                });
                toast.success('Style add-on updated');
            } else {
                await api.post('/style-addons', {
                    ...formData,
                    price: Number(formData.price),
                });
                toast.success('Style add-on created');
            }
            setIsModalOpen(false);
            fetchAddons();
        } catch (error) {
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
            toast.error('Failed to update status');
        }
    };

    const uniqueCategories = ['All', ...new Set(addons.map(a => a.category).filter(Boolean))];

    const filteredAddons = addons.filter(a => {
        const matchesSearch = a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.description.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || a.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="h-full flex flex-col space-y-6 relative">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Style Add-ons</h1>
                    <p className="text-xs text-gray-500 font-medium mt-1">Manage embellishments, design upgrades, and style enhancements</p>
                </div>
                <button
                    onClick={openAddModal}
                    className="flex items-center gap-2 px-4 py-2.5 bg-[#2D2F6E] text-white text-xs font-semibold rounded-xl hover:bg-[#1E1F4D] shadow-lg shadow-[#2D2F6E]/20 transition-all uppercase tracking-wider"
                >
                    <Plus size={16} /> Add Add-on
                </button>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex bg-gray-50 p-1 rounded-xl w-full sm:w-auto overflow-x-auto no-scrollbar">
                    {uniqueCategories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat)}
                            className={`px-4 py-2 text-xs font-semibold rounded-lg whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-white text-primary shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative flex-1 sm:w-64">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search add-ons..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-xs font-medium bg-gray-50 border border-transparent focus:border-gray-200 rounded-xl outline-none transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex-1 overflow-hidden flex flex-col">
                {isLoading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#2D2F6E]"></div>
                    </div>
                ) : filteredAddons.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 space-y-3 p-12">
                        <Sparkles size={48} className="opacity-20" />
                        <p className="text-sm font-semibold">No style add-ons found</p>
                        <p className="text-xs text-gray-400">Create your first add-on to get started</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left whitespace-nowrap">
                            <thead>
                                <tr className="bg-gray-50/50 text-gray-400 font-semibold text-[10px] uppercase tracking-wider border-b border-gray-100">
                                    <th className="px-6 py-4">Add-on Details</th>
                                    <th className="px-6 py-4">Category</th>
                                    <th className="px-6 py-4">Price</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filteredAddons.map((addon) => (
                                    <tr
                                        key={addon._id}
                                        className="hover:bg-[#2D2F6E]/5 transition-colors group"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="h-12 w-12 rounded-xl bg-gray-100 border border-gray-200 overflow-hidden flex items-center justify-center shrink-0">
                                                    {addon.image ? (
                                                        <img src={addon.image} alt={addon.name} className="w-full h-full object-cover" onError={(e) => e.target.src = 'https://cdn-icons-png.flaticon.com/128/2553/2553642.png'} />
                                                    ) : (
                                                        <Sparkles size={20} className="text-gray-300" />
                                                    )}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold text-gray-900">{addon.name}</span>
                                                    <span className="text-[10px] text-gray-400 font-medium group-hover:text-gray-600 line-clamp-1 max-w-[250px]">
                                                        {addon.description}
                                                    </span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-indigo-50 text-[#2D2F6E] border border-indigo-100">
                                                {addon.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-sm font-bold text-[#2D2F6E]">₹{addon.price}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => handleToggleActive(addon)}
                                                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all ${addon.isActive
                                                        ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100'
                                                        : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100'
                                                    }`}
                                            >
                                                {addon.isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                                                {addon.isActive ? 'Active' : 'Inactive'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => openEditModal(addon)}
                                                    className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(addon._id)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
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
                )}
            </div>

            {/* Add/Edit Modal */}
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
                                <h2 className="text-lg font-bold tracking-tight text-gray-900">
                                    {editingAddon ? 'Edit Style Add-on' : 'Add New Style Add-on'}
                                </h2>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 bg-white border border-gray-200 text-gray-400 hover:text-gray-900 rounded-full transition-colors shadow-sm">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6 flex-1 overflow-y-auto space-y-5">
                                <div>
                                    <label className="block text-[10px] font-semibold uppercase text-gray-500 tracking-wider mb-1.5">Add-on Name *</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="e.g. Collar Design, Side Slit, Piping"
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 outline-none focus:border-[#2D2F6E] transition-colors shadow-sm"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-semibold uppercase text-gray-500 tracking-wider mb-1.5">Price (₹) *</label>
                                        <input
                                            type="number"
                                            value={formData.price}
                                            onChange={e => setFormData({ ...formData, price: e.target.value })}
                                            placeholder="150"
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 outline-none focus:border-[#2D2F6E] transition-colors shadow-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-semibold uppercase text-gray-500 tracking-wider mb-1.5">Category *</label>
                                        <select
                                            value={formData.category}
                                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 outline-none focus:border-[#2D2F6E] transition-colors shadow-sm"
                                        >
                                            <option value="">Select Category</option>
                                            {categoryOptions.map(c => (
                                                <option key={c} value={c}>{c}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-semibold uppercase text-gray-500 tracking-wider mb-1.5">Description *</label>
                                    <textarea
                                        rows={3}
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Describe the style enhancement..."
                                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-900 outline-none focus:border-[#2D2F6E] transition-colors shadow-sm resize-none"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-semibold uppercase text-gray-500 tracking-wider mb-1.5">Image</label>
                                    <div className="flex gap-4 items-center">
                                        <div className="h-16 w-16 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                                            {formData.image ? (
                                                <img src={formData.image} alt="Preview" className="w-full h-full object-cover" />
                                            ) : (
                                                <Image size={20} className="text-gray-300" />
                                            )}
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
                                                <div className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-xs font-medium text-gray-500 flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors">
                                                    {isImageUploading ? (
                                                        <div className="w-4 h-4 border-2 border-[#2D2F6E] border-t-transparent animate-spin rounded-full" />
                                                    ) : (
                                                        <Plus size={14} />
                                                    )}
                                                    {isImageUploading ? 'Uploading...' : 'Upload Image'}
                                                </div>
                                            </div>
                                            <input
                                                type="text"
                                                value={formData.image}
                                                onChange={e => setFormData({ ...formData, image: e.target.value })}
                                                placeholder="Or paste IMAGE URL here..."
                                                className="w-full px-4 py-2 bg-gray-50 border border-transparent rounded-lg text-[10px] font-medium text-gray-500 outline-none focus:bg-white focus:border-gray-200 transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-6 py-3 bg-white border border-gray-200 text-gray-600 text-xs font-semibold rounded-xl hover:bg-gray-50 transition-colors uppercase tracking-wider"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="px-6 py-3 bg-[#2D2F6E] text-white text-xs font-semibold rounded-xl hover:bg-[#1E1F4D] shadow-lg shadow-[#2D2F6E]/20 transition-all uppercase tracking-wider disabled:opacity-50"
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
