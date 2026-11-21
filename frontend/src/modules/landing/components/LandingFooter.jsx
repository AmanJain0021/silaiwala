import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Facebook, Twitter, Youtube, MapPin, Phone, Mail, ArrowUpRight } from 'lucide-react';
import useBrandingStore from '../../../store/brandingStore';
import { StoreButtons, Glyph, BrandLogo } from './landingShared';
import { SANS, SERIF } from './landingTokens';

const COLUMNS = [
  {
    title: 'Explore',
    links: [
      { label: 'How it Works', path: '/#how-it-works' },
      { label: 'Categories', path: '/#categories' },
      { label: 'For Tailors', path: '/#become-partner' },
      { label: 'Track Order', path: '/user/orders' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About Us', path: '/page/about-us' },
      { label: 'Community', path: '/page/community' },
      { label: 'Careers', path: '/page/careers' },
      { label: 'Blog', path: '/page/blog' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Help Center', path: '/page/support' },
      { label: 'Privacy Policy', path: '/page/privacy-policy' },
      { label: 'Terms & Conditions', path: '/page/terms-of-service' },
      { label: 'Shipping Policy', path: '/page/shipping-policy' },
      { label: 'Refund Policy', path: '/page/refund-policy' },
    ],
  },
];

const SOCIALS = [
  { icon: Instagram, href: 'https://instagram.com/sewzella', label: 'Instagram' },
  { icon: Facebook, href: 'https://facebook.com/sewzella', label: 'Facebook' },
  { icon: Twitter, href: 'https://twitter.com/sewzella', label: 'X (Twitter)' },
  { icon: Youtube, href: 'https://youtube.com/@sewzella', label: 'YouTube' },
];

const LandingFooter = () => {
  const { appName, logos, supportEmail, supportPhone } = useBrandingStore();
  const phoneDisplay = supportPhone || '+91 9429692921';
  const emailDisplay = supportEmail || 'support@silaiwala.com';
  const cleanPhone = phoneDisplay.replace(/[^+\d]/g, '');

  return (
    <footer className="relative overflow-hidden bg-[#FBF8FD]" style={{ fontFamily: SANS }}>
      <div className="pointer-events-none absolute -top-40 right-[-10%] h-[420px] w-[420px] rounded-full bg-[#EBD9F3]/60 blur-3xl" />

      <div className="relative mx-auto max-w-[1240px] px-5 pt-16 pb-28 md:px-8 md:pb-10">
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1.3fr_2fr]">
          {/* Brand */}
          <div className="max-w-sm">
            <Link to="/" className="inline-flex items-center">
              <BrandLogo src={logos.customer} appName={appName} size="lg" />
            </Link>
            <p className="mt-5 text-[22px] leading-snug text-[#1A1523]" style={{ fontFamily: SERIF }}>
              Stitching dreams, <em className="text-[#843D9B]">one perfect fit</em> at a time.
            </p>
            <p className="mt-3 text-[13.5px] leading-relaxed text-[#6B6575]">
              Verified tailors, doorstep pickup and live progress updates, all in one app.
            </p>
            <StoreButtons className="mt-6" />
            <div className="mt-6 flex gap-2.5">
              {SOCIALS.map(({ icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#843D9B] ring-1 ring-[#EDE5F3] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#843D9B] hover:text-white"
                >
                  <Glyph icon={icon} size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns + contact */}
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-[1fr_1fr_1fr_1.5fr]">
            {COLUMNS.map((col) => (
              <div key={col.title}>
                <h4 className="text-[11.5px] font-bold uppercase tracking-[0.16em] text-[#1A1523]">{col.title}</h4>
                <ul className="mt-5 space-y-3">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        to={link.path}
                        className="group inline-flex items-center gap-1 text-[13.5px] text-[#6B6575] transition-colors hover:text-[#843D9B]"
                      >
                        {link.label}
                        <ArrowUpRight size={12} className="opacity-0 transition-opacity group-hover:opacity-100" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            <div className="col-span-2 sm:col-span-1">
              <h4 className="text-[11.5px] font-bold uppercase tracking-[0.16em] text-[#1A1523]">Contact</h4>
              <ul className="mt-5 space-y-4 text-[13.5px] text-[#6B6575]">
                <li className="flex items-start gap-2.5">
                  <Phone size={15} className="mt-0.5 shrink-0 text-[#843D9B]" />
                  <a href={`tel:${cleanPhone}`} className="[overflow-wrap:anywhere] transition-colors hover:text-[#843D9B]">{phoneDisplay}</a>
                </li>
                <li className="flex items-start gap-2.5">
                  <Mail size={15} className="mt-0.5 shrink-0 text-[#843D9B]" />
                  <a href={`mailto:${emailDisplay}`} className="[overflow-wrap:anywhere] transition-colors hover:text-[#843D9B]">{emailDisplay}</a>
                </li>
                <li className="flex items-start gap-2.5">
                  <MapPin size={15} className="mt-0.5 shrink-0 text-[#843D9B]" />
                  <span>Srinagar, Kashmir, India</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-[#EDE5F3] pt-7 md:flex-row">
          <p className="text-[12.5px] text-[#9A94A3]">
            &copy; {new Date().getFullYear()} {appName}. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-[12.5px] text-[#9A94A3]">
            <Link to="/page/privacy-policy" className="transition-colors hover:text-[#843D9B]">Privacy Policy</Link>
            <Link to="/page/terms-of-service" className="transition-colors hover:text-[#843D9B]">Terms of Service</Link>
            <Link to="/page/accessibility" className="transition-colors hover:text-[#843D9B]">Accessibility</Link>
          </div>
        </div>

        <p
          aria-hidden="true"
          className="pointer-events-none mt-8 select-none whitespace-nowrap text-center text-[21vw] font-semibold leading-[0.8] tracking-[-0.04em] text-transparent [-webkit-text-stroke:1px_rgba(132,61,155,0.18)] lg:text-[200px]"
          style={{ fontFamily: SERIF }}
        >
          SewZella
        </p>
      </div>
    </footer>
  );
};

export default LandingFooter;
