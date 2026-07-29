import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { FiHome, FiPackage, FiUser, FiBell, FiDollarSign } from "react-icons/fi";
import { useDeliveryNotificationStore } from "../../store/deliveryNotificationStore";
import { useDeliveryAuthStore } from "../../store/deliveryStore";

const DeliveryBottomNav = () => {
  const location = useLocation();
  const { unreadCount } = useDeliveryNotificationStore();
  const { deliveryBoy } = useDeliveryAuthStore();
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.visualViewport) {
        const isShort = window.visualViewport.height < window.innerHeight - 140;
        setIsKeyboardOpen(isShort);
      }
    };

    const handleFocusIn = (e) => {
      const tag = e.target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || e.target?.isContentEditable) {
        setIsKeyboardOpen(true);
      }
    };

    const handleFocusOut = () => {
      setTimeout(() => {
        const activeTag = document.activeElement?.tagName?.toLowerCase();
        if (activeTag !== 'input' && activeTag !== 'textarea' && activeTag !== 'select' && !document.activeElement?.isContentEditable) {
          setIsKeyboardOpen(false);
        }
      }, 100);
    };

    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleResize);
    }
    window.addEventListener('focusin', handleFocusIn);
    window.addEventListener('focusout', handleFocusOut);

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleResize);
      }
      window.removeEventListener('focusin', handleFocusIn);
      window.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  const navItems = [
    { path: "/delivery/dashboard", icon: FiHome, label: "Dashboard" },
    { path: "/delivery/orders", icon: FiPackage, label: "History" },
    { path: "/delivery/payouts", icon: FiDollarSign, label: "Payouts" },
    { path: "/delivery/notifications", icon: FiBell, label: "Alerts" },
    { path: "/delivery/profile", icon: FiUser, label: "Profile" },
  ];

  const isActive = (path) => {
    if (path === "/delivery/dashboard") {
      return location.pathname === "/delivery/dashboard";
    }
    return location.pathname.startsWith(path);
  };

  if (isKeyboardOpen) return null;

  const navContent = (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-2 py-1.5 flex items-center justify-between gap-1 z-[9999] shadow-[0_-8px_30px_rgba(0,0,0,0.05)] pb-safe animate-fadeIn">
      <div className="flex justify-between items-center w-full max-w-md mx-auto relative">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center justify-center flex-1 min-w-[48px] py-0.5 relative group"
            >
              {active && (
                  <motion.span 
                      layoutId="deliveryBottomNavActive"
                      className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-7 h-0.5 bg-[#843D9B] rounded-full" 
                  />
              )}
              <div className={`p-1.5 rounded-xl transition-all duration-200 flex items-center justify-center relative ${
                  active
                      ? 'bg-[#843D9B] text-white shadow-md shadow-[#843D9B]/30'
                      : 'text-gray-400 active:scale-95'
              }`}>
                {item.path === "/delivery/profile" && deliveryBoy?.avatar ? (
                  <div className={`w-4 h-4 rounded-full overflow-hidden border-2 transition-colors ${active ? 'border-white' : 'border-transparent'}`}>
                    <img src={deliveryBoy.avatar} className="w-full h-full object-cover" alt="P" />
                  </div>
                ) : (
                  <Icon
                    className="text-base"
                    style={{
                      strokeWidth: active ? 2.5 : 2,
                    }}
                  />
                )}
                {item.path === "/delivery/notifications" && unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1.5 h-[14px] min-w-[14px] px-1 bg-rose-500 rounded-full border-[1.5px] border-white flex items-center justify-center text-[7px] font-black text-white shadow-sm z-10">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </div>
              <span className={`text-[10px] tracking-tight mt-0.5 transition-all whitespace-nowrap ${
                  active ? 'text-[#843D9B] font-bold' : 'text-gray-400 font-medium'
              }`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );

  return createPortal(navContent, document.body);
};

export default DeliveryBottomNav;
