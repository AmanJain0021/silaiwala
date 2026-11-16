// Port of modules/customer/components/checkout/summary/ServiceReviewCard.jsx (converted with scripts/web2rn.js, then reviewed)
import { Linking } from 'react-native';
import { getImageUrl } from '../../../utils/imageUrl';
import React, { useState, useEffect } from "react";
import { Calendar, Ruler, Scissors, Shirt, X, Star, CheckCircle2, ChevronRight, User, BadgeCheck } from "lucide-react-native";
import { useNavigate } from '../../../lib/nav';
import api from "../../../lib/api";
import SafeImage from "../../common/SafeImage";
import AboutShopModal from "./AboutShopModal";
import { Box, Btn, I, Txt, Img, Scroll } from '../../ui/primitives';
const openImage = (src) => { const u = getImageUrl(src); if (/^https?:/.test(u)) Linking.openURL(u); };
const ServiceReviewCard = ({
  service,
  config,
  pricing,
  onRemove
}) => {
  const navigate = useNavigate();
  const [tailorData, setTailorData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const tailorId = service?.tailorId || (typeof service?.tailor === 'object' ? service?.tailor?._id || service?.tailor?.id : service?.tailor);
  useEffect(() => {
    if (!tailorId) return;
    let isMounted = true;
    const fetchTailorInfo = async () => {
      try {
        const res = await api.get(`/tailors/${tailorId}`);
        if (res.data.success && isMounted) {
          setTailorData(res.data.data);
        }
      } catch (err) {
        if (err?.name !== 'CanceledError' && err?.code !== 'ERR_CANCELED') {
          console.log('Tailor info fetch notice:', err?.message || err);
        }
      }
    };
    fetchTailorInfo();
    return () => {
      isMounted = false;
    };
  }, [tailorId]);
  if (!service) return null;
  const deliveryDate = new Date();
  const deliveryDays = config?.deliveryType === 'express' ? 7 : 14;
  deliveryDate.setDate(deliveryDate.getDate() + deliveryDays);
  const dateString = deliveryDate.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });

  // Derive Tailor Profile Info (shop name only — privacy)
  const shopName = tailorData?.shopName || service.tailorName || 'Tailor Partner';
  const avatarImg = tailorData?.user?.profileImage || 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=256&auto=format&fit=crop';
  const rating = tailorData?.rating || 4.8;
  const totalReviews = tailorData?.totalReviews || 320;
  const experienceText = tailorData?.experienceInYears ? `${tailorData.experienceInYears}+ Years Exp.` : '8+ Years Exp.';
  const isHomeVisitSelected = Boolean(config?.isTailorAtHome || config?.measurements?.option === 'visit' || pricing?.tailorAtHome && pricing.tailorAtHome > 0);
  return <Box className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-100 shadow-xs mb-4 relative overflow-hidden">
            {onRemove && <Btn onPress={e => {
      onRemove();
    }} className="absolute top-3 right-3 p-1.5 bg-red-50 text-red-500 rounded-full hover:bg-red-100 transition-colors z-10 cursor-pointer">
                    <I icon={X} size={14} />
                </Btn>}

            {/* Section Title & Price */}
            {(() => {
      const garmentPrice = (Number(pricing?.base) || 0) + (Number(pricing?.addons) || 0) + (Number(pricing?.fabric) || 0) + (Number(pricing?.customizations) || 0);
      const displayGarmentPrice = garmentPrice > 0 ? garmentPrice : Number(pricing?.total) || 0;
      return <Box className="flex items-center justify-between mb-3.5 pr-6">
                        <Txt className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-1.5">
                            <I icon={Shirt} size={16} className="text-[#843D9B]" />
                            <Txt>Service & Details</Txt>
                        </Txt>
                        <Txt className="text-sm sm:text-base font-extrabold text-slate-900">
                            ₹{Math.round(displayGarmentPrice).toLocaleString('en-IN')}
                        </Txt>
                    </Box>;
    })()}

            {/* Main Item Layout */}
            <Box className="flex flex-col sm:flex-row items-start justify-between gap-3.5">
                
                {/* Left Side: Thumbnail & Service Details */}
                <Box className="flex-1 flex gap-3 items-start min-w-0">
                    <Img src={service.image} alt={service.title} className="w-20 h-24 sm:w-24 sm:h-28 object-cover rounded-2xl border border-slate-100 shrink-0 shadow-2xs" />

                    <Box className="flex-1 space-y-1 min-w-0 text-left">
                        <Txt className="text-xs sm:text-sm font-extrabold text-slate-900 leading-snug">
                            {service.title}
                        </Txt>

                        {/* Attribute Badges */}
                        <Box className="flex flex-wrap gap-1 pt-0.5">
                            <Box className="flex items-center gap-1 text-[10px] font-semibold text-[#843D9B] bg-[#FAF5FF] px-2 py-0.5 rounded-full border border-purple-100/80">
                                <I icon={Scissors} size={10} />
                                <Txt>{config?.fabricSource === 'customer' ? 'Your Fabric' : 'Fabric Provided'}</Txt>
                            </Box>
                            <Box className="flex items-center gap-1 text-[10px] font-semibold text-[#843D9B] bg-[#FAF5FF] px-2 py-0.5 rounded-full border border-purple-100/80">
                                <I icon={Ruler} size={10} />
                                <Txt>
                                    {isHomeVisitSelected ? 'Executive Visit' : config?.measurements?.type === 'slip' ? 'Slip Upload' : config?.measurements?.type === 'sample' ? 'Sample Garment' : config?.measurements?.type === 'saved' ? 'Saved Profile' : 'Self Measured'}
                                </Txt>
                            </Box>
                        </Box>

                        {/* Per-item measurement snapshot (multi-garment orders) */}
                        {!isHomeVisitSelected && config?.measurements && <Box className="mt-1.5 w-full rounded-xl border border-slate-100 bg-slate-50/80 px-2.5 py-2">
                                <Txt className="text-[9px] font-black uppercase tracking-wider text-slate-400 mb-1">
                                    Measurements for this garment
                                </Txt>
                                {config.measurements.type === 'slip' && (config.measurements.slipImage || config.measurements.image) ? <Txt className="text-[10px] font-semibold text-slate-600">Measurement slip attached</Txt> : config.measurements.type === 'sample' ? <Txt className="text-[10px] font-semibold text-slate-600">Sample garment pickup</Txt> : <Box className="flex flex-wrap gap-1">
                                        {Object.entries(config.measurements).filter(([key, val]) => !['type', 'notes', 'slipImage', 'image', 'url', 'slipUrl', 'file', 'isConfirmed', 'saveProfile', 'sampleGarment', 'slipAttached', 'data'].includes(key) && val !== '' && val != null && typeof val !== 'object').slice(0, 6).map(([key, val]) => <Txt key={key} className="text-[9px] font-bold text-slate-700 bg-white border border-slate-100 px-1.5 py-0.5 rounded-md">
                                                    {key}: {val}
                                                </Txt>)}
                                        {Object.entries(config.measurements).filter(([key, val]) => !['type', 'notes', 'slipImage', 'image', 'url', 'slipUrl', 'file', 'isConfirmed', 'saveProfile', 'sampleGarment', 'slipAttached', 'data'].includes(key) && val !== '' && val != null && typeof val !== 'object').length === 0 && <Txt className="text-[10px] font-semibold text-slate-500">Custom fit details saved</Txt>}
                                    </Box>}
                            </Box>}
                        {isHomeVisitSelected && <Txt className="mt-1.5 text-[9px] font-semibold text-sky-700 bg-sky-50 border border-sky-100 rounded-lg px-2 py-1">
                                Home visit: executive will take measurements for this order (shared visit if multiple garments).
                            </Txt>}

                        {/* Selected Style / Custom Reference Design */}
                        {config?.selectedStyle && <Box className="flex items-center gap-2 mt-2 p-2 bg-purple-50/70 border border-purple-100 rounded-xl">
                                {config.selectedStyle.image && <Btn onPress={() => openImage(config.selectedStyle.image)} className="block shrink-0 self-start"><Img src={config.selectedStyle.image} alt="Style" className="w-10 h-10 rounded-lg object-cover border border-purple-200 shrink-0 cursor-pointer shadow-2xs" /></Btn>}
                                <Box className="text-left min-w-0 flex-1">
                                    <Txt className="text-[11px] font-bold text-slate-900 truncate">{config.selectedStyle.name || 'Custom Style'}</Txt>
                                    <Txt className="text-[9px] text-primary font-bold uppercase">{config.selectedStyle.isCustom ? '📸 Custom Reference Photo' : '✂️ Selected Variant'}</Txt>
                                </Box>
                            </Box>}

                        {/* Style Addons */}
                        {(() => {
            const addonsList = Array.isArray(config?.addons) && config.addons.length > 0 ? config.addons : Array.isArray(config?.styleAddons) ? config.styleAddons : [];
            if (!addonsList.length) return null;
            return <Box className="flex flex-col gap-1.5 mt-2 p-2.5 bg-indigo-50/60 border border-indigo-100 rounded-xl">
                                    <Txt className="text-[10px] font-black uppercase text-indigo-700 tracking-wider flex items-center gap-1">
                                        ✨ Style Add-ons ({addonsList.length})
                                    </Txt>
                                    {addonsList.map((addon, aIdx) => <Box key={addon._id || aIdx} className="flex justify-between items-center text-[11px] font-bold text-slate-700">
                                            <Txt className="truncate pr-2">• {addon.name || addon.title}</Txt>
                                            <Txt className="text-[#843D9B] shrink-0 font-black">+₹{Number(addon.price || 0)}</Txt>
                                        </Box>)}
                                </Box>;
          })()}

                        {/* Customizations */}
                        {(() => {
            const custs = config?.customizations || {};
            const activeCusts = Object.entries(custs).filter(([_, val]) => val && val.enabled !== false && (val.name || val.refImage || Number(val.price) > 0));
            if (activeCusts.length === 0) return null;
            const slotLabels = {
              neck: 'Neck Design',
              sleeve: 'Sleeve Style',
              bottom: 'Bottom Style',
              embroidery: 'Embroidery Work',
              lacePiping: 'Lace / Piping',
              lining: 'Inner Lining',
              other: 'Customization'
            };
            return <Box className="flex flex-col gap-2 mt-2 p-2.5 bg-purple-50/70 border border-purple-100 rounded-xl">
                                    <Txt className="text-[10px] font-black uppercase text-[#843D9B] tracking-wider flex items-center gap-1">
                                        <I icon={Scissors} size={12} /> Customizations ({activeCusts.length})
                                    </Txt>
                                    <Box className="space-y-1.5">
                                        {activeCusts.map(([key, val]) => <Box key={key} className="flex flex-col gap-1 p-1.5 bg-white rounded-lg border border-purple-100/60">
                                                <Box className="flex justify-between items-center text-[11px] font-bold text-slate-700">
                                                    <Txt className="text-slate-500 uppercase text-[9px] font-black">{slotLabels[key] || key}: <Txt className="text-slate-900 font-bold capitalize">{val.name || 'Custom Spec'}</Txt></Txt>
                                                    {Number(val.price) > 0 && <Txt className="text-[#843D9B] font-black text-xs shrink-0">+₹{val.price}</Txt>}
                                                </Box>
                                                {val.notes && <Box className="text-[10px] text-amber-900 bg-amber-50/90 border border-amber-200/60 rounded px-1.5 py-0.5">
                                                        <Txt className="font-bold text-amber-700">📌 Note: </Txt>
                                                        <Txt>{val.notes}</Txt>
                                                    </Box>}
                                                {val.refImage && <Btn onPress={() => openImage(val.refImage)} className="block shrink-0 self-start"><Img src={val.refImage} alt={val.name || key} className="h-14 w-auto self-start rounded-md object-cover border border-purple-100 cursor-pointer" /></Btn>}
                                            </Box>)}
                                    </Box>
                                </Box>;
          })()}

                        {/* Delivery Estimated Chip */}
                        <Box className="flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-[#047857] bg-[#ECFDF5] px-2 py-0.5 rounded-md border border-[#A7F3D0] w-fit mt-1">
                            <I icon={Calendar} size={11} />
                            <Txt>Delivery by {dateString}</Txt>
                        </Box>

                        {/* Tagline: Measurement Executive or Boutique Tailor */}
                        <Box className="pt-0.5 flex items-center gap-1 text-[10px] sm:text-[11px] text-[#843D9B] font-extrabold uppercase tracking-wide">
                            {isHomeVisitSelected ? <>
                                    <I icon={Ruler} size={10} />
                                    <Txt>MEASUREMENT EXECUTIVE AT HOME</Txt>
                                </> : <>
                                    <I icon={Scissors} size={10} />
                                    <Txt>TAILORED BY: {shopName}</Txt>
                                </>}
                        </Box>
                    </Box>
                </Box>

                {/* Right Side: Tailor Profile Card or Measurement Executive Badge */}
                {!isHomeVisitSelected ? <Box className="flex flex-col items-start sm:items-end gap-2 shrink-0 pt-1 sm:pt-0">
                        <Box className="flex items-center gap-2 bg-[#F8FAFC] p-2 rounded-2xl border border-slate-100 min-w-[155px]">
                            <SafeImage src={avatarImg} alt={shopName} className="w-9 h-9 rounded-full object-cover border-2 border-purple-200 shadow-2xs bg-purple-100 shrink-0" fallback='https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=256&auto=format&fit=crop' />

                            <Box className="text-left space-y-0.5 min-w-0">
                                <Box className="flex items-center gap-1">
                                    <Txt className="text-[11px] font-bold text-slate-900 truncate">{shopName}</Txt>
                                    <Txt className="bg-[#843D9B] text-white text-[8px] font-bold uppercase px-1.5 py-0.2 rounded-full">
                                        VERIFIED
                                    </Txt>
                                </Box>

                                <Box className="flex items-center gap-1 text-[10px] font-semibold text-slate-700">
                                    <I icon={Star} size={10} className="fill-amber-400 text-amber-400" />
                                    <Txt>{rating}</Txt>
                                    <Txt className="text-slate-400">({totalReviews})</Txt>
                                </Box>

                                <Txt className="text-[8px] text-slate-500 font-medium">{experienceText}</Txt>
                            </Box>
                        </Box>

                        {/* View Profile Action Button */}
                        <Btn onPress={() => setIsModalOpen(true)} className="w-full py-1 px-3 bg-white border border-slate-200 hover:border-[#843D9B] hover:bg-purple-50/50 text-slate-800 hover:text-[#843D9B] rounded-full text-[11px] font-bold transition-all flex items-center justify-center gap-1 shadow-2xs group cursor-pointer">
                            <Txt>View Profile</Txt>
                            <I icon={ChevronRight} size={12} className="group-hover:translate-x-0.5 transition-transform" />
                        </Btn>
                    </Box> : <Box className="flex flex-col items-start sm:items-end gap-1.5 shrink-0 pt-1 sm:pt-0">
                        <Box className="flex items-center gap-2 bg-[#FAF5FF] p-2.5 rounded-2xl border border-purple-100 min-w-[155px]">
                            <Box className="w-8 h-8 rounded-full bg-purple-100 text-[#843D9B] flex items-center justify-center font-bold text-xs shrink-0">
                                📏
                            </Box>
                            <Box className="text-left space-y-0.5">
                                <Box className="flex items-center gap-1">
                                    <Txt className="text-[11px] font-bold text-slate-900">Home Visit</Txt>
                                    <Txt className="bg-[#843D9B] text-white text-[8px] font-bold uppercase px-1.5 py-0.2 rounded-full">
                                        Executive
                                    </Txt>
                                </Box>
                                <Txt className="text-[9px] text-primary font-semibold">Verified Professional</Txt>
                            </Box>
                        </Box>
                    </Box>}
            </Box>

            {/* Bottom Row: Measurement Executive Visit Status */}
            {isHomeVisitSelected && <Box className="pt-2.5 mt-2.5 border-t border-purple-100 flex items-center justify-between text-xs font-semibold text-slate-600">
                    <Txt className="flex items-center gap-1.5 text-[#843D9B] font-bold">
                        <I icon={Ruler} size={13} className="text-[#843D9B]" /> Measurement Executive Visit
                    </Txt>
                    <Txt className="text-[10px] font-bold text-[#843D9B] bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-100">
                        Shared for this Order
                    </Txt>
                </Box>}

            {/* Instructions if any */}
            {config?.instructions && typeof config.instructions === 'string' && <Box className="mt-3 p-2.5 bg-amber-50 rounded-xl border border-amber-100 text-xs text-amber-900 italic">
                    Note: "{config.instructions}"
                </Box>}

            {/* About Shop Modal Popup */}
            <AboutShopModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} tailor={tailorData} tailorId={tailorId} />
        </Box>;
};
export default ServiceReviewCard;
