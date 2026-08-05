import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, Search, Scissors, Layers, ShoppingBag, Package, ChevronRight, X, Clock, Star, Camera } from 'lucide-react';
import { Button } from '../components/UIElements';
import api from '../services/api';
import toast from 'react-hot-toast';
import SafeImage from '../../../components/Common/SafeImage';
import GarmentForm from '../components/GarmentForm';
import { compressImage } from '../../../utils/imageCompression';

const Products = () => {
    const [activeTab, setActiveTab] = useState('samples'); // 'samples' | 'fabrics'
    const [samples, setSamples] = useState([]);
    const [fabrics, setFabrics] = useState([]);
    const [garments, setGarments] = useState([]);
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
        tags: '',
        sizes: '',
        colors: ''
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
            setFabrics(pRaw.filter(p => p.productType === 'fabric' || !p.productType)); // fallback for old data
            setGarments(pRaw.filter(p => p.productType === 'store_item'));

            // Fetch top-level categories
            if (catsRes.data.success) {
                // Set categories directly from the first fetch, avoiding an extra API call that might fail
                setCategories(catsRes.data.data);
            }
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (showModal) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [showModal]);

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
                console.warn('Backend /upload failed, attempting public endpoint:', err);
                try {
                    const resPub = await api.post('/upload/public', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                    const rawData = resPub.data?.data;
                    imageUrl = rawData?.url || (Array.isArray(rawData) ? rawData[0] : rawData) || resPub.data?.url;
                } catch (pubErr) {
                    console.warn('Public upload failed, using compressed Base64 fallback:', pubErr);
                    imageUrl = await new Promise((resolve) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result || '');
                        reader.onerror = () => resolve('');
                        reader.readAsDataURL(compressedFile);
                    });
                }
            }

            if (imageUrl) {
                setNewItem(prev => ({ ...prev, image: imageUrl }));
                toast.success('Product photo uploaded successfully');
            } else {
                toast.error('Could not process photo upload. Please try another image.');
            }
        } catch (error) {
            console.error('Upload failed:', error);
            toast.error('Image upload failed');
        } finally {
            setIsImageUploading(false);
            if (e.target) e.target.value = '';
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

        // Enforce Admin Category Selection First
        if (!newItem.category && (activeTab === 'samples' || activeTab === 'garments' || (activeTab === 'fabrics' && !selectedParent))) {
            toast.error('Please select an Admin-created Category first!');
            return;
        }

        // Client-side price range validation for service (samples) tab
        if (activeTab === 'samples' && newItem.category && newItem.basePrice) {
            const selectedCat = categories.find(c => c._id === newItem.category);
            if (selectedCat && selectedCat.minPrice != null && selectedCat.maxPrice != null) {
                const price = Number(newItem.basePrice);
                if (price < selectedCat.minPrice || price > selectedCat.maxPrice) {
                    toast.error(`Price must be between ₹${selectedCat.minPrice} and ₹${selectedCat.maxPrice} for ${selectedCat.name}.`);
                    return;
                }
            }
        }

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
            } else if (activeTab === 'garments') {
                endpoint = isEditing ? `/tailors/products/${editId}` : '/tailors/products';
                const finalName = newItem.name || newItem.title || '';
                payload = { 
                    ...newItem, 
                    title: finalName,
                    name: finalName,
                    ...(newItem.category ? { category: newItem.category } : {}),
                    stock: parseInt(String(newItem.stock).replace(/\D/g, ''), 10) || 0,
                    productType: 'store_item',
                    sizes: typeof newItem.sizes === 'string' ? newItem.sizes.split(',').map(s => s.trim()).filter(Boolean) : newItem.sizes,
                    colors: typeof newItem.colors === 'string' ? newItem.colors.split(',').map(c => ({ name: c.trim(), hex: '#000000' })).filter(c => c.name) : newItem.colors
                };
            }

            const res = isEditing
                ? await api.patch(endpoint, payload)
                : await api.post(endpoint, payload);

            if (res.data.success) {
                closeModal();
                fetchData();
                const approvalMsg = res.data.message;
                if (approvalMsg) {
                    toast.success(approvalMsg);
                } else if (!isEditing) {
                    toast.success('Submitted for admin approval. It will appear to customers after approval.');
                } else {
                    toast.success('Updated. Changes may require admin approval before customers see them.');
                }
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
            tags: '', sizes: '', colors: ''
        });
        setSelectedParent('');
        setSubcategories([]);
    };

    const handleDelete = async (id, type) => {
        const typeLabels = {
            samples: 'service',
            fabrics: 'fabric',
            garments: 'garment'
        };
        if (window.confirm(`Are you sure you want to delete this ${typeLabels[type]}?`)) {
            try {
                let endpoint = '';
                if (type === 'samples') endpoint = `/tailors/services/${id}`;
                else endpoint = `/tailors/products/${id}`;

                await api.delete(endpoint);
                toast.success(`${typeLabels[type]} deleted successfully!`);
                fetchData();
            } catch (error) {
                console.error('Delete error:', error);
                toast.error(`Failed to delete ${typeLabels[type]}`);
            }
        }
    };

    const itemsToShow = activeTab === 'samples' ? samples : activeTab === 'fabrics' ? fabrics : garments;
    const filteredItems = itemsToShow.filter(item =>
        (item.title || item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.category?.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-8 px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h3 className="text-[24px] font-black text-[#843D9B] tracking-tight leading-none">
                        {activeTab === 'samples' ? 'Stitching Services' : activeTab === 'fabrics' ? 'Fabric Inventory' : 'Ready-made Garments'}
                    </h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-2">
                        {activeTab === 'samples' ? 'Manage your bookable services' : activeTab === 'fabrics' ? 'Manage your fabric materials' : 'Manage your ready-made store items'}
                    </p>
                </div>
                <button
                    onClick={() => {
                        setIsEditing(false);
                        setShowModal(true);
                    }}
                    className="w-full sm:w-auto justify-center flex items-center gap-2 px-5 py-3.5 bg-gradient-to-r from-[#843D9B] to-[#B35BCB] text-white text-xs font-black uppercase tracking-wider rounded-2xl shadow-lg shadow-[#843D9B]/15 hover:shadow-xl hover:shadow-[#843D9B]/20 hover:scale-[1.02] active:scale-95 transition-all duration-300 cursor-pointer"
                >
                    <Plus size={16} strokeWidth={3} />
                    <span>Add {activeTab === 'samples' ? 'Service' : activeTab === 'fabrics' ? 'Fabric' : 'Garment'}</span>
                </button>
            </div>

            {/* Toggle Tabs */}
            <div className="flex p-1 bg-white border border-gray-100/80 rounded-2xl gap-1 shadow-sm">
                <button
                    onClick={() => setActiveTab('samples')}
                    className={`flex-1 flex items-center justify-center gap-2.5 py-3 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all duration-300 cursor-pointer ${activeTab === 'samples' ? 'bg-[#843D9B] text-white shadow-md shadow-[#843D9B]/15' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50/50'}`}
                >
                    <Layers size={14} /> Services
                </button>
                <button
                    onClick={() => setActiveTab('fabrics')}
                    className={`flex-1 flex items-center justify-center gap-2.5 py-3 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all duration-300 cursor-pointer ${activeTab === 'fabrics' ? 'bg-[#843D9B] text-white shadow-md shadow-[#843D9B]/15' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50/50'}`}
                >
                    <ShoppingBag size={14} /> Fabrics
                </button>
                <button
                    onClick={() => setActiveTab('garments')}
                    className={`flex-1 flex items-center justify-center gap-2.5 py-3 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all duration-300 cursor-pointer ${activeTab === 'garments' ? 'bg-[#843D9B] text-white shadow-md shadow-[#843D9B]/15' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50/50'}`}
                >
                    <Package size={14} /> Garments
                </button>
            </div>

            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                    type="text"
                    placeholder={`Search in ${activeTab === 'samples' ? 'services' : activeTab === 'fabrics' ? 'fabrics' : 'garments'}...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 bg-white border border-gray-100/80 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#843D9B]/10 focus:border-[#843D9B] shadow-sm text-xs font-semibold transition-all duration-300 placeholder:text-gray-400 text-gray-900"
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
                        <button onClick={() => { setIsEditing(false); setShowModal(true); }} className="mt-6 text-[#843D9B] text-[11px] font-black underline uppercase tracking-widest hover:text-[#4E2460] transition-colors">
                            Add your first {activeTab.slice(0, -1)}
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                        {filteredItems.map((item) => {
                            const currentPrice = item.price || item.basePrice || item.laborPrice || 0;
                            const originalPrice = item.discountPrice || item.originalPrice || 0;
                            const discount = originalPrice && originalPrice > currentPrice ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100) : 0;
                            const isOutOfStock = activeTab !== 'samples' && item.stock <= 0;

                            return (
                                <div 
                                    key={item._id} 
                                    onClick={() => handleEdit(item)}
                                    className="group relative bg-white border border-gray-100/60 rounded-3xl overflow-hidden flex flex-col transition-all duration-300 hover:shadow-2xl hover:-translate-y-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.015)] cursor-pointer"
                                >
                                    {/* Image Container */}
                                    <div className="aspect-[4/5] bg-gray-50 relative overflow-hidden">
                                        <SafeImage
                                            src={item.image || item.images?.[0]}
                                            alt={item.title || item.name}
                                            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                                        />
                                        
                                        {/* Status / Discount Badges */}
                                        <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5">
                                            {item.status === 'pending' && (
                                                <div className="bg-amber-500/95 text-white text-[8px] font-black px-2 py-0.5 rounded-full shadow-md tracking-wider uppercase">
                                                    Pending approval
                                                </div>
                                            )}
                                            {item.status === 'approved' && (
                                                <div className="bg-emerald-500/95 text-white text-[8px] font-black px-2 py-0.5 rounded-full shadow-md tracking-wider uppercase">
                                                    Approved
                                                </div>
                                            )}
                                            {item.status === 'rejected' && (
                                                <div className="bg-rose-600/95 text-white text-[8px] font-black px-2 py-0.5 rounded-full shadow-md tracking-wider uppercase" title={item.rejectionReason || ''}>
                                                    Rejected
                                                </div>
                                            )}
                                            {discount > 0 && (
                                                <div className="bg-[#FFBC00] text-[#843D9B] text-[10px] font-black px-2.5 py-0.5 rounded-full shadow-md">
                                                    -{discount}%
                                                </div>
                                            )}
                                            {isOutOfStock ? (
                                                <div className="bg-rose-500/90 text-white text-[8px] font-black px-2 py-0.5 rounded-full shadow-md tracking-wider uppercase">
                                                    Out of Stock
                                                </div>
                                            ) : activeTab !== 'samples' && (
                                                <div className="bg-emerald-500/90 text-white text-[8px] font-black px-2 py-0.5 rounded-full shadow-md tracking-wider uppercase">
                                                    In Stock
                                                </div>
                                            )}
                                        </div>


                                    </div>

                                    {/* Compact details matching E-commerce style */}
                                    <div className="p-4 flex-1 flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="text-[9px] text-[#843D9B]/60 uppercase tracking-widest font-black truncate max-w-[65%]">
                                                    {item.category?.name || 'General'}
                                                </span>
                                                <div className="flex items-center gap-0.5 bg-indigo-50 px-1.5 py-0.5 rounded text-[9px] font-black text-[#843D9B]">
                                                    4.8 <Star className="h-2.5 w-2.5 fill-current" />
                                                </div>
                                            </div>

                                            <h4 className="text-[13px] font-black text-gray-900 line-clamp-1 mb-1 tracking-tight group-hover:text-[#843D9B] transition-colors leading-tight">
                                                {item.title || item.name}
                                            </h4>

                                            <div className="flex items-center gap-2 mt-1">
                                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1">
                                                    {activeTab === 'samples' ? (
                                                        <><Clock size={11} className="text-[#843D9B]/70" /> {item.deliveryTime || '2-4 DAYS'}</>
                                                    ) : activeTab === 'garments' ? (
                                                        <><Package size={11} className="text-[#843D9B]/70" /> {item.stock || 0} IN STOCK</>
                                                    ) : (
                                                        <><Package size={11} className="text-[#843D9B]/70" /> {item.stock || 0}M AVAILABLE</>
                                                    )}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-3 border-t border-gray-50 flex items-end justify-between">
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">
                                                    {activeTab === 'samples' ? 'Starting Price' : activeTab === 'garments' ? 'Price' : 'Price Per Meter'}
                                                </span>
                                                <div className="flex items-baseline gap-1.5">
                                                    <span className="text-[16px] font-black text-[#843D9B] tracking-tight leading-none">
                                                        ₹{currentPrice.toLocaleString()}
                                                    </span>
                                                    {originalPrice > currentPrice && (
                                                        <span className="text-[11px] text-gray-400 font-bold line-through opacity-60">
                                                            ₹{originalPrice.toLocaleString()}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleEdit(item); }}
                                                    className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-[#843D9B] hover:text-white transition-colors border border-gray-100 shadow-sm active:scale-95"
                                                    title="Edit"
                                                >
                                                    <Edit3 size={13} strokeWidth={2.5} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(item._id, activeTab); }}
                                                    className="h-8 w-8 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-colors border border-rose-100 shadow-sm active:scale-95"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={13} strokeWidth={2.5} />
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

            {/* Modal */}
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
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0A0A0A]/40 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-3xl rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-500 max-h-[90vh]">
                        
                        {/* Modal Header */}
                        <div className="px-8 pt-8 pb-4 flex items-center justify-between border-b border-gray-100/60">
                            <div>
                                <h4 className="text-2xl font-black text-[#843D9B] tracking-tight leading-none">
                                    {isEditing ? 'Update' : 'Add New'} {activeTab === 'samples' ? 'Service' : activeTab === 'fabrics' ? 'Fabric' : 'Garment'}
                                </h4>
                                <p className="text-[11px] font-bold text-gray-400 mt-2 uppercase tracking-widest">
                                    Fill in the details to list your product
                                </p>
                            </div>
                            <button
                                onClick={closeModal}
                                className="h-10 w-10 flex items-center justify-center rounded-2xl bg-gray-50 text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-all shadow-sm cursor-pointer"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Content */}
                        <form id="product-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 pt-6 space-y-6 custom-scrollbar">
                            
                            {/* Product Category Selection Card */}
                            <div className="bg-white border border-gray-100/90 rounded-2xl p-4 shadow-sm space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-black text-[#843D9B] uppercase tracking-widest flex items-center gap-1.5 ml-0.5">
                                        <Layers size={14} />
                                        Category *
                                    </label>
                                    {newItem.category && (
                                        <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-100">
                                            ✓ Selected
                                        </span>
                                    )}
                                </div>
                                <div className="relative">
                                    <select
                                        required
                                        className="w-full px-4 py-3 bg-gray-50/70 border border-gray-200/80 focus:border-[#843D9B] focus:ring-2 focus:ring-[#843D9B]/10 rounded-xl focus:outline-none focus:bg-white transition-all text-xs font-semibold text-gray-900 appearance-none cursor-pointer shadow-xs"
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
                                        <option value="">Select Category</option>
                                        {categories
                                            .filter(cat => activeTab === 'samples' ? cat.type === 'service' : (cat.type === 'product' && !cat.parentCategory))
                                            .map(cat => (
                                                <option key={cat._id} value={cat._id}>{cat.name}</option>
                                            ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                        <ChevronRight size={14} className="rotate-90" />
                                    </div>
                                </div>

                                {activeTab === 'fabrics' && selectedParent && (
                                    <div className="space-y-1.5 pt-1 animate-in slide-in-from-top-2">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-0.5">Select Sub-Material *</label>
                                        <div className="relative">
                                            <select
                                                required
                                                className="w-full px-4 py-3 bg-gray-50/70 border border-gray-200/80 focus:border-[#843D9B] focus:ring-2 focus:ring-[#843D9B]/10 rounded-xl focus:outline-none focus:bg-white transition-all text-xs font-semibold text-gray-900 appearance-none cursor-pointer shadow-xs"
                                                value={newItem.category}
                                                onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                                            >
                                                <option value="">Select Material</option>
                                                {subcategories.map(cat => (
                                                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                                <ChevronRight size={14} className="rotate-90" />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Allowed Price Band Hint */}
                                {(() => {
                                    const selectedCat = newItem.category ? categories.find(c => c._id === newItem.category) : null;
                                    if (selectedCat && selectedCat.minPrice != null && selectedCat.maxPrice != null) {
                                        return (
                                            <div className="pt-0.5 flex items-center justify-between text-[10px] font-bold text-gray-500">
                                                <span>Allowed Price Range:</span>
                                                <span className="text-[#843D9B] font-black bg-[#843D9B]/5 px-2 py-0.5 rounded-md">
                                                    ₹{selectedCat.minPrice} – ₹{selectedCat.maxPrice}
                                                </span>
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Left Side: Details */}
                                <div className="space-y-5">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-[#843D9B]/80 uppercase tracking-widest ml-1">
                                            Title / Service Name (According to your shop) *
                                        </label>
                                        <input
                                            required
                                            className="w-full px-5 py-3.5 bg-gray-50/60 border border-gray-100/80 focus:border-[#843D9B] focus:ring-2 focus:ring-[#843D9B]/10 rounded-2xl focus:outline-none focus:bg-white transition-all text-xs font-semibold text-gray-900 placeholder:text-gray-300 shadow-sm"
                                            placeholder={activeTab === 'samples' ? "e.g. Rimjhim Kurti - Special Shop Design" : "e.g. Premium Linen Cotton"}
                                            value={activeTab === 'samples' ? newItem.title : newItem.name}
                                            onChange={(e) => activeTab === 'samples'
                                                ? setNewItem({ ...newItem, title: e.target.value })
                                                : setNewItem({ ...newItem, name: e.target.value })
                                            }
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-[#843D9B]/80 uppercase tracking-widest ml-1">
                                                {activeTab === 'samples' ? 'Base Price' : 'Price / Mtr'}
                                            </label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xs">₹</span>
                                                <input
                                                    required
                                                    type="number"
                                                    className="w-full pl-8 pr-5 py-3.5 bg-gray-50/60 border border-gray-100/80 focus:border-[#843D9B] focus:ring-2 focus:ring-[#843D9B]/10 rounded-2xl focus:outline-none focus:bg-white transition-all text-xs font-semibold text-gray-900 shadow-sm"
                                                    value={activeTab === 'samples' ? newItem.basePrice : newItem.price}
                                                    onChange={(e) => activeTab === 'samples'
                                                        ? setNewItem({ ...newItem, basePrice: e.target.value })
                                                        : setNewItem({ ...newItem, price: e.target.value })
                                                    }
                                                />
                                            </div>
                                            {activeTab === 'samples' && (() => {
                                                const selectedCat = newItem.category ? categories.find(c => c._id === newItem.category) : null;
                                                if (selectedCat && selectedCat.minPrice != null && selectedCat.maxPrice != null) {
                                                    const price = newItem.basePrice ? Number(newItem.basePrice) : null;
                                                    const isOutOfRange = price != null && (price < selectedCat.minPrice || price > selectedCat.maxPrice);
                                                    return (
                                                        <div className={`mt-1.5 px-3 py-2 rounded-xl text-[10px] font-bold flex items-center gap-1.5 ${
                                                            isOutOfRange 
                                                                ? 'bg-red-50 text-red-600 border border-red-100' 
                                                                : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                                        }`}>
                                                            <span>{isOutOfRange ? '⚠' : '✓'}</span>
                                                            <span>Allowed: ₹{selectedCat.minPrice} – ₹{selectedCat.maxPrice}</span>
                                                        </div>
                                                    );
                                                }
                                                if (selectedCat && selectedCat.basePrice != null) {
                                                    return (
                                                        <p className="mt-1 text-[10px] text-gray-400 font-medium ml-1">
                                                            Suggested: ₹{selectedCat.basePrice}
                                                        </p>
                                                    );
                                                }
                                                return null;
                                            })()}
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-[#843D9B]/80 uppercase tracking-widest ml-1">
                                                {activeTab === 'samples' ? 'Delivery Time' : 'Total Stock'}
                                            </label>
                                            <input
                                                required
                                                type={activeTab === 'fabrics' ? "number" : "text"}
                                                className="w-full px-5 py-3.5 bg-gray-50/60 border border-gray-100/80 focus:border-[#843D9B] focus:ring-2 focus:ring-[#843D9B]/10 rounded-2xl focus:outline-none focus:bg-white transition-all text-xs font-semibold text-gray-900 shadow-sm"
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
                                        <label className="text-[10px] font-black text-[#843D9B]/80 uppercase tracking-widest ml-1">Product Description</label>
                                        <textarea
                                            required
                                            rows="3"
                                            className="w-full px-5 py-3.5 bg-gray-50/60 border border-gray-100/80 focus:border-[#843D9B] focus:ring-2 focus:ring-[#843D9B]/10 rounded-2xl focus:outline-none focus:bg-white transition-all text-xs font-semibold text-gray-900 resize-none placeholder:text-gray-300 shadow-sm"
                                            placeholder="Tell customers about quality and features..."
                                            value={newItem.description}
                                            onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                                        />
                                    </div>

                                    {activeTab === 'garments' && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-[#843D9B]/80 uppercase tracking-widest ml-1">Sizes (comma separated)</label>
                                                <input
                                                    className="w-full px-5 py-3.5 bg-gray-50/60 border border-gray-100/80 focus:border-[#843D9B] focus:ring-2 focus:ring-[#843D9B]/10 rounded-2xl focus:outline-none focus:bg-white transition-all text-xs font-semibold text-gray-900 shadow-sm"
                                                    placeholder="e.g. S, M, L, XL"
                                                    value={newItem.sizes}
                                                    onChange={(e) => setNewItem({ ...newItem, sizes: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black text-[#843D9B]/80 uppercase tracking-widest ml-1">Colors (comma separated)</label>
                                                <input
                                                    className="w-full px-5 py-3.5 bg-gray-50/60 border border-gray-100/80 focus:border-[#843D9B] focus:ring-2 focus:ring-[#843D9B]/10 rounded-2xl focus:outline-none focus:bg-white transition-all text-xs font-semibold text-gray-900 shadow-sm"
                                                    placeholder="e.g. Red, Blue, Black"
                                                    value={newItem.colors}
                                                    onChange={(e) => setNewItem({ ...newItem, colors: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    )}

                                </div>

                                {/* Right Side: Media */}
                                <div className="space-y-5">

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-[#843D9B]/80 uppercase tracking-widest ml-1">Product Image</label>
                                        <div className="flex gap-4 p-4 bg-gray-50/60 rounded-[2rem] border border-gray-100/80">
                                            <div className="h-24 w-24 rounded-2xl bg-white border border-gray-100 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                                                {newItem.image ? (
                                                    <img src={newItem.image} alt="Preview" className="w-full h-full object-cover" />
                                                ) : (
                                                    <ShoppingBag size={24} className="text-gray-200" />
                                                )}
                                            </div>
                                            <div className="flex-1 flex flex-col justify-center gap-2">
                                                <div className="flex gap-2">
                                                    <div className="relative flex-1">
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={handleImageUpload}
                                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                            disabled={isImageUploading}
                                                        />
                                                        <button type="button" className="w-full h-[38px] bg-white rounded-xl text-[10px] font-black text-[#843D9B] border border-gray-100 shadow-sm flex items-center justify-center gap-1.5 uppercase tracking-widest cursor-pointer hover:bg-gray-50 active:scale-95 transition-all">
                                                            {isImageUploading ? <div className="h-3 w-3 border-2 border-[#843D9B] border-t-transparent animate-spin rounded-full" /> : <Plus size={14} />}
                                                            <span className="hidden sm:inline">{isImageUploading ? 'Uploading...' : 'Upload Image'}</span>
                                                            <span className="sm:hidden">{isImageUploading ? '...' : 'Gallery'}</span>
                                                        </button>
                                                    </div>
                                                    <div className="relative flex-1">
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            capture="environment"
                                                            onChange={handleImageUpload}
                                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                                            disabled={isImageUploading}
                                                        />
                                                        <button type="button" className="w-full h-[38px] bg-white rounded-xl text-[10px] font-black text-[#843D9B] border border-gray-100 shadow-sm flex items-center justify-center gap-1.5 uppercase tracking-widest cursor-pointer hover:bg-gray-50 active:scale-95 transition-all">
                                                            {isImageUploading ? <div className="h-3 w-3 border-2 border-[#843D9B] border-t-transparent animate-spin rounded-full" /> : <Camera size={14} />}
                                                            <span className="hidden sm:inline">{isImageUploading ? 'Uploading...' : 'Take Photo'}</span>
                                                            <span className="sm:hidden">{isImageUploading ? '...' : 'Camera'}</span>
                                                        </button>
                                                    </div>
                                                </div>
                                                <input
                                                    className="w-full px-4 py-2 bg-transparent border-b border-gray-200 text-[10px] font-black text-gray-400 focus:text-gray-900 focus:border-[#843D9B] outline-none transition-all"
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
                        <div className="p-8 border-t border-gray-100 bg-gray-50/50 flex gap-4">
                            <button
                                onClick={closeModal}
                                className="px-8 py-4 bg-white border border-gray-200 rounded-2xl text-xs font-black text-gray-500 uppercase tracking-widest hover:bg-gray-50 transition-all cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="product-form"
                                disabled={isSubmitting}
                                className="flex-1 bg-[#843D9B] hover:bg-[#4E2460] text-white rounded-2xl py-4 font-black text-xs uppercase tracking-widest shadow-xl shadow-[#843D9B]/10 active:scale-95 disabled:opacity-50 transition-all cursor-pointer"
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


