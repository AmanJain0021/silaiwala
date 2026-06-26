import React, { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Camera, X, Loader2, Send } from 'lucide-react';
import api from '../../../utils/api';
import { toast } from 'react-hot-toast';

const ReportIssue = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const fileInputRef = useRef(null);

    const [description, setDescription] = useState('');
    const [images, setImages] = useState([]);
    const [imageUrls, setImageUrls] = useState([]);
    const [isUploading, setIsUploading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleImageUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (!files.length) return;

        setIsUploading(true);
        const newImageUrls = [];
        
        for (const file of files) {
            const formData = new FormData();
            formData.append('image', file);
            try {
                const res = await api.post('/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                newImageUrls.push(res.data.data); // Upload API returns url inside .data
            } catch (err) {
                toast.error(`Failed to upload ${file.name}`);
            }
        }
        
        setImageUrls(prev => [...prev, ...newImageUrls]);
        setImages(prev => [...prev, ...files]);
        setIsUploading(false);
    };

    const removeImage = (index) => {
        setImageUrls(prev => prev.filter((_, i) => i !== index));
        setImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
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
            navigate(`/user/issues/${res.data.data._id}`);
        } catch (err) {
            if (err.response?.data?.issueId) {
                toast.success("Issue already reported. Redirecting...");
                navigate(`/user/issues/${err.response.data.issueId}`);
            } else {
                toast.error(err.response?.data?.error || err.response?.data?.message || "Failed to report issue");
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#FDFDFD] pb-20">
            {/* ── HEADER ── */}
            <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
                <div className="max-w-md mx-auto px-4 h-16 flex items-center gap-4">
                    <button 
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-900 active:scale-95 transition-transform"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-lg font-black tracking-tight text-gray-900">Report Issue</h1>
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Order #{orderId.substring(orderId.length - 8).toUpperCase()}</p>
                    </div>
                </div>
            </div>

            <div className="max-w-md mx-auto px-4 py-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-xs font-black text-gray-900 uppercase tracking-wider mb-2">
                            Describe the Issue
                        </label>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What went wrong with the stitching or fitting? Please be specific so the artisan can fix it quickly."
                            className="w-full h-32 bg-gray-50 border-0 rounded-2xl p-4 text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-primary focus:bg-white transition-all resize-none"
                        ></textarea>
                    </div>

                    <div>
                        <label className="block text-xs font-black text-gray-900 uppercase tracking-wider mb-2 flex items-center justify-between">
                            <span>Photos</span>
                            <span className="text-gray-400 font-medium normal-case">Optional</span>
                        </label>
                        
                        <div className="grid grid-cols-3 gap-3 mb-3">
                            {imageUrls.map((url, i) => (
                                <div key={i} className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100 group">
                                    <img src={url} alt={`Upload ${i}`} className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => removeImage(i)}
                                        className="absolute top-2 right-2 w-6 h-6 bg-black/50 text-white rounded-full flex items-center justify-center backdrop-blur-md"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ))}
                            {imageUrls.length < 3 && (
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={isUploading}
                                    className="aspect-square rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 active:scale-95 transition-transform bg-gray-50 hover:bg-gray-100"
                                >
                                    {isUploading ? <Loader2 size={24} className="animate-spin mb-1" /> : <Camera size={24} className="mb-1" />}
                                    <span className="text-[10px] font-bold uppercase tracking-wider">
                                        {isUploading ? 'Uploading...' : 'Add Photo'}
                                    </span>
                                </button>
                            )}
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageUpload}
                            accept="image/*"
                            multiple
                            className="hidden"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting || !description.trim()}
                        className="w-full h-14 bg-primary text-white rounded-2xl font-black uppercase tracking-wider text-xs flex items-center justify-center gap-2 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_8px_20px_rgba(0,0,0,0.1)]"
                    >
                        {isSubmitting ? (
                            <><Loader2 size={16} className="animate-spin" /> Submitting...</>
                        ) : (
                            <><Send size={16} /> Submit Issue</>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ReportIssue;
