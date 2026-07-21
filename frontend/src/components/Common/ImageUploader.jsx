import React, { useState, useRef, useEffect } from 'react';
import { X, UploadCloud, Image as ImageIcon, Camera } from 'lucide-react';
import { validateFile } from '../../utils/validation';
import toast from 'react-hot-toast';

const ImageUploader = ({ 
    label, 
    value, 
    onChange, 
    maxSizeMB = 5, 
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
    className = "",
    cameraFacing = "user",
    compact = false,
    error = ""
}) => {
    const [preview, setPreview] = useState(null);
    const [showOptions, setShowOptions] = useState(false);
    const cameraInputRef = useRef(null);
    const galleryInputRef = useRef(null);

    // Sync external value to local preview
    useEffect(() => {
        if (value instanceof File) {
            const objectUrl = URL.createObjectURL(value);
            setPreview(objectUrl);
            return () => URL.revokeObjectURL(objectUrl);
        } else if (typeof value === 'string' && value) {
            setPreview(value);
        } else if (!value) {
            setPreview(null);
        }
    }, [value]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const error = validateFile(file, maxSizeMB, allowedTypes);
        if (error) {
            toast.error(error);
            if (cameraInputRef.current) cameraInputRef.current.value = '';
            if (galleryInputRef.current) galleryInputRef.current.value = '';
            return;
        }

        onChange(file);
    };

    const handleRemove = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onChange(null);
        if (cameraInputRef.current) cameraInputRef.current.value = '';
        if (galleryInputRef.current) galleryInputRef.current.value = '';
    };

    const triggerUpload = () => {
        setShowOptions(true);
    };

    const triggerCamera = () => {
        if (cameraInputRef.current) cameraInputRef.current.click();
        setShowOptions(false);
    };

    const triggerGallery = () => {
        if (galleryInputRef.current) galleryInputRef.current.click();
        setShowOptions(false);
    };

    // Compact mode: circular avatar-style uploader (e.g. profile photo in delivery signup)
    if (compact) {
        return (
            <div className={`flex flex-col items-center ${className}`}>
                <div 
                    className={`relative w-20 h-20 rounded-full border-2 border-dashed bg-gray-50 flex items-center justify-center cursor-pointer overflow-hidden transition-all shadow-sm ${
                        error ? 'border-red-400 bg-red-50' : preview ? 'border-indigo-200' : 'border-[#843D9B]/30 hover:border-[#843D9B] hover:bg-pink-50/50'
                    }`}
                    onClick={triggerUpload}
                >
                    {preview ? (
                        <>
                            <img src={preview} alt="Profile" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center gap-2">
                                <button type="button" onClick={(e) => { e.stopPropagation(); triggerUpload(); }} className="bg-white text-[#843D9B] p-1.5 rounded-full shadow-md active:scale-95">
                                    <Camera size={12} />
                                </button>
                                <button type="button" onClick={handleRemove} className="bg-red-500 text-white p-1.5 rounded-full shadow-md active:scale-95">
                                    <X size={12} />
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center">
                            <Camera className={error ? 'text-red-400 mb-1' : 'text-[#843D9B]/60 mb-1'} size={20} />
                            <span className={`text-[9px] font-bold uppercase ${error ? 'text-red-500' : 'text-[#843D9B]/60'}`}>Photo</span>
                        </div>
                    )}
                </div>
                {label && (
                    <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mt-1.5">{label}</span>
                )}
                {error && (
                    <span className="text-[10px] text-red-500 font-bold mt-1">{error}</span>
                )}
                
                <input
                    ref={cameraInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    capture={cameraFacing}
                    onChange={handleFileChange}
                />
                <input
                    ref={galleryInputRef}
                    type="file"
                    className="hidden"
                    accept={allowedTypes.join(',')}
                    onChange={handleFileChange}
                />

                {/* Upload Options Modal */}
                {showOptions && (
                    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 p-4" onClick={() => setShowOptions(false)}>
                        <div className="bg-white w-full max-w-sm rounded-[2rem] p-4 space-y-2 animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95" onClick={e => e.stopPropagation()}>
                            <div className="text-center pb-2 pt-2">
                                <h3 className="text-base font-black text-gray-900 tracking-tight">Upload Photo</h3>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Choose a source for your image</p>
                            </div>
                            <button onClick={triggerCamera} className="w-full py-4 bg-gray-50 rounded-2xl flex items-center justify-center gap-3 font-black text-[#843D9B] active:bg-gray-100 transition-colors">
                                <Camera size={18} /> Take Photo
                            </button>
                            <button onClick={triggerGallery} className="w-full py-4 bg-gray-50 rounded-2xl flex items-center justify-center gap-3 font-black text-[#843D9B] active:bg-gray-100 transition-colors">
                                <ImageIcon size={18} /> Choose from Gallery
                            </button>
                            <button onClick={() => setShowOptions(false)} className="w-full py-4 bg-white border border-gray-100 rounded-2xl font-black text-gray-400 active:bg-gray-50 mt-2 transition-colors">
                                Cancel
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Standard mode: rectangular uploader (documents, portfolio, etc.)
    return (
        <div className={`space-y-2 ${className}`}>
            {label && (
                <label className="block text-[10px] uppercase font-bold text-gray-500 tracking-widest">
                    {label}
                </label>
            )}
            
            <div 
                onClick={triggerUpload}
                className={`relative overflow-hidden group rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer
                    ${error ? 'border-red-400 bg-red-50/30' : preview 
                        ? 'border-indigo-200 bg-indigo-50/30' 
                        : 'border-gray-300 bg-gray-50 hover:border-[#843D9B] hover:bg-[#F8F9FD]'
                    }`}
            >
                {preview ? (
                    <div className="relative w-full h-40 flex items-center justify-center">
                        <img 
                            src={preview} 
                            alt="Preview" 
                            className="max-h-full max-w-full object-contain rounded-xl"
                        />
                        {/* Overlay on hover for replacement info */}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center rounded-xl">
                            <span className="text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2">
                                <UploadCloud size={16} /> Replace Image
                            </span>
                        </div>
                        
                        {/* Permanent Remove Button */}
                        <button
                            onClick={handleRemove}
                            className="absolute top-2 right-2 p-1.5 bg-white text-red-500 rounded-full shadow-md hover:bg-red-50 hover:text-red-600 transition-colors z-10"
                        >
                            <X size={16} />
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                        <div className="w-12 h-12 mb-3 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform duration-300">
                            <ImageIcon size={24} />
                        </div>
                        <p className="text-sm font-bold text-gray-700 group-hover:text-[#843D9B] transition-colors">
                            Click to upload image
                        </p>
                        <p className="text-[10px] text-gray-400 font-medium mt-1 uppercase tracking-wider">
                            PNG, JPG or WEBP (Max. {maxSizeMB}MB)
                        </p>
                    </div>
                )}
                
                <input
                    ref={cameraInputRef}
                    type="file"
                    className="hidden"
                    accept="image/*"
                    capture={cameraFacing}
                    onChange={handleFileChange}
                />
                <input
                    ref={galleryInputRef}
                    type="file"
                    className="hidden"
                    accept={allowedTypes.join(',')}
                    onChange={handleFileChange}
                />
            </div>
            {error && (
                <p className="text-[10px] text-red-500 font-bold pl-2">{error}</p>
            )}

            {/* Upload Options Modal */}
            {showOptions && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 p-4" onClick={() => setShowOptions(false)}>
                    <div className="bg-white w-full max-w-sm rounded-[2rem] p-4 space-y-2 animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-0 sm:zoom-in-95" onClick={e => e.stopPropagation()}>
                        <div className="text-center pb-2 pt-2">
                            <h3 className="text-base font-black text-gray-900 tracking-tight">Upload Photo</h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Choose a source for your image</p>
                        </div>
                        <button onClick={triggerCamera} className="w-full py-4 bg-gray-50 rounded-2xl flex items-center justify-center gap-3 font-black text-[#843D9B] active:bg-gray-100 transition-colors">
                            <Camera size={18} /> Take Photo
                        </button>
                        <button onClick={triggerGallery} className="w-full py-4 bg-gray-50 rounded-2xl flex items-center justify-center gap-3 font-black text-[#843D9B] active:bg-gray-100 transition-colors">
                            <ImageIcon size={18} /> Choose from Gallery
                        </button>
                        <button onClick={() => setShowOptions(false)} className="w-full py-4 bg-white border border-gray-100 rounded-2xl font-black text-gray-400 active:bg-gray-50 mt-2 transition-colors">
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImageUploader;
