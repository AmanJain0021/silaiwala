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

  // Animation variants for icon
  const iconVariants = {
    inactive: {
      scale: 1,
      color: "#94a3b8", // slate-400
    },
    active: {
      scale: 1.1,
      color: "#ffffff",
      transition: {
        duration: 0.3,
        ease: "easeOut",
      },
    },
  };

  const navContent = (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#843D9B] text-white rounded-t-[2rem] z-[9999] safe-area-bottom shadow-[0_-10px_40px_rgba(45,47,110,0.5)]">
      <div className="flex items-center justify-around h-20 px-2 pb-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col items-center justify-center flex-1 h-full gap-1 pt-2">
              <motion.div
                className={`relative flex items-center justify-center w-12 h-12 rounded-[1.2rem] transition-colors duration-300 ${active ? 'bg-white/20 text-white shadow-inner' : 'bg-transparent text-indigo-200/70'}`}
                variants={iconVariants}
                initial="inactive"
                animate={active ? "active" : "inactive"}>
                {item.path === "/delivery/profile" && deliveryBoy?.avatar ? (
                  <div className={`w-6 h-6 rounded-full overflow-hidden border-2 transition-colors ${active ? 'border-white' : 'border-indigo-200/50'}`}>
                    <img src={deliveryBoy.avatar} className="w-full h-full object-cover" alt="P" />
                  </div>
                ) : (
                  <Icon
                    className="text-xl"
                    style={{
                      fill: "none",
                      stroke: "currentColor",
                      strokeWidth: active ? 2.5 : 2,
                    }}
                  />
                )}
                {item.path === "/delivery/notifications" && unreadCount > 0 && (
                  <span className="absolute -top-1 right-0 min-w-[16px] px-1 rounded-full bg-red-500 text-white text-[10px] font-black text-center leading-4 border-2 border-[#843D9B]">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </motion.div>
              {active && (
                <span className="text-[9px] font-black tracking-widest uppercase text-white mt-1 drop-shadow-sm">
                  {item.label}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );

  // Use portal to render outside of transformed containers (like PageTransition)
  return createPortal(navContent, document.body);
};

export default DeliveryBottomNav;
