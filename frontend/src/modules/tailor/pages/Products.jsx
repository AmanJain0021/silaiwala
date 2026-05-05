import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, Search, Scissors, Layers, ShoppingBag, Package, ChevronRight, X } from 'lucide-react';
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
            let sData = [...sRaw];
            if (sData.length === 0) {
                sData = Array.from({ length: 12 }, (_, i) => ({
                    _id: `seed-service-${i}`,
                    title: `Stitching Sample #${i + 1}`,
                    basePrice: 300 + (i * 50),
                    deliveryTime: '2-4 DAYS',
                    category: { name: 'Designer' },
                    serviceType: 'STITCHING'
                }));
            } else if (sData.length > 0 && sData.length < 12) {
                const base = sData[0];
                const seed = Array.from({ length: 12 - sData.length }, (_, i) => ({
                    ...base,
                    _id: `seed-service-${i}`,
                    title: `${base.title || 'Service'} #${i + 2}`,
                }));
                sData = [...sData, ...seed];
            }
            setSamples(sData);

            const pRaw = productsRes.data.data || (Array.isArray(productsRes.data) ? productsRes.data : []);
            let pData = [...pRaw];
            if (pData.length === 0) {
                pData = Array.from({ length: 12 }, (_, i) => ({
                    _id: `seed-fabric-${i}`,
                    name: `Fabric Material #${i + 1}`,
                    price: 500 + (i * 100),
                    stock: 50 + i,
                    category: { name: 'Cotton' }
                }));
            } else if (pData.length > 0 && pData.length < 12) {
                const base = pData[0];
                const seed = Array.from({ length: 12 - pData.length }, (_, i) => ({
                    ...base,
                    _id: `seed-fabric-${i}`,
                    name: `${base.name || 'Fabric'} #${i + 2}`,
                }));
                pData = [...pData, ...seed];
            }
            setFabrics(pData);

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
                    category: newItem.category,
                    tags: typeof newItem.tags === 'string'
                        ? newItem.tags.split(',').map(t => t.trim()).filter(t => t !== '')
                        : newItem.tags,
                    isActive: true
                };
            } else if (activeTab === 'fabrics') {
                endpoint = isEditing ? `/tailors/products/${editId}` : '/tailors/products';
                payload = { ...newItem, title: (newItem.name || newItem.title) };
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
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-2xl font-black text-[#2D2F6E] tracking-tighter">
                        {activeTab === 'samples' ? 'Stitching Services' : 'Fabric Inventory'}
                    </h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                        {activeTab === 'samples' ? 'Manage your bookable services' : 'Manage your fabric materials'}
                    </p>
                </div>
                <button
                    onClick={() => {
                        setIsEditing(false);
                        setShowModal(true);
                    }}
                    className="h-12 w-12 bg-[#2D2F6E] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-900/10 hover:bg-primary-dark active:scale-90 transition-all"
                >
                    <Plus size={24} />
                </button>
            </div>

            {/* Toggle Tabs */}
            <div className="flex p-1 bg-gray-100 rounded-[1.25rem] gap-1">
                <button
                    onClick={() => setActiveTab('samples')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-widest rounded-[1rem] transition-all ${activeTab === 'samples' ? 'bg-[#2D2F6E] text-white shadow-md' : 'text-gray-400'}`}
                >
                    <Layers size={14} /> Stitching Services
                </button>
                <button
                    onClick={() => setActiveTab('fabrics')}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-widest rounded-[1rem] transition-all ${activeTab === 'fabrics' ? 'bg-[#2D2F6E] text-white shadow-md' : 'text-gray-400'}`}
                >
                    <ShoppingBag size={14} /> Fabric Inventory
                </button>
            </div>

            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
                <input
                    type="text"
                    placeholder={`Search ${activeTab === 'samples' ? 'samples' : 'fabrics'}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-white border border-gray-100 rounded-2xl focus:outline-none focus:border-[#2D2F6E] shadow-sm text-sm transition-colors"
                />
            </div>

            <div className="space-y-8 mt-8">
                {isLoading ? (
                    <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                        {[1, 2].map(i => (
                            <div key={i} className="w-[calc(50%-6px)] flex-shrink-0 bg-white h-48 rounded-[1.5rem] animate-pulse border border-gray-50" />
                        ))}
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-[2.5rem] border border-gray-50 shadow-sm flex flex-col items-center w-full">
                        <div className="h-20 w-20 bg-gray-50 rounded-full flex items-center justify-center mb-4 transition-transform hover:scale-110">
                            {activeTab === 'samples' ? <Scissors size={32} className="text-gray-200" /> : <Package size={32} className="text-gray-200" />}
                        </div>
                        <p className="text-gray-400 font-bold text-sm tracking-tight uppercase">No {activeTab} found</p>
                        <button onClick={() => { setIsEditing(false); setShowModal(true); }} className="mt-4 text-[#2D2F6E] text-[10px] font-black underline uppercase tracking-widest">Add your first {activeTab.slice(0, -1)}</button>
                    </div>
                ) : (
                    (() => {
                        const chunks = [];
                        for (let i = 0; i < filteredItems.length; i += 10) {
                            chunks.push(filteredItems.slice(i, i + 10));
                        }
                        return chunks.map((chunk, chunkIdx) => (
                            <div key={chunkIdx} className="flex gap-3 overflow-x-auto pb-4 snap-x scrollbar-hide">
                                {chunk.map((item) => (
                                    <div key={item._id} className="w-[calc(50%-6px)] flex-shrink-0 bg-white rounded-[1.25rem] border border-gray-50 shadow-[0_4px_20px_rgb(0,0,0,0.03)] overflow-hidden flex flex-col group transition-all hover:shadow-xl hover:translate-y-[-4px] animate-in fade-in slide-in-from-bottom-2 duration-300 snap-center">
                                        {/* Image Container */}
                                        <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
                                            <SafeImage
                                                src={item.image || item.images?.[0]}
                                                alt={item.title || item.name}
                                                className="w-full h-full group-hover:scale-105 transition-transform duration-700"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                            
                                            <div className="absolute top-2 right-2 flex gap-1.5 translate-y-[-10px] opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                                                <button
                                                    onClick={() => handleEdit(item)}
                                                    className="p-1.5 bg-white shadow-xl rounded-lg text-gray-600 hover:text-[#2D2F6E] hover:bg-indigo-50 active:scale-95 transition-all"
                                                >
                                                    <Edit3 size={14} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(item._id, activeTab)}
                                                    className="p-1.5 bg-white shadow-xl rounded-lg text-red-500 hover:text-white hover:bg-red-500 active:scale-95 transition-all"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>

                                            <div className="absolute bottom-2 left-2 flex flex-wrap gap-1 max-w-[90%]">
                                                <div className="bg-[#2D2F6E] text-white px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-wider shadow-lg border border-white/10 backdrop-blur-md">
                                                    {item.category?.name || 'General'}
                                                </div>
                                                {activeTab === 'samples' && (
                                                    <>
                                                        <div className="bg-white/20 text-white px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-wider shadow-lg border border-white/10 backdrop-blur-md">
                                                            {item.serviceType || 'STITCHING'}
                                                        </div>
                                                        {item.tags && item.tags.slice(0, 1).map((tag, idx) => (
                                                            <div key={idx} className="bg-yellow-400 text-[#2D2F6E] px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-wider shadow-lg border border-white/10">
                                                                {tag}
                                                            </div>
                                                        ))}
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        <div className="p-4 flex flex-col justify-between flex-1">
                                            <div>
                                                <h4 className="text-sm font-black text-gray-900 tracking-tight leading-snug group-hover:text-primary transition-colors line-clamp-1">
                                                    {item.title || item.name}
                                                </h4>
                                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider mt-1.5 flex items-center gap-1">
                                                    {activeTab === 'samples' ? (
                                                        <><Scissors size={10} /> EST: {item.deliveryTime || '10-15 DAYS'}</>
                                                    ) : (
                                                        <><Package size={10} /> STOCK: <span className="text-[#2D2F6E] font-black">{item.stock || 0}M</span></>
                                                    )}
                                                </p>
                                            </div>
                                            <div className="mt-3 pt-2 border-t border-gray-50 flex items-baseline justify-between">
                                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{activeTab === 'samples' ? 'Base' : 'Rate'}</p>
                                                <p className="text-base font-black text-[#2D2F6E] italic tracking-tighter">
                                                    ₹{(item.basePrice || item.price || item.laborPrice || 0).toLocaleString()}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))
                    })()
                )}
            </div>

            {/* Add New Modal */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#2D2F6E]/20 backdrop-blur-xl animate-in fade-in duration-500">
                    <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-[0_32px_100px_rgba(0,0,0,0.18)] flex flex-col overflow-hidden animate-in zoom-in-95 duration-500 relative max-h-[92vh]">
                        {/* Close Button Top Right */}
                        <button
                            onClick={closeModal}
                            className="absolute top-6 right-6 h-10 w-10 flex items-center justify-center rounded-full bg-[#f8f9fa] text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all z-20"
                        >
                            <X size={18} />
                        </button>

                        <div className="p-8 md:p-12 pt-12 md:pt-16 pb-4 md:pb-6">
                            <div>
                                <h4 className="text-3xl md:text-4xl font-black text-[#2D2F6E] tracking-tighter uppercase italic leading-none">{isEditing ? 'Edit' : 'Upload'} {activeTab === 'samples' ? 'Service' : 'Fabric'}</h4>
                                <p className="text-[10px] md:text-[11px] font-bold text-gray-400 uppercase tracking-[0.25em] mt-3">{isEditing ? `Update your existing ${activeTab.slice(0, -1)} details` : (activeTab === 'samples' ? 'Add a new stitching service for customers' : 'Add new fabric material to your shop')}</p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 md:p-10 pt-2 space-y-4 md:space-y-6 overflow-y-auto custom-scrollbar border-b border-gray-50/50">
                            {/* Title/Name */}
                            <div className="space-y-1.5 md:space-y-2">
                                <label className="text-[11px] font-black text-gray-600 uppercase tracking-widest ml-4">Title / Name</label>
                                <input
                                    required
                                    className="w-full px-8 py-5 bg-[#f8f9fa] border-2 border-transparent focus:border-[#2D2F6E]/10 rounded-full focus:outline-none focus:ring-8 ring-[#2D2F6E]/5 focus:bg-white transition-all text-sm font-black text-[#2D2F6E] placeholder:text-gray-400 shadow-inner"
                                    placeholder={activeTab === 'samples' ? "e.g. Royal Silk Sherwani" : "e.g. Italian Wool Fabric"}
                                    value={activeTab === 'samples' ? newItem.title : newItem.name}
                                    onChange={(e) => activeTab === 'samples'
                                        ? setNewItem({ ...newItem, title: e.target.value })
                                        : setNewItem({ ...newItem, name: e.target.value })
                                    }
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                                {/* Category Selection */}
                                <div className="space-y-2.5">
                                    <label className="text-[11px] font-black text-gray-600 uppercase tracking-widest ml-4">
                                        {activeTab === 'fabrics' ? 'Fabric Category' : 'Category'}
                                    </label>
                                    <div className="relative">
                                        <select
                                            required
                                            className="w-full px-8 py-5 bg-[#f8f9fa] border-2 border-transparent focus:border-[#2D2F6E]/10 rounded-full focus:outline-none focus:ring-8 ring-[#2D2F6E]/5 focus:bg-white transition-all text-sm font-black text-[#2D2F6E] appearance-none cursor-pointer"
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
                                            <option value="">Select {activeTab === 'fabrics' ? 'Type' : 'Category'}</option>
                                            {categories
                                                .filter(cat => activeTab === 'samples' ? cat.type === 'service' : cat.type === 'product')
                                                .map(cat => (
                                                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                                                ))}
                                        </select>
                                        <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none text-[#2D2F6E]/30">
                                            <ChevronRight className="rotate-90" size={20} />
                                        </div>
                                    </div>
                                </div>

                                {/* Subcategory Selection (Only for Fabrics) */}
                                {activeTab === 'fabrics' && selectedParent && (
                                    <div className="space-y-2.5 animate-in slide-in-from-top-2 duration-300">
                                        <label className="text-[11px] font-black text-gray-600 uppercase tracking-widest ml-4">Material / Sub-Fabric</label>
                                        <div className="relative">
                                            <select
                                                required
                                                className="w-full px-8 py-5 bg-[#f8f9fa] border-2 border-transparent focus:border-[#2D2F6E]/10 rounded-full focus:outline-none focus:ring-8 ring-[#2D2F6E]/5 focus:bg-white transition-all text-sm font-black text-[#2D2F6E] appearance-none cursor-pointer"
                                                value={newItem.category}
                                                onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                                            >
                                                <option value="">Select Material</option>
                                                {subcategories.map(cat => (
                                                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none text-[#2D2F6E]/30">
                                                <ChevronRight className="rotate-90" size={20} />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4 md:gap-6">
                                {/* Price */}
                                <div className="space-y-2.5">
                                    <label className="text-[11px] font-black text-gray-600 uppercase tracking-widest ml-4">Price (₹)</label>
                                    <input
                                        required
                                        type="number"
                                        className="w-full px-8 py-5 bg-[#f8f9fa] border-2 border-transparent focus:border-[#2D2F6E]/10 rounded-full focus:outline-none focus:ring-8 ring-[#2D2F6E]/5 focus:bg-white transition-all text-sm font-black text-[#2D2F6E]"
                                        placeholder="0.00"
                                        value={activeTab === 'samples' ? newItem.basePrice : newItem.price}
                                        onChange={(e) => activeTab === 'samples'
                                            ? setNewItem({ ...newItem, basePrice: e.target.value })
                                            : setNewItem({ ...newItem, price: e.target.value })
                                        }
                                    />
                                </div>
                                {/* Time / Stock */}
                                <div className="space-y-2.5">
                                    <label className="text-[11px] font-black text-gray-600 uppercase tracking-widest ml-4">
                                        {activeTab === 'samples' ? 'Avg Time' : 'Stock (Mtrs)'}
                                    </label>
                                    <input
                                        required
                                        className="w-full px-8 py-5 bg-[#f8f9fa] border-2 border-transparent focus:border-[#2D2F6E]/10 rounded-full focus:outline-none focus:ring-8 ring-[#2D2F6E]/5 focus:bg-white transition-all text-sm font-black text-[#2D2F6E] placeholder:text-gray-400"
                                        placeholder={activeTab === 'samples' ? "2-4 DAYS" : "50"}
                                        value={activeTab === 'samples' ? newItem.deliveryTime : newItem.stock}
                                        onChange={(e) => activeTab === 'samples'
                                            ? setNewItem({ ...newItem, deliveryTime: e.target.value })
                                            : setNewItem({ ...newItem, stock: e.target.value })
                                        }
                                    />
                                </div>
                            </div>                             {/* Description */}
                            <div className="space-y-2.5">
                                <label className="text-[11px] font-black text-gray-600 uppercase tracking-widest ml-4">Description</label>
                                <textarea
                                    required
                                    rows="3"
                                    className="w-full px-8 py-6 bg-[#f8f9fa] border-2 border-transparent focus:border-[#2D2F6E]/10 rounded-[2rem] focus:outline-none focus:ring-8 ring-[#2D2F6E]/5 focus:bg-white transition-all text-sm font-black text-[#2D2F6E] resize-none placeholder:text-gray-400 shadow-inner"
                                    placeholder={`Describe your ${activeTab.slice(0, -1)}...`}
                                    value={newItem.description}
                                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                                />
                            </div>

                            {/* Tags Input */}
                            {activeTab === 'samples' && (
                                <div className="space-y-2.5">
                                    <label className="text-[11px] font-black text-gray-600 uppercase tracking-widest ml-4">Tags (Comma separated)</label>
                                    <input
                                        className="w-full px-8 py-5 bg-[#f8f9fa] border-2 border-transparent focus:border-[#2D2F6E]/10 rounded-full focus:outline-none focus:ring-8 ring-[#2D2F6E]/5 focus:bg-white transition-all text-sm font-black text-[#2D2F6E] placeholder:text-gray-400 shadow-inner"
                                        placeholder="e.g. POPULAR, EXPRESS, BRIDAL"
                                        value={newItem.tags}
                                        onChange={(e) => setNewItem({ ...newItem, tags: e.target.value.toUpperCase() })}
                                    />
                                    <div className="flex flex-wrap gap-2 mt-2 ml-2">
                                        {newItem.tags.split(',').map((tag, idx) => tag.trim() !== '' && (
                                            <span key={idx} className="px-2 md:px-3 py-1 bg-[#2D2F6E] text-white text-[8px] md:text-[9px] font-black rounded-lg tracking-widest uppercase">
                                                {tag.trim()}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Category Image */}
                            <div className="space-y-2.5">
                                <label className="text-[11px] font-black text-gray-600 uppercase tracking-widest ml-4">Image / Photo</label>
                                <div className="flex gap-4 items-center px-2">
                                    <div className="h-20 w-20 rounded-2xl bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                                        {newItem.image ? (
                                            <img src={newItem.image} alt="Preview" className="w-full h-full object-cover" />
                                        ) : (
                                            <Scissors size={24} className="text-gray-200" />
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-3">
                                        <div className="relative">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                disabled={isImageUploading}
                                            />
                                            <div className="w-full px-6 py-4 bg-[#f8f9fa] rounded-2xl text-[10px] font-black text-[#2D2F6E] flex items-center justify-center gap-2 hover:bg-white border border-transparent hover:border-gray-100 transition-all uppercase tracking-widest">
                                                {isImageUploading ? (
                                                    <div className="w-4 h-4 border-2 border-[#2D2F6E] border-t-transparent animate-spin rounded-full" />
                                                ) : (
                                                    <Plus size={16} />
                                                )}
                                                {isImageUploading ? 'Uploading...' : 'Choose File'}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="h-px bg-gray-100 flex-1"></div>
                                            <span className="text-[8px] font-black text-gray-600 uppercase">Or</span>
                                            <div className="h-px bg-gray-100 flex-1"></div>
                                        </div>
                                        <input
                                            className="w-full px-4 py-2 bg-gray-50 border-none rounded-xl text-[10px] font-bold text-gray-400 outline-none focus:bg-white transition-all"
                                            placeholder="Paste image link manually"
                                            value={newItem.image}
                                            onChange={(e) => setNewItem({ ...newItem, image: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </form>

                        <div className="p-8 md:p-12 pt-4 md:pt-6 pb-10 md:pb-16 bg-white">
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="w-full bg-[#2D2F6E] text-white rounded-full py-6 font-black uppercase tracking-[0.3em] italic text-sm shadow-[0_24px_50px_rgba(255,92,138,0.22)] hover:shadow-[0_28px_60px_rgba(255,92,138,0.3)] transition-all active:scale-95 disabled:opacity-50"
                            >
                                {isSubmitting ? (isEditing ? 'Updating...' : 'Publishing...') : (isEditing ? 'Update ' : 'Publish ') + (activeTab === 'samples' ? 'Service' : 'Fabric')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Products;


