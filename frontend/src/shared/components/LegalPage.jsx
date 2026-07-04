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
        <div className="min-h-screen bg-white font-sans pb-20">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
                <div className="max-w-3xl mx-auto px-4 h-16 flex items-center gap-4">
                    <button 
                        onClick={() => navigate(-1)} 
                        className="p-2 -ml-2 text-gray-500 hover:text-gray-900 rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-lg font-black text-gray-900 tracking-tight flex-1 truncate">
                        {content ? content.title : fallbackTitle}
                    </h1>
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
                    <div className="prose prose-sm sm:prose-base max-w-none prose-headings:font-black prose-headings:tracking-tight prose-a:text-[#843D9B] text-gray-700 leading-relaxed">
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
