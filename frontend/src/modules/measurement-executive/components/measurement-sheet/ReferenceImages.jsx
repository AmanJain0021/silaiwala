import React, { useRef } from 'react';
import { Camera, X } from 'lucide-react';

const ReferenceImages = ({ images = [], onAddPhotos, onRemovePhoto }) => {
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            onAddPhotos(Array.from(e.target.files));
        }
    };

    return (
        <div className="w-full">
            <h3 className="text-xs font-bold text-gray-800 tracking-tight mb-2.5">
                Reference Images <span className="text-gray-400 font-normal">(Optional)</span>
            </h3>

            <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-hide">
                {/* Uploaded / Default Images */}
                {images.map((img, idx) => {
                    const src = typeof img === 'string' ? img : URL.createObjectURL(img);
                    return (
                        <div
                            key={idx}
                            className="relative w-24 h-24 rounded-2xl overflow-hidden border border-gray-200/90 shadow-sm flex-shrink-0 group bg-gray-50"
                        >
                            <img
                                src={src}
                                alt={`Reference ${idx + 1}`}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = '/assets/images/kameez_ref.jpg';
                                }}
                            />

                            {/* Circular X / Remove Button */}
                            <button
                                type="button"
                                onClick={() => onRemovePhoto(idx)}
                                className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-black/60 hover:bg-black text-white flex items-center justify-center text-xs transition-colors cursor-pointer shadow-md"
                                title="Remove photo"
                            >
                                <X size={12} strokeWidth={2.5} />
                            </button>
                        </div>
                    );
                })}

                {/* Dashed "+ Add Photo" Card */}
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-24 h-24 rounded-2xl border-2 border-dashed border-purple-200 hover:border-[#6C2E9C] bg-white hover:bg-purple-50/30 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-all flex-shrink-0 active:scale-95"
                >
                    <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-[#6C2E9C]">
                        <Camera size={19} strokeWidth={2} />
                    </div>
                    <span className="text-[10px] font-bold text-[#6C2E9C] tracking-tight">
                        Add Photo
                    </span>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        multiple
                        accept="image/*"
                        className="hidden"
                    />
                </button>
            </div>
        </div>
    );
};

export default ReferenceImages;
