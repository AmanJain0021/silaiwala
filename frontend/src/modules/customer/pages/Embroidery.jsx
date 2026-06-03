import React, { useState } from 'react';
import { 
    Feather, ChevronLeft, Star, Camera, Upload, 
    Clock, DollarSign, Palette, Sparkles, CheckCircle2,
    Heart, MessageSquare, ArrowRight, Info, Plus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import BottomNav from '../components/BottomNav';

import api from '../../../utils/api';

const DEFAULT_CATEGORIES = [
    { id: 1, name: 'Bridal Embroidery', icon: '👰' },
    { id: 2, name: 'Blouse Work', icon: '👚' },
    { id: 3, name: 'Neck Designs', icon: '🧶' },
    { id: 4, name: 'Sleeve Work', icon: '🧵' },
    { id: 5, name: 'Lehenga Work', icon: '👗' },
    { id: 6, name: 'Machine Embroidery', icon: '⚙️' },
    { id: 7, name: 'Hand Embroidery', icon: '✋' },
    { id: 8, name: 'Patch Work', icon: '🧩' },
    { id: 9, name: 'Lace & Latkan', icon: '🎐' },
    { id: 10, name: 'Mirror Work', icon: '🪞' }
];

const gallery = [
    { id: 1, title: 'Front Design', image: 'https://images.unsplash.com/photo-1589156280159-27698a70f29e?auto=format&fit=crop&q=80&w=400' },
    { id: 2, title: 'Back Detail', image: 'https://images.unsplash.com/photo-1590736704728-f4730bb30770?auto=format&fit=crop&q=80&w=400' },
    { id: 3, title: 'Sleeve Mastery', image: 'https://images.unsplash.com/photo-1589156191108-c762ff4b96ab?auto=format&fit=crop&q=80&w=400' },
    { id: 4, title: 'Full Outfit', image: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=400' }
];

const EmbroideryPage = () => {
    const navigate = useNavigate();
    const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
    const [selectedCategory, setSelectedCategory] = useState(DEFAULT_CATEGORIES[0]);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        dressType: '',
        instructions: ''
    });

    React.useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await api.get('/products/categories?type=embroidery');
                if (res.data.success && res.data.data.length > 0) {
                    const fetchedCategories = res.data.data.map(c => ({
                        id: c._id,
                        name: c.name,
                        icon: c.image || '✨'
                    }));
                    setCategories(fetchedCategories);
                    setSelectedCategory(fetchedCategories[0]);
                }
            } catch (error) {
                console.error("Error fetching embroidery categories:", error);
            }
        };
        fetchCategories();
    }, []);

    return (
        <div className="min-h-screen bg-[#F7F8FC] pb-32 font-sans selection:bg-[#2D2F6E] selection:text-white">
            {/* Header */}
            <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 px-4 py-4 pt-safe flex items-center gap-4">
                <button 
                    onClick={() => navigate(-1)}
                    className="p-2 -ml-2 rounded-full hover:bg-gray-100 text-gray-700 transition-all"
                >
                    <ChevronLeft size={24} />
                </button>
                <div className="flex-1">
                    <h1 className="text-lg font-black text-gray-900 leading-none">Embroidery Hub</h1>
                    <p className="text-[10px] text-[#2D2F6E] font-bold uppercase tracking-widest mt-1">Custom Art for your outfits</p>
                </div>
                <div className="w-10 h-10 rounded-2xl bg-[#2D2F6E] flex items-center justify-center text-[#E2C17D] shadow-lg shadow-[#2D2F6E]/20">
                    <Feather size={20} />
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 py-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* 1. Design Categories */}
                <section>
                    <div className="flex items-center justify-between mb-4 px-2">
                        <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] italic">Work Categories</h2>
                        <span className="text-[10px] font-bold text-[#2D2F6E]">Browse All</span>
                    </div>
                    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                        {categories.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setSelectedCategory(cat)}
                                className={`flex flex-col items-center gap-2 px-6 py-4 rounded-3xl transition-all shrink-0 border ${
                                    selectedCategory.id === cat.id 
                                    ? 'bg-[#2D2F6E] text-white border-[#2D2F6E] shadow-xl' 
                                    : 'bg-white text-gray-600 border-gray-100 shadow-sm'
                                }`}
                            >
                                <span className="text-2xl">{cat.icon}</span>
                                <span className="text-[10px] font-black uppercase tracking-wider whitespace-nowrap">{cat.name}</span>
                            </button>
                        ))}
                    </div>
                </section>

                {/* 2. Featured Designs Gallery */}
                <section>
                    <div className="flex items-center gap-2 mb-4 px-2">
                        <Palette size={16} className="text-[#2D2F6E]" />
                        <h2 className="text-xs font-black text-gray-900 uppercase tracking-widest">Design Gallery</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        {gallery.map((item) => (
                            <div key={item.id} className="group relative rounded-3xl overflow-hidden aspect-[4/5] bg-white border border-gray-100 shadow-sm">
                                <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                    <p className="text-white text-[10px] font-black uppercase tracking-widest">{item.title}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 3. Customization Options */}
                <section className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-indigo-50 rounded-xl text-[#2D2F6E]">
                            <Sparkles size={20} />
                        </div>
                        <h2 className="text-base font-black text-gray-900 uppercase tracking-tight">Your Custom Touch</h2>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {['Stone Work', 'Mirror Work', 'Zardozi', 'Silk Thread', 'Bead Work', 'Cut Work', 'Lace Work', 'Latkan'].map((opt) => (
                            <div key={opt} className="flex items-center gap-2 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                                <div className="w-5 h-5 rounded-lg bg-white border border-gray-200 flex items-center justify-center">
                                    <Plus size={12} className="text-gray-400" />
                                </div>
                                <span className="text-[10px] font-black text-gray-700 uppercase">{opt}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 4. Pricing Guide */}
                <section className="bg-[#2D2F6E] rounded-[2rem] p-6 text-white shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <DollarSign size={80} />
                    </div>
                    <div className="relative z-10">
                        <h2 className="text-xl font-black italic tracking-tighter mb-4 uppercase">Pricing Guide</h2>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-2 border-b border-white/10">
                                <span className="text-[11px] font-black uppercase tracking-widest">Basic Work</span>
                                <span className="text-sm font-black text-[#E2C17D]">Starts ₹499</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-white/10">
                                <span className="text-[11px] font-black uppercase tracking-widest">Heavy Bridal</span>
                                <span className="text-sm font-black text-[#E2C17D]">Starts ₹1499</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-white/10">
                                <span className="text-[11px] font-black uppercase tracking-widest">Custom Logo</span>
                                <span className="text-sm font-black text-[#E2C17D]">₹250 / Logo</span>
                            </div>
                        </div>
                        <p className="text-[8px] font-bold text-white/50 mt-4 uppercase tracking-[0.2em] italic text-center">* Pricing depends on thread density & materials used</p>
                    </div>
                </section>

                {/* 5. Order Request Form */}
                <section className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-green-50 rounded-xl text-green-600">
                            <MessageSquare size={20} />
                        </div>
                        <h2 className="text-base font-black text-gray-900 uppercase tracking-tight">Request Embroidery</h2>
                    </div>
                    <form className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Your Name</label>
                                <input type="text" placeholder="Muskan Singh" className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl text-sm focus:bg-white transition-all outline-none" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Phone Number</label>
                                <input type="tel" placeholder="+91 98765 43210" className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl text-sm focus:bg-white transition-all outline-none" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Dress Type</label>
                            <input type="text" placeholder="Bridal Lehenga, Party Blouse, etc." className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl text-sm focus:bg-white transition-all outline-none" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Special Instructions</label>
                            <textarea rows="3" placeholder="Specific colors, patterns, or urgent requirements..." className="w-full bg-gray-50 border border-gray-100 p-3 rounded-xl text-xs focus:bg-white transition-all outline-none resize-none"></textarea>
                        </div>
                        <div className="p-4 bg-indigo-50/50 border border-dashed border-indigo-200 rounded-2xl flex flex-col items-center gap-2 group cursor-pointer hover:bg-indigo-50 transition-all">
                            <Camera size={24} className="text-[#2D2F6E]" />
                            <p className="text-[10px] font-black text-[#2D2F6E] uppercase tracking-widest">Upload Reference Design</p>
                        </div>
                        <button className="w-full bg-[#2D2F6E] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-[#2D2F6E]/20 active:scale-[0.98] transition-all">
                            Send Request
                        </button>
                    </form>
                </section>

                {/* 6. Timeline */}
                <section className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-6 opacity-5">
                        <Clock size={100} />
                    </div>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                            <Clock size={20} />
                        </div>
                        <h2 className="text-base font-black text-gray-900 uppercase tracking-tight">Work Timeline</h2>
                    </div>
                    <div className="space-y-6 relative ml-4 border-l border-gray-100 pl-8">
                        <div className="relative">
                            <div className="absolute -left-10 top-0 w-4 h-4 bg-[#2D2F6E] rounded-full border-4 border-white shadow-sm" />
                            <h4 className="text-[11px] font-black text-gray-900 uppercase">Consultation</h4>
                            <p className="text-[10px] text-gray-400 font-bold">Within 24 Hours</p>
                        </div>
                        <div className="relative">
                            <div className="absolute -left-10 top-0 w-4 h-4 bg-gray-200 rounded-full border-4 border-white" />
                            <h4 className="text-[11px] font-black text-gray-900 uppercase">Fabric Sample & Prep</h4>
                            <p className="text-[10px] text-gray-400 font-bold">2-3 Working Days</p>
                        </div>
                        <div className="relative">
                            <div className="absolute -left-10 top-0 w-4 h-4 bg-gray-200 rounded-full border-4 border-white" />
                            <h4 className="text-[11px] font-black text-gray-900 uppercase">Embroidery Crafting</h4>
                            <p className="text-[10px] text-gray-400 font-bold">5-10 Days (Depends on heavy work)</p>
                        </div>
                    </div>
                </section>

                {/* 7. Before & After */}
                <section>
                    <div className="flex items-center gap-2 mb-4 px-2">
                        <Sparkles size={16} className="text-[#2D2F6E]" />
                        <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest italic">Transformation</h2>
                    </div>
                    <div className="bg-white rounded-[2rem] overflow-hidden border border-gray-100 shadow-sm flex flex-col sm:flex-row">
                        <div className="flex-1 relative aspect-square">
                            <img src="https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&q=80&w=400" className="w-full h-full object-cover" />
                            <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest">Plain Fabric</div>
                        </div>
                        <div className="flex-1 relative aspect-square">
                            <img src="https://images.unsplash.com/photo-1590736704728-f4730bb30770?auto=format&fit=crop&q=80&w=400" className="w-full h-full object-cover" />
                            <div className="absolute top-4 right-4 bg-[#2D2F6E] text-white px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest shadow-lg">Expert Finish</div>
                        </div>
                    </div>
                </section>

                {/* 8. Reviews */}
                <section>
                    <div className="flex items-center justify-between mb-4 px-2">
                        <h2 className="text-xs font-black text-gray-900 uppercase tracking-widest italic">Client Feedback</h2>
                        <div className="flex items-center gap-1">
                            <Star size={12} className="fill-amber-400 text-amber-400" />
                            <span className="text-[11px] font-black">4.9 (120+)</span>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {[1, 2].map((i) => (
                            <div key={i} className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden">
                                            <img src={`https://i.pravatar.cc/150?u=${i}`} className="w-full h-full object-cover" />
                                        </div>
                                        <h4 className="text-[10px] font-black uppercase tracking-widest">Priya Sharma</h4>
                                    </div>
                                    <div className="flex gap-0.5">
                                        {[1, 2, 3, 4, 5].map(s => <Star key={s} size={8} className="fill-amber-400 text-amber-400" />)}
                                    </div>
                                </div>
                                <p className="text-[10px] text-gray-500 font-medium leading-relaxed italic">"The hand embroidery on my wedding blouse was breathtaking. Every single stone was perfectly placed!"</p>
                            </div>
                        ))}
                    </div>
                </section>

                <p className="text-center text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] py-10 opacity-50">
                    Artistry by SewZella
                </p>
            </div>
            
            <BottomNav />
        </div>
    );
};

export default EmbroideryPage;
