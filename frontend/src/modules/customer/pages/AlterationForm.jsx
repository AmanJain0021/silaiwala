import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, UploadCloud, X, Loader2, MapPin, Star, Ruler } from 'lucide-react';
import api from '../../../utils/api';
import toast from 'react-hot-toast';
import SafeImage from '../../../components/Common/SafeImage';
import useAddressStore from '../../../store/userStore';

const AlterationForm = () => {
    const navigate = useNavigate();
    const [description, setDescription] = useState('');
    const [images, setImages] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const [tailors, setTailors] = useState([]);
    const [selectedTailorId, setSelectedTailorId] = useState(null);
    const [isLoadingTailors, setIsLoadingTailors] = useState(true);

    const addresses = useAddressStore(state => state.addresses);
    const fetchAddresses = useAddressStore(state => state.fetchAddresses);
    const [selectedAddressId, setSelectedAddressId] = useState(null);

    useEffect(() => {
        if (addresses.length === 0) {
            fetchAddresses();
        }
    }, [addresses.length, fetchAddresses]);

    useEffect(() => {
        const fetchTailors = async () => {
            try {
                const response = await api.get('/customers/tailors');
                if (response.data.success) {
                    setTailors(response.data.data);
                }
            } catch (error) {
                if (error.name !== 'CanceledError' && error.code !== 'ERR_CANCELED') {
                    console.error('Error fetching tailors:', error);
                }
            } finally {
                setIsLoadingTailors(false);
            }
        };
        fetchTailors();
    }, []);

    const handleImageUpload = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        // Limit to 5 images max
        if (images.length + files.length > 5) {
            toast.error("You can upload a maximum of 5 images.");
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

    const handleSubmitRequest = async () => {
        if (!selectedTailorId) {
            toast.error("Please select a tailor.");
            return;
        }
        if (!description.trim()) {
            toast.error("Please provide a description of the alteration.");
            return;
        }
        if (images.length === 0) {
            toast.error("Please upload at least one image of the garment.");
            return;
        }

        const addressToUse = addresses.find(a => a._id === selectedAddressId) || addresses[0];
        if (!addressToUse) {
            toast.error("Please select or add a pickup address.");
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

            const response = await api.post('/alterations/request', {
                tailorId: selectedTailorId,
                description: description,
                images: validUrls,
                deliveryAddress: {
                    street: addressToUse.street,
                    city: addressToUse.city,
                    state: addressToUse.state || '',
                    zipCode: addressToUse.zipCode,
                    location: addressToUse.location
                }
            });

            if (response.data.success) {
                toast.success("Alteration request sent to Tailor successfully!");
                navigate('/user/orders');
            }
        } catch (error) {
            console.error('Error submitting request:', error);
            toast.error(error.response?.data?.message || "Failed to submit request.");
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
                    <h1 className="text-lg font-bold">Request Alteration</h1>
                    <p className="text-[10px] text-indigo-200">Get quotes directly from tailors</p>
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
                        Upload Images
                    </h2>
                    <p className="text-[10px] text-gray-500 mb-3">Upload clear images of the garment and the specific areas that need alteration.</p>

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
                        
                        {images.length < 5 && (
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
                        Alteration Details
                    </h2>
                    <textarea 
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="E.g., The waist needs to be taken in by 2 inches, and the hem needs to be shortened by 1 inch."
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-[#843D9B]/20 focus:border-[#843D9B] transition-all min-h-[120px] resize-none"
                    />
                </div>

                {/* Pickup Address */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-[#843D9B] text-white flex items-center justify-center text-[10px]">4</span>
                        Pickup Address
                    </h2>
                    {addresses.length === 0 ? (
                        <div className="text-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <MapPin size={24} className="text-gray-400 mx-auto mb-2" />
                            <p className="text-xs text-gray-500 mb-3">No addresses found.</p>
                            <button 
                                onClick={() => navigate('/user/profile/addresses')}
                                className="text-xs font-bold text-[#843D9B] px-4 py-2 border border-[#843D9B] rounded-lg hover:bg-indigo-50"
                            >
                                Add New Address
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {addresses.map((addr) => {
                                const isSelected = selectedAddressId ? addr._id === selectedAddressId : addr._id === addresses[0]._id;
                                return (
                                    <div 
                                        key={addr._id}
                                        onClick={() => setSelectedAddressId(addr._id)}
                                        className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${isSelected ? 'border-[#843D9B] bg-indigo-50 ring-1 ring-[#843D9B]' : 'border-gray-100 hover:border-indigo-200'}`}
                                    >
                                        <div className="mt-0.5"><MapPin size={16} className={isSelected ? 'text-[#843D9B]' : 'text-gray-400'} /></div>
                                        <div>
                                            <p className="text-xs font-bold text-gray-900">{addr.receiverName} <span className="ml-2 text-[10px] text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded uppercase">{addr.type}</span></p>
                                            <p className="text-[11px] text-gray-500 mt-1">{addr.street}, {addr.city}, {addr.state} - {addr.zipCode}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

            </div>

            {/* Bottom Action Bar */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-safe flex gap-3 z-40 max-w-xl mx-auto shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                <button 
                    onClick={handleSubmitRequest}
                    disabled={isSubmitting || !selectedTailorId || !description || images.length === 0 || addresses.length === 0}
                    className="flex-1 bg-[#843D9B] text-white h-12 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#6c3080] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'Proceed to Request'}
                </button>
            </div>
        </div>
    );
};

export default AlterationForm;
