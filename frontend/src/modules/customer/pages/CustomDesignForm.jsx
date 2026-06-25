import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UploadCloud, X, Loader2, Star, Plus, Trash2 } from 'lucide-react';
import api from '../../../utils/api';
import toast from 'react-hot-toast';
import SafeImage from '../../../components/Common/SafeImage';
import useUserStore from '../../../store/userStore';
import AddressForm from '../components/checkout/address/AddressForm';

const CustomDesignForm = () => {
    const navigate = useNavigate();
    const [description, setDescription] = useState('');
    const [images, setImages] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [tailors, setTailors] = useState([]);
    const [selectedTailorId, setSelectedTailorId] = useState(null);
    const [selectedAddressId, setSelectedAddressId] = useState(null);
    const [isLoadingTailors, setIsLoadingTailors] = useState(true);
    const [isAddingAddress, setIsAddingAddress] = useState(false);

    const { profile, fetchProfile, addresses, fetchAddresses, removeAddress } = useUserStore();

    useEffect(() => {
        fetchProfile();
        fetchAddresses();
        // Fallback to tailors fetch...
        const fetchTailors = async () => {
            try {
                const response = await api.get('/customers/tailors');
                if (response.data.success) {
                    setTailors(response.data.data);
                }
            } catch (error) {
                console.error('Error fetching tailors:', error);
            } finally {
                setIsLoadingTailors(false);
            }
        };
        fetchTailors();
    }, []);

    useEffect(() => {
        if (addresses?.length > 0 && !selectedAddressId) {
            const defaultAddr = addresses.find(a => a.isDefault) || addresses[0];
            setSelectedAddressId(defaultAddr._id);
        }
    }, [addresses, selectedAddressId]);

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        if (images.length + files.length > 10) {
            toast.error("You can upload a maximum of 10 images.");
            return;
        }

        const newImages = files.map(file => ({
            file,
            preview: URL.createObjectURL(file)
        }));
        
        setImages(prev => [...prev, ...newImages]);
    };

    const removeImage = (indexToRemove) => {
        setImages(images.filter((_, index) => index !== indexToRemove));
    };

    const handleSendRequest = async () => {
        if (!selectedTailorId) {
            toast.error("Please select a tailor.");
            return;
        }
        if (!description.trim()) {
            toast.error("Please provide a description of the design.");
            return;
        }
        if (images.length === 0) {
            toast.error("Please upload at least one design image.");
            return;
        }

        const deliveryAddress = addresses?.find(a => a._id === selectedAddressId);
        if (!deliveryAddress) {
            toast.error("Please add and select a delivery address.");
            return;
        }

        setIsSubmitting(true);
        try {
            // Upload images first
            const uploadPromises = images.map(async (img) => {
                const formData = new FormData();
                formData.append('image', img.file);
                try {
                    const res = await api.post('/upload', formData, {
                        headers: { 'Content-Type': 'multipart/form-data' }
                    });
                    return res.data?.data || res.data?.imageUrl || res.data;
                } catch (error) {
                    console.error('Upload error:', error);
                    return null;
                }
            });

            const uploadedUrls = await Promise.all(uploadPromises);
            const validUrls = uploadedUrls.filter(url => url !== null);

            if (validUrls.length === 0) {
                toast.error("Failed to upload images. Please try again.");
                setIsSubmitting(false);
                return;
            }

            // Send Direct Request
            await api.post('/custom-designs/request', {
                tailorId: selectedTailorId,
                description,
                images: validUrls,
                deliveryAddress
            });

            toast.success("Custom Design requested successfully!");
            navigate('/user/orders'); // Or wherever you want them to go after
        } catch (error) {
            console.error('Error sending request:', error);
            toast.error(error.response?.data?.message || "Failed to send request.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20 font-sans">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-[#843D9B] text-white px-4 py-4 flex items-center gap-3 pt-safe shadow-md">
                <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
                    <ArrowLeft size={20} />
                </button>
                <div className="flex-1">
                    <h1 className="text-lg font-bold">Custom Design Request</h1>
                    <p className="text-[10px] text-indigo-200">Upload your dream design and get a quote</p>
                </div>
            </div>

            <div className="max-w-xl mx-auto p-4 space-y-6 mt-4">
                
                {/* Tailor Selection */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-[#843D9B] text-white flex items-center justify-center text-[10px]">1</span>
                        Select a Tailor
                    </h2>
                    
                    {isLoadingTailors ? (
                        <div className="flex justify-center p-4">
                            <Loader2 size={24} className="text-[#843D9B] animate-spin" />
                        </div>
                    ) : (
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                            {tailors.map(tailor => (
                                <div 
                                    key={tailor._id}
                                    onClick={() => setSelectedTailorId(tailor.user?._id || tailor.user?.id || tailor._id)}
                                    className={`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${selectedTailorId === (tailor.user?._id || tailor.user?.id || tailor._id) ? 'border-[#843D9B] bg-indigo-50 ring-1 ring-[#843D9B]' : 'border-gray-100 hover:border-indigo-200'}`}
                                >
                                    <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border border-gray-100">
                                        <SafeImage src={tailor.user?.profileImage} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xs font-bold text-gray-900">{tailor.shopName || tailor.user?.name}</h3>
                                        <p className="text-[10px] text-gray-500 flex items-center gap-1"><Star size={10} className="text-yellow-400 fill-yellow-400"/> {tailor.rating || 'New'}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Upload Images */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-[#843D9B] text-white flex items-center justify-center text-[10px]">2</span>
                        Upload Reference Images
                    </h2>
                    <p className="text-[10px] text-gray-500 mb-3">Upload clear images of the design (Front, Back, Details, etc). Max 10 images.</p>

                    <div className="flex flex-wrap gap-3 mb-3">
                        {images.map((img, idx) => (
                            <div key={idx} className="relative w-20 h-20 rounded-xl border border-gray-200 overflow-hidden group">
                                <img src={img.preview} alt="Upload Preview" className="w-full h-full object-cover" />
                                <button 
                                    onClick={() => removeImage(idx)}
                                    className="absolute top-1 right-1 bg-red-500/90 p-1 rounded-full text-white shadow-sm z-10 hover:bg-red-600 transition-colors"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        ))}
                        
                        {images.length < 10 && (
                            <label className="w-20 h-20 rounded-xl border-2 border-dashed border-[#843D9B]/30 flex flex-col items-center justify-center text-[#843D9B] cursor-pointer hover:bg-indigo-50 transition-colors">
                                {isUploading ? <Loader2 size={20} className="animate-spin" /> : <UploadCloud size={20} />}
                                <span className="text-[8px] font-bold mt-1 uppercase tracking-wider">Upload</span>
                                <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploading} />
                            </label>
                        )}
                    </div>
                </div>

                {/* Description */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-[#843D9B] text-white flex items-center justify-center text-[10px]">3</span>
                        Design Requirements
                    </h2>
                    <textarea 
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="E.g., I want this lehenga exactly like the image but with full sleeves. Fabric should be silk."
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-[#843D9B]/20 focus:border-[#843D9B] transition-all min-h-[120px] resize-none"
                    />
                </div>

                {/* Address Selection */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-[#843D9B] text-white flex items-center justify-center text-[10px]">4</span>
                            Pickup & Delivery Address
                        </h2>
                        {!isAddingAddress && (
                            <button 
                                onClick={() => setIsAddingAddress(true)}
                                className="text-[10px] font-bold text-[#843D9B] hover:bg-indigo-50 px-2 py-1 rounded transition-colors flex items-center gap-1"
                            >
                                <Plus size={12} /> Add New
                            </button>
                        )}
                    </div>
                    
                    {isAddingAddress ? (
                        <div className="mt-2">
                            <AddressForm 
                                onCancel={() => setIsAddingAddress(false)}
                                onSuccess={() => {
                                    setIsAddingAddress(false);
                                    fetchAddresses();
                                }}
                            />
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {addresses?.map(addr => (
                                <div 
                                    key={addr._id} 
                                    onClick={() => setSelectedAddressId(addr._id)}
                                    className={`p-3 rounded-xl border cursor-pointer transition-all ${selectedAddressId === addr._id ? 'border-[#843D9B] bg-indigo-50 ring-1 ring-[#843D9B]' : 'border-gray-100 hover:border-indigo-200'} relative group`}
                                >
                                    <button 
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            if (window.confirm("Are you sure you want to delete this address?")) {
                                                try {
                                                    await removeAddress(addr._id);
                                                    toast.success("Address deleted");
                                                    if (selectedAddressId === addr._id) setSelectedAddressId(null);
                                                } catch (err) {
                                                    toast.error("Failed to delete address");
                                                }
                                            }
                                        }}
                                        className="absolute right-3 top-3 text-gray-400 hover:text-red-500 bg-white/80 p-1 rounded-md transition-colors"
                                        title="Delete Address"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                    <div className="flex items-center justify-between mb-1 pr-6">
                                        <p className="font-bold text-gray-900 text-xs">{addr.receiverName} <span className="ml-2 px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[9px] uppercase tracking-wider">{addr.type}</span></p>
                                        {selectedAddressId === addr._id && <div className="w-3 h-3 rounded-full bg-[#843D9B]"></div>}
                                    </div>
                                    <p className="text-[10px] text-gray-600">{addr.street}, {addr.city}, {addr.state} - {addr.zipCode}</p>
                                </div>
                            ))}
                            
                            {(!addresses || addresses.length === 0) && (
                                <div className="text-center p-4 rounded-xl border border-dashed border-gray-200 bg-gray-50">
                                    <p className="text-xs text-gray-500 mb-2">No saved addresses found.</p>
                                    <button 
                                        onClick={() => setIsAddingAddress(true)} 
                                        className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-[#843D9B] hover:bg-gray-50 transition-colors"
                                    >
                                        Add New Address
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

            </div>

            {/* Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-safe flex gap-3 z-40 max-w-xl mx-auto shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                <button 
                    onClick={handleSendRequest}
                    disabled={isSubmitting || !selectedTailorId || !description || images.length === 0}
                    className="flex-1 bg-[#843D9B] text-white h-12 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#6c3080] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'Send Request'}
                </button>
            </div>
        </div>
    );
};

export default CustomDesignForm;
