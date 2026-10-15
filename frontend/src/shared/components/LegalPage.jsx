import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { 
    ArrowLeft, 
    Shield, 
    Lock, 
    FileText, 
    CheckCircle2, 
    Clock, 
    Search, 
    X, 
    Sparkles, 
    Share2, 
    HelpCircle, 
    Mail, 
    Phone, 
    ChevronRight,
    Scale,
    AlertCircle,
    UserCheck,
    Truck,
    Scissors
} from 'lucide-react';
import api from '../../utils/api';
import useBrandingStore from '../../store/brandingStore';

// Rich, comprehensive, verified policy document structures
const LEGAL_DATA = {
    terms: {
        title: "Terms & Conditions",
        subtitle: "Rules, obligations & customer fit guarantees",
        effectiveDate: "January 1, 2026",
        version: "2.4 Active",
        summaryChips: [
            { icon: Scissors, title: "100% Perfect Fit", desc: "7-Day Free Alteration Guarantee on every stitched garment." },
            { icon: Shield, title: "Secure Transactions", desc: "Bank-grade 256-bit encryption with escrow protection." },
            { icon: Truck, title: "Doorstep Pickup & Drop", desc: "Sealed tamper-proof bag pickup with OTP verification." },
            { icon: UserCheck, title: "Verified Artisans", desc: "Background-checked master tailors and certified boutiques." }
        ],
        sections: [
            {
                id: "acceptance",
                number: "01",
                title: "Platform Acceptance & Scope",
                content: `
                    <p>Welcome to <strong>SewZella</strong> (referred to as "Platform", "we", "us", or "our"). By accessing, browsing, registering, or placing orders via our mobile application, website, or partner portals, you agree to be bound by these Terms and Conditions.</p>
                    <p>SewZella operates an on-demand custom tailoring marketplace that bridges customers with verified master tailors, fashion designers, fabric suppliers, and logistics partners across India.</p>
                    <div class="callout-box">
                        <p><strong>Note for Partners:</strong> Tailors, boutiques, measurement executives, and delivery partners are also subject to their respective onboarding agreements and operational SLAs in addition to these terms.</p>
                    </div>
                `
            },
            {
                id: "orders",
                number: "02",
                title: "Custom Orders, Fabric & Measurements",
                content: `
                    <p>Custom tailoring is an artisan craft tailored to your personal physical profile. To ensure high accuracy and excellence:</p>
                    <ul>
                        <li><strong>Fabric Quality & Inspection:</strong> When providing your own fabric, customers must confirm the fabric is intact, free of tears, and sufficient in length as per garment requirement. Tailors inspect fabric upon arrival and report defects prior to cutting.</li>
                        <li><strong>Measurement Methods:</strong> Customers may choose doorstep executive measurement, sample garment replication, or self-submitted measurement profiles. Measurements verified by an executive carry our fit guarantee.</li>
                        <li><strong>Design Approval:</strong> Reference images, necklines, trims, and custom design instructions uploaded by customers are reviewed by the tailor. Complex bridal and couture designs may require digital design confirmation before cutting.</li>
                    </ul>
                `
            },
            {
                id: "fit-guarantee",
                number: "03",
                title: "100% Perfect Fit Guarantee & Alterations",
                content: `
                    <p>Every stitched garment placed through SewZella is backed by our signature <strong>100% Perfect Fit Guarantee</strong>:</p>
                    <ul>
                        <li>If the finished garment does not fit as per agreed measurements, you may request a <strong>free alteration within 7 days</strong> of delivery through the app.</li>
                        <li>Our delivery partner will collect the garment from your doorstep, return it to the artisan for precision adjustments, and re-deliver it at zero extra logistics cost.</li>
                        <li>Alterations cover sizing, seam let-out, tightening, and sleeve/hem adjustments. Fundamental style changes not requested during order creation may incur minor artisan material charges.</li>
                    </ul>
                `
            },
            {
                id: "pricing",
                number: "04",
                title: "Pricing, Payments & Advance Structure",
                content: `
                    <p>All prices listed on SewZella are transparent with zero hidden charges. Tailoring charges comprise pattern making, cutting, stitching, finishing, quality check, and roundtrip pickup/delivery.</p>
                    <ul>
                        <li><strong>Payment Modes:</strong> We accept UPI (Google Pay, PhonePe, Paytm), Credit/Debit Cards, Net Banking, and select Cash-on-Delivery (COD) services.</li>
                        <li><strong>Advance & Balances:</strong> Custom couture orders may require an advance payment prior to fabric cutting, with any balance payable upon final quality approval or doorstep delivery.</li>
                        <li><strong>Artisan Protection:</strong> Tailor earnings are held securely in platform escrow and credited upon successful order completion and OTP delivery confirmation.</li>
                    </ul>
                `
            },
            {
                id: "cancellation",
                number: "05",
                title: "Cancellation, Refunds & Exchange Policy",
                content: `
                    <p>Because custom garments are made to individual specifications, cancellations are handled as follows:</p>
                    <ul>
                        <li><strong>Before Fabric Cutting:</strong> You may cancel with a 100% refund at any point before the tailor commences fabric cutting. If fabric was already collected, a nominal return courier fee may apply.</li>
                        <li><strong>After Fabric Cutting:</strong> Once fabric has been cut to customer measurements, cancellation is not possible. If quality defects exist, our full alteration and remake guarantee applies.</li>
                        <li><strong>Damaged or Lost Fabric:</strong> In the rare event fabric is damaged or misplaced while in transit, SewZella compensates up to the verified purchase value of the fabric.</li>
                    </ul>
                `
            },
            {
                id: "code-of-conduct",
                number: "06",
                title: "Code of Conduct & Partner Integrity",
                content: `
                    <p>We believe in treating every artisan, customer, and delivery executive with dignity and respect:</p>
                    <ul>
                        <li>Zero tolerance for harassment, offensive language, or discrimination.</li>
                        <li>Both customers and partners agree not to solicit or accept off-platform cash side-deals that bypass quality verification and insurance protections.</li>
                        <li>Violation of fair usage, fraudulent OTP sharing, or chargeback abuse will result in permanent account deactivation.</li>
                    </ul>
                `
            }
        ]
    },
    privacy: {
        title: "Privacy Policy",
        subtitle: "How we collect, protect & respect your personal data",
        effectiveDate: "January 1, 2026",
        version: "2.4 Active",
        summaryChips: [
            { icon: Lock, title: "256-Bit SSL", desc: "Bank-grade encryption on all personal and payment communications." },
            { icon: Shield, title: "Zero Data Sale", desc: "We never sell, rent, or trade your data with third-party advertisers." },
            { icon: UserCheck, title: "Consent-Driven GPS", desc: "Live location is tracked strictly while order delivery is active." },
            { icon: Scale, title: "DPDP Act Compliant", desc: "Full adherence to India Digital Personal Data Protection Act standards." }
        ],
        sections: [
            {
                id: "collection",
                number: "01",
                title: "Information We Collect",
                content: `
                    <p>To deliver custom tailoring services, SewZella collects only essential operational data:</p>
                    <ul>
                        <li><strong>Account Details:</strong> Full name, mobile number, email address, and profile picture.</li>
                        <li><strong>Measurement & Fitting Data:</strong> Body measurements, garment preferences, neck style choices, and fitting notes saved in your profile.</li>
                        <li><strong>Delivery Coordinates:</strong> Home/office address, GPS coordinates, and delivery preferences for fabric pickup and drop.</li>
                        <li><strong>Partner Credentials:</strong> Government ID, business licenses, bank account numbers/IFSC for payouts, and vehicle documents (for delivery partners).</li>
                    </ul>
                `
            },
            {
                id: "usage",
                number: "02",
                title: "How We Utilize Your Information",
                content: `
                    <p>Your data is processed strictly for the following operational requirements:</p>
                    <ul>
                        <li>Matching you with the most suitable verified tailor in your city or vicinity.</li>
                        <li>Facilitating doorstep fabric pickups, measurement visits, and final deliveries.</li>
                        <li>Generating secure, single-use OTPs for handover confirmation and payment settlements.</li>
                        <li>Sending live tracking notifications, order milestone alerts, and customer care assistance.</li>
                        <li>Detecting fraud, unauthorized account access, and verifying partner credentials.</li>
                    </ul>
                `
            },
            {
                id: "location",
                number: "03",
                title: "Real-time Location & GPS Tracking",
                content: `
                    <p>Real-time location data is collected for delivery partners and measurement executives only when actively on duty:</p>
                    <ul>
                        <li>Live GPS coordinates are transmitted to the customer and tailor strictly while an order is in transit (e.g. out for delivery).</li>
                        <li>Once delivery or measurement handover is completed via verified OTP, live tracking automatically terminates.</li>
                        <li>Location is never tracked in the background without explicit operational intent.</li>
                    </ul>
                `
            },
            {
                id: "protection",
                number: "04",
                title: "Data Security & Storage",
                content: `
                    <p>We treat your personal data with utmost security and care:</p>
                    <ul>
                        <li><strong>Encryption:</strong> All transit data is encrypted via TLS 1.3/HTTPS with 256-bit AES algorithms.</li>
                        <li><strong>Payment Privacy:</strong> We do not store raw credit/debit card numbers or CVV. Payments are processed through RBI-authorized payment aggregators (Razorpay).</li>
                        <li><strong>Access Controls:</strong> Tailors only receive necessary tailoring notes and customer first names; sensitive customer financial records are never shared with merchants.</li>
                    </ul>
                `
            },
            {
                id: "rights",
                number: "05",
                title: "Your Privacy Rights & Data Control",
                content: `
                    <p>Under India's Digital Personal Data Protection laws, you maintain complete sovereignty over your information:</p>
                    <ul>
                        <li><strong>Access & Correction:</strong> Review or update your profile, saved addresses, and measurement profiles anytime in app settings.</li>
                        <li><strong>Data Portability & Erasure:</strong> Request a copy or permanent deletion of your account and measurement history by writing to our privacy team.</li>
                        <li><strong>Marketing Opt-out:</strong> You can toggle promotional SMS and notification alerts off directly in notification settings.</li>
                    </ul>
                `
            }
        ]
    }
};

const LegalPage = ({ type: propType, category = 'general' }) => {
    const { type: paramType } = useParams();
    const navigate = useNavigate();
    const appName = useBrandingStore(state => state.appName) || 'SewZella';

    // Determine whether user wants terms or privacy
    const rawType = (propType || paramType || 'terms-and-conditions').toLowerCase();
    const initialTab = rawType.includes('privacy') ? 'privacy' : 'terms';
    const [activeTab, setActiveTab] = useState(initialTab);
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedSection, setExpandedSection] = useState(null);
    const [cmsContent, setCmsContent] = useState(null);
    const [loading, setLoading] = useState(false);

    // Sync active tab if param changes
    useEffect(() => {
        if (paramType) {
            setActiveTab(paramType.toLowerCase().includes('privacy') ? 'privacy' : 'terms');
        }
    }, [paramType]);

    // Attempt to load dynamic CMS content if available
    useEffect(() => {
        const fetchCms = async () => {
            const slug = activeTab === 'privacy' ? 'privacy-policy' : 'terms-of-service';
            try {
                const res = await api.get(`/cms/content/${slug}`);
                if (res.data?.success && res.data?.data?.content) {
                    setCmsContent(res.data.data);
                } else {
                    setCmsContent(null);
                }
            } catch (e) {
                setCmsContent(null);
            }
        };
        fetchCms();
    }, [activeTab]);

    const activeDoc = LEGAL_DATA[activeTab];

    // Filter sections based on search query
    const filteredSections = useMemo(() => {
        if (!searchQuery.trim()) return activeDoc.sections;
        const q = searchQuery.toLowerCase().trim();
        return activeDoc.sections.filter(sec => 
            sec.title.toLowerCase().includes(q) || 
            sec.content.toLowerCase().includes(q)
        );
    }, [activeDoc, searchQuery]);

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: `${activeDoc.title} - ${appName}`,
                text: `${activeDoc.title} for ${appName} Platform.`,
                url: window.location.href,
            }).catch(() => {});
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert("Link copied to clipboard!");
        }
    };

    return (
        <div 
            className="min-h-screen bg-[#FDFBFD] text-[#1A1A1A] font-['Plus_Jakarta_Sans',sans-serif] selection:bg-[#843D9B] selection:text-white pb-28"
        >
            {/* ═══ Top Modern Navigation Bar ═══ */}
            <header className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-purple-100/70 shadow-xs">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
                    <button 
                        onClick={() => navigate(-1)} 
                        className="inline-flex items-center gap-2 text-xs font-bold text-gray-700 hover:text-[#843D9B] p-2 -ml-2 rounded-xl hover:bg-purple-50 transition-all cursor-pointer"
                        aria-label="Back"
                    >
                        <ArrowLeft size={18} />
                        <span className="hidden sm:inline">Back</span>
                    </button>

                    {/* Logo & Category Badge */}
                    <div className="flex items-center gap-2">
                        <span className="text-base font-black tracking-tight text-[#843D9B] font-['Outfit',sans-serif]">
                            {appName.toUpperCase()}
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-purple-50 text-[#843D9B] border border-purple-200">
                            Legal & Compliance
                        </span>
                    </div>

                    <button 
                        onClick={handleShare} 
                        className="w-9 h-9 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#843D9B] flex items-center justify-center transition-all cursor-pointer border border-purple-200/60"
                        title="Share Document"
                    >
                        <Share2 size={16} />
                    </button>
                </div>
            </header>

            {/* ═══ Hero Header with Gradient & Badges ═══ */}
            <section className="relative overflow-hidden bg-gradient-to-br from-[#843D9B] via-[#742b8b] to-[#511364] text-white pt-10 pb-16 px-5 sm:px-8">
                {/* Decorative background blurs */}
                <div className="absolute -top-16 -right-16 w-80 h-80 rounded-full bg-pink-400/20 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-16 -left-16 w-80 h-80 rounded-full bg-purple-300/20 blur-3xl pointer-events-none" />

                <div className="max-w-3xl mx-auto relative z-10 text-center space-y-3">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[11px] font-black uppercase tracking-widest text-purple-100 shadow-xs">
                        <Scale size={13} className="text-pink-300" />
                        <span>Official Transparency Commitment</span>
                    </div>

                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight font-['Outfit',sans-serif] leading-tight text-white drop-shadow-xs">
                        {activeDoc.title}
                    </h1>

                    <p className="text-xs sm:text-sm text-purple-100/90 font-medium max-w-lg mx-auto leading-relaxed">
                        {activeDoc.subtitle}
                    </p>

                    <div className="flex items-center justify-center gap-3 pt-2 text-[11px] font-semibold text-purple-200 flex-wrap">
                        <span className="flex items-center gap-1.5 bg-black/20 px-3 py-1 rounded-full border border-white/10">
                            <Clock size={12} className="text-pink-300" />
                            Effective: {activeDoc.effectiveDate}
                        </span>
                        <span className="flex items-center gap-1.5 bg-black/20 px-3 py-1 rounded-full border border-white/10">
                            <CheckCircle2 size={12} className="text-emerald-400" />
                            {activeDoc.version}
                        </span>
                    </div>
                </div>
            </section>

            {/* ═══ Floating Document Switcher Tab Pill ═══ */}
            <div className="max-w-md mx-auto -mt-6 px-4 relative z-20">
                <div className="bg-white p-1.5 rounded-2xl shadow-xl shadow-purple-900/10 border border-purple-100 flex items-center gap-1">
                    <button
                        onClick={() => { setActiveTab('terms'); setSearchQuery(''); }}
                        className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all text-center cursor-pointer flex items-center justify-center gap-1.5 ${
                            activeTab === 'terms'
                                ? 'bg-[#843D9B] text-white shadow-md shadow-[#843D9B]/30'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                    >
                        <FileText size={15} />
                        <span>Terms & Conditions</span>
                    </button>

                    <button
                        onClick={() => { setActiveTab('privacy'); setSearchQuery(''); }}
                        className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition-all text-center cursor-pointer flex items-center justify-center gap-1.5 ${
                            activeTab === 'privacy'
                                ? 'bg-[#843D9B] text-white shadow-md shadow-[#843D9B]/30'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                        }`}
                    >
                        <Shield size={15} />
                        <span>Privacy Policy</span>
                    </button>
                </div>
            </div>

            {/* ═══ Main Content Container ═══ */}
            <main className="max-w-4xl mx-auto px-4 sm:px-6 pt-8 space-y-8">
                
                {/* Key Highlights / Summary Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
                    {activeDoc.summaryChips.map((chip, idx) => {
                        const Icon = chip.icon;
                        return (
                            <div 
                                key={idx} 
                                className="bg-white p-4 rounded-2xl border border-purple-100/80 shadow-xs hover:border-[#843D9B]/30 hover:shadow-md transition-all flex flex-col justify-between"
                            >
                                <div className="w-10 h-10 rounded-xl bg-purple-50 text-[#843D9B] flex items-center justify-center mb-3">
                                    <Icon size={20} />
                                </div>
                                <div>
                                    <h4 className="text-xs sm:text-[13px] font-black text-gray-900 font-['Outfit',sans-serif] tracking-tight">
                                        {chip.title}
                                    </h4>
                                    <p className="text-[11px] text-gray-500 font-medium mt-1 leading-snug">
                                        {chip.desc}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Live Search Within Document */}
                <div className="relative max-w-xl mx-auto w-full">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                        <Search size={16} />
                    </span>
                    <input 
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search clauses (e.g. alterations, fit guarantee, refund, GPS)..."
                        className="w-full pl-10 pr-10 py-3 bg-white text-xs sm:text-sm font-medium text-gray-900 rounded-2xl border border-purple-100 shadow-xs focus:outline-none focus:ring-2 focus:ring-[#843D9B] focus:border-transparent transition-all placeholder:text-gray-400"
                    />
                    {searchQuery && (
                        <button 
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                        >
                            <X size={14} />
                        </button>
                    )}
                </div>

                {/* CMS HTML Override (if admin updated in CMS) */}
                {cmsContent && !searchQuery ? (
                    <article className="bg-white rounded-3xl p-6 sm:p-10 border border-purple-100/70 shadow-sm leading-relaxed">
                        <div 
                            className="prose prose-purple max-w-none text-[14px] sm:text-[15px] leading-relaxed text-gray-700
                                       [&_h1]:text-2xl [&_h1]:font-black [&_h1]:font-['Outfit',sans-serif] [&_h1]:text-gray-900 [&_h1]:mb-4
                                       [&_h2]:text-xl [&_h2]:font-bold [&_h2]:font-['Outfit',sans-serif] [&_h2]:text-[#843D9B] [&_h2]:mt-8 [&_h2]:mb-3
                                       [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-gray-900 [&_h3]:mt-6 [&_h3]:mb-2
                                       [&_p]:mb-4 [&_p]:leading-relaxed
                                       [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-5 [&_ul]:space-y-1.5
                                       [&_li]:text-gray-700
                                       [&_strong]:text-gray-900 [&_strong]:font-bold"
                            dangerouslySetInnerHTML={{ __html: cmsContent.content }}
                        />
                    </article>
                ) : (
                    /* Structured Section Cards */
                    <div className="space-y-4">
                        {filteredSections.length === 0 ? (
                            <div className="text-center py-16 bg-white rounded-3xl border border-gray-100 p-6">
                                <AlertCircle size={32} className="mx-auto text-amber-500 mb-2" />
                                <h3 className="text-sm font-bold text-gray-800">No matching sections found</h3>
                                <p className="text-xs text-gray-500 mt-1">Try another search term or clear the filter.</p>
                                <button 
                                    onClick={() => setSearchQuery('')}
                                    className="mt-4 px-4 py-1.5 rounded-full bg-purple-50 text-[#843D9B] text-xs font-bold hover:bg-purple-100 transition-colors"
                                >
                                    Reset Search
                                </button>
                            </div>
                        ) : (
                            filteredSections.map((sec) => (
                                <article 
                                    key={sec.id}
                                    id={sec.id}
                                    className="bg-white rounded-3xl p-6 sm:p-8 border border-purple-100/70 shadow-xs hover:shadow-md hover:border-purple-200 transition-all group"
                                >
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="w-10 h-10 rounded-2xl bg-purple-50 text-[#843D9B] font-black text-sm flex items-center justify-center shrink-0 border border-purple-100 font-['Outfit',sans-serif]">
                                            {sec.number}
                                        </div>
                                        <div className="flex-1">
                                            <h2 className="text-lg sm:text-xl font-black text-gray-900 font-['Outfit',sans-serif] tracking-tight group-hover:text-[#843D9B] transition-colors">
                                                {sec.title}
                                            </h2>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                Clause Reference
                                            </span>
                                        </div>
                                    </div>

                                    <div 
                                        className="text-[13px] sm:text-[14px] leading-relaxed text-gray-600 space-y-3.5 pl-0 sm:pl-14
                                                   [&_p]:leading-relaxed
                                                   [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-2 [&_ul]:my-3
                                                   [&_li]:text-gray-700 [&_li]:leading-relaxed
                                                   [&_strong]:text-gray-900 [&_strong]:font-bold
                                                   [&_.callout-box]:bg-purple-50/70 [&_.callout-box]:p-4 [&_.callout-box]:rounded-2xl [&_.callout-box]:border [&_.callout-box]:border-purple-200 [&_.callout-box]:text-xs [&_.callout-box]:text-purple-950 [&_.callout-box]:my-3"
                                        dangerouslySetInnerHTML={{ __html: sec.content }}
                                    />
                                </article>
                            ))
                        )}
                    </div>
                )}

                {/* ═══ Legal Grievance & Help Center Card ═══ */}
                <div className="bg-gradient-to-br from-white via-purple-50/40 to-pink-50/30 rounded-3xl p-6 sm:p-8 border border-purple-200/80 shadow-md">
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div className="space-y-1.5 max-w-lg">
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#843D9B] bg-purple-100/70 px-2.5 py-0.5 rounded-full inline-block">
                                Official Grievance Officer
                            </span>
                            <h3 className="text-lg sm:text-xl font-black text-gray-900 font-['Outfit',sans-serif]">
                                Have questions or need clarification?
                            </h3>
                            <p className="text-xs sm:text-[13px] text-gray-600 leading-relaxed font-medium">
                                In accordance with Information Technology & Consumer Protection Rules, our designated Grievance Officer responds to all inquiries within 24 to 48 hours.
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto shrink-0">
                            <a
                                href="mailto:support@sewzella.com?subject=Legal%20Grievance%20Inquiry"
                                className="px-5 py-3 rounded-2xl bg-[#843D9B] hover:bg-[#723287] text-white text-xs font-bold tracking-wide shadow-md shadow-[#843D9B]/20 flex items-center justify-center gap-2 transition-all active:scale-95 no-underline"
                            >
                                <Mail size={15} />
                                <span>Email Grievance Officer</span>
                            </a>
                            <Link
                                to="/page/support"
                                className="px-5 py-3 rounded-2xl bg-white hover:bg-gray-50 border border-purple-200 text-gray-800 text-xs font-bold tracking-wide flex items-center justify-center gap-2 transition-all active:scale-95 no-underline shadow-2xs"
                            >
                                <HelpCircle size={15} className="text-[#843D9B]" />
                                <span>Contact Us</span>
                            </Link>
                        </div>
                    </div>
                </div>

            </main>
        </div>
    );
};

export default LegalPage;
