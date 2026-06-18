import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Download, ChevronRight, ChevronLeft, Scissors, Ruler, Shirt, Star,
  CheckCircle, Truck, Eye, Smartphone, Shield, ShieldCheck, Clock, Zap,
  Users, BarChart3, Package, Globe, Quote, Scan, MapPin
} from 'lucide-react';
import LandingNavbar from './components/LandingNavbar';
import LandingFooter from './components/LandingFooter';

/* ─── Animation Variants ─── */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }
  })
};

const stagger = {
  visible: { transition: { staggerChildren: 0.12 } }
};

/* ─── Data ─── */
const TRUST_FEATURES = [
  { icon: <CheckCircle size={24} />, title: 'Perfect Fit Every Time', desc: 'Custom-stitched outfits made for you.' },
  { icon: <Scan size={24} />, title: 'AI Measurement Assistant', desc: 'Get accurate measurements instantly using AI.' },
  { icon: <ShieldCheck size={24} />, title: 'Verified Tailors', desc: 'Experienced & trusted tailoring professionals.' },
  { icon: <Truck size={24} />, title: 'Doorstep Pickup & Delivery', desc: 'We pick up, stitch & deliver to your door.' },
  { icon: <Eye size={24} />, title: 'Live Order Tracking', desc: 'Track your order from stitching to delivery.' },
  { icon: <Smartphone size={24} />, title: 'Real-Time Updates', desc: 'Get stitching updates & photos from your tailor.' },
];

/* Illustrated SVG icons for "How It Works" section */
const StepIconChooseStyle = () => (
  <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    {/* Hanger */}
    <path d="M40 12 L40 20" stroke="#7a42b1" strokeWidth="2" strokeLinecap="round"/>
    <circle cx="40" cy="10" r="3" stroke="#7a42b1" strokeWidth="2" fill="none"/>
    <path d="M27 32 L40 20 L53 32" stroke="#7a42b1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    {/* Dress body */}
    <path d="M27 32 L24 62 Q24 66 28 66 L52 66 Q56 66 56 62 L53 32" fill="#e9a84c" stroke="#c4872e" strokeWidth="1.5"/>
    {/* Dress waist belt */}
    <rect x="28" y="42" width="24" height="4" rx="2" fill="#c4872e"/>
    {/* Dress pattern lines */}
    <path d="M32 48 L32 62" stroke="#c4872e" strokeWidth="1" opacity="0.4"/>
    <path d="M40 48 L40 62" stroke="#c4872e" strokeWidth="1" opacity="0.4"/>
    <path d="M48 48 L48 62" stroke="#c4872e" strokeWidth="1" opacity="0.4"/>
    {/* Dupatta/scarf flowing */}
    <path d="M53 32 Q60 38 58 50 Q56 58 62 62" stroke="#d44a4a" strokeWidth="2" fill="none" strokeLinecap="round"/>
    <path d="M55 36 Q62 42 60 52" stroke="#d44a4a" strokeWidth="1.5" fill="none" opacity="0.5" strokeLinecap="round"/>
  </svg>
);

const StepIconMeasurements = () => (
  <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    {/* Dress form stand */}
    <line x1="40" y1="56" x2="40" y2="70" stroke="#8B7355" strokeWidth="2"/>
    <line x1="32" y1="70" x2="48" y2="70" stroke="#8B7355" strokeWidth="2" strokeLinecap="round"/>
    {/* Dress form body */}
    <path d="M30 18 Q30 14 34 12 L46 12 Q50 14 50 18 L52 34 Q52 40 48 44 L46 56 L34 56 L32 44 Q28 40 28 34 Z" fill="#e9a84c" stroke="#c4872e" strokeWidth="1.5"/>
    {/* Neckline */}
    <path d="M34 12 Q37 16 40 16 Q43 16 46 12" stroke="#c4872e" strokeWidth="1.5" fill="none"/>
    {/* Measuring tape wrapping around */}
    <path d="M22 24 Q26 20 30 22 Q34 24 36 28 Q38 32 34 36 Q30 40 26 38" stroke="#f0c040" strokeWidth="3" fill="none" strokeLinecap="round"/>
    {/* Tape markings */}
    <line x1="23" y1="24" x2="25" y2="23" stroke="#d4a030" strokeWidth="1"/>
    <line x1="28" y1="21" x2="29" y2="23" stroke="#d4a030" strokeWidth="1"/>
    <line x1="33" y1="24" x2="34" y2="26" stroke="#d4a030" strokeWidth="1"/>
    {/* Measuring tape hanging */}
    <path d="M50 28 Q56 26 58 30 Q60 34 56 38 Q52 42 54 46" stroke="#f0c040" strokeWidth="3" fill="none" strokeLinecap="round"/>
    <line x1="56" y1="27" x2="57" y2="29" stroke="#d4a030" strokeWidth="1"/>
    <line x1="59" y1="32" x2="57" y2="33" stroke="#d4a030" strokeWidth="1"/>
  </svg>
);

const StepIconStitching = () => (
  <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    {/* Sewing machine base */}
    <rect x="14" y="54" width="52" height="6" rx="3" fill="#1c1b1b" stroke="#1c1b1b" strokeWidth="1"/>
    {/* Machine body */}
    <path d="M18 54 L18 32 Q18 28 22 28 L38 28 Q42 28 42 32 L42 54" fill="#4a0581" stroke="#3a0461" strokeWidth="1.5"/>
    {/* Machine top arm */}
    <path d="M18 32 L18 24 Q18 20 22 20 L54 20 Q58 20 58 24 L58 36 Q58 40 54 40 L50 40" fill="#5c17a0" stroke="#3a0461" strokeWidth="1.5"/>
    {/* Needle area */}
    <line x1="50" y1="40" x2="50" y2="50" stroke="#7d7483" strokeWidth="1.5"/>
    <line x1="50" y1="50" x2="50" y2="54" stroke="#ccc" strokeWidth="0.8"/>
    {/* Wheel */}
    <circle cx="22" cy="24" r="4" fill="#dcb8ff" stroke="#4a0581" strokeWidth="1.5"/>
    <circle cx="22" cy="24" r="1.5" fill="#4a0581"/>
    {/* Thread spool */}
    <rect x="30" y="14" width="6" height="8" rx="1" fill="#d44a4a" stroke="#b33030" strokeWidth="1"/>
    <line x1="33" y1="22" x2="33" y2="28" stroke="#d44a4a" strokeWidth="0.8"/>
    {/* Fabric under needle */}
    <path d="M42 52 L58 52 Q62 52 62 48 L62 44" stroke="#e9a84c" strokeWidth="2" fill="none" strokeLinecap="round"/>
    {/* Stitch marks */}
    <line x1="44" y1="52" x2="46" y2="50" stroke="#c4872e" strokeWidth="0.8"/>
    <line x1="48" y1="52" x2="50" y2="50" stroke="#c4872e" strokeWidth="0.8"/>
    <line x1="52" y1="52" x2="54" y2="50" stroke="#c4872e" strokeWidth="0.8"/>
  </svg>
);

const StepIconTrackProgress = () => (
  <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    {/* Phone body */}
    <rect x="22" y="8" width="36" height="64" rx="6" fill="#1c1b1b" stroke="#333" strokeWidth="1.5"/>
    {/* Screen */}
    <rect x="25" y="14" width="30" height="50" rx="3" fill="white"/>
    {/* Status bar */}
    <rect x="25" y="14" width="30" height="6" rx="3" fill="#4a0581"/>
    <circle cx="40" cy="17" r="1" fill="white" opacity="0.8"/>
    {/* Tracking content - shirt icon */}
    <rect x="30" y="24" width="20" height="14" rx="2" fill="#f0dbff" stroke="#dcb8ff" strokeWidth="1"/>
    <path d="M35 28 L40 26 L45 28 L45 34 L35 34 Z" fill="#4a0581" opacity="0.6"/>
    {/* Progress bar */}
    <rect x="30" y="42" width="20" height="3" rx="1.5" fill="#eae7e7"/>
    <rect x="30" y="42" width="14" height="3" rx="1.5" fill="#4a0581"/>
    {/* Status dots */}
    <circle cx="32" cy="50" r="2" fill="#4a0581"/>
    <circle cx="37" cy="50" r="2" fill="#4a0581"/>
    <circle cx="42" cy="50" r="2" fill="#dcb8ff"/>
    <circle cx="47" cy="50" r="2" fill="#eae7e7"/>
    {/* Check marks */}
    <path d="M31 50 L32 51 L33 49" stroke="white" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M36 50 L37 51 L38 49" stroke="white" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round"/>
    {/* Bottom text lines */}
    <rect x="30" y="55" width="15" height="2" rx="1" fill="#eae7e7"/>
    <rect x="30" y="59" width="10" height="2" rx="1" fill="#eae7e7"/>
    {/* Notification bell */}
    <circle cx="56" cy="14" r="8" fill="#f0dbff" stroke="#dcb8ff" strokeWidth="1"/>
    <path d="M53 13 Q53 10 56 10 Q59 10 59 13 L59.5 15 L52.5 15 Z" fill="#4a0581"/>
    <circle cx="56" cy="16" r="1" fill="#4a0581"/>
  </svg>
);

const StepIconDelivered = () => (
  <svg viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    {/* Gift box body */}
    <rect x="16" y="34" width="48" height="34" rx="4" fill="#d44a4a" stroke="#b33030" strokeWidth="1.5"/>
    {/* Box lid */}
    <rect x="13" y="26" width="54" height="10" rx="4" fill="#e55555" stroke="#b33030" strokeWidth="1.5"/>
    {/* Vertical ribbon */}
    <rect x="37" y="26" width="6" height="42" fill="#f0c040" opacity="0.9"/>
    {/* Horizontal ribbon */}
    <rect x="13" y="28" width="54" height="6" fill="#f0c040" opacity="0.9"/>
    {/* Ribbon bow center */}
    <circle cx="40" cy="24" r="4" fill="#f0c040" stroke="#d4a030" strokeWidth="1"/>
    {/* Bow left loop */}
    <path d="M36 24 Q28 16 32 12 Q36 10 38 14 Q40 18 36 24" fill="#f0c040" stroke="#d4a030" strokeWidth="1"/>
    {/* Bow right loop */}
    <path d="M44 24 Q52 16 48 12 Q44 10 42 14 Q40 18 44 24" fill="#f0c040" stroke="#d4a030" strokeWidth="1"/>
    {/* Sparkles */}
    <path d="M62 18 L64 14 L66 18 L64 22 Z" fill="#f0c040" opacity="0.7"/>
    <path d="M10 40 L12 38 L14 40 L12 42 Z" fill="#f0c040" opacity="0.5"/>
    <circle cx="68" cy="40" r="2" fill="#f0c040" opacity="0.6"/>
    <circle cx="14" cy="20" r="1.5" fill="#dcb8ff" opacity="0.8"/>
  </svg>
);

const HOW_STEPS = [
  { num: 1, title: 'Choose Your Style', desc: 'Browse from a wide range of outfits and select your fabric and style with our AI assistant.', icon: <StepIconChooseStyle /> },
  { num: 2, title: 'Share Measurements', desc: 'Enter your measurements manually or use our AI Assistant.', icon: <StepIconMeasurements /> },
  { num: 3, title: 'Tailor Starts Stitching', desc: 'Your order is assigned to a verified tailor who starts stitching.', icon: <StepIconStitching /> },
  { num: 4, title: 'Track Progress', desc: 'Receive real-time updates and photos of your stitching progress.', icon: <StepIconTrackProgress /> },
  { num: 5, title: 'Get It Delivered', desc: 'Your perfect outfit is quality checked and delivered to your doorstep.', icon: <StepIconDelivered /> },
];

const CATEGORIES = [
  { title: "Women's Wear", desc: "Designer blouses, suits, kurtis, lehengas & more", img: '/landing/category_womens_wear.png' },
  { title: "Men's Wear", desc: "Kurtas, shirts, pathani suits, formal wear", img: '/landing/category_mens_wear.png' },
  { title: "Kids Wear", desc: "Adorable outfits for every occasion", img: '/landing/category_kids_wear.png' },
  { title: "Bridal Wear", desc: "Wedding & festive custom stitching", img: '/landing/category_bridal_wear.png' },
  { title: "Alterations", desc: "Perfect fitting for your existing outfits", img: '/landing/category_alterations.png' },
  { title: "Bulk Stitching", desc: "For boutiques, schools, companies & more", img: '/landing/category_bulk_stitching.png' },
];

const TESTIMONIALS = [
  { text: "Sewzella made custom stitching effortless. The fitting was absolutely perfect and the delivery was on time.", name: "Sara Madhav", avatar: null },
  { text: "Real-time updates and doorstep delivery were amazing. I highly recommend Sewzella to everyone!", name: "Ayesha Patel", avatar: null },
  { text: "Finally a modern solution for tailoring. The AI measurement assistant is incredibly accurate!", name: "Rohan Dev", avatar: null },
];

const ORDER_STEPS = [
  { label: 'Measurements Received', date: '15 Jun, 2025', done: true },
  { label: 'Tailor Assigned', date: '16 Jun, 2025', done: true },
  { label: 'Stitching in Progress', date: '', done: false, active: true },
  { label: 'Out For Delivery', date: '', done: false },
  { label: 'Delivered', date: '', done: false },
];

const PARTNER_FEATURES = [
  { icon: <Package size={18} />, label: 'Receive more orders' },
  { icon: <Users size={18} />, label: 'Manage customers digitally' },
  { icon: <BarChart3 size={18} />, label: 'Track earnings and growth' },
  { icon: <Truck size={18} />, label: 'Get delivery support' },
  { icon: <Globe size={18} />, label: 'Build your online presence' },
];

const SewZellaLanding = () => {
  const [testimonialIdx, setTestimonialIdx] = useState(0);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const nextTestimonial = () => setTestimonialIdx((prev) => (prev + 1) % TESTIMONIALS.length);
  const prevTestimonial = () => setTestimonialIdx((prev) => (prev - 1 + TESTIMONIALS.length) % TESTIMONIALS.length);

  return (
    <div
      className="min-h-screen bg-[#fcf9f8] text-[#1c1b1b] overflow-x-hidden"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <LandingNavbar />

      {/* ═══════════════════════════════════════════
          1. HERO SECTION
      ═══════════════════════════════════════════ */}
      <section className="relative pt-24 md:pt-28 pb-8 md:pb-16 bg-[#fcf9f8] min-h-[85vh] flex items-center overflow-hidden">
        {/* Background Image */}
        <div className="absolute top-[64px] lg:top-[72px] left-0 right-0 bottom-0 z-0">
          <img 
            src="/homepage .jpeg" 
            alt="Sewzella Hero Banner" 
            className="w-full h-full object-contain object-right md:object-right-top"
          />
          {/* Subtle gradient so text remains readable if image is busy */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#fcf9f8] via-[#fcf9f8]/60 to-transparent pointer-events-none"></div>
        </div>

        <div className="max-w-[1536px] mx-auto px-5 md:px-16 relative z-10 w-full">
          <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-6">
            {/* Left Content */}
            <motion.div
              className="flex-1 max-w-xl lg:max-w-none"
              initial="hidden"
              animate="visible"
              variants={stagger}
            >
              <motion.h1
                variants={fadeUp}
                className="text-[36px] md:text-[48px] lg:text-[56px] font-bold leading-[1.12] mb-5 tracking-[-0.02em]"
                style={{ fontFamily: "'Libre Caslon Text', serif" }}
              >
                Custom Tailoring,<br />
                Delivered to{' '}
                <span className="italic text-[#4a0581]">Your Doorstep</span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                custom={1}
                className="text-[#4c4451] text-[16px] md:text-[17px] leading-relaxed mb-7 max-w-lg"
              >
                Design, customize, and stitch your perfect outfit from the comfort of your home. Sewzella connects customers with skilled tailors and seamless doorstep delivery.
              </motion.p>

              <motion.div variants={fadeUp} custom={2} className="flex flex-wrap gap-3 mb-8">
                <a
                  href="https://play.google.com/store"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#4a0581] text-white px-7 py-3.5 rounded-full text-[14px] font-semibold hover:bg-[#622999] transition-all duration-300 shadow-[0_4px_20px_rgba(74,5,129,0.3)] hover:shadow-[0_6px_25px_rgba(74,5,129,0.4)] hover:-translate-y-[1px]"
                >
                  Download App <Download size={16} />
                </a>
                <Link
                  to="/partner/welcome"
                  className="inline-flex items-center gap-2 border-2 border-[#4a0581] text-[#4a0581] px-7 py-3.5 rounded-full text-[14px] font-semibold hover:bg-[#4a0581] hover:text-white transition-all duration-300"
                >
                  <Scissors size={16} />
                  Become a Tailor
                </Link>
              </motion.div>

              <motion.div variants={fadeUp} custom={3} className="flex items-center gap-3 text-[13px] text-[#7d7483]">
                <div className="flex -space-x-2">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-[#dcb8ff] to-[#4a0581] border-2 border-white flex items-center justify-center text-white text-[10px] font-bold"
                    >
                      {['S', 'A', 'R'][i]}
                    </div>
                  ))}
                </div>
                <span>
                  Trusted by <strong className="text-[#1c1b1b]">10,000+</strong> customers<br className="sm:hidden" /> and tailoring professionals across Kashmir.
                </span>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          2. TRUST BAR / FEATURES
      ═══════════════════════════════════════════ */}
      <section className="relative z-10 -mt-16 md:-mt-20 pb-8 md:pb-12 bg-transparent">
        <div className="max-w-[1536px] mx-auto px-5 md:px-16">
          <motion.div
            className="bg-white rounded-[32px] border border-[#f0eded] shadow-[0_8px_32px_rgba(0,0,0,0.06)] py-8 md:py-12 px-6 md:px-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 md:gap-10"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-60px' }}
            variants={stagger}
          >
            {TRUST_FEATURES.map((f, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                custom={i}
                className="flex flex-col items-center text-center group"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#f0dbff] text-[#4a0581] flex items-center justify-center mb-3 group-hover:bg-[#4a0581] group-hover:text-white transition-all duration-300 group-hover:scale-110 group-hover:shadow-[0_8px_25px_rgba(74,5,129,0.25)]">
                  {f.icon}
                </div>
                <h3 className="text-[13px] font-bold text-[#1c1b1b] mb-1 leading-tight">{f.title}</h3>
                <p className="text-[11px] text-[#7d7483] leading-snug">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          3. HOW SEWZELLA WORKS
      ═══════════════════════════════════════════ */}
      <section id="how-it-works" className="py-16 md:py-24 bg-[#fcf9f8]">
        <div className="max-w-[1536px] mx-auto px-5 md:px-16">
          <motion.div
            className="text-center mb-14"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <h2 className="text-[28px] md:text-[36px] font-bold mb-3 flex items-center justify-center gap-3" style={{ fontFamily: "'Libre Caslon Text', serif" }}>
              <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 md:w-10 md:h-10">
                <path d="M8 24 L14 14 L12 12 L6 18 Z" fill="#4a0581" opacity="0.9"/>
                <path d="M24 24 L18 14 L20 12 L26 18 Z" fill="#4a0581" opacity="0.9"/>
                <circle cx="16" cy="10" r="3" fill="#7a42b1"/>
                <circle cx="16" cy="10" r="1.2" fill="white"/>
                <path d="M6 18 Q4 20 5 22 Q6 24 8 24" fill="#4a0581"/>
                <path d="M26 18 Q28 20 27 22 Q26 24 24 24" fill="#4a0581"/>
              </svg>
              How Sewzella Works
            </h2>
          </motion.div>

          <motion.div
            className="relative"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            variants={stagger}
          >
            {/* Dashed Connection Line with Arrows */}
            <div className="hidden lg:block absolute top-[52px] left-[14%] right-[14%] h-0 z-0">
              <svg width="100%" height="12" viewBox="0 0 900 12" preserveAspectRatio="none" fill="none" xmlns="http://www.w3.org/2000/svg">
                <line x1="0" y1="6" x2="880" y2="6" stroke="#cec3d3" strokeWidth="2" strokeDasharray="10 6"/>
                {/* Arrow heads at intervals */}
                <polygon points="175,2 185,6 175,10" fill="#cec3d3"/>
                <polygon points="395,2 405,6 395,10" fill="#cec3d3"/>
                <polygon points="615,2 625,6 615,10" fill="#cec3d3"/>
                <polygon points="835,2 845,6 835,10" fill="#cec3d3"/>
              </svg>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-4 relative z-10">
              {HOW_STEPS.map((step, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  custom={i}
                  className="flex flex-col items-center text-center group"
                >
                  <div className="relative mb-5">
                    {/* Light circular background with illustrated SVG */}
                    <div className="w-[100px] h-[100px] rounded-full bg-[#f6f0ff] border-2 border-[#e9def5] flex items-center justify-center p-4 group-hover:border-[#dcb8ff] group-hover:shadow-[0_8px_30px_rgba(74,5,129,0.12)] transition-all duration-300 group-hover:scale-105">
                      {step.icon}
                    </div>
                    {/* Step number badge */}
                    <div className="absolute -top-1 -left-1 w-7 h-7 rounded-full bg-[#4a0581] text-white text-[12px] font-bold flex items-center justify-center border-2 border-white shadow-sm">
                      {step.num}
                    </div>
                  </div>
                  <h3 className="text-[14px] font-bold text-[#1c1b1b] mb-1.5 italic" style={{ fontFamily: "'Libre Caslon Text', serif" }}>{step.title}</h3>
                  <p className="text-[12px] text-[#7d7483] leading-relaxed max-w-[180px]">{step.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          4. POPULAR CATEGORIES
      ═══════════════════════════════════════════ */}
      <section id="categories" className="py-16 md:py-24 bg-white">
        <div className="max-w-[1536px] mx-auto px-5 md:px-16">
          <motion.div
            className="text-center mb-14"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <h2 className="text-[28px] md:text-[36px] font-bold mb-3" style={{ fontFamily: "'Libre Caslon Text', serif" }}>
              Popular Categories
            </h2>
            <p className="text-[#7d7483] text-[15px] max-w-lg mx-auto">Explore our most loved custom stitching categories</p>
          </motion.div>

          <motion.div
            className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            variants={stagger}
          >
            {CATEGORIES.map((cat, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                custom={i}
                className="group cursor-pointer text-center"
              >
                <div className="relative w-full aspect-square rounded-2xl overflow-hidden mb-4 bg-[#f6f3f2] shadow-[0_4px_20px_rgba(0,0,0,0.06)] group-hover:shadow-[0_8px_30px_rgba(74,5,129,0.15)] transition-all duration-400">
                  <img
                    src={cat.img}
                    alt={cat.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                <h3 className="text-[14px] font-bold text-[#1c1b1b] mb-1 group-hover:text-[#4a0581] transition-colors">{cat.title}</h3>
                <p className="text-[11px] text-[#7d7483] leading-snug px-1">{cat.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          5. AI MEASUREMENT + LIVE ORDER TRACKING
      ═══════════════════════════════════════════ */}
      <section id="about" className="py-16 md:py-24 bg-[#f6f3f2]">
        <div className="max-w-[1536px] mx-auto px-5 md:px-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* AI Measurement Card */}
            <motion.div
              className="bg-white rounded-3xl p-8 md:p-10 flex flex-col lg:flex-row items-center gap-8 shadow-[0_4px_30px_rgba(0,0,0,0.04)] border border-[#f0eded]"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
            >
              <div className="flex-1 w-full">
                <div className="flex items-center gap-2 text-[#4a0581] font-bold text-[16px] mb-4">
                  <Scan size={20} />
                  AI Measurement Assistant
                </div>
                <h3 className="text-[20px] md:text-[22px] font-extrabold mb-3 text-[#1c1b1b] leading-tight">
                  No measuring tape? No problem.
                </h3>
                <p className="text-[#4c4451] text-[13px] leading-relaxed mb-6">
                  Upload a front and side photo, enter your height and weight, and Sewzella will estimate your measurements instantly.
                </p>

                {/* Measurement Points - 2 columns */}
                <div className="grid grid-cols-2 gap-y-4 gap-x-4 mb-8">
                  {['Chest', 'Shoulder', 'Waist', 'Sleeve', 'Hip', 'Neck'].map((label, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <div className="w-[22px] h-[22px] rounded-full bg-[#4a0581] text-white flex items-center justify-center shrink-0">
                        <CheckCircle size={12} strokeWidth={3} />
                      </div>
                      <span className="text-[13px] font-bold text-[#1c1b1b]">{label}</span>
                    </div>
                  ))}
                </div>

                <button className="bg-[#4a0581] text-white px-7 py-3 rounded-xl text-[13px] font-bold hover:bg-[#622999] transition-all duration-300">
                  Try AI Measurement
                </button>
              </div>
              <div className="flex-shrink-0 flex justify-center lg:justify-end w-full lg:w-[280px]">
                <img
                  src="/mobile.png"
                  alt="AI Measurement App Interface"
                  className="w-full max-w-[280px] object-contain"
                />
              </div>
            </motion.div>

            {/* Live Order Tracking Card */}
            <motion.div
              className="bg-white rounded-3xl p-8 md:p-10 shadow-[0_4px_30px_rgba(0,0,0,0.04)] border border-[#f0eded] flex flex-col"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={1}
            >
              <div className="flex items-center gap-2 text-[#4a0581] font-bold text-[16px] mb-4">
                <Scan size={20} />
                Live Order Tracking
              </div>
              <p className="text-[#1c1b1b] text-[13px] font-semibold mb-8">
                Stay updated at every stage of your order.
              </p>

              {/* Order Timeline - 2 columns */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6 mb-8 relative">
                {/* Connecting Line - Desktop Only (between cols) */}
                <div className="hidden md:block absolute left-1/2 top-8 bottom-8 w-[1px] bg-gradient-to-b from-transparent via-[#eae7e7] to-transparent -translate-x-1/2"></div>
                
                {/* Left Column */}
                <div className="space-y-6 relative">
                  <div className="absolute left-[13px] top-4 bottom-4 w-[2px] bg-[#eae7e7]"></div>
                  {[
                    { label: 'Order Confirmed', date: '10 Jun, 10:30 AM', icon: <Package size={12} /> },
                    { label: 'Measurements Received', date: '10 Jun, 12:45 PM', icon: <Ruler size={12} /> },
                    { label: 'Tailor Assigned', date: '10 Jun, 01:30 PM', icon: <Users size={12} /> },
                    { label: 'Stitching In Progress', date: '11 Jun, 09:15 AM', icon: <Scissors size={12} /> },
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-4 relative z-10">
                      <div className="w-[28px] h-[28px] rounded-full bg-[#4a0581] text-white flex items-center justify-center shrink-0 mt-0.5">
                        {step.icon}
                      </div>
                      <div>
                        <p className="text-[12px] font-bold text-[#1c1b1b] leading-tight">{step.label}</p>
                        <p className="text-[10px] text-[#7d7483] mt-1">{step.date}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Right Column */}
                <div className="space-y-6 relative md:mt-4">
                  <div className="absolute left-[13px] top-4 bottom-4 w-[2px] bg-[#eae7e7]"></div>
                  {[
                    { label: 'Quality Check', date: '13 Jun, 04:30 PM', icon: <Shield size={12} />, color: 'bg-[#4a0581]' },
                    { label: 'Out For Delivery', date: '14 Jun, 10:30 AM', icon: <Truck size={12} />, color: 'bg-[#4a0581]' },
                    { label: 'Delivered', date: '14 Jun, 02:45 PM', icon: <CheckCircle size={12} strokeWidth={3} />, color: 'bg-[#22c55e]' },
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-4 relative z-10">
                      <div className={`w-[28px] h-[28px] rounded-full ${step.color} text-white flex items-center justify-center shrink-0 mt-0.5`}>
                        {step.icon}
                      </div>
                      <div>
                        <p className="text-[12px] font-bold text-[#1c1b1b] leading-tight">{step.label}</p>
                        <p className="text-[10px] text-[#7d7483] mt-1">{step.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-center mt-auto">
                <button className="border-2 border-[#dcb8ff] text-[#4a0581] px-8 py-2.5 rounded-[14px] text-[13px] font-bold hover:border-[#4a0581] transition-all duration-300">
                  Track Your Order
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          6. BECOME A TAILOR PARTNER
      ═══════════════════════════════════════════ */}
      <section id="become-partner" className="py-16 md:py-24 bg-[#fcf9f8]">
        <div className="max-w-[1536px] mx-auto px-5 md:px-16">
          <motion.div
            className="relative bg-gradient-to-r from-[#4a0581] to-[#651baa] rounded-3xl overflow-hidden"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <div className="flex flex-col lg:flex-row">
              <div className="flex-1 p-8 md:p-12 lg:p-16 text-white">
                <h2 className="text-[28px] md:text-[36px] font-bold mb-3" style={{ fontFamily: "'Libre Caslon Text', serif" }}>
                  Become a Tailor Partner
                </h2>
                <p className="text-white/80 text-[15px] mb-8 max-w-md">
                  Grow your tailoring business with Sewzella.
                </p>

                <div className="flex flex-wrap gap-3 mb-10">
                  {PARTNER_FEATURES.map((f, i) => (
                    <div
                      key={i}
                      className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white px-4 py-2.5 rounded-full text-[12px] font-medium border border-white/20"
                    >
                      {f.icon}
                      {f.label}
                    </div>
                  ))}
                </div>

                <Link
                  to="/partner/welcome"
                  className="inline-flex items-center gap-2 bg-white text-[#4a0581] px-8 py-3.5 rounded-full text-[14px] font-bold hover:bg-[#f0dbff] transition-all duration-300 shadow-lg"
                >
                  Join as Tailor <ChevronRight size={16} />
                </Link>
              </div>

              <div className="hidden lg:flex items-end justify-end flex-shrink-0 pr-8">
                <img
                  src="/landing/tailor_partner_woman.png"
                  alt="Tailor Partner"
                  className="w-[300px] h-[340px] object-cover object-top rounded-t-2xl"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          7. DOWNLOAD SEWZELLA APP
      ═══════════════════════════════════════════ */}
      <section className="py-16 md:py-24 bg-[#fcf9f8]">
        <div className="max-w-[1536px] mx-auto px-5 md:px-16">
          <motion.div
            className="bg-white rounded-[32px] border border-[#f0eded] shadow-[0_4px_30px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col lg:flex-row items-center relative"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            {/* Left: Image */}
            <div className="lg:w-1/3 flex justify-center lg:justify-start pt-10 px-8 lg:pt-0 lg:pl-16">
              <img
                src="/download.png"
                alt="Sewzella App Download"
                className="w-[240px] md:w-[320px] lg:w-full max-w-[360px] object-contain object-bottom h-[280px] md:h-[360px] lg:h-auto lg:max-h-[400px]"
              />
            </div>

            {/* Middle: Content */}
            <div className="lg:w-1/3 py-12 px-8 lg:px-10 text-center lg:text-left flex flex-col items-center lg:items-start justify-center">
              <h2
                className="text-[28px] md:text-[36px] font-bold text-[#4a0581] mb-3 leading-tight"
                style={{ fontFamily: "'Libre Caslon Text', serif" }}
              >
                Download Sewzella
              </h2>
              <p className="text-[#4c4451] text-[14px] mb-8 max-w-md mx-auto lg:mx-0">
                Your perfect outfit is just a few taps away.
              </p>

              {/* App Store Badges */}
              <div className="flex flex-row gap-4 justify-center lg:justify-start">
                <a
                  href="https://play.google.com/store"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 bg-black text-white px-5 py-2.5 rounded-[10px] hover:bg-gray-900 transition-colors"
                >
                  <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                    <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.302 2.302-2.302 2.302-2.652-2.652 2.652-2.652zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z" />
                  </svg>
                  <div className="text-left">
                    <p className="text-[9px] uppercase tracking-wider opacity-80 leading-none mb-0.5">Get it on</p>
                    <p className="text-[14px] font-semibold leading-none">Google Play</p>
                  </div>
                </a>
                <div className="flex flex-col items-center gap-2">
                  <div className="inline-flex items-center gap-3 bg-black/80 text-white px-5 py-2.5 rounded-[10px] cursor-not-allowed">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                    </svg>
                    <div className="text-left">
                      <p className="text-[9px] uppercase tracking-wider opacity-80 leading-none mb-0.5">Download on the</p>
                      <p className="text-[14px] font-semibold leading-none">App Store</p>
                    </div>
                  </div>
                  <span className="text-[#4a0581] text-[11px] font-bold tracking-wide">Coming Soon</span>
                </div>
              </div>
            </div>

            {/* Vertical Divider */}
            <div className="hidden lg:block w-[1px] h-[160px] bg-gradient-to-b from-transparent via-[#eae7e7] to-transparent"></div>

            {/* Right: Features */}
            <div className="lg:w-1/3 py-10 px-8 lg:px-12 flex items-center justify-center lg:justify-start">
              <div className="flex gap-8 md:gap-10">
                {[
                  { icon: <Smartphone size={24} strokeWidth={1.5} />, label: 'Easy to Use' },
                  { icon: <ShieldCheck size={24} strokeWidth={1.5} />, label: 'Secure & Safe' },
                  { icon: <Scan size={24} strokeWidth={1.5} />, label: 'Fast & Reliable' },
                ].map((f, i) => (
                  <div key={i} className="flex flex-col items-center text-center gap-3">
                    <div className="w-14 h-14 rounded-[18px] bg-white border border-[#eae7e7] flex items-center justify-center text-[#4a0581] shadow-sm">
                      {f.icon}
                    </div>
                    <span className="text-[12px] font-bold text-[#1c1b1b] max-w-[70px] leading-tight">{f.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          8. TESTIMONIALS
      ═══════════════════════════════════════════ */}
      <section className="py-16 md:py-24 bg-[#fcf9f8]">
        <div className="max-w-[1536px] mx-auto px-5 md:px-16">
          <motion.div
            className="text-center mb-14"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <h2 className="text-[28px] md:text-[36px] font-bold mb-3" style={{ fontFamily: "'Libre Caslon Text', serif" }}>
              What Our Customers Say
            </h2>
          </motion.div>

          <div className="relative">
            {/* Desktop: Show all 3 */}
            <div className="hidden md:grid md:grid-cols-3 gap-8">
              {TESTIMONIALS.map((t, i) => (
                <motion.div
                  key={i}
                  className="bg-white rounded-2xl p-8 shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-[#eae7e7] hover:shadow-[0_8px_30px_rgba(74,5,129,0.1)] transition-all duration-300"
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  custom={i}
                >
                  <div className="text-[#dcb8ff] mb-4">
                    <Quote size={32} />
                  </div>
                  <p className="text-[14px] text-[#4c4451] leading-relaxed mb-6 italic">
                    "{t.text}"
                  </p>
                  <div className="flex items-center gap-3 pt-4 border-t border-[#f0eded]">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#dcb8ff] to-[#4a0581] flex items-center justify-center text-white text-[14px] font-bold">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-[#1c1b1b]">{t.name}</p>
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, si) => (
                          <Star key={si} size={12} className="text-[#f59e0b] fill-[#f59e0b]" />
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Mobile: Carousel */}
            <div className="md:hidden">
              <div className="bg-white rounded-2xl p-8 shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-[#eae7e7]">
                <div className="text-[#dcb8ff] mb-4">
                  <Quote size={32} />
                </div>
                <p className="text-[14px] text-[#4c4451] leading-relaxed mb-6 italic">
                  "{TESTIMONIALS[testimonialIdx].text}"
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-[#f0eded]">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#dcb8ff] to-[#4a0581] flex items-center justify-center text-white text-[14px] font-bold">
                    {TESTIMONIALS[testimonialIdx].name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-[#1c1b1b]">{TESTIMONIALS[testimonialIdx].name}</p>
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, si) => (
                        <Star key={si} size={12} className="text-[#f59e0b] fill-[#f59e0b]" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Nav Arrows */}
            <div className="flex justify-center gap-4 mt-8">
              <button
                onClick={prevTestimonial}
                className="w-10 h-10 rounded-full border-2 border-[#cec3d3] text-[#7d7483] flex items-center justify-center hover:bg-[#4a0581] hover:text-white hover:border-[#4a0581] transition-all duration-300"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={nextTestimonial}
                className="w-10 h-10 rounded-full border-2 border-[#cec3d3] text-[#7d7483] flex items-center justify-center hover:bg-[#4a0581] hover:text-white hover:border-[#4a0581] transition-all duration-300"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          9. FOOTER
      ═══════════════════════════════════════════ */}
      <LandingFooter />
    </div>
  );
};

export default SewZellaLanding;
