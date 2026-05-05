import React, { useState, useRef } from 'react';
import { Upload, X, FileText, Image as ImageIcon } from 'lucide-react';
import { cn } from '../../../../../utils/cn';

const UploadSlip = ({ onUpload, onCancel }) => {
    const fileInputRef = useRef(null);
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
        fileInputRef.current.value = null; // Reset input
    };

    const handleSubmit = () => {
        if (!preview) {
            setError('Please upload an image first');
            return;
        }
        onUpload({
            type: 'slip',
            image: preview, // In real app, this would be a URL after upload
            notes: notes
        });
    };

    return (
        <div className="bg-gray-50 border border-t-0 border-gray-100 rounded-b-2xl p-4 animate-in slide-in-from-top-2 duration-300">

            {/* Upload Area */}
            <div
                onClick={() => !preview && fileInputRef.current?.click()}
                className={cn(
                    "relative w-full aspect-[4/3] rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all bg-white cursor-pointer group mb-4 overflow-hidden",
                    error ? "border-red-300 bg-indigo-50" : "border-gray-200 hover:border-primary hover:bg-[#f2fcf9]"
                )}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                />

                {preview ? (
                    <>
                        <img src={preview} alt="Measurement Slip" className="w-full h-full object-contain" />
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRemove();
                            }}
                            className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full shadow-md hover:bg-indigo-50 text-error transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </>
                ) : (
                    <div className="text-center p-6">
                        <div className="w-12 h-12 rounded-full bg-indigo-50 text-primary flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                            <Upload size={20} />
                        </div>
                        <p className="text-sm font-semibold text-gray-700">Click to Upload Slip</p>
                        <p className="text-[10px] text-gray-400 mt-1">Accepts JPG, PNG (Max 5MB)</p>
                    </div>
                )}
            </div>

            {error && <p className="text-xs text-error text-center mb-4">{error}</p>}

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
