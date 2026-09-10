import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    ArrowLeft, 
    Headphones, 
    Phone, 
    Mail, 
    Copy, 
    Check, 
    Clock, 
    PhoneCall, 
    ShieldCheck, 
    Sparkles, 
    Search, 
    X, 
    ChevronDown, 
    HelpCircle, 
    Scissors, 
    Ruler, 
    CreditCard, 
    RotateCcw, 
    Package, 
    CheckCircle2 
} from 'lucide-react';
import BottomNav from '../components/BottomNav';
import api from '../../../utils/api';
import useAuthStore from '../../../store/authStore';
import useBrandingStore from '../../../store/brandingStore';

// Static categorized FAQs as fallback & instant render
const FALLBACK_FAQS = [
    {
        _id: 'faq-1',
        categoryTag: 'general',
        categoryLabel: 'General',
        title: 'What is SewZella?',
        content: '<p>SewZella is an all-in-one digital custom tailoring platform connecting you with verified master tailors, boutiques, and fashion designers. We manage doorstep fabric pickup, expert measurements, custom stitching, quality inspection, and doorstep delivery with a 100% Perfect Fit Guarantee.</p>'
    },
    {
        _id: 'faq-2',
        categoryTag: 'orders',
        categoryLabel: 'Orders & Delivery',
        title: 'How do I place an order on SewZella?',
        content: '<p>Placing an order is simple and takes just 4 steps:</p><ol className="list-decimal ml-5 space-y-1.5 mt-2"><li><strong>Select Service:</strong> Choose your garment type (Kurti, Suit, Lehenga, Blouse, Shirt, Alteration, etc.).</li><li><strong>Customize Design:</strong> Pick your neck styles, sleeves, linings, and upload reference design photos.</li><li><strong>Choose Measurement:</strong> Schedule a doorstep executive visit, send a sample garment, or use saved profile.</li><li><strong>Confirm & Pay:</strong> Provide your pickup address and pay securely online or via COD.</li></ol>'
    },
    {
        _id: 'faq-3',
        categoryTag: 'orders',
        categoryLabel: 'Orders & Delivery',
        title: 'How can I track my order live?',
        content: '<p>You can follow every single stage in real-time under <strong>My Orders → Track Order</strong>. You will receive live status milestones: Fabric Picked Up, Received at Boutique, Cutting in Progress, Stitching, Quality Inspection, and Out for Delivery.</p>'
    },
    {
        _id: 'faq-4',
        categoryTag: 'orders',
        categoryLabel: 'Orders & Delivery',
        title: 'Do you offer doorstep fabric pickup and delivery?',
        content: '<p>Yes! Our dedicated delivery partner visits your address to collect your fabric and reference garments safely in a sealed bag. Once your outfit is handcrafted and passed through multi-point quality checks, it is delivered back to your doorstep.</p>'
    },
    {
        _id: 'faq-5',
        categoryTag: 'measurements',
        categoryLabel: 'Measurements & Fit',
        title: 'How do I provide my measurements?',
        content: '<p>We provide 3 convenient measurement methods:</p><ul className="list-disc ml-5 space-y-1.5 mt-2"><li><strong>Doorstep Executive Visit:</strong> A certified measurement professional visits your home with a sanitized measuring kit.</li><li><strong>Sample Garment Pickup:</strong> Hand over your best-fitting sample garment during fabric pickup; our tailor replicates the exact fit.</li><li><strong>Saved Measurement Profile:</strong> Enter your custom body measurements once in your app profile and reuse anytime.</li></ul>'
    },
    {
        _id: 'faq-6',
        categoryTag: 'alterations',
        categoryLabel: 'Alterations & Guarantee',
        title: 'What if my stitched outfit does not fit properly?',
        content: '<p>Every order is backed by our <strong>100% Perfect Fit Guarantee</strong>. If any fitting adjustment is needed, simply request a free alteration within 7 days of delivery through the app. We will pick up the garment, adjust the fit, and return it to you at zero extra charge.</p>'
    },
    {
        _id: 'faq-7',
        categoryTag: 'stitching',
        categoryLabel: 'Stitching & Design',
        title: 'Can I choose my own tailor or boutique?',
        content: '<p>Yes, absolutely! You can browse tailor profiles, check their real work samples, ratings, verified badges, and specialized crafts (e.g. Bridal Lehengas, Designer Blouses, Suits). You can pick your favorite tailor or choose our Smart Auto-Assign feature.</p>'
    },
    {
        _id: 'faq-8',
        categoryTag: 'stitching',
        categoryLabel: 'Stitching & Design',
        title: 'Can I upload my own design or reference photo?',
        content: '<p>Yes! When customizing any garment, you can upload photos from Pinterest, Instagram, or sketches. You can also attach voice notes or detailed stitching preferences for the tailor.</p>'
    },
    {
        _id: 'faq-9',
        categoryTag: 'payments',
        categoryLabel: 'Payments & Refunds',
        title: 'Which payment methods are accepted and is it secure?',
        content: '<p>We accept UPI (Google Pay, PhonePe, Paytm, BHIM), Credit/Debit Cards (Visa, MasterCard, RuPay), Net Banking, and Wallets. All transactions are protected by 256-bit bank-grade SSL encryption.</p>'
    },
    {
        _id: 'faq-10',
        categoryTag: 'payments',
        categoryLabel: 'Payments & Refunds',
        title: 'Can I cancel my order or get a refund?',
        content: '<p>You can cancel your order anytime before fabric cutting starts for a full refund. Once cutting has commenced, cancellation depends on workshop progress. Refunds are processed back to your original payment method or wallet within 3-5 business days.</p>'
    },
    {
        _id: 'faq-11',
        categoryTag: 'general',
        categoryLabel: 'General',
        title: 'Where is SewZella service available?',
        content: '<p>SewZella operates across major urban cities and suburbs. Enable location in the app or enter your pin code on the home screen to check instant availability in your area.</p>'
    }
];

const CATEGORIES = [
    { id: 'all', label: 'All Topics', icon: Sparkles },
    { id: 'orders', label: 'Orders & Delivery', icon: Package },
    { id: 'measurements', label: 'Measurements', icon: Ruler },
    { id: 'stitching', label: 'Stitching & Styles', icon: Scissors },
    { id: 'payments', label: 'Payments & Refunds', icon: CreditCard },
    { id: 'alterations', label: 'Alterations & Returns', icon: RotateCcw }
];

const FAQAccordion = ({ item, isExpanded, onToggle, searchQuery }) => {
    const [feedback, setFeedback] = useState(null);

    const highlightText = (text, query) => {
        if (!query || !query.trim()) return text;
        const parts = text.split(new RegExp(`(${query})`, 'gi'));
        return parts.map((part, i) => 
            part.toLowerCase() === query.toLowerCase() ? (
                <mark key={i} className="bg-yellow-200 text-gray-900 rounded-xs px-0.5 font-bold">
                    {part}
                </mark>
            ) : part
        );
    };

    return (
        <div 
            className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${
                isExpanded 
                    ? 'border-[#843D9B]/30 shadow-lg shadow-purple-500/5 ring-1 ring-[#843D9B]/10' 
                    : 'border-gray-100/90 shadow-xs hover:border-purple-200 hover:shadow-md'
            }`}
        >
            <button
                type="button"
                className={`w-full flex items-center justify-between p-4.5 sm:p-5 text-left cursor-pointer transition-colors ${
                    isExpanded ? 'bg-purple-50/30' : 'hover:bg-purple-50/15'
                }`}
                onClick={onToggle}
            >
                <div className="flex items-start gap-3 pr-3">
                    <span className="mt-0.5 text-xs font-black text-[#843D9B] bg-purple-100/60 w-5 h-5 rounded-full flex items-center justify-center shrink-0">
                        Q
                    </span>
                    <span className={`text-xs sm:text-sm font-bold leading-snug transition-colors ${
                        isExpanded ? 'text-[#843D9B]' : 'text-gray-900'
                    }`}>
                        {highlightText(item.title, searchQuery)}
                    </span>
                </div>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                    isExpanded ? 'bg-[#843D9B] text-white rotate-180' : 'bg-gray-100 text-gray-400'
                }`}>
                    <ChevronDown size={16} />
                </div>
            </button>

            {isExpanded && (
                <div className="px-5 pb-5 pt-3 text-xs sm:text-sm text-gray-600 leading-relaxed border-t border-purple-50/80 bg-white animate-in fade-in slide-in-from-top-2 duration-200">
                    <div 
                        className="space-y-2.5 break-words font-medium text-gray-700" 
                        dangerouslySetInnerHTML={{ __html: item.content }} 
                    />

                    {/* Feedback Prompt */}
                    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                        <span>Was this helpful?</span>
                        {feedback ? (
                            <span className="text-emerald-600 font-bold flex items-center gap-1">
                                <CheckCircle2 size={13} /> Thank you for your feedback!
                            </span>
                        ) : (
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setFeedback('yes'); }}
                                    className="px-2.5 py-1 rounded-md bg-gray-50 hover:bg-emerald-50 hover:text-emerald-700 border border-gray-100 font-bold transition-all active:scale-95 cursor-pointer"
                                >
                                    👍 Yes
                                </button>
                                <button
                                    type="button"
                                    onClick={(e) => { e.stopPropagation(); setFeedback('no'); }}
                                    className="px-2.5 py-1 rounded-md bg-gray-50 hover:bg-rose-50 hover:text-rose-700 border border-gray-100 font-bold transition-all active:scale-95 cursor-pointer"
                                >
                                    👎 No
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const Support = () => {
    const navigate = useNavigate();
    const { isAuthenticated } = useAuthStore();
    const { appName } = useBrandingStore();

    const [faqs, setFaqs] = useState(FALLBACK_FAQS);
    const [settings, setSettings] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedFaqId, setExpandedFaqId] = useState(null);
    const [copiedField, setCopiedField] = useState(null);

    // Fetch dynamic FAQs and CMS Settings
    useEffect(() => {
        const fetchSupportData = async () => {
            try {
                const [faqRes, settingsRes] = await Promise.allSettled([
                    api.get('/cms/content?type=faq'),
                    api.get('/cms/settings')
                ]);

                if (faqRes.status === 'fulfilled' && faqRes.value?.data?.data) {
                    const rawList = faqRes.value.data.data;
                    const uniqueMap = new Map();
                    rawList.forEach(item => {
                        const key = (item.title || item.slug || '').toLowerCase().trim();
                        if (key && !uniqueMap.has(key)) {
                            let tag = 'general';
                            const titleLower = item.title?.toLowerCase() || '';
                            if (titleLower.includes('order') || titleLower.includes('track') || titleLower.includes('pickup') || titleLower.includes('delivery')) tag = 'orders';
                            else if (titleLower.includes('measure') || titleLower.includes('fit')) tag = 'measurements';
                            else if (titleLower.includes('tailor') || titleLower.includes('stitch') || titleLower.includes('design') || titleLower.includes('fabric')) tag = 'stitching';
                            else if (titleLower.includes('pay') || titleLower.includes('refund') || titleLower.includes('cancel')) tag = 'payments';
                            else if (titleLower.includes('alter') || titleLower.includes('return')) tag = 'alterations';

                            uniqueMap.set(key, { ...item, categoryTag: tag });
                        }
                    });

                    const deduplicated = Array.from(uniqueMap.values());
                    if (deduplicated.length > 0) {
                        setFaqs(deduplicated);
                    }
                }

                if (settingsRes.status === 'fulfilled' && settingsRes.value?.data?.data) {
                    setSettings(settingsRes.value.data.data);
                }
            } catch (err) {
                console.error('Error fetching support page data:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSupportData();
    }, [isAuthenticated]);

    // Support Contact Credentials
    const supportEmail = settings?.general?.supportEmail || 'support@sewzella.com';
    const supportPhone = settings?.general?.supportPhone || '+91 98765 43210';
    const cleanPhone = supportPhone.replace(/[^+\d]/g, '');

    const handleCopy = (text, fieldName) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        setCopiedField(fieldName);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const handleEmailClick = () => {
        const subject = encodeURIComponent(`Support Request - ${appName || 'SewZella'}`);
        const bodyLines = [
            `Hello Support Team,`,
            ``,
            `I need assistance with SewZella service:`,
            ``,
            `Issue details:`,
            `[Please describe your issue here]`,
            ``,
            `Thank you!`
        ].join('\n');
        window.location.href = `mailto:${supportEmail}?subject=${subject}&body=${encodeURIComponent(bodyLines)}`;
    };

    const handleCallClick = () => {
        if (!cleanPhone) return;
        window.location.href = `tel:${cleanPhone}`;
    };

    // Filter FAQs by Category and Search Query
    const filteredFaqs = useMemo(() => {
        return faqs.filter(faq => {
            const matchesCategory = selectedCategory === 'all' || faq.categoryTag === selectedCategory;
            const query = searchQuery.toLowerCase().trim();
            const matchesSearch = !query || 
                faq.title?.toLowerCase().includes(query) || 
                faq.content?.toLowerCase().includes(query);
            return matchesCategory && matchesSearch;
        });
    }, [faqs, selectedCategory, searchQuery]);

    const handleToggleFaq = (id) => {
        setExpandedFaqId(prev => prev === id ? null : id);
    };

    return (
        <div className="min-h-screen bg-[#F8F9FD] pb-32 font-sans text-gray-900">
            {/* ═══ Top Hero Header ═══ */}
            <div className="relative bg-gradient-to-br from-[#843D9B] via-[#702d84] to-[#591d6c] text-white pt-8 pb-14 px-4 sm:px-6 rounded-b-[2.5rem] shadow-xl overflow-hidden">
                {/* Subtle Ambient Glow */}
                <div className="absolute -top-12 -right-12 w-64 h-64 bg-pink-400/20 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 -left-12 w-56 h-56 bg-purple-300/15 rounded-full blur-2xl pointer-events-none" />

                <div className="max-w-xl mx-auto relative z-10">
                    {/* Header Top Row */}
                    <div className="flex items-center justify-between mb-5">
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 transition-all flex items-center justify-center backdrop-blur-md cursor-pointer border border-white/10 text-white"
                            aria-label="Go Back"
                        >
                            <ArrowLeft size={20} />
                        </button>
                        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/15 text-xs font-bold tracking-wide text-purple-100">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            Help & Support
                        </div>
                    </div>

                    {/* Hero Title & Subtitle */}
                    <div className="text-center space-y-1.5 mb-5">
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                            How can we help you?
                        </h1>
                        <p className="text-xs sm:text-sm text-purple-100/90 font-medium max-w-sm mx-auto leading-relaxed">
                            Search questions or reach out to our support team directly.
                        </p>
                    </div>

                    {/* Live Search Input Bar */}
                    <div className="relative max-w-md mx-auto">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                            <Search size={18} />
                        </span>
                        <input
                            type="text"
                            placeholder="Search questions, orders, measurements..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-10 py-3.5 bg-white text-gray-900 text-xs sm:text-sm font-semibold rounded-2xl shadow-lg shadow-purple-900/20 outline-none focus:ring-3 focus:ring-pink-300 transition-all placeholder:text-gray-400"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* ═══ Main Body Content ═══ */}
            <div className="max-w-xl mx-auto px-4 sm:px-6 -mt-6 space-y-6 relative z-20">

                {/* ═══ Contact Options (Styled exactly like Order Help Modal) ═══ */}
                <div className="bg-white rounded-3xl p-4 sm:p-5 border border-gray-100 shadow-xl space-y-3">
                    
                    {/* 1. Phone Support Card */}
                    <div className="bg-purple-50/50 border border-purple-100/80 rounded-2xl p-4 transition-all hover:bg-purple-50 hover:shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[#843D9B] text-white flex items-center justify-center shrink-0 shadow-sm">
                                    <Phone size={18} />
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-xs font-black uppercase tracking-wider text-gray-900">
                                            Support Helpline
                                        </h3>
                                        <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            Active
                                        </span>
                                    </div>
                                    <p className="text-sm font-bold text-gray-800 mt-0.5 font-mono">
                                        {supportPhone}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-purple-100 flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleCallClick}
                                className="flex-1 py-2.5 px-4 bg-[#843D9B] hover:bg-[#722f87] active:scale-[0.98] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                            >
                                <PhoneCall size={14} />
                                <span>Call Support</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleCopy(supportPhone, 'phone')}
                                className="py-2.5 px-3.5 bg-white border border-purple-200 hover:bg-purple-100/50 active:scale-95 text-gray-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
                                title="Copy Phone Number"
                            >
                                {copiedField === 'phone' ? (
                                    <>
                                        <Check size={14} className="text-emerald-600" />
                                        <span className="text-emerald-600 font-bold">Copied</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy size={14} className="text-gray-500" />
                                        <span>Copy</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* 2. Email Support Card */}
                    <div className="bg-indigo-50/40 border border-indigo-100 rounded-2xl p-4 transition-all hover:bg-indigo-50/70 hover:shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                                    <Mail size={18} />
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-xs font-black uppercase tracking-wider text-gray-900">
                                            Email Support
                                        </h3>
                                        <span className="text-[9px] font-bold text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded-md">
                                            24h Response
                                        </span>
                                    </div>
                                    <p className="text-sm font-bold text-gray-800 mt-0.5 truncate">
                                        {supportEmail}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-3 pt-3 border-t border-indigo-100 flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleEmailClick}
                                className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                            >
                                <Mail size={14} />
                                <span>Send Email</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleCopy(supportEmail, 'email')}
                                className="py-2.5 px-3.5 bg-white border border-indigo-200 hover:bg-indigo-100/50 active:scale-95 text-gray-700 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shrink-0 cursor-pointer"
                                title="Copy Support Email"
                            >
                                {copiedField === 'email' ? (
                                    <>
                                        <Check size={14} className="text-emerald-600" />
                                        <span className="text-emerald-600 font-bold">Copied</span>
                                    </>
                                ) : (
                                    <>
                                        <Copy size={14} className="text-gray-500" />
                                        <span>Copy</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Operating Hours Note */}
                    <div className="bg-gray-50 rounded-2xl p-3 border border-gray-100 flex items-start gap-2.5 text-[11px] text-gray-500">
                        <Clock size={15} className="text-gray-400 shrink-0 mt-0.5" />
                        <div>
                            <span className="font-bold text-gray-700">Response Hours: </span>
                            Helpline available 9:00 AM – 9:00 PM IST. Emails replied within 2-4 hours.
                        </div>
                    </div>

                </div>

                {/* ═══ FAQ Category Filter Chips ═══ */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2">
                            <HelpCircle size={16} className="text-[#843D9B]" />
                            <h2 className="text-sm font-black text-gray-900 tracking-tight">
                                Frequently Asked Questions
                            </h2>
                        </div>
                        <span className="text-[11px] font-bold text-gray-400">
                            {filteredFaqs.length} {filteredFaqs.length === 1 ? 'Answer' : 'Answers'}
                        </span>
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none no-scrollbar">
                        {CATEGORIES.map(cat => {
                            const IconComponent = cat.icon;
                            const isSelected = selectedCategory === cat.id;
                            return (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => { setSelectedCategory(cat.id); setExpandedFaqId(null); }}
                                    className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
                                        isSelected
                                            ? 'bg-[#843D9B] text-white shadow-sm shadow-purple-500/20'
                                            : 'bg-white text-gray-600 border border-gray-100 hover:border-purple-200 hover:text-[#843D9B]'
                                    }`}
                                >
                                    <IconComponent size={14} className={isSelected ? 'text-white' : 'text-gray-400'} />
                                    {cat.label}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* ═══ FAQ Accordions List ═══ */}
                <div className="space-y-3">
                    {isLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="h-16 bg-white rounded-2xl border border-gray-100 animate-pulse" />
                            ))}
                        </div>
                    ) : filteredFaqs.length === 0 ? (
                        <div className="text-center py-10 px-6 bg-white rounded-3xl border border-gray-100 shadow-sm space-y-3">
                            <div className="w-12 h-12 rounded-full bg-purple-50 text-[#843D9B] flex items-center justify-center mx-auto">
                                <Search size={22} />
                            </div>
                            <h3 className="text-sm font-bold text-gray-900">No matching answers found</h3>
                            <p className="text-xs text-gray-500 max-w-xs mx-auto">
                                Try adjusting your search query or contact our helpline directly.
                            </p>
                            <button
                                type="button"
                                onClick={() => { setSearchQuery(''); setSelectedCategory('all'); }}
                                className="px-4 py-2 bg-purple-50 text-[#843D9B] text-xs font-bold rounded-xl hover:bg-purple-100 transition-colors cursor-pointer"
                            >
                                Clear Filters
                            </button>
                        </div>
                    ) : (
                        filteredFaqs.map(faq => (
                            <FAQAccordion
                                key={faq._id || faq.slug}
                                item={faq}
                                isExpanded={expandedFaqId === (faq._id || faq.slug)}
                                onToggle={() => handleToggleFaq(faq._id || faq.slug)}
                                searchQuery={searchQuery}
                            />
                        ))
                    )}
                </div>

                {/* ═══ Guarantee Badge Footer ═══ */}
                <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-gray-500 font-medium">
                    <ShieldCheck size={14} className="text-[#843D9B] shrink-0" />
                    <span>100% Perfect Fit & Safe Doorstep Service Guarantee</span>
                </div>

            </div>

            <BottomNav />
        </div>
    );
};

export default Support;
