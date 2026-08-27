import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Facebook, Twitter, Youtube, MapPin, Phone, Mail } from 'lucide-react';
import useBrandingStore from '../../../store/brandingStore';

const LandingFooter = () => {
  const { appName, logos } = useBrandingStore();

  return (
    <footer
      className="bg-white border-t border-[#EDE8F2]"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <div className="max-w-[1200px] mx-auto px-5 md:px-8 pt-16 pb-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12 mb-14">
          {/* Brand */}
          <div>
            <Link to="/" className="inline-flex items-center mb-5">
              <img
                src={logos.customer}
                alt={appName}
                className="h-10 w-auto object-contain"
              />
            </Link>
            <p className="text-[#6B6575] text-[13px] leading-relaxed mb-6 max-w-[260px]">
              Custom tailoring reimagined. We bring tailors and customers together for the perfect fit in your favorite style.
            </p>
            <div className="flex gap-2.5">
              {[
                { icon: <Instagram size={15} />, href: 'https://instagram.com/sewzella' },
                { icon: <Facebook size={15} />, href: 'https://facebook.com/sewzella' },
                { icon: <Twitter size={15} />, href: 'https://twitter.com/sewzella' },
                { icon: <Youtube size={15} />, href: 'https://youtube.com/@sewzella' },
              ].map((social, i) => (
                <a
                  key={i}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-[#F3EAF8] text-[#843D9B] flex items-center justify-center hover:bg-[#843D9B] hover:text-white transition-all duration-300"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-[12px] font-bold uppercase tracking-[0.14em] mb-5 text-[#1A1523]">
              Quick Links
            </h4>
            <ul className="space-y-3">
              {[
                { label: 'How it Works', path: '/#how-it-works' },
                { label: 'Categories', path: '/#categories' },
                { label: 'For Tailors', path: '/#become-partner' },
                { label: 'About Us', path: '/#about' },
                { label: 'Track Order', path: '/user/orders' },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.path}
                    className="text-[#6B6575] hover:text-[#843D9B] transition-colors text-[13px]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company + Support merged for 4-col rhythm */}
          <div>
            <h4 className="text-[12px] font-bold uppercase tracking-[0.14em] mb-5 text-[#1A1523]">
              Company
            </h4>
            <ul className="space-y-3 mb-8">
              {[
                { label: 'About Us', path: '/page/about-us' },
                { label: 'Community', path: '/page/community' },
                { label: 'Careers', path: '/page/careers' },
                { label: 'Blog', path: '/page/blog' },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.path}
                    className="text-[#6B6575] hover:text-[#843D9B] transition-colors text-[13px]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <h4 className="text-[12px] font-bold uppercase tracking-[0.14em] mb-5 text-[#1A1523]">
              Support
            </h4>
            <ul className="space-y-3">
              {[
                { label: 'Help Center', path: '/page/support' },
                { label: 'Privacy Policy', path: '/page/privacy-policy' },
                { label: 'Terms & Conditions', path: '/page/terms-of-service' },
                { label: 'Shipping Policy', path: '/page/shipping-policy' },
                { label: 'Refund Policy', path: '/page/refund-policy' },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.path}
                    className="text-[#6B6575] hover:text-[#843D9B] transition-colors text-[13px]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-[12px] font-bold uppercase tracking-[0.14em] mb-5 text-[#1A1523]">
              Contact Us
            </h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Phone size={15} className="text-[#843D9B] mt-0.5 shrink-0" />
                <span className="text-[#6B6575] text-[13px]">+91 98765 43210</span>
              </li>
              <li className="flex items-start gap-3">
                <Mail size={15} className="text-[#843D9B] mt-0.5 shrink-0" />
                <span className="text-[#6B6575] text-[13px]">support@sewzella.com</span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin size={15} className="text-[#843D9B] mt-0.5 shrink-0" />
                <span className="text-[#6B6575] text-[13px]">Srinagar, Kashmir, India</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-[#EDE8F2] pt-7 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-[#9A94A3] text-[12px]">
            &copy; {new Date().getFullYear()} {appName}. All Rights Reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-6 text-[#9A94A3] text-[12px]">
            <Link to="/page/privacy-policy" className="hover:text-[#843D9B] transition-colors">Privacy Policy</Link>
            <Link to="/page/terms-of-service" className="hover:text-[#843D9B] transition-colors">Terms of Service</Link>
            <Link to="/page/accessibility" className="hover:text-[#843D9B] transition-colors">Accessibility</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;
