// Port of modules/customer/pages/CustomDesignForm.jsx (converted with scripts/web2rn.js, then reviewed)
import storage from '../lib/storage';
import { confirm } from '../lib/alert';
import Screen from '../components/common/Screen';
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from '../lib/nav';
import { ArrowLeft, UploadCloud, X, Loader2, Star, Plus, Trash2, Camera, ChevronRight } from "lucide-react-native";
import api from "../lib/api";
import toast from '../lib/toast';
import SafeImage from "../components/common/SafeImage";
import useUserStore from "../store/userStore";
import AddressForm from "../components/customer/checkout/AddressForm";
import { getImageUrl } from "../utils/imageUrl";
import { Box, Btn, I, Txt, Img, Input, Scroll } from '../components/ui/primitives';
import { pickImage, readAsDataUrl } from '../lib/files';
import Spin from '../components/ui/Spin';
const DRAFT_KEY = 'custom-design-draft';
const MAX_IMAGES = 10;
const MAX_FILE_MB = 5;
const loadDraft = () => {
  try {
    const raw = storage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
};
const clearDraft = () => {
  try {
    storage.removeItem(DRAFT_KEY);
  } catch {
    /* ignore */
  }
};
const saveDraft = draft => {
  try {
    storage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch (err) {
    console.warn('Failed to save custom design draft:', err);
    toast.error('Could not save draft locally (storage full). Photos may be lost on refresh.');
  }
};
const extractUploadUrl = res => {
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
  const [images, setImages] = useState(Array.isArray(draft?.images) ? draft.images.filter(img => img?.url).map(img => ({
    url: img.url,
    preview: img.preview || img.url
  })) : []);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tailors, setTailors] = useState([]);
  const [selectedTailorId, setSelectedTailorId] = useState(preselectedTailorId || draft?.selectedTailorId || null);
  const [selectedAddressId, setSelectedAddressId] = useState(draft?.selectedAddressId || null);
  const [isLoadingTailors, setIsLoadingTailors] = useState(true);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [draftReady, setDraftReady] = useState(false);
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const {
    fetchProfile,
    addresses,
    fetchAddresses,
    removeAddress
  } = useUserStore();
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
      images: images.map(img => ({
        url: img.url,
        preview: img.url || img.preview
      })),
      updatedAt: Date.now()
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
            const matched = fetchedTailors.find(t => isMatchingTailor(t, preselectedTailorId));
            if (matched) {
              setSelectedTailorId(matched._id);
            }
          } else if (selectedTailorId) {
            const matched = fetchedTailors.find(t => isMatchingTailor(t, selectedTailorId));
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
      const defaultAddr = addresses.find(a => a.isDefault) || addresses[0];
      setSelectedAddressId(defaultAddr._id);
    }
  }, [addresses, selectedAddressId]);
  const uploadFile = async file => {
    const formData = new FormData();
    formData.append('image', file);
    formData.append('file', file);
    formData.append('folder', 'custom_designs');
    let res;
    try {
      res = await api.post('/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
    } catch (err) {
      console.warn('Protected /upload failed, trying /upload/public:', err);
      try {
        res = await api.post('/upload/public', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
      } catch (pubErr) {
        console.warn('Public upload failed, using base64 fallback:', pubErr);
        const base64 = await readAsDataUrl(file);
        return base64;
      }
    }
    const url = extractUploadUrl(res);
    if (!url) {
      const base64 = await readAsDataUrl(file);
      return base64;
    }
    return url;
  };
  const handleImageUpload = async (camera = false) => {
    const picked = await pickImage({ camera, multiple: !camera, limit: Math.max(1, MAX_IMAGES - images.length) });
    const files = camera ? (picked ? [picked] : []) : picked;
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
            preview: getImageUrl(url) || url
          });
        } catch (err) {
          console.error('Upload error:', err);
          toast.error(err.response?.data?.message || `Failed to upload ${file.name || 'image'}`);
        }
      }
      if (uploaded.length > 0) {
        setImages(prev => [...prev, ...uploaded].slice(0, MAX_IMAGES));
        toast.success(uploaded.length === 1 ? 'Photo uploaded' : `${uploaded.length} photos uploaded`);
      }
    } finally {
      setIsUploading(false);
    }
  };
  const removeImage = indexToRemove => {
    setImages(prev => prev.filter((_, index) => index !== indexToRemove));
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
    const deliveryAddress = addresses?.find(a => a._id === selectedAddressId);
    if (!deliveryAddress) {
      toast.error('Please add and select a delivery address.');
      return;
    }
    const validUrls = images.map(img => img.url).filter(Boolean);
    if (validUrls.length === 0) {
      toast.error('Please upload at least one design image.');
      return;
    }
    setIsSubmitting(true);
    try {
      const selectedTailorObj = tailors.find(t => isMatchingTailor(t, selectedTailorId));
      const finalTailorIdToSend = selectedTailorObj?.user?._id || selectedTailorObj?._id || selectedTailorId;
      const res = await api.post('/custom-designs/request', {
        tailorId: finalTailorIdToSend,
        description: description.trim(),
        images: validUrls,
        deliveryAddress
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
          isNewOrder: true
        }
      });
    } catch (error) {
      console.error('Error sending request:', error);
      toast.error(error.response?.data?.message || 'Failed to send request.');
    } finally {
      setIsSubmitting(false);
    }
  };
  const currentSelectedTailor = tailors.find(t => isMatchingTailor(t, selectedTailorId));
  return <Screen className="bg-gray-50" statusBg="bg-[#843D9B]" statusBar="light"><Box className="flex-1 bg-gray-50 font-sans">
            {/* Header */}
            <Box className="sticky top-0 z-50 bg-[#843D9B] text-white px-4 py-4 flex items-center gap-3 pt-safe shadow-md">
                <Btn onPress={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
                    <I icon={ArrowLeft} size={20} />
                </Btn>
                <Box className="flex-1">
                    <Txt className="text-lg font-bold">Custom Design Request</Txt>
                    <Txt className="text-[10px] text-indigo-200">
                        Upload your dream design and get a quote
                        {images.length > 0 || description ? ' · Draft saved' : ''}
                    </Txt>
                </Box>
            </Box>
            <Scroll className="flex-1" contentClassName="pb-20">

            <Box className="max-w-xl mx-auto p-4 space-y-6 mt-4">
                {/* Tailor Selection */}
                <Box className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
                    <Box className="flex items-center justify-between">
                        <Txt className="text-sm font-bold text-gray-900 flex items-center gap-2">
                            <Txt className="w-6 h-6 rounded-full bg-[#843D9B] text-white flex items-center justify-center text-[10px]">
                                1
                            </Txt>
                            Selected Tailor
                        </Txt>
                        <Btn onPress={() => navigate('/user/tailors')} className="text-[10px] font-black text-[#843D9B] bg-[#843D9B]/10 hover:bg-[#843D9B]/15 px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 cursor-pointer active:scale-95 shadow-xs">
                            <Txt>All Tailors</Txt>
                            <I icon={ChevronRight} size={12} />
                        </Btn>
                    </Box>

                    {isLoadingTailors ? <Box className="flex justify-center p-4">
                            <Spin size={24} className="text-[#843D9B] animate-spin" />
                        </Box> : currentSelectedTailor ? <Box className="p-3.5 rounded-2xl border border-[#843D9B] bg-[#843D9B]/5 ring-2 ring-[#843D9B]/15 flex items-center gap-3 shadow-xs">
                            <Box className="w-12 h-12 rounded-full overflow-hidden shrink-0 border border-gray-100 shadow-xs">
                                <SafeImage src={currentSelectedTailor.user?.profileImage} className="w-full h-full object-cover" />
                            </Box>
                            <Box className="flex-1 min-w-0">
                                <Box className="flex items-center justify-between">
                                    <Txt className="text-xs font-bold text-gray-900 truncate">
                                        {currentSelectedTailor.shopName || 'Tailor Partner'}
                                    </Txt>
                                    <Txt className="text-[9px] font-black bg-[#843D9B] text-white px-2.5 py-0.5 rounded-md uppercase tracking-wider shadow-xs">
                                        Selected
                                    </Txt>
                                </Box>
                                <Txt className="text-[10px] text-gray-500 flex items-center gap-1 mt-0.5">
                                    <I icon={Star} size={10} className="text-amber-400 fill-amber-400" />{' '}
                                    {currentSelectedTailor.rating || 'New'}
                                </Txt>
                            </Box>
                        </Box> : <Box className="p-4 rounded-2xl border border-dashed border-gray-200 text-center space-y-2">
                            <Txt className="text-xs text-gray-500 font-semibold">No tailor selected yet.</Txt>
                            <Btn onPress={() => navigate('/user/tailors')} className="text-xs font-bold text-white bg-[#843D9B] px-4 py-2 rounded-xl shadow-sm hover:bg-[#6B2F7E] transition-colors">
                                Choose Tailor from Shops
                            </Btn>
                        </Box>}
                </Box>

                {/* Upload Images */}
                <Box className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <Txt className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Txt className="w-6 h-6 rounded-full bg-[#843D9B] text-white flex items-center justify-center text-[10px]">
                            2
                        </Txt>
                        Upload Reference Images
                    </Txt>
                    <Txt className="text-[10px] text-gray-500 mb-3">
                        Photos upload immediately and stay saved if you refresh. Max {MAX_IMAGES} images,{' '}
                        {MAX_FILE_MB}MB each.
                    </Txt>

                    <Box className="flex flex-wrap gap-3 mb-3">
                        {images.map((img, idx) => <Box key={`${img.url}-${idx}`} className="relative w-20 h-20 rounded-xl border border-gray-200 overflow-hidden group bg-gray-50">
                                <Img src={getImageUrl(img.preview || img.url)} alt={`Design ${idx + 1}`} className="w-full h-full object-cover" fallback="https://placehold.co/80x80/e6e8f0/843d9b?text=Photo" />
                                <Btn onPress={() => removeImage(idx)} className="absolute top-1 right-1 bg-red-500/90 p-1 rounded-full text-white shadow-sm z-10 hover:bg-red-600 transition-colors">
                                    <I icon={X} size={12} />
                                </Btn>
                            </Box>)}

                        {images.length < MAX_IMAGES && <Box className="flex gap-2">
                                <Btn onPress={() => handleImageUpload(true)} disabled={isUploading || isSubmitting} className="relative w-20 h-20 rounded-xl border-2 border-dashed border-[#843D9B]/30 flex flex-col items-center justify-center text-[#843D9B] cursor-pointer hover:bg-indigo-50 transition-colors">
                                    {isUploading ? <Spin size={20} className="animate-spin" /> : <I icon={Camera} size={20} />}
                                    <Txt className="text-[8px] font-bold mt-1 uppercase tracking-wider text-center leading-tight">
                                        Camera
                                    </Txt>
                                    </Btn>
                                <Btn onPress={() => handleImageUpload(false)} disabled={isUploading || isSubmitting} className="relative w-20 h-20 rounded-xl border-2 border-dashed border-[#843D9B]/30 flex flex-col items-center justify-center text-[#843D9B] cursor-pointer hover:bg-indigo-50 transition-colors">
                                    {isUploading ? <Spin size={20} className="animate-spin" /> : <I icon={UploadCloud} size={20} />}
                                    <Txt className="text-[8px] font-bold mt-1 uppercase tracking-wider text-center leading-tight">
                                        Gallery
                                    </Txt>
                                    </Btn>
                            </Box>}
                    </Box>
                    {isUploading && <Txt className="text-[10px] text-[#843D9B] font-semibold flex items-center gap-1.5">
                            <Spin size={12} className="animate-spin" /> Uploading photo…
                        </Txt>}
                </Box>

                {/* Description */}
                <Box className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <Txt className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Txt className="w-6 h-6 rounded-full bg-[#843D9B] text-white flex items-center justify-center text-[10px]">
                            3
                        </Txt>
                        Design Requirements
                    </Txt>
                    <Input value={description} onChangeText={e => setDescription(e)} placeholder="E.g., I want this lehenga exactly like the image but with full sleeves. Fabric should be silk." className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-[#843D9B]/20 focus:border-[#843D9B] transition-all min-h-[120px] resize-none" multiline />
                </Box>

                {/* Address Selection */}
                <Box className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <Box className="flex justify-between items-center mb-4">
                        <Txt className="text-sm font-bold text-gray-900 flex items-center gap-2">
                            <Txt className="w-6 h-6 rounded-full bg-[#843D9B] text-white flex items-center justify-center text-[10px]">
                                4
                            </Txt>
                            Pickup & Delivery Address
                        </Txt>
                        {!isAddingAddress && <Btn onPress={() => setIsAddingAddress(true)} className="text-[10px] font-bold text-[#843D9B] hover:bg-indigo-50 px-2 py-1 rounded transition-colors flex items-center gap-1">
                                <I icon={Plus} size={12} /> Add New
                            </Btn>}
                    </Box>

                    {isAddingAddress ? <Box className="mt-2">
                            <AddressForm onCancel={() => setIsAddingAddress(false)} onSuccess={() => {
            setIsAddingAddress(false);
            fetchAddresses();
          }} />
                        </Box> : <Box className="space-y-3">
                            {addresses?.map(addr => <Btn key={addr._id} onPress={() => setSelectedAddressId(addr._id)} className={`block ${`p-3 rounded-xl border cursor-pointer transition-all ${selectedAddressId === addr._id ? 'border-[#843D9B] bg-indigo-50 ring-1 ring-[#843D9B]' : 'border-gray-100 hover:border-indigo-200'} relative group`}`}>
                                    <Btn onPress={async e => {
              if (await confirm('Are you sure you want to delete this address?')) {
                try {
                  await removeAddress(addr._id);
                  toast.success('Address deleted');
                  if (selectedAddressId === addr._id) setSelectedAddressId(null);
                } catch (err) {
                  toast.error('Failed to delete address');
                }
              }
            }} className="absolute right-3 top-3 text-gray-400 hover:text-red-500 bg-white/80 p-1 rounded-md transition-colors">
                                        <I icon={Trash2} size={14} />
                                    </Btn>
                                    <Box className="flex items-center justify-between mb-1 pr-6">
                                        <Txt className="font-bold text-gray-900 text-xs">
                                            {addr.receiverName}{' '}
                                            <Txt className="ml-2 px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[9px] uppercase tracking-wider">
                                                {addr.type}
                                            </Txt>
                                        </Txt>
                                        {selectedAddressId === addr._id && <Box className="w-3 h-3 rounded-full bg-[#843D9B]" />}
                                    </Box>
                                    <Txt className="text-[10px] text-gray-600">
                                        {addr.street}, {addr.city}, {addr.state} - {addr.zipCode}
                                    </Txt>
                                </Btn>)}

                            {(!addresses || addresses.length === 0) && <Box className="text-center p-4 rounded-xl border border-dashed border-gray-200 bg-gray-50">
                                    <Txt className="text-xs text-gray-500 mb-2">No saved addresses found.</Txt>
                                    <Btn onPress={() => setIsAddingAddress(true)} className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-[#843D9B] hover:bg-gray-50 transition-colors">
                                        Add New Address
                                    </Btn>
                                </Box>}
                        </Box>}
                </Box>
            </Box>

            {/* Bottom Action Bar */}
                        </Scroll>
<Box className="bg-white border-t border-gray-100 p-4 flex gap-3 z-40 max-w-xl mx-auto shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                <Btn onPress={handleSendRequest} disabled={isSubmitting || isUploading || !selectedTailorId || !description.trim() || images.length === 0} className="flex-1 bg-[#843D9B] text-white h-12 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#6B2F7E] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                    {isSubmitting ? <Spin size={18} className="animate-spin" /> : 'Send Request'}
                </Btn>
            </Box>
        </Box></Screen>;
};
export default CustomDesignForm;
