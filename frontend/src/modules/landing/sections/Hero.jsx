import React from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, ShieldCheck, Truck, Radar, Sparkles, Scissors } from 'lucide-react';
import { Eyebrow, StoreButtons, Glyph } from '../components/landingShared';
import { SERIF, EASE, fadeUp, stagger } from '../components/landingTokens';

const TRUST = [
  { icon: ShieldCheck, label: 'Verified tailors' },
  { icon: Truck, label: 'Doorstep pickup & delivery' },
  { icon: Radar, label: 'Live order tracking' },
];

/** Gentle idle float for decorative cards (disabled for reduced-motion users). */
const useFloat = (distance = 10, duration = 6, delay = 0) => {
  const reduce = useReducedMotion();
  return reduce
    ? {}
    : { animate: { y: [0, -distance, 0] }, transition: { duration, delay, repeat: Infinity, ease: 'easeInOut' } };
};

const HeroVisual = () => {
  const floatA = useFloat(10, 6.5);
  const floatB = useFloat(12, 7.5, 0.8);
  const floatC = useFloat(8, 5.5, 0.4);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, ease: EASE, delay: 0.15 }}
      className="relative mx-auto h-[440px] w-full max-w-[560px] sm:h-[540px] lg:h-[600px]"
    >
      {/* soft halo + orbit ring */}
      <div className="absolute left-1/2 top-[46%] h-[86%] w-[86%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_50%_40%,#EBD6F4_0%,#F6EEFA_55%,transparent_72%)]" />
      <svg className="absolute left-1/2 top-[46%] h-[94%] w-[94%] -translate-x-1/2 -translate-y-1/2 text-[#843D9B]/20" viewBox="0 0 200 200" aria-hidden="true">
        <circle cx="100" cy="100" r="98" fill="none" stroke="currentColor" strokeWidth="0.4" strokeDasharray="1.5 3" />
      </svg>

      {/* main portrait in an arch frame */}
      <div className="absolute bottom-0 left-1/2 h-[90%] w-[64%] -translate-x-1/2 overflow-hidden rounded-t-[999px] rounded-b-[32px] bg-[#E9DDE9] shadow-[0_40px_80px_-30px_rgba(74,21,96,0.45)] ring-[6px] ring-white">
        <img
          src="/landing/opt/womens-wear.jpg"
          alt="Woman in a custom-stitched maroon and gold bridal lehenga"
          fetchpriority="high"
          className="h-full w-full object-cover object-[50%_18%]"
        />
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#2A0F38]/35 to-transparent" />
      </div>

      {/* men's wear polaroid */}
      <motion.div {...floatA} className="absolute left-0 top-[8%] w-[30%] max-w-[160px]">
        <div className="-rotate-6 overflow-hidden rounded-[22px] bg-white p-1.5 shadow-[0_24px_50px_-18px_rgba(42,15,56,0.45)]">
          <img src="/landing/opt/mens-wear.jpg" alt="Man in a tailored navy velvet bandhgala" loading="lazy" className="aspect-[4/5] w-full rounded-[16px] object-cover object-top" />
        </div>
      </motion.div>

      {/* kids wear polaroid */}
      <motion.div {...floatB} className="absolute bottom-[10%] right-0 w-[28%] max-w-[150px]">
        <div className="rotate-6 overflow-hidden rounded-[22px] bg-white p-1.5 shadow-[0_24px_50px_-18px_rgba(42,15,56,0.45)]">
          <img src="/landing/opt/kids-wear.jpg" alt="Children in festive Indian outfits" loading="lazy" className="aspect-[4/5] w-full rounded-[16px] object-cover object-[30%_30%]" />
        </div>
      </motion.div>

      {/* live tracking chip */}
      <motion.div {...floatC} className="absolute right-[2%] top-[14%] w-[46%] max-w-[220px] sm:right-[4%]">
        <div className="rounded-2xl bg-white/85 p-3 shadow-[0_20px_44px_-18px_rgba(42,15,56,0.4)] ring-1 ring-white backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F3E9F8] text-[#843D9B]">
              <Scissors size={13} />
            </span>
            <div className="min-w-0">
              <p className="text-[11px] font-bold leading-tight text-[#1A1523]">Stitching in progress</p>
              <p className="text-[9.5px] text-[#6B6575]">Live update from your tailor</p>
            </div>
          </div>
          <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-[#F3E9F8]">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-[#843D9B] to-[#C07AD8]"
              initial={{ width: '12%' }}
              animate={{ width: '64%' }}
              transition={{ duration: 1.8, delay: 0.9, ease: EASE }}
            />
          </div>
        </div>
      </motion.div>

      {/* verified tailor chip */}
      <motion.div
        initial={{ opacity: 0, x: -16 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.7, delay: 1.1, ease: EASE }}
        className="absolute bottom-[22%] left-[2%] sm:left-[4%]"
      >
        <div className="flex items-center gap-2.5 rounded-full bg-white/90 py-1.5 pl-1.5 pr-4 shadow-[0_18px_40px_-16px_rgba(42,15,56,0.4)] ring-1 ring-white backdrop-blur-md">
          <img src="/landing/opt/tailor-partner.jpg" alt="" loading="lazy" className="h-8 w-8 rounded-full object-cover" />
          <div className="leading-tight">
            <p className="text-[11px] font-bold text-[#1A1523]">Verified tailor</p>
            <p className="flex items-center gap-1 text-[9.5px] text-[#2E8B57]">
              <ShieldCheck size={10} /> Documents verified
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const Hero = ({ appName }) => (
  <section id="top" className="relative overflow-hidden pt-28 pb-10 sm:pt-32 lg:pt-36 lg:pb-16">
    {/* page wash */}
    <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#F7F0FB_0%,#FDFBFE_55%,#FFFFFF_100%)]" />
    <div className="pointer-events-none absolute -left-40 top-20 h-[420px] w-[420px] rounded-full bg-[#F1E3F7] blur-3xl" />

    <div className="relative mx-auto grid max-w-[1240px] grid-cols-1 items-center gap-10 px-5 md:px-8 lg:grid-cols-[1.02fr_1fr] lg:gap-6">
      <motion.div initial="hidden" animate="visible" variants={stagger} className="max-w-[600px]">
        <motion.div variants={fadeUp}>
          <Eyebrow icon={Sparkles}>Your personal tailoring studio</Eyebrow>
        </motion.div>

        <motion.h1
          variants={fadeUp}
          custom={1}
          className="mt-6 text-[44px] font-semibold leading-[1.02] tracking-[-0.025em] text-[#1A1523] sm:text-[60px] lg:text-[72px]"
          style={{ fontFamily: SERIF }}
        >
          Your perfect fit,
          <br />
          <em className="font-medium text-[#843D9B]">stitched to order.</em>
        </motion.h1>

        <motion.p variants={fadeUp} custom={2} className="mt-6 max-w-[520px] text-[16px] leading-relaxed text-[#5E5768] sm:text-[17px]">
          Pick a style, share your measurements and let a verified tailor craft it for you.
          {' '}{appName} picks up your fabric, updates you at every stage and delivers to your door.
        </motion.p>

        <motion.div variants={fadeUp} custom={3} className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
          <StoreButtons />
        </motion.div>

        <motion.div variants={fadeUp} custom={4} className="mt-5">
          <Link
            to="/user/services"
            className="group inline-flex items-center gap-2 text-[14px] font-semibold text-[#843D9B]"
          >
            Explore services on the web
            <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </motion.div>

        <motion.ul variants={fadeUp} custom={5} className="mt-9 flex flex-wrap gap-x-6 gap-y-3 border-t border-[#EDE5F3] pt-6">
          {TRUST.map(({ icon, label }) => (
            <li key={label} className="flex items-center gap-2 text-[13px] font-medium text-[#3A3343]">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#F3E9F8] text-[#843D9B]">
                <Glyph icon={icon} size={14} strokeWidth={2} />
              </span>
              {label}
            </li>
          ))}
        </motion.ul>

        <motion.p variants={fadeUp} custom={6} className="mt-6 text-[18px] italic text-[#843D9B]/80" style={{ fontFamily: SERIF }}>
          Fashion · Tailoring · Perfection
        </motion.p>
      </motion.div>

      <HeroVisual />
    </div>
  </section>
);

export default Hero;
