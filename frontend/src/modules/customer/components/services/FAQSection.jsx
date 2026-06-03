import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import api from '../../../../utils/api';

const FAQSection = () => {
    const [faqs, setFaqs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [openIndex, setOpenIndex] = useState(null);

    useEffect(() => {
        const fetchFaqs = async () => {
            try {
                const res = await api.get('/cms/content?type=faq&category=customer');
                if (res.data.success) {
                    setFaqs(res.data.data);
                }
            } catch (error) {
                if (error.name !== 'CanceledError' && error.code !== 'ERR_CANCELED') {
                    console.error('Error fetching FAQs:', error);
                }
            } finally {
                setIsLoading(false);
            }
        };
        fetchFaqs();
    }, []);

    if (isLoading) return null;
    if (faqs.length === 0) return null;

    return (
        <div className="px-4 py-8 pb-24">
            <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-primary/10 rounded-lg">
                    <HelpCircle size={18} className="text-primary" />
                </div>
                <div>
                    <h2 className="text-lg font-black text-gray-900 tracking-tight">Need Help?</h2>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Frequently Asked Questions</p>
                </div>
            </div>

            <div className="space-y-3">
                {faqs.map((item, index) => (
                    <div key={item._id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm transition-all hover:shadow-md">
                        <button
                            className="w-full flex justify-between items-center p-4 text-left group"
                            onClick={() => setOpenIndex(openIndex === index ? null : index)}
                        >
                            <span className="text-xs font-bold text-gray-800 group-hover:text-primary transition-colors">{item.title}</span>
                            <div className={`p-1 rounded-lg transition-colors ${openIndex === index ? 'bg-primary/10 text-primary' : 'bg-gray-50 text-gray-400'}`}>
                                {openIndex === index ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                            </div>
                        </button>
                        {openIndex === index && (
                            <div className="px-4 pb-5 pt-0 animate-in fade-in slide-in-from-top-1 duration-300">
                                <div className="text-[11px] text-gray-500 leading-relaxed font-medium border-t border-gray-50 pt-3" dangerouslySetInnerHTML={{ __html: item.content }} />
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FAQSection;
