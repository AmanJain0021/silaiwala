import React, { useState } from 'react';
import { Star, X, Loader2, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../../../utils/api';

const ReviewModal = ({ isOpen, onClose, orderId, tailorId, deliveryPartnerId, onSuccess }) => {
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState('');
    const [target, setTarget] = useState('Tailor'); // Tailor or DeliveryPartner
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async () => {
        if (!comment.trim()) {
            setError("Please write a small comment.");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const targetId = target === 'Tailor' ? tailorId : deliveryPartnerId;
            const response = await api.post('/reviews', {
                rating,
                comment,
                targetType: target === 'Tailor' ? 'Tailor' : 'DeliveryPartner',
                targetId,
                orderId
            });

            if (response.data.success) {
                // If both exist, allow switching to the other one after success? 
                // Or just close. Let's close and show success.
                onSuccess?.();
                onClose();
            }
        } catch (err) {
            setError(err.response?.data?.message || "Failed to submit review.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    className="bg-white w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl relative"
                >
                    {/* Header */}
                    <div className="p-6 pb-0 flex items-center justify-between">
                        <h2 className="text-xl font-black text-primary tracking-tight">Rate Experience</h2>
                        <button onClick={onClose} className="p-2 bg-gray-50 rounded-full text-gray-400">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Target Switcher */}
                        {(tailorId && deliveryPartnerId) && (
                            <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
                                <button
                                    onClick={() => setTarget('Tailor')}
                                    className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                                        target === 'Tailor' ? 'bg-primary text-white shadow-md' : 'text-gray-400'
                                    }`}
                                >
                                    Artisan
                                </button>
                                <button
                                    onClick={() => setTarget('DeliveryPartner')}
                                    className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${
                                        target === 'DeliveryPartner' ? 'bg-amber-600 text-white shadow-md' : 'text-gray-400'
                                    }`}
                                >
                                    Rider
                                </button>
                            </div>
                        )}

                        {/* Stars */}
                        <div className="flex flex-col items-center gap-4 py-4">
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => setRating(s)}
                                        className="transform active:scale-90 transition-transform"
                                    >
                                        <Star
                                            size={40}
                                            className={`${
                                                s <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-100'
                                            } transition-colors`}
                                            strokeWidth={1.5}
                                        />
                                    </button>
                                ))}
                            </div>
                            <p className="text-xs font-black text-gray-400 uppercase tracking-widest">
                                {rating === 5 ? 'Exceptional!' : rating === 4 ? 'Very Good' : rating === 3 ? 'Good' : rating === 2 ? 'Fair' : 'Poor'}
                            </p>
                        </div>

                        {/* Comment */}
                        <div className="space-y-2">
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="Write your feedback here..."
                                className="w-full bg-gray-50 border border-gray-100 rounded-3xl p-5 text-sm font-medium focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all outline-none resize-none min-h-[120px]"
                            />
                        </div>

                        {error && <p className="text-[10px] font-bold text-error text-center uppercase tracking-tight">{error}</p>}

                        {/* Submit Button */}
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="w-full py-5 bg-primary text-white rounded-[2rem] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <Loader2 size={18} className="animate-spin" />
                            ) : (
                                <>
                                    <Send size={18} />
                                    Submit Feedback
                                </>
                            )}
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default ReviewModal;
