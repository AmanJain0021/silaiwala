import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Download, Radar, CreditCard, Camera } from 'lucide-react';
import PhoneMockup from '../components/PhoneMockup';
import { Reveal, SectionHeading, StoreButtons, Glyph } from '../components/landingShared';
import { fadeUp, EASE, SERIF } from '../components/landingTokens';

const FEATURES = [
  { icon: Radar, label: 'Live order tracking' },
  { icon: CreditCard, label: 'Secure online payments' },
  { icon: Camera, label: 'Progress photos from your tailor' },
];

const AppPromo = ({ appName }) => {
  const reduce = useReducedMotion();
  const float = (d, delay) =>
    reduce ? {} : { animate: { y: [0, -d, 0] }, transition: { duration: 7, delay, repeat: Infinity, ease: 'easeInOut' } };

  return (
    <section id="download" aria-label={`Download the ${appName} app`} className="relative overflow-hidden bg-[#FBF8FD] py-20 md:py-28">
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[700px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,#EFE0F6_0%,transparent_65%)]" />

      <div className="relative mx-auto grid max-w-[1240px] grid-cols-1 items-center gap-14 px-5 md:px-8 lg:grid-cols-2">
        {/* Phones */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 1, ease: EASE }}
          className="relative order-2 mx-auto flex h-[470px] w-full max-w-[480px] items-center justify-center sm:h-[560px] lg:order-1"
        >
          <motion.div {...float(10, 0)} className="absolute left-[4%] top-[6%] w-[48%] -rotate-[8deg]">
            <PhoneMockup screen="home" />
          </motion.div>
          <motion.div {...float(12, 0.6)} className="absolute right-[4%] top-[12%] z-10 w-[50%] rotate-[5deg]">
            <PhoneMockup screen="tracking" />
          </motion.div>
          <div className="absolute bottom-0 left-1/2 h-8 w-[70%] -translate-x-1/2 rounded-[50%] bg-[#2A0F38]/20 blur-2xl" />
        </motion.div>

        {/* Copy */}
        <Reveal className="order-1 lg:order-2">
          <SectionHeading
            align="left"
            eyebrow="Download now"
            icon={Download}
            title={`Get the ${appName} app`}
            accent="today."
            lede="The easiest way to get clothes tailored: browse styles, book a home measurement visit, pay securely and watch your outfit come to life."
          />
          <motion.ul variants={fadeUp} custom={1} className="mt-8 space-y-3">
            {FEATURES.map(({ icon, label }) => (
              <li key={label} className="flex items-center gap-3 text-[14.5px] font-medium text-[#3A3343]">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white text-[#843D9B] ring-1 ring-[#EDE5F3]">
                  <Glyph icon={icon} size={17} strokeWidth={1.8} />
                </span>
                {label}
              </li>
            ))}
          </motion.ul>
          <motion.div variants={fadeUp} custom={2} className="mt-9">
            <StoreButtons />
          </motion.div>
          <motion.p variants={fadeUp} custom={3} className="mt-8 text-[26px] italic text-[#843D9B]" style={{ fontFamily: SERIF }}>
            Style, your way.
          </motion.p>
        </Reveal>
      </div>
    </section>
  );
};

export default AppPromo;
