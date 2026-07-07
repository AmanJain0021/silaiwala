import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
import api from '../../utils/api';

const LegalPage = ({ type: propType, category, fallbackTitle = "Legal Document" }) => {
    const { type: paramType } = useParams();
    const type = propType || paramType;
    const navigate = useNavigate();
    const [content, setContent] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchContent = async () => {
            try {
                // Fetch the legal content based on type (e.g. privacy-policy) and category
                const res = await api.get(`/cms/content?type=legal&category=${category}`);
                const data = res.data.data;
                // Find exact match for the slug or just pick the first legal one
                const match = data.find(item => item.slug === type);
                
                if (match) {
                    setContent(match);
                } else if (data.length > 0) {
                    // Fallback to first if slug matching fails (in case admin didn't use slug)
                    setContent(data.find(item => item.title.toLowerCase().includes(type.split('-')[0])) || data[0]);
                }
                setLoading(false);
            } catch (error) {
                if (error?.name === 'CanceledError' || error?.message?.includes('cancel') || error?.code === 'ERR_CANCELED') {
                    return; // Ignore canceled requests
                }
                console.error("Error fetching legal content:", error);
                setLoading(false);
            }
        };
        fetchContent();
    }, [type, category]);

    return (
        <div className="min-h-screen bg-white font-sans pb-20 overflow-x-hidden w-full">
            {/* Header */}
            <div className="bg-gradient-to-br from-[#2D2F6F] to-[#843D9B] text-white pt-10 pb-6 px-4 sticky top-0 z-50 shadow-lg">
                <div className="max-w-3xl mx-auto flex items-center gap-4">
                    <button 
                        onClick={() => navigate(-1)} 
                        className="p-2 -ml-2 rounded-full bg-white/10 hover:bg-white/20 transition-all backdrop-blur-sm"
                    >
                        <ArrowLeft size={20} className="text-white" />
                    </button>
                    <div>
                        <h1 className="text-xl font-black tracking-tight">{content ? content.title : fallbackTitle}</h1>
                        <p className="text-xs text-indigo-100 font-medium mt-0.5">Legal & Policies</p>
                    </div>
                </div>
            </div>

            {/* Content Body */}
            <div className="max-w-3xl mx-auto px-5 py-8">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 text-gray-400">
                        <Loader2 className="w-8 h-8 animate-spin mb-4 text-[#843D9B]" />
                        <p className="text-sm font-bold uppercase tracking-widest">Loading Document...</p>
                    </div>
                ) : content ? (
                    <div className="w-full break-words max-w-none text-gray-700 leading-relaxed 
                                    [&_h1]:text-2xl [&_h1]:font-black [&_h1]:mb-4 [&_h1]:mt-8 [&_h1]:text-gray-900
                                    [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-3 [&_h2]:mt-6 [&_h2]:text-gray-900
                                    [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-gray-900
                                    [&_p]:mb-4 [&_p]:text-[15px] [&_p]:whitespace-normal [&_p]:break-words
                                    [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-4 [&_ul]:space-y-1 [&_ul]:whitespace-normal
                                    [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-4 [&_ol]:space-y-1 [&_ol]:whitespace-normal
                                    [&_a]:text-[#843D9B] [&_a]:underline [&_a]:font-medium [&_a]:break-words
                                    [&_strong]:font-bold [&_strong]:text-gray-900
                                    [&_b]:font-bold [&_b]:text-gray-900
                                    [&_*]:max-w-full">
                        <div dangerouslySetInnerHTML={{ __html: content.content }} />
                    </div>
                ) : (
                    <div className="text-center py-32">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                            <ArrowLeft size={24} className="text-gray-300" />
                        </div>
                        <h2 className="text-xl font-black text-gray-900 mb-2">Document Not Found</h2>
                        <p className="text-gray-500 text-sm font-medium">The legal document you are looking for has not been published yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default LegalPage;
