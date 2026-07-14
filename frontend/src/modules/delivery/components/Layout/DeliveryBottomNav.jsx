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

  const navContent = (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-2 flex items-center justify-between gap-2 overflow-x-auto scrollbar-hide z-[9999] shadow-[0_-8px_30px_rgba(0,0,0,0.05)]">
      <div className="flex justify-between w-full max-w-md mx-auto relative">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center gap-1 relative min-w-[56px] py-1"
            >
              {active && (
                  <motion.span 
                      layoutId="deliveryBottomNavActive"
                      className="absolute -top-2 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#843D9B] rounded-full" 
                  />
              )}
              <div className={`p-2.5 rounded-2xl transition-all duration-300 flex items-center justify-center relative ${
                  active
                      ? 'bg-[#843D9B] text-white shadow-lg shadow-[#843D9B]/30 scale-110'
                      : 'text-gray-400 active:scale-90'
              }`}>
                {item.path === "/delivery/profile" && deliveryBoy?.avatar ? (
                  <div className={`w-5 h-5 rounded-full overflow-hidden border-2 transition-colors ${active ? 'border-white' : 'border-transparent'}`}>
                    <img src={deliveryBoy.avatar} className="w-full h-full object-cover" alt="P" />
                  </div>
                ) : (
                  <Icon
                    className="text-lg"
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
              <span className={`text-[8px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  active ? 'text-[#843D9B]' : 'text-gray-400'
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
