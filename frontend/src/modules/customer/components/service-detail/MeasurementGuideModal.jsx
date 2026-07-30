import React, { useState } from 'react';
import { 
    ArrowLeft, 
    Play, 
    Ruler, 
    ShieldCheck, 
    RotateCcw, 
    CheckCircle2, 
    Video, 
    MessageSquare, 
    Home, 
    X,
    Plus,
    Sparkles,
    User,
    Camera,
    Lightbulb,
    Info,
    Check
} from 'lucide-react';
import api from '../../../../utils/api';

const MeasurementGuideModal = ({ isOpen, onClose, onSelectAddMeasurements, onBookHomeVisit }) => {
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

    const formatVideoEmbedUrl = (rawUrl) => {
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

    const measurementItems = [
        {
            id: 1,
            title: 'Bust',
            description: 'Measure horizontally around the fullest part of your bust.',
            bgImage: '/images/measurement_model_front.png',
            bgPosition: 'center 33%',
            bgSize: '280%',
            lineType: 'horizontal'
        },
        {
            id: 2,
            title: 'Waist',
            description: 'Measure horizontally around the natural waist (the narrowest part).',
            bgImage: '/images/measurement_model_front.png',
            bgPosition: 'center 44%',
            bgSize: '280%',
            lineType: 'horizontal'
        },
        {
            id: 3,
            title: 'Hip',
            description: 'Measure horizontally around the fullest part of your hips.',
            bgImage: '/images/measurement_model_front.png',
            bgPosition: 'center 55%',
            bgSize: '280%',
            lineType: 'horizontal'
        },
        {
            id: 4,
            title: 'Shoulder Width',
            description: 'Measure horizontally across the top from left shoulder joint to right shoulder joint.',
            bgImage: '/images/measurement_model_front.png',
            bgPosition: 'center 23%',
            bgSize: '280%',
            lineType: 'shoulder'
        },
        {
            id: 5,
            title: 'Sleeve Length',
            description: 'Measure vertically along the arm from the shoulder seam down to the wrist.',
            bgImage: '/images/measurement_model_front.png',
            bgPosition: '78% 38%',
            bgSize: '280%',
            lineType: 'sleeve'
        },
        {
            id: 6,
            title: 'Upper Arm / Bicep',
            description: 'Measure around the fullest part of your upper arm.',
            bgImage: '/images/measurement_model_front.png',
            bgPosition: '22% 33%',
            bgSize: '280%',
            lineType: 'horizontal'
        },
        {
            id: 7,
            title: 'Wrist / Sleeve Cuff',
            description: 'Measure around the wrist or desired sleeve opening.',
            bgImage: '/images/measurement_model_front.png',
            bgPosition: '18% 50%',
            bgSize: '280%',
            lineType: 'horizontal'
        },
        {
            id: 9,
            title: 'Kameez / Shirt Length',
            description: 'Measure vertically from top shoulder down to desired bottom hem.',
            bgImage: '/images/measurement_model_front.png',
            bgPosition: 'center 50%',
            bgSize: '160%',
            lineType: 'vertical',
            isVertical: true
        },
        {
            id: 10,
            title: 'Back Shoulder',
            description: 'Measure horizontally across the upper back from shoulder tip to shoulder tip.',
            bgImage: '/images/measurement_model_back.png',
            bgPosition: 'center 28%',
            bgSize: '280%',
            lineType: 'shoulder'
        },
        {
            id: 11,
            title: 'Armhole Depth',
            description: 'Measure around the armhole curve for comfortable movement.',
            bgImage: '/images/measurement_model_back.png',
            bgPosition: '75% 36%',
            bgSize: '280%',
            lineType: 'armhole'
        },
        {
            id: 12,
            title: 'Back Waist',
            description: 'Measure horizontally across the back at waist level.',
            bgImage: '/images/measurement_model_back.png',
            bgPosition: 'center 46%',
            bgSize: '280%',
            lineType: 'horizontal'
        },
        {
            id: 13,
            title: 'Salwar / Bottom Length',
            description: 'Measure vertically from waist down to ankle hem.',
            bgImage: '/images/measurement_model_back.png',
            bgPosition: 'center 80%',
            bgSize: '240%',
            lineType: 'vertical',
            isVertical: true
        }
    ];

    return (
        <div className="fixed inset-0 z-[9999] bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 overflow-y-auto animate-in fade-in duration-200">
            <div className="bg-[#FAF9FF] w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[94vh] flex flex-col border border-purple-100/80">
                
                {/* 1. Header (Exact match to Photo 3) */}
                <div className="bg-white px-4 py-3.5 border-b border-purple-50 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={onClose}
                            className="w-9 h-9 rounded-full bg-[#F1F5F9] hover:bg-purple-100 active:scale-95 transition-all flex items-center justify-center text-slate-700 cursor-pointer"
                        >
                            <ArrowLeft size={18} className="stroke-[2.5]" />
                        </button>
                        <div>
                            <h2 className="text-base sm:text-lg font-extrabold text-[#1E1B4B] tracking-tight leading-snug">
                                Body Measurement Guide
                            </h2>
                            <p className="text-[11px] sm:text-xs text-slate-500 font-medium leading-none">
                                Accurate measurements for the perfect fit
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={() => setIsVideoOpen(true)}
                        className="px-3.5 py-1.5 rounded-full bg-white border border-[#7C3AED] text-[#7C3AED] hover:bg-purple-50 active:scale-95 transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer shrink-0 shadow-2xs"
                    >
                        <Play size={12} className="fill-[#7C3AED] text-[#7C3AED]" />
                        <span>How to Measure</span>
                    </button>
                </div>

                {/* 2. Three-Tab Navigation Bar (Exact match to Photo 3) */}
                <div className="px-4 pt-3 bg-white border-b border-slate-100">
                    <div className="grid grid-cols-3 gap-1 bg-slate-100/70 p-1 rounded-2xl border border-slate-200/60">
                        <button
                            onClick={() => setActiveTab('diagram')}
                            className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                activeTab === 'diagram'
                                    ? 'bg-[#6B21A8] text-white shadow-md shadow-purple-900/20'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                            }`}
                        >
                            <User size={15} />
                            <span>Body Diagram</span>
                        </button>

                        <button
                            onClick={() => setActiveTab('photo')}
                            className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                activeTab === 'photo'
                                    ? 'bg-[#6B21A8] text-white shadow-md shadow-purple-900/20'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                            }`}
                        >
                            <Camera size={15} />
                            <span>Photo Guide</span>
                        </button>

                        <button
                            onClick={() => setActiveTab('tips')}
                            className={`py-2 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                                activeTab === 'tips'
                                    ? 'bg-[#6B21A8] text-white shadow-md shadow-purple-900/20'
                                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                            }`}
                        >
                            <Lightbulb size={15} />
                            <span>Measurement Tips</span>
                        </button>
                    </div>
                </div>

                {/* Main Scrollable Content */}
                <div className="p-4 space-y-4 overflow-y-auto custom-scrollbar">

                    {/* TAB 1: BODY DIAGRAM (Photo 3 replica) */}
                    {activeTab === 'diagram' && (
                        <>
                            {/* Main Diagram Card */}
                            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-purple-100 shadow-xs text-center space-y-4">
                                
                                {/* Card Sub-Header */}
                                <div className="flex items-center justify-between text-left border-b border-slate-100 pb-3">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-10 h-10 rounded-2xl bg-purple-100/70 border border-purple-200 flex items-center justify-center text-[#7C3AED] shrink-0">
                                            <Ruler size={20} />
                                        </div>
                                        <div>
                                            <h3 className="font-extrabold text-[#1E1B4B] text-sm sm:text-base">
                                                Muslim Women's Body Measurements
                                            </h3>
                                            <p className="text-[11px] text-slate-400 font-medium">
                                                All measurements are in inches
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Front View / Back View Toggle Pills */}
                                <div className="inline-flex p-1 bg-purple-50/80 rounded-full border border-purple-100 gap-1.5">
                                    <button
                                        onClick={() => setViewMode('front')}
                                        className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                                            viewMode === 'front' 
                                                ? 'bg-[#7C3AED] text-white shadow-md shadow-purple-600/20' 
                                                : 'bg-transparent text-[#7C3AED] hover:bg-purple-100/50'
                                        }`}
                                    >
                                        Front View
                                    </button>
                                    <button
                                        onClick={() => setViewMode('back')}
                                        className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                                            viewMode === 'back' 
                                                ? 'bg-[#7C3AED] text-white shadow-md shadow-purple-600/20' 
                                                : 'bg-transparent text-[#7C3AED] hover:bg-purple-100/50'
                                        }`}
                                    >
                                        Back View
                                    </button>
                                </div>

                                {/* Model Graphic Container with side-by-side or toggled real model photos */}
                                <div className="relative w-full bg-gradient-to-b from-purple-50/40 to-indigo-50/20 rounded-3xl p-4 border border-purple-100/60 overflow-hidden min-h-[360px] flex items-center justify-center">
                                    
                                    {/* Dual Side-by-side model views matching Photo 3 */}
                                    <div className="grid grid-cols-2 gap-3 w-full max-w-md items-center">
                                        
                                        {/* Left: Front View Model */}
                                        <div className={`relative flex flex-col items-center transition-all ${viewMode === 'front' ? 'scale-100 opacity-100' : 'opacity-80 scale-95'}`}>
                                            <div className="relative w-full max-w-[170px] aspect-[1/2] rounded-2xl overflow-hidden shadow-sm border border-purple-100 bg-white">
                                                <img 
                                                    src="/images/measurement_model_front.png" 
                                                    alt="Muslim Women Front View" 
                                                    className="w-full h-full object-cover object-center"
                                                />
                                                
                                                {/* Overlayed Measurement Lines & Badges Front */}
                                                <div className="absolute inset-0 pointer-events-none">
                                                    {/* Line 1 Bust (Horizontal) */}
                                                    <div className="absolute top-[33%] left-[16%] right-[16%] border-t-2 border-dashed border-[#7C3AED]" />
                                                    <div className="absolute top-[33%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#7C3AED] text-white text-[10px] font-black flex items-center justify-center shadow-md z-10">1</div>

                                                    {/* Line 2 Waist (Horizontal) */}
                                                    <div className="absolute top-[44%] left-[20%] right-[20%] border-t-2 border-dashed border-[#7C3AED]" />
                                                    <div className="absolute top-[44%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#7C3AED] text-white text-[10px] font-black flex items-center justify-center shadow-md z-10">2</div>

                                                    {/* Line 3 Hip (Horizontal) */}
                                                    <div className="absolute top-[55%] left-[18%] right-[18%] border-t-2 border-dashed border-[#7C3AED]" />
                                                    <div className="absolute top-[55%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#7C3AED] text-white text-[10px] font-black flex items-center justify-center shadow-md z-10">3</div>

                                                    {/* Line 4 Shoulder Width (Horizontal across top shoulders with end ticks) */}
                                                    <div className="absolute top-[22%] left-[20%] right-[20%] border-t-2 border-dashed border-amber-500">
                                                        <div className="absolute -top-1 left-0 w-0.5 h-2.5 bg-amber-500" />
                                                        <div className="absolute -top-1 right-0 w-0.5 h-2.5 bg-amber-500" />
                                                    </div>
                                                    <div className="absolute top-[22%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-amber-600 text-white text-[10px] font-black flex items-center justify-center shadow-md z-10">4</div>

                                                    {/* Line 5 Sleeve Length (Vertical along sleeve from shoulder to wrist) */}
                                                    <div className="absolute top-[22%] bottom-[50%] right-[16%] border-r-2 border-dashed border-purple-600">
                                                        <div className="absolute top-0 -right-1 w-2.5 h-0.5 bg-purple-600" />
                                                        <div className="absolute bottom-0 -right-1 w-2.5 h-0.5 bg-purple-600" />
                                                    </div>
                                                    <div className="absolute top-[36%] right-[8%] -translate-y-1/2 w-5 h-5 rounded-full bg-purple-700 text-white text-[10px] font-black flex items-center justify-center shadow-md z-10">5</div>

                                                    {/* Line 6 Bicep / Upper Arm (Short horizontal line across bicep) */}
                                                    <div className="absolute top-[33%] left-[10%] w-[18%] border-t-2 border-dashed border-[#7C3AED]" />
                                                    <div className="absolute top-[33%] left-[2%] -translate-y-1/2 w-5 h-5 rounded-full bg-[#7C3AED] text-white text-[10px] font-black flex items-center justify-center shadow-md z-10">6</div>

                                                    {/* Line 7 Wrist (Short horizontal line across wrist) */}
                                                    <div className="absolute top-[50%] left-[8%] w-[16%] border-t-2 border-dashed border-[#7C3AED]" />
                                                    <div className="absolute top-[50%] left-[1%] -translate-y-1/2 w-5 h-5 rounded-full bg-[#7C3AED] text-white text-[10px] font-black flex items-center justify-center shadow-md z-10">7</div>

                                                    {/* Line 9 Kameez / Shirt Length (VERTICAL line from shoulder down to hem) */}
                                                    <div className="absolute top-[22%] bottom-[26%] left-[36%] border-l-2 border-dashed border-emerald-600">
                                                        <div className="absolute top-0 -left-1 w-2.5 h-0.5 bg-emerald-600" />
                                                        <div className="absolute bottom-0 -left-1 w-2.5 h-0.5 bg-emerald-600" />
                                                    </div>
                                                    <div className="absolute top-[74%] left-[36%] -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-black flex items-center justify-center shadow-md z-10">9</div>
                                                </div>
                                            </div>
                                            <span className="text-[11px] font-bold text-purple-900 mt-2">Front View</span>
                                        </div>

                                        {/* Right: Back View Model */}
                                        <div className={`relative flex flex-col items-center transition-all ${viewMode === 'back' ? 'scale-100 opacity-100' : 'opacity-80 scale-95'}`}>
                                            <div className="relative w-full max-w-[170px] aspect-[1/2] rounded-2xl overflow-hidden shadow-sm border border-purple-100 bg-white">
                                                <img 
                                                    src="/images/measurement_model_back.png" 
                                                    alt="Muslim Women Back View" 
                                                    className="w-full h-full object-cover object-center"
                                                />
                                                
                                                {/* Overlayed Measurement Lines & Badges Back */}
                                                <div className="absolute inset-0 pointer-events-none">
                                                    {/* Line 10 Back Shoulder (Horizontal across upper back shoulder with end ticks) */}
                                                    <div className="absolute top-[28%] left-[20%] right-[20%] border-t-2 border-dashed border-amber-500">
                                                        <div className="absolute -top-1 left-0 w-0.5 h-2.5 bg-amber-500" />
                                                        <div className="absolute -top-1 right-0 w-0.5 h-2.5 bg-amber-500" />
                                                    </div>
                                                    <div className="absolute top-[28%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-amber-600 text-white text-[10px] font-black flex items-center justify-center shadow-md z-10">10</div>

                                                    {/* Line 11 Armhole Depth (Vertical/curved line around armhole) */}
                                                    <div className="absolute top-[28%] bottom-[63%] right-[20%] border-r-2 border-dashed border-purple-600 rounded-r-md">
                                                        <div className="absolute top-0 -right-1 w-2 h-0.5 bg-purple-600" />
                                                        <div className="absolute bottom-0 -right-1 w-2 h-0.5 bg-purple-600" />
                                                    </div>
                                                    <div className="absolute top-[35%] right-[10%] -translate-y-1/2 w-5 h-5 rounded-full bg-purple-700 text-white text-[10px] font-black flex items-center justify-center shadow-md z-10">11</div>

                                                    {/* Line 12 Back Waist (Horizontal) */}
                                                    <div className="absolute top-[46%] left-[18%] right-[18%] border-t-2 border-dashed border-[#7C3AED]" />
                                                    <div className="absolute top-[46%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[#7C3AED] text-white text-[10px] font-black flex items-center justify-center shadow-md z-10">12</div>

                                                    {/* Line 13 Salwar / Bottom Length (VERTICAL line along leg) */}
                                                    <div className="absolute top-[52%] bottom-[16%] right-[28%] border-r-2 border-dashed border-emerald-600">
                                                        <div className="absolute top-0 -right-1 w-2.5 h-0.5 bg-emerald-600" />
                                                        <div className="absolute bottom-0 -right-1 w-2.5 h-0.5 bg-emerald-600" />
                                                    </div>
                                                    <div className="absolute top-[80%] right-[18%] -translate-y-1/2 w-5 h-5 rounded-full bg-emerald-600 text-white text-[10px] font-black flex items-center justify-center shadow-md z-10">13</div>
                                                </div>
                                            </div>
                                            <span className="text-[11px] font-bold text-purple-900 mt-2">Back View</span>
                                        </div>

                                    </div>
                                </div>

                                {/* Numbered Measurement List with Real Cropped Model Snippet Thumbnails */}
                                <div className="divide-y divide-slate-100 text-left pt-2">
                                    {measurementItems.map((item) => (
                                        <div key={item.id} className="py-3.5 flex items-center justify-between gap-3">
                                            <div className="flex items-start gap-3 min-w-0">
                                                <div className="w-7 h-7 rounded-full bg-[#7C3AED] text-white flex items-center justify-center text-xs font-black shrink-0 mt-0.5 shadow-2xs">
                                                    {item.id}
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-bold text-slate-900 leading-snug">
                                                        {item.title}
                                                    </h4>
                                                    <p className="text-xs text-slate-500 font-medium leading-relaxed mt-0.5">
                                                        {item.description}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Real Cropped Model Photo Thumbnail */}
                                            <div 
                                                className="w-20 h-16 rounded-xl border border-purple-200 shrink-0 relative shadow-2xs overflow-hidden bg-purple-50"
                                                style={{
                                                    backgroundImage: `url(${item.bgImage})`,
                                                    backgroundSize: item.bgSize,
                                                    backgroundPosition: item.bgPosition,
                                                    backgroundRepeat: 'no-repeat'
                                                }}
                                            >
                                                {/* Dashed Line & Badge Overlay tailored to lineType */}
                                                <div className="absolute inset-0 bg-purple-950/10 pointer-events-none flex items-center justify-center">
                                                    {item.lineType === 'vertical' ? (
                                                        <div className="h-full border-l-2 border-dashed border-emerald-500 relative flex items-center justify-center">
                                                            <div className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[9px] font-black flex items-center justify-center shadow-md">
                                                                {item.id}
                                                            </div>
                                                        </div>
                                                    ) : item.lineType === 'shoulder' ? (
                                                        <div className="w-[85%] border-t-2 border-dashed border-amber-500 relative flex items-center justify-center my-auto">
                                                            <div className="absolute -top-1 left-0 w-0.5 h-2 bg-amber-500" />
                                                            <div className="absolute -top-1 right-0 w-0.5 h-2 bg-amber-500" />
                                                            <div className="w-4 h-4 rounded-full bg-amber-600 text-white text-[9px] font-black flex items-center justify-center shadow-md">
                                                                {item.id}
                                                            </div>
                                                        </div>
                                                    ) : item.lineType === 'sleeve' ? (
                                                        <div className="h-full border-r-2 border-dashed border-purple-500 relative flex items-center justify-center mr-2">
                                                            <div className="w-4 h-4 rounded-full bg-purple-700 text-white text-[9px] font-black flex items-center justify-center shadow-md">
                                                                {item.id}
                                                            </div>
                                                        </div>
                                                    ) : item.lineType === 'armhole' ? (
                                                        <div className="h-[80%] border-r-2 border-dashed border-purple-500 rounded-r-md relative flex items-center justify-center mr-2">
                                                            <div className="w-4 h-4 rounded-full bg-purple-700 text-white text-[9px] font-black flex items-center justify-center shadow-md">
                                                                {item.id}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="w-full border-t-2 border-dashed border-[#7C3AED] relative flex items-center justify-center">
                                                            <div className="w-4 h-4 rounded-full bg-[#7C3AED] text-white text-[9px] font-black flex items-center justify-center shadow-md">
                                                                {item.id}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Save Your Measurements Card */}
                            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-purple-100 shadow-xs space-y-4 text-left">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <h3 className="font-extrabold text-[#1E1B4B] text-sm sm:text-base">
                                            Save Your Measurements
                                        </h3>
                                        <p className="text-xs text-slate-500 font-medium mt-0.5">
                                            Save once and use for all your future orders.
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            if (onSelectAddMeasurements) onSelectAddMeasurements();
                                            onClose();
                                        }}
                                        className="px-4 py-2.5 rounded-full bg-[#6B21A8] hover:bg-purple-900 active:scale-95 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-800/25 transition-all cursor-pointer whitespace-nowrap shrink-0"
                                    >
                                        <Plus size={15} className="stroke-[3]" />
                                        <span>Add My Measurements</span>
                                    </button>
                                </div>

                                {/* 3 Feature Highlights */}
                                <div className="grid grid-cols-3 gap-2.5 pt-2 border-t border-slate-100">
                                    <div className="bg-purple-50/40 rounded-2xl p-3 flex flex-col items-center text-center border border-purple-100/60">
                                        <div className="w-9 h-9 rounded-full bg-purple-100/80 text-[#7C3AED] flex items-center justify-center mb-1.5 shadow-2xs">
                                            <ShieldCheck size={18} />
                                        </div>
                                        <h4 className="text-xs font-extrabold text-slate-900 leading-tight">100% Private</h4>
                                        <p className="text-[10px] text-slate-500 mt-1 leading-tight font-medium">Your data is secure and confidential.</p>
                                    </div>

                                    <div className="bg-purple-50/40 rounded-2xl p-3 flex flex-col items-center text-center border border-purple-100/60">
                                        <div className="w-9 h-9 rounded-full bg-purple-100/80 text-[#7C3AED] flex items-center justify-center mb-1.5 shadow-2xs">
                                            <RotateCcw size={18} />
                                        </div>
                                        <h4 className="text-xs font-extrabold text-slate-900 leading-tight">Reusable</h4>
                                        <p className="text-[10px] text-slate-500 mt-1 leading-tight font-medium">Use these measurements for future orders.</p>
                                    </div>

                                    <div className="bg-purple-50/40 rounded-2xl p-3 flex flex-col items-center text-center border border-purple-100/60">
                                        <div className="w-9 h-9 rounded-full bg-purple-100/80 text-[#7C3AED] flex items-center justify-center mb-1.5 shadow-2xs">
                                            <Sparkles size={18} />
                                        </div>
                                        <h4 className="text-xs font-extrabold text-slate-900 leading-tight">Accurate Fit</h4>
                                        <p className="text-[10px] text-slate-500 mt-1 leading-tight font-medium">Tailors will stitch with perfect fit.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Need Help? Card */}
                            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-purple-100 shadow-xs text-left space-y-3">
                                <div>
                                    <h3 className="font-extrabold text-[#1E1B4B] text-sm sm:text-base">
                                        Need Help?
                                    </h3>
                                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                                        Our experts are here for you
                                    </p>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                                    <button
                                        onClick={() => setIsVideoOpen(true)}
                                        className="p-3.5 rounded-2xl border border-purple-100 bg-white hover:bg-purple-50/70 active:scale-95 transition-all text-left flex items-center sm:flex-col sm:items-start gap-2.5 cursor-pointer shadow-2xs group"
                                    >
                                        <div className="w-9 h-9 rounded-xl bg-purple-100 text-[#7C3AED] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                            <Play size={16} className="fill-[#7C3AED]" />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#7C3AED] transition-colors">Video Guide</h4>
                                            <p className="text-[10px] text-slate-500 leading-snug font-medium">Watch measurement video</p>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => window.open('https://wa.me/?text=Hi%20SewZella%20Support%2C%20I%20need%20help%20with%20body%20measurements', '_blank')}
                                        className="p-3.5 rounded-2xl border border-purple-100 bg-white hover:bg-purple-50/70 active:scale-95 transition-all text-left flex items-center sm:flex-col sm:items-start gap-2.5 cursor-pointer shadow-2xs group"
                                    >
                                        <div className="w-9 h-9 rounded-xl bg-purple-100 text-[#7C3AED] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                            <MessageSquare size={16} />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#7C3AED] transition-colors">Chat with Expert</h4>
                                            <p className="text-[10px] text-slate-500 leading-snug font-medium">Get help from our experts</p>
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => {
                                            if (onBookHomeVisit) onBookHomeVisit();
                                            onClose();
                                        }}
                                        className="p-3.5 rounded-2xl border border-purple-100 bg-white hover:bg-purple-50/70 active:scale-95 transition-all text-left flex items-center sm:flex-col sm:items-start gap-2.5 cursor-pointer shadow-2xs group"
                                    >
                                        <div className="w-9 h-9 rounded-xl bg-purple-100 text-[#7C3AED] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                            <Home size={16} />
                                        </div>
                                        <div>
                                            <h4 className="text-xs font-bold text-slate-900 group-hover:text-[#7C3AED] transition-colors">Book Home Measurement</h4>
                                            <p className="text-[10px] text-slate-500 leading-snug font-medium">Our expert will visit your home</p>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </>
                    )}

                    {/* TAB 2: PHOTO GUIDE */}
                    {activeTab === 'photo' && (
                        <div className="bg-white rounded-3xl p-5 border border-purple-100 shadow-xs space-y-4 text-left">
                            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                                <div className="w-10 h-10 rounded-2xl bg-purple-100 text-[#7C3AED] flex items-center justify-center shrink-0">
                                    <Camera size={20} />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-slate-900 text-base">Photo Measurement Guide</h3>
                                    <p className="text-xs text-slate-500">Upload clean posture photos for AI fit analysis</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-100 flex items-start gap-3">
                                    <Check className="text-emerald-600 stroke-[3] mt-0.5 shrink-0" size={16} />
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-900">Full Body Posture</h4>
                                        <p className="text-[11px] text-slate-600 mt-0.5">Stand straight against a plain background in fitted clothing.</p>
                                    </div>
                                </div>

                                <div className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-100 flex items-start gap-3">
                                    <Check className="text-emerald-600 stroke-[3] mt-0.5 shrink-0" size={16} />
                                    <div>
                                        <h4 className="text-xs font-bold text-slate-900">Good Lighting</h4>
                                        <p className="text-[11px] text-slate-600 mt-0.5">Ensure the room is well-lit so body contours are clear.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB 3: MEASUREMENT TIPS */}
                    {activeTab === 'tips' && (
                        <div className="bg-white rounded-3xl p-5 border border-purple-100 shadow-xs space-y-4 text-left">
                            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
                                <div className="w-10 h-10 rounded-2xl bg-purple-100 text-[#7C3AED] flex items-center justify-center shrink-0">
                                    <Lightbulb size={20} />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-slate-900 text-base">Pro Measurement Tips</h3>
                                    <p className="text-xs text-slate-500">Follow these steps to avoid sizing errors</p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="p-3 rounded-2xl border border-slate-100 bg-slate-50/50 flex gap-3 items-start">
                                    <span className="w-6 h-6 rounded-full bg-[#7C3AED] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">1</span>
                                    <p className="text-xs text-slate-700 font-medium">Use a soft, flexible cloth measuring tape rather than a metal ruler.</p>
                                </div>

                                <div className="p-3 rounded-2xl border border-slate-100 bg-slate-50/50 flex gap-3 items-start">
                                    <span className="w-6 h-6 rounded-full bg-[#7C3AED] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">2</span>
                                    <p className="text-xs text-slate-700 font-medium">Keep one finger behind the tape to ensure comfortable breathing room.</p>
                                </div>

                                <div className="p-3 rounded-2xl border border-slate-100 bg-slate-50/50 flex gap-3 items-start">
                                    <span className="w-6 h-6 rounded-full bg-[#7C3AED] text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">3</span>
                                    <p className="text-xs text-slate-700 font-medium">Measure over fitted undergarments or light clothes for accurate dimensions.</p>
                                </div>
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* Video Modal Overlay if Video Guide Clicked */}
            {isVideoOpen && (
                <div className="fixed inset-0 z-[10000] bg-black/80 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl relative p-4 text-center">
                        <button 
                            onClick={() => {
                                setIsVideoOpen(false);
                                setHasVideoError(false);
                            }}
                            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 hover:bg-slate-200 cursor-pointer z-10"
                        >
                            <X size={18} />
                        </button>
                        <h3 className="text-base font-bold text-slate-900 mb-3 pt-2">
                            {videoData?.title || "How to Measure Body Guide"}
                        </h3>
                        <div className="aspect-video w-full bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center relative shadow-inner">
                            {(() => {
                                const videoUrl = videoData?.content?.trim();
                                const youtubeEmbed = formatVideoEmbedUrl(videoUrl);

                                // Fallback iframe if video fails to load or no video content set
                                const renderFallback = () => (
                                    <iframe 
                                        className="w-full h-full"
                                        src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1" 
                                        title="Measurement Guide Video"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                        allowFullScreen
                                    />
                                );

                                if (hasVideoError || !videoUrl) {
                                    return renderFallback();
                                }

                                if (youtubeEmbed) {
                                    return (
                                        <iframe 
                                            className="w-full h-full"
                                            src={youtubeEmbed} 
                                            title={videoData?.title || "Measurement Guide Video"}
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                                            allowFullScreen
                                        />
                                    );
                                }

                                return (
                                    <video 
                                        src={videoUrl} 
                                        controls 
                                        autoPlay 
                                        onError={() => setHasVideoError(true)}
                                        className="w-full h-full object-contain"
                                    >
                                        Your browser does not support playing this video.
                                    </video>
                                );
                            })()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MeasurementGuideModal;
