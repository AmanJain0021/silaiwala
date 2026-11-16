// Port of modules/customer/pages/MyReviews.jsx (converted with scripts/web2rn.js, then reviewed)
import Screen from '../components/common/Screen';
import React, { useState, useEffect } from "react";
import { ArrowLeft, Star, Calendar, Package, Truck, MessageSquare, Trash2, Edit2, Loader2 } from "lucide-react-native";
import { useNavigate } from '../lib/nav';
import api from "../lib/api";
import { I, Box, Btn, Txt, Scroll } from '../components/ui/primitives';
import Spin from '../components/ui/Spin';
const MyReviews = () => {
  const navigate = useNavigate();
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const fetchMyReviews = async () => {
    try {
      const response = await api.get('/reviews/my-reviews');
      if (response.data.success) {
        setReviews(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchMyReviews();
  }, []);
  const renderStars = rating => {
    return [...Array(5)].map((_, i) => <I icon={Star} key={i} size={14} className={i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"} />);
  };
  return <Screen className="bg-gray-50" statusBg="bg-primary" statusBar="light"><Box className="flex-1 bg-gray-50 font-sans text-gray-900">
            {/* Header */}
            <Box className="sticky top-0 z-50 bg-primary text-white px-4 py-4 flex items-center gap-3 shadow-lg">
                <Btn onPress={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition-colors">
                    <I icon={ArrowLeft} size={20} />
                </Btn>
                <Txt className="text-lg font-bold">My Reviews</Txt>
            </Box>
            <Scroll className="flex-1" contentClassName="pb-20">

            <Box className="max-w-xl mx-auto p-4 py-8">
                {isLoading ? <Box className="flex flex-col items-center justify-center py-20">
                        <Spin size={48} className="text-primary animate-spin mb-4" />
                        <Txt className="mt-4 text-xs font-bold text-gray-400 uppercase tracking-widest">Loading reviews...</Txt>
                    </Box> : reviews.length === 0 ? <Box className="text-center py-20 bg-white rounded-[2rem] border border-dashed border-gray-200 p-8 shadow-sm">
                        <Box className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <I icon={MessageSquare} size={40} className="text-gray-300" />
                        </Box>
                        <Txt className="text-xl font-black text-gray-900 mb-2">No reviews yet</Txt>
                        <Txt className="text-sm text-gray-500 mb-8 max-w-[200px] mx-auto">Share your feedback on your completed orders.</Txt>
                        <Btn onPress={() => navigate('/user/orders')} className="px-8 py-3 bg-primary text-white rounded-full font-bold text-sm shadow-lg active:scale-95 transition-all outline-none">
                            View Completed Orders
                        </Btn>
                    </Box> : <Box className="space-y-4">
                        <Box className="flex items-center justify-between mb-4 px-2">
                            <Txt className="text-xs font-black text-gray-400 uppercase tracking-widest">All Reviews ({reviews.length})</Txt>
                            <Box className="flex items-center gap-1.5 px-3 py-1 bg-primary rounded-full text-white">
                                <I icon={Star} size={12} className="fill-yellow-400 text-yellow-400" />
                                <Txt className="text-[10px] font-black uppercase tracking-tight">
                                    {(reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)} Avg
                                </Txt>
                            </Box>
                        </Box>

                        {reviews.map((review, idx) => <Box key={review._id} className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm relative overflow-hidden">
                                {/* Target Ribbon */}
                                <Box className="absolute top-0 right-0">
                                    <Box className={`px-4 py-1.5 text-[8px] font-black uppercase tracking-widest text-white ${review.targetType === 'Tailor' ? 'bg-primary' : review.targetType === 'DeliveryPartner' ? 'bg-amber-600' : 'bg-blue-600'} rounded-bl-2xl flex items-center gap-2`}>
                                        {review.targetType === 'Tailor' ? <I icon={Calendar} size={10} /> : <I icon={Truck} size={10} />}
                                        {review.targetType}
                                    </Box>
                                </Box>

                                <Box className="flex gap-4">
                                    {/* Rating & Content */}
                                    <Box className="flex-1">
                                        <Box className="flex items-center gap-1 mb-2">
                                            {renderStars(review.rating)}
                                            <Txt className="ml-2 text-[10px] font-black text-gray-400">{review.rating.toFixed(1)}</Txt>
                                        </Box>

                                        <Txt className="text-sm text-gray-800 font-medium leading-relaxed mb-4 italic">
                                            "{review.comment}"
                                        </Txt>

                                        {/* Meta Information */}
                                        <Box className="flex flex-wrap items-center gap-4 border-t border-gray-50 pt-4 mt-2">
                                            <Box className="flex items-center gap-1.5">
                                                <I icon={Calendar} size={12} className="text-gray-400" />
                                                <Txt className="text-[10px] font-black text-gray-400 uppercase">
                                                    {new Date(review.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                                                </Txt>
                                            </Box>

                                            {review.order && <Box className="flex items-center gap-1.5">
                                                    <I icon={Package} size={12} className="text-gray-400" />
                                                    <Txt className="text-[10px] font-mono text-gray-400">#{review.order.orderId}</Txt>
                                                </Box>}
                                        </Box>
                                    </Box>
                                </Box>
                            </Box>)}
                    </Box>}
            </Box>
                    </Scroll>
</Box></Screen>;
};
export default MyReviews;