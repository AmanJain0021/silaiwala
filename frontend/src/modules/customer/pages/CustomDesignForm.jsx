import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, UploadCloud, X, Loader2, Star, Plus, Trash2, Camera, ChevronRight } from 'lucide-react';
import api from '../../../utils/api';
import toast from 'react-hot-toast';
import SafeImage from '../../../components/Common/SafeImage';
import useUserStore from '../../../store/userStore';
import AddressForm from '../components/checkout/address/AddressForm';
import { getImageUrl } from '../../../utils/imageUrl';

const DRAFT_KEY = 'custom-design-draft';
const MAX_IMAGES = 10;
const MAX_FILE_MB = 5;

const loadDraft = () => {
    try {
        const raw = localStorage.getItem(DRAFT_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        return parsed && typeof parsed === 'object' ? parsed : null;
    } catch {
        return null;
    }
};

const clearDraft = () => {
    try {
        localStorage.removeItem(DRAFT_KEY);
    } catch {
        /* ignore */
    }
};

const saveDraft = (draft) => {
    try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch (err) {
        console.warn('Failed to save custom design draft:', err);
        toast.error('Could not save draft locally (storage full). Photos may be lost on refresh.');
    }
};

const extractUploadUrl = (res) => {
    const d = res?.data?.data ?? res?.data?.imageUrl ?? res?.data?.url;
    if (typeof d === 'string' && d.trim()) return d.trim();
    if (Array.isArray(d) && typeof d[0] === 'string') return d[0].trim();
    if (d && typeof d === 'object') {
        const nested = d.url || d.secure_url || d.imageUrl || d.path;
        if (typeof nested === 'string' && nested.trim()) return nested.trim();
    }
    return null;
};

const CustomDesignForm = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const preselectedTailorId = location.state?.tailorId || null;
    const draft = useRef(loadDraft()).current;

    const [description, setDescription] = useState(draft?.description || '');
    const [images, setImages] = useState(
        Array.isArray(draft?.images)
            ? draft.images.filter((img) => img?.url).map((img) => ({
                url: img.url,
                preview: img.preview || img.url,
            }))
            : []
    );
    const [isUploading, setIsUploading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [tailors, setTailors] = useState([]);
    const [selectedTailorId, setSelectedTailorId] = useState(
        preselectedTailorId || draft?.selectedTailorId || null
    );
    const [selectedAddressId, setSelectedAddressId] = useState(draft?.selectedAddressId || null);
    const [isLoadingTailors, setIsLoadingTailors] = useState(true);
    const [isAddingAddress, setIsAddingAddress] = useState(false);
    const [draftReady, setDraftReady] = useState(false);

    const cameraInputRef = useRef(null);
    const galleryInputRef = useRef(null);

    const { fetchProfile, addresses, fetchAddresses, removeAddress } = useUserStore();

    const isMatchingTailor = (tailor, id) => {
        if (!id || !tailor) return false;
        const targetId = String(id).toLowerCase();
        const tailorDocId = String(tailor._id || '').toLowerCase();
        const userId = String(tailor.user?._id || tailor.user?.id || '').toLowerCase();
        return tailorDocId === targetId || userId === targetId;
    };

    // Persist draft whenever form fields change (after hydrate)
    useEffect(() => {
        setDraftReady(true);
    }, []);

    useEffect(() => {
        if (!draftReady) return;
        saveDraft({
            description,
            selectedTailorId,
            selectedAddressId,
            images: images.map((img) => ({
                url: img.url,
                preview: img.url || img.preview,
            })),
            updatedAt: Date.now(),
        });
    }, [description, images, selectedTailorId, selectedAddressId, draftReady]);

    useEffect(() => {
        fetchProfile();
        fetchAddresses();
        const fetchTailors = async () => {
            try {
                const response = await api.get('/customers/tailors');
                if (response.data.success) {
                    const fetchedTailors = response.data.data || [];
                    setTailors(fetchedTailors);

                    if (preselectedTailorId) {
                        const matched = fetchedTailors.find((t) => isMatchingTailor(t, preselectedTailorId));
                        if (matched) {
                            setSelectedTailorId(matched._id);
                        }
                    } else if (selectedTailorId) {
                        const matched = fetchedTailors.find((t) => isMatchingTailor(t, selectedTailorId));
                        if (matched) {
                            setSelectedTailorId(matched._id);
                        }
                    } else if (fetchedTailors.length > 0) {
                        setSelectedTailorId(fetchedTailors[0]._id);
                    }
                }
            } catch (error) {
                console.error('Error fetching tailors:', error);
            } finally {
                setIsLoadingTailors(false);
            }
        };
        fetchTailors();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (addresses?.length > 0 && !selectedAddressId) {
            const defaultAddr = addresses.find((a) => a.isDefault) || addresses[0];
            setSelectedAddressId(defaultAddr._id);
        }
    }, [addresses, selectedAddressId]);

    const uploadFile = async (file) => {
        const formData = new FormData();
        formData.append('image', file);
        formData.append('folder', 'custom_designs');
        const res = await api.post('/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        const url = extractUploadUrl(res);
        if (!url) throw new Error('No URL returned from upload');
        return url;
    };

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files || []);
        // Allow re-selecting the same file
        e.target.value = '';
        if (files.length === 0) return;

        if (images.length + files.length > MAX_IMAGES) {
            toast.error(`You can upload a maximum of ${MAX_IMAGES} images.`);
            return;
        }

        const accepted = [];
        for (const file of files) {
            if (!file.type?.startsWith('image/')) {
                toast.error(`${file.name || 'File'} is not an image.`);
                continue;
            }
            if (file.size > MAX_FILE_MB * 1024 * 1024) {
                toast.error(`${file.name || 'Image'} exceeds ${MAX_FILE_MB}MB limit.`);
                continue;
            }
            accepted.push(file);
        }
        if (accepted.length === 0) return;

        setIsUploading(true);
        try {
            const uploaded = [];
            for (const file of accepted) {
                try {
                    const url = await uploadFile(file);
                    uploaded.push({
                        url,
                        preview: getImageUrl(url) || url,
                    });
                } catch (err) {
                    console.error('Upload error:', err);
                    toast.error(err.response?.data?.message || `Failed to upload ${file.name || 'image'}`);
                }
            }
            if (uploaded.length > 0) {
                setImages((prev) => [...prev, ...uploaded].slice(0, MAX_IMAGES));
                toast.success(
                    uploaded.length === 1
                        ? 'Photo uploaded'
                        : `${uploaded.length} photos uploaded`
                );
            }
        } finally {
            setIsUploading(false);
        }
    };

    const removeImage = (indexToRemove) => {
        setImages((prev) => prev.filter((_, index) => index !== indexToRemove));
    };

    const handleSendRequest = async () => {
        if (!selectedTailorId) {
            toast.error('Please select a tailor.');
            return;
        }
        if (!description.trim()) {
            toast.error('Please provide a description of the design.');
            return;
        }
        if (images.length === 0) {
            toast.error('Please upload at least one design image.');
            return;
        }

        const deliveryAddress = addresses?.find((a) => a._id === selectedAddressId);
        if (!deliveryAddress) {
            toast.error('Please add and select a delivery address.');
            return;
        }

        const validUrls = images.map((img) => img.url).filter(Boolean);
        if (validUrls.length === 0) {
            toast.error('Please upload at least one design image.');
            return;
        }

        setIsSubmitting(true);
        try {
            const selectedTailorObj = tailors.find((t) => isMatchingTailor(t, selectedTailorId));
            const finalTailorIdToSend =
                selectedTailorObj?.user?._id || selectedTailorObj?._id || selectedTailorId;

            const res = await api.post('/custom-designs/request', {
                tailorId: finalTailorIdToSend,
                description: description.trim(),
                images: validUrls,
                deliveryAddress,
            });

            const createdDesign = res.data?.data;
            clearDraft();
            setDescription('');
            setImages([]);
            toast.success('Custom Design requested successfully!');
            navigate('/user/checkout/success', {
                state: {
                    orderId: createdDesign?._id,
                    orderNumber: createdDesign?.designId || 'DES-REQ',
                    pendingAcceptance: true,
                    isCustomDesign: true,
                },
            });
        } catch (error) {
            console.error('Error sending request:', error);
            toast.error(error.response?.data?.message || 'Failed to send request.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const currentSelectedTailor = tailors.find((t) => isMatchingTailor(t, selectedTailorId));

    return (
        <div className="min-h-screen bg-gray-50 pb-20 font-sans">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-[#843D9B] text-white px-4 py-4 flex items-center gap-3 pt-safe shadow-md">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors"
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="flex-1">
                    <h1 className="text-lg font-bold">Custom Design Request</h1>
                    <p className="text-[10px] text-indigo-200">
                        Upload your dream design and get a quote
                        {images.length > 0 || description ? ' · Draft saved' : ''}
                    </p>
                </div>
            </div>

            <div className="max-w-xl mx-auto p-4 space-y-6 mt-4">
                {/* Tailor Selection */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-[#843D9B] text-white flex items-center justify-center text-[10px]">
                                1
                            </span>
                            Selected Tailor
                        </h2>
                        <button
                            type="button"
                            onClick={() => navigate('/user/tailors')}
                            className="text-[10px] font-black text-[#843D9B] bg-[#843D9B]/10 hover:bg-[#843D9B]/15 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-xs"
                        >
                            <span>All Tailors</span>
                            <ChevronRight size={12} />
                        </button>
                    </div>

                    {isLoadingTailors ? (
                        <div className="flex justify-center p-4">
                            <Loader2 size={24} className="text-[#843D9B] animate-spin" />
                        </div>
                    ) : currentSelectedTailor ? (
                        <div className="p-3.5 rounded-2xl border border-[#843D9B] bg-[#843D9B]/5 ring-2 ring-[#843D9B]/15 flex items-center gap-3 shadow-xs">
                            <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 border border-gray-100 shadow-xs">
                                <SafeImage
                                    src={currentSelectedTailor.user?.profileImage}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-bold text-gray-900 truncate">
                                        {currentSelectedTailor.shopName || 'Tailor Partner'}
                                    </h3>
                                    <span className="text-[9px] font-black bg-[#843D9B] text-white px-2.5 py-0.5 rounded-md uppercase tracking-wider shadow-xs">
                                        Selected
                                    </span>
                                </div>
                                <p className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                                    <Star size={10} className="text-amber-400 fill-amber-400" />{' '}
                                    {currentSelectedTailor.rating || 'New'}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 rounded-2xl border border-dashed border-gray-200 text-center space-y-2">
                            <p className="text-xs text-gray-500 font-semibold">No tailor selected yet.</p>
                            <button
                                type="button"
                                onClick={() => navigate('/user/tailors')}
                                className="text-xs font-bold text-white bg-[#843D9B] px-4 py-2 rounded-xl shadow-sm hover:bg-[#6B2F7E] transition-colors"
                            >
                                Choose Tailor from Shops
                            </button>
                        </div>
                    )}
                </div>

                {/* Upload Images */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-[#843D9B] text-white flex items-center justify-center text-[10px]">
                            2
                        </span>
                        Upload Reference Images
                    </h2>
                    <p className="text-[10px] text-gray-500 mb-3">
                        Photos upload immediately and stay saved if you refresh. Max {MAX_IMAGES} images,{' '}
                        {MAX_FILE_MB}MB each.
                    </p>

                    <div className="flex flex-wrap gap-3 mb-3">
                        {images.map((img, idx) => (
                            <div
                                key={`${img.url}-${idx}`}
                                className="relative w-20 h-20 rounded-xl border border-gray-200 overflow-hidden group bg-gray-50"
                            >
                                <img
                                    src={getImageUrl(img.preview || img.url)}
                                    alt={`Design ${idx + 1}`}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.currentTarget.src =
                                            'https://placehold.co/80x80/e6e8f0/843d9b?text=Photo';
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => removeImage(idx)}
                                    className="absolute top-1 right-1 bg-red-500/90 p-1 rounded-full text-white shadow-sm z-10 hover:bg-red-600 transition-colors"
                                    aria-label="Remove photo"
                                >
                                    <X size={12} />
                                </button>
                            </div>
                        ))}

                        {images.length < MAX_IMAGES && (
                            <div className="flex gap-2">
                                <label className="w-20 h-20 rounded-xl border-2 border-dashed border-[#843D9B]/30 flex flex-col items-center justify-center text-[#843D9B] cursor-pointer hover:bg-indigo-50 transition-colors">
                                    {isUploading ? (
                                        <Loader2 size={20} className="animate-spin" />
                                    ) : (
                                        <Camera size={20} />
                                    )}
                                    <span className="text-[8px] font-bold mt-1 uppercase tracking-wider text-center leading-tight">
                                        Camera
                                    </span>
                                    <input
                                        ref={cameraInputRef}
                                        type="file"
                                        accept="image/*"
                                        capture="environment"
                                        className="hidden"
                                        onChange={handleImageUpload}
                                        disabled={isUploading || isSubmitting}
                                    />
                                </label>
                                <label className="w-20 h-20 rounded-xl border-2 border-dashed border-[#843D9B]/30 flex flex-col items-center justify-center text-[#843D9B] cursor-pointer hover:bg-indigo-50 transition-colors">
                                    {isUploading ? (
                                        <Loader2 size={20} className="animate-spin" />
                                    ) : (
                                        <UploadCloud size={20} />
                                    )}
                                    <span className="text-[8px] font-bold mt-1 uppercase tracking-wider text-center leading-tight">
                                        Gallery
                                    </span>
                                    <input
                                        ref={galleryInputRef}
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleImageUpload}
                                        disabled={isUploading || isSubmitting}
                                    />
                                </label>
                            </div>
                        )}
                    </div>
                    {isUploading && (
                        <p className="text-[10px] text-[#843D9B] font-semibold flex items-center gap-1.5">
                            <Loader2 size={12} className="animate-spin" /> Uploading photo…
                        </p>
                    )}
                </div>

                {/* Description */}
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-[#843D9B] text-white flex items-center justify-center text-[10px]">
                            3
                        </span>
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
                            <span className="w-6 h-6 rounded-full bg-[#843D9B] text-white flex items-center justify-center text-[10px]">
                                4
                            </span>
                            Pickup & Delivery Address
                        </h2>
                        {!isAddingAddress && (
                            <button
                                type="button"
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
                            {addresses?.map((addr) => (
                                <div
                                    key={addr._id}
                                    onClick={() => setSelectedAddressId(addr._id)}
                                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                                        selectedAddressId === addr._id
                                            ? 'border-[#843D9B] bg-indigo-50 ring-1 ring-[#843D9B]'
                                            : 'border-gray-100 hover:border-indigo-200'
                                    } relative group`}
                                >
                                    <button
                                        type="button"
                                        onClick={async (e) => {
                                            e.stopPropagation();
                                            if (window.confirm('Are you sure you want to delete this address?')) {
                                                try {
                                                    await removeAddress(addr._id);
                                                    toast.success('Address deleted');
                                                    if (selectedAddressId === addr._id) setSelectedAddressId(null);
                                                } catch (err) {
                                                    toast.error('Failed to delete address');
                                                }
                                            }
                                        }}
                                        className="absolute right-3 top-3 text-gray-400 hover:text-red-500 bg-white/80 p-1 rounded-md transition-colors"
                                        title="Delete Address"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                    <div className="flex items-center justify-between mb-1 pr-6">
                                        <p className="font-bold text-gray-900 text-xs">
                                            {addr.receiverName}{' '}
                                            <span className="ml-2 px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[9px] uppercase tracking-wider">
                                                {addr.type}
                                            </span>
                                        </p>
                                        {selectedAddressId === addr._id && (
                                            <div className="w-3 h-3 rounded-full bg-[#843D9B]" />
                                        )}
                                    </div>
                                    <p className="text-[10px] text-gray-600">
                                        {addr.street}, {addr.city}, {addr.state} - {addr.zipCode}
                                    </p>
                                </div>
                            ))}

                            {(!addresses || addresses.length === 0) && (
                                <div className="text-center p-4 rounded-xl border border-dashed border-gray-200 bg-gray-50">
                                    <p className="text-xs text-gray-500 mb-2">No saved addresses found.</p>
                                    <button
                                        type="button"
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
                    type="button"
                    onClick={handleSendRequest}
                    disabled={
                        isSubmitting ||
                        isUploading ||
                        !selectedTailorId ||
                        !description.trim() ||
                        images.length === 0
                    }
                    className="flex-1 bg-[#843D9B] text-white h-12 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#6B2F7E] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isSubmitting ? <Loader2 size={18} className="animate-spin" /> : 'Send Request'}
                </button>
            </div>
        </div>
    );
};

export default CustomDesignForm;
