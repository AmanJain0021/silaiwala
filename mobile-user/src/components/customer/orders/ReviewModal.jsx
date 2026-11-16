// Port of modules/customer/components/orders/ReviewModal.jsx (converted with scripts/web2rn.js, then reviewed)
import Spin from '../../../components/ui/Spin';
import { Dialog, Sheet } from '../../../components/ui/Sheet';
import React, { useState } from "react";
import { Star, X, Loader2, Send } from "lucide-react-native";
import api from "../../../lib/api";
import { Box, Txt, Btn, I, Input, Scroll } from '../../ui/primitives';
const ReviewModal = ({
  isOpen,
  onClose,
  orderId,
  tailorId,
  deliveryPartnerId,
  onSuccess
}) => {
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
    return <React.Fragment>
            <Sheet visible={!!(isOpen)} onClose={onClose} className={`bg-white w-full max-w-sm rounded-[2.5rem] overflow-hidden shadow-2xl relative`}>
<Box className="flex-shrink flex flex-col overflow-hidden">
                    {/* Header */}
                    <Box className="p-6 pb-0 flex items-center justify-between">
                        <Txt className="text-xl font-black text-primary tracking-tight">Rate Experience</Txt>
                        <Btn onPress={onClose} className="p-2 bg-gray-50 rounded-full text-gray-400">
                            <I icon={X} size={20} />
                        </Btn>
                    </Box>

                    <Box className="p-6 space-y-6">
                        {/* Target Switcher */}
                        {tailorId && deliveryPartnerId && <Box className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-100">
                                <Btn onPress={() => setTarget('Tailor')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${target === 'Tailor' ? 'bg-primary text-white shadow-md' : 'text-gray-400'}`}>
                                    Artisan
                                </Btn>
                                <Btn onPress={() => setTarget('DeliveryPartner')} className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${target === 'DeliveryPartner' ? 'bg-amber-600 text-white shadow-md' : 'text-gray-400'}`}>
                                    Rider
                                </Btn>
                            </Box>}

                        {/* Stars */}
                        <Box className="flex flex-col items-center gap-4 py-4">
                            <Box className="flex gap-2">
                                {[1, 2, 3, 4, 5].map(s => <Btn key={s} onPress={() => setRating(s)} className="transform active:scale-90 transition-transform">
                                        <I icon={Star} size={40} className={`${s <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-100'} transition-colors`} strokeWidth={1.5} />
                                    </Btn>)}
                            </Box>
                            <Txt className="text-xs font-black text-gray-400 uppercase tracking-widest">
                                {rating === 5 ? 'Exceptional!' : rating === 4 ? 'Very Good' : rating === 3 ? 'Good' : rating === 2 ? 'Fair' : 'Poor'}
                            </Txt>
                        </Box>

                        {/* Comment */}
                        <Box className="space-y-2">
                            <Input value={comment} onChangeText={e => setComment(e)} placeholder="Write your feedback here..." className="w-full bg-gray-50 border border-gray-100 rounded-3xl p-5 text-sm font-medium focus:ring-2 focus:ring-primary/10 focus:border-primary transition-all outline-none resize-none min-h-[120px]" multiline />
                        </Box>

                        {error && <Txt className="text-[10px] font-bold text-error text-center uppercase tracking-tight">{error}</Txt>}

                        {/* Submit Button */}
                        <Btn onPress={handleSubmit} disabled={isSubmitting} className="w-full py-5 bg-primary text-white rounded-[2rem] font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all disabled:opacity-50">
                            {isSubmitting ? <Spin size={18} className="animate-spin" /> : <>
                                    <I icon={Send} size={18} />
                                    Submit Feedback
                                </>}
                        </Btn>
                    </Box>
                </Box>
</Sheet>
        </React.Fragment>;
};
export default ReviewModal;
