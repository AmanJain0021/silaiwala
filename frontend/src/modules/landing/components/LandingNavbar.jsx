import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Download, Menu, X } from 'lucide-react';
import useBrandingStore from '../../../store/brandingStore';

const NAV_LINKS = [
  { label: 'Home', path: '/' },
  { label: 'How it Works', path: '/#how-it-works' },
  { label: 'Categories', path: '/#categories' },
  { label: 'For Tailors', path: '/#become-partner' },
  { label: 'About Us', path: '/#about' },
  { label: 'Contact Us', path: '/page/support' },
];

const LandingNavbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const { appName, logos } = useBrandingStore();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  const handleNavClick = (e, path) => {
    if (path.startsWith('/#')) {
      if (location.pathname === '/') {
        e.preventDefault();
        const el = document.getElementById(path.replace('/#', ''));
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }
    }
    setMobileOpen(false);
  };

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-xl border-b border-[#EDE8F2]/80 shadow-[0_4px_24px_rgba(26,21,35,0.02)] py-2.5 md:py-3'
          : 'bg-white py-3.5 md:py-4'
      }`}
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <div className="max-w-[1200px] mx-auto px-4 md:px-8 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center shrink-0">
          <img
            src={logos.customer}
            alt={appName}
            className="h-8 md:h-11 w-auto object-contain transition-all duration-300"
          />
        </Link>

        <div className="hidden lg:flex items-center gap-9 absolute left-1/2 -translate-x-1/2">
          {NAV_LINKS.map((item) =>
            item.path.startsWith('/page') ? (
              <Link
                key={item.label}
                to={item.path}
                className="text-[13px] font-medium tracking-wide text-[#2A2433] hover:text-[#843D9B] transition-colors duration-200"
              >
                {item.label}
              </Link>
            ) : (
              <Link
                key={item.label}
                to={item.path}
                onClick={(e) => handleNavClick(e, item.path)}
                className={`text-[13px] font-medium tracking-wide transition-colors duration-200 relative ${
                  location.pathname === '/' && item.path === '/'
                    ? 'text-[#843D9B] after:absolute after:left-0 after:-bottom-1 after:h-[1.5px] after:w-full after:bg-[#843D9B]'
                    : 'text-[#2A2433] hover:text-[#843D9B]'
                }`}
              >
                {item.label}
              </Link>
            )
          )}
        </div>

        <div className="hidden lg:flex items-center shrink-0">
          <a
            href="https://play.google.com/store/apps/details?id=com.sewzella.user&pcampaignid=web_share"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#843D9B] text-white px-5 py-2.5 rounded-xl text-[13px] font-semibold hover:bg-[#5c0a9e] transition-all duration-300 shadow-[0_8px_24px_rgba(74,5,129,0.22)]"
          >
            <Download size={15} strokeWidth={2} />
            Download App
          </a>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden p-2 text-[#2A2433] hover:text-[#843D9B] transition-colors"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      <div
        className={`lg:hidden overflow-hidden transition-all duration-300 ${
          mobileOpen ? 'max-h-[520px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="bg-white border-t border-[#EDE8F2] px-5 py-4 space-y-1">
          {NAV_LINKS.map((item) => (
            <Link
              key={item.label}
              to={item.path}
              onClick={(e) => handleNavClick(e, item.path)}
              className="block py-3 px-3 text-[14px] font-medium text-[#2A2433] hover:text-[#843D9B] rounded-lg"
            >
              {item.label}
            </Link>
          ))}
          <a
            href="https://play.google.com/store/apps/details?id=com.sewzella.user&pcampaignid=web_share"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center justify-center gap-2 bg-[#843D9B] text-white px-5 py-3 rounded-xl text-[14px] font-semibold w-full"
          >
            <Download size={16} />
            Download App
          </a>
        </div>
      </div>
    </nav>
  );
};

export default LandingNavbar;
