import React from 'react';
import { motion } from 'framer-motion';
import { Package, Users, BarChart3, Truck, Globe, ArrowUpRight, Scissors, Bell } from 'lucide-react';
import { Reveal, SectionHeading, Glyph } from '../components/landingShared';
import { fadeUp, EASE, APP_LINKS } from '../components/landingTokens';

const PERKS = [
  { icon: Package, label: 'Receive more orders' },
  { icon: Users, label: 'Manage customers digitally' },
  { icon: BarChart3, label: 'Track earnings & growth' },
  { icon: Truck, label: 'Pickup & delivery handled' },
  { icon: Globe, label: 'Build your online presence' },
];

const PartnerSection = ({ appName }) => (
  <section id="become-partner" className="scroll-mt-24 bg-white px-3 py-10 sm:px-5 md:py-16">
    <div className="relative mx-auto max-w-[1280px] overflow-hidden rounded-[36px] bg-[#2A0F38]">
      {/* backdrop */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_15%_10%,#6B2A87_0%,transparent_55%),radial-gradient(ellipse_at_90%_90%,#843D9B_0%,transparent_50%)] opacity-80" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '22px 22px' }}
      />

      <div className="relative grid grid-cols-1 items-center gap-10 px-6 py-14 sm:px-10 md:py-20 lg:grid-cols-[1.15fr_1fr] lg:px-16">
        <Reveal>
          <SectionHeading
            tone="dark"
            align="left"
            eyebrow="For tailors & delivery partners"
            icon={Scissors}
            title="Grow your craft"
            accent={`with ${appName}.`}
            lede="Join a growing network of verified tailors and delivery partners. Get steady orders, simple tools and timely payouts, all from one app."
          />
          <motion.ul variants={fadeUp} custom={1} className="mt-8 flex flex-wrap gap-2.5">
            {PERKS.map(({ icon, label }) => (
              <li
                key={label}
                className="inline-flex items-center gap-2 rounded-full bg-white/[0.08] px-4 py-2 text-[12.5px] font-medium text-white/90 ring-1 ring-white/15"
              >
                <Glyph icon={icon} size={14} strokeWidth={1.8} className="text-[#E2C4EE]" />
                {label}
              </li>
            ))}
          </motion.ul>
          <motion.div variants={fadeUp} custom={2} className="mt-10 flex flex-col gap-3 sm:flex-row">
            <a
              href={APP_LINKS.tailor}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-3.5 text-[14px] font-bold text-[#4A1560] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-14px_rgba(255,255,255,0.5)]"
            >
              Join as a Tailor
              <ArrowUpRight size={16} className="transition-transform duration-300 group-hover:rotate-45" />
            </a>
            <a
              href={APP_LINKS.delivery}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-[14px] font-bold text-white ring-1 ring-white/40 transition-all duration-300 hover:bg-white/10"
            >
              Join as a Delivery Partner
              <ArrowUpRight size={16} className="transition-transform duration-300 group-hover:rotate-45" />
            </a>
          </motion.div>
        </Reveal>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.9, ease: EASE }}
          className="relative mx-auto w-full max-w-[400px]"
        >
          <div className="overflow-hidden rounded-t-[999px] rounded-b-[32px] ring-[6px] ring-white/10">
            <img
              src="/landing/opt/tailor-partner.jpg"
              alt="Tailor partner at her sewing station"
              loading="lazy"
              className="aspect-[4/5] w-full object-cover object-top"
            />
          </div>
          <div className="absolute -left-4 bottom-10 flex items-center gap-3 rounded-2xl bg-white p-3 pr-5 shadow-[0_24px_50px_-20px_rgba(0,0,0,0.5)] sm:-left-10">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#F3E9F8] text-[#843D9B]">
              <Bell size={18} />
            </span>
            <div>
              <p className="text-[12.5px] font-bold text-[#1A1523]">New order request</p>
              <p className="text-[11px] text-[#6B6575]">Accept it right from the app</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  </section>
);

export default PartnerSection;
