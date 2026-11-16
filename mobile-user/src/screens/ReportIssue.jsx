// Port of modules/customer/pages/ReportIssue.jsx (converted with scripts/web2rn.js, then reviewed)
import Screen from '../components/common/Screen';
import React, { useState, useRef } from "react";
import { useParams, useNavigate } from '../lib/nav';
import { ChevronLeft, Camera, X, Loader2, Send } from "lucide-react-native";
import api from "../lib/api";
import toast from '../lib/toast';
import { compressImage } from "../utils/imageCompression";
import { Box, Btn, I, Txt, Input, Img, Scroll } from '../components/ui/primitives';
import Spin from '../components/ui/Spin';
import { pickImage } from '../lib/files';
const ReportIssue = () => {
  const {
    orderId
  } = useParams();
  const navigate = useNavigate();
  const [description, setDescription] = useState('');
  const [images, setImages] = useState([]);
  const [imageUrls, setImageUrls] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const handleImageUpload = async () => {
    const files = await pickImage({ multiple: true, limit: 3 - imageUrls.length });
    if (!files.length) return;
    setIsUploading(true);
    const newImageUrls = [];
    for (const file of files) {
      const compressedFile = await compressImage(file, 800, 0.7);
      const safeName = compressedFile.name && /\.(jpe?g|png|webp)$/i.test(compressedFile.name) ? compressedFile.name : `issue-photo-${Date.now()}.jpg`;
      const uploadFile = { uri: compressedFile.uri, name: safeName, type: compressedFile.type || 'image/jpeg' };
      const formData = new FormData();
      formData.append('image', uploadFile);
      try {
        const res = await api.post('/upload', formData);
        const url = res.data?.data;
        if (url) newImageUrls.push(url);else toast.error('Upload returned no URL');
      } catch (err) {
        const msg = err.response?.data?.message || err.message;
        toast.error(msg || `Failed to upload ${safeName}`);
      }
    }
    setImageUrls(prev => [...prev, ...newImageUrls]);
    setImages(prev => [...prev, ...files]);
    setIsUploading(false);
  };
  const removeImage = index => {
    setImageUrls(prev => prev.filter((_, i) => i !== index));
    setImages(prev => prev.filter((_, i) => i !== index));
  };
  const handleSubmit = async e => {
    if (!description.trim()) {
      return toast.error("Please provide a description of the issue.");
    }
    setIsSubmitting(true);
    try {
      const res = await api.post('/issues', {
        orderId,
        description,
        images: imageUrls
      });
      toast.success("Issue reported successfully!");
      navigate(`/user/issues/${res.data.data._id}`, {
        replace: true
      });
    } catch (err) {
      if (err.response?.data?.issueId) {
        toast.success("Issue already reported. Redirecting...");
        navigate(`/user/issues/${err.response.data.issueId}`, {
          replace: true
        });
      } else {
        toast.error(err.response?.data?.error || err.response?.data?.message || "Failed to report issue");
      }
    } finally {
      setIsSubmitting(false);
    }
  };
  return <Screen className="bg-[#FDFDFD]"><Box className="flex-1 bg-[#FDFDFD]">
            {/* ── HEADER ── */}
            <Box className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
                <Box className="max-w-md mx-auto px-4 h-16 flex items-center gap-4">
                    <Btn onPress={() => navigate(-1)} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-900 active:scale-95 transition-transform">
                        <I icon={ChevronLeft} size={20} />
                    </Btn>
                    <Box>
                        <Txt className="text-lg font-black tracking-tight text-gray-900">Report Issue</Txt>
                        <Txt className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Order #{orderId.substring(orderId.length - 8).toUpperCase()}</Txt>
                    </Box>
                </Box>
            </Box>
            <Scroll className="flex-1" contentClassName="pb-20">

            <Box className="max-w-md mx-auto px-4 py-6">
                <Box className="space-y-6">
                    <Box>
                        <Txt className="block text-xs font-black text-gray-900 uppercase tracking-wider mb-2">
                            Describe the Issue
                        </Txt>
                        <Input value={description} onChangeText={e => setDescription(e)} placeholder="What went wrong with the stitching or fitting? Please be specific so the artisan can fix it quickly." className="w-full h-32 bg-gray-50 border-0 rounded-2xl p-4 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-primary focus:bg-white transition-all resize-none" multiline></Input>
                    </Box>

                    <Box>
                        <Txt className="block text-xs font-black text-gray-900 uppercase tracking-wider mb-2 flex items-center justify-between">
                            <Txt>Photos</Txt>
                            <Txt className="text-gray-400 font-medium normal-case">Optional</Txt>
                        </Txt>
                        
                        <Box className="grid grid-cols-3 gap-3 mb-3">
                            {imageUrls.map((url, i) => <Box key={i} className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 group">
                                    <Img src={url} alt={`Upload ${i}`} className="w-full h-full object-cover" />
                                    <Btn onPress={() => removeImage(i)} className="absolute top-2 right-2 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-md">
                                        <I icon={X} size={12} />
                                    </Btn>
                                </Box>)}
                            {imageUrls.length < 3 && <Btn onPress={handleImageUpload} disabled={isUploading} className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 active:scale-95 transition-transform bg-gray-50 hover:bg-gray-100">
                                    {isUploading ? <Spin size={24} className="animate-spin mb-1" /> : <I icon={Camera} size={24} className="mb-1" />}
                                    <Txt className="text-[10px] font-bold uppercase tracking-wider">
                                        {isUploading ? 'Uploading...' : 'Add Photo'}
                                    </Txt>
                                </Btn>}
                        </Box>
                    </Box>

                    <Btn onPress={handleSubmit} disabled={isSubmitting || !description.trim()} className="w-full h-14 bg-primary text-white rounded-2xl font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_8px_20px_rgba(0,0,0,0.1)]">
                        {isSubmitting ? <><Spin size={16} className="animate-spin" /> Submitting...</> : <><I icon={Send} size={16} /> Submit Issue</>}
                    </Btn>
                </Box>
            </Box>
                    </Scroll>
</Box></Screen>;
};
export default ReportIssue;
