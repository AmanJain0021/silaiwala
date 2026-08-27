import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Grid, CheckSquare, Image as ImageIcon, MessageCircle } from 'lucide-react';

const MobileBottomNav = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('home');

  useEffect(() => {
    const handleScroll = () => {
      const hash = window.location.hash;
      if (hash === '#how-it-works') setActiveTab('how-it-works');
      else if (hash === '#categories') setActiveTab('services');
      else if (location.pathname === '/page/support') setActiveTab('contact');
      else if (location.pathname === '/' && !hash) setActiveTab('home');
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location]);

  const navItems = [
    { id: 'home', label: 'Home', icon: Home, path: '/' },
    { id: 'services', label: 'Services', icon: Grid, path: '/#categories' },
    { id: 'how-it-works', label: 'How It Works', icon: CheckSquare, path: '/#how-it-works' },
    { id: 'gallery', label: 'Gallery', icon: ImageIcon, path: '/#categories' },
    { id: 'contact', label: 'Contact', icon: MessageCircle, path: '/page/support' }
  ];

  const handleNavClick = (e, path, id) => {
    setActiveTab(id);
    if (path.startsWith('/#')) {
      if (location.pathname === '/') {
        e.preventDefault();
        const el = document.getElementById(path.replace('/#', ''));
        if (el) el.scrollIntoView({ behavior: 'smooth' });
        window.history.pushState(null, '', path);
      }
    }
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-[#EDE8F2] pb-safe z-50 shadow-[0_-4px_24px_rgba(26,21,35,0.06)] rounded-t-2xl">
      <div className="flex justify-between items-center px-2 sm:px-4 h-[72px]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <Link
              key={item.id}
              to={item.path}
              onClick={(e) => handleNavClick(e, item.path, item.id)}
              className="flex flex-col items-center justify-center w-full h-full space-y-1 relative"
            >
              <div className={`transition-transform duration-300 ${isActive ? 'text-[#843D9B] -translate-y-1' : 'text-[#8E8699]'}`}>
                <Icon size={24} strokeWidth={isActive ? 2.5 : 1.8} />
              </div>
              <span className={`text-[10px] sm:text-[11px] transition-all duration-300 ${isActive ? 'text-[#843D9B] font-bold' : 'text-[#8E8699] font-medium'}`}>
                {item.label}
              </span>
              {isActive && (
                <div className="absolute top-0 w-8 h-1 bg-[#843D9B] rounded-b-full shadow-[0_2px_8px_rgba(74,5,129,0.4)]" />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
};

export default MobileBottomNav;
