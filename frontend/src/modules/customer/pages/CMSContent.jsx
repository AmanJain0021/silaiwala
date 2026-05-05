import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2 } from 'lucide-react';
import api from '../../../utils/api';
import BottomNav from '../components/BottomNav';

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
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!content) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
                <h2 className="text-xl font-bold text-gray-900">Content Not Found</h2>
                <button onClick={() => navigate(-1)} className="mt-4 text-primary font-black uppercase tracking-widest text-xs">Go Back</button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-24 font-sans">
            {/* Curved Header */}
            <div className="relative bg-primary pt-8 pb-32 px-5 text-white overflow-hidden shrink-0 shadow-xl shadow-indigo-900/10">
                <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
                    <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full fill-white">
                        <path d="M0,100 C40,80 60,0 100,0 L100,100 Z" />
                    </svg>
                </div>

                <div className="relative z-10 flex items-center justify-between mb-2">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-white hover:bg-white/10 rounded-full transition-colors">
                        <ArrowLeft size={22} />
                    </button>
                    <h1 className="text-lg font-black tracking-tight absolute left-1/2 -translate-x-1/2 uppercase italic">
                        Legal
                    </h1>
                    <button className="p-2 bg-white/10 rounded-full text-white backdrop-blur-md">
                        <Share2 size={18} />
                    </button>
                </div>

                <div className="relative z-10 mt-6 bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 flex items-center gap-4">
                    <div className="h-12 w-12 bg-white rounded-xl flex items-center justify-center text-primary shadow-xl">
                        <div className="p-2 bg-gray-50 rounded-lg">
                            <span className="text-xs font-black uppercase tracking-tighter">PDF</span>
                        </div>
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">Official Document</p>
                        <p className="text-sm font-black text-white">{content.title}</p>
                    </div>
                </div>

                <div className="absolute -bottom-1 left-0 w-full leading-none">
                    <svg className="w-full h-16 text-gray-50 fill-current" viewBox="0 0 100 20" preserveAspectRatio="none">
                        <path d="M0,20 C30,0 70,0 100,20 L100,20 L0,20 Z" />
                    </svg>
                </div>
            </div>

            {/* Content Body */}
            <div className="px-5 -mt-10 relative z-20">
                <div className="bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center gap-2 mb-6 px-1">
                        <div className="w-1 h-4 bg-primary rounded-full" />
                        <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-[0.2em] italic">Terms & Content</h3>
                    </div>

                    <div
                        className="prose prose-sm max-w-none text-gray-600 leading-relaxed font-medium cms-content-render"
                        dangerouslySetInnerHTML={{ __html: content.content }}
                    />

                    <div className="mt-12 pt-6 border-t border-gray-100 flex flex-col items-center text-center">
                        <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                            <ArrowLeft size={16} className="text-gray-400" />
                        </div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-loose">
                            Last Updated: {new Date(content.updatedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                            <br />
                            © Silaiwala Partner Network
                        </p>
                    </div>
                </div>
            </div>

            <BottomNav />

            <style dangerouslySetInnerHTML={{
                __html: `
                .cms-content-render h1, .cms-content-render h2, .cms-content-render h3 {
                    color: #2D2F6E;
                    font-weight: 900;
                    margin-top: 1.5em;
                    margin-bottom: 0.5em;
                    text-transform: uppercase;
                    letter-spacing: -0.02em;
                }
                .cms-content-render p {
                    margin-bottom: 1em;
                }
                .cms-content-render ul {
                    list-style-type: none;
                    padding-left: 0;
                }
                .cms-content-render li {
                    position: relative;
                    padding-left: 1.5rem;
                    margin-bottom: 0.5rem;
                }
                .cms-content-render li::before {
                    content: "";
                    position: absolute;
                    left: 0;
                    top: 0.6rem;
                    width: 0.5rem;
                    height: 1px;
                    background: #2D2F6E;
                }
            `}} />
        </div>
    );
};

export default CMSContentPage;
