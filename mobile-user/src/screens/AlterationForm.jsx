// Port of modules/customer/pages/AlterationForm.jsx (converted with scripts/web2rn.js, then reviewed)
import Screen from '../components/common/Screen';
import React, { useState, useEffect } from "react";
import { useNavigate } from '../lib/nav';
import { ArrowLeft, UploadCloud, X, Loader2, MapPin, Star, Ruler } from "lucide-react-native";
import api from "../lib/api";
import toast from '../lib/toast';
import SafeImage from "../components/common/SafeImage";
import useAddressStore from "../store/userStore";
import { Box, Btn, I, Txt, Img, Input, Scroll } from '../components/ui/primitives';
import { pickImage } from '../lib/files';
import Spin from '../components/ui/Spin';
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
  const handleImageUpload = async () => {
    const files = await pickImage({ multiple: true, limit: Math.max(1, 5 - images.length) });
    if (files.length === 0) return;

    // Limit to 5 images max
    if (images.length + files.length > 5) {
      toast.error("You can upload a maximum of 5 images.");
      return;
    }
    const newImages = files.map(file => ({
      file,
      preview: file.uri
    }));
    setImages(prev => [...prev, ...newImages]);
  };
  const removeImage = indexToRemove => {
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
      const uploadPromises = images.map(async img => {
        const formData = new FormData();
        formData.append('image', img.file);
        formData.append('file', img.file);
        try {
          const res = await api.post('/upload', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          });
          return res.data?.data || res.data?.imageUrl || res.data;
        } catch (error) {
          console.error('Protected Upload error, trying public:', error);
          try {
            const pubRes = await api.post('/upload/public', formData, {
              headers: {
                'Content-Type': 'multipart/form-data'
              }
            });
            return pubRes.data?.data || pubRes.data?.imageUrl || pubRes.data;
          } catch (pubErr) {
            console.error('Public upload error, using preview fallback:', pubErr);
            return img.preview;
          }
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
        const createdAlt = response.data.data;
        toast.success("Alteration request sent to Tailor successfully!");
        navigate('/user/checkout/success', {
          state: {
            orderId: createdAlt?._id,
            orderNumber: createdAlt?.alterationId || 'ALT-REQ',
            pendingAcceptance: true,
            isAlteration: true,
            isNewOrder: true
          }
        });
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      toast.error(error.response?.data?.message || "Failed to submit request.");
    } finally {
      setIsSubmitting(false);
    }
  };
  return <Screen className="bg-gray-50" statusBg="bg-[#843D9B]" statusBar="light"><Box className="flex-1 bg-gray-50 font-sans">
            {/* Header */}
            <Box className="sticky top-0 z-50 bg-[#843D9B] text-white px-4 py-4 flex items-center gap-3 pt-safe shadow-md">
                <Btn onPress={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
                    <I icon={ArrowLeft} size={20} />
                </Btn>
                <Box className="flex-1">
                    <Txt className="text-lg font-bold">Request Alteration</Txt>
                    <Txt className="text-[10px] text-indigo-200">Get quotes directly from tailors</Txt>
                </Box>
            </Box>
            <Scroll className="flex-1" contentClassName="pb-20">

            <Box className="max-w-xl mx-auto p-4 space-y-6 mt-4">
                
                {/* Tailor Selection */}
                <Box className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <Txt className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Txt className="w-6 h-6 rounded-full bg-[#843D9B] text-white flex items-center justify-center text-[10px]">1</Txt>
                        Select a Tailor
                    </Txt>
                    
                    {isLoadingTailors ? <Box className="flex justify-center p-4">
                            <Spin size={24} className="text-[#843D9B] animate-spin" />
                        </Box> : <Scroll contentClassName="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar" nestedScrollEnabled>
                            {tailors.map(tailor => <Btn key={tailor._id} onPress={() => setSelectedTailorId(tailor.user?._id || tailor.user?.id || tailor._id)} className={`block ${`p-3 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${selectedTailorId === (tailor.user?._id || tailor.user?.id || tailor._id) ? 'border-[#843D9B] bg-indigo-50 ring-1 ring-[#843D9B]' : 'border-gray-100 hover:border-indigo-200'}`}`}>
                                    <Box className="w-12 h-12 rounded-full overflow-hidden shrink-0 border border-gray-100">
                                        <SafeImage src={tailor.user?.profileImage} className="w-full h-full object-cover" />
                                    </Box>
                                    <Box className="flex-1">
                                        <Txt className="text-xs font-bold text-gray-900">{tailor.shopName || 'Tailor Partner'}</Txt>
                                        <Txt className="text-[10px] text-gray-500 flex items-center gap-1"><I icon={Star} size={10} className="text-yellow-400 fill-yellow-400" /> {tailor.rating || 'New'}</Txt>
                                    </Box>
                                </Btn>)}
                        </Scroll>}
                </Box>

                {/* Upload Images */}
                <Box className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <Txt className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Txt className="w-6 h-6 rounded-full bg-[#843D9B] text-white flex items-center justify-center text-[10px]">2</Txt>
                        Upload Images
                    </Txt>
                    <Txt className="text-[10px] text-gray-500 mb-3">Upload clear images of the garment and the specific areas that need alteration.</Txt>

                    <Box className="flex flex-wrap gap-3 mb-3">
                        {images.map((img, idx) => <Box key={idx} className="relative w-20 h-20 rounded-xl border border-gray-200 overflow-hidden group">
                                <Img src={img.preview} alt="Upload Preview" className="w-full h-full object-cover" />
                                <Btn onPress={() => removeImage(idx)} className="absolute top-1 right-1 bg-red-500/90 p-1 rounded-full text-white shadow-sm z-10 hover:bg-red-600 transition-colors">
                                    <I icon={X} size={12} />
                                </Btn>
                            </Box>)}
                        
                        {images.length < 5 && <Btn onPress={handleImageUpload} disabled={isUploading} className="relative w-20 h-20 rounded-xl border-2 border-dashed border-[#843D9B]/30 flex flex-col items-center justify-center text-[#843D9B] cursor-pointer hover:bg-indigo-50 transition-colors">
                                {isUploading ? <Spin size={20} className="animate-spin" /> : <I icon={UploadCloud} size={20} />}
                                <Txt className="text-[8px] font-bold mt-1 uppercase tracking-wider">Upload</Txt>
                                </Btn>}
                    </Box>
                </Box>

                {/* Description */}
                <Box className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <Txt className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Txt className="w-6 h-6 rounded-full bg-[#843D9B] text-white flex items-center justify-center text-[10px]">3</Txt>
                        Alteration Details
                    </Txt>
                    <Input value={description} onChangeText={e => setDescription(e)} placeholder="E.g., The waist needs to be taken in by 2 inches, and the hem needs to be shortened by 1 inch." className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-[#843D9B]/20 focus:border-[#843D9B] transition-all min-h-[120px] resize-none" multiline />
                </Box>

                {/* Pickup Address */}
                <Box className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
                    <Txt className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Txt className="w-6 h-6 rounded-full bg-[#843D9B] text-white flex items-center justify-center text-[10px]">4</Txt>
                        Pickup Address
                    </Txt>
                    {addresses.length === 0 ? <Box className="text-center p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <I icon={MapPin} size={24} className="text-gray-400 mx-auto mb-2" />
                            <Txt className="text-xs text-gray-500 mb-3">No addresses found.</Txt>
                            <Btn onPress={() => navigate('/user/profile/addresses')} className="text-xs font-bold text-[#843D9B] px-4 py-2 border border-[#843D9B] rounded-lg hover:bg-indigo-50">
                                Add New Address
                            </Btn>
                        </Box> : <Box className="space-y-3">
                            {addresses.map(addr => {
            const isSelected = selectedAddressId ? addr._id === selectedAddressId : addr._id === addresses[0]._id;
            return <Btn key={addr._id} onPress={() => setSelectedAddressId(addr._id)} className={`block ${`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${isSelected ? 'border-[#843D9B] bg-indigo-50 ring-1 ring-[#843D9B]' : 'border-gray-100 hover:border-indigo-200'}`}`}>
                                        <Box className="mt-0.5"><I icon={MapPin} size={16} className={isSelected ? 'text-[#843D9B]' : 'text-gray-400'} /></Box>
                                        <Box>
                                            <Txt className="text-xs font-bold text-gray-900">{addr.receiverName} <Txt className="ml-2 text-[10px] text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded uppercase">{addr.type}</Txt></Txt>
                                            <Txt className="text-[11px] text-gray-500 mt-1">{addr.street}, {addr.city}, {addr.state} - {addr.zipCode}</Txt>
                                        </Box>
                                    </Btn>;
          })}
                        </Box>}
                </Box>

            </Box>

            {/* Bottom Action Bar */}
                        </Scroll>
<Box className="bg-white border-t border-gray-100 p-4 flex gap-3 z-40 max-w-xl mx-auto shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
                <Btn onPress={handleSubmitRequest} disabled={isSubmitting || !selectedTailorId || !description || images.length === 0 || addresses.length === 0} className="flex-1 bg-[#843D9B] text-white h-12 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-[#6B2F7E] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                    {isSubmitting ? <Spin size={18} className="animate-spin" /> : 'Proceed to Request'}
                </Btn>
            </Box>
        </Box></Screen>;
};
export default AlterationForm;
