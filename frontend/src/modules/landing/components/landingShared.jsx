import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

import { SERIF, APP_LINKS, stagger, fadeUp, EASE } from './landingTokens';

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

/**
 * Luxury "masked word rise": each word slides up from behind its own clip line.
 * Screen readers get the plain sentence; reduced-motion users get static text.
 */
export const AnimatedWords = ({ text, className = '', delay = 0, step = 0.06, inView = true }) => {
  const reduce = useReducedMotion();
  if (!text) return null;
  if (reduce) return <span className={className}>{text}</span>;
  const words = String(text).split(' ');
  const trigger = inView
    ? { initial: 'hidden', whileInView: 'visible', viewport: { once: true, margin: '-40px' } }
    : { initial: 'hidden', animate: 'visible' };
  return (
    <span className={className}>
      <span className="sr-only">{text}</span>
      <motion.span aria-hidden="true" {...trigger}>
      {words.map((word, i) => (
        <span key={`${word}-${i}`} className="inline-block overflow-hidden pb-[0.12em] -mb-[0.12em] align-bottom">
          <motion.span
            className="inline-block will-change-transform"
            variants={{
              hidden: { y: '108%', rotate: 2 },
              visible: { y: '0%', rotate: 0, transition: { duration: 0.85, ease: EASE, delay: delay + i * step } },
            }}
          >
            {word}
            {i < words.length - 1 ? ' ' : ''}
          </motion.span>
        </span>
      ))}
      </motion.span>
    </span>
  );
};

/**
 * Brand lockup: logo mark in a soft tile + "Sew*Zella*" serif wordmark + tagline.
 * `size`: 'md' (navbar) | 'lg' (footer). The mark comes from Admin → Branding.
 */
export const BrandLogo = ({ src, appName = 'SewZella', size = 'md', showTagline = true }) => {
  const name = String(appName || 'SewZella').trim();
  // Render the brand as "Sew" + italic "Zella"; any other app name is shown as-is.
  const isSewZella = name.toLowerCase() === 'sewzella';
  const lg = size === 'lg';
  return (
    <span className="group/logo inline-flex items-center gap-2.5 sm:gap-3">
      <span
        className={`relative flex shrink-0 items-center justify-center overflow-hidden bg-white ring-1 ring-[#E7D6F0] shadow-[0_10px_24px_-12px_rgba(132,61,155,0.55)] transition-transform duration-500 group-hover/logo:-rotate-6 group-hover/logo:scale-105 ${
          lg ? 'h-16 w-16 rounded-[20px] p-1.5' : 'h-11 w-11 rounded-2xl p-1 sm:h-[50px] sm:w-[50px]'
        }`}
      >
        {src ? (
          <img src={src} alt="" className="h-full w-full object-contain" />
        ) : (
          <span className="text-[22px] font-semibold text-[#843D9B]" style={{ fontFamily: SERIF }}>S</span>
        )}
      </span>
      <span aria-hidden="true" className="flex min-w-0 flex-col leading-none">
        <span
          className={`whitespace-nowrap font-semibold tracking-[-0.01em] text-[#1A1523] ${lg ? 'text-[30px]' : 'text-[21px] sm:text-[24px]'}`}
          style={{ fontFamily: SERIF }}
        >
          {isSewZella ? (
            <>
              Sew<em className="font-medium italic text-[#843D9B]">Zella</em>
            </>
          ) : (
            name
          )}
        </span>
        {showTagline && (
          <span
            className={`mt-1 flex items-center gap-1.5 whitespace-nowrap font-semibold uppercase text-[#8E7A9B] ${
              lg ? 'text-[9.5px] tracking-[0.32em]' : 'text-[7.5px] tracking-[0.26em] sm:text-[8.5px]'
            }`}
          >
            <span className="h-px w-3 bg-[#C9A8D8]" />
            Stitched · Styled · You
          </span>
        )}
      </span>
      <span className="sr-only">{name}</span>
    </span>
  );
};

/** Light sweep across a button on hover. Parent needs `group relative overflow-hidden`. */
export const Shine = () => (
  <span
    aria-hidden="true"
    className="pointer-events-none absolute inset-y-0 -left-[60%] w-[45%] -skew-x-12 bg-gradient-to-r from-transparent via-white/35 to-transparent transition-[left] duration-700 ease-out group-hover:left-[120%]"
  />
);

export const Eyebrow = ({ icon, children, tone = 'light' }) => (
  <span
    className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] sm:text-[11.5px] ${
      tone === 'dark'
        ? 'bg-white/10 text-white/85 ring-1 ring-white/15'
        : 'bg-[#F3E9F8] text-[#843D9B] ring-1 ring-[#E7D6F0]'
    }`}
  >
    {icon && <Glyph icon={icon} size={13} strokeWidth={2} />}
    {children}
  </span>
);

/** Editorial section heading: eyebrow + serif title (italic accent) + lede, words rise in. */
export const SectionHeading = ({ eyebrow, icon, title, accent, lede, align = 'center', tone = 'light' }) => (
  <motion.div variants={fadeUp} className={`max-w-2xl ${align === 'center' ? 'mx-auto text-center' : ''}`}>
    {eyebrow && <Eyebrow icon={icon} tone={tone}>{eyebrow}</Eyebrow>}
    <h2
      className={`mt-4 text-[30px] font-semibold leading-[1.1] tracking-[-0.015em] sm:text-[40px] lg:text-[46px] ${
        tone === 'dark' ? 'text-white' : 'text-[#1A1523]'
      }`}
      style={{ fontFamily: SERIF }}
    >
      <AnimatedWords text={title} />
      {accent && (
        <>
          {' '}
          <em className={`font-medium italic ${tone === 'dark' ? 'text-[#E9D3F2]' : 'text-[#843D9B]'}`}>
            <AnimatedWords text={accent} delay={0.12} />
          </em>
        </>
      )}
    </h2>
    {lede && (
      <p className={`mt-4 text-[14.5px] leading-relaxed md:text-[16px] ${tone === 'dark' ? 'text-white/70' : 'text-[#6B6575]'}`}>
        {lede}
      </p>
    )}
  </motion.div>
);

/* ─── Store buttons ─── */
const PlayIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" className="shrink-0">
    <path fill="#34A853" d="M3.6 1.8 13.8 12 3.6 22.2a1 1 0 0 1-.6-.9V2.7a1 1 0 0 1 .6-.9z" />
    <path fill="#FBBC04" d="m17.7 8.5 2.3 2.3a1.5 1.5 0 0 1 0 2.4l-2.3 2.3-3.9-3.5z" />
    <path fill="#EA4335" d="M13.8 12 3.6 22.2c.3.2.8.2 1.2 0l12.9-6.7z" />
    <path fill="#4285F4" d="M13.8 12 17.7 8.5 4.8 1.8c-.4-.2-.9-.2-1.2 0z" />
  </svg>
);
const AppleIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true" className="shrink-0">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
  </svg>
);

/**
 * Google Play (live link) + App Store (honestly marked "coming soon", not clickable).
 * Two equal columns on phones, natural width from `sm` up.
 */
export const StoreButtons = ({ tone = 'light', className = '' }) => {
  const base =
    'relative flex min-w-0 items-center justify-center gap-2.5 overflow-hidden rounded-2xl px-3 py-3 transition-all duration-300 sm:min-w-[172px] sm:justify-start sm:px-5';
  return (
    <div className={`grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap sm:gap-3 ${className}`}>
      <a
        href={APP_LINKS.customer}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Get SewZella on Google Play"
        className={`group ${base} bg-[#14101A] text-white hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(20,16,26,0.28)] ${
          tone === 'dark' ? 'ring-1 ring-white/20' : ''
        }`}
      >
        <Shine />
        <PlayIcon />
        <span className="min-w-0 text-left leading-none">
          <span className="block text-[8.5px] uppercase tracking-[0.12em] text-white/70 sm:text-[9.5px]">Get it on</span>
          <span className="mt-1 block truncate text-[14px] font-semibold sm:text-[16px]">Google Play</span>
        </span>
      </a>
      <span
        aria-disabled="true"
        title="iOS app coming soon"
        className={`${base} cursor-default ${
          tone === 'dark' ? 'bg-white/10 text-white/80 ring-1 ring-white/15' : 'bg-[#14101A]/[0.05] text-[#1A1523]/70 ring-1 ring-[#1A1523]/10'
        }`}
      >
        <AppleIcon />
        <span className="min-w-0 text-left leading-none">
          <span className="block truncate text-[8.5px] uppercase tracking-[0.12em] opacity-70 sm:text-[9.5px]">Coming soon on</span>
          <span className="mt-1 block truncate text-[14px] font-semibold sm:text-[16px]">App Store</span>
        </span>
      </span>
    </div>
  );
};
