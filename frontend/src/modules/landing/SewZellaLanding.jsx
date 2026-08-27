import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Download, ChevronRight, ChevronLeft, Scissors, Ruler, Shirt, Star,
  CheckCircle, Truck, Eye, Smartphone, Shield, ShieldCheck,
  Users, BarChart3, Package, Globe, Quote, Scan, ArrowRight
} from 'lucide-react';
import LandingNavbar from './components/LandingNavbar';
import LandingFooter from './components/LandingFooter';
import MobileBottomNav from './components/MobileBottomNav';
import useBrandingStore from '../../store/brandingStore';
import heroImage from '../../assets/images/ChatGPT Image Aug 25, 2026, 12_08_10 PM.png';

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] },
  }),
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

const TRUST_FEATURES = [
  { icon: CheckCircle, title: 'Perfect Fit Every Time', desc: 'Custom-stitched outfits made for you.' },
  { icon: Scan, title: 'AI Measurement Assistant', desc: 'Get accurate measurements instantly using AI.' },
  { icon: ShieldCheck, title: 'Verified Tailors', desc: 'Experienced & trusted tailoring professionals.' },
  { icon: Truck, title: 'Doorstep Pickup & Delivery', desc: 'We pick up, stitch & deliver to your door.' },
  { icon: Eye, title: 'Live Order Tracking', desc: 'Track your order from stitching to delivery.' },
  { icon: Smartphone, title: 'Real-Time Updates', desc: 'Get stitching updates & photos from your tailor.' },
];

const HOW_STEPS = [
  {
    num: '01',
    title: 'Choose Your Style',
    desc: 'Browse from a wide range of outfits and select your fabric and style with our AI assistant.',
    icon: Shirt,
  },
  {
    num: '02',
    title: 'Share Measurements',
    desc: 'Enter your measurements manually or use our AI Assistant.',
    icon: Ruler,
  },
  {
    num: '03',
    title: 'Tailor Starts Stitching',
    desc: 'Your order is assigned to a verified tailor who starts stitching.',
    icon: Scissors,
  },
  {
    num: '04',
    title: 'Track Progress',
    desc: 'Receive real-time updates and photos of your stitching progress.',
    icon: Eye,
  },
  {
    num: '05',
    title: 'Get It Delivered',
    desc: 'Your perfect outfit is quality checked and delivered to your doorstep.',
    icon: Package,
  },
];

const CATEGORIES = [
  { title: "Women's Wear", desc: 'Designer blouses, suits, kurtis, lehengas & more', img: '/landing/category_womens_wear.png' },
  { title: "Men's Wear", desc: 'Kurtas, shirts, pathani suits, formal wear', img: '/landing/category_mens_wear.png' },
  { title: 'Kids Wear', desc: 'Adorable outfits for every occasion', img: '/landing/category_kids_wear.png' },
  { title: 'Bridal Wear', desc: 'Wedding & festive custom stitching', img: '/landing/category_bridal_wear.png' },
  { title: 'Alterations', desc: 'Perfect fitting for your existing outfits', img: '/landing/category_alterations.png' },
  { title: 'Bulk Stitching', desc: 'For boutiques, schools, companies & more', img: '/landing/category_bulk_stitching.png' },
];

const PARTNER_FEATURES = [
  { icon: Package, label: 'Receive more orders' },
  { icon: Users, label: 'Manage customers digitally' },
  { icon: BarChart3, label: 'Track earnings and growth' },
  { icon: Truck, label: 'Get delivery support' },
  { icon: Globe, label: 'Build your online presence' },
];

const TRACK_LEFT = [
  { label: 'Order Confirmed', date: '10 Jun, 10:30 AM', icon: Package },
  { label: 'Measurements Received', date: '10 Jun, 12:45 PM', icon: Ruler },
  { label: 'Tailor Assigned', date: '10 Jun, 01:30 PM', icon: Users },
  { label: 'Stitching In Progress', date: '11 Jun, 09:15 AM', icon: Scissors },
];

const TRACK_RIGHT = [
  { label: 'Quality Check', date: '13 Jun, 04:30 PM', icon: Shield, done: true },
  { label: 'Out For Delivery', date: '14 Jun, 10:30 AM', icon: Truck, done: true },
  { label: 'Delivered', date: '14 Jun, 02:45 PM', icon: CheckCircle, delivered: true },
];

const APP_FEATURES = [
  { icon: Smartphone, label: 'Easy to Use' },
  { icon: ShieldCheck, label: 'Secure & Safe' },
  { icon: Scan, label: 'Fast & Reliable' },
];

const SewZellaLanding = () => {
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const appName = useBrandingStore((state) => state.appName);

  const testimonials = [
    {
      text: `${appName} made custom stitching effortless. The fitting was absolutely perfect and the delivery was on time.`,
      name: 'Sara Madhav',
    },
    {
      text: `Real-time updates and doorstep delivery were amazing. I highly recommend ${appName} to everyone!`,
      name: 'Ayesha Patel',
    },
    {
      text: 'Finally a modern solution for tailoring. The AI measurement assistant is incredibly accurate!',
      name: 'Rohan Dev',
    },
  ];

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const nextTestimonial = () => setTestimonialIdx((prev) => (prev + 1) % testimonials.length);
  const prevTestimonial = () =>
    setTestimonialIdx((prev) => (prev - 1 + testimonials.length) % testimonials.length);

  return (
    <div
      className="min-h-screen bg-white text-[#1A1523] overflow-x-hidden pb-20 md:pb-0"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <LandingNavbar />
      <MobileBottomNav />

      {/* ─── HERO ─── */}
      <section className="relative pt-24 md:pt-28 pb-14 md:pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_85%_20%,#F3EAF8_0%,transparent_55%)] pointer-events-none" />
        <div className="max-w-[1200px] mx-auto px-5 md:px-8 relative">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div initial="hidden" animate="visible" variants={stagger}>
              <motion.h1
                variants={fadeUp}
                className="text-[36px] sm:text-[48px] lg:text-[56px] font-bold leading-[1.1] md:leading-[1.08] tracking-[-0.02em] text-[#1A1523] mb-4 md:mb-5"
                style={{ fontFamily: "'Libre Caslon Text', serif" }}
              >
                Custom Tailoring,
                <br />
                Delivered to{' '}
                <span className="italic text-[#843D9B]">Your Doorstep</span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                custom={1}
                className="text-[#6B6575] text-[15px] md:text-[16px] leading-relaxed mb-8 max-w-md"
              >
                Design, customize, and stitch your perfect outfit from the comfort of your home.{' '}
                {appName} connects customers with skilled tailors and seamless doorstep delivery.
              </motion.p>

              <motion.div variants={fadeUp} custom={2} className="flex flex-wrap gap-3 mb-9">
                <a
                  href="https://play.google.com/store/apps/details?id=com.sewzella.user&pcampaignid=web_share"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-[#843D9B] text-white px-6 py-3.5 rounded-xl text-[14px] font-semibold hover:bg-[#5c0a9e] transition-all duration-300 shadow-[0_10px_28px_rgba(74,5,129,0.25)]"
                >
                  Download App
                  <ArrowRight size={16} />
                </a>
                <a
                  href="https://play.google.com/store/apps/details?id=com.sewzella.tailor&pcampaignid=web_share"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 border border-[#843D9B]/40 text-[#843D9B] px-6 py-3.5 rounded-xl text-[14px] font-semibold hover:bg-[#F3EAF8] transition-all duration-300"
                >
                  <Scissors size={15} />
                  Become a Tailor
                </a>
              </motion.div>

              <motion.div
                variants={fadeUp}
                custom={3}
                className="flex items-center gap-3 text-[13px] text-[#6B6575]"
              >
                <div className="flex -space-x-2">
                  {['S', 'A', 'R'].map((letter, i) => (
                    <div
                      key={i}
                      className="w-8 h-8 rounded-full bg-[#843D9B] border-2 border-white flex items-center justify-center text-white text-[10px] font-bold"
                    >
                      {letter}
                    </div>
                  ))}
                </div>
                <span>
                  Trusted by <strong className="text-[#1A1523]">10,000+</strong> customers and
                  tailoring professionals across Kashmir.
                </span>
              </motion.div>
            </motion.div>

            <motion.div
              className="relative flex justify-center lg:justify-end"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
            >
              <div className="relative w-full max-w-[450px] md:max-w-[520px] lg:max-w-[580px]">
                <img
                  src={heroImage}
                  alt={`${appName} premium tailoring`}
                  className="w-full h-auto object-contain mix-blend-multiply"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── TRUST HIGHLIGHTS ─── */}
      <section className="pb-6 md:pb-10">
        <div className="max-w-[1200px] mx-auto px-5 md:px-8">
          <motion.div
            className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-10 py-10 border-y border-[#EDE8F2]"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            variants={stagger}
          >
            {TRUST_FEATURES.slice(0, 4).map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div
                  key={f.title}
                  variants={fadeUp}
                  custom={i}
                  className="flex flex-col items-center text-center gap-3"
                >
                  <Icon size={28} strokeWidth={1.4} className="text-[#843D9B]" />
                  <div>
                    <h3 className="text-[14px] font-bold text-[#1A1523] mb-1">{f.title}</h3>
                    <p className="text-[12px] text-[#6B6575] leading-snug max-w-[180px] mx-auto">
                      {f.desc}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </section>

      {/* ─── FEATURE CARDS ─── */}
      <section className="py-16 md:py-20 bg-[#FAF8FC]">
        <div className="max-w-[1200px] mx-auto px-5 md:px-8">
          <motion.div
            className="bg-white rounded-[28px] border border-[#EDE8F2] shadow-[0_12px_40px_rgba(26,21,35,0.04)] p-6 md:p-10"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            variants={stagger}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
              {TRUST_FEATURES.map((f, i) => {
                const Icon = f.icon;
                return (
                  <motion.div key={f.title} variants={fadeUp} custom={i} className="flex gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#F3EAF8] flex items-center justify-center shrink-0">
                      <Icon size={22} strokeWidth={1.5} className="text-[#843D9B]" />
                    </div>
                    <div>
                      <h3 className="text-[15px] font-bold text-[#1A1523] mb-1.5">{f.title}</h3>
                      <p className="text-[13px] text-[#6B6575] leading-relaxed">{f.desc}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how-it-works" className="py-16 md:py-24 bg-white">
        <div className="max-w-[1200px] mx-auto px-5 md:px-8">
          <motion.div
            className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12 md:mb-14"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <h2
              className="text-[28px] md:text-[36px] font-bold text-[#1A1523]"
              style={{ fontFamily: "'Libre Caslon Text', serif" }}
            >
              How {appName} Works
            </h2>
            <a
              href="https://play.google.com/store/apps/details?id=com.sewzella.user&pcampaignid=web_share"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 self-start md:self-auto border border-[#EDE8F2] text-[#843D9B] px-5 py-2.5 rounded-xl text-[13px] font-semibold hover:border-[#843D9B]/40 hover:bg-[#FAF8FC] transition-all"
            >
              Download App
              <ArrowRight size={14} />
            </a>
          </motion.div>

          <motion.div
            className="relative"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            variants={stagger}
          >
            <div className="hidden xl:block absolute top-[72px] left-[8%] right-[8%] border-t border-dashed border-[#D4C8E2] z-0" />

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-5 relative z-10">
              {HOW_STEPS.map((step, i) => {
                const Icon = step.icon;
                return (
                  <motion.div
                    key={step.num}
                    variants={fadeUp}
                    custom={i}
                    className="relative bg-white rounded-2xl border border-[#EDE8F2] p-5 md:p-6 md:pt-8 shadow-[0_4px_20px_rgba(26,21,35,0.03)] hover:shadow-[0_12px_32px_rgba(74,5,129,0.08)] hover:border-[#DCCFEA] transition-all duration-300 flex flex-row md:flex-col gap-4 md:gap-0"
                  >
                    <div className="hidden md:flex absolute -top-3 left-5 w-8 h-8 rounded-full bg-[#843D9B] text-white text-[11px] font-bold items-center justify-center shadow-[0_4px_12px_rgba(74,5,129,0.3)]">
                      {step.num}
                    </div>
                    
                    <div className="md:hidden shrink-0 flex flex-col items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-[#843D9B] text-white text-[11px] font-bold flex items-center justify-center shadow-[0_2px_8px_rgba(74,5,129,0.25)]">
                        {step.num}
                      </div>
                      {i < HOW_STEPS.length - 1 && (
                         <div className="w-px h-full bg-[#EDE8F2] flex-1 mt-1"></div>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col items-start md:items-center">
                      <div className="hidden md:flex w-14 h-14 rounded-full bg-[#F3EAF8] items-center justify-center mb-5 mx-auto">
                        <Icon size={24} strokeWidth={1.4} className="text-[#843D9B]" />
                      </div>
                      <div className="md:hidden flex items-center gap-2 mb-1.5">
                        <Icon size={18} strokeWidth={1.5} className="text-[#843D9B]" />
                        <h3
                          className="text-[16px] font-bold text-[#1A1523] leading-tight"
                          style={{ fontFamily: "'Libre Caslon Text', serif" }}
                        >
                          {step.title}
                        </h3>
                      </div>
                      <h3
                        className="hidden md:block text-[15px] font-bold text-[#1A1523] mb-2 text-center"
                        style={{ fontFamily: "'Libre Caslon Text', serif" }}
                      >
                        {step.title}
                      </h3>
                      <p className="text-[13px] md:text-[12px] text-[#6B6575] leading-relaxed text-left md:text-center mt-1 md:mt-0">
                        {step.desc}
                      </p>
                    </div>

                    {i < HOW_STEPS.length - 1 && (
                      <ChevronRight
                        size={18}
                        className="hidden xl:block absolute -right-3 top-1/2 -translate-y-1/2 text-[#C9B5DE] z-20"
                      />
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── CATEGORIES ─── */}
      <section id="categories" className="py-16 md:py-24 bg-[#FAF8FC]">
        <div className="max-w-[1200px] mx-auto px-5 md:px-8">
          <motion.div
            className="text-center mb-12 md:mb-14"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <h2
              className="text-[28px] md:text-[36px] font-bold mb-3 text-[#1A1523]"
              style={{ fontFamily: "'Libre Caslon Text', serif" }}
            >
              Popular Categories
            </h2>
            <p className="text-[#6B6575] text-[15px] max-w-lg mx-auto">
              Explore our most loved custom stitching categories
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-40px' }}
            variants={stagger}
          >
            {CATEGORIES.map((cat, i) => (
              <motion.div
                key={cat.title}
                variants={fadeUp}
                custom={i}
                className="group cursor-default"
              >
                <div className="relative aspect-[4/5] rounded-2xl overflow-hidden mb-4 bg-[#F3EAF8] border border-[#EDE8F2]">
                  <img
                    src={cat.img}
                    alt={cat.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.04]"
                  />
                </div>
                <h3 className="text-[15px] font-bold text-[#1A1523] mb-1 group-hover:text-[#843D9B] transition-colors">
                  {cat.title}
                </h3>
                <p className="text-[12px] text-[#6B6575] leading-snug">{cat.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ─── ABOUT: AI + TRACKING ─── */}
      <section id="about" className="py-16 md:py-24 bg-white">
        <div className="max-w-[1200px] mx-auto px-5 md:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
            <motion.div
              className="rounded-[24px] border border-[#EDE8F2] bg-[#FAF8FC] p-7 md:p-9 flex flex-col md:flex-row items-center gap-8"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
            >
              <div className="flex-1 w-full">
                <div className="inline-flex items-center gap-2 text-[#843D9B] font-semibold text-[13px] mb-4">
                  <Scan size={18} strokeWidth={1.6} />
                  AI Measurement Assistant
                </div>
                <h3
                  className="text-[22px] md:text-[24px] font-bold mb-3 text-[#1A1523] leading-tight"
                  style={{ fontFamily: "'Libre Caslon Text', serif" }}
                >
                  No measuring tape? No problem.
                </h3>
                <p className="text-[#6B6575] text-[13px] leading-relaxed mb-6">
                  Upload a front and side photo, enter your height and weight, and {appName} will
                  estimate your measurements instantly.
                </p>
                <div className="grid grid-cols-2 gap-y-3 gap-x-4 mb-7">
                  {['Chest', 'Shoulder', 'Waist', 'Sleeve', 'Hip', 'Neck'].map((label) => (
                    <div key={label} className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-[#843D9B] shrink-0" strokeWidth={2.2} />
                      <span className="text-[13px] font-semibold text-[#1A1523]">{label}</span>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  className="bg-[#843D9B] text-white px-6 py-3 rounded-xl text-[13px] font-semibold hover:bg-[#5c0a9e] transition-all duration-300"
                >
                  Try AI Measurement
                </button>
              </div>
              <div className="shrink-0 w-full max-w-[280px] md:max-w-[340px] flex justify-center">
                <div className="w-full rounded-2xl overflow-hidden bg-[#0f0f12] shadow-[0_16px_48px_rgba(74,5,129,0.18)] ring-1 ring-[#EDE8F2]/80">
                  <img
                    src="/landing/ai_measurement_illustration.png"
                    alt="AI Measurement Assistant — tailor mannequin and measurement chart"
                    className="w-full h-auto object-contain"
                  />
                </div>
              </div>
            </motion.div>

            <motion.div
              className="rounded-[24px] border border-[#EDE8F2] bg-white p-7 md:p-9 shadow-[0_8px_30px_rgba(26,21,35,0.04)] flex flex-col"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={1}
            >
              <div className="inline-flex items-center gap-2 text-[#843D9B] font-semibold text-[13px] mb-3">
                <Eye size={18} strokeWidth={1.6} />
                Live Order Tracking
              </div>
              <p className="text-[#1A1523] text-[14px] font-semibold mb-7">
                Stay updated at every stage of your order.
              </p>

              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 mb-8">
                <div className="space-y-5 relative">
                  <div className="absolute left-[13px] top-3 bottom-3 w-px bg-[#EDE8F2]" />
                  {TRACK_LEFT.map((step) => {
                    const Icon = step.icon;
                    return (
                      <div key={step.label} className="flex items-start gap-3 relative z-10">
                        <div className="w-7 h-7 rounded-full bg-[#843D9B] text-white flex items-center justify-center shrink-0">
                          <Icon size={12} />
                        </div>
                        <div>
                          <p className="text-[12px] font-bold text-[#1A1523] leading-tight">
                            {step.label}
                          </p>
                          <p className="text-[10px] text-[#6B6575] mt-1">{step.date}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="space-y-5 relative md:mt-2">
                  <div className="absolute left-[13px] top-3 bottom-3 w-px bg-[#EDE8F2]" />
                  {TRACK_RIGHT.map((step) => {
                    const Icon = step.icon;
                    return (
                      <div key={step.label} className="flex items-start gap-3 relative z-10">
                        <div
                          className={`w-7 h-7 rounded-full text-white flex items-center justify-center shrink-0 ${
                            step.delivered ? 'bg-emerald-500' : 'bg-[#843D9B]'
                          }`}
                        >
                          <Icon size={12} strokeWidth={step.delivered ? 3 : 2} />
                        </div>
                        <div>
                          <p className="text-[12px] font-bold text-[#1A1523] leading-tight">
                            {step.label}
                          </p>
                          <p className="text-[10px] text-[#6B6575] mt-1">{step.date}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-center mt-auto">
                <button
                  type="button"
                  className="border border-[#DCCFEA] text-[#843D9B] px-7 py-2.5 rounded-xl text-[13px] font-semibold hover:border-[#843D9B] transition-all duration-300"
                >
                  Track Your Order
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── MID CTA BANNER ─── */}
      <section className="py-8 md:py-10 bg-white">
        <div className="max-w-[1200px] mx-auto px-5 md:px-8">
          <motion.div
            className="relative overflow-hidden rounded-[24px] bg-[#843D9B] px-6 py-8 md:px-10 md:py-10"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <div
              className="absolute inset-0 opacity-[0.12] pointer-events-none"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 20% 50%, #fff 0.6px, transparent 0.7px), radial-gradient(circle at 80% 30%, #fff 0.6px, transparent 0.7px)',
                backgroundSize: '28px 28px',
              }}
            />
            <div className="relative flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4 text-white">
                <div className="w-12 h-12 rounded-full border border-white/30 flex items-center justify-center shrink-0">
                  <Download size={20} />
                </div>
                <div>
                  <p className="text-[13px] text-white/75 font-medium mb-0.5">Download App</p>
                  <p
                    className="text-[20px] md:text-[24px] font-bold leading-tight"
                    style={{ fontFamily: "'Libre Caslon Text', serif" }}
                  >
                    Your perfect outfit is just a few taps away.
                  </p>
                </div>
              </div>
              <a
                href="https://play.google.com/store/apps/details?id=com.sewzella.user&pcampaignid=web_share"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-white text-[#843D9B] px-6 py-3 rounded-xl text-[14px] font-bold hover:bg-[#F3EAF8] transition-all shrink-0"
              >
                Download App
                <ArrowRight size={16} />
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── TRUST STAT ─── */}
      <section className="py-12 md:py-16 bg-white">
        <div className="max-w-[1200px] mx-auto px-5 md:px-8">
          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-12 text-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <div className="flex items-center gap-3">
              <Users size={22} strokeWidth={1.4} className="text-[#843D9B]" />
              <div className="text-left">
                <p className="text-[22px] font-bold text-[#1A1523]">10,000+</p>
                <p className="text-[12px] text-[#6B6575]">Customers & professionals across Kashmir</p>
              </div>
            </div>
            <div className="hidden sm:block w-px h-10 bg-[#EDE8F2]" />
            <div className="flex items-center gap-3">
              <ShieldCheck size={22} strokeWidth={1.4} className="text-[#843D9B]" />
              <div className="text-left">
                <p className="text-[15px] font-bold text-[#1A1523]">Verified Tailors</p>
                <p className="text-[12px] text-[#6B6575]">Experienced & trusted professionals</p>
              </div>
            </div>
            <div className="hidden sm:block w-px h-10 bg-[#EDE8F2]" />
            <div className="flex items-center gap-3">
              <Truck size={22} strokeWidth={1.4} className="text-[#843D9B]" />
              <div className="text-left">
                <p className="text-[15px] font-bold text-[#1A1523]">Doorstep Delivery</p>
                <p className="text-[12px] text-[#6B6575]">Pickup, stitch & deliver</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── BECOME A PARTNER ─── */}
      <section id="become-partner" className="py-16 md:py-20 bg-[#FAF8FC]">
        <div className="max-w-[1200px] mx-auto px-5 md:px-8">
          <motion.div
            className="relative bg-[#843D9B] rounded-[28px] overflow-hidden"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <div className="flex flex-col lg:flex-row">
              <div className="flex-1 p-8 md:p-12 lg:p-14 text-white">
                <h2
                  className="text-[28px] md:text-[36px] font-bold mb-3"
                  style={{ fontFamily: "'Libre Caslon Text', serif" }}
                >
                  Become a Tailor Partner
                </h2>
                <p className="text-white/75 text-[15px] mb-8 max-w-md">
                  Grow your tailoring business with {appName}.
                </p>

                <div className="flex flex-wrap gap-2.5 mb-10">
                  {PARTNER_FEATURES.map((f) => {
                    const Icon = f.icon;
                    return (
                      <div
                        key={f.label}
                        className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-2 rounded-full text-[12px] font-medium border border-white/15"
                      >
                        <Icon size={15} strokeWidth={1.6} />
                        {f.label}
                      </div>
                    );
                  })}
                </div>

                <div className="flex flex-wrap gap-3">
                  <a
                    href="https://play.google.com/store/apps/details?id=com.sewzella.tailor&pcampaignid=web_share"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-white text-[#843D9B] px-7 py-3.5 rounded-xl text-[14px] font-bold hover:bg-[#F3EAF8] transition-all"
                  >
                    Join as Tailor <ChevronRight size={16} />
                  </a>
                  <a
                    href="https://play.google.com/store/apps/details?id=com.sewzella.delivery&pcampaignid=web_share"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-transparent text-white border border-white/50 px-7 py-3.5 rounded-xl text-[14px] font-bold hover:bg-white hover:text-[#843D9B] transition-all"
                  >
                    Join as Delivery Boy <ChevronRight size={16} />
                  </a>
                </div>
              </div>

              <div className="hidden lg:flex items-end justify-end shrink-0 pr-8 pt-8">
                <img
                  src="/landing/tailor_partner_woman.png"
                  alt="Tailor Partner"
                  className="w-[280px] h-[320px] object-cover object-top rounded-t-2xl"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── DOWNLOAD APP ─── */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-[1200px] mx-auto px-5 md:px-8">
          <motion.div
            className="rounded-[28px] border border-[#EDE8F2] bg-[#FAF8FC] overflow-hidden flex flex-col lg:flex-row items-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <div className="lg:w-1/3 flex justify-center pt-10 px-8 lg:pt-0 lg:pl-12">
              <img
                src="/download.png"
                alt={`${appName} App Download`}
                className="w-[220px] md:w-[280px] object-contain object-bottom max-h-[360px]"
              />
            </div>

            <div className="lg:w-1/3 py-10 px-8 lg:px-6 text-center lg:text-left flex flex-col items-center lg:items-start">
              <h2
                className="text-[28px] md:text-[34px] font-bold text-[#843D9B] mb-3 leading-tight"
                style={{ fontFamily: "'Libre Caslon Text', serif" }}
              >
                Download {appName}
              </h2>
              <p className="text-[#6B6575] text-[14px] mb-8 max-w-sm">
                Your perfect outfit is just a few taps away.
              </p>

              <div className="flex flex-row flex-wrap gap-3 justify-center lg:justify-start">
                <a
                  href="https://play.google.com/store"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 bg-[#1A1523] text-white px-5 py-2.5 rounded-xl hover:bg-black transition-colors"
                >
                  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden>
                    <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 0 1-.61-.92V2.734a1 1 0 0 1 .609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.302 2.302-2.302 2.302-2.652-2.652 2.652-2.652zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z" />
                  </svg>
                  <div className="text-left">
                    <p className="text-[9px] uppercase tracking-wider opacity-80 leading-none mb-0.5">
                      Get it on
                    </p>
                    <p className="text-[14px] font-semibold leading-none">Google Play</p>
                  </div>
                </a>
                <div className="flex flex-col items-center gap-1.5">
                  <div className="inline-flex items-center gap-3 bg-[#1A1523]/70 text-white px-5 py-2.5 rounded-xl cursor-not-allowed">
                    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden>
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                    </svg>
                    <div className="text-left">
                      <p className="text-[9px] uppercase tracking-wider opacity-80 leading-none mb-0.5">
                        Download on the
                      </p>
                      <p className="text-[14px] font-semibold leading-none">App Store</p>
                    </div>
                  </div>
                  <span className="text-[#843D9B] text-[11px] font-bold tracking-wide">
                    Coming Soon
                  </span>
                </div>
              </div>
            </div>

            <div className="hidden lg:block w-px self-stretch my-16 bg-[#EDE8F2]" />

            <div className="lg:w-1/3 py-8 px-8 lg:px-10 pb-12 lg:pb-8 flex items-center justify-center">
              <div className="flex gap-8">
                {APP_FEATURES.map((f) => {
                  const Icon = f.icon;
                  return (
                    <div key={f.label} className="flex flex-col items-center text-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-white border border-[#EDE8F2] flex items-center justify-center text-[#843D9B]">
                        <Icon size={22} strokeWidth={1.4} />
                      </div>
                      <span className="text-[12px] font-bold text-[#1A1523] max-w-[72px] leading-tight">
                        {f.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section className="py-16 md:py-24 bg-[#FAF8FC]">
        <div className="max-w-[1200px] mx-auto px-5 md:px-8">
          <motion.div
            className="text-center mb-12 md:mb-14"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
          >
            <h2
              className="text-[28px] md:text-[36px] font-bold text-[#1A1523]"
              style={{ fontFamily: "'Libre Caslon Text', serif" }}
            >
              What Our Customers Say
            </h2>
          </motion.div>

          <div className="relative">
            <div className="hidden md:grid md:grid-cols-3 gap-6">
              {testimonials.map((t, i) => (
                <motion.div
                  key={t.name}
                  className="bg-white rounded-2xl p-8 border border-[#EDE8F2] shadow-[0_4px_20px_rgba(26,21,35,0.03)]"
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  custom={i}
                >
                  <Quote size={28} className="text-[#DCCFEA] mb-4" />
                  <p className="text-[14px] text-[#6B6575] leading-relaxed mb-6 italic">
                    &ldquo;{t.text}&rdquo;
                  </p>
                  <div className="flex items-center gap-3 pt-4 border-t border-[#EDE8F2]">
                    <div className="w-10 h-10 rounded-full bg-[#843D9B] flex items-center justify-center text-white text-[14px] font-bold">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-[#1A1523]">{t.name}</p>
                      <div className="flex gap-0.5 mt-0.5">
                        {[...Array(5)].map((_, si) => (
                          <Star key={si} size={11} className="text-amber-400 fill-amber-400" />
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="md:hidden">
              <div className="bg-white rounded-2xl p-8 border border-[#EDE8F2]">
                <Quote size={28} className="text-[#DCCFEA] mb-4" />
                <p className="text-[14px] text-[#6B6575] leading-relaxed mb-6 italic">
                  &ldquo;{testimonials[testimonialIdx].text}&rdquo;
                </p>
                <div className="flex items-center gap-3 pt-4 border-t border-[#EDE8F2]">
                  <div className="w-10 h-10 rounded-full bg-[#843D9B] flex items-center justify-center text-white text-[14px] font-bold">
                    {testimonials[testimonialIdx].name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-[13px] font-bold text-[#1A1523]">
                      {testimonials[testimonialIdx].name}
                    </p>
                    <div className="flex gap-0.5 mt-0.5">
                      {[...Array(5)].map((_, si) => (
                        <Star key={si} size={11} className="text-amber-400 fill-amber-400" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-center gap-3 mt-8">
              <button
                type="button"
                onClick={prevTestimonial}
                className="w-10 h-10 rounded-full border border-[#EDE8F2] text-[#6B6575] flex items-center justify-center hover:bg-[#843D9B] hover:text-white hover:border-[#843D9B] transition-all"
                aria-label="Previous testimonial"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={nextTestimonial}
                className="w-10 h-10 rounded-full border border-[#EDE8F2] text-[#6B6575] flex items-center justify-center hover:bg-[#843D9B] hover:text-white hover:border-[#843D9B] transition-all"
                aria-label="Next testimonial"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </section>

      <LandingFooter />
    </div>
  );
};

export default SewZellaLanding;
