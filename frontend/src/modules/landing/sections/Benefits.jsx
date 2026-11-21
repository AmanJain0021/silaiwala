import React from 'react';
import { motion } from 'framer-motion';
import { Gem, ScanLine, ShieldCheck, Truck, Radar, BellRing } from 'lucide-react';
import { Reveal, Glyph } from '../components/landingShared';
import { EASE } from '../components/landingTokens';

const BENEFITS = [
  { icon: Gem, title: 'Perfect Custom Fit', desc: 'Every piece cut to your own measurements.' },
  { icon: ScanLine, title: 'AI Measurement', desc: 'Measure yourself from photos in the app.', soon: true },
  { icon: ShieldCheck, title: 'Verified Tailors', desc: 'Skilled professionals, approved by our team.' },
  { icon: Truck, title: 'Doorstep Pickup & Delivery', desc: 'We collect your fabric and bring it home.' },
  { icon: Radar, title: 'Live Order Tracking', desc: 'See exactly where your order is, every step.' },
  { icon: BellRing, title: 'Real-Time Updates', desc: 'Instant alerts and progress photos.' },
];

const pop = {
  hidden: { opacity: 0, y: 22, scale: 0.96 },
  visible: (i = 0) => ({ opacity: 1, y: 0, scale: 1, transition: { duration: 0.6, delay: 0.1 + i * 0.07, ease: EASE } }),
};

const Benefits = () => (
  <section aria-label="Why customers choose us" className="relative z-10 px-4 sm:px-5 md:px-8">
    <Reveal className="mx-auto max-w-[1240px] rounded-[26px] bg-white/80 p-2.5 shadow-[0_30px_70px_-35px_rgba(74,21,96,0.35)] ring-1 ring-[#EDE5F3] backdrop-blur-xl sm:rounded-[28px] sm:p-4">
      <ul className="grid grid-cols-2 gap-1.5 sm:gap-1 lg:grid-cols-3 xl:grid-cols-6">
        {BENEFITS.map(({ icon, title, desc, soon }, i) => (
          <motion.li
            key={title}
            variants={pop}
            custom={i}
            className="group relative flex flex-col items-start gap-3 rounded-[20px] bg-[#FBF8FD] p-3.5 transition-colors duration-300 hover:bg-[#F6EEFA] sm:bg-transparent sm:p-4 sm:hover:bg-[#FBF8FD] xl:items-center xl:text-center"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#F6ECFA] to-[#EBDAF3] text-[#843D9B] ring-1 ring-white transition-transform duration-500 group-hover:-translate-y-0.5 group-hover:rotate-[-8deg] group-hover:scale-110 sm:h-12 sm:w-12">
              <Glyph icon={icon} size={20} strokeWidth={1.7} />
            </span>
            <div className="min-w-0">
              <h3 className="text-[13px] font-bold leading-snug text-[#1A1523] sm:text-[14px]">{title}</h3>
              {soon && (
                <span className="mt-1 inline-block rounded-full bg-[#843D9B]/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-[#843D9B]">
                  Coming soon
                </span>
              )}
              <p className="mt-1 text-[11.5px] leading-relaxed text-[#6B6575] sm:text-[12.5px]">{desc}</p>
            </div>
          </motion.li>
        ))}
      </ul>
    </Reveal>
  </section>
);

export default Benefits;
