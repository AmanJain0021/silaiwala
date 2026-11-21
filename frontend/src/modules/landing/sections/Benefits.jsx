import React from 'react';
import { motion } from 'framer-motion';
import { Gem, ScanLine, ShieldCheck, Truck, Radar, BellRing } from 'lucide-react';
import { Reveal, Glyph } from '../components/landingShared';
import { fadeUp } from '../components/landingTokens';

const BENEFITS = [
  { icon: Gem, title: 'Perfect Custom Fit', desc: 'Every piece is cut to your own measurements.' },
  { icon: ScanLine, title: 'AI Measurement Assistant', desc: 'Measure yourself from photos, right in the app.', soon: true },
  { icon: ShieldCheck, title: 'Verified Tailors', desc: 'Skilled professionals, approved by our team.' },
  { icon: Truck, title: 'Doorstep Pickup & Delivery', desc: 'We collect your fabric and bring the outfit home.' },
  { icon: Radar, title: 'Live Order Tracking', desc: 'See exactly where your order is, at every step.' },
  { icon: BellRing, title: 'Real-Time Updates', desc: 'Instant alerts and progress photos from your tailor.' },
];

const Benefits = () => (
  <section aria-label="Why customers choose us" className="relative z-10 px-5 md:px-8">
    <Reveal className="mx-auto max-w-[1240px] rounded-[28px] bg-white/80 p-3 shadow-[0_30px_70px_-35px_rgba(74,21,96,0.35)] ring-1 ring-[#EDE5F3] backdrop-blur-xl sm:p-4">
      <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {BENEFITS.map(({ icon, title, desc, soon }, i) => (
          <motion.li
            key={title}
            variants={fadeUp}
            custom={i}
            className="group relative flex items-start gap-3.5 rounded-[20px] p-4 transition-colors duration-300 hover:bg-[#FBF8FD] xl:flex-col xl:items-center xl:text-center"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#F6ECFA] to-[#EBDAF3] text-[#843D9B] ring-1 ring-white transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:rotate-[-4deg]">
              <Glyph icon={icon} size={21} strokeWidth={1.7} />
            </span>
            <div className="min-w-0">
              <h3 className="text-[14px] font-bold leading-snug text-[#1A1523]">
                {title}
                {soon && (
                  <span className="ml-1.5 inline-block rounded-full bg-[#843D9B]/10 px-2 py-0.5 align-middle text-[9.5px] font-bold uppercase tracking-wide text-[#843D9B]">
                    Coming soon
                  </span>
                )}
              </h3>
              <p className="mt-1 text-[12.5px] leading-relaxed text-[#6B6575]">{desc}</p>
            </div>
          </motion.li>
        ))}
      </ul>
    </Reveal>
  </section>
);

export default Benefits;
