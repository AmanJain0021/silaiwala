import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Image as ImageIcon } from 'lucide-react';
import api from '../services/api';

const GarmentForm = ({ initialData, categories, onClose, onSubmitSuccess }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isImageUploading, setIsImageUploading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        discountPrice: '',
        category: '',
        subCategory: '',
        brand: '',
        fabric: '',
        gender: 'Unisex',
        occasion: '',
        fitType: '',
        pattern: '',
        washCare: '',
        images: [],
        variants: [] // { size, color, stock, sku }
    });

    const [newVariant, setNewVariant] = useState({ size: '', color: '', stock: 0, sku: '' });
    const [newImageUrl, setNewImageUrl] = useState('');

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || initialData.title || '',
                description: initialData.description || '',
                price: initialData.price || '',
                discountPrice: initialData.discountPrice || '',
                category: initialData.category?._id || initialData.category || '',
                subCategory: initialData.subCategory || '',
                brand: initialData.brand || '',
                fabric: initialData.fabric || '',
                gender: initialData.gender || 'Unisex',
                occasion: initialData.occasion || '',
                fitType: initialData.fitType || '',
                pattern: initialData.pattern || '',
                washCare: initialData.washCare || '',
                images: initialData.images?.length > 0 ? initialData.images : (initialData.image ? [initialData.image] : []),
                variants: initialData.variants || []
            });
        }
    }, [initialData]);

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const uploadData = new FormData();
        uploadData.append('image', file);

        setIsImageUploading(true);
        try {
            const res = await api.post('/upload', uploadData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setFormData(prev => ({
                ...prev,
                images: [...prev.images, res.data.data]
            }));
        } catch (error) {
            console.error('Upload failed:', error);
            alert('Image upload failed');
        } finally {
            setIsImageUploading(false);
        }
    };

    const addImageUrl = () => {
        if (newImageUrl.trim()) {
            setFormData(prev => ({
                ...prev,
                images: [...prev.images, newImageUrl.trim()]
            }));
            setNewImageUrl('');
        }
    };

    const removeImage = (indexToRemove) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, index) => index !== indexToRemove)
        }));
    };

    const addVariant = () => {
        if (newVariant.size || newVariant.color) {
            setFormData(prev => ({
                ...prev,
                variants: [...prev.variants, newVariant]
            }));
            setNewVariant({ size: '', color: '', stock: 0, sku: '' });
        }
    };

    const removeVariant = (indexToRemove) => {
        setFormData(prev => ({
            ...prev,
            variants: prev.variants.filter((_, index) => index !== indexToRemove)
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = {
                ...formData,
                title: formData.name, // fallback for legacy
                productType: 'store_item',
                stock: formData.variants.reduce((acc, curr) => acc + (parseInt(curr.stock) || 0), 0)
            };

            let res;
            if (initialData?._id) {
                res = await api.patch(`/tailors/products/${initialData._id}`, payload);
            } else {
                res = await api.post('/tailors/products', payload);
            }

            if (res.data.success) {
                onSubmitSuccess();
            }
        } catch (error) {
            console.error(error);
            alert(error.response?.data?.message || 'Something went wrong');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#0A0A0A]/40 backdrop-blur-md">
            <div className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
                
                {/* Modal Header */}
                <div className="px-8 pt-8 pb-4 flex items-center justify-between border-b border-gray-50">
                    <div>
                        <h4 className="text-2xl font-black text-[#2D2F6E] tracking-tight leading-none">
                            {initialData ? 'Update Garment' : 'Add New Garment'}
                        </h4>
                        <p className="text-[11px] font-bold text-gray-400 mt-2 uppercase tracking-widest">
                            Fill in comprehensive details for your ready-made garment
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="h-10 w-10 flex items-center justify-center rounded-2xl bg-gray-50 text-gray-400 hover:text-rose-500 hover:bg-rose-50 transition-all shadow-sm"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form Content */}
                <form id="garment-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 pt-6 space-y-8 custom-scrollbar">
                    
                    {/* Basic Info */}
                    <section className="space-y-4">
                        <h5 className="text-sm font-black text-gray-900 border-b border-gray-100 pb-2">1. Basic Information</h5>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Garment Name</label>
                                <input
                                    required
                                    className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 focus:border-[#2D2F6E]/30 rounded-2xl focus:outline-none focus:bg-white transition-all text-sm font-black text-gray-900"
                                    placeholder="e.g. Designer Wedding Sherwani"
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Category</label>
                                <select
                                    required
                                    className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 focus:border-[#2D2F6E]/30 rounded-2xl focus:outline-none focus:bg-white transition-all text-sm font-black text-gray-900 appearance-none cursor-pointer"
                                    value={formData.category}
                                    onChange={e => setFormData({...formData, category: e.target.value})}
                                >
                                    <option value="">Select Category</option>
                                    {categories.map(cat => (
                                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Brand</label>
                                <input
                                    className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 focus:border-[#2D2F6E]/30 rounded-2xl focus:outline-none focus:bg-white transition-all text-sm font-black text-gray-900"
                                    placeholder="Brand Name"
                                    value={formData.brand}
                                    onChange={e => setFormData({...formData, brand: e.target.value})}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Selling Price</label>
                                    <input
                                        required
                                        type="number"
                                        className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 focus:border-[#2D2F6E]/30 rounded-2xl focus:outline-none focus:bg-white transition-all text-sm font-black text-gray-900"
                                        placeholder="₹"
                                        value={formData.price}
                                        onChange={e => setFormData({...formData, price: e.target.value})}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">MRP (Discount Price)</label>
                                    <input
                                        type="number"
                                        className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 focus:border-[#2D2F6E]/30 rounded-2xl focus:outline-none focus:bg-white transition-all text-sm font-black text-gray-900"
                                        placeholder="₹"
                                        value={formData.discountPrice}
                                        onChange={e => setFormData({...formData, discountPrice: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-1.5 mt-4">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Description</label>
                            <textarea
                                required
                                rows="3"
                                className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 focus:border-[#2D2F6E]/30 rounded-2xl focus:outline-none focus:bg-white transition-all text-sm font-black text-gray-900 resize-none"
                                placeholder="Describe the garment..."
                                value={formData.description}
                                onChange={e => setFormData({...formData, description: e.target.value})}
                            />
                        </div>
                    </section>

                    {/* Detailed Specifications */}
                    <section className="space-y-4">
                        <h5 className="text-sm font-black text-gray-900 border-b border-gray-100 pb-2">2. Specifications</h5>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Gender</label>
                                <select
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 focus:border-[#2D2F6E]/30 rounded-xl focus:outline-none text-xs font-black text-gray-900"
                                    value={formData.gender}
                                    onChange={e => setFormData({...formData, gender: e.target.value})}
                                >
                                    <option value="Unisex">Unisex</option>
                                    <option value="Men">Men</option>
                                    <option value="Women">Women</option>
                                    <option value="Kids">Kids</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Fabric</label>
                                <input
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 focus:border-[#2D2F6E]/30 rounded-xl focus:outline-none text-xs font-black text-gray-900"
                                    placeholder="e.g. Cotton Blend"
                                    value={formData.fabric}
                                    onChange={e => setFormData({...formData, fabric: e.target.value})}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Fit Type</label>
                                <input
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 focus:border-[#2D2F6E]/30 rounded-xl focus:outline-none text-xs font-black text-gray-900"
                                    placeholder="e.g. Regular Fit"
                                    value={formData.fitType}
                                    onChange={e => setFormData({...formData, fitType: e.target.value})}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Pattern</label>
                                <input
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 focus:border-[#2D2F6E]/30 rounded-xl focus:outline-none text-xs font-black text-gray-900"
                                    placeholder="e.g. Solid"
                                    value={formData.pattern}
                                    onChange={e => setFormData({...formData, pattern: e.target.value})}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Occasion</label>
                                <input
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 focus:border-[#2D2F6E]/30 rounded-xl focus:outline-none text-xs font-black text-gray-900"
                                    placeholder="e.g. Casual"
                                    value={formData.occasion}
                                    onChange={e => setFormData({...formData, occasion: e.target.value})}
                                />
                            </div>
                            <div className="space-y-1.5 md:col-span-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Wash Care</label>
                                <input
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-100 focus:border-[#2D2F6E]/30 rounded-xl focus:outline-none text-xs font-black text-gray-900"
                                    placeholder="e.g. Dry Clean Only"
                                    value={formData.washCare}
                                    onChange={e => setFormData({...formData, washCare: e.target.value})}
                                />
                            </div>
                        </div>
                    </section>

                    {/* Variants */}
                    <section className="space-y-4">
                        <h5 className="text-sm font-black text-gray-900 border-b border-gray-100 pb-2">3. Variants & Stock</h5>
                        
                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                            <div className="flex gap-2 items-end mb-4">
                                <div className="flex-1 space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Size</label>
                                    <input
                                        className="w-full px-3 py-2 bg-white border border-gray-100 rounded-xl text-xs font-black"
                                        placeholder="S, M, L"
                                        value={newVariant.size}
                                        onChange={e => setNewVariant({...newVariant, size: e.target.value})}
                                    />
                                </div>
                                <div className="flex-1 space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Color</label>
                                    <input
                                        className="w-full px-3 py-2 bg-white border border-gray-100 rounded-xl text-xs font-black"
                                        placeholder="Red, Blue"
                                        value={newVariant.color}
                                        onChange={e => setNewVariant({...newVariant, color: e.target.value})}
                                    />
                                </div>
                                <div className="flex-1 space-y-1.5">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Stock</label>
                                    <input
                                        type="number"
                                        className="w-full px-3 py-2 bg-white border border-gray-100 rounded-xl text-xs font-black"
                                        placeholder="Qty"
                                        value={newVariant.stock}
                                        onChange={e => setNewVariant({...newVariant, stock: e.target.value})}
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={addVariant}
                                    className="h-[34px] px-4 bg-[#2D2F6E] text-white rounded-xl text-xs font-bold hover:bg-[#1f2152] transition-colors"
                                >
                                    Add
                                </button>
                            </div>

                            {formData.variants.length > 0 && (
                                <div className="space-y-2 mt-4">
                                    {formData.variants.map((v, i) => (
                                        <div key={i} className="flex justify-between items-center bg-white p-2 rounded-xl border border-gray-100 shadow-sm">
                                            <div className="flex gap-4 text-xs font-bold text-gray-700">
                                                <span>Size: {v.size || 'N/A'}</span>
                                                <span>Color: {v.color || 'N/A'}</span>
                                                <span className="text-primary">Stock: {v.stock}</span>
                                            </div>
                                            <button type="button" onClick={() => removeVariant(i)} className="text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition-colors">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Images */}
                    <section className="space-y-4">
                        <h5 className="text-sm font-black text-gray-900 border-b border-gray-100 pb-2">4. Multiple Images</h5>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            {formData.images.map((img, i) => (
                                <div key={i} className="relative aspect-square rounded-2xl overflow-hidden border border-gray-200 group">
                                    <img src={img} alt="" className="w-full h-full object-cover" />
                                    <button 
                                        type="button"
                                        onClick={() => removeImage(i)}
                                        className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                            <div className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center relative hover:bg-gray-100 transition-colors">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    disabled={isImageUploading}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                />
                                {isImageUploading ? (
                                    <div className="h-6 w-6 border-2 border-[#2D2F6E] border-t-transparent animate-spin rounded-full" />
                                ) : (
                                    <>
                                        <ImageIcon size={24} className="text-gray-400 mb-2" />
                                        <span className="text-xs font-black text-gray-400">Upload Image</span>
                                    </>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <input
                                className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-100 focus:border-[#2D2F6E]/30 rounded-xl focus:outline-none text-xs font-black text-gray-900"
                                placeholder="Or Paste Image URL"
                                value={newImageUrl}
                                onChange={e => setNewImageUrl(e.target.value)}
                            />
                            <button
                                type="button"
                                onClick={addImageUrl}
                                className="px-4 bg-gray-100 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-200 transition-colors"
                            >
                                Add URL
                            </button>
                        </div>
                    </section>

                </form>

                {/* Footer */}
                <div className="px-8 py-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-3 rounded-2xl text-xs font-black text-gray-500 hover:bg-gray-200 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="garment-form"
                        disabled={isSubmitting}
                        className="px-8 py-3 rounded-2xl text-xs font-black text-white bg-[#2D2F6E] hover:bg-[#1f2152] transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center gap-2"
                    >
                        {isSubmitting && <div className="h-3 w-3 border-2 border-white border-t-transparent animate-spin rounded-full" />}
                        {initialData ? 'Save Changes' : 'Publish Garment'}
                    </button>
                </div>

            </div>
        </div>
    );
};

export default GarmentForm;
