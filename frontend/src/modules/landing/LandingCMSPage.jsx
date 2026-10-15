import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  FileText, 
  Shield, 
  Clock, 
  CheckCircle2, 
  Scale, 
  Lock, 
  Truck, 
  Scissors, 
  UserCheck, 
  Share2, 
  HelpCircle, 
  Mail, 
  ArrowLeft 
} from 'lucide-react';
import api from '../../utils/api';
import LandingNavbar from './components/LandingNavbar';
import LandingFooter from './components/LandingFooter';
import { sanitizeCmsHtml } from '../../utils/formatHtml';

const DEFAULT_TERMS = {
  title: "Terms of Service",
  subtitle: "Everything you need to know about placing custom tailoring orders on SewZella",
  effectiveDate: "January 1, 2026",
  version: "v2.4 Active",
  summaryChips: [
    { icon: Scissors, title: "100% Perfect Fit", desc: "7-Day Free Alteration Guarantee on every stitched garment." },
    { icon: Shield, title: "Secure Escrow", desc: "Payments held safely until delivery OTP confirmation." },
    { icon: Truck, title: "Doorstep Pickup & Drop", desc: "Sealed tamper-proof bag pickup with OTP verification." },
    { icon: UserCheck, title: "Certified Artisans", desc: "Hand-curated master tailors, boutiques and designers." }
  ],
  clauses: [
    {
      num: "01",
      title: "Platform Overview & Eligibility",
      body: `
        <p>SewZella is India's premier digital custom tailoring marketplace connecting customers with vetted master artisans, fashion boutiques, and doorstep measurement executives.</p>
        <p>By browsing, booking, or registering on SewZella, you verify that you are at least 18 years of age and possess the legal capacity to enter into binding agreements.</p>
      `
    },
    {
      num: "02",
      title: "Measurements, Fabric & Design Consultations",
      body: `
        <p>Custom tailoring depends heavily on accurate body specifications. SewZella provides three measurement pathways:</p>
        <ul>
          <li><strong>Doorstep Executive Visit:</strong> Our certified specialist measures you in the comfort of your home with sanitized measuring equipment.</li>
          <li><strong>Sample Garment Pick-up:</strong> Our courier collects your best-fitting garment and our master tailor mirrors its exact silhouette.</li>
          <li><strong>Saved Online Profile:</strong> Submit and manage multiple measurement profiles (family members, festive fits) anytime.</li>
        </ul>
        <p>Customers providing fabric must ensure fabric length satisfies garment requirements. Tailors conduct pre-cut inspections for stains or manufacturing flaws.</p>
      `
    },
    {
      num: "03",
      title: "100% Perfect Fit Guarantee & Alterations",
      body: `
        <p>We stand behind the craftsmanship of every stitch. In the event of a sizing or fitting concern:</p>
        <ul>
          <li>Submit a free alteration request within <strong>7 days</strong> of delivery directly through the order tracking screen.</li>
          <li>A doorstep courier collects your outfit and returns it to the same master tailor for alterations at zero logistics cost.</li>
          <li>Alterations cover resizing, bust/waist adjustments, length alterations, and sleeve tapering.</li>
        </ul>
      `
    },
    {
      num: "04",
      title: "Transparent Pricing & Advance Structure",
      body: `
        <p>Pricing is displayed upfront prior to order confirmation, inclusive of cutting, stitching, styling add-ons, finishing, and doorstep logistics.</p>
        <ul>
          <li>Payments are processed securely via RBI-authorized gateways (Razorpay) supporting UPI, Credit/Debit cards, Netbanking, and COD.</li>
          <li>Custom bridal and couture designs may require advance payment confirmation before artisan fabric cutting commences.</li>
        </ul>
      `
    },
    {
      num: "05",
      title: "Cancellations, Refunds & Transit Protection",
      body: `
        <p>Orders can be cancelled with a 100% refund at any point before fabric cutting begins.</p>
        <p>Once custom cutting commences, cancellations cannot be processed; our 100% Fit Guarantee & Alteration policy takes effect. In the improbable case of fabric transit loss, compensation is provided up to verified fabric invoice value.</p>
      `
    }
  ]
};

const DEFAULT_PRIVACY = {
  title: "Privacy Policy",
  subtitle: "Our transparent commitment to protecting your personal, measurement and location data",
  effectiveDate: "January 1, 2026",
  version: "v2.4 Active",
  summaryChips: [
    { icon: Lock, title: "256-Bit SSL", desc: "Bank-grade encryption across all user data and payment gateways." },
    { icon: Shield, title: "No Data Selling", desc: "We never monetize, sell, or rent your private information." },
    { icon: UserCheck, title: "Strict GPS Consent", desc: "Location is tracked strictly while order delivery is in transit." },
    { icon: Scale, title: "DPDP Act Compliant", desc: "Full adherence to India Digital Personal Data Protection laws." }
  ],
  clauses: [
    {
      num: "01",
      title: "Information Collected",
      body: `
        <p>We collect essential operational information necessary to fulfill custom orders:</p>
        <ul>
          <li><strong>Identity & Contact:</strong> Full name, verified mobile number, email address, and delivery coordinates.</li>
          <li><strong>Custom Tailoring Profiles:</strong> Exact body measurements, reference images, neck/sleeve preferences, and tailoring notes.</li>
          <li><strong>Transactional Records:</strong> Order history, invoice details, and customer support conversations. (We do not store raw card numbers or banking passwords).</li>
        </ul>
      `
    },
    {
      num: "02",
      title: "Operational Data Usage",
      body: `
        <p>Your data is processed strictly to:</p>
        <ul>
          <li>Connect you with suitable verified tailors and dispatch pickup/delivery executives.</li>
          <li>Generate secure, one-time delivery verification codes (OTPs).</li>
          <li>Deliver real-time order status tracking and tailoring milestone push notifications.</li>
          <li>Prevent duplicate orders and maintain safety across the marketplace.</li>
        </ul>
      `
    },
    {
      num: "03",
      title: "Location Tracking & Transit Privacy",
      body: `
        <p>GPS tracking is active solely during live pickup and drop-off journeys. Once an order is handed over with OTP verification, tracking terminates immediately. Background location is never accessed without active on-duty user consent.</p>
      `
    },
    {
      num: "04",
      title: "Security & User Rights",
      body: `
        <p>Your measurements and personal details are encrypted and stored in secure cloud environments. You have the right to access, edit, export, or request the deletion of your account and saved measurement profiles at any time via Profile Settings.</p>
      `
    }
  ]
};

const LandingCMSPage = ({ forcedSlug }) => {
  const { slug: routeSlug } = useParams();
  const slug = (forcedSlug || routeSlug || '').toLowerCase();
  const [content, setContent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    window.scrollTo(0, 0);

    const fetchContent = async () => {
      setIsLoading(true);
      try {
        const res = await api.get(`/cms/content/${slug}`);
        if (res.data?.success && res.data?.data?.content) {
          setContent(res.data.data);
        } else {
          setContent(null);
        }
      } catch (error) {
        setContent(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchContent();
  }, [slug]);

  const isTerms = slug.includes('terms');
  const isPrivacy = slug.includes('privacy');
  const fallback = isTerms ? DEFAULT_TERMS : isPrivacy ? DEFAULT_PRIVACY : null;

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: (content?.title || fallback?.title || 'SewZella'),
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  return (
    <div
      className="min-h-screen bg-[#FDFBFD] text-[#1A1A1A] flex flex-col overflow-x-hidden font-['Plus_Jakarta_Sans',sans-serif]"
    >
      <LandingNavbar />

      {/* ═══ Hero Header ═══ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#843D9B] via-[#742b8b] to-[#511364] text-white pt-32 pb-16 px-5 md:px-12">
        <div className="absolute -top-16 -right-16 w-80 h-80 rounded-full bg-pink-400/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-80 h-80 rounded-full bg-purple-300/20 blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto relative z-10 text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[11px] font-semibold text-purple-100 shadow-xs">
            <Scale size={13} className="text-pink-300" />
            <span>Official Policy & Guidelines</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white">
            {content?.title || fallback?.title || 'Terms & Policy'}
          </h1>

          <p className="text-xs sm:text-sm text-purple-100/90 font-normal max-w-lg mx-auto leading-relaxed">
            {fallback?.subtitle || 'Please review our guidelines, rights, and service agreements carefully.'}
          </p>

          <div className="flex items-center justify-center gap-2.5 pt-1 text-[11px] font-medium text-purple-200 flex-wrap">
            <span className="flex items-center gap-1.5 bg-black/20 px-3 py-1 rounded-full border border-white/10">
              <Clock size={12} className="text-pink-300" />
              Effective: {fallback?.effectiveDate || 'January 2026'}
            </span>
            <span className="flex items-center gap-1.5 bg-black/20 px-3 py-1 rounded-full border border-white/10">
              <CheckCircle2 size={12} className="text-emerald-400" />
              {fallback?.version || 'v2.4 Active'}
            </span>
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 px-3 py-1 rounded-full border border-white/20 transition-all cursor-pointer"
            >
              <Share2 size={12} />
              Share
            </button>
          </div>
        </div>
      </section>

      {/* ═══ Quick Switcher Tabs (Terms vs Privacy) ═══ */}
      <div className="max-w-md mx-auto -mt-6 px-4 relative z-20 w-full">
        <div className="bg-white p-1.5 rounded-2xl shadow-lg shadow-purple-900/5 border border-purple-100 flex items-center gap-1">
          <Link
            to="/page/terms-of-service"
            className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all text-center no-underline flex items-center justify-center gap-1.5 ${
              isTerms
                ? 'bg-[#843D9B] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <FileText size={15} />
            <span>Terms of Service</span>
          </Link>

          <Link
            to="/page/privacy-policy"
            className={`flex-1 py-2 px-3 rounded-xl text-xs sm:text-sm font-semibold transition-all text-center no-underline flex items-center justify-center gap-1.5 ${
              isPrivacy
                ? 'bg-[#843D9B] text-white shadow-xs'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Shield size={15} />
            <span>Privacy Policy</span>
          </Link>
        </div>
      </div>

      {/* ═══ Main Content Body ═══ */}
      <main className="flex-grow pt-8 pb-20 px-3.5 sm:px-6 md:px-8 max-w-4xl mx-auto w-full space-y-6 overflow-hidden">
        
        {/* Highlight Chips */}
        {fallback?.summaryChips && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {fallback.summaryChips.map((chip, idx) => {
              const Icon = chip.icon;
              return (
                <div 
                  key={idx} 
                  className="bg-white p-4 rounded-2xl border border-purple-100/70 shadow-xs hover:border-[#843D9B]/30 hover:shadow-sm transition-all flex flex-col justify-between"
                >
                  <div className="w-9 h-9 rounded-xl bg-purple-50 text-[#843D9B] flex items-center justify-center mb-2.5">
                    <Icon size={18} />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-[13px] font-bold text-gray-900 tracking-tight">
                      {chip.title}
                    </h4>
                    <p className="text-[11px] text-gray-500 font-normal mt-1 leading-snug">
                      {chip.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Content Display: CMS DB content OR Fallback Clauses */}
        {isLoading ? (
          <div className="flex items-center justify-center py-24">
            <div className="w-10 h-10 border-4 border-purple-100 border-t-[#843D9B] rounded-full animate-spin"></div>
          </div>
        ) : content ? (
          <article className="bg-white p-4 sm:p-7 md:p-9 rounded-2xl sm:rounded-3xl shadow-xs border border-purple-100/70 w-full max-w-full overflow-hidden">
            <div 
              className="w-full max-w-full overflow-hidden break-words [overflow-wrap:anywhere] [word-break:break-word]
                         text-[13.5px] sm:text-[14.5px] leading-[1.75] text-slate-700
                         [&_h1]:text-xl sm:[&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-slate-900 [&_h1]:tracking-tight [&_h1]:mb-3 [&_h1]:mt-6 [&_h1:first-child]:mt-0
                         [&_h2]:text-base sm:[&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-[#843D9B] [&_h2]:tracking-tight [&_h2]:mt-6 [&_h2]:mb-2.5
                         [&_h3]:text-sm sm:[&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-slate-900 [&_h3]:mt-5 [&_h3]:mb-2
                         [&_p]:mb-3.5 [&_p]:leading-[1.75]
                         [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-4 [&_ul]:space-y-1.5 [&_ul]:marker:text-[#843D9B]
                         [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-4 [&_ol]:space-y-1.5 [&_ol]:marker:text-[#843D9B]
                         [&_li]:text-slate-700 [&_li]:leading-relaxed
                         [&_strong]:text-slate-900 [&_strong]:font-semibold"
              dangerouslySetInnerHTML={{ __html: sanitizeCmsHtml(content.content) }}
            />
          </article>
        ) : fallback?.clauses ? (
          <div className="space-y-3.5 w-full max-w-full overflow-hidden">
            {fallback.clauses.map((clause, idx) => (
              <article 
                key={idx}
                className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-7 border border-purple-100/60 shadow-xs hover:border-purple-200 transition-all group w-full max-w-full overflow-hidden"
              >
                <div className="flex items-start gap-3.5 mb-3.5">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-[#843D9B] font-bold text-xs flex items-center justify-center shrink-0 border border-purple-100">
                    {clause.num}
                  </div>
                  <div>
                    <h2 className="text-base sm:text-lg font-semibold text-slate-900 tracking-tight group-hover:text-[#843D9B] transition-colors">
                      {clause.title}
                    </h2>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      Clause Section
                    </span>
                  </div>
                </div>

                <div 
                  className="w-full max-w-full overflow-hidden break-words [overflow-wrap:anywhere] [word-break:break-word]
                             text-[13px] sm:text-[14px] leading-relaxed text-slate-600 space-y-3 pl-0 sm:pl-11
                             [&_p]:leading-relaxed
                             [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1.5 [&_ul]:my-2.5 [&_ul]:marker:text-[#843D9B]
                             [&_li]:text-slate-700 [&_li]:leading-relaxed
                             [&_strong]:text-slate-900 [&_strong]:font-semibold"
                  dangerouslySetInnerHTML={{ __html: sanitizeCmsHtml(clause.body) }}
                />
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              Document Not Found
            </h2>
            <p className="text-gray-500 mb-6 text-sm">The document you requested is not available.</p>
            <Link
              to="/"
              className="bg-[#843D9B] text-white px-8 py-3 rounded-full text-xs font-bold hover:bg-[#723287] transition-colors inline-block no-underline shadow-md"
            >
              Return Home
            </Link>
          </div>
        )}

        {/* ═══ Help & Grievance Card ═══ */}
        <div className="bg-gradient-to-br from-white via-purple-50/40 to-pink-50/30 rounded-3xl p-6 sm:p-8 border border-purple-200/80 shadow-md">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1.5 max-w-lg">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#843D9B] bg-purple-100/70 px-2.5 py-0.5 rounded-full inline-block">
                Dedicated Support
              </span>
              <h3 className="text-lg sm:text-xl font-black text-gray-900 font-['Outfit',sans-serif]">
                Questions about our policies?
              </h3>
              <p className="text-xs sm:text-[13px] text-gray-600 leading-relaxed font-medium">
                Our customer concierge team is available to help resolve any queries regarding tailoring standards, fit adjustments, or account security.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto shrink-0">
              <Link
                to="/page/support"
                className="px-5 py-3 rounded-2xl bg-[#843D9B] hover:bg-[#723287] text-white text-xs font-bold tracking-wide shadow-md shadow-[#843D9B]/20 flex items-center justify-center gap-2 transition-all active:scale-95 no-underline"
              >
                <HelpCircle size={15} />
                <span>Contact Us</span>
              </Link>
              <a
                href="mailto:support@sewzella.com"
                className="px-5 py-3 rounded-2xl bg-white hover:bg-gray-50 border border-purple-200 text-gray-800 text-xs font-bold tracking-wide flex items-center justify-center gap-2 transition-all active:scale-95 no-underline shadow-2xs"
              >
                <Mail size={15} className="text-[#843D9B]" />
                <span>support@sewzella.com</span>
              </a>
            </div>
          </div>
        </div>
      </main>

      <LandingFooter />
    </div>
  );
};

export default LandingCMSPage;
