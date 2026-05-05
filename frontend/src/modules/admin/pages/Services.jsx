import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, MoreHorizontal, X, Tag, Clock, CheckCircle2, Package, Plus, Edit2, Trash2 } from 'lucide-react';
import api from '../../../utils/api';
import { toast } from 'react-hot-toast';

const AdminServices = () => {
    const [selectedTab, setSelectedTab] = useState('Stitching Categories');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [categoriesData, setCategoriesData] = useState([]);
    const [tailorServices, setTailorServices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [newService, setNewService] = useState({ title: '', price: '', deliveryTime: '', description: '', image: 'https://cdn-icons-png.flaticon.com/128/9284/9284227.png' });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isImageUploading, setIsImageUploading] = useState(false);

    const tabs = ['Stitching Categories', 'Tailor Services', 'Pricing & Commissions'];

    const fetchCategories = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/admin/categories?type=service');
            setCategoriesData(res.data.data);
        } catch (error) {
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
            console.error('Failed to fetch tailor services:', error);
            toast.error('Failed to load tailor services');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (selectedTab === 'Stitching Categories') {
            fetchCategories();
        } else if (selectedTab === 'Tailor Services') {
            fetchTailorServices();
        }
    }, [selectedTab]);

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append('image', file);

        setIsImageUploading(true);
        try {
            const res = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setNewService({ ...newService, image: res.data.data });
            toast.success('Image uploaded successfully');
        } catch (error) {
            console.error('Upload failed:', error);
            toast.error('Image upload failed');
        } finally {
            setIsImageUploading(false);
        }
    };

    const handleAddService = async () => {
        if (!newService.title || !newService.price) return toast.error('Please fill all required fields');
        setIsSubmitting(true);
        try {
            const payload = {
                name: newService.title,
                basePrice: newService.price,
                deliveryTime: newService.deliveryTime,
                description: newService.description,
                image: newService.image,
                type: 'service'
            };
            await api.post('/admin/categories', payload);
            toast.success('Category added successfully');
            setIsAddModalOpen(false);
            setNewService({ title: '', price: '', deliveryTime: '', description: '', image: 'https://cdn-icons-png.flaticon.com/128/9284/9284227.png' });
            fetchCategories();
        } catch (error) {
            console.error('Failed to add service:', error);
            toast.error('Failed to add category');
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
            console.error('Failed to delete service:', error);
            toast.error('Failed to delete category');
        }
    };

    const filteredCategories = categoriesData.filter(s => 
        (s.name || s.title || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredTailorServices = tailorServices.filter(s => 
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.tailor?.shopName?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Grouping tailor services by category
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

            {/* Controls */}
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

            {/* Content Area */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex-1 overflow-hidden flex flex-col">
                {selectedTab === 'Stitching Categories' ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left whitespace-nowrap">
                            <thead>
                                <tr className="bg-gray-50/50 text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em] border-b border-gray-100">
                                    <th className="px-6 py-4">Service Details</th>
                                    <th className="px-6 py-4">Base Price</th>
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
                                                    <img src={service.image} alt={service.name} className="w-full h-full object-cover" />
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
                                            <span className="text-sm font-black text-primary">₹{service.basePrice || service.price}</span>
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
                                                <button className="p-2 text-gray-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all border border-transparent">
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
                                                <div key={service._id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                                                    <div className="flex gap-4">
                                                        <div className="h-16 w-16 rounded-xl bg-gray-50 border border-gray-100 overflow-hidden shrink-0">
                                                            <img 
                                                                src={service.image} 
                                                                alt={service.title} 
                                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                                                                onError={(e) => e.target.src = 'https://cdn-icons-png.flaticon.com/128/9284/9284227.png'}
                                                            />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex justify-between items-start">
                                                                <h4 className="text-sm font-black text-gray-900 truncate pr-2">{service.title}</h4>
                                                                <span className="text-xs font-black text-primary">₹{service.basePrice}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1.5 mt-1">
                                                                <div className="h-4 w-4 rounded-full bg-gray-100 flex items-center justify-center text-[8px] font-bold text-gray-500">
                                                                    {service.tailor?.shopName?.[0]}
                                                                </div>
                                                                <span className="text-[10px] font-bold text-gray-500 truncate">{service.tailor?.shopName}</span>
                                                            </div>
                                                            <div className="flex items-center gap-3 mt-3">
                                                                <div className="flex items-center gap-1 text-[9px] font-bold text-gray-400">
                                                                    <Clock size={12} /> {service.deliveryTime}
                                                                </div>
                                                                <div className="flex items-center gap-1 text-[9px] font-bold text-green-600">
                                                                    <CheckCircle2 size={12} /> {service.isActive ? 'Active' : 'Hidden'}
                                                                </div>
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
                ) : (
                    <div className="p-6 overflow-y-auto space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Commission Rules */}
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
                                            <span className="text-lg font-black text-primary">15%</span>
                                            <button className="text-[10px] font-bold text-primary hover:underline">Edit</button>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                                        <div>
                                            <p className="text-xs font-bold text-gray-900">Readymade Store</p>
                                            <p className="text-[10px] text-gray-500 mt-0.5">Applied to marketplace vendors</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg font-black text-primary">10%</span>
                                            <button className="text-[10px] font-bold text-primary hover:underline">Edit</button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Delivery Charges */}
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
                                            <span className="text-lg font-black text-gray-900">₹40</span>
                                            <button className="text-[10px] font-bold text-primary hover:underline">Edit</button>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-xl border border-gray-100">
                                        <div>
                                            <p className="text-xs font-bold text-gray-900">Per KM Charge</p>
                                            <p className="text-[10px] text-gray-500 mt-0.5">Beyond base distance</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-lg font-black text-gray-900">₹8</span>
                                            <button className="text-[10px] font-bold text-primary hover:underline">Edit</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Add Service Modal */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <>
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
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-black uppercase text-gray-500 tracking-widest mb-1.5">Base Price (₹)</label>
                                            <input 
                                                type="number" 
                                                value={newService.price}
                                                onChange={e => setNewService({...newService, price: e.target.value})}
                                                placeholder="400" 
                                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-900 outline-none focus:border-primary transition-colors shadow-sm" 
                                            />
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
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminServices;
