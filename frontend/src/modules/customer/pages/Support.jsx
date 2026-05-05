import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Headset, MessageCircle, Phone, Mail, ChevronRight, HelpCircle } from 'lucide-react';
import BottomNav from '../components/BottomNav';
import api from '../../../utils/api';

const FAQItem = ({ item }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-3 shadow-sm transition-all hover:shadow-md">
            <button
                className="w-full flex justify-between items-center p-4 text-left group"
                onClick={() => setIsOpen(!isOpen)}
            >
                <span className="text-xs font-bold text-gray-800 group-hover:text-primary transition-colors">{item.title}</span>
                <span className={`text-gray-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
                    <ChevronRight size={16} />
                </span>
            </button>
            {isOpen && (
                <div className="px-4 pb-5 pt-0 animate-in fade-in slide-in-from-top-1 duration-300">
                    <div className="text-[11px] text-gray-500 leading-relaxed font-medium border-t border-gray-50 pt-3" dangerouslySetInnerHTML={{ __html: item.content }} />
                </div>
            )}
        </div>
    );
};

const Support = () => {
    const navigate = useNavigate();
    const [faqs, setFaqs] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchFaqs = async () => {
            try {
                const res = await api.get('/cms/content?type=faq');
                if (res.data.success) {
                    setFaqs(res.data.data);
                }
            } catch (error) {
                console.error('Error fetching FAQs:', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchFaqs();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 pb-24 font-sans">
            {/* Header */}
            <div className="bg-primary px-5 pt-8 pb-16 rounded-b-[3.5rem] relative shrink-0 shadow-2xl shadow-green-900/10">
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full bg-white/10 text-white backdrop-blur-md hover:bg-white/20 transition-all">
                        <ArrowLeft size={22} />
                    </button>
                    <h1 className="text-xl font-black text-white tracking-tight">Help & Support</h1>
                </div>

                <div className="bg-[#2a4d44] backdrop-blur-md border border-white/5 rounded-[2rem] p-6 flex items-center gap-5 shadow-inner">
                    <div className="h-16 w-16 bg-white rounded-2xl flex items-center justify-center text-primary shadow-2xl relative">
                         <div className="absolute -inset-1 bg-white/20 rounded-2xl blur-sm" />
                         <Headset size={32} className="relative z-10" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-white/50 uppercase tracking-[0.2em]">Available 24/7</p>
                        <p className="text-base font-black text-white leading-tight">How can we help<br />you today?</p>
                    </div>
                </div>
            </div>

            <div className="max-w-md mx-auto px-5 -mt-6 space-y-8">
                {/* Contact Options */}
                <div className="grid grid-cols-2 gap-4">
                    <button className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col items-center text-center group hover:bg-primary transition-all duration-500">
                        <div className="h-12 w-12 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-4 group-hover:bg-white/20 group-hover:text-white transition-all transform group-hover:scale-110">
                            <MessageCircle size={24} />
                        </div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-white/60">WhatsApp</p>
                        <p className="text-sm font-black text-gray-900 mt-1 group-hover:text-white tracking-tight">Chat Now</p>
                    </button>
                    <button className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col items-center text-center group hover:bg-primary transition-all duration-500">
                        <div className="h-12 w-12 bg-indigo-50 text-primary rounded-2xl flex items-center justify-center mb-4 group-hover:bg-white/20 group-hover:text-white transition-all transform group-hover:scale-110">
                            <Phone size={24} />
                        </div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest group-hover:text-white/60">Call Us</p>
                        <p className="text-sm font-black text-gray-900 mt-1 group-hover:text-white tracking-tight">Helpline</p>
                    </button>
                </div>

                {/* FAQ Section */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-2 px-1">
                        <div className="p-1 px-1.5 bg-primary rounded text-white italic">
                            <HelpCircle size={10} strokeWidth={3} />
                        </div>
                        <h3 className="text-[11px] font-black text-gray-900 uppercase tracking-[0.2em] italic">Common Questions</h3>
                    </div>
                    
                    {isLoading ? (
                        [1, 2, 3].map(i => (
                            <div key={i} className="h-20 w-full bg-white rounded-[1.5rem] border border-gray-50 animate-pulse" />
                        ))
                    ) : faqs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-[2.5rem] border border-gray-50 shadow-sm animate-in zoom-in duration-500">
                            <p className="text-xl font-black text-gray-200 uppercase tracking-[0.3em] italic">No FAQs Found</p>
                        </div>
                    ) : (
                        faqs.map(faq => <FAQItem key={faq._id} item={faq} />)
                    )}
                </div>

                {/* Email Support */}
                <div className="bg-primary/[0.02] rounded-[2.5rem] p-8 border border-gray-100 flex flex-col items-center text-center group hover:bg-white hover:shadow-xl transition-all duration-500">
                    <div className="h-14 w-14 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm mb-4 group-hover:scale-110 transition-transform">
                        <Mail size={28} />
                    </div>
                    <h4 className="text-base font-black text-gray-900 tracking-tight italic uppercase">Still have questions?</h4>
                    <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mt-2 mb-6">Email us and we'll get back<br />to you within 24 hours.</p>
                    <a href="mailto:support@tailorapp.com" className="px-8 py-3 bg-primary text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg shadow-green-900/20 hover:scale-105 transition-transform">
                        support@tailorapp.com
                    </a>
                </div>
            </div>

            <BottomNav />
        </div>
    );
};

export default Support;
