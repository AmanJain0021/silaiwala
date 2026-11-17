// Port of components/Common/ImageUploader.jsx (converted with scripts/web2rn.js, then reviewed)
import { pickImage } from '../../lib/files';
import { Dialog, Sheet } from '../../components/ui/Sheet';
import React, { useState, useRef, useEffect } from "react";
import { X, UploadCloud, Image as ImageIcon, Camera } from "lucide-react-native";
import { validateFile } from "../../utils/validation";
import toast from '../../lib/toast';
import { SOCKET_URL } from "../../lib/config";
import { Box, Btn, Img, I, Txt, Input, Scroll } from '../ui/primitives';
const resolveImageUrl = val => {
  if (!val || typeof val !== 'string' || val === 'default_profile.png' || val === 'null' || val === 'undefined') return null;
  if (val.startsWith('http') || val.startsWith('data:') || val.startsWith('blob:')) return val;
  const base = SOCKET_URL || 'http://localhost:5000';
  return `${base.replace(/\/$/, '')}/${val.replace(/^\//, '')}`;
};
const ImageUploader = ({
  label,
  value,
  onChange,
  maxSizeMB = 5,
  allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  className = "",
  cameraFacing = "user",
  compact = false,
  error = "",
  dark = false
}) => {
  // web VerificationStatus restyles the uploader with `.dark-theme-uploader` CSS overrides; same swaps here
  const t = (cls) => !dark ? cls : cls
    .replace(/\bbg-gray-50\b/g, 'bg-[#1A1A1A]').replace(/\bborder-gray-300\b/g, 'border-[#2A2A2A]')
    .replace(/\btext-gray-700\b/g, 'text-white/80').replace(/\btext-gray-(400|500)\b/g, 'text-white/40')
    .replace(/\bbg-indigo-50\b/g, 'bg-[#843D9B]/20').replace(/\btext-indigo-500\b/g, 'text-[#843D9B]');
  const [preview, setPreview] = useState(null);
  const [showOptions, setShowOptions] = useState(false);
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  // Sync external value to local preview
  useEffect(() => {
    if (value && typeof value === 'object' && value.uri) {
      setPreview(value.uri);
    } else if (typeof value === 'string' && value) {
      const resolved = resolveImageUrl(value);
      setPreview(resolved);
    } else {
      setPreview(null);
    }
  }, [value]);
  const handleFileChange = file => {
    if (!file) return;
    const error = validateFile(file, maxSizeMB, allowedTypes);
    if (error) {
      toast.error(error);
      return;
    }
    onChange(file);
  };
  const handleRemove = e => {
    onChange(null);
  };
  const triggerUpload = () => {
    setShowOptions(true);
  };
  const triggerCamera = () => {
    setShowOptions(false);
    pickImage({ camera: true }).then((f) => f && handleFileChange(f));
  };
  const triggerGallery = () => {
    setShowOptions(false);
    pickImage().then((f) => f && handleFileChange(f));
  };

  // Compact mode: circular avatar-style uploader (e.g. profile photo in delivery signup)
  if (compact) {
    return <Box className={`flex flex-col items-center ${className}`}>
                <Btn className={`block ${`relative w-20 h-20 rounded-full border-2 border-dashed bg-gray-50 flex items-center justify-center cursor-pointer overflow-hidden transition-all shadow-sm ${error ? 'border-red-400 bg-red-50' : preview ? 'border-indigo-200' : 'border-[#843D9B]/30 hover:border-[#843D9B] hover:bg-pink-50/50'}`}`} onPress={triggerUpload}>
                    {preview ? <>
                            <Img src={preview} alt="Profile" className="w-full h-full object-cover" />
                            <Box className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2">
                                <Btn onPress={e => {
              triggerUpload();
            }} className="bg-white text-[#843D9B] p-1.5 rounded-full shadow-md active:scale-95">
                                    <I icon={Camera} size={12} />
                                </Btn>
                                <Btn onPress={handleRemove} className="bg-red-500 text-white p-1.5 rounded-full shadow-md active:scale-95">
                                    <I icon={X} size={12} />
                                </Btn>
                            </Box>
                        </> : <Box className="flex flex-col items-center">
                            <I icon={Camera} className={error ? 'text-red-400 mb-1' : 'text-[#843D9B]/60 mb-1'} size={20} />
                            <Txt className={`text-[9px] font-bold uppercase ${error ? 'text-red-500' : 'text-[#843D9B]/60'}`}>Photo</Txt>
                        </Box>}
                </Btn>
                {label && <Txt className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mt-1.5">{label}</Txt>}
                {error && <Txt className="text-[10px] text-red-500 font-bold mt-1">{error}</Txt>}

                {/* Upload Options Modal */}
                <Sheet visible={!!(showOptions)} onClose={() => setShowOptions(false)} className={`bg-white rounded-[2rem] p-4 space-y-2 mx-4 mb-4`}>
<Box className="flex-shrink flex flex-col overflow-hidden">
                            <Box className="text-center pb-2 pt-2">
                                <Txt className="text-base font-black text-gray-900 tracking-tight">Upload Photo</Txt>
                                <Txt className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Choose a source for your image</Txt>
                            </Box>
                            <Btn onPress={triggerCamera} className="w-full py-4 bg-gray-50 rounded-2xl flex items-center justify-center gap-3 font-black text-[#843D9B] active:bg-gray-100 transition-colors">
                                <I icon={Camera} size={18} /> Take Photo
                            </Btn>
                            <Btn onPress={triggerGallery} className="w-full py-4 bg-gray-50 rounded-2xl flex items-center justify-center gap-3 font-black text-[#843D9B] active:bg-gray-100 transition-colors">
                                <I icon={ImageIcon} size={18} /> Choose from Gallery
                            </Btn>
                            <Btn onPress={() => setShowOptions(false)} className="w-full py-4 bg-white border border-gray-100 rounded-2xl font-black text-gray-400 active:bg-gray-50 mt-2 transition-colors">
                                Cancel
                            </Btn>
                        </Box>
</Sheet>
            </Box>;
  }

  // Standard mode: rectangular uploader (documents, portfolio, etc.)
  return <Box className={t(`space-y-2 ${className}`)}>
            {label && <Txt className={t("block text-[10px] uppercase font-bold text-gray-500 tracking-widest")}>
                    {label}
                </Txt>}
            
            <Btn onPress={triggerUpload} className={t(`block relative overflow-hidden group rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer ${error ? 'border-red-400 bg-red-50/30' : preview ? 'border-indigo-200 bg-indigo-50/30' : 'border-gray-300 bg-gray-50 hover:border-[#843D9B] hover:bg-[#F8F9FD]'}`)}>
                {preview ? <Box className={t("relative w-full h-40 flex items-center justify-center")}>
                        <Img src={preview} alt="Preview" className={t("max-h-full max-w-full object-contain rounded-xl")} />
                        {/* Overlay on hover for replacement info */}
                        <Box className={t("absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center rounded-xl")}>
                            <Txt className={t("text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2")}>
                                <I icon={UploadCloud} size={16} /> Replace Image
                            </Txt>
                        </Box>
                        
                        {/* Permanent Remove Button */}
                        <Btn onPress={handleRemove} className={t("absolute top-2 right-2 p-1.5 bg-white text-red-500 rounded-full shadow-md hover:bg-red-50 hover:text-red-600 transition-colors z-10")}>
                            <I icon={X} size={16} />
                        </Btn>
                    </Box> : <Box className={t("flex flex-col items-center justify-center py-8 px-4 text-center")}>
                        <Box className={t("w-12 h-12 mb-3 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform duration-300")}>
                            <I icon={ImageIcon} size={24} />
                        </Box>
                        <Txt className={t("text-sm font-bold text-gray-700 group-hover:text-[#843D9B] transition-colors")}>
                            Click to upload image
                        </Txt>
                        <Txt className={t("text-[10px] text-gray-400 font-medium mt-1 uppercase tracking-wider")}>
                            PNG, JPG or WEBP (Max. {maxSizeMB}MB)
                        </Txt>
                    </Box>}
            </Btn>
            {error && <Txt className={t("text-[10px] text-red-500 font-bold pl-2")}>{error}</Txt>}

            {/* Upload Options Modal */}
            <Sheet visible={!!(showOptions)} onClose={() => setShowOptions(false)} className={t(`bg-white rounded-[2rem] p-4 space-y-2 mx-4 mb-4`)}>
<Box className={t("flex-shrink flex flex-col overflow-hidden")}>
                        <Box className={t("text-center pb-2 pt-2")}>
                            <Txt className={t("text-base font-black text-gray-900 tracking-tight")}>Upload Photo</Txt>
                            <Txt className={t("text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1")}>Choose a source for your image</Txt>
                        </Box>
                        <Btn onPress={triggerCamera} className={t("w-full py-4 bg-gray-50 rounded-2xl flex items-center justify-center gap-3 font-black text-[#843D9B] active:bg-gray-100 transition-colors")}>
                            <I icon={Camera} size={18} /> Take Photo
                        </Btn>
                        <Btn onPress={triggerGallery} className={t("w-full py-4 bg-gray-50 rounded-2xl flex items-center justify-center gap-3 font-black text-[#843D9B] active:bg-gray-100 transition-colors")}>
                            <I icon={ImageIcon} size={18} /> Choose from Gallery
                        </Btn>
                        <Btn onPress={() => setShowOptions(false)} className={t("w-full py-4 bg-white border border-gray-100 rounded-2xl font-black text-gray-400 active:bg-gray-50 mt-2 transition-colors")}>
                            Cancel
                        </Btn>
                    </Box>
</Sheet>
        </Box>;
};
export default ImageUploader;
