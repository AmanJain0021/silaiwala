import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import LandingNavbar from './components/LandingNavbar';
import LandingFooter from './components/LandingFooter';
import MobileBottomNav from './components/MobileBottomNav';
import { SANS } from './components/landingTokens';
import Hero from './sections/Hero';
import Benefits from './sections/Benefits';
import HowItWorks from './sections/HowItWorks';
import Categories from './sections/Categories';
import WhyChoose from './sections/WhyChoose';
import PartnerSection from './sections/PartnerSection';
import AppPromo from './sections/AppPromo';
import Testimonials from './sections/Testimonials';
import useBrandingStore from '../../store/brandingStore';

const SewZellaLanding = () => {
  const appName = useBrandingStore((state) => state.appName) || 'SewZella';
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
      <LandingNavbar />
      <MobileBottomNav />

      <main>
        <Hero appName={appName} />
        <Benefits />
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
