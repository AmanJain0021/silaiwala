// Port of shared/components/LegalPage.jsx (converted with scripts/web2rn.js, then reviewed)
import { Linking } from 'react-native';
import { alert } from '../lib/alert';
import { shareLink, webUrl } from '../lib/share';
import Screen from '../components/common/Screen';
import HtmlView from '../components/ui/HtmlView';
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams,  } from '../lib/nav';
import { ArrowLeft, Shield, Lock, FileText, CheckCircle2, Clock, Search, X, Sparkles, Share2, HelpCircle, Mail, Phone, ChevronRight, Scale, AlertCircle, UserCheck, Truck, Scissors } from "lucide-react-native";
import api from "../lib/api";
import useBrandingStore from "../store/brandingStore";
import { sanitizeCmsHtml } from "../utils/formatHtml";
import { Box, Btn, I, Txt, Input, Scroll } from '../components/ui/primitives';

// Rich, comprehensive, verified policy document structures
const LEGAL_DATA = {
  terms: {
    title: "Terms & Conditions",
    subtitle: "Rules, obligations & customer fit guarantees",
    effectiveDate: "January 1, 2026",
    version: "2.4 Active",
    summaryChips: [{
      icon: Scissors,
      title: "100% Perfect Fit",
      desc: "7-Day Free Alteration Guarantee on every stitched garment."
    }, {
      icon: Shield,
      title: "Secure Transactions",
      desc: "Bank-grade 256-bit encryption with escrow protection."
    }, {
      icon: Truck,
      title: "Doorstep Pickup & Drop",
      desc: "Sealed tamper-proof bag pickup with OTP verification."
    }, {
      icon: UserCheck,
      title: "Verified Artisans",
      desc: "Background-checked master tailors and certified boutiques."
    }],
    sections: [{
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
    }, {
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
    }, {
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
    }, {
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
    }, {
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
    }, {
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
    }]
  },
  privacy: {
    title: "Privacy Policy",
    subtitle: "How we collect, protect & respect your personal data",
    effectiveDate: "January 1, 2026",
    version: "2.4 Active",
    summaryChips: [{
      icon: Lock,
      title: "256-Bit SSL",
      desc: "Bank-grade encryption on all personal and payment communications."
    }, {
      icon: Shield,
      title: "Zero Data Sale",
      desc: "We never sell, rent, or trade your data with third-party advertisers."
    }, {
      icon: UserCheck,
      title: "Consent-Driven GPS",
      desc: "Live location is tracked strictly while order delivery is active."
    }, {
      icon: Scale,
      title: "DPDP Act Compliant",
      desc: "Full adherence to India Digital Personal Data Protection Act standards."
    }],
    sections: [{
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
    }, {
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
    }, {
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
    }, {
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
    }, {
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
    }]
  }
};
const LegalPage = ({
  type: propType,
  category = 'general'
}) => {
  const {
    type: paramType
  } = useParams();
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
    return activeDoc.sections.filter(sec => sec.title.toLowerCase().includes(q) || sec.content.toLowerCase().includes(q));
  }, [activeDoc, searchQuery]);
  const handleShare = () => shareLink({
    title: `${activeDoc.title} - ${appName}`,
    text: `${activeDoc.title} for ${appName} Platform.`,
    url: webUrl(`/executive/legal/${rawType}`)
  });
  return <Screen className="bg-[#FDFBFD]"><Box className="flex-1 bg-[#FDFBFD] text-[#1A1A1A] font-['Plus_Jakarta_Sans',sans-serif] selection:bg-[#843D9B] selection:text-white">
            {/* ═══ Top Modern Navigation Bar ═══ */}
            <Box className="sticky top-0 z-50 bg-white/85 backdrop-blur-md border-b border-purple-100/70 shadow-xs">
                <Box className="max-w-4xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
                    <Btn onPress={() => navigate(-1)} className="inline-flex items-center gap-2 text-xs font-bold text-gray-700 hover:text-[#843D9B] p-2 -ml-2 rounded-xl hover:bg-purple-50 transition-all cursor-pointer">
                        <I icon={ArrowLeft} size={18} />
                        <Txt className="hidden sm:inline">Back</Txt>
                    </Btn>

                    {/* Logo & Category Badge */}
                    <Box className="flex items-center gap-2">
                        <Txt className="text-base font-black tracking-tight text-[#843D9B] font-['Outfit',sans-serif]">
                            {appName.toUpperCase()}
                        </Txt>
                        <Txt className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full bg-purple-50 text-[#843D9B] border border-purple-200">
                            Legal & Compliance
                        </Txt>
                    </Box>

                    <Btn onPress={handleShare} className="w-9 h-9 rounded-xl bg-purple-50 hover:bg-purple-100 text-[#843D9B] flex items-center justify-center transition-all cursor-pointer border border-purple-200/60">
                        <I icon={Share2} size={16} />
                    </Btn>
                </Box>
            </Box>
            <Scroll className="flex-1" contentClassName="pb-28">

            {/* ═══ Hero Header with Gradient & Badges ═══ */}
            <Box className="relative overflow-hidden bg-gradient-to-br from-[#843D9B] via-[#742b8b] to-[#511364] text-white pt-10 pb-16 px-5 sm:px-8">
                {/* Decorative background blurs */}
                <Box className="absolute -top-16 -right-16 w-80 h-80 rounded-full bg-pink-400/20 blur-3xl pointer-events-none" />
                <Box className="absolute -bottom-16 -left-16 w-80 h-80 rounded-full bg-purple-300/20 blur-3xl pointer-events-none" />

                <Box className="max-w-3xl mx-auto relative z-10 text-center space-y-3">
                    <Box className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[11px] font-semibold text-purple-100 shadow-xs">
                        <I icon={Scale} size={13} className="text-pink-300" />
                        <Txt>Official Transparency Commitment</Txt>
                    </Box>

                    <Txt className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight leading-tight text-white">
                        {activeDoc.title}
                    </Txt>

                    <Txt className="text-xs sm:text-sm text-purple-100/90 font-normal max-w-lg mx-auto leading-relaxed">
                        {activeDoc.subtitle}
                    </Txt>

                    <Box className="flex items-center justify-center gap-2.5 pt-1 text-[11px] font-medium text-purple-200 flex-wrap">
                        <Txt className="flex items-center gap-1.5 bg-black/20 px-3 py-1 rounded-full border border-white/10">
                            <I icon={Clock} size={12} className="text-pink-300" />
                            Effective: {activeDoc.effectiveDate}
                        </Txt>
                        <Txt className="flex items-center gap-1.5 bg-black/20 px-3 py-1 rounded-full border border-white/10">
                            <I icon={CheckCircle2} size={12} className="text-emerald-400" />
                            {activeDoc.version}
                        </Txt>
                    </Box>
                </Box>
            </Box>

            {/* ═══ Floating Document Switcher Tab Pill ═══ */}
            <Box className="max-w-md mx-auto -mt-6 px-4 relative z-20 w-full">
                <Box className="bg-white p-1.5 rounded-2xl shadow-lg shadow-purple-900/5 border border-purple-100 flex items-center gap-1">
                    <Btn onPress={() => {
          setActiveTab('terms');
          setSearchQuery('');
        }} className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all text-center cursor-pointer flex items-center justify-center gap-1.5 ${activeTab === 'terms' ? 'bg-[#843D9B] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>
                        <I icon={FileText} size={15} />
                        <Txt>Terms & Conditions</Txt>
                    </Btn>

                    <Btn onPress={() => {
          setActiveTab('privacy');
          setSearchQuery('');
        }} className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all text-center cursor-pointer flex items-center justify-center gap-1.5 ${activeTab === 'privacy' ? 'bg-[#843D9B] text-white shadow-xs' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>
                        <I icon={Shield} size={15} />
                        <Txt>Privacy Policy</Txt>
                    </Btn>
                </Box>
            </Box>

            {/* ═══ Main Content Container ═══ */}
            <Box className="max-w-4xl mx-auto px-3.5 sm:px-6 pt-8 space-y-6 overflow-hidden">
                
                {/* Key Highlights / Summary Grid */}
                <Box className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {activeDoc.summaryChips.map((chip, idx) => {
          const Icon = chip.icon;
          return <Box key={idx} className="bg-white p-4 rounded-2xl border border-purple-100/70 shadow-xs hover:border-[#843D9B]/30 hover:shadow-sm transition-all flex flex-col justify-between">
                                <Box className="w-9 h-9 rounded-xl bg-purple-50 text-[#843D9B] flex items-center justify-center mb-2.5">
                                    <I icon={Icon} size={18} />
                                </Box>
                                <Box>
                                    <Txt className="text-xs sm:text-[13px] font-bold text-gray-900 tracking-tight">
                                        {chip.title}
                                    </Txt>
                                    <Txt className="text-[11px] text-gray-500 font-normal mt-1 leading-snug">
                                        {chip.desc}
                                    </Txt>
                                </Box>
                            </Box>;
        })}
                </Box>

                {/* Live Search Within Document */}
                <Box className="relative max-w-xl mx-auto w-full">
                    <Txt className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                        <I icon={Search} size={16} />
                    </Txt>
                    <Input value={searchQuery} onChangeText={e => setSearchQuery(e)} placeholder="Search clauses (e.g. alterations, fit guarantee, refund, GPS)..." className="w-full pl-10 pr-10 py-2.5 bg-white text-xs sm:text-sm font-medium text-gray-900 rounded-2xl border border-purple-100 shadow-xs focus:outline-none focus:ring-2 focus:ring-[#843D9B] focus:border-transparent transition-all placeholder:text-gray-400" />
                    {searchQuery && <Btn onPress={() => setSearchQuery('')} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1">
                            <I icon={X} size={14} />
                        </Btn>}
                </Box>

                {/* CMS HTML Override (if admin updated in CMS) */}
                {cmsContent && !searchQuery ? <Box className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-7 md:p-9 border border-purple-100/70 shadow-xs leading-relaxed w-full max-w-full overflow-hidden">
                        <HtmlView html={sanitizeCmsHtml(cmsContent.content)} className="w-full space-y-3" textClassName="text-[13.5px] leading-[1.75] text-slate-700"
          tagClassNames={{ h1: 'text-xl text-slate-900 mt-3', h2: 'text-base font-semibold text-[#843D9B] mt-3', h3: 'text-sm font-semibold text-slate-900 mt-2', strong: 'text-slate-900 font-semibold', ul: 'pl-1', ol: 'pl-1' }} />
                    </Box> : (/* Structured Section Cards */
      <Box className="space-y-3.5 w-full max-w-full overflow-hidden">
                        {filteredSections.length === 0 ? <Box className="text-center py-16 bg-white rounded-2xl border border-gray-100 p-6">
                                <I icon={AlertCircle} size={32} className="mx-auto text-amber-500 mb-2" />
                                <Txt className="text-sm font-semibold text-gray-800">No matching sections found</Txt>
                                <Txt className="text-xs text-gray-500 mt-1">Try another search term or clear the filter.</Txt>
                                <Btn onPress={() => setSearchQuery('')} className="mt-4 px-4 py-1.5 rounded-full bg-purple-50 text-[#843D9B] text-xs font-semibold hover:bg-purple-100 transition-colors">
                                    Reset Search
                                </Btn>
                            </Box> : filteredSections.map(sec => <Box key={sec.id} className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-7 border border-purple-100/60 shadow-xs hover:border-purple-200 transition-all group w-full max-w-full overflow-hidden">
                                    <Box className="flex items-start gap-3.5 mb-3.5">
                                        <Box className="w-8 h-8 rounded-xl bg-purple-50 text-[#843D9B] font-bold text-xs flex items-center justify-center shrink-0 border border-purple-100">
                                            {sec.number}
                                        </Box>
                                        <Box className="flex-1">
                                            <Txt className="text-base sm:text-lg font-semibold text-slate-900 tracking-tight group-hover:text-[#843D9B] transition-colors">
                                                {sec.title}
                                            </Txt>
                                            <Txt className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                                                Clause Reference
                                            </Txt>
                                        </Box>
                                    </Box>

                                    <HtmlView html={sanitizeCmsHtml(sec.content)} className="w-full space-y-3" textClassName="text-[13px] leading-relaxed text-slate-600"
            tagClassNames={{ strong: 'text-slate-900 font-semibold', '.callout-box': 'bg-purple-50/70 p-3.5 rounded-xl border border-purple-200 my-1' }} />
                                </Box>)}
                    </Box>)}

                {/* ═══ Legal Grievance & Help Center Card ═══ */}
                <Box className="bg-gradient-to-br from-white via-purple-50/40 to-pink-50/30 rounded-3xl p-6 sm:p-8 border border-purple-200/80 shadow-md">
                    <Box className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <Box className="space-y-1.5 max-w-lg">
                            <Txt className="text-[10px] font-black uppercase tracking-widest text-[#843D9B] bg-purple-100/70 px-2.5 py-0.5 rounded-full inline-block">
                                Official Grievance Officer
                            </Txt>
                            <Txt className="text-lg sm:text-xl font-black text-gray-900 font-['Outfit',sans-serif]">
                                Have questions or need clarification?
                            </Txt>
                            <Txt className="text-xs sm:text-[13px] text-gray-600 leading-relaxed font-medium">
                                In accordance with Information Technology & Consumer Protection Rules, our designated Grievance Officer responds to all inquiries within 24 to 48 hours.
                            </Txt>
                        </Box>

                        <Box className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto shrink-0">
                            <Btn onPress={() => Linking.openURL("mailto:support@sewzella.com?subject=Legal%20Grievance%20Inquiry")} className="px-5 py-3 rounded-2xl bg-[#843D9B] hover:bg-[#723287] text-white text-xs font-bold tracking-wide shadow-md shadow-[#843D9B]/20 flex items-center justify-center gap-2 transition-all active:scale-95 no-underline">
                                <I icon={Mail} size={15} />
                                <Txt>Email Grievance Officer</Txt>
                            </Btn>
                            <Btn onPress={() => navigate("/page/support")} className="px-5 py-3 rounded-2xl bg-white hover:bg-gray-50 border border-purple-200 text-gray-800 text-xs font-bold tracking-wide flex items-center justify-center gap-2 transition-all active:scale-95 no-underline shadow-2xs">
                                <I icon={HelpCircle} size={15} className="text-[#843D9B]" />
                                <Txt>Contact Us</Txt>
                            </Btn>
                        </Box>
                    </Box>
                </Box>

            </Box>
                    </Scroll>
</Box></Screen>;
};
export default LegalPage;
