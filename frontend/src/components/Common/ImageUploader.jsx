import React, { useState, useRef, useEffect } from 'react';
import { X, UploadCloud, Image as ImageIcon } from 'lucide-react';
import { validateFile } from '../../utils/validation';
import toast from 'react-hot-toast';

const ImageUploader = ({ 
    label, 
    value, 
    onChange, 
    maxSizeMB = 5, 
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
    className = ""
}) => {
    const [preview, setPreview] = useState(null);
    const inputRef = useRef(null);

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
            if (inputRef.current) inputRef.current.value = '';
            return;
        }

        onChange(file);
    };

    const handleRemove = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onChange(null);
        if (inputRef.current) inputRef.current.value = '';
    };

    const triggerUpload = () => {
        if (inputRef.current) inputRef.current.click();
    };

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
                    ${preview 
                        ? 'border-indigo-200 bg-indigo-50/30' 
                        : 'border-gray-300 bg-gray-50 hover:border-[#2D2F6E] hover:bg-[#F8F9FD]'
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
                        <p className="text-sm font-bold text-gray-700 group-hover:text-[#2D2F6E] transition-colors">
                            Click to upload image
                        </p>
                        <p className="text-[10px] text-gray-400 font-medium mt-1 uppercase tracking-wider">
                            PNG, JPG or WEBP (Max. {maxSizeMB}MB)
                        </p>
                    </div>
                )}
                
                <input
                    ref={inputRef}
                    type="file"
                    className="hidden"
                    accept={allowedTypes.join(',')}
                    onChange={handleFileChange}
                />
            </div>
        </div>
    );
};

export default ImageUploader;
