import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Download, Menu, X } from 'lucide-react';

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

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 30);
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
      className={`fixed top-0 w-full z-50 transition-all duration-400 ${
        scrolled
          ? 'bg-white/95 backdrop-blur-md shadow-[0_2px_20px_rgba(74,5,129,0.08)] py-2'
          : 'bg-white py-3'
      }`}
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <div className="max-w-[1536px] mx-auto px-5 md:px-16 flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group shrink-0">
          <img
            src="/sewzella_logo-removebg-preview.png"
            alt="Sewzella"
            className="h-10 md:h-12 w-auto object-contain"
          />
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-8">
          {NAV_LINKS.map((item) =>
            item.path.startsWith('/page') ? (
              <Link
                key={item.label}
                to={item.path}
                className="text-[14px] font-medium text-[#1c1b1b] hover:text-[#4a0581] transition-colors duration-200 relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[2px] after:bg-[#4a0581] after:transition-all after:duration-300 hover:after:w-full"
              >
                {item.label}
              </Link>
            ) : (
              <Link
                key={item.label}
                to={item.path}
                onClick={(e) => handleNavClick(e, item.path)}
                className={`text-[14px] font-medium transition-colors duration-200 relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[2px] after:bg-[#4a0581] after:transition-all after:duration-300 hover:after:w-full ${
                  location.pathname === '/' && item.path === '/'
                    ? 'text-[#4a0581]'
                    : 'text-[#1c1b1b] hover:text-[#4a0581]'
                }`}
              >
                {item.label}
              </Link>
            )
          )}
        </div>

        {/* CTA Button */}
        <div className="hidden lg:flex items-center">
          <a
            href="https://play.google.com/store"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#4a0581] text-white px-5 py-2.5 rounded-full text-[13px] font-semibold hover:bg-[#622999] transition-all duration-300 shadow-[0_4px_15px_rgba(74,5,129,0.3)] hover:shadow-[0_6px_20px_rgba(74,5,129,0.4)] hover:-translate-y-[1px]"
          >
            <Download size={15} />
            Download App
          </a>
        </div>

        {/* Mobile Toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden p-2 text-[#1c1b1b] hover:text-[#4a0581] transition-colors"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={`lg:hidden overflow-hidden transition-all duration-300 ${
          mobileOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="bg-white border-t border-[#eae7e7] px-5 py-4 space-y-1">
          {NAV_LINKS.map((item) => (
            <Link
              key={item.label}
              to={item.path}
              onClick={(e) => handleNavClick(e, item.path)}
              className="block py-3 px-4 text-[15px] font-medium text-[#1c1b1b] hover:text-[#4a0581] hover:bg-[#f0dbff]/30 rounded-lg transition-all duration-200"
            >
              {item.label}
            </Link>
          ))}
          <div className="pt-3 pb-1">
            <a
              href="https://play.google.com/store"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-[#4a0581] text-white px-5 py-3 rounded-full text-[14px] font-semibold w-full"
            >
              <Download size={16} />
              Download App
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default LandingNavbar;
