import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, LayoutGrid, Workflow, Scissors, MessageCircle } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'home', label: 'Home', icon: Home, path: '/' },
  { id: 'categories', label: 'Categories', icon: LayoutGrid, path: '/#categories' },
  { id: 'how-it-works', label: 'How it Works', icon: Workflow, path: '/#how-it-works' },
  { id: 'become-partner', label: 'Partner', icon: Scissors, path: '/#become-partner' },
  { id: 'contact', label: 'Contact', icon: MessageCircle, path: '/page/support' },
];
const SECTIONS = ['categories', 'how-it-works', 'become-partner'];

const MobileBottomNav = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('home');

  useEffect(() => {
    if (location.pathname !== '/') return undefined;
    // Highlight whichever section sits under the middle of the screen
    const onScroll = () => {
      const mid = window.innerHeight * 0.45;
      const current = SECTIONS.find((id) => {
        const r = document.getElementById(id)?.getBoundingClientRect();
        return r && r.top <= mid && r.bottom >= mid;
      });
      setActiveTab((prev) => current || (window.scrollY < 300 ? 'home' : prev));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [location.pathname]);

  const handleNavClick = (e, item) => {
    setActiveTab(item.id);
    if (location.pathname !== '/') return;
    if (item.path === '/') {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (item.path.startsWith('/#')) {
      e.preventDefault();
      document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.history.replaceState(null, '', item.path);
    }
  };

  return (
    <nav
      aria-label="Quick navigation"
      className="fixed inset-x-3 z-50 md:hidden"
      style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 10px)' }}
    >
      <div className="flex h-[66px] items-center justify-between rounded-[22px] bg-white/90 px-1.5 shadow-[0_18px_40px_-12px_rgba(74,21,96,0.35)] ring-1 ring-[#EDE5F3] backdrop-blur-xl">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          // Off the home page only Contact can be active (derived, not stored)
          const current = location.pathname === '/page/support' ? 'contact' : location.pathname === '/' ? activeTab : null;
          const isActive = current === item.id;
          return (
            <Link
              key={item.id}
              to={item.path}
              onClick={(e) => handleNavClick(e, item)}
              aria-current={isActive ? 'page' : undefined}
              className="relative flex h-full min-w-0 flex-1 flex-col items-center justify-center gap-1"
            >
              <span
                className={`flex h-8 w-12 items-center justify-center rounded-full transition-all duration-300 ${
                  isActive ? 'bg-[#F3E9F8] text-[#843D9B]' : 'text-[#8E8699]'
                }`}
              >
                <Icon size={20} strokeWidth={isActive ? 2.3 : 1.8} />
              </span>
              <span
                className={`max-w-full truncate px-0.5 text-[10px] transition-colors duration-300 ${
                  isActive ? 'font-bold text-[#843D9B]' : 'font-medium text-[#8E8699]'
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileBottomNav;
