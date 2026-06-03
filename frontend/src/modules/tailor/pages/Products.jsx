import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, Search, Scissors, Layers, ShoppingBag, Package, ChevronRight, X, Clock } from 'lucide-react';
import { Button } from '../components/UIElements';
import api from '../services/api';
import SafeImage from '../../../components/Common/SafeImage';

const Products = () => {
    const [activeTab, setActiveTab] = useState('samples'); // 'samples' | 'fabrics'
    const [samples, setSamples] = useState([]);
    const [fabrics, setFabrics] = useState([]);
    const [categories, setCategories] = useState([]); // These will be top-level categories
    const [subcategories, setSubcategories] = useState([]); // Tracks subcategories for selected parent
    const [selectedParent, setSelectedParent] = useState(''); // Tracking parent category for Fabrics
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
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
        tags: ''
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
            setFabrics(pRaw);

            // Fetch top-level categories
            if (catsRes.data.success) {
                // For 'fabrics', we only want categories with parentCategory: null
                // The API now supports 'parent' query param
                const topLevelRes = await api.get('/products/categories?parent=null');
                setCategories(topLevelRes.data.data);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setIsLoading(false);
        }
    };

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
            setNewItem({ ...newItem, image: res.data.data });
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Image upload failed');
        } finally {
            setIsImageUploading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Fetch subcategories when parent selection changes (only for Fabrics)
    useEffect(() => {
        const fetchSubcats = async () => {
            if (activeTab === 'fabrics' && selectedParent) {
                try {
                    const res = await api.get(`/products/categories?parent=${selectedParent}`);
                    setSubcategories(res.data.data);
                } catch (error) {
                    console.error('Error fetching subcategories:', error);
                }
            } else {
                setSubcategories([]);
            }
        };
        fetchSubcats();
    }, [selectedParent, activeTab]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            let endpoint = '';
            let payload = {};

            if (activeTab === 'samples') {
                endpoint = isEditing ? `/tailors/services/${editId}` : '/tailors/services';
                payload = {
                    title: newItem.title,
                    description: newItem.description,
                    image: newItem.image,
                    basePrice: newItem.basePrice,
                    deliveryTime: newItem.deliveryTime,
                    ...(newItem.category ? { category: newItem.category } : {}),
                    tags: typeof newItem.tags === 'string'
                        ? newItem.tags.split(',').map(t => t.trim()).filter(t => t !== '')
                        : newItem.tags,
                    isActive: true
                };
            } else if (activeTab === 'fabrics') {
                endpoint = isEditing ? `/tailors/products/${editId}` : '/tailors/products';
                const finalName = newItem.name || newItem.title || '';
                payload = { 
                    ...newItem, 
                    title: finalName,
                    name: finalName,
                    ...(newItem.category || selectedParent ? { category: newItem.category || selectedParent } : {}),
                    stock: parseInt(String(newItem.stock).replace(/\D/g, ''), 10) || 0,
                    productType: 'fabric'
                };
            }

            const res = isEditing
                ? await api.patch(endpoint, payload)
                : await api.post(endpoint, payload);

            if (res.data.success) {
                closeModal();
                fetchData();
            }
        } catch (error) {
            alert(error.response?.data?.message || 'Something went wrong');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (item) => {
        setIsEditing(true);
        setEditId(item._id);

        if (activeTab === 'samples') {
            setNewItem({
                ...newItem,
                title: item.title,
                description: item.description,
                image: item.image,
                basePrice: item.basePrice,
                deliveryTime: item.deliveryTime,
                category: item.category?._id || item.category,
                tags: Array.isArray(item.tags) ? item.tags.join(', ') : (item.tags || '')
            });
        } else {
            // For fabrics, we might need to find the parent category
            setNewItem({
                ...newItem,
                name: item.name || item.title,
                description: item.description,
                image: item.image || (item.images && item.images[0]),
                price: item.price,
                stock: item.stock,
                category: item.category?._id || item.category
            });

            // If it's a subcategory, we try to set the parent
            if (item.category?.parentCategory) {
                setSelectedParent(item.category.parentCategory);
            } else if (item.category && typeof item.category === 'object' && item.category._id) {
                // If the populated category has a parent, set it
                // Note: We might need to fetch the category details if not fully populated
            }
        }
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setIsEditing(false);
        setEditId(null);
        setNewItem({
            title: '', name: '', description: '', image: '',
            basePrice: '', price: '', deliveryTime: '2-4 DAYS',
            stock: '', category: '', serviceType: 'STITCHING',
            tags: ''
        });
        setSelectedParent('');
        setSubcategories([]);
    };

    const handleDelete = async (id, type) => {
        const typeLabels = {
            samples: 'service',
            fabrics: 'fabric'
        };
        if (window.confirm(`Are you sure you want to delete this ${typeLabels[type]}?`)) {
            try {
                let endpoint = '';
                if (type === 'samples') endpoint = `/tailors/services/${id}`;
                else if (type === 'fabrics') endpoint = `/tailors/products/${id}`;

                await api.delete(endpoint);
                fetchData();
            } catch (error) {
                console.error('Delete error:', error);
            }
        }
    };

    const itemsToShow = activeTab === 'samples' ? samples : fabrics;
    const filteredItems = itemsToShow.filter(item =>
        (item.title || item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.category?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
                <div>
                    <h3 className="text-[20px] font-black text-[#2D2F6E] tracking-tighter leading-none">
                        {activeTab === 'samples' ? 'Stitching Services' : 'Fabric Inventory'}
                    </h3>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                        {activeTab === 'samples' ? 'Manage your bookable services' : 'Manage your fabric materials'}
                    </p>
                </div>
                <button
                    onClick={() => {
                        setIsEditing(false);
                        setShowModal(true);
                    }}
                    className="h-10 w-10 bg-[#2D2F6E] text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-900/10 hover:bg-primary-dark active:scale-90 transition-all"
                >
                    <Plus size={20} />
                </button>
            </div>

            {/* Toggle Tabs */}
            <div className="flex p-0.5 bg-gray-100 rounded-2xl gap-0.5">
                <button
                    onClick={() => setActiveTab('samples')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'samples' ? 'bg-[#2D2F6E] text-white shadow-sm' : 'text-gray-400'}`}
                >
                    <Layers size={13} /> Services
                </button>
                <button
                    onClick={() => setActiveTab('fabrics')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-[9px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === 'fabrics' ? 'bg-[#2D2F6E] text-white shadow-sm' : 'text-gray-400'}`}
                >
                    <ShoppingBag size={13} /> Fabrics
                </button>
            </div>

            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={17} />
                <input
                    type="text"
                    placeholder={`Search ${activeTab === 'samples' ? 'samples' : 'fabrics'}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white border border-gray-100 rounded-2xl focus:outline-none focus:border-[#2D2F6E] shadow-sm text-[12px] transition-colors"
                />
            </div>

            <div className="mt-8">
                {isLoading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="aspect-[4/5] bg-white rounded-3xl animate-pulse border border-gray-50" />
                        ))}
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="text-center py-24 bg-white rounded-[3rem] border border-gray-100 shadow-sm flex flex-col items-center w-full">
                        <div className="h-24 w-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 text-gray-200">
                            {activeTab === 'samples' ? <Scissors size={40} /> : <Package size={40} />}
                        </div>
                        <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-xs">No {activeTab} found</p>
                        <button onClick={() => { setIsEditing(false); setShowModal(true); }} className="mt-6 text-[#2D2F6E] text-[11px] font-black underline uppercase tracking-widest hover:text-[#1e1f4a] transition-colors">
                            Add your first {activeTab.slice(0, -1)}
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                        {filteredItems.map((item) => (
                            <div key={item._id} className="bg-white rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden flex flex-col group transition-all hover:shadow-xl hover:-translate-y-1 duration-500 animate-in fade-in zoom-in-95">
                                {/* Image Container */}
                                <div className="aspect-[4/5] bg-gray-100 relative overflow-hidden">
                                    <SafeImage
                                        src={item.image || item.images?.[0]}
                                        alt={item.title || item.name}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                    
                                    <div className="absolute top-3 right-3 flex flex-col gap-2 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-500">
                                        <button
                                            onClick={() => handleEdit(item)}
                                            className="p-2 bg-white/90 backdrop-blur-md shadow-xl rounded-xl text-gray-900 hover:bg-[#2D2F6E] hover:text-white transition-all scale-90 group-hover:scale-100"
                                        >
                                            <Edit3 size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item._id, activeTab)}
                                            className="p-2 bg-white/90 backdrop-blur-md shadow-xl rounded-xl text-rose-500 hover:bg-rose-500 hover:text-white transition-all scale-90 group-hover:scale-100 delay-75"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>

                                    <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1.5 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 delay-100">
                                        <div className="bg-[#2D2F6E] text-white px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg border border-white/10 backdrop-blur-md">
                                            {item.category?.name || 'General'}
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 flex flex-col flex-1">
                                    <div className="flex-1">
                                        <h4 className="text-[14px] font-black text-gray-900 tracking-tight leading-tight line-clamp-1 mb-1">
                                            {item.title || item.name}
                                        </h4>
                                        <div className="flex items-center gap-2">
                                            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1">
                                                {activeTab === 'samples' ? (
                                                    <><Clock size={10} className="text-[#2D2F6E]" /> {item.deliveryTime || '2-4 DAYS'}</>
                                                ) : (
                                                    <><Package size={10} className="text-[#2D2F6E]" /> {item.stock || 0}M Left</>
                                                )}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                            {activeTab === 'samples' ? 'Starting' : 'Per Meter'}
                                        </span>
                                        <p className="text-[18px] font-black text-[#2D2F6E] tracking-tighter">
                                            ₹{(item.basePrice || item.price || item.laborPrice || 0).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Compact Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0A0A0A]/40 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-3xl rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-500 max-h-[90vh]">
                        
                        {/* Modal Header */}
                        <div className="px-8 pt-8 pb-4 flex items-center justify-between border-b border-gray-50">
                            <div>
                                <h4 className="text-2xl font-black text-[#2D2F6E] tracking-tight leading-none">
                                    {isEditing ? 'Update' : 'Add New'} {activeTab === 'samples' ? 'Service' : 'Fabric'}
                                </h4>
                                <p className="text-[11px] font-bold text-gray-400 mt-2 uppercase tracking-widest">
                                    Fill in the details to list your product
                                </p>
                            </div>
                            <button
                                onClick={closeModal}
                                className="h-10 w-10 flex items-center justify-center rounded-2xl bg-gray-50 text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-all shadow-sm"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <form id="product-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 pt-6 space-y-6 custom-scrollbar">
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Left Side: Details */}
                                <div className="space-y-5">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Title / Service Name</label>
                                        <input
                                            required
                                            className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 focus:border-[#2D2F6E]/30 rounded-2xl focus:outline-none focus:bg-white transition-all text-sm font-black text-gray-900 placeholder:text-gray-300"
                                            placeholder={activeTab === 'samples' ? "e.g. Italian Wedding Suit" : "e.g. Premium Linen Cotton"}
                                            value={activeTab === 'samples' ? newItem.title : newItem.name}
                                            onChange={(e) => activeTab === 'samples'
                                                ? setNewItem({ ...newItem, title: e.target.value })
                                                : setNewItem({ ...newItem, name: e.target.value })
                                            }
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                                {activeTab === 'samples' ? 'Base Price' : 'Price / Mtr'}
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-black text-sm">₹</span>
                                                <input
                                                    required
                                                    type="number"
                                                    className="w-full pl-8 pr-5 py-3.5 bg-gray-50 border border-gray-100 focus:border-[#2D2F6E]/30 rounded-2xl focus:outline-none focus:bg-white transition-all text-sm font-black text-gray-900"
                                                    value={activeTab === 'samples' ? newItem.basePrice : newItem.price}
                                                    onChange={(e) => activeTab === 'samples'
                                                        ? setNewItem({ ...newItem, basePrice: e.target.value })
                                                        : setNewItem({ ...newItem, price: e.target.value })
                                                    }
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                                                {activeTab === 'samples' ? 'Delivery Time' : 'Total Stock'}
                                            </label>
                                            <input
                                                required
                                                type={activeTab === 'fabrics' ? "number" : "text"}
                                                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 focus:border-[#2D2F6E]/30 rounded-2xl focus:outline-none focus:bg-white transition-all text-sm font-black text-gray-900"
                                                placeholder={activeTab === 'samples' ? "3-5 DAYS" : "100"}
                                                value={activeTab === 'samples' ? newItem.deliveryTime : newItem.stock}
                                                onChange={(e) => activeTab === 'samples'
                                                    ? setNewItem({ ...newItem, deliveryTime: e.target.value })
                                                    : setNewItem({ ...newItem, stock: e.target.value })
                                                }
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Product Description</label>
                                        <textarea
                                            required
                                            rows="3"
                                            className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 focus:border-[#2D2F6E]/30 rounded-2xl focus:outline-none focus:bg-white transition-all text-sm font-black text-gray-900 resize-none placeholder:text-gray-300"
                                            placeholder="Tell customers about quality and features..."
                                            value={newItem.description}
                                            onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                                        />
                                    </div>
                                </div>

                                {/* Right Side: Media & Categories */}
                                <div className="space-y-5">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Product Category</label>
                                        <select
                                            required
                                            className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 focus:border-[#2D2F6E]/30 rounded-2xl focus:outline-none focus:bg-white transition-all text-sm font-black text-gray-900 appearance-none cursor-pointer"
                                            value={activeTab === 'fabrics' ? selectedParent : newItem.category}
                                            onChange={(e) => {
                                                if (activeTab === 'fabrics') {
                                                    setSelectedParent(e.target.value);
                                                    setNewItem({ ...newItem, category: '' });
                                                } else {
                                                    setNewItem({ ...newItem, category: e.target.value });
                                                }
                                            }}
                                        >
                                            <option value="">Choose a category</option>
                                            {categories
                                                .filter(cat => activeTab === 'samples' ? cat.type === 'service' : cat.type === 'product')
                                                .map(cat => (
                                                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                                                ))}
                                        </select>
                                    </div>

                                    {activeTab === 'fabrics' && selectedParent && (
                                        <div className="space-y-1.5 animate-in slide-in-from-top-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Sub-Material</label>
                                            <select
                                                required
                                                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 focus:border-[#2D2F6E]/30 rounded-2xl focus:outline-none focus:bg-white transition-all text-sm font-black text-gray-900 appearance-none cursor-pointer"
                                                value={newItem.category}
                                                onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                                            >
                                                <option value="">Select Material</option>
                                                {subcategories.map(cat => (
                                                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Product Image</label>
                                        <div className="flex gap-4 p-4 bg-gray-50 rounded-[2rem] border border-gray-100">
                                            <div className="h-24 w-24 rounded-2xl bg-white border border-gray-100 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                                                {newItem.image ? (
                                                    <img src={newItem.image} alt="Preview" className="w-full h-full object-cover" />
                                                ) : (
                                                    <ShoppingBag size={24} className="text-gray-200" />
                                                )}
                                            </div>
                                            <div className="flex-1 flex flex-col justify-center gap-2">
                                                <div className="relative">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleImageUpload}
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                        disabled={isImageUploading}
                                                    />
                                                    <button className="w-full py-2.5 bg-white rounded-xl text-[10px] font-black text-[#2D2F6E] border border-gray-100 shadow-sm flex items-center justify-center gap-2 uppercase tracking-widest">
                                                        {isImageUploading ? <div className="h-3 w-3 border-2 border-[#2D2F6E] border-t-transparent animate-spin rounded-full" /> : <Plus size={14} />}
                                                        {isImageUploading ? 'Uploading...' : 'Upload Image'}
                                                    </button>
                                                </div>
                                                <input
                                                    className="w-full px-4 py-2 bg-transparent border-b border-gray-200 text-[10px] font-black text-gray-400 focus:text-gray-900 focus:border-[#2D2F6E] outline-none transition-all"
                                                    placeholder="Or paste URL"
                                                    value={newItem.image}
                                                    onChange={(e) => setNewItem({ ...newItem, image: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>

                        {/* Modal Footer */}
                        <div className="p-8 border-t border-gray-50 flex gap-4">
                            <button
                                onClick={closeModal}
                                className="px-8 py-4 bg-white border border-gray-200 rounded-2xl text-xs font-black text-gray-500 uppercase tracking-widest hover:bg-gray-50 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="product-form"
                                disabled={isSubmitting}
                                className="flex-1 bg-[#2D2F6E] text-white rounded-2xl py-4 font-black text-xs uppercase tracking-widest shadow-xl shadow-[#2D2F6E]/20 active:scale-95 disabled:opacity-50 transition-all"
                            >
                                {isSubmitting ? 'Processing...' : (isEditing ? 'Save Changes' : 'Publish Product')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Products;


