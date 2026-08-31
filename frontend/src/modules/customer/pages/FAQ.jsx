import React, { useEffect, useState } from 'react';
import { ArrowLeft, HelpCircle, ChevronRight, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../../utils/api';
import BottomNav from '../components/BottomNav';

const FAQItem = ({ item }) => {
    const [open, setOpen] = useState(false);
    return (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <button
                type="button"
                className="w-full flex justify-between items-center p-4 text-left cursor-pointer hover:bg-gray-50/80 transition-colors"
                onClick={() => setOpen(!open)}
            >
                <span className="text-xs font-bold text-gray-800 pr-3">{item.title}</span>
                <ChevronRight
                    size={16}
                    className={`text-gray-400 shrink-0 transition-transform ${open ? 'rotate-90' : ''}`}
                />
            </button>
            {open && (
                <div
                    className="px-4 pb-4 text-[11px] text-gray-600 leading-relaxed border-t border-gray-50 pt-3"
                    dangerouslySetInnerHTML={{ __html: item.content }}
                />
            )}
        </div>
    );
};

const FAQ = () => {
    const navigate = useNavigate();
    const [faqs, setFaqs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await api.get('/cms/content?type=faq&category=customer');
                const list = res.data?.data || [];
                setFaqs(list.length > 0 ? list : []);
                if (list.length === 0) {
                    const all = await api.get('/cms/content?type=faq');
                    setFaqs(all.data?.data || []);
                }
            } catch {
                setFaqs([]);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    return (
        <div className="min-h-screen bg-[#F8F9FB] pb-24 font-sans">
            <div className="sticky top-0 z-50 bg-[#843D9B] px-4 py-4 flex items-center gap-3 text-white shadow-md">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="p-2 -ml-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
                >
                    <ArrowLeft size={20} />
                </button>
                <h1 className="text-sm font-black tracking-tight">Help &amp; FAQs</h1>
            </div>

            <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
                <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-purple-50 text-[#843D9B] flex items-center justify-center">
                        <HelpCircle size={22} />
                    </div>
                    <div>
                        <h2 className="text-sm font-bold text-gray-900">Frequently asked questions</h2>
                        <p className="text-[11px] text-gray-500 mt-0.5">Find quick answers about orders, stitching &amp; delivery</p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center py-16 text-gray-400 gap-2 text-xs font-bold">
                        <Loader2 size={18} className="animate-spin" /> Loading FAQs…
                    </div>
                ) : faqs.length === 0 ? (
                    <div className="text-center py-12 px-4 bg-white rounded-2xl border border-gray-100">
                        <p className="text-sm font-bold text-gray-700 mb-2">No FAQs published yet</p>
                        <p className="text-xs text-gray-500 mb-4">Contact support for help with your order.</p>
                        <button
                            type="button"
                            onClick={() => navigate('/user/support')}
                            className="px-5 py-2.5 rounded-xl bg-[#843D9B] text-white text-xs font-bold cursor-pointer"
                        >
                            Go to Support
                        </button>
                    </div>
                ) : (
                    <div className="space-y-2.5">
                        {faqs.map((faq) => (
                            <FAQItem key={faq._id || faq.slug} item={faq} />
                        ))}
                    </div>
                )}

                <button
                    type="button"
                    onClick={() => navigate('/user/support')}
                    className="w-full py-3.5 rounded-xl border border-[#843D9B]/20 bg-white text-sm font-bold text-[#843D9B] hover:bg-purple-50 transition-colors cursor-pointer"
                >
                    Still need help? Contact Support
                </button>
            </div>

            <BottomNav />
        </div>
    );
};

export default FAQ;
