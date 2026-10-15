import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2 } from 'lucide-react';
import api from '../../../utils/api';
import BottomNav from '../components/BottomNav';
import { sanitizeCmsHtml } from '../../../utils/formatHtml';

const CMSContentPage = () => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const [content, setContent] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchContent = async () => {
            setIsLoading(true);
            try {
                const res = await api.get(`/cms/content/${slug}`);
                if (res.data.success) {
                    setContent(res.data.data);
                }
            } catch (error) {
                console.error('Error fetching CMS content:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchContent();
    }, [slug]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#FDFBFD]">
                <div className="w-10 h-10 border-4 border-purple-100 border-t-[#843D9B] rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!content) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center font-['Plus_Jakarta_Sans',sans-serif]">
                <h2 className="text-xl font-bold text-gray-900">Document Not Found</h2>
                <p className="text-xs text-gray-500 mt-1 mb-4">The policy you requested is not available.</p>
                <button 
                    onClick={() => navigate(-1)} 
                    className="px-6 py-2.5 bg-[#843D9B] text-white rounded-full font-semibold text-xs shadow-xs hover:bg-[#723287] transition-colors"
                >
                    Go Back
                </button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFBFD] pb-24 font-['Plus_Jakarta_Sans',sans-serif] overflow-x-hidden">
            {/* Header */}
            <div className="relative bg-gradient-to-br from-[#843D9B] via-[#742b8b] to-[#511364] pt-8 pb-24 px-4 sm:px-6 text-white overflow-hidden shrink-0 shadow-lg shadow-purple-900/10">
                <div className="relative z-10 max-w-4xl mx-auto flex items-center justify-between mb-4">
                    <button 
                        onClick={() => navigate(-1)} 
                        className="p-2 -ml-1 text-white hover:bg-white/10 rounded-full transition-colors"
                        aria-label="Back"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-sm font-semibold tracking-wide uppercase text-purple-200">
                        Official Legal Policy
                    </h1>
                    <button 
                        onClick={() => {
                            if (navigator.share) {
                                navigator.share({ title: content.title, url: window.location.href }).catch(console.error);
                            } else {
                                navigator.clipboard.writeText(window.location.href);
                                alert('Link copied to clipboard!');
                            }
                        }}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white backdrop-blur-md transition-colors"
                        aria-label="Share"
                    >
                        <Share2 size={16} />
                    </button>
                </div>

                <div className="relative z-10 max-w-4xl mx-auto mt-2 bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 flex items-center gap-3.5">
                    <div className="h-10 w-10 bg-white rounded-xl flex items-center justify-center text-[#843D9B] shadow-sm shrink-0 font-bold text-xs">
                        DOC
                    </div>
                    <div className="min-w-0">
                        <p className="text-[10px] font-semibold text-purple-200 uppercase tracking-wider">SewZella Compliance</p>
                        <p className="text-sm sm:text-base font-bold text-white truncate">{content.title}</p>
                    </div>
                </div>
            </div>

            {/* Content Body */}
            <div className="px-3.5 sm:px-6 -mt-10 relative z-20 max-w-4xl mx-auto w-full overflow-hidden">
                <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-7 md:p-9 shadow-xs border border-purple-100/70 w-full max-w-full overflow-hidden">
                    <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
                        <div className="w-1.5 h-3.5 bg-[#843D9B] rounded-full" />
                        <h3 className="text-xs font-semibold text-gray-700 tracking-wide">
                            {content.title}
                        </h3>
                    </div>

                    <div
                        className="cms-content-render w-full max-w-full overflow-hidden break-words [overflow-wrap:anywhere] [word-break:break-word]
                                   text-[13.5px] sm:text-[14.5px] leading-[1.75] text-slate-700"
                        dangerouslySetInnerHTML={{ __html: sanitizeCmsHtml(content.content) }}
                    />

                    {!['privacy-policy', 'terms-of-service', 'terms-and-conditions'].includes(slug) && (
                        <div className="mt-8 pt-5 border-t border-gray-100 flex flex-col items-center text-center">
                            <p className="text-[11px] font-medium text-slate-400">
                                Last Updated: {new Date(content.updatedAt || Date.now()).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                                <br />
                                © SewZella Digital Tailoring Platform
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {!['privacy-policy', 'terms-of-service', 'terms-and-conditions'].includes(slug) && (
                <BottomNav />
            )}

            <style dangerouslySetInnerHTML={{
                __html: `
                .cms-content-render h1 {
                    font-size: 1.35rem;
                    line-height: 1.3;
                    font-weight: 700;
                    color: #0f172a;
                    margin-top: 1.25rem;
                    margin-bottom: 0.75rem;
                    letter-spacing: -0.015em;
                }
                .cms-content-render h1:first-child {
                    margin-top: 0;
                }
                .cms-content-render h2 {
                    font-size: 1.15rem;
                    line-height: 1.35;
                    font-weight: 600;
                    color: #843D9B;
                    margin-top: 1.5rem;
                    margin-bottom: 0.5rem;
                    letter-spacing: -0.01em;
                }
                .cms-content-render h3 {
                    font-size: 1rem;
                    line-height: 1.4;
                    font-weight: 600;
                    color: #1e293b;
                    margin-top: 1.25rem;
                    margin-bottom: 0.5rem;
                }
                .cms-content-render p {
                    margin-bottom: 0.85rem;
                    line-height: 1.75;
                    color: #334155;
                }
                .cms-content-render strong, .cms-content-render b {
                    color: #0f172a;
                    font-weight: 600;
                }
                .cms-content-render ul {
                    list-style-type: disc;
                    padding-left: 1.25rem;
                    margin-bottom: 1rem;
                }
                .cms-content-render ol {
                    list-style-type: decimal;
                    padding-left: 1.25rem;
                    margin-bottom: 1rem;
                }
                .cms-content-render li {
                    color: #334155;
                    line-height: 1.65;
                    margin-bottom: 0.35rem;
                }
                .cms-content-render li::marker {
                    color: #843D9B;
                }
                @media (min-width: 640px) {
                    .cms-content-render h1 {
                        font-size: 1.55rem;
                    }
                    .cms-content-render h2 {
                        font-size: 1.25rem;
                    }
                }
            `}} />
        </div>
    );
};

export default CMSContentPage;
