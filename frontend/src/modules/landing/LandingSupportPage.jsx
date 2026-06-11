import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Facebook, Twitter, Send, CheckCircle } from 'lucide-react';
import api from '../../utils/api';

const LandingSupportPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await api.post('/support', formData);
      if (res.data.success) {
        setIsSuccess(true);
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        setError(res.data.message || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="font-body bg-[var(--color-alabaster)] text-[var(--color-evergreen)] min-h-screen flex flex-col selection:bg-[var(--color-evergreen)] selection:text-[var(--color-gold)] overflow-x-hidden">
      
      {/* Reused Navbar Structure - Solid Background */}
      <nav className="fixed top-0 w-full z-50 bg-[var(--color-evergreen)] border-b border-[var(--color-evergreen-container)] py-4 shadow-lg">
        <div className="max-w-7xl mx-auto px-8 md:px-16 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2 group">
            <h1 className="font-serif text-2xl tracking-wide transition-colors text-white">
              SewZella
            </h1>
          </Link>
          
          <div className="hidden md:flex gap-10 items-center">
            {['Services', 'Artisans', 'Portfolio', 'Contact'].map((item) => (
              <Link 
                key={item} 
                to={item === 'Contact' ? '/page/contact-us' : `/#${item.toLowerCase()}`} 
                className="text-sm tracking-widest uppercase transition-colors hover:text-white text-white/80"
              >
                {item}
              </Link>
            ))}
          </div>

          <div className="flex gap-4 items-center">
            <a href="https://play.google.com/store" target="_blank" rel="noopener noreferrer" className="bg-[var(--color-gold)] text-[var(--color-evergreen)] px-6 py-2.5 rounded text-sm tracking-widest uppercase font-semibold hover:bg-white transition-all duration-300">
              Book Consultation
            </a>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-grow pt-32 pb-24 px-8 md:px-16 max-w-4xl mx-auto w-full">
        <article className="bg-white p-8 md:p-12 rounded-lg shadow-sm border border-[var(--color-stone)]">
          <div className="mb-10 pb-6 border-b border-[var(--color-stone)] text-center">
            <span className="text-[var(--color-sage)] uppercase tracking-[0.2em] text-xs font-semibold block mb-4">Concierge Services</span>
            <h1 className="font-serif text-4xl md:text-5xl text-[var(--color-evergreen)]">Send a Message</h1>
            <p className="text-[var(--color-sage)] text-sm tracking-wide mt-4 font-medium max-w-lg mx-auto leading-relaxed">
              For bespoke inquiries, fitting adjustments, or tracking orders, please reach out. Our master tailors and concierge team will respond promptly.
            </p>
          </div>
          
          {isSuccess ? (
            <div className="text-center py-10 bg-[var(--color-stone)] rounded-lg">
              <div className="w-16 h-16 bg-[var(--color-evergreen)] text-[var(--color-gold)] rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                <CheckCircle size={32} />
              </div>
              <h2 className="font-serif text-2xl text-[var(--color-evergreen)] mb-2">Message Sent</h2>
              <p className="text-[var(--color-sage)] mb-6">Thank you for reaching out. We will get back to you shortly.</p>
              <button onClick={() => setIsSuccess(false)} className="border border-[var(--color-evergreen)] text-[var(--color-evergreen)] px-8 py-3 rounded text-sm tracking-widest uppercase font-semibold hover:bg-[var(--color-evergreen)] hover:text-white transition-colors inline-block">
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded text-sm mb-6 border border-red-100">
                  {error}
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--color-sage)] mb-2">Full Name</label>
                  <input 
                    type="text" 
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full bg-[var(--color-alabaster)] border border-[var(--color-stone)] rounded px-4 py-3 focus:outline-none focus:border-[var(--color-gold)] transition-colors text-[var(--color-evergreen)]"
                    placeholder="Elias Thorne"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--color-sage)] mb-2">Email Address</label>
                  <input 
                    type="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full bg-[var(--color-alabaster)] border border-[var(--color-stone)] rounded px-4 py-3 focus:outline-none focus:border-[var(--color-gold)] transition-colors text-[var(--color-evergreen)]"
                    placeholder="elias@example.com"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--color-sage)] mb-2">Subject</label>
                <input 
                  type="text" 
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full bg-[var(--color-alabaster)] border border-[var(--color-stone)] rounded px-4 py-3 focus:outline-none focus:border-[var(--color-gold)] transition-colors text-[var(--color-evergreen)]"
                  placeholder="Inquiry about custom suit fitting"
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-[var(--color-sage)] mb-2">Message</label>
                <textarea 
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="w-full bg-[var(--color-alabaster)] border border-[var(--color-stone)] rounded px-4 py-3 focus:outline-none focus:border-[var(--color-gold)] transition-colors text-[var(--color-evergreen)] resize-none"
                  placeholder="Tell us about your requirements..."
                ></textarea>
              </div>
              
              <div className="pt-4 text-center">
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-[var(--color-evergreen)] text-white px-10 py-4 rounded text-sm tracking-widest uppercase font-semibold hover:bg-[var(--color-gold)] transition-colors flex items-center justify-center gap-2 w-full md:w-auto mx-auto disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-[var(--color-stone)] border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <><Send size={16} /> Send Message</>
                  )}
                </button>
              </div>
            </form>
          )}
        </article>
      </main>

      {/* Reused Footer Structure */}
      <footer className="bg-[var(--color-evergreen)] text-white pt-24 pb-12 mt-auto">
        <div className="max-w-7xl mx-auto px-8 md:px-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-20">
            <div className="lg:col-span-1">
              <h2 className="font-serif text-3xl text-[var(--color-gold)] mb-6">SewZella</h2>
              <p className="text-white/60 text-sm leading-relaxed mb-8">
                Defining the future of bespoke tailoring through sustainable practices and heritage craftsmanship.
              </p>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 rounded border border-white/20 flex items-center justify-center text-white/60 hover:text-[var(--color-gold)] hover:border-[var(--color-gold)] transition-colors">
                  <Instagram size={18} />
                </a>
                <a href="#" className="w-10 h-10 rounded border border-white/20 flex items-center justify-center text-white/60 hover:text-[var(--color-gold)] hover:border-[var(--color-gold)] transition-colors">
                  <Facebook size={18} />
                </a>
                <a href="#" className="w-10 h-10 rounded border border-white/20 flex items-center justify-center text-white/60 hover:text-[var(--color-gold)] hover:border-[var(--color-gold)] transition-colors">
                  <Twitter size={18} />
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm tracking-widest uppercase font-semibold mb-6 text-white">Discover</h4>
              <ul className="space-y-4">
                <li><Link to="/#artisans" className="text-white/60 hover:text-[var(--color-gold)] transition-colors text-sm">Artisans</Link></li>
                <li><Link to="/#services" className="text-white/60 hover:text-[var(--color-gold)] transition-colors text-sm">Services</Link></li>
                <li><Link to="/#portfolio" className="text-white/60 hover:text-[var(--color-gold)] transition-colors text-sm">Portfolio</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-sm tracking-widest uppercase font-semibold mb-6 text-white">Partners</h4>
              <ul className="space-y-4">
                <li><a href="https://play.google.com/store" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-[var(--color-gold)] transition-colors text-sm">Artisan Portal</a></li>
                <li><a href="https://play.google.com/store" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-[var(--color-gold)] transition-colors text-sm">Delivery Partners</a></li>
                <li><a href="#" className="text-white/60 hover:text-[var(--color-gold)] transition-colors text-sm">Corporate</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-sm tracking-widest uppercase font-semibold mb-6 text-white">Contact</h4>
              <ul className="space-y-4">
                <li className="text-white/60 text-sm">concierge@sewzella.com</li>
                <li className="text-white/60 text-sm">+1 (800) 555-0199</li>
                <li><Link to="/page/support" className="text-[var(--color-gold)] hover:text-white transition-colors text-sm underline underline-offset-4 mt-2 inline-block">Send a Message</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-white/40 text-xs tracking-wider uppercase">
              &copy; {new Date().getFullYear()} SewZella Bespoke Tailoring. Handcrafted Excellence.
            </p>
            <div className="flex gap-6 text-white/40 text-xs tracking-wider uppercase">
              <Link to="/page/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link to="/page/terms-of-service" className="hover:text-white transition-colors">Terms of Service</Link>
              <Link to="/page/accessibility-report" className="hover:text-white transition-colors">Accessibility Report</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingSupportPage;
