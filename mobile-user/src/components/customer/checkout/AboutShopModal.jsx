// Port of modules/customer/components/checkout/summary/AboutShopModal.jsx (converted with scripts/web2rn.js, then reviewed)
import { Dialog, Sheet } from '../../../components/ui/Sheet';
import React from "react";
import { X, Star, MapPin, Award, CheckCircle2, ChevronRight, Scissors, Phone, Clock } from "lucide-react-native";
import { useNavigate } from '../../../lib/nav';
import SafeImage from "../../common/SafeImage";
import { Box, Btn, Txt, I, Scroll } from '../../ui/primitives';
const AboutShopModal = ({
  isOpen,
  onClose,
  tailor,
  tailorId
}) => {
  const navigate = useNavigate();
    const resolvedId = tailor?._id || tailor?.id || tailor?.user?._id || tailorId;
  const shopName = tailor?.shopName || 'Expert Tailor Shop';
  const profileImage = tailor?.user?.profileImage || tailor?.profileImage;
  const rating = tailor?.rating || 4.8;
  const totalReviews = tailor?.totalReviews || 320;
  const experience = tailor?.experienceInYears ? `${tailor.experienceInYears}+ Years Exp.` : '8+ Years Exp.';
  const bio = tailor?.bio || 'Dedicated to crafting high-quality bespoke garments, custom bridal fits, and fine alterations with master level precision.';
  const specializations = tailor?.specializations && tailor.specializations.length > 0 ? tailor.specializations : ['Custom Fit', 'Bridal Suits', 'Designer Stitching', 'Express Alterations'];
  const address = tailor?.location?.address || tailor?.location?.city ? `${tailor?.location?.address || ''} ${tailor?.location?.city || ''}`.trim() : 'Available in Your Area';
  return <Dialog visible={!!(isOpen)} onClose={onClose} className={`bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden relative border border-gray-100`}>
<Box className="flex-shrink flex flex-col overflow-hidden">
                {/* Header Banner */}
                <Box className="h-28 bg-gradient-to-r from-[#843D9B] via-[#6d2f83] to-[#552069] relative p-4 flex justify-between items-start">
                    <Txt className="text-[10px] font-black text-white/80 uppercase tracking-widest bg-white/10 px-2.5 py-1 rounded-full border border-white/20">
                        Shop Profile
                    </Txt>
                    <Btn onPress={onClose} className="p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-colors backdrop-blur-md">
                        <I icon={X} size={16} />
                    </Btn>
                </Box>

                {/* Avatar & Main Info */}
                <Box className="px-6 pb-6 pt-0 relative">
                    <Box className="flex justify-between items-end -mt-12 mb-4">
                        <Box className="relative">
                            <SafeImage src={profileImage} alt={shopName} className="w-22 h-22 w-20 h-20 rounded-2xl border-4 border-white shadow-xl object-cover bg-purple-50" />
                            <Box className="absolute -bottom-1 -right-1 bg-green-500 text-white p-1 rounded-full border-2 border-white shadow">
                                <I icon={CheckCircle2} size={12} />
                            </Box>
                        </Box>

                        <Box className="flex gap-2">
                            <Txt className="inline-flex items-center gap-1 bg-purple-50 border border-purple-100 text-[#843D9B] px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider">
                                <I icon={CheckCircle2} size={12} className="fill-[#843D9B] text-white" />
                                Verified
                            </Txt>
                        </Box>
                    </Box>

                    <Box className="space-y-1">
                        <Txt className="text-xl font-black text-gray-900 leading-tight">{shopName}</Txt>
                        <Txt className="text-xs text-gray-500 font-medium flex items-center gap-1">
                            <I icon={Scissors} size={12} className="text-[#843D9B]" /> {shopName}
                        </Txt>
                    </Box>

                    {/* Stats Grid */}
                    <Box className="grid grid-cols-2 gap-3 my-4 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                        <Box className="flex items-center gap-2.5">
                            <Box className="w-8 h-8 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center font-bold shrink-0 border border-amber-100">
                                <I icon={Star} size={16} className="fill-amber-400 text-amber-400" />
                            </Box>
                            <Box>
                                <Txt className="text-xs font-black text-gray-900">{rating} <Txt className="text-[10px] text-gray-400 font-normal">({totalReviews})</Txt></Txt>
                                <Txt className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Rating</Txt>
                            </Box>
                        </Box>

                        <Box className="flex items-center gap-2.5 border-l border-gray-200 pl-3">
                            <Box className="w-8 h-8 rounded-xl bg-purple-50 text-[#843D9B] flex items-center justify-center font-bold shrink-0 border border-purple-100">
                                <I icon={Award} size={16} />
                            </Box>
                            <Box>
                                <Txt className="text-xs font-black text-gray-900">{experience}</Txt>
                                <Txt className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">Experience</Txt>
                            </Box>
                        </Box>
                    </Box>

                    {/* About Description */}
                    <Box className="space-y-2 mb-4">
                        <Txt className="text-xs font-black text-gray-900 uppercase tracking-widest">About Shop</Txt>
                        <Txt className="text-xs text-gray-600 leading-relaxed font-normal bg-purple-50/50 p-3 rounded-xl border border-purple-100/50">
                            {bio}
                        </Txt>
                    </Box>

                    {/* Specializations */}
                    <Box className="space-y-2 mb-5">
                        <Txt className="text-xs font-black text-gray-900 uppercase tracking-widest">Specializations</Txt>
                        <Box className="flex flex-wrap gap-1.5">
                            {specializations.map((spec, i) => <Txt key={i} className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg text-[10px] font-bold border border-gray-200/60">
                                    ✨ {spec}
                                </Txt>)}
                        </Box>
                    </Box>

                    {/* Location */}
                    {address && <Box className="flex items-start gap-2 text-xs text-gray-500 mb-5 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                            <I icon={MapPin} size={14} className="text-[#843D9B] shrink-0 mt-0.5" />
                            <Txt className="line-clamp-2">{address}</Txt>
                        </Box>}

                    {/* Actions */}
                    <Box className="flex gap-2 pt-2 border-t border-gray-100">
                        {resolvedId && <Btn onPress={() => {
            onClose();
            navigate(`/user/tailor/${resolvedId}`);
          }} className="flex-1 py-3 bg-[#843D9B] hover:bg-[#723287] active:scale-[0.98] text-white rounded-2xl text-xs font-black tracking-wider uppercase shadow-lg shadow-[#843D9B]/25 transition-all flex items-center justify-center gap-1.5">
                                Visit Full Shop Profile <I icon={ChevronRight} size={14} />
                            </Btn>}
                        <Btn onPress={onClose} className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-2xl text-xs font-bold transition-all">
                            Close
                        </Btn>
                    </Box>
                </Box>
            </Box>
</Dialog>;
};
export default AboutShopModal;