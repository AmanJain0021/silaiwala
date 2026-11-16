// Port of modules/customer/pages/FabricDetail.jsx (converted with scripts/web2rn.js, then reviewed)
import Spin from '../components/ui/Spin';
import Screen from '../components/common/Screen';
import React, { useState, useEffect } from "react";
import { useParams, useNavigate,  } from '../lib/nav';
import { ArrowLeft, Star, MapPin, ChevronRight, CheckCircle2, ShieldCheck, Tag, Info, Clock, Scissors, Sparkles } from "lucide-react-native";
import useCheckoutStore from "../store/checkoutStore";
import api from "../lib/api";
import SafeImage from "../components/common/SafeImage";
import { Box, Txt, Btn, I, Scroll } from '../components/ui/primitives';
const FabricDetail = () => {
  const {
    id
  } = useParams();
  const navigate = useNavigate();
  const setTailorInStore = useCheckoutStore(state => state.setTailor);
  const [fabric, setFabric] = useState(null);
  const [tailor, setTailor] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // 1. Fetch Fabric Details
        const fabricRes = await api.get(`/products/${id}`);
        const fabricData = fabricRes.data.data;
        setFabric(fabricData);

        // 2. Fetch Tailor Details using the tailor ID from fabric
        if (fabricData?.tailor) {
          const tailorId = typeof fabricData.tailor === 'object' ? fabricData.tailor._id : fabricData.tailor;
          const tailorRes = await api.get(`/tailors/${tailorId}`);
          setTailor(tailorRes.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch fabric detail:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);
  if (isLoading) return <Screen className="bg-gray-50"><Box className="flex-1 flex items-center justify-center bg-gray-50">
            <Spin size={40} className="text-[#843D9B]" />
        </Box></Screen>;
  if (!fabric || !tailor) return <Screen className="bg-white"><Box className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <Txt className="text-xl font-bold text-gray-900">Fabric Not Found</Txt>
            <Btn onPress={() => navigate(-1)} className="mt-4 text-[#843D9B] font-bold">Go Back</Btn>
        </Box></Screen>;
  return <Screen className="bg-[#F7F8FC]"><Box className="flex-1 bg-[#F7F8FC] font-sans overflow-x-hidden">
            {/* Header */}
            <Box className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100 px-4 py-4 pt-safe flex items-center gap-4">
                <Btn onPress={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-800 transition-all active:scale-90">
                    <I icon={ArrowLeft} size={22} />
                </Btn>
                <Box className="flex-1 min-w-0">
                    <Txt className="text-lg font-black text-gray-900 truncate leading-none">Fabric Details</Txt>
                    <Txt className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Stitching Exclusive</Txt>
                </Box>
            </Box>
            <Scroll className="flex-1" contentClassName="pb-32">

            {/* Product Image */}
            <Box className="relative aspect-[4/5] w-full overflow-hidden bg-gray-200">
                <SafeImage src={fabric.images?.[0] || fabric.image} alt={fabric.name} className="w-full h-full object-cover" />
                <Box className="absolute top-4 left-4">
                    <Box className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-gray-100 shadow-xl flex items-center gap-1.5">
                        <I icon={Tag} size={12} className="text-[#843D9B]" />
                        <Txt className="text-[10px] font-black text-[#843D9B] uppercase tracking-wider">{fabric.category?.name || 'Fabric'}</Txt>
                    </Box>
                </Box>
            </Box>

            {/* Info Section */}
            <Box className="relative z-10 -mt-10 px-4">
                <Box className="bg-white rounded-[2.5rem] p-6 shadow-xl border border-gray-100">
                    <Box className="mb-6">
                        <Txt className="text-2xl font-black text-gray-900 tracking-tight mb-2 leading-tight">{fabric.name}</Txt>
                        <Box className="flex items-center gap-4">
                            <Txt className="text-2xl font-black text-[#843D9B]">₹{fabric.price}</Txt>
                            <Box className="h-4 w-px bg-gray-200" />
                            <Box className="flex items-center gap-1.5 text-green-600">
                                <I icon={CheckCircle2} size={16} />
                                <Txt className="text-xs font-black uppercase tracking-widest">{fabric.inStock ? 'In Stock' : 'Out of Stock'}</Txt>
                            </Box>
                        </Box>
                    </Box>

                    {/* Fabric Specifications */}
                    <Box className="grid grid-cols-2 gap-4 mb-8">
                        <Box className="bg-gray-50/50 p-4 rounded-2xl border border-gray-50">
                            <Txt className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block mb-1">Stock Status</Txt>
                            <Txt className="text-sm font-black text-gray-900">{fabric.stock || 0} units</Txt>
                        </Box>
                        <Box className="bg-gray-50/50 p-4 rounded-2xl border border-gray-50">
                            <Txt className="text-[10px] text-gray-400 font-bold uppercase tracking-widest block mb-1">Quality Guaranteed</Txt>
                            <Txt className="text-sm font-black text-gray-900">{fabric.isActive ? 'Verified' : 'Reviewing'}</Txt>
                        </Box>
                    </Box>

                    {/* Delivery Impact */}
                    <Box className="mb-8 p-4 bg-amber-50/50 rounded-2xl border border-amber-100 flex items-start gap-4">
                        <Box className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-amber-600 shadow-sm shrink-0 border border-amber-100">
                            <I icon={Clock} size={20} />
                        </Box>
                        <Box>
                            <Txt className="text-xs font-black text-gray-900 uppercase tracking-widest mb-1">Artisan Availability</Txt>
                            <Txt className="text-[11px] text-amber-700 font-medium leading-relaxed">
                                {fabric.inStock ? "This fabric is currently available in the tailor's store. Ready for immediate stitching selection." : "This fabric is currently out of stock. Contact the tailor for restocking details."}
                            </Txt>
                        </Box>
                    </Box>

                    <Box className="mb-8">
                        <Txt className="text-xs font-black text-gray-900 tracking-widest uppercase mb-3 opacity-40 flex items-center gap-2">
                            <I icon={Info} size={14} /> Artisan's Description
                        </Txt>
                        <Txt className="text-sm text-gray-500 font-medium leading-relaxed">
                            {fabric.description || "No description provided for this premium fabric."}
                        </Txt>
                    </Box>

                    <Box className="h-px bg-gray-100 w-full mb-8" />

                    {/* Tailor Information Section */}
                    <Box>
                        <Txt className="text-xs font-black text-gray-900 tracking-widest uppercase mb-4 opacity-40">Artisan Mastermind</Txt>
                        <Btn onPress={() => navigate(`/user/tailor/${tailor._id}`)} className="flex items-center gap-4 bg-white p-4 rounded-[2.5rem] border-2 border-gray-50 active:scale-95 transition-transform group shadow-sm hover:border-[#843D9B]/10">
                            <Box className="w-16 h-16 rounded-[1.5rem] overflow-hidden border-2 border-white shadow-xl rotate-3 group-hover:rotate-0 transition-all duration-500">
                                <SafeImage src={tailor.user?.profileImage} alt={tailor.shopName} className="w-full h-full object-cover" />
                            </Box>
                            <Box className="flex-1 min-w-0">
                                <Box className="flex items-center gap-1.5 mb-1">
                                    <Txt className="font-black text-gray-900 truncate group-hover:text-[#843D9B] transition-colors">{tailor.shopName || 'Tailor Partner'}</Txt>
                                    <I icon={ShieldCheck} size={14} className="text-[#843D9B]" />
                                </Box>
                                <Box className="flex items-center gap-2">
                                    <Box className="flex items-center gap-1 text-[10px] font-black text-[#843D9B] bg-indigo-50 px-2 py-0.5 rounded-lg border border-[#843D9B]/5">
                                        {tailor.rating} <I icon={Star} size={10} className="fill-current" />
                                    </Box>
                                    <Box className="inline-flex items-center gap-1 text-[9.5px] font-black text-[#843D9B] bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200/60 uppercase tracking-wider whitespace-nowrap">
                                        <I icon={Sparkles} size={10} className="fill-[#843D9B]/40" />
                                        <Txt>Expert Artisan</Txt>
                                    </Box>
                                </Box>
                            </Box>
                            <Box className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-[#843D9B] group-hover:bg-indigo-50 transition-all">
                                <I icon={ChevronRight} size={18} />
                            </Box>
                        </Btn>
                    </Box>
                </Box>
            </Box>

                        </Scroll>
{/* Sticky Action Footer */}
            <Box className="fixed bottom-0 left-0 right-0 p-4 pb-safe bg-white/80 backdrop-blur-xl border-t border-gray-100 z-[40]">
                <Box className="max-w-md mx-auto">
                    <Btn onPress={() => {
          setTailorInStore(tailor._id, tailor.shopName || 'Tailor Partner');
          navigate('/user/services', {
            state: {
              selectedFabric: fabric,
              tailorId: tailor._id,
              tailorName: tailor.shopName || 'Tailor Partner',
              fabricSource: 'platform'
            }
          });
        }} className="w-full bg-[#843D9B] text-white py-4 rounded-2xl shadow-xl shadow-[#843D9B]/30 font-black text-sm active:scale-95 transition-transform flex items-center justify-center gap-2">
                        <I icon={Scissors} size={18} />
                        Book Stitching With This Fabric
                    </Btn>
                    <Txt className="text-[10px] text-gray-400 text-center mt-3 font-bold uppercase tracking-widest">Pricing excludes base stitching charges</Txt>
                </Box>
            </Box>
        </Box></Screen>;
};
export default FabricDetail;
