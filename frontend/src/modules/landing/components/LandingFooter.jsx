import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Facebook, Twitter, Youtube, MapPin, Phone, Mail } from 'lucide-react';

const LandingFooter = () => {
  return (
    <footer style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      {/* Main Footer */}
      <div className="bg-[#1c1b1b] text-white pt-16 pb-10">
        <div className="max-w-[1536px] mx-auto px-5 md:px-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-14">
            {/* Brand Column */}
            <div className="lg:col-span-1">
              <Link to="/" className="flex items-center gap-2 mb-5">
                <img
                  src="/sewzella_logo-removebg-preview.png"
                  alt="Sewzella"
                  className="h-10 w-auto brightness-0 invert"
                />
              </Link>
              <p className="text-white/60 text-[13px] leading-relaxed mb-6">
                Custom tailoring reimagined. We bring tailors and customers together for the perfect fit in your favorite style.
              </p>
              <div className="flex gap-3">
                {[
                  { icon: <Instagram size={16} />, href: '#' },
                  { icon: <Facebook size={16} />, href: '#' },
                  { icon: <Twitter size={16} />, href: '#' },
                  { icon: <Youtube size={16} />, href: '#' },
                ].map((social, i) => (
                  <a
                    key={i}
                    href={social.href}
                    className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:bg-[#4a0581] hover:text-white transition-all duration-300"
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="text-[13px] font-bold uppercase tracking-wider mb-5 text-white">Quick Links</h4>
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
                      className="text-white/55 hover:text-[#dcb8ff] transition-colors text-[13px]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-[13px] font-bold uppercase tracking-wider mb-5 text-white">Company</h4>
              <ul className="space-y-3">
                {[
                  { label: 'About Us', path: '/page/about-us' },
                  { label: 'Community', path: '/page/community' },
                  { label: 'Careers', path: '/page/careers' },
                  { label: 'Blog', path: '/page/blog' },
                ].map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.path}
                      className="text-white/55 hover:text-[#dcb8ff] transition-colors text-[13px]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-[13px] font-bold uppercase tracking-wider mb-5 text-white">Support</h4>
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
                      className="text-white/55 hover:text-[#dcb8ff] transition-colors text-[13px]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact Us */}
            <div>
              <h4 className="text-[13px] font-bold uppercase tracking-wider mb-5 text-white">Contact Us</h4>
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <Phone size={15} className="text-[#dcb8ff] mt-0.5 shrink-0" />
                  <span className="text-white/55 text-[13px]">+91 98765 43210</span>
                </li>
                <li className="flex items-start gap-3">
                  <Mail size={15} className="text-[#dcb8ff] mt-0.5 shrink-0" />
                  <span className="text-white/55 text-[13px]">support@sewzella.com</span>
                </li>
                <li className="flex items-start gap-3">
                  <MapPin size={15} className="text-[#dcb8ff] mt-0.5 shrink-0" />
                  <span className="text-white/55 text-[13px]">Srinagar, Kashmir, India</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-white/10 pt-7 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/35 text-[12px]">
              &copy; {new Date().getFullYear()} Sewzella. All Rights Reserved.
            </p>
            <div className="flex gap-6 text-white/35 text-[12px]">
              <Link to="/page/privacy-policy" className="hover:text-white/70 transition-colors">Privacy Policy</Link>
              <Link to="/page/terms-of-service" className="hover:text-white/70 transition-colors">Terms of Service</Link>
              <Link to="/page/accessibility-report" className="hover:text-white/70 transition-colors">Accessibility</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;
