import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, ShieldCheck, Truck, Radar, Sparkles, Scissors } from 'lucide-react';
import { Eyebrow, StoreButtons, Glyph, AnimatedWords } from '../components/landingShared';
import { SERIF, EASE, fadeUp, stagger } from '../components/landingTokens';

const TRUST = [
  { icon: ShieldCheck, label: 'Verified tailors' },
  { icon: Truck, label: 'Doorstep pickup & delivery' },
  { icon: Radar, label: 'Live order tracking' },
];

/** Gentle idle float for decorative cards (disabled for reduced-motion users). */
const useFloat = (distance, duration, delay = 0) => {
  const reduce = useReducedMotion();
  return reduce
    ? {}
    : { animate: { y: [0, -distance, 0] }, transition: { duration, delay, repeat: Infinity, ease: 'easeInOut' } };
};

const HeroVisual = ({ sectionRef }) => {
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end start'] });
  // Layers drift at different speeds while the hero scrolls away (depth)
  const yBack = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -40]);
  const yFront = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -110]);
  const yMid = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -70]);

  const floatA = useFloat(10, 6.5);
  const floatB = useFloat(12, 7.5, 0.8);
  const floatC = useFloat(8, 5.5, 0.4);

  return (
    <div className="relative mx-auto h-[430px] w-full max-w-[560px] sm:h-[540px] lg:h-[610px]">
      {/* halo + slowly rotating dotted orbit */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.2, ease: EASE }}
        className="absolute left-[6%] top-[2%] h-[88%] w-[88%] rounded-full bg-[radial-gradient(circle_at_50%_40%,#EBD6F4_0%,#F6EEFA_55%,transparent_72%)]"
      />
      <motion.svg
        className="absolute left-[3%] top-[1%] h-[94%] w-[94%] text-[#843D9B]/25"
        viewBox="0 0 200 200"
        aria-hidden="true"
        animate={reduce ? undefined : { rotate: 360 }}
        transition={{ duration: 90, repeat: Infinity, ease: 'linear' }}
      >
        <circle cx="100" cy="100" r="98" fill="none" stroke="currentColor" strokeWidth="0.45" strokeDasharray="1.5 3.2" />
        <circle cx="100" cy="2" r="2.2" fill="currentColor" />
      </motion.svg>

      {/* main portrait: curtain reveal + slow settle */}
      <motion.div style={{ y: yBack }} className="absolute bottom-0 left-[18%] h-[90%] w-[64%]">
        <motion.div
          initial={reduce ? false : { clipPath: 'inset(100% 0% 0% 0%)' }}
          animate={{ clipPath: 'inset(0% 0% 0% 0%)' }}
          transition={{ duration: 1.3, ease: EASE, delay: 0.2 }}
          className="h-full w-full overflow-hidden rounded-t-[999px] rounded-b-[32px] bg-[#E9DDE9] shadow-[0_40px_80px_-30px_rgba(74,21,96,0.45)] ring-[6px] ring-white"
        >
          <motion.img
            initial={reduce ? false : { scale: 1.18 }}
            animate={{ scale: 1 }}
            transition={{ duration: 2.2, ease: EASE, delay: 0.2 }}
            src="/landing/opt/womens-wear.jpg"
            alt="Woman in a custom-stitched maroon and gold bridal lehenga"
            fetchpriority="high"
            className="h-full w-full object-cover object-[50%_18%]"
          />
          <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#2A0F38]/35 to-transparent" />
        </motion.div>
      </motion.div>

      {/* men's wear polaroid */}
      <motion.div style={{ y: yFront }} className="absolute left-0 top-[7%] w-[30%] max-w-[160px]">
        <motion.div
          initial={{ opacity: 0, x: -30, rotate: -14 }}
          animate={{ opacity: 1, x: 0, rotate: -6 }}
          transition={{ duration: 1, ease: EASE, delay: 0.75 }}
        >
          <motion.div {...floatA} className="overflow-hidden rounded-[20px] bg-white p-1.5 shadow-[0_24px_50px_-18px_rgba(42,15,56,0.45)]">
            <img src="/landing/opt/mens-wear.jpg" alt="Man in a tailored navy velvet bandhgala" className="aspect-[4/5] w-full rounded-[15px] object-cover object-top" />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* kids wear polaroid */}
      <motion.div style={{ y: yMid }} className="absolute bottom-[9%] right-0 w-[28%] max-w-[150px]">
        <motion.div
          initial={{ opacity: 0, x: 30, rotate: 14 }}
          animate={{ opacity: 1, x: 0, rotate: 6 }}
          transition={{ duration: 1, ease: EASE, delay: 0.9 }}
        >
          <motion.div {...floatB} className="overflow-hidden rounded-[20px] bg-white p-1.5 shadow-[0_24px_50px_-18px_rgba(42,15,56,0.45)]">
            <img src="/landing/opt/kids-wear.jpg" alt="Children in festive Indian outfits" className="aspect-[4/5] w-full rounded-[15px] object-cover object-[30%_30%]" />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* live tracking chip */}
      <motion.div style={{ y: yMid }} className="absolute right-[1%] top-[13%] w-[48%] max-w-[224px] sm:right-[4%]">
        <motion.div
          initial={{ opacity: 0, y: -16, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: EASE, delay: 1.1 }}
        >
          <motion.div {...floatC} className="rounded-2xl bg-white/85 p-3 shadow-[0_20px_44px_-18px_rgba(42,15,56,0.4)] ring-1 ring-white backdrop-blur-md">
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#F3E9F8] text-[#843D9B]">
                <Scissors size={13} />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-bold leading-tight text-[#1A1523]">Stitching in progress</p>
                <p className="text-[9.5px] leading-tight text-[#6B6575]">Live update from your tailor</p>
              </div>
            </div>
            <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-[#F3E9F8]">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[#843D9B] to-[#C07AD8]"
                initial={{ width: '8%' }}
                animate={{ width: '64%' }}
                transition={{ duration: 2, delay: 1.4, ease: EASE }}
              />
            </div>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* verified tailor chip */}
      <motion.div style={{ y: yFront }} className="absolute bottom-[23%] left-[1%] sm:left-[4%]">
        <motion.div
          initial={{ opacity: 0, x: -18 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 1.3, ease: EASE }}
          className="flex items-center gap-2.5 rounded-full bg-white/90 py-1.5 pl-1.5 pr-4 shadow-[0_18px_40px_-16px_rgba(42,15,56,0.4)] ring-1 ring-white backdrop-blur-md"
        >
          <img src="/landing/opt/tailor-partner.jpg" alt="" className="h-8 w-8 rounded-full object-cover" />
          <div className="leading-tight">
            <p className="text-[11px] font-bold text-[#1A1523]">Verified tailor</p>
            <p className="flex items-center gap-1 text-[9.5px] text-[#2E8B57]">
              <ShieldCheck size={10} /> Documents verified
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

const Hero = ({ appName }) => {
  const sectionRef = useRef(null);

  return (
    <section id="top" ref={sectionRef} className="relative overflow-hidden pt-[104px] pb-10 sm:pt-32 lg:pt-36 lg:pb-16">
      {/* page wash */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,#F7F0FB_0%,#FDFBFE_55%,#FFFFFF_100%)]" />
      <div className="pointer-events-none absolute -left-40 top-20 h-[420px] w-[420px] rounded-full bg-[#F1E3F7] blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-[320px] w-[320px] rounded-full bg-[#F6EAFB] blur-3xl lg:hidden" />

      <div className="relative mx-auto grid max-w-[1240px] grid-cols-1 items-center gap-8 px-5 md:px-8 lg:grid-cols-[1.02fr_1fr] lg:gap-6">
        <motion.div initial="hidden" animate="visible" variants={stagger} className="max-w-[600px] text-center sm:text-left">
          <motion.div variants={fadeUp}>
            <Eyebrow icon={Sparkles}>Your personal tailoring studio</Eyebrow>
          </motion.div>

          <h1
            className="mt-5 text-[42px] font-semibold leading-[1.02] tracking-[-0.025em] text-[#1A1523] sm:mt-6 sm:text-[60px] lg:text-[72px]"
            style={{ fontFamily: SERIF }}
          >
            <AnimatedWords text="Your perfect fit," inView={false} delay={0.15} step={0.08} />
            <br />
            <em className="font-medium text-[#843D9B]">
              <AnimatedWords text="stitched to order." inView={false} delay={0.4} step={0.08} />
            </em>
          </h1>

          <motion.p
            variants={fadeUp}
            custom={4}
            className="mx-auto mt-5 max-w-[520px] text-[15.5px] leading-relaxed text-[#5E5768] sm:mx-0 sm:mt-6 sm:text-[17px]"
          >
            Pick a style, share your measurements and let a verified tailor craft it for you.
            {' '}{appName} picks up your fabric, updates you at every stage and delivers to your door.
          </motion.p>

          <motion.div variants={fadeUp} custom={5} className="mt-7 sm:mt-8">
            <StoreButtons />
          </motion.div>

          <motion.div variants={fadeUp} custom={6} className="mt-5">
            <Link to="/user/services" className="group inline-flex items-center gap-2 text-[14px] font-semibold text-[#843D9B]">
              <span className="bg-[linear-gradient(currentColor,currentColor)] bg-[length:0%_1.5px] bg-left-bottom bg-no-repeat pb-0.5 transition-[background-size] duration-500 group-hover:bg-[length:100%_1.5px]">
                Explore services on the web
              </span>
              <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </motion.div>

          <motion.ul
            variants={fadeUp}
            custom={7}
            className="mt-8 grid grid-cols-3 gap-2 border-t border-[#EDE5F3] pt-6 sm:flex sm:flex-wrap sm:gap-x-6 sm:gap-y-3"
          >
            {TRUST.map(({ icon, label }) => (
              <li
                key={label}
                className="flex flex-col items-center gap-1.5 text-center text-[11.5px] font-medium leading-tight text-[#3A3343] sm:flex-row sm:gap-2 sm:text-left sm:text-[13px]"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#F3E9F8] text-[#843D9B] sm:h-7 sm:w-7">
                  <Glyph icon={icon} size={15} strokeWidth={2} />
                </span>
                {label}
              </li>
            ))}
          </motion.ul>

          <motion.p variants={fadeUp} custom={8} className="mt-6 hidden text-[18px] italic text-[#843D9B]/80 sm:block" style={{ fontFamily: SERIF }}>
            Fashion · Tailoring · Perfection
          </motion.p>
        </motion.div>

        <HeroVisual sectionRef={sectionRef} />
      </div>
    </section>
  );
};

export default Hero;
