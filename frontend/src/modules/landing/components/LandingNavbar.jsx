import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Download, Menu, X, ArrowUpRight } from 'lucide-react';
import { Shine } from './landingShared';
import useBrandingStore from '../../../store/brandingStore';
import { APP_LINKS, SANS } from './landingTokens';

const NAV_LINKS = [
  { label: 'Home', path: '/', id: 'top' },
  { label: 'How it Works', path: '/#how-it-works', id: 'how-it-works' },
  { label: 'Categories', path: '/#categories', id: 'categories' },
  { label: 'For Tailors', path: '/#become-partner', id: 'become-partner' },
  { label: 'About Us', path: '/#about', id: 'about' },
  { label: 'Contact Us', path: '/page/support', id: 'contact' },
];

const SECTION_IDS = ['how-it-works', 'categories', 'about', 'become-partner'];

const LandingNavbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [activeId, setActiveId] = useState('top');
  const location = useLocation();
  // Menu is tied to the page it was opened on, so navigating closes it automatically
  const [openKey, setOpenKey] = useState(null);
  const mobileOpen = openKey !== null && openKey === location.key;
  const setMobileOpen = (next) => {
    const value = typeof next === 'function' ? next(mobileOpen) : next;
    setOpenKey(value ? location.key : null);
  };
  const { appName, logos } = useBrandingStore();
  const onHome = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 16);
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Scroll-spy: highlight the section currently in view (home page only)
  useEffect(() => {
    if (!onHome || typeof IntersectionObserver === 'undefined') return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActiveId(visible.target.id);
        else if (window.scrollY < 200) setActiveId('top');
      },
      { rootMargin: '-35% 0px -55% 0px', threshold: [0, 0.25, 0.5] }
    );
    const els = SECTION_IDS.map((id) => document.getElementById(id)).filter(Boolean);
    els.forEach((el) => observer.observe(el));
    const onTop = () => window.scrollY < 200 && setActiveId('top');
    window.addEventListener('scroll', onTop, { passive: true });
    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', onTop);
    };
  }, [onHome]);

  // Lock page scroll behind the open mobile menu
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const handleNavClick = (e, item) => {
    if (onHome) {
      if (item.path === '/') {
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else if (item.path.startsWith('/#')) {
        e.preventDefault();
        document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        window.history.replaceState(null, '', item.path);
      }
    }
    setMobileOpen(false);
  };

  const isActive = (item) =>
    item.id === 'contact' ? location.pathname === '/page/support' : onHome && activeId === item.id;

  return (
    <header
      className="fixed inset-x-0 top-0 z-50 px-3 sm:px-5"
      style={{ fontFamily: SANS, paddingTop: 'calc(env(safe-area-inset-top, 0px) + 10px)' }}
    >
      <nav
        aria-label="Main"
        className={`mx-auto flex max-w-[1240px] items-center justify-between gap-4 rounded-[22px] px-3.5 sm:px-5 transition-all duration-500 ${
          scrolled || mobileOpen
            ? 'bg-white/80 py-2 shadow-[0_10px_40px_-12px_rgba(74,21,96,0.25)] ring-1 ring-[#EDE5F3] backdrop-blur-xl'
            : 'bg-white/40 py-3 ring-1 ring-white/60 backdrop-blur-md'
        }`}
      >
        <Link to="/" onClick={(e) => handleNavClick(e, NAV_LINKS[0])} className="flex shrink-0 items-center">
          <img src={logos.customer} alt={appName} className="h-10 w-auto object-contain md:h-12" />
        </Link>

        <ul className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((item) => (
            <li key={item.label}>
              <Link
                to={item.path}
                onClick={(e) => handleNavClick(e, item)}
                aria-current={isActive(item) ? 'page' : undefined}
                className={`relative isolate rounded-full px-4 py-2 text-[13.5px] font-medium transition-colors duration-300 ${
                  isActive(item) ? 'text-[#843D9B]' : 'text-[#3A3343] hover:text-[#843D9B]'
                }`}
              >
                {isActive(item) && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 -z-10 rounded-full bg-[#F3E9F8]"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                {item.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-2">
          <a
            href={APP_LINKS.customer}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative hidden items-center gap-2 overflow-hidden rounded-full bg-[#843D9B] px-5 py-2.5 text-[13px] font-semibold text-white shadow-[0_10px_24px_-8px_rgba(132,61,155,0.7)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#74338a] sm:inline-flex"
          >
            <Shine />
            <Download size={15} strokeWidth={2.2} />
            Download App
          </a>
          <button
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
            className="flex h-10 w-10 items-center justify-center rounded-full text-[#2A2433] transition-colors hover:bg-[#F3E9F8] hover:text-[#843D9B] lg:hidden"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mt-2 max-w-[1240px] overflow-hidden rounded-[22px] bg-white/95 p-3 shadow-[0_24px_60px_-20px_rgba(74,21,96,0.35)] ring-1 ring-[#EDE5F3] backdrop-blur-xl lg:hidden"
          >
            <ul className="space-y-0.5">
              {NAV_LINKS.map((item) => (
                <li key={item.label}>
                  <Link
                    to={item.path}
                    onClick={(e) => handleNavClick(e, item)}
                    className={`flex items-center justify-between rounded-2xl px-4 py-3.5 text-[15px] font-medium transition-colors ${
                      isActive(item) ? 'bg-[#F3E9F8] text-[#843D9B]' : 'text-[#2A2433] hover:bg-[#FBF8FD]'
                    }`}
                  >
                    {item.label}
                    <ArrowUpRight size={16} className="opacity-40" />
                  </Link>
                </li>
              ))}
            </ul>
            <a
              href={APP_LINKS.customer}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#843D9B] px-5 py-3.5 text-[14px] font-semibold text-white"
            >
              <Download size={16} />
              Download the App
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default LandingNavbar;
