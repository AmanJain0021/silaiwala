// Port of modules/customer/components/service-detail/MeasurementGuideModal.jsx (converted with scripts/web2rn.js, then reviewed)
import React, { useState } from "react";
import { ArrowLeft, Play, Ruler, ShieldCheck, RotateCcw, CheckCircle2, Video, MessageSquare, Home, X, Plus, Sparkles, User, Camera, Lightbulb, Info, Check } from "lucide-react-native";
import api from "../../../lib/api";
import useBrandingStore from "../../../store/brandingStore";
import { openAdminWhatsApp } from "../../../utils/whatsapp";
import { Box, Btn, I, Txt, Img, Scroll } from '../../ui/primitives';
import { WebView } from 'react-native-webview';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEvent } from 'expo';
import { Dialog } from '../../ui/Sheet';

// CSS background-size/position crop (e.g. size "280%", position "center 33%") of a square model photo
const CropThumb = ({ src, size, position, w, h }) => {
  const scale = parseFloat(size) / 100;
  const imgW = w * scale;
  const imgH = imgW; // source photos are square (1024x1024)
  const [px, py] = String(position).split(' ').map((v) => (v === 'center' ? 50 : parseFloat(v)));
  const left = (w - imgW) * (px / 100);
  const top = (h - imgH) * (py / 100);
  return <Img src={src} style={{ position: 'absolute', width: imgW, height: imgH, left, top }} contentFit="cover" />;
};

const GuideVideo = ({ uri, onError }) => {
  const player = useVideoPlayer(uri, (p) => { p.muted = true; p.play(); });
  const { status } = useEvent(player, 'statusChange', { status: player.status });
  React.useEffect(() => { if (status === 'error') onError?.(); }, [status, onError]);
  return <VideoView player={player} style={{ width: '100%', height: '100%' }} contentFit="contain" nativeControls allowsFullscreen />;
};
const MeasurementGuideModal = ({
  isOpen,
  onClose,
  onSelectAddMeasurements,
  onBookHomeVisit
}) => {
  const {
    appName
  } = useBrandingStore();
  const [activeTab, setActiveTab] = useState('diagram'); // 'diagram' | 'photo' | 'tips'
  const [viewMode, setViewMode] = useState('front'); // 'front' | 'back'
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  const [videoData, setVideoData] = useState(null);
  const [hasVideoError, setHasVideoError] = useState(false);
  React.useEffect(() => {
    if (!isOpen) return;
    setHasVideoError(false);
    const fetchGuideVideo = async () => {
      try {
        const res = await api.get('/cms/content/measurement-guide-video').catch(() => null);
        if (res?.data?.data) {
          setVideoData(res.data.data);
        } else {
          const listRes = await api.get('/cms/content?type=video').catch(() => null);
          if (listRes?.data?.data?.length > 0) {
            setVideoData(listRes.data.data[0]);
          }
        }
      } catch (err) {
        console.error("Failed to fetch guide video:", err);
      }
    };
    fetchGuideVideo();
  }, [isOpen]);
  const formatVideoEmbedUrl = rawUrl => {
    if (!rawUrl || typeof rawUrl !== 'string') return null;
    const url = rawUrl.trim();
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('youtube.com/watch')) {
      try {
        const videoId = new URL(url).searchParams.get('v');
        if (videoId) return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`;
      } catch {
        /* fallback */
      }
    }
    if (lowerUrl.includes('youtu.be/')) {
      const videoId = url.split('youtu.be/')[1]?.split('?')[0];
      if (videoId) return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`;
    }
    if (lowerUrl.includes('youtube.com/embed/')) {
      return url.includes('autoplay=1') ? url : `${url}${url.includes('?') ? '&' : '?'}autoplay=1`;
    }
    return null;
  };
  if (!isOpen) return null;
  const measurementItems = [{
    id: 1,
    title: 'Bust',
    description: 'Measure horizontally around the fullest part of your bust.',
    bgImage: '/images/measurement_model_front.png',
    bgPosition: 'center 33%',
    bgSize: '280%',
    lineType: 'horizontal'
  }, {
    id: 2,
    title: 'Waist',
    description: 'Measure horizontally around the natural waist (the narrowest part).',
    bgImage: '/images/measurement_model_front.png',
    bgPosition: 'center 44%',
    bgSize: '280%',
    lineType: 'horizontal'
  }, {
    id: 3,
    title: 'Hip',
    description: 'Measure horizontally around the fullest part of your hips.',
    bgImage: '/images/measurement_model_front.png',
    bgPosition: 'center 55%',
    bgSize: '280%',
    lineType: 'horizontal'
  }, {
    id: 4,
    title: 'Shoulder Width',
    description: 'Measure horizontally across the top from left shoulder joint to right shoulder joint.',
    bgImage: '/images/measurement_model_front.png',
    bgPosition: 'center 23%',
    bgSize: '280%',
    lineType: 'shoulder'
  }, {
    id: 5,
    title: 'Sleeve Length',
    description: 'Measure vertically along the arm from the shoulder seam down to the wrist.',
    bgImage: '/images/measurement_model_front.png',
    bgPosition: '78% 38%',
    bgSize: '280%',
    lineType: 'sleeve'
  }, {
    id: 6,
    title: 'Upper Arm / Bicep',
    description: 'Measure around the fullest part of your upper arm.',
    bgImage: '/images/measurement_model_front.png',
    bgPosition: '22% 33%',
    bgSize: '280%',
    lineType: 'horizontal'
  }, {
    id: 7,
    title: 'Wrist / Sleeve Cuff',
    description: 'Measure around the wrist or desired sleeve opening.',
    bgImage: '/images/measurement_model_front.png',
    bgPosition: '18% 50%',
    bgSize: '280%',
    lineType: 'horizontal'
  }, {
    id: 9,
    title: 'Kameez / Shirt Length',
    description: 'Measure vertically from top shoulder down to desired bottom hem.',
    bgImage: '/images/measurement_model_front.png',
    bgPosition: 'center 50%',
    bgSize: '160%',
    lineType: 'vertical',
    isVertical: true
  }, {
    id: 10,
    title: 'Back Shoulder',
    description: 'Measure horizontally across the upper back from shoulder tip to shoulder tip.',
    bgImage: '/images/measurement_model_back.png',
    bgPosition: 'center 28%',
    bgSize: '280%',
    lineType: 'shoulder'
  }, {
    id: 11,
    title: 'Armhole Depth',
    description: 'Measure around the armhole curve for comfortable movement.',
    bgImage: '/images/measurement_model_back.png',
    bgPosition: '75% 36%',
    bgSize: '280%',
    lineType: 'armhole'
  }, {
    id: 12,
    title: 'Back Waist',
    description: 'Measure horizontally across the back at waist level.',
    bgImage: '/images/measurement_model_back.png',
    bgPosition: 'center 46%',
    bgSize: '280%',
    lineType: 'horizontal'
  }, {
    id: 13,
    title: 'Salwar / Bottom Length',
    description: 'Measure vertically from waist down to ankle hem.',
    bgImage: '/images/measurement_model_back.png',
    bgPosition: 'center 80%',
    bgSize: '240%',
    lineType: 'vertical',
    isVertical: true
  }];
  return <Dialog visible={!!isOpen} onClose={onClose} containerClassName="p-2" backdropClassName="bg-slate-900/70" className="bg-[#FAF9FF] w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden max-h-[94%] flex flex-col border border-purple-100/80">
            <Box className="flex-shrink flex flex-col overflow-hidden">
                
                {/* 1. Header (Exact match to Photo 3) */}
                <Box className="bg-white px-4 py-3.5 border-b border-purple-50 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
                    <Box className="flex items-center gap-3">
                        <Btn onPress={onClose} className="w-9 h-9 rounded-full bg-[#F1F5F9] hover:bg-purple-100 active:scale-95 transition-all flex items-center justify-center text-slate-700 cursor-pointer">
                            <I icon={ArrowLeft} size={18} className="stroke-[2.5]" />
                        </Btn>
                        <Box>
                            <Txt className="text-base sm:text-lg font-extrabold text-[#1E1B4B] tracking-tight leading-snug">
                                Body Measurement Guide
                            </Txt>
                            <Txt className="text-[11px] sm:text-xs text-slate-500 font-medium leading-none">
                                Accurate measurements for the perfect fit
                            </Txt>
                        </Box>
                    </Box>

                    <Btn onPress={() => setIsVideoOpen(true)} className="px-3.5 py-1.5 rounded-full bg-white border border-[#843D9B] text-[#843D9B] hover:bg-purple-50 active:scale-95 transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer shrink-0 shadow-2xs">
                        <I icon={Play} size={12} className="fill-[#843D9B] text-[#843D9B]" />
                        <Txt>How to Measure</Txt>
                    </Btn>
                </Box>

                {/* 2. Three-Tab Navigation Bar (Exact match to Photo 3) */}
                <Box className="px-4 pt-3 bg-white border-b border-slate-100">
                    <Box className="grid grid-cols-3 gap-1 bg-slate-100/70 p-1 rounded-2xl border border-slate-200/60">
                        <Btn onPress={() => setActiveTab('diagram')} className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${activeTab === 'diagram' ? 'bg-[#843D9B] text-white shadow-md shadow-purple-900/20' : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'}`}>
                            <I icon={User} size={15} />
                            <Txt>Body Diagram</Txt>
                        </Btn>

                        <Btn onPress={() => setActiveTab('photo')} className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${activeTab === 'photo' ? 'bg-[#843D9B] text-white shadow-md shadow-purple-900/20' : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'}`}>
                            <I icon={Camera} size={15} />
                            <Txt>Photo Guide</Txt>
                        </Btn>

                        <Btn onPress={() => setActiveTab('tips')} className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${activeTab === 'tips' ? 'bg-[#843D9B] text-white shadow-md shadow-purple-900/20' : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'}`}>
                            <I icon={Lightbulb} size={15} />
                            <Txt>Measurement Tips</Txt>
                        </Btn>
                    </Box>
                </Box>

                {/* Main Scrollable Content */}
                <Scroll style={{ flexShrink: 1 }} contentClassName="p-4 space-y-4">

                    {/* TAB 1: BODY DIAGRAM (Photo 3 replica) */}
                    {activeTab === 'diagram' && <>
                            {/* Main Diagram Card */}
                            <Box className="bg-white rounded-3xl p-4 sm:p-5 border border-purple-100 shadow-xs text-center space-y-4">
                                
                                {/* Card Sub-Header */}
                                <Box className="flex items-center justify-between text-left border-b border-slate-100 pb-3">
                                    <Box className="flex items-center gap-2.5">
                                        <Box className="w-10 h-10 rounded-2xl bg-purple-100/70 border border-purple-200 flex items-center justify-center text-[#843D9B] shrink-0">
                                            <I icon={Ruler} size={20} />
                                        </Box>
                                        <Box>
                                            <Txt className="font-extrabold text-[#1E1B4B] text-sm sm:text-base">
                                                Muslim Women's Body Measurements
                                            </Txt>
                                            <Txt className="text-[11px] text-slate-400 font-medium">
                                                All measurements are in inches
                                            </Txt>
                                        </Box>
                                    </Box>
                                </Box>

                                {/* Front View / Back View Toggle Pills */}
                                <Box className="inline-flex p-1 bg-purple-50/80 rounded-full border border-purple-100 gap-1.5">
                                    <Btn onPress={() => setViewMode('front')} className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${viewMode === 'front' ? 'bg-[#843D9B] text-white shadow-md shadow-purple-600/20' : 'bg-transparent text-[#843D9B] hover:bg-purple-100/50'}`}>
                                        Front View
                                    </Btn>
                                    <Btn onPress={() => setViewMode('back')} className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${viewMode === 'back' ? 'bg-[#843D9B] text-white shadow-md shadow-purple-600/20' : 'bg-transparent text-[#843D9B] hover:bg-purple-100/50'}`}>
                                        Back View
                                    </Btn>
                                </Box>

                                {/* Model Graphic Container with side-by-side or toggled real model photos */}
                                <Box className="relative w-full bg-gradient-to-b from-purple-50/40 to-indigo-50/20 rounded-3xl p-4 border border-purple-100/60 overflow-hidden min-h-[360px] flex items-center justify-center">
                                    
                                    {/* Dual Side-by-side model views matching Photo 3 */}
                                    <Box className="grid grid-cols-2 gap-3 w-full max-w-md items-center">
                                        
                                        {/* Left: Front View Model */}
                                        <Box className={`relative flex flex-col items-center transition-all ${viewMode === 'front' ? 'scale-100 opacity-100' : 'opacity-80 scale-95'}`}>
                                            <Box className="relative w-full max-w-[170px] aspect-[1/2] rounded-2xl overflow-hidden shadow-sm border border-purple-100 bg-white">
                                                <Img src="/images/measurement_model_front.png" alt="Muslim Women Front View" className="w-full h-full object-cover object-center" />
                                                
                                                {/* Overlayed Measurement Lines & Badges Front */}
                                                <Box className="absolute inset-0 pointer-events-none">
                                                    {/* Line 1 Bust (Horizontal) */}
                                                    <Box className="absolute top-[33%] left-[16%] right-[16%] border-t-2 border-dashed border-[#843D9B]" />
                                                    <Box className="absolute top-[33%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#843D9B] text-white text-[10px] font-black flex items-center justify-center shadow-md z-10">1</Box>

                                                    {/* Line 2 Waist (Horizontal) */}
                                                    <Box className="absolute top-[44%] left-[20%] right-[20%] border-t-2 border-dashed border-[#843D9B]" />
                                                    <Box className="absolute top-[44%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#843D9B] text-white text-[10px] font-black flex items-center justify-center shadow-md z-10">2</Box>

                                                    {/* Line 3 Hip (Horizontal) */}
                                                    <Box className="absolute top-[55%] left-[18%] right-[18%] border-t-2 border-dashed border-[#843D9B]" />
                                                    <Box className="absolute top-[55%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#843D9B] text-white text-[10px] font-black flex items-center justify-center shadow-md z-10">3</Box>

                                                    {/* Line 4 Shoulder Width (Horizontal across top shoulders with end ticks) */}
                                                    <Box className="absolute top-[22%] left-[20%] right-[20%] border-t-2 border-dashed border-amber-500">
                                                        <Box className="absolute -top-1 left-0 w-0.5 h-2.5 bg-amber-500" />
                                                        <Box className="absolute -top-1 right-0 w-0.5 h-2.5 bg-amber-500" />
                                                    </Box>
                                                    <Box className="absolute top-[22%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-amber-600 text-white text-[10px] font-black flex items-center justify-center shadow-md z-10">4</Box>

                                                    {/* Line 5 Sleeve Length (Vertical along sleeve from shoulder to wrist) */}
                                                    <Box className="absolute top-[22%] bottom-[50%] right-[16%] border-r-2 border-dashed border-primary">
                                                        <Box className="absolute top-0 -right-1 w-2.5 h-0.5 bg-primary" />
                                                        <Box className="absolute bottom-0 -right-1 w-2.5 h-0.5 bg-primary" />
                                                    </Box>
                                                    <Box className="absolute top-[36%] right-[8%] -translate-y-1/2 w-5 h-5 rounded-full bg-primary-dark text-white text-[10px] font-black flex items-center justify-center shadow-md z-10">5</Box>

                                                    {/* Line 6 Bicep / Upper Arm (Short horizontal line across bicep) */}
                                                    <Box className="absolute top-[33%] left-[10%] w-[18%] border-t-2 border-dashed border-[#843D9B]" />
                                                    <Box className="absolute top-[33%] left-[2%] -translate-y-1/2 w-5 h-5 rounded-full bg-[#843D9B] text-white text-[10px] font-black flex items-center justify-center shadow-md z-10">6</Box>

                                                    {/* Line 7 Wrist (Short horizontal line across wrist) */}
                                                    <Box className="absolute top-[50%] left-[8%] w-[16%] border-t-2 border-dashed border-[#843D9B]" />
                                                    <Box className="absolute top-[50%] left-[1%] -translate-y-1/2 w-5 h-5 rounded-full bg-[#843D9B] text-white text-[10px] font-black flex items-center justify-center shadow-md z-10">7</Box>

                                                    {/* Line 9 Kameez / Shirt Length (VERTICAL line from shoulder down to hem) */}
                                                    <Box className="absolute top-[22%] bottom-[26%] left-[36%] border-l-2 border-dashed border-emerald-600">
                                                        <Box className="absolute top-0 -left-1 w-2.5 h-0.5 bg-emerald-600" />
                                                        <Box className="absolute bottom-0 -left-1 w-2.5 h-0.5 bg-emerald-600" />
                                                    </Box>
                                                    <Box className="absolute top-[74%] left-[36%] -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-black flex items-center justify-center shadow-md z-10">9</Box>
                                                </Box>
                                            </Box>
                                            <Txt className="text-[11px] font-bold text-purple-900 mt-2">Front View</Txt>
                                        </Box>

                                        {/* Right: Back View Model */}
                                        <Box className={`relative flex flex-col items-center transition-all ${viewMode === 'back' ? 'scale-100 opacity-100' : 'opacity-80 scale-95'}`}>
                                            <Box className="relative w-full max-w-[170px] aspect-[1/2] rounded-2xl overflow-hidden shadow-sm border border-purple-100 bg-white">
                                                <Img src="/images/measurement_model_back.png" alt="Muslim Women Back View" className="w-full h-full object-cover object-center" />
                                                
                                                {/* Overlayed Measurement Lines & Badges Back */}
                                                <Box className="absolute inset-0 pointer-events-none">
                                                    {/* Line 10 Back Shoulder (Horizontal across upper back shoulder with end ticks) */}
                                                    <Box className="absolute top-[28%] left-[20%] right-[20%] border-t-2 border-dashed border-amber-500">
                                                        <Box className="absolute -top-1 left-0 w-0.5 h-2.5 bg-amber-500" />
                                                        <Box className="absolute -top-1 right-0 w-0.5 h-2.5 bg-amber-500" />
                                                    </Box>
                                                    <Box className="absolute top-[28%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-amber-600 text-white text-[10px] font-black flex items-center justify-center shadow-md z-10">10</Box>

                                                    {/* Line 11 Armhole Depth (Vertical/curved line around armhole) */}
                                                    <Box className="absolute top-[28%] bottom-[63%] right-[20%] border-r-2 border-dashed border-primary rounded-r-md">
                                                        <Box className="absolute top-0 -right-1 w-2 h-0.5 bg-primary" />
                                                        <Box className="absolute bottom-0 -right-1 w-2 h-0.5 bg-primary" />
                                                    </Box>
                                                    <Box className="absolute top-[35%] right-[10%] -translate-y-1/2 w-5 h-5 rounded-full bg-primary-dark text-white text-[10px] font-black flex items-center justify-center shadow-md z-10">11</Box>

                                                    {/* Line 12 Back Waist (Horizontal) */}
                                                    <Box className="absolute top-[46%] left-[18%] right-[18%] border-t-2 border-dashed border-[#843D9B]" />
                                                    <Box className="absolute top-[46%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#843D9B] text-white text-[10px] font-black flex items-center justify-center shadow-md z-10">12</Box>

                                                    {/* Line 13 Salwar / Bottom Length (VERTICAL line along leg) */}
                                                    <Box className="absolute top-[52%] bottom-[16%] right-[28%] border-r-2 border-dashed border-emerald-600">
                                                        <Box className="absolute top-0 -right-1 w-2.5 h-0.5 bg-emerald-600" />
                                                        <Box className="absolute bottom-0 -right-1 w-2.5 h-0.5 bg-emerald-600" />
                                                    </Box>
                                                    <Box className="absolute top-[80%] right-[18%] -translate-y-1/2 w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-black flex items-center justify-center shadow-md z-10">13</Box>
                                                </Box>
                                            </Box>
                                            <Txt className="text-[11px] font-bold text-purple-900 mt-2">Back View</Txt>
                                        </Box>

                                    </Box>
                                </Box>

                                {/* Numbered Measurement List with Real Cropped Model Snippet Thumbnails */}
                                <Box className="divide-y divide-slate-100 text-left pt-2">
                                    {measurementItems.map(item => <Box key={item.id} className="py-3.5 flex items-center justify-between gap-3">
                                            <Box className="flex items-start gap-3 min-w-0">
                                                <Box className="w-7 h-7 rounded-full bg-[#843D9B] text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5 shadow-2xs">
                                                    {item.id}
                                                </Box>
                                                <Box>
                                                    <Txt className="text-sm font-bold text-slate-900 leading-snug">
                                                        {item.title}
                                                    </Txt>
                                                    <Txt className="text-xs text-slate-500 font-medium leading-relaxed mt-0.5">
                                                        {item.description}
                                                    </Txt>
                                                </Box>
                                            </Box>

                                            {/* Real Cropped Model Photo Thumbnail */}
                                            <Box className="w-20 h-16 rounded-xl border border-purple-200 shrink-0 relative shadow-2xs overflow-hidden bg-purple-50">
                                                <CropThumb src={item.bgImage} size={item.bgSize} position={item.bgPosition} w={80} h={64} />
                                                {/* Dashed Line & Badge Overlay tailored to lineType */}
                                                <Box className="absolute inset-0 bg-purple-950/10 pointer-events-none flex items-center justify-center">
                                                    {item.lineType === 'vertical' ? <Box className="h-full border-l-2 border-dashed border-emerald-500 relative flex items-center justify-center">
                                                            <Box className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[9px] font-black flex items-center justify-center shadow-md">
                                                                {item.id}
                                                            </Box>
                                                        </Box> : item.lineType === 'shoulder' ? <Box className="w-[85%] border-t-2 border-dashed border-amber-500 relative flex items-center justify-center my-auto">
                                                            <Box className="absolute -top-1 left-0 w-0.5 h-2 bg-amber-500" />
                                                            <Box className="absolute -top-1 right-0 w-0.5 h-2 bg-amber-500" />
                                                            <Box className="w-4 h-4 rounded-full bg-amber-600 text-white text-[9px] font-black flex items-center justify-center shadow-md">
                                                                {item.id}
                                                            </Box>
                                                        </Box> : item.lineType === 'sleeve' ? <Box className="h-full border-r-2 border-dashed border-primary relative flex items-center justify-center mr-2">
                                                            <Box className="w-4 h-4 rounded-full bg-primary-dark text-white text-[9px] font-black flex items-center justify-center shadow-md">
                                                                {item.id}
                                                            </Box>
                                                        </Box> : item.lineType === 'armhole' ? <Box className="h-[80%] border-r-2 border-dashed border-primary rounded-r-md relative flex items-center justify-center mr-2">
                                                            <Box className="w-4 h-4 rounded-full bg-primary-dark text-white text-[9px] font-black flex items-center justify-center shadow-md">
                                                                {item.id}
                                                            </Box>
                                                        </Box> : <Box className="w-full border-t-2 border-dashed border-[#843D9B] relative flex items-center justify-center">
                                                            <Box className="w-4 h-4 rounded-full bg-[#843D9B] text-white text-[9px] font-black flex items-center justify-center shadow-md">
                                                                {item.id}
                                                            </Box>
                                                        </Box>}
                                                </Box>
                                            </Box>
                                        </Box>)}
                                </Box>
                            </Box>

                            {/* Save Your Measurements Card */}
                            <Box className="bg-white rounded-3xl p-4 sm:p-5 border border-purple-100 shadow-xs space-y-4 text-left">
                                <Box className="flex items-center justify-between gap-3">
                                    <Box>
                                        <Txt className="font-extrabold text-[#1E1B4B] text-sm sm:text-base">
                                            Save Your Measurements
                                        </Txt>
                                        <Txt className="text-xs text-slate-500 font-medium mt-0.5">
                                            Save once and use for all your future orders.
                                        </Txt>
                                    </Box>
                                    <Btn onPress={() => {
                if (onSelectAddMeasurements) onSelectAddMeasurements();
                onClose();
              }} className="px-4 py-2.5 rounded-full bg-[#843D9B] hover:bg-purple-900 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-800/25 transition-all cursor-pointer whitespace-nowrap shrink-0">
                                        <I icon={Plus} size={15} className="stroke-[3]" />
                                        <Txt>Add My Measurements</Txt>
                                    </Btn>
                                </Box>

                                {/* 3 Feature Highlights */}
                                <Box className="grid grid-cols-3 gap-2.5 pt-2 border-t border-slate-100">
                                    <Box className="bg-purple-50/40 rounded-2xl p-3 flex flex-col items-center text-center border border-purple-100/60">
                                        <Box className="w-9 h-9 rounded-full bg-purple-100/80 text-[#843D9B] flex items-center justify-center mb-1.5 shadow-2xs">
                                            <I icon={ShieldCheck} size={18} />
                                        </Box>
                                        <Txt className="text-xs font-extrabold text-slate-900 leading-tight">100% Private</Txt>
                                        <Txt className="text-[10px] text-slate-500 mt-1 leading-tight font-medium">Your data is secure and confidential.</Txt>
                                    </Box>

                                    <Box className="bg-purple-50/40 rounded-2xl p-3 flex flex-col items-center text-center border border-purple-100/60">
                                        <Box className="w-9 h-9 rounded-full bg-purple-100/80 text-[#843D9B] flex items-center justify-center mb-1.5 shadow-2xs">
                                            <I icon={RotateCcw} size={18} />
                                        </Box>
                                        <Txt className="text-xs font-extrabold text-slate-900 leading-tight">Reusable</Txt>
                                        <Txt className="text-[10px] text-slate-500 mt-1 leading-tight font-medium">Use these measurements for future orders.</Txt>
                                    </Box>

                                    <Box className="bg-purple-50/40 rounded-2xl p-3 flex flex-col items-center text-center border border-purple-100/60">
                                        <Box className="w-9 h-9 rounded-full bg-purple-100/80 text-[#843D9B] flex items-center justify-center mb-1.5 shadow-2xs">
                                            <I icon={Sparkles} size={18} />
                                        </Box>
                                        <Txt className="text-xs font-extrabold text-slate-900 leading-tight">Accurate Fit</Txt>
                                        <Txt className="text-[10px] text-slate-500 mt-1 leading-tight font-medium">Tailors will stitch with perfect fit.</Txt>
                                    </Box>
                                </Box>
                            </Box>

                            {/* Need Help? Card */}
                            <Box className="bg-white rounded-3xl p-4 sm:p-5 border border-purple-100 shadow-xs text-left space-y-3">
                                <Box>
                                    <Txt className="font-extrabold text-[#1E1B4B] text-sm sm:text-base">
                                        Need Help?
                                    </Txt>
                                    <Txt className="text-xs text-slate-500 font-medium mt-0.5">
                                        Our experts are here for you
                                    </Txt>
                                </Box>

                                <Box className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                    <Btn onPress={() => setIsVideoOpen(true)} className="p-3.5 rounded-2xl border border-purple-100 bg-white hover:bg-purple-50/70 active:scale-95 transition-all text-left flex items-center sm:flex-col sm:items-start gap-2.5 cursor-pointer shadow-2xs group">
                                        <Box className="w-9 h-9 rounded-xl bg-purple-100 text-[#843D9B] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                            <I icon={Play} size={16} className="fill-[#843D9B]" />
                                        </Box>
                                        <Box>
                                            <Txt className="text-xs font-bold text-slate-900 group-hover:text-[#843D9B] transition-colors">Video Guide</Txt>
                                            <Txt className="text-[10px] text-slate-500 leading-snug font-medium">Watch measurement video</Txt>
                                        </Box>
                                    </Btn>

                                    <Btn onPress={() => {
                openAdminWhatsApp(`Hi ${appName || 'SewZella'} Admin, I need help with body measurements.`);
              }} className="p-3.5 rounded-2xl border border-purple-100 bg-white hover:bg-purple-50/70 active:scale-95 transition-all text-left flex items-center sm:flex-col sm:items-start gap-2.5 cursor-pointer shadow-2xs group">
                                        <Box className="w-9 h-9 rounded-xl bg-purple-100 text-[#843D9B] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                            <I icon={MessageSquare} size={16} />
                                        </Box>
                                        <Box>
                                            <Txt className="text-xs font-bold text-slate-900 group-hover:text-[#843D9B] transition-colors">Chat with Expert</Txt>
                                            <Txt className="text-[10px] text-slate-500 leading-snug font-medium">Get help from our experts</Txt>
                                        </Box>
                                    </Btn>

                                    <Btn onPress={() => {
                if (onBookHomeVisit) onBookHomeVisit();
                onClose();
              }} className="p-3.5 rounded-2xl border border-purple-100 bg-white hover:bg-purple-50/70 active:scale-95 transition-all text-left flex items-center sm:flex-col sm:items-start gap-2.5 cursor-pointer shadow-2xs group">
                                        <Box className="w-9 h-9 rounded-xl bg-purple-100 text-[#843D9B] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                            <I icon={Home} size={16} />
                                        </Box>
                                        <Box>
                                            <Txt className="text-xs font-bold text-slate-900 group-hover:text-[#843D9B] transition-colors">Book Home Measurement</Txt>
                                            <Txt className="text-[10px] text-slate-500 leading-snug font-medium">Our expert will visit your home</Txt>
                                        </Box>
                                    </Btn>
                                </Box>
                            </Box>
                        </>}

                    {/* TAB 2: PHOTO GUIDE */}
                    {activeTab === 'photo' && <Box className="bg-white rounded-3xl p-5 border border-purple-100 shadow-xs space-y-4 text-left">
                            <Box className="flex items-center gap-3 border-b border-slate-100 pb-3">
                                <Box className="w-10 h-10 rounded-2xl bg-purple-100 text-[#843D9B] flex items-center justify-center shrink-0">
                                    <I icon={Camera} size={20} />
                                </Box>
                                <Box>
                                    <Txt className="font-extrabold text-slate-900 text-base">Photo Measurement Guide</Txt>
                                    <Txt className="text-xs text-slate-500">Upload clean posture photos for AI fit analysis</Txt>
                                </Box>
                            </Box>

                            <Box className="space-y-3">
                                <Box className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-100 flex items-start gap-3">
                                    <I icon={Check} className="text-emerald-600 stroke-[3] mt-0.5 shrink-0" size={16} />
                                    <Box>
                                        <Txt className="text-xs font-bold text-slate-900">Full Body Posture</Txt>
                                        <Txt className="text-[11px] text-slate-600 mt-0.5">Stand straight against a plain background in fitted clothing.</Txt>
                                    </Box>
                                </Box>

                                <Box className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-100 flex items-start gap-3">
                                    <I icon={Check} className="text-emerald-600 stroke-[3] mt-0.5 shrink-0" size={16} />
                                    <Box>
                                        <Txt className="text-xs font-bold text-slate-900">Good Lighting</Txt>
                                        <Txt className="text-[11px] text-slate-600 mt-0.5">Ensure the room is well-lit so body contours are clear.</Txt>
                                    </Box>
                                </Box>
                            </Box>
                        </Box>}

                    {/* TAB 3: MEASUREMENT TIPS */}
                    {activeTab === 'tips' && <Box className="bg-white rounded-3xl p-5 border border-purple-100 shadow-xs space-y-4 text-left">
                            <Box className="flex items-center gap-3 border-b border-slate-100 pb-3">
                                <Box className="w-10 h-10 rounded-2xl bg-purple-100 text-[#843D9B] flex items-center justify-center shrink-0">
                                    <I icon={Lightbulb} size={20} />
                                </Box>
                                <Box>
                                    <Txt className="font-extrabold text-slate-900 text-base">Pro Measurement Tips</Txt>
                                    <Txt className="text-xs text-slate-500">Follow these steps to avoid sizing errors</Txt>
                                </Box>
                            </Box>

                            <Box className="space-y-3">
                                <Box className="p-3 rounded-2xl border border-slate-100 bg-slate-50/50 flex gap-3 items-start">
                                    <Txt className="w-6 h-6 rounded-full bg-[#843D9B] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">1</Txt>
                                    <Txt className="text-xs text-slate-700 font-medium">Use a soft, flexible cloth measuring tape rather than a metal ruler.</Txt>
                                </Box>

                                <Box className="p-3 rounded-2xl border border-slate-100 bg-slate-50/50 flex gap-3 items-start">
                                    <Txt className="w-6 h-6 rounded-full bg-[#843D9B] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">2</Txt>
                                    <Txt className="text-xs text-slate-700 font-medium">Keep one finger behind the tape to ensure comfortable breathing room.</Txt>
                                </Box>

                                <Box className="p-3 rounded-2xl border border-slate-100 bg-slate-50/50 flex gap-3 items-start">
                                    <Txt className="w-6 h-6 rounded-full bg-[#843D9B] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">3</Txt>
                                    <Txt className="text-xs text-slate-700 font-medium">Measure over fitted undergarments or light clothes for accurate dimensions.</Txt>
                                </Box>
                            </Box>
                        </Box>}

                </Scroll>
            </Box>

            {/* Video Modal Overlay if Video Guide Clicked */}
            <Dialog visible={isVideoOpen} onClose={() => { setIsVideoOpen(false); setHasVideoError(false); }} backdropClassName="bg-black/80" className="w-full max-w-xl">
                    <Box className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl relative p-4 text-center">
                        <Btn onPress={() => {
          setIsVideoOpen(false);
          setHasVideoError(false);
        }} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 hover:bg-slate-200 cursor-pointer z-10">
                            <I icon={X} size={18} />
                        </Btn>
                        <Txt className="text-base font-bold text-slate-900 mb-3 pt-2">
                            {videoData?.title || "How to Measure Body Guide"}
                        </Txt>
                        <Box className="aspect-video w-full bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center relative shadow-inner">
                            {(() => {
            const rawUrl = videoData?.content?.trim() || '';
            if (!rawUrl) {
              return <Box className="p-6 text-center text-slate-400 text-xs font-medium">
                                            No measurement guide video uploaded yet.
                                        </Box>;
            }
            const youtubeEmbed = formatVideoEmbedUrl(rawUrl);
            if (youtubeEmbed) {
              return <WebView style={{ width: '100%', height: '100%', backgroundColor: '#0f172a' }} source={{ uri: youtubeEmbed }} allowsFullscreenVideo mediaPlaybackRequiresUserAction={false} javaScriptEnabled />;
            }

            // Build candidate URLs
            const candidateUrls = [];
            if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
              candidateUrls.push(rawUrl);
            }
            let filename = rawUrl;
            if (rawUrl.includes('/uploads/')) {
              filename = rawUrl.split('/uploads/')[1];
            } else if (!rawUrl.startsWith('http')) {
              filename = rawUrl.replace(/^\/+/, '');
            }
            candidateUrls.push(`https://sewzella.com/api/v1/uploads/${filename}`);
            const cleanCandidateUrls = Array.from(new Set(candidateUrls));
            const activeVideoUrl = cleanCandidateUrls[0] || rawUrl;
            if (hasVideoError) {
              return <Box className="p-6 text-center text-white space-y-3">
                                            <Txt className="text-xs text-red-300 font-medium">Video could not be played. Please check your network connection.</Txt>
                                            <Btn onPress={() => setHasVideoError(false)} className="px-4 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5">
                                                🔄 Retry Video
                                            </Btn>
                                        </Box>;
            }
            return <GuideVideo key={activeVideoUrl} uri={activeVideoUrl} onError={() => setHasVideoError(true)} />;
          })()}
                        </Box>
                    </Box>
            </Dialog>
        </Dialog>;
};
export default MeasurementGuideModal;
