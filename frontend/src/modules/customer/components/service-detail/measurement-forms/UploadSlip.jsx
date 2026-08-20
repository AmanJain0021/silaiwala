import React, { useState, useRef } from 'react';
import { Upload, X, FileText, Image as ImageIcon, Camera } from 'lucide-react';
import { cn } from '../../../../../utils/cn';

const UploadSlip = ({ onUpload, onCancel }) => {
    const fileInputRef = useRef(null);
    const cameraInputRef = useRef(null);
    const [preview, setPreview] = useState(null);
    const [notes, setNotes] = useState('');
    const [error, setError] = useState('');

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                setError('File size too large. Max 5MB');
                return;
            }
            if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
                setError('Only JPG/PNG images allowed');
                return;
            }

            setError('');
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemove = () => {
        setPreview(null);
        if (fileInputRef.current) fileInputRef.current.value = null;
        if (cameraInputRef.current) cameraInputRef.current.value = null;
    };

    const handleSubmit = () => {
        if (!preview) {
            setError('Please upload an image first');
            return;
        }
        onUpload({
            type: 'slip',
            image: preview,
            slipImage: preview,
            notes: notes
        });
    };

    return (
        <div className="bg-gray-50 border border-t-0 border-gray-100 rounded-b-2xl p-4 animate-in slide-in-from-top-2 duration-300">

            {/* Upload Area */}
            {!preview ? (
                <div className="flex gap-3 mb-4">
                    <div 
                        onClick={() => fileInputRef.current?.click()}
                        className={cn(
                            "flex-1 aspect-[4/3] rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all group bg-white",
                            error ? "border-rose-300 bg-rose-50" : "border-gray-200 hover:border-[#843D9B] hover:bg-[#843D9B]/5"
                        )}
                    >
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                        <div className="w-10 h-10 rounded-full bg-indigo-50 text-[#843D9B] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                            <ImageIcon size={18} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Gallery</span>
                    </div>

                    <div 
                        onClick={() => cameraInputRef.current?.click()}
                        className={cn(
                            "flex-1 aspect-[4/3] rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all group bg-white",
                            error ? "border-rose-300 bg-rose-50" : "border-gray-200 hover:border-[#843D9B] hover:bg-[#843D9B]/5"
                        )}
                    >
                        <input
                            type="file"
                            ref={cameraInputRef}
                            className="hidden"
                            accept="image/*"
                            capture="environment"
                            onChange={handleFileChange}
                        />
                        <div className="w-10 h-10 rounded-full bg-indigo-50 text-[#843D9B] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                            <Camera size={18} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Camera</span>
                    </div>
                </div>
            ) : (
                <div className="relative w-full aspect-[4/3] rounded-xl border-2 border-gray-200 mb-4 overflow-hidden bg-gray-50">
                    <img src={preview} alt="Measurement Slip" className="w-full h-full object-contain" />
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleRemove();
                        }}
                        className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full shadow-md hover:bg-rose-50 text-rose-500 transition-colors z-10 cursor-pointer"
                    >
                        <X size={16} />
                    </button>
                </div>
            )}

            {error && <p className="text-[11px] font-bold text-rose-500 text-center mb-4 uppercase tracking-wider">{error}</p>}

            {/* Notes Section */}
            <div className="mb-6">
                <label className="text-xs font-medium text-gray-700 ml-1 mb-1 block">
                    Additional Notes for Tailor
                </label>
                <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-[#e6f4f1] transition-all placeholder:text-gray-300 resize-none"
                    rows={3}
                    placeholder="E.g., Please ignore the crossed out numbers on the slip."
                />
            </div>

            {/* Actions */}
            <div className="flex gap-3">
                <button
                    onClick={onCancel}
                    className="flex-1 py-2.5 rounded-full border border-gray-200 text-gray-500 text-xs font-bold hover:bg-gray-50 transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={handleSubmit}
                    disabled={!preview}
                    className={cn(
                        "flex-1 py-2.5 rounded-full text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2",
                        preview
                            ? "bg-primary hover:bg-primary-dark active:scale-95"
                            : "bg-gray-300 cursor-not-allowed"
                    )}
                >
                    <FileText size={14} />
                    Use This Slip
                </button>
            </div>
        </div>
    );
};

export default UploadSlip;
