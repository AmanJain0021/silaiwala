import React from 'react';
import { motion } from 'framer-motion';

import { SERIF, APP_LINKS, stagger, fadeUp } from './landingTokens';

/** Renders a lucide icon component passed as data (keeps icon lists declarative). */
export const Glyph = ({ icon, ...props }) => {
  const Cmp = icon;
  return Cmp ? <Cmp {...props} /> : null;
};

/** Section wrapper that reveals its children once when scrolled into view. */
export const Reveal = ({ children, className = '', as = 'div', ...rest }) => {
  const Comp = motion[as] || motion.div;
  return (
    <Comp
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-60px' }}
      variants={stagger}
      {...rest}
    >
      {children}
    </Comp>
  );
};

export const Eyebrow = ({ icon, children, tone = 'light' }) => (
  <span
    className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[11.5px] font-semibold tracking-[0.08em] uppercase ${
      tone === 'dark'
        ? 'bg-white/10 text-white/85 ring-1 ring-white/15'
        : 'bg-[#F3E9F8] text-[#843D9B] ring-1 ring-[#E7D6F0]'
    }`}
  >
    {icon && <Glyph icon={icon} size={13} strokeWidth={2} />}
    {children}
  </span>
);

/** Editorial section heading: eyebrow + serif title (with optional italic accent) + lede. */
export const SectionHeading = ({ eyebrow, icon, title, accent, lede, align = 'center', tone = 'light' }) => (
  <motion.div
    variants={fadeUp}
    className={`max-w-2xl ${align === 'center' ? 'mx-auto text-center' : ''}`}
  >
    {eyebrow && <Eyebrow icon={icon} tone={tone}>{eyebrow}</Eyebrow>}
    <h2
      className={`mt-4 text-[32px] leading-[1.12] sm:text-[40px] lg:text-[46px] font-semibold tracking-[-0.015em] ${
        tone === 'dark' ? 'text-white' : 'text-[#1A1523]'
      }`}
      style={{ fontFamily: SERIF }}
    >
      {title}{' '}
      {accent && <em className={`italic font-medium ${tone === 'dark' ? 'text-[#E9D3F2]' : 'text-[#843D9B]'}`}>{accent}</em>}
    </h2>
    {lede && (
      <p className={`mt-4 text-[15px] md:text-[16px] leading-relaxed ${tone === 'dark' ? 'text-white/70' : 'text-[#6B6575]'}`}>
        {lede}
      </p>
    )}
  </motion.div>
);

/* ─── Store buttons ─── */
const PlayIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
    <path fill="#34A853" d="M3.6 1.8 13.8 12 3.6 22.2a1 1 0 0 1-.6-.9V2.7a1 1 0 0 1 .6-.9z" />
    <path fill="#FBBC04" d="m17.7 8.5 2.3 2.3a1.5 1.5 0 0 1 0 2.4l-2.3 2.3-3.9-3.5z" />
    <path fill="#EA4335" d="M13.8 12 3.6 22.2c.3.2.8.2 1.2 0l12.9-6.7z" />
    <path fill="#4285F4" d="M13.8 12 17.7 8.5 4.8 1.8c-.4-.2-.9-.2-1.2 0z" />
  </svg>
);
const AppleIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
  </svg>
);

/** Google Play (live link) + App Store (honestly marked "coming soon", not clickable). */
export const StoreButtons = ({ tone = 'light', className = '' }) => {
  const base =
    'inline-flex items-center gap-3 rounded-2xl px-5 py-3 min-w-[168px] transition-all duration-300';
  return (
    <div className={`flex flex-wrap items-center gap-3 ${className}`}>
      <a
        href={APP_LINKS.customer}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Get SewZella on Google Play"
        className={`${base} bg-[#14101A] text-white hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(20,16,26,0.28)] ${
          tone === 'dark' ? 'ring-1 ring-white/20' : ''
        }`}
      >
        <PlayIcon />
        <span className="text-left leading-none">
          <span className="block text-[9.5px] uppercase tracking-[0.12em] text-white/70">Get it on</span>
          <span className="block text-[16px] font-semibold mt-1">Google Play</span>
        </span>
      </a>
      <span
        aria-disabled="true"
        title="iOS app coming soon"
        className={`${base} cursor-default ${
          tone === 'dark' ? 'bg-white/10 text-white/80 ring-1 ring-white/15' : 'bg-[#14101A]/[0.06] text-[#1A1523]/70 ring-1 ring-[#1A1523]/10'
        }`}
      >
        <AppleIcon />
        <span className="text-left leading-none">
          <span className="block text-[9.5px] uppercase tracking-[0.12em] opacity-70">Coming soon on</span>
          <span className="block text-[16px] font-semibold mt-1">App Store</span>
        </span>
      </span>
    </div>
  );
};
