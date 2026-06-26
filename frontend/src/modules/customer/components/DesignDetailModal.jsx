import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { cn } from '../../../utils/cn';

const DesignDetailModal = ({ design, isSelected, onToggle, onClose }) => {
    if (!design) return null;

    const allImages = [design.image];
    
    // Add valid reference images
    if (design.referenceImages) {
        if (design.referenceImages.left) allImages.push(design.referenceImages.left);
        if (design.referenceImages.right) allImages.push(design.referenceImages.right);
        if (design.referenceImages.front) allImages.push(design.referenceImages.front);
        if (design.referenceImages.back) allImages.push(design.referenceImages.back);
    }

    const [activeImageIndex, setActiveImageIndex] = useState(0);

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="fixed inset-0 z-[100] bg-white flex flex-col overflow-hidden font-sans"
            >
                {/* Header */}
                <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between p-4 bg-gradient-to-b from-black/50 to-transparent">
                    <button 
                        onClick={onClose}
                        className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <span className="text-white font-bold text-sm bg-black/30 backdrop-blur-md px-4 py-1.5 rounded-full">
                        Design Details
                    </span>
                    <div className="w-10" /> {/* Spacer */}
                </div>

                {/* Main Image View */}
                <div className="relative w-full aspect-[4/5] bg-gray-100">
                    <img 
                        src={allImages[activeImageIndex]} 
                        alt={design.name} 
                        className="w-full h-full object-cover"
                    />
                    
                    {/* Image Counter */}
                    <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-md px-3 py-1 rounded-full">
                        <span className="text-[10px] font-black text-primary tracking-widest">
                            {activeImageIndex + 1} / {allImages.length}
                        </span>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto bg-gray-50 rounded-t-[2rem] -mt-6 relative z-20 pb-28">
                    {/* Thumbnails */}
                    <div className="flex gap-3 px-6 pt-6 overflow-x-auto no-scrollbar">
                        {allImages.map((img, idx) => (
                            <button
                                key={idx}
                                onClick={() => setActiveImageIndex(idx)}
                                className={cn(
                                    "relative w-20 h-20 rounded-2xl overflow-hidden shrink-0 border-2 transition-all",
                                    activeImageIndex === idx ? "border-[#843D9B] shadow-md" : "border-transparent opacity-70 hover:opacity-100"
                                )}
                            >
                                <img src={img} alt={`View ${idx+1}`} className="w-full h-full object-cover" />
                            </button>
                        ))}
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Title and Price */}
                        <div className="flex justify-between items-start gap-4">
                            <div>
                                <h3 className="text-xs font-black text-[#843D9B] uppercase tracking-widest mb-1">Embellishments</h3>
                                <h1 className="text-2xl font-black text-gray-900 leading-tight">{design.name}</h1>
                            </div>
                            <div className="text-right shrink-0">
                                <h2 className="text-2xl font-black text-[#843D9B]">₹{design.price}</h2>
                                <p className="text-[10px] font-bold text-gray-400 uppercase">Tax included</p>
                            </div>
                        </div>

                        {/* Description Box */}
                        <div className="bg-white p-5 rounded-[1.5rem] border border-gray-100 shadow-sm">
                            <p className="text-xs text-gray-500 leading-relaxed font-medium">
                                {design.description || "A premium artisan embellishment featuring intricate embroidery and handcrafted finishes. Perfect for special occasions and boutique styling."}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Bottom Action Bar */}
                <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 pb-safe">
                    <button
                        onClick={() => {
                            onToggle();
                            onClose(); // Optional: close after selecting
                        }}
                        className={cn(
                            "w-full py-4 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg",
                            isSelected 
                                ? "bg-red-50 text-red-500 border border-red-100 hover:bg-red-100 shadow-red-500/10" 
                                : "bg-[#843D9B] text-white hover:bg-[#6b2f7d] shadow-[#843D9B]/20"
                        )}
                    >
                        {isSelected ? 'Remove Design' : 'Select Design'}
                    </button>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default DesignDetailModal;
