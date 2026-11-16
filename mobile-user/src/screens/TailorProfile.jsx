// Port of modules/customer/pages/TailorProfile.jsx (converted with scripts/web2rn.js, then reviewed)
import Spin from '../components/ui/Spin';
import Screen from '../components/common/Screen';
import { alert } from '../lib/alert';
import { Linking } from 'react-native';
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from '../lib/nav';
import { ArrowLeft, Star, MapPin, Clock, Award, Phone, ShieldCheck, Heart, Share2, Scissors, ChevronRight, Tag, CheckCircle2, Info, ShoppingBag, Calendar, X, Layers, Wand2, Sparkles } from "lucide-react-native";
import ProductCard from "../components/customer/store/ProductCard";
import useCheckoutStore from "../store/checkoutStore";
import api from "../lib/api";
import SafeImage from "../components/common/SafeImage";
import toast from '../lib/toast';
import { useRequireAuth } from "../hooks/useRequireAuth";
import { Box, Txt, Btn, I, Img, Input, Scroll } from '../components/ui/primitives';
import { Dialog } from '../components/ui/Sheet';
import { DateField, TimeField } from '../components/ui/DateField';
import { shareLink, webUrl } from '../lib/share';
const TailorProfile = () => {
  const {
    id
  } = useParams();
  const navigate = useNavigate();
  const {
    requireAuth
  } = useRequireAuth();
  const setTailorInStore = useCheckoutStore(state => state.setTailor);
  const [tailor, setTailor] = useState(null);
  const [fabrics, setFabrics] = useState([]);
  const [workSamples, setWorkSamples] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);

  // Bridal Booking State
  const [isBridalModalOpen, setIsBridalModalOpen] = useState(false);
  const [bookingData, setBookingData] = useState({
    date: '',
    time: '',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [tailorRes, fabricsRes, samplesRes, servicesRes] = await Promise.all([api.get(`/tailors/${id}`), api.get(`/tailors/${id}/fabrics`), api.get(`/tailors/${id}/work-samples`), api.get(`/tailors/${id}/services`)]);
        setTailor(tailorRes.data.data);
        setFabrics(fabricsRes.data.data);

        // Merge work samples and services for the portfolio view
        const uniqueContent = new Map();

        // Add work samples first
        (samplesRes.data.data || []).forEach(item => {
          uniqueContent.set(item._id, {
            ...item,
            type: 'sample'
          });
        });

        // Add services, mapping basePrice to laborPrice
        (servicesRes.data.data || []).forEach(item => {
          if (!uniqueContent.has(item._id)) {
            uniqueContent.set(item._id, {
              ...item,
              type: 'service',
              isBookable: true,
              laborPrice: item.basePrice
            });
          }
        });
        setWorkSamples(Array.from(uniqueContent.values()));
        setIsLoading(false);
      } catch (error) {
        if (error?.name === 'CanceledError' || error?.message === 'canceled' || error?.message?.includes('Cancelled')) {
          console.log('Tailor fetch canceled, ignoring...');
          return;
        }
        console.error('Failed to fetch tailor data:', error);
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id]);
  const handleBridalSubmit = async e => {
    if (!requireAuth('Please login to book a bridal consultation')) return;
    setIsSubmitting(true);
    try {
      // Note: Sending to the main order checkout endpoint with special flags
      const res = await api.post('/orders', {
        tailorId: tailor._id,
        items: [{
          serviceType: 'bridal-consultation',
          name: 'Bridal Consultation',
          quantity: 1
        }],
        fabricPickupRequired: false,
        isBridalConsultation: true,
        isMeasurementHome: true,
        bridalNotes: bookingData.notes,
        bridalDate: bookingData.date,
        bridalTime: bookingData.time
      });
      if (res.data.success) {
        alert('Bridal Consultation booked successfully!');
        setIsBridalModalOpen(false);
        setBookingData({
          date: '',
          time: '',
          notes: ''
        });
        navigate('/user/orders');
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to submit request');
    } finally {
      setIsSubmitting(false);
    }
  };
  if (isLoading) return <Screen className="bg-gray-50"><Box className="flex-1 flex items-center justify-center bg-gray-50">
        <Spin size={40} className="text-[#843D9B]" />
    </Box></Screen>;
  if (!tailor) return <Screen className="bg-white"><Box className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <Txt className="text-xl font-bold text-gray-900">Tailor Not Found</Txt>
        <Btn onPress={() => navigate(-1)} className="mt-4 text-[#843D9B] font-bold">Go Back</Btn>
    </Box></Screen>;
  const handleShare = async () => {
    await shareLink({ title: tailor.shopName || 'Tailor Partner', text: `Check out ${tailor.shopName || 'Tailor Partner'} on SilaiWala!`, url: webUrl(`/user/tailor/${id}`) });
  };
  const artisanBadge = (tailor?.experienceInYears || 0) >= 15 ? 'Master Craftsman' : (tailor?.experienceInYears || 0) >= 5 ? 'Expert Artisan' : (tailor?.experienceInYears || 0) >= 1 ? 'Skilled Artisan' : 'Verified Partner';
  const finishedOrdersCount = tailor?.ordersCompleted !== undefined && tailor.ordersCompleted > 0 ? `${tailor.ordersCompleted}+` : tailor?.totalReviews > 0 ? `${tailor.totalReviews}+` : '0';
  const experienceText = tailor?.experienceInYears && tailor.experienceInYears > 0 ? `${tailor.experienceInYears}y` : 'New';
  const deliveryTime = tailor?.avgDeliveryDays ? `${tailor.avgDeliveryDays}d` : '3-5d';
  const bioText = tailor?.bio && tailor.bio.trim() !== '' ? tailor.bio : `Custom tailoring specialist at ${tailor?.shopName || 'SilaiWala'}. Specialized in ${tailor?.specializations?.join(', ') || 'quality stitching & alterations'}.`;
  const addressText = tailor?.location?.address || tailor?.address || [tailor?.location?.city, tailor?.location?.state].filter(Boolean).join(', ') || 'Atelier address available upon order';
  const mapQuery = encodeURIComponent(`${tailor?.shopName || ''} ${addressText}`);
  return <Screen className="bg-[#F7F8FC]"><Box className="flex-1 bg-[#F7F8FC] font-sans overflow-x-hidden">
            <Scroll className="flex-1" contentClassName="pb-32">
            {/* 1. Dynamic Header with Parallax-like feel */}
            <Box className="relative h-44 w-full overflow-hidden bg-[#843D9B]">
                <Box className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/10 z-10"></Box>
                <SafeImage src={tailor.user?.profileImage} fallback='https://images.unsplash.com/photo-1556760544-74c6974b89e0?w=800' alt="Cover" className="w-full h-full opacity-60 blur-sm scale-110" />

                <Box className="absolute top-0 left-0 right-0 z-20 p-4 pt-10 sm:pt- safe flex justify-between items-center">
                    <Btn onPress={() => navigate(-1)} className="p-2.5 bg-white/10 backdrop-blur-md rounded-full text-white border border-white/20 active:scale-90 transition-all">
                        <I icon={ArrowLeft} size={20} />
                    </Btn>
                    <Box className="flex gap-2">
                        <Btn onPress={handleShare} className="p-2.5 bg-white/10 backdrop-blur-md rounded-full text-white border border-white/20 active:scale-90 transition-all cursor-pointer z-50">
                            <I icon={Share2} size={18} />
                        </Btn>
                        <Btn onPress={() => setIsFavorite(!isFavorite)} className={`p-2.5 backdrop-blur-md rounded-full border border-white/20 active:scale-90 transition-all ${isFavorite ? 'bg-rose-500 text-white border-rose-500' : 'bg-white/10 text-white'}`}>
                            <I icon={Heart} size={18} className={isFavorite ? 'fill-current' : ''} />
                        </Btn>
                    </Box>
                </Box>
            </Box>

            {/* 2. Overlapping Profile Card */}
            <Box className="relative z-30 -mt-12 px-4">
                <Box className="bg-white rounded-[2.5rem] p-4 sm:p-6 shadow-xl border border-gray-100">
                    <Box className="flex gap-4 items-start">
                        <Box className="relative shrink-0">
                            <Box className="w-20 h-20 rounded-[1.5rem] overflow-hidden border-4 border-white shadow-2xl rotate-2 group">
                                <SafeImage src={tailor.user?.profileImage} alt={tailor.shopName} className="w-full h-full group-hover:scale-110 transition-transform duration-700" />
                            </Box>
                            {tailor.isApproved && <Box className="absolute -bottom-1 -right-1 bg-[#843D9B] p-1.5 rounded-full border-2 border-white shadow-lg ring-4 ring-[#843D9B]/10">
                                    <I icon={ShieldCheck} size={14} className="text-white" />
                                </Box>}
                        </Box>
                        <Box className="pt-2 flex-1">
                            <Box className="flex justify-between items-start">
                                <Txt className="text-2xl font-black text-gray-900 tracking-tight leading-none mb-1">{tailor.shopName || 'Tailor Partner'}</Txt>
                            </Box>
                            <Box className="flex flex-wrap items-center gap-2 mb-3">
                                <Box className="inline-flex items-center gap-1.5 bg-gradient-to-r from-[#843D9B] to-[#9b4cb5] text-white text-[9.5px] font-black px-2.5 py-1 rounded-full tracking-wider uppercase whitespace-nowrap shadow-xs">
                                    <I icon={Sparkles} size={11} className="fill-white/80" />
                                    <Txt>{artisanBadge}</Txt>
                                </Box>
                                <Box className="h-1 w-1 bg-gray-300 rounded-full"></Box>
                                <Txt className="text-[11px] font-bold text-gray-400 uppercase tracking-tight truncate">
                                    {tailor.specializations?.[0] || 'Expert Tailor'}
                                </Txt>
                            </Box>
                            <Box className="flex items-center gap-4 text-xs">
                                <Box className="flex items-center gap-1.5 bg-indigo-50 px-2 py-1 rounded-lg">
                                    <I icon={Star} size={12} className="fill-[#843D9B] text-[#843D9B]" />
                                    <Txt className="font-black text-[#843D9B]">{tailor.rating || 5.0}</Txt>
                                    <Txt className="text-[#843D9B]/40 text-[10px] font-bold">({tailor.totalReviews || 0})</Txt>
                                </Box>
                                <Box className="flex items-center gap-1.5 text-gray-400 font-bold">
                                    <I icon={MapPin} size={12} className="text-[#843D9B]/30" />
                                    <Txt>{tailor.location?.city || 'Near you'}</Txt>
                                </Box>
                            </Box>
                        </Box>
                    </Box>

                    {/* Stats Row */}
                    <Box className="mt-5 grid grid-cols-3 gap-2">
                        <Box className="bg-gray-50/50 p-2.5 rounded-2xl border border-gray-50 text-center">
                            <I icon={Award} size={18} className="mx-auto mb-1 text-[#843D9B]" />
                            <Txt className="block text-xs font-black text-gray-900 leading-none">{experienceText}</Txt>
                            <Txt className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter mt-1 block">Experience</Txt>
                        </Box>
                        <Box className="bg-gray-50/50 p-2.5 rounded-2xl border border-gray-100 text-center">
                            <I icon={CheckCircle2} size={18} className="mx-auto mb-1 text-green-600" />
                            <Txt className="block text-xs font-black text-gray-900 leading-none">{finishedOrdersCount}</Txt>
                            <Txt className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter mt-1 block">Finished</Txt>
                        </Box>
                        <Box className="bg-gray-50/50 p-2.5 rounded-2xl border border-gray-100 text-center">
                            <I icon={Clock} size={18} className="mx-auto mb-1 text-amber-600" />
                            <Txt className="block text-xs font-black text-gray-900 leading-none">{deliveryTime}</Txt>
                            <Txt className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter mt-1 block">Delivery</Txt>
                        </Box>
                    </Box>

                    {/* About Section */}
                    <Box className="mt-4 p-3.5 bg-gray-50/80 rounded-2xl border border-gray-100">
                        <Txt className="text-xs font-black text-gray-900 uppercase tracking-widest mb-1.5 opacity-40">Artisan's Bio</Txt>
                        <Txt className="text-[11px] text-gray-500 leading-relaxed font-medium">
                            {bioText}
                        </Txt>
                    </Box>

                    {/* Location Sneak Peek */}
                    <Box className="mt-4">
                        <Txt className="text-xs font-black text-gray-900 uppercase tracking-widest mb-2 opacity-40 px-1">Artisan's Atelier</Txt>
                        <Btn onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${mapQuery}`)} className="block bg-gray-100 h-24 rounded-2xl relative overflow-hidden active:scale-[0.99] transition-transform group cursor-pointer">
                            <Img src="https://images.unsplash.com/photo-1524613032530-449a5d94c285?w=600" className="w-full h-full object-cover blur-[1px] grayscale-[0.5] group-hover:scale-105 transition-transform" alt="Map" />
                            <Box className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                <Box className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl border border-white shadow-xl flex items-center gap-2">
                                    <I icon={MapPin} size={14} className="text-rose-600" />
                                    <Txt className="text-[10px] font-black text-gray-800 uppercase tracking-widest">Open in Maps</Txt>
                                </Box>
                            </Box>
                        </Btn>
                        <Txt className="text-[10px] text-gray-400 font-bold mt-2 px-1 flex items-center gap-1">
                            <I icon={Info} size={10} /> {addressText}
                        </Txt>
                    </Box>

                    {/* Bridal Consultation Button */}
                    <Box className="mt-5">
                        <Btn onPress={() => setIsBridalModalOpen(true)} className="w-full py-3.5 bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-100 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform">
                            <I icon={Heart} size={16} className="text-rose-500 fill-rose-500" />
                            <Txt className="text-xs font-black text-rose-600 uppercase tracking-widest">Book Bridal Consultation</Txt>
                        </Btn>
                    </Box>
                </Box>
            </Box>

            {/* 3. Shop Fabrics (High Impact) */}
            {fabrics && fabrics.length > 0 && <Box className="mt-6 px-4">
                    <Box className="flex justify-between items-center mb-4 px-2">
                        <Box>
                            <Txt className="text-xl font-black text-gray-900 tracking-tight">Artisan's Collection</Txt>
                            <Txt className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Exclusive fabrics available in-store</Txt>
                        </Box>
                        <Box className="p-2.5 bg-[#843D9B]/5 rounded-2xl border border-[#843D9B]/5">
                            <I icon={Tag} size={18} className="text-[#843D9B]" />
                        </Box>
                    </Box>

                    <Scroll contentClassName="flex gap-4 overflow-x-auto pb-4 -mx-4 px-4 no-scrollbar snap-x" horizontal>
                        {fabrics.map((fabric, idx) => <Box key={fabric._id} className="snap-start flex-shrink-0 w-52">
                                <Btn onPress={() => {
            setTailorInStore(tailor._id, tailor.shopName || 'Tailor Partner');
            navigate(`/user/fabric/${fabric._id}`);
          }} className="block bg-white rounded-[2.5rem] p-3 shadow-md border border-gray-100 group cursor-pointer hover:shadow-xl transition-all duration-500 overflow-hidden">
                                    <Box className="aspect-[3/4] rounded-[2rem] overflow-hidden mb-3 relative shadow-inner">
                                        <SafeImage src={fabric.images?.[0] || fabric.image} alt={fabric.name} className="w-full h-full group-hover:scale-110 transition-transform duration-1000" />
                                        <Box className="absolute top-3 left-3">
                                            <Box className="bg-white/90 backdrop-blur-md px-2 py-1 rounded-lg border border-white shadow-sm">
                                                <Txt className="text-[8px] font-black text-[#843D9B] uppercase">{fabric.category?.name || 'Fabric'}</Txt>
                                            </Box>
                                        </Box>
                                    </Box>
                                    <Box className="px-2">
                                        <Txt className="text-[13px] font-black text-gray-800 truncate mb-1">{fabric.name}</Txt>
                                        <Box className="flex justify-between items-center">
                                            <Box className="flex flex-col">
                                                <Txt className="text-sm font-black text-[#843D9B]">₹{fabric.price}</Txt>
                                                <Txt className="text-[9px] text-gray-400 font-bold uppercase">Incl. Taxes</Txt>
                                            </Box>
                                            <Box className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-[#843D9B] shadow-sm transform group-hover:rotate-12 transition-transform">
                                                <I icon={Scissors} size={14} />
                                            </Box>
                                        </Box>
                                    </Box>
                                </Btn>
                            </Box>)}
                    </Scroll>
                </Box>}

            {/* 4. Portfolio / Designs */}
            <Box className="mt-6 px-4">
                <Box className="flex justify-between items-center mb-4 px-2">
                    <Box>
                        <Txt className="text-xl font-black text-gray-900 tracking-tight">Signature Designs</Txt>
                        <Txt className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Inspired by traditional masteries</Txt>
                    </Box>
                </Box>
                <Box className="grid grid-cols-2 gap-4">
                    {workSamples.length > 0 ? workSamples.map((sample, idx) => <Box key={sample._id}>
                            <Btn onPress={() => {
            if (sample.type === 'service') {
              setTailorInStore(tailor._id, tailor.shopName || 'Tailor Partner');
              navigate(`/user/services/${sample._id}`, {
                state: {
                  tailorId: tailor._id
                }
              });
            }
          }} className="block bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 group cursor-pointer hover:shadow-md transition-all duration-300">
                                <Box className="aspect-[4/5] overflow-hidden">
                                    <SafeImage src={sample.image} alt={sample.title} className="w-full h-full group-hover:scale-105 transition-transform duration-700" />
                                </Box>
                                <Box className="p-3">
                                    <Txt className="text-xs font-black text-gray-900 truncate">{sample.title}</Txt>
                                    <Box className="flex items-center justify-between mt-1">
                                        <Txt className="text-[9px] text-gray-400 font-bold uppercase">{sample.category?.name || 'Design'}</Txt>
                                        <Txt className="text-[10px] font-black text-[#843D9B]">₹{sample.laborPrice || sample.basePrice}</Txt>
                                    </Box>
                                    <Box className="flex items-center justify-between mt-2">
                                        <Box className="flex flex-wrap gap-1">
                                            {sample.tags && sample.tags.slice(0, 2).map((tag, i) => <Txt key={i} className="px-1.5 py-0.5 bg-[#843D9B]/5 text-[#843D9B] text-[7px] font-black rounded-md uppercase tracking-tighter">
                                                    #{tag}
                                                </Txt>)}
                                        </Box>
                                        {sample.isBookable && <Txt className="text-[7px] font-black bg-green-100 text-green-700 px-1.5 py-0.5 rounded-md uppercase tracking-tighter">Bookable</Txt>}
                                    </Box>
                                </Box>
                            </Btn>
                        </Box>) : <Box className="col-span-2 py-10 text-center opacity-40">
                            <Txt className="text-xs font-bold uppercase tracking-widest">No signature designs yet</Txt>
                        </Box>}
                </Box>
            </Box>

                        </Scroll>
{/* Sticky Action Footer - DUAL ACTION */}
            <Box className="fixed bottom-0 left-0 right-0 p-4 pb-10 sm:pb-6 bg-white/80 backdrop-blur-2xl border-t border-gray-100 z-[40] animate-in slide-in-from-bottom">
                <Box className="max-w-md mx-auto flex gap-3">
                    <Btn onPress={() => {
          setTailorInStore(tailor._id, tailor.shopName || 'Tailor Partner');
          navigate('/user/services', {
            state: {
              tailorId: tailor._id,
              tailorName: tailor.shopName || 'Tailor Partner'
            }
          });
        }} className="flex-1 bg-white border-2 border-[#843D9B] text-[#843D9B] py-3 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 shadow-sm hover:bg-[#843D9B]/5 cursor-pointer">
                        <I icon={Layers} size={16} />
                        <Txt>More Services</Txt>
                    </Btn>
                    <Btn onPress={() => {
          setTailorInStore(tailor._id, tailor.shopName || 'Tailor Partner');
          navigate('/user/custom-design', {
            state: {
              tailorId: tailor._id,
              tailorName: tailor.shopName || 'Tailor Partner'
            }
          });
        }} className="flex-1 bg-[#843D9B] hover:bg-[#6B2F7E] text-white py-3 rounded-2xl shadow-lg shadow-[#843D9B]/20 font-black text-xs uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer">
                        <I icon={Wand2} size={16} />
                        <Txt>Custom Order</Txt>
                    </Btn>
                </Box>
            </Box>

            {/* Bridal Booking Modal */}
            <Dialog visible={isBridalModalOpen} onClose={() => setIsBridalModalOpen(false)} containerClassName="px-4" backdropClassName="bg-black/40" className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl">
                        <Scroll contentClassName="p-6">
                            <Btn onPress={() => setIsBridalModalOpen(false)} className="absolute right-4 top-4 p-2 bg-gray-50 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
                                <I icon={X} size={16} />
                            </Btn>

                            <Box className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center mb-4">
                                <I icon={Heart} size={24} className="fill-rose-500" />
                            </Box>

                            <Txt className="text-xl font-black text-gray-900 mb-1">Bridal Consultation</Txt>
                            <Txt className="text-xs text-gray-500 mb-6 leading-relaxed">
                                Book an exclusive in-person bridal fitting. {tailor.shopName || 'Tailor Partner'} will travel to your location to take measurements.
                            </Txt>

                            <Box className="space-y-4">
                                <Box>
                                    <Txt className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Preferred Date</Txt>
                                    <Box className="relative">
                                        <I icon={Calendar} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" size={16} />
                                        <DateField className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm" min={new Date()} value={bookingData.date} onChange={e => setBookingData({ ...bookingData, date: e })} />
                                    </Box>
                                </Box>

                                <Box>
                                    <Txt className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Preferred Time</Txt>
                                    <Box className="relative">
                                        <I icon={Clock} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" size={16} />
                                        <TimeField className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl text-sm" value={bookingData.time} onChange={e => setBookingData({ ...bookingData, time: e })} />
                                    </Box>
                                </Box>

                                <Box>
                                    <Txt className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Requirements Note</Txt>
                                    <Input placeholder="Specific requests, dress type, etc." rows="2" className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs focus:bg-white focus:border-rose-300 focus:ring-1 focus:ring-rose-300/20 transition-all outline-none resize-none" value={bookingData.notes} onChangeText={e => setBookingData({
                ...bookingData,
                notes: e
              })} multiline></Input>
                                </Box>

                                <Btn onPress={handleBridalSubmit} disabled={isSubmitting} className="w-full py-4 rounded-xl bg-gradient-to-r from-rose-500 to-pink-600 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-rose-500/20 hover:shadow-rose-500/40 active:scale-[0.98] transition-all disabled:opacity-70 mt-2">
                                    {isSubmitting ? 'Booking...' : 'Book Consultation'}
                                </Btn>
                            </Box>
                        </Scroll>
            </Dialog>
        </Box></Screen>;
};
export default TailorProfile;
