import React, { useState, useEffect, useMemo } from 'react';
import { X, Play, Ruler, RotateCcw, ShieldCheck, CheckCircle2, Video, AlertCircle, Sparkles } from 'lucide-react';
import api from '../../../shared/utils/api';

const ExecutiveMeasurementGuideModal = ({ isOpen, onClose }) => {
    const [videoData, setVideoData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [hasVideoError, setHasVideoError] = useState(false);
    const [urlIndex, setUrlIndex] = useState(0);

    const fetchGuideVideo = async () => {
        setLoading(true);
        setHasVideoError(false);
        setUrlIndex(0);
        try {
            // Bust browser/redis caches so admin changes reflect immediately
            const res = await api.get(`/cms/content/measurement-guide-video?t=${Date.now()}`).catch(() => null);
            if (res?.data?.data && res.data.data.content) {
                setVideoData(res.data.data);
            } else {
                const listRes = await api.get(`/cms/content?type=video&t=${Date.now()}`).catch(() => null);
                if (listRes?.data?.data?.length > 0) {
                    setVideoData(listRes.data.data[0]);
                }
            }
        } catch (err) {
            console.error("Failed to fetch executive guide video:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchGuideVideo();
        }
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
        return null;
    };

    const rawUrl = videoData?.content?.trim() || '';
    const youtubeEmbed = formatVideoEmbedUrl(rawUrl);

    // Build intelligent candidate URL list (tries live production URL, local backend, and relative)
    const candidateUrls = useMemo(() => {
        if (!rawUrl || youtubeEmbed) return [];
        const list = [];
        
        let filename = rawUrl;
        if (rawUrl.includes('/uploads/')) {
            filename = rawUrl.split('/uploads/')[1];
        } else if (!rawUrl.startsWith('http')) {
            filename = rawUrl.replace(/^\/+/, '');
        }

        // 1. If rawUrl is full URL (e.g. https://sewzella.com/api/v1/uploads/...), use it first
        if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
            list.push(rawUrl);
        }

        // 2. Production URL
        list.push(`https://sewzella.com/api/v1/uploads/${filename}`);

        // 3. Localhost endpoints
        if (typeof window !== 'undefined') {
            const host = window.location.hostname;
            list.push(`http://${host}:5000/api/v1/uploads/${filename}`);
            list.push(`http://${host}:5000/uploads/${filename}`);
        }
        list.push(`http://localhost:5000/api/v1/uploads/${filename}`);
        list.push(`http://localhost:5000/uploads/${filename}`);

        return Array.from(new Set(list));
    }, [rawUrl, youtubeEmbed]);

    const currentUrl = candidateUrls[urlIndex] || rawUrl;

    const handleVideoError = (e) => {
        console.warn("Video failed from:", currentUrl);
        if (urlIndex + 1 < candidateUrls.length) {
            console.log("Trying fallback video URL:", candidateUrls[urlIndex + 1]);
            setUrlIndex(prev => prev + 1);
        } else {
            setHasVideoError(true);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-[28px] max-w-lg w-full overflow-hidden shadow-2xl relative flex flex-col max-h-[92vh]">
                {/* Header */}
                <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-purple-100 text-[#843D9B] flex items-center justify-center">
                            <Ruler size={16} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-gray-900 leading-tight">
                                {videoData?.title || "How to Measure Body Guide"}
                            </h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                Standard Executive Training
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors cursor-pointer"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Video Area */}
                <div className="p-4 bg-gray-50 flex-1 overflow-y-auto space-y-4">
                    <div className="aspect-video w-full bg-slate-950 rounded-2xl overflow-hidden relative shadow-inner flex items-center justify-center">
                        {loading ? (
                            <div className="text-center text-white/70 space-y-2 p-6">
                                <div className="w-8 h-8 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto" />
                                <p className="text-xs font-medium">Loading video guide...</p>
                            </div>
                        ) : !rawUrl ? (
                            <div className="p-6 text-center text-slate-400 space-y-2">
                                <AlertCircle size={28} className="mx-auto text-slate-500" />
                                <p className="text-xs font-semibold">No measurement guide video uploaded yet.</p>
                                <p className="text-[10px] text-slate-500">The admin will upload the training video in CMS.</p>
                            </div>
                        ) : youtubeEmbed ? (
                            <iframe
                                className="w-full h-full"
                                src={youtubeEmbed}
                                title={videoData?.title || "Measurement Guide Video"}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        ) : hasVideoError ? (
                            <div className="p-6 text-center text-white space-y-3">
                                <p className="text-xs text-red-300 font-medium">Video could not be played. Please check your internet connection.</p>
                                <button
                                    onClick={() => {
                                        setHasVideoError(false);
                                        setUrlIndex(0);
                                        fetchGuideVideo();
                                    }}
                                    className="px-4 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5"
                                >
                                    <RotateCcw size={12} /> Retry Video
                                </button>
                            </div>
                        ) : (
                            <video
                                key={currentUrl}
                                src={currentUrl}
                                controls
                                playsInline
                                webkit-playsinline="true"
                                x5-playsinline="true"
                                preload="metadata"
                                autoPlay
                                muted
                                controlsList="nodownload"
                                onError={handleVideoError}
                                className="w-full h-full object-contain"
                            >
                                Your device does not support playing this video.
                            </video>
                        )}
                    </div>

                    {/* Quick Tips Box */}
                    <div className="bg-white rounded-2xl p-4 border border-purple-100 shadow-sm space-y-2.5">
                        <div className="flex items-center gap-1.5 text-[#843D9B] font-bold text-xs">
                            <Sparkles size={14} />
                            <span>Executive Guidelines for Accurate Fit</span>
                        </div>
                        <ul className="text-[11px] text-gray-600 space-y-1.5 pl-1">
                            <li className="flex items-start gap-2">
                                <CheckCircle2 size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                                <span>Always keep the measuring tape horizontal and snug, not pulled too tight.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle2 size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                                <span>Measure bust at the fullest part, natural waist at the narrowest point, and hips around the fullest curve.</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <CheckCircle2 size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                                <span>Re-confirm length preferences (kurta, sleeves, pants) with the customer before submitting.</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-3 bg-white border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 px-5">
                    <span className="text-[10px] text-gray-400 font-medium">
                        Changes made in Admin CMS update here automatically
                    </span>
                    <button
                        onClick={onClose}
                        className="bg-[#843D9B] text-white text-[11px] font-black uppercase tracking-wider px-5 py-2 rounded-xl hover:bg-[#6B2F7E] transition-all cursor-pointer shadow-md shadow-[#843D9B]/20"
                    >
                        Got It
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExecutiveMeasurementGuideModal;
