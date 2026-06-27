import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, Filter, X, Plus, Edit2, Trash2, Package, Tag, 
    Image as ImageIcon, IndianRupee, Check, AlertTriangle, 
    XCircle, ShoppingBag, Percent, Loader2 
} from 'lucide-react';
import api from '../../../utils/api';
import { toast } from 'react-hot-toast';

const AdminStore = () => {
    const [selectedTab, setSelectedTab] = useState('Products');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState([]);
    const [categories, setCategories] = useState([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);

    // Form States
    const [newProduct, setNewProduct] = useState({
        name: '', description: '', price: '', originalPrice: '',
        stock: '', category: '', image: '', isActive: true, productType: 'store_item'
    });

    const [newCategory, setNewCategory] = useState({
        name: '', description: '', type: 'product', isActive: true
    });

    const [newCoupon, setNewCoupon] = useState({
        code: '', description: '', discountType: 'percentage', discountValue: '',
        minOrderAmount: 0, isActive: true
    });

    const tabs = ['Products', 'Categories', 'Inventory', 'Coupons'];

    const fetchData = async () => {
        setIsLoading(true);
        try {
            let endpoint = '';
            switch (selectedTab) {
                case 'Products': endpoint = '/admin/store/products'; break;
                case 'Categories': endpoint = '/admin/categories?type=product'; break;
                case 'Inventory': endpoint = '/admin/store/products'; break;
                case 'Coupons': endpoint = '/admin/store/coupons'; break;
                default: endpoint = '/admin/store/products';
            }
            const res = await api.get(endpoint);
            setData(res.data.data || []);

            // If products/inventory, fetch categories for dropdown
            if (selectedTab === 'Products' || selectedTab === 'Inventory') {
                const catRes = await api.get('/admin/categories?type=product');
                setCategories(catRes.data.data || []);
            }
        } catch (error) {
            if (error?.name === 'CanceledError' || error?.message?.toLowerCase().includes('cancel')) return;
            console.error('Failed to fetch store data:', error);
            toast.error('Failed to load storage data');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedTab]);

    const resetForm = () => {
        setIsEditing(false);
        setEditId(null);
        setNewProduct({ name: '', description: '', price: '', originalPrice: '', stock: '', category: '', image: '', isActive: true, productType: 'store_item' });
        setNewCategory({ name: '', description: '', type: 'product', isActive: true });
        setNewCoupon({ code: '', description: '', discountType: 'percentage', discountValue: '', minOrderAmount: 0, isActive: true });
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this?')) return;
        try {
            let endpoint = '';
            if (selectedTab === 'Products' || selectedTab === 'Inventory') endpoint = `/admin/store/products/${id}`;
            if (selectedTab === 'Categories') endpoint = `/admin/categories/${id}`;
            if (selectedTab === 'Coupons') endpoint = `/admin/store/coupons/${id}`;

            await api.delete(endpoint);
            toast.success('Deleted successfully');
            fetchData();
        } catch (error) {
            if (error?.name === 'CanceledError' || error?.message?.toLowerCase().includes('cancel')) return;
            toast.error('Failed to delete');
        }
    };

    const handleFormSubmit = async () => {
        setIsSubmitting(true);
        try {
            let endpoint = '';
            let payload = {};
            let isCategory = selectedTab === 'Categories';
            let isCoupon = selectedTab === 'Coupons';
            let isProduct = selectedTab === 'Products' || selectedTab === 'Inventory';

            if (isProduct) {
                if (!newProduct.name || !newProduct.price || !newProduct.category) return toast.error('Check required fields');
                endpoint = isEditing ? `/admin/store/products/${editId}` : '/admin/store/products';
                payload = newProduct;
                // Tailor ID is now handled by the backend if missing
            } else if (isCategory) {
                if (!newCategory.name) return toast.error('Name is required');
                endpoint = isEditing ? `/admin/categories/${editId}` : '/admin/categories';
                payload = newCategory;
            } else if (isCoupon) {
                if (!newCoupon.code || !newCoupon.discountValue) return toast.error('Code and Value are required');
                endpoint = isEditing ? `/admin/store/coupons/${editId}` : '/admin/store/coupons';
                payload = newCoupon;
            }

            if (isEditing) {
                await api.put(endpoint, payload);
                toast.success('Updated successfully');
            } else {
                await api.post(endpoint, payload);
                toast.success('Created successfully');
            }

            setIsAddModalOpen(false);
            resetForm();
            fetchData();
        } catch (error) {
            if (error?.name === 'CanceledError' || error?.message?.toLowerCase().includes('cancel')) return;
            console.error('Submission failed:', error);
            toast.error(error.response?.data?.message || 'Failed to save');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (item) => {
        setEditId(item._id);
        setIsEditing(true);
        if (selectedTab === 'Products' || selectedTab === 'Inventory') {
            setNewProduct({
                ...item,
                category: item.category?._id || item.category,
                tailor: item.tailor?._id || item.tailor
            });
        } else if (selectedTab === 'Categories') {
            setNewCategory(item);
        } else if (selectedTab === 'Coupons') {
            setNewCoupon(item);
        }
        setIsAddModalOpen(true);
    };

    const handleInventoryUpdate = async (id, newStock) => {
        try {
            await api.patch(`/admin/store/inventory/${id}`, { stock: newStock });
            toast.success('Inventory updated');
            fetchData();
        } catch (error) {
            if (error?.name === 'CanceledError' || error?.message?.toLowerCase().includes('cancel')) return;
            toast.error('Update failed');
        }
    };

    const getStatusStyle = (stock) => {
        if (stock > 10) return 'bg-green-100 text-green-700 border-green-200';
        if (stock > 0) return 'bg-orange-100 text-orange-700 border-orange-200';
        return 'bg-red-100 text-red-700 border-red-200';
    };

    return (
        <div className="h-full flex flex-col space-y-6 relative">
            {/* Header */}
            <div className="flex justify-between items-start">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Store Management</h1>
                    <p className="text-xs text-gray-500 font-medium mt-1">Manage e-commerce products, inventory, and discounts</p>
                </div>
                {selectedTab !== 'Inventory' && (
                    <button
                        onClick={() => { resetForm(); setIsAddModalOpen(true); }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white text-xs font-black rounded-xl hover:bg-primary-dark shadow-lg shadow-green-900/20 transition-all uppercase tracking-widest"
                    >
                        <Plus size={16} /> Add {selectedTab.slice(0, -1)}
                    </button>
                )}
            </div>

            {/* Tabs & Search */}
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
                        <input type="text" placeholder={`Search ${selectedTab.toLowerCase()}...`} className="w-full pl-9 pr-4 py-2 text-xs font-semibold bg-gray-50 border border-transparent focus:border-gray-200 rounded-xl outline-none transition-all" />
                    </div>
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex-1 overflow-hidden flex flex-col min-h-[400px]">
                {isLoading ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                        <Loader2 className="w-8 h-8 animate-spin mb-2" />
                        <span className="text-xs font-bold uppercase tracking-widest">Loading data...</span>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left whitespace-nowrap">
                            <thead>
                                <tr className="bg-gray-50/50 text-gray-400 font-bold text-[10px] uppercase tracking-[0.2em] border-b border-gray-100">
                                    {selectedTab === 'Products' && (
                                        <>
                                            <th className="px-6 py-4">Product Info</th>
                                            <th className="px-6 py-4">Category</th>
                                            <th className="px-6 py-4">Price</th>
                                            <th className="px-6 py-4">Stock</th>
                                        </>
                                    )}
                                    {selectedTab === 'Categories' && (
                                        <>
                                            <th className="px-6 py-4">Category Name</th>
                                            <th className="px-6 py-4">Type</th>
                                            <th className="px-6 py-4">Products</th>
                                            <th className="px-6 py-4">Status</th>
                                        </>
                                    )}
                                    {selectedTab === 'Inventory' && (
                                        <>
                                            <th className="px-6 py-4">Product</th>
                                            <th className="px-6 py-4">Category</th>
                                            <th className="px-6 py-4">Current Stock</th>
                                            <th className="px-6 py-4">Quick Update</th>
                                        </>
                                    )}
                                    {selectedTab === 'Coupons' && (
                                        <>
                                            <th className="px-6 py-4">Promo Code</th>
                                            <th className="px-6 py-4">Discount</th>
                                            <th className="px-6 py-4">Min. Order</th>
                                            <th className="px-6 py-4">Usage</th>
                                        </>
                                    )}
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {data.map((item) => (
                                    <tr key={item._id} className="hover:bg-primary/5 transition-colors group">
                                        {/* --- PRODUCTS TAB --- */}
                                        {selectedTab === 'Products' && (
                                            <>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-10 w-10 rounded-lg bg-gray-100 border border-gray-200 overflow-hidden shrink-0">
                                                            <img src={item.image || 'https://cdn-icons-png.flaticon.com/128/3502/3502601.png'} className="w-full h-full object-cover" />
                                                        </div>
                                                        <div className="flex flex-col min-w-0">
                                                            <span className="text-sm font-bold text-gray-900 truncate max-w-[200px]">{item.name}</span>
                                                            <span className="text-[10px] text-gray-400 font-medium">#{item._id.slice(-6)}</span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-[10px] font-black uppercase text-gray-500 bg-gray-50 px-2 py-1 rounded border">{item.category?.name || 'Uncategorized'}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm font-black text-primary">₹{item.price}</span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-lg text-[9px] font-black border uppercase tracking-wider ${getStatusStyle(item.stock)}`}>
                                                        {item.stock > 10 ? 'In Stock' : item.stock > 0 ? 'Low Stock' : 'Out of Stock'} ({item.stock})
                                                    </span>
                                                </td>
                                            </>
                                        )}

                                        {/* --- CATEGORIES TAB --- */}
                                        {selectedTab === 'Categories' && (
                                            <>
                                                <td className="px-6 py-4 font-bold text-sm text-gray-900">{item.name}</td>
                                                <td className="px-6 py-4 text-xs font-medium text-gray-500 capitalize">{item.type}</td>
                                                <td className="px-6 py-4 text-xs font-bold text-gray-700">{item.productCount || 0} Products</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-lg text-[9px] font-black border uppercase ${item.isActive ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                                                        {item.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </td>
                                            </>
                                        )}

                                        {/* --- INVENTORY TAB --- */}
                                        {selectedTab === 'Inventory' && (
                                            <>
                                                <td className="px-6 py-4 font-bold text-sm text-gray-900">{item.name}</td>
                                                <td className="px-6 py-4 text-xs font-medium text-gray-500">{item.category?.name}</td>
                                                <td className="px-6 py-4">
                                                    <div className={`inline-flex items-center px-3 py-1.5 rounded-xl border ${getStatusStyle(item.stock)}`}>
                                                        <Package size={14} className="mr-2" />
                                                        <span className="text-xs font-black">{item.stock} Units</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <button 
                                                            onClick={() => handleInventoryUpdate(item._id, Math.max(0, item.stock - 1))}
                                                            className="p-1.5 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 font-bold text-xs"
                                                        >-</button>
                                                        <input 
                                                            type="number" 
                                                            value={item.stock} 
                                                            onChange={(e) => handleInventoryUpdate(item._id, parseInt(e.target.value) || 0)}
                                                            className="w-12 text-center text-xs font-black bg-white border border-gray-100 rounded-lg py-1"
                                                        />
                                                        <button 
                                                            onClick={() => handleInventoryUpdate(item._id, item.stock + 1)}
                                                            className="p-1.5 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 font-bold text-xs"
                                                        >+</button>
                                                    </div>
                                                </td>
                                            </>
                                        )}

                                        {/* --- COUPONS TAB --- */}
                                        {selectedTab === 'Coupons' && (
                                            <>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <Tag size={14} className="text-orange-500" />
                                                        <span className="text-sm font-black text-gray-900 uppercase tracking-wider">{item.code}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-bold text-green-600">
                                                    {item.discountType === 'percentage' ? `${item.discountValue}% Off` : `₹${item.discountValue} Off`}
                                                </td>
                                                <td className="px-6 py-4 text-xs font-bold text-gray-500">Min. ₹{item.minOrderAmount}</td>
                                                <td className="px-6 py-4 text-xs font-medium text-gray-400">{item.usedCount} Uses</td>
                                            </>
                                        )}

                                        {/* --- ACTIONS --- */}
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleEdit(item)} className="p-2 text-gray-400 hover:text-primary hover:bg-gray-50 border border-transparent hover:border-gray-100 rounded-xl transition-all">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(item._id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-xl transition-all">
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

            {/* Universal Add/Edit Modal */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 cursor-pointer"
                            onClick={() => setIsAddModalOpen(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                onClick={(e) => e.stopPropagation()}
                                className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] cursor-default"
                            >
                                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                    <h2 className="text-lg font-black tracking-tight text-gray-900">
                                        {isEditing ? 'Edit' : 'Add'} {selectedTab.slice(0, -1)}
                                    </h2>
                                    <button onClick={() => setIsAddModalOpen(false)} className="p-2 bg-white border border-gray-200 text-gray-400 hover:text-gray-900 rounded-full transition-colors shadow-sm">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="p-6 flex-1 overflow-y-auto space-y-6 custom-scrollbar bg-white">
                                    {/* --- PRODUCT FORM --- */}
                                    {(selectedTab === 'Products' || selectedTab === 'Inventory') && (
                                        <>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="col-span-2">
                                                    <label className="block text-xs font-black uppercase text-gray-400 tracking-widest mb-1.5">Product Name</label>
                                                    <input type="text" value={newProduct.name} onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold shadow-sm outline-none focus:border-primary transition-all" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-black uppercase text-gray-400 tracking-widest mb-1.5">Category</label>
                                                    <select value={newProduct.category} onChange={(e) => setNewProduct({...newProduct, category: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold shadow-sm outline-none focus:border-primary transition-all appearance-none">
                                                        <option value="">Select Category</option>
                                                        {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-black uppercase text-gray-400 tracking-widest mb-1.5">Stock Quantity</label>
                                                    <input type="number" value={newProduct.stock} onChange={(e) => setNewProduct({...newProduct, stock: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold shadow-sm outline-none focus:border-primary transition-all" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-black uppercase text-gray-400 tracking-widest mb-1.5">Sale Price</label>
                                                    <input type="number" value={newProduct.price} onChange={(e) => setNewProduct({...newProduct, price: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold shadow-sm outline-none focus:border-primary transition-all" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-black uppercase text-gray-400 tracking-widest mb-1.5">MRP (Optional)</label>
                                                    <input type="number" value={newProduct.originalPrice} onChange={(e) => setNewProduct({...newProduct, originalPrice: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold shadow-sm outline-none focus:border-primary transition-all" />
                                                </div>
                                                <div className="col-span-2">
                                                    <label className="block text-xs font-black uppercase text-gray-400 tracking-widest mb-1.5">Image URL</label>
                                                    <input type="text" value={newProduct.image} onChange={(e) => setNewProduct({...newProduct, image: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold shadow-sm outline-none focus:border-primary transition-all" />
                                                </div>
                                            </div>
                                        </>
                                    )}

                                    {/* --- CATEGORY FORM --- */}
                                    {selectedTab === 'Categories' && (
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-xs font-black uppercase text-gray-400 tracking-widest mb-1.5">Category Name</label>
                                                <input type="text" value={newCategory.name} onChange={(e) => setNewCategory({...newCategory, name: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold shadow-sm outline-none focus:border-primary transition-all" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-black uppercase text-gray-400 tracking-widest mb-1.5">Description</label>
                                                <textarea rows={3} value={newCategory.description} onChange={(e) => setNewCategory({...newCategory, description: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold shadow-sm outline-none focus:border-primary transition-all" />
                                            </div>
                                        </div>
                                    )}

                                    {/* --- COUPON FORM --- */}
                                    {selectedTab === 'Coupons' && (
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-xs font-black uppercase text-gray-400 tracking-widest mb-1.5">Coupon Code</label>
                                                <input type="text" value={newCoupon.code} onChange={(e) => setNewCoupon({...newCoupon, code: e.target.value.toUpperCase()})} placeholder="E.G. SUMMER50" className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold shadow-sm outline-none focus:border-primary transition-all" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-black uppercase text-gray-400 tracking-widest mb-1.5">Discount Type</label>
                                                <select value={newCoupon.discountType} onChange={(e) => setNewCoupon({...newCoupon, discountType: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold shadow-sm outline-none focus:border-primary transition-all appearance-none">
                                                    <option value="percentage">Percentage (%)</option>
                                                    <option value="fixed">Fixed Amount (₹)</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-black uppercase text-gray-400 tracking-widest mb-1.5">Discount Value</label>
                                                <input type="number" value={newCoupon.discountValue} onChange={(e) => setNewCoupon({...newCoupon, discountValue: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold shadow-sm outline-none focus:border-primary transition-all" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-black uppercase text-gray-400 tracking-widest mb-1.5">Min Order Amount</label>
                                                <input type="number" value={newCoupon.minOrderAmount} onChange={(e) => setNewCoupon({...newCoupon, minOrderAmount: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm font-bold shadow-sm outline-none focus:border-primary transition-all" />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                                    <button onClick={() => setIsAddModalOpen(false)} className="px-6 py-3 bg-white border border-gray-200 text-gray-600 text-xs font-black rounded-xl hover:bg-gray-100 transition-colors uppercase tracking-widest">
                                        Discard
                                    </button>
                                    <button 
                                        onClick={handleFormSubmit}
                                        disabled={isSubmitting}
                                        className="px-6 py-3 bg-primary text-white text-xs font-black rounded-xl hover:bg-primary-dark shadow-lg shadow-green-900/20 transition-all uppercase tracking-widest flex items-center gap-2"
                                    >
                                        {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                        {isEditing ? 'Save Changes' : `Publish ${selectedTab.slice(0, -1)}`}
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

export default AdminStore;
