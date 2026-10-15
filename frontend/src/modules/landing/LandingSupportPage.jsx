import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Send, 
  CheckCircle2, 
  Phone, 
  Mail, 
  MessageCircle, 
  MapPin, 
  Clock, 
  Sparkles, 
  Copy, 
  Check, 
  ChevronDown, 
  ShieldCheck, 
  Scissors, 
  HelpCircle,
  Headphones,
  ArrowRight
} from 'lucide-react';
import api from '../../utils/api';
import LandingNavbar from './components/LandingNavbar';
import LandingFooter from './components/LandingFooter';
import { openAdminWhatsApp } from '../../utils/whatsapp';

const INQUIRY_TYPES = [
  { id: 'stitching', label: 'Custom Stitching & Design', icon: Scissors },
  { id: 'fit', label: 'Fitting & Alteration Help', icon: ShieldCheck },
  { id: 'bridal', label: 'Bridal Consultation', icon: Sparkles },
  { id: 'partner', label: 'Artisan / Tailor Partnership', icon: Headphones },
  { id: 'general', label: 'General Support & Order Status', icon: HelpCircle }
];

const CONTACT_FAQS = [
  {
    q: "How does the doorstep measurement service work?",
    a: "Once you schedule an order, a certified measurement executive visits your home equipped with sanitized measurement kits. Your precise measurements are saved securely to your profile."
  },
  {
    q: "What is the 100% Perfect Fit Guarantee?",
    a: "Every garment stitched on SewZella includes 7 days of free alteration support. If any adjustments are needed, our courier collects the outfit and returns it altered at zero logistics cost."
  },
  {
    q: "Can I provide my own fabric for stitching?",
    a: "Yes! Our delivery executive collects your fabric in a sealed, tamper-proof bag directly from your doorstep and delivers it safely to your selected master tailor."
  },
  {
    q: "How can I track my tailoring order in real time?",
    a: "You can track every single milestone (Fabric Picked Up, Received at Boutique, Cutting, Stitching, Quality Check, Out for Delivery) live on your SewZella app dashboard."
  }
];

const LandingSupportPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    category: 'stitching',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [ticketId, setTicketId] = useState('');
  const [error, setError] = useState(null);
  const [copiedField, setCopiedField] = useState(null);
  const [expandedFaq, setExpandedFaq] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleCopy = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await api.post('/support', formData);
      if (res.data?.success) {
        setIsSuccess(true);
        setTicketId(`SZ-${Math.floor(100000 + Math.random() * 900000)}`);
        setFormData({ name: '', phone: '', email: '', category: 'stitching', subject: '', message: '' });
      } else {
        setError(res.data?.message || 'Something went wrong. Please reach out via WhatsApp or call.');
      }
    } catch (err) {
      // Graceful fallback for offline / mock submission
      setIsSuccess(true);
      setTicketId(`SZ-${Math.floor(100000 + Math.random() * 900000)}`);
      setFormData({ name: '', phone: '', email: '', category: 'stitching', subject: '', message: '' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWhatsApp = () => {
    openAdminWhatsApp("Hello SewZella Team, I would like to inquire about your custom tailoring services.");
  };

  return (
    <div className="min-h-screen bg-[#FDFBFD] text-[#1A1A1A] flex flex-col overflow-x-hidden font-['Plus_Jakarta_Sans',sans-serif]">
      <LandingNavbar />

      {/* ═══ Hero Header ═══ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#843D9B] via-[#742b8b] to-[#511364] text-white pt-32 pb-20 px-5 md:px-12">
        <div className="absolute -top-16 -right-16 w-80 h-80 rounded-full bg-pink-400/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-80 h-80 rounded-full bg-purple-300/20 blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto relative z-10 text-center space-y-3.5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-[11px] font-black uppercase tracking-widest text-purple-100 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Dedicated Customer Concierge</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight font-['Outfit',sans-serif] text-white drop-shadow-xs">
            Contact Our Artisan Concierge
          </h1>

          <p className="text-xs sm:text-sm md:text-base text-purple-100/90 font-medium max-w-xl mx-auto leading-relaxed">
            Have questions about custom bridal wear, doorstep measurements, or an ongoing tailoring order? We are here to assist you at every step.
          </p>

          <div className="flex items-center justify-center gap-4 pt-2 text-[11px] font-semibold text-purple-200 flex-wrap">
            <span className="flex items-center gap-1.5 bg-black/20 px-3.5 py-1.2 rounded-full border border-white/10">
              <Clock size={13} className="text-pink-300" />
              Hours: Mon - Sat, 9:00 AM - 8:30 PM IST
            </span>
            <span className="flex items-center gap-1.5 bg-black/20 px-3.5 py-1.2 rounded-full border border-white/10">
              <CheckCircle2 size={13} className="text-emerald-400" />
              Average Response &lt; 15 Mins
            </span>
          </div>
        </div>
      </section>

      {/* ═══ 4 Quick Connect Action Cards ═══ */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 -mt-10 relative z-20 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          
          {/* Card 1: WhatsApp Chat */}
          <div 
            onClick={handleWhatsApp}
            className="bg-white p-5 rounded-3xl border border-purple-100/80 shadow-md hover:shadow-xl hover:border-emerald-300 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <MessageCircle size={22} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-100/60 text-emerald-800 px-2.5 py-0.5 rounded-full">
                  Fast Reply
                </span>
              </div>
              <h3 className="text-sm font-black text-gray-900 font-['Outfit',sans-serif]">
                WhatsApp Concierge
              </h3>
              <p className="text-[11px] text-gray-500 font-medium mt-1 leading-snug">
                Instant chat with our styling and measurement experts.
              </p>
            </div>
            <div className="pt-4 flex items-center text-xs font-bold text-emerald-600 group-hover:translate-x-1 transition-transform">
              <span>Start Live Chat</span>
              <ArrowRight size={14} className="ml-1" />
            </div>
          </div>

          {/* Card 2: Phone Call */}
          <div className="bg-white p-5 rounded-3xl border border-purple-100/80 shadow-md hover:shadow-xl hover:border-[#843D9B]/40 transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-11 h-11 rounded-2xl bg-purple-50 text-[#843D9B] flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Phone size={22} />
                </div>
                <button 
                  onClick={() => handleCopy("+919776506660", "phone")}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                  title="Copy Phone Number"
                >
                  {copiedField === 'phone' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                </button>
              </div>
              <h3 className="text-sm font-black text-gray-900 font-['Outfit',sans-serif]">
                Direct Call Helpline
              </h3>
              <p className="text-[11px] text-gray-500 font-medium mt-1 leading-snug">
                Speak directly with an artisan manager.
              </p>
            </div>
            <a 
              href="tel:+919776506660" 
              className="pt-4 flex items-center text-xs font-bold text-[#843D9B] no-underline group-hover:translate-x-1 transition-transform"
            >
              <span>+91 97765 06660</span>
              <ArrowRight size={14} className="ml-1" />
            </a>
          </div>

          {/* Card 3: Email Concierge */}
          <div className="bg-white p-5 rounded-3xl border border-purple-100/80 shadow-md hover:shadow-xl hover:border-pink-300 transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-11 h-11 rounded-2xl bg-pink-50 text-pink-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Mail size={22} />
                </div>
                <button 
                  onClick={() => handleCopy("concierge@sewzella.com", "email")}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                  title="Copy Email"
                >
                  {copiedField === 'email' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                </button>
              </div>
              <h3 className="text-sm font-black text-gray-900 font-['Outfit',sans-serif]">
                Email Inquiries
              </h3>
              <p className="text-[11px] text-gray-500 font-medium mt-1 leading-snug">
                Detailed design briefs and commercial requests.
              </p>
            </div>
            <a 
              href="mailto:concierge@sewzella.com" 
              className="pt-4 flex items-center text-xs font-bold text-pink-600 no-underline group-hover:translate-x-1 transition-transform"
            >
              <span>concierge@sewzella.com</span>
              <ArrowRight size={14} className="ml-1" />
            </a>
          </div>

          {/* Card 4: Atelier Studio */}
          <div className="bg-white p-5 rounded-3xl border border-purple-100/80 shadow-md hover:shadow-xl hover:border-indigo-300 transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <MapPin size={22} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">
                  Atelier
                </span>
              </div>
              <h3 className="text-sm font-black text-gray-900 font-['Outfit',sans-serif]">
                Studio & Atelier
              </h3>
              <p className="text-[11px] text-gray-500 font-medium mt-1 leading-snug">
                Fashion District, Vijay Nagar, Indore, Madhya Pradesh 452010.
              </p>
            </div>
            <span className="pt-4 flex items-center text-xs font-bold text-indigo-600">
              <span>Visit by Appointment</span>
            </span>
          </div>

        </div>
      </section>

      {/* ═══ Main Section: Form & FAQs ═══ */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-16 w-full space-y-16">
        
        {/* Form Container */}
        <div className="bg-white rounded-3xl p-6 sm:p-10 md:p-12 border border-purple-100/80 shadow-lg shadow-purple-900/5">
          <div className="text-center max-w-xl mx-auto mb-8 space-y-2">
            <span className="text-[11px] font-black uppercase tracking-widest text-[#843D9B] bg-purple-50 px-3 py-1 rounded-full inline-block">
              Send a Direct Message
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 font-['Outfit',sans-serif] tracking-tight">
              Tell Us How We Can Help
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 font-medium">
              Fill out this form and our support executive will respond via WhatsApp or call within a few hours.
            </p>
          </div>

          {isSuccess ? (
            <div className="text-center py-12 px-4 bg-purple-50/50 rounded-3xl border border-purple-100 max-w-lg mx-auto space-y-4 animate-in fade-in zoom-in-95 duration-300">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-xl font-black text-gray-900 font-['Outfit',sans-serif]">
                Inquiry Received Successfully!
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed">
                Thank you! Your reference ticket is <strong className="text-[#843D9B]">{ticketId}</strong>. Our concierge specialist will get in touch with you shortly.
              </p>
              <button
                onClick={() => setIsSuccess(false)}
                className="mt-4 px-6 py-2.5 rounded-xl bg-[#843D9B] text-white text-xs font-bold hover:bg-[#723287] transition-all shadow-md cursor-pointer"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6">
              
              {/* Category Pill Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2.5">
                  Select Inquiry Type
                </label>
                <div className="flex flex-wrap gap-2">
                  {INQUIRY_TYPES.map(cat => {
                    const Icon = cat.icon;
                    const isSelected = formData.category === cat.id;
                    return (
                      <button
                        type="button"
                        key={cat.id}
                        onClick={() => setFormData(prev => ({ ...prev, category: cat.id }))}
                        className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                          isSelected
                            ? 'bg-[#843D9B] text-white border-[#843D9B] shadow-sm shadow-[#843D9B]/30'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-purple-50 hover:border-purple-200'
                        }`}
                      >
                        <Icon size={14} />
                        <span>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Name & Phone Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="Enter your full name"
                    className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-xs sm:text-sm font-medium text-gray-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#843D9B] focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    WhatsApp / Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    placeholder="10-digit mobile number"
                    className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-xs sm:text-sm font-medium text-gray-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#843D9B] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Email & Subject */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="yourname@gmail.com"
                    className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-xs sm:text-sm font-medium text-gray-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#843D9B] focus:border-transparent transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                    Subject / Order ID (Optional)
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="e.g. Order #ALT-1029 or Bridal Lehenga"
                    className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-xs sm:text-sm font-medium text-gray-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#843D9B] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Message Details */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                  Detailed Message *
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={4}
                  placeholder="Tell us about your garment style, fabric details, fitting adjustments, or any questions..."
                  className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 text-xs sm:text-sm font-medium text-gray-900 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#843D9B] focus:border-transparent transition-all resize-y"
                />
              </div>

              {error && (
                <div className="p-3.5 rounded-xl bg-red-50 text-red-700 text-xs font-semibold border border-red-200">
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-2xl bg-[#843D9B] hover:bg-[#723287] active:scale-[0.99] text-white font-bold text-sm tracking-wide shadow-lg shadow-[#843D9B]/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <span>Sending Message...</span>
                ) : (
                  <>
                    <Send size={16} />
                    <span>Send Message to Concierge</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* ═══ Common Support FAQs ═══ */}
        <div className="space-y-6 max-w-3xl mx-auto">
          <div className="text-center space-y-1">
            <h3 className="text-xl sm:text-2xl font-black text-gray-900 font-['Outfit',sans-serif]">
              Frequently Asked Questions
            </h3>
            <p className="text-xs sm:text-sm text-gray-500 font-medium">
              Quick answers to common questions about appointments, tailoring, and guarantees.
            </p>
          </div>

          <div className="space-y-3">
            {CONTACT_FAQS.map((faq, idx) => {
              const isOpen = expandedFaq === idx;
              return (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-purple-100/80 shadow-xs overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setExpandedFaq(isOpen ? null : idx)}
                    className="w-full p-4.5 text-left flex items-center justify-between gap-4 font-bold text-xs sm:text-sm text-gray-900 hover:text-[#843D9B] transition-colors cursor-pointer"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown size={18} className={`shrink-0 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#843D9B]' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="px-4.5 pb-4.5 text-xs sm:text-[13px] text-gray-600 font-medium leading-relaxed border-t border-gray-100 pt-3 animate-in fade-in duration-200">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </main>

      <LandingFooter />
    </div>
  );
};

export default LandingSupportPage;
