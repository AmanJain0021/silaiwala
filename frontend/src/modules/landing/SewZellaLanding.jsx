import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, useScroll, useSpring } from 'framer-motion';
import LandingNavbar from './components/LandingNavbar';
import LandingFooter from './components/LandingFooter';
import MobileBottomNav from './components/MobileBottomNav';
import { SANS } from './components/landingTokens';
import Hero from './sections/Hero';
import Benefits from './sections/Benefits';
import Marquee from './sections/Marquee';
import HowItWorks from './sections/HowItWorks';
import Categories from './sections/Categories';
import WhyChoose from './sections/WhyChoose';
import PartnerSection from './sections/PartnerSection';
import AppPromo from './sections/AppPromo';
import Testimonials from './sections/Testimonials';
import useBrandingStore from '../../store/brandingStore';

/** Thin brand-coloured reading-progress bar under the navbar. */
const ScrollProgress = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 140, damping: 28, mass: 0.3 });
  return (
    <motion.div
      aria-hidden="true"
      style={{ scaleX }}
      className="fixed inset-x-0 top-0 z-[60] h-[3px] origin-left bg-gradient-to-r from-[#843D9B] via-[#B46CCB] to-[#E2C4EE]"
    />
  );
};

const SewZellaLanding = () => {
  const rawName = useBrandingStore((state) => state.appName) || 'SewZella';
  // Admin branding stores the name in caps ("SEWZELLA"); show the brand's proper casing in copy
  const appName = rawName.trim().toLowerCase() === 'sewzella' ? 'SewZella' : rawName;
  const location = useLocation();

  // Land on the requested section when arriving via "/#how-it-works" etc. from another
  // page (navbar/footer links); otherwise start at the top.
  useEffect(() => {
    const id = location.hash?.replace('#', '');
    if (!id) {
      window.scrollTo(0, 0);
      return undefined;
    }
    const t = setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
    return () => clearTimeout(t);
  }, [location.hash]);

  return (
    <div className="min-h-screen overflow-x-hidden bg-white text-[#1A1523] antialiased" style={{ fontFamily: SANS }}>
      <ScrollProgress />
      <LandingNavbar />
      <MobileBottomNav />

      <main>
        <Hero appName={appName} />
        <Benefits />
        <Marquee />
        <HowItWorks />
        <Categories />
        <WhyChoose appName={appName} />
        <PartnerSection appName={appName} />
        <AppPromo appName={appName} />
        <Testimonials />
      </main>

      <LandingFooter />
    </div>
  );
};

export default SewZellaLanding;
