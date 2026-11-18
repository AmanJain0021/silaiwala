// Port of modules/measurement-executive/components/ExecutiveMeasurementGuideModal.jsx (converted with scripts/web2rn.js, then reviewed)
import { Dialog, Sheet } from '../../components/ui/Sheet';
import Spin from '../../components/ui/Spin';
import React, { useState, useEffect, useMemo } from "react";
import { X, Play, Ruler, RotateCcw, ShieldCheck, CheckCircle2, Video, AlertCircle, Sparkles } from "lucide-react-native";
import api from "../../lib/api";
import { WebView } from 'react-native-webview';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useEvent } from 'expo';
import { Box, I, Txt, Btn, Scroll } from '../ui/primitives';
const GuideVideo = ({
  uri,
  onError
}) => {
  const player = useVideoPlayer(uri, p => {
    p.muted = true;
    p.play();
  });
  const {
    status
  } = useEvent(player, 'statusChange', {
    status: player.status
  });
  useEffect(() => {
    if (status === 'error') onError?.();
  }, [status, onError]);
  return <VideoView player={player} style={{
    width: '100%',
    height: '100%'
  }} contentFit="contain" nativeControls allowsFullscreen />;
};
const ExecutiveMeasurementGuideModal = ({
  isOpen,
  onClose
}) => {
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
  const formatVideoEmbedUrl = rawUrl => {
    if (!rawUrl || typeof rawUrl !== 'string') return null;
    const url = rawUrl.trim();
    const lowerUrl = url.toLowerCase();
    if (lowerUrl.includes('youtube.com/watch')) {
      const videoId = url.match(/[?&]v=([^&#]+)/)?.[1];
      if (videoId) return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`;
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

    return Array.from(new Set(list));
  }, [rawUrl, youtubeEmbed]);
  const currentUrl = candidateUrls[urlIndex] || rawUrl;
  const handleVideoError = e => {
    console.warn("Video failed from:", currentUrl);
    if (urlIndex + 1 < candidateUrls.length) {
      console.log("Trying fallback video URL:", candidateUrls[urlIndex + 1]);
      setUrlIndex(prev => prev + 1);
    } else {
      setHasVideoError(true);
    }
  };
    return <Dialog visible={!!(isOpen)} onClose={onClose} className={`bg-white rounded-[28px] max-w-lg w-full overflow-hidden shadow-2xl relative flex flex-col h-[88vh]`}>
<Box className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <Box className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-gray-100">
                    <Box className="flex items-center gap-2">
                        <Box className="w-8 h-8 rounded-full bg-purple-100 text-[#843D9B] flex items-center justify-center">
                            <I icon={Ruler} size={16} />
                        </Box>
                        <Box>
                            <Txt className="text-sm font-black text-gray-900 leading-tight">
                                {videoData?.title || "How to Measure Body Guide"}
                            </Txt>
                            <Txt className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                Standard Executive Training
                            </Txt>
                        </Box>
                    </Box>
                    <Btn onPress={onClose} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 transition-colors cursor-pointer">
                        <I icon={X} size={16} />
                    </Btn>
                </Box>

                {/* Video Area */}
                <Scroll contentClassName="p-4 space-y-4" className="bg-gray-50 flex-1" nestedScrollEnabled>
                    <Box className="aspect-video w-full bg-slate-950 rounded-2xl overflow-hidden relative shadow-inner flex items-center justify-center">
                        {loading ? <Box className="text-center text-white/70 space-y-2 p-6">
                                <Spin size={32} className="text-purple-400" />
                                <Txt className="text-xs font-medium">Loading video guide...</Txt>
                            </Box> : !rawUrl ? <Box className="p-6 text-center text-slate-400 space-y-2">
                                <I icon={AlertCircle} size={28} className="mx-auto text-slate-500" />
                                <Txt className="text-xs font-semibold">No measurement guide video uploaded yet.</Txt>
                                <Txt className="text-[10px] text-slate-500">The admin will upload the training video in CMS.</Txt>
                            </Box> : youtubeEmbed ? <WebView style={{
              width: '100%',
              height: '100%',
              backgroundColor: '#020617'
            }} source={{
              uri: youtubeEmbed
            }} allowsFullscreenVideo mediaPlaybackRequiresUserAction={false} javaScriptEnabled /> : hasVideoError ? <Box className="p-6 text-center text-white space-y-3">
                                <Txt className="text-xs text-red-300 font-medium">Video could not be played. Please check your internet connection.</Txt>
                                <Btn onPress={() => {
              setHasVideoError(false);
              setUrlIndex(0);
              fetchGuideVideo();
            }} className="px-4 py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-xl text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5">
                                    <I icon={RotateCcw} size={12} /> Retry Video
                                </Btn>
                            </Box> : <GuideVideo key={currentUrl} uri={currentUrl} onError={handleVideoError} />}
                    </Box>

                    {/* Quick Tips Box */}
                    <Box className="bg-white rounded-2xl p-4 border border-purple-100 shadow-sm space-y-2.5">
                        <Box className="flex items-center gap-1.5 text-[#843D9B] font-bold text-xs">
                            <I icon={Sparkles} size={14} />
                            <Txt>Executive Guidelines for Accurate Fit</Txt>
                        </Box>
                        <Box className="text-[11px] text-gray-600 space-y-1.5 pl-1">
                            <Box className="flex items-start gap-2">
                                <I icon={CheckCircle2} size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                                <Txt>Always keep the measuring tape horizontal and snug, not pulled too tight.</Txt>
                            </Box>
                            <Box className="flex items-start gap-2">
                                <I icon={CheckCircle2} size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                                <Txt>Measure bust at the fullest part, natural waist at the narrowest point, and hips around the fullest curve.</Txt>
                            </Box>
                            <Box className="flex items-start gap-2">
                                <I icon={CheckCircle2} size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                                <Txt>Re-confirm length preferences (kurta, sleeves, pants) with the customer before submitting.</Txt>
                            </Box>
                        </Box>
                    </Box>
                </Scroll>

                {/* Footer */}
                <Box className="p-3 bg-white border-t border-gray-100 flex items-center justify-between text-xs text-gray-500 px-5">
                    <Txt className="text-[10px] text-gray-400 font-medium">
                        Changes made in Admin CMS update here automatically
                    </Txt>
                    <Btn onPress={onClose} className="bg-[#843D9B] text-white text-[11px] font-black uppercase tracking-wider px-5 py-2 rounded-xl hover:bg-[#6B2F7E] transition-all cursor-pointer shadow-md shadow-[#843D9B]/20">
                        Got It
                    </Btn>
                </Box>
            </Box>
</Dialog>;
};
export default ExecutiveMeasurementGuideModal;
