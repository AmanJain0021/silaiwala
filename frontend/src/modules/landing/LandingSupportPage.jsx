import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Send, CheckCircle } from 'lucide-react';
import api from '../../utils/api';
import LandingNavbar from './components/LandingNavbar';
import LandingFooter from './components/LandingFooter';

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
    <div
      className="min-h-screen bg-[#fcf9f8] text-[#1c1b1b] flex flex-col overflow-x-hidden"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <LandingNavbar />

      {/* Main Content Area */}
      <main className="flex-grow pt-28 pb-20 px-5 md:px-16 max-w-4xl mx-auto w-full">
        <article className="bg-white p-8 md:p-12 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-[#eae7e7]">
          <div className="mb-10 pb-6 border-b border-[#f0eded] text-center">
            <span className="text-[#7d7483] uppercase tracking-[0.15em] text-[12px] font-semibold block mb-4">Support</span>
            <h1 className="text-3xl md:text-4xl font-bold text-[#1c1b1b]" style={{ fontFamily: "'Libre Caslon Text', serif" }}>
              Send a Message
            </h1>
            <p className="text-[#7d7483] text-[14px] mt-4 font-medium max-w-lg mx-auto leading-relaxed">
              For tailoring inquiries, fitting adjustments, or tracking orders, please reach out. Our team will respond promptly.
            </p>
          </div>
          
          {isSuccess ? (
            <div className="text-center py-10 bg-[#f0dbff]/20 rounded-2xl">
              <div className="w-16 h-16 bg-[#4a0581] text-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_8px_25px_rgba(74,5,129,0.3)]">
                <CheckCircle size={32} />
              </div>
              <h2 className="text-2xl font-bold text-[#1c1b1b] mb-2" style={{ fontFamily: "'Libre Caslon Text', serif" }}>
                Message Sent
              </h2>
              <p className="text-[#7d7483] mb-6">Thank you for reaching out. We will get back to you shortly.</p>
              <button
                onClick={() => setIsSuccess(false)}
                className="border-2 border-[#4a0581] text-[#4a0581] px-8 py-3 rounded-full text-[13px] font-semibold hover:bg-[#4a0581] hover:text-white transition-all duration-300 inline-block"
              >
                Send Another Message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
              {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-xl text-[13px] mb-6 border border-red-100">
                  {error}
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[12px] font-bold uppercase tracking-wider text-[#7d7483] mb-2">Full Name</label>
                  <input 
                    type="text" 
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full bg-[#fcf9f8] border border-[#eae7e7] rounded-xl px-4 py-3 focus:outline-none focus:border-[#4a0581] focus:ring-2 focus:ring-[#f0dbff] transition-all text-[#1c1b1b] text-[14px]"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-bold uppercase tracking-wider text-[#7d7483] mb-2">Email Address</label>
                  <input 
                    type="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full bg-[#fcf9f8] border border-[#eae7e7] rounded-xl px-4 py-3 focus:outline-none focus:border-[#4a0581] focus:ring-2 focus:ring-[#f0dbff] transition-all text-[#1c1b1b] text-[14px]"
                    placeholder="you@example.com"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-[12px] font-bold uppercase tracking-wider text-[#7d7483] mb-2">Subject</label>
                <input 
                  type="text" 
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full bg-[#fcf9f8] border border-[#eae7e7] rounded-xl px-4 py-3 focus:outline-none focus:border-[#4a0581] focus:ring-2 focus:ring-[#f0dbff] transition-all text-[#1c1b1b] text-[14px]"
                  placeholder="Inquiry about custom stitching"
                />
              </div>
              
              <div>
                <label className="block text-[12px] font-bold uppercase tracking-wider text-[#7d7483] mb-2">Message</label>
                <textarea 
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows={6}
                  className="w-full bg-[#fcf9f8] border border-[#eae7e7] rounded-xl px-4 py-3 focus:outline-none focus:border-[#4a0581] focus:ring-2 focus:ring-[#f0dbff] transition-all text-[#1c1b1b] resize-none text-[14px]"
                  placeholder="Tell us about your requirements..."
                ></textarea>
              </div>
              
              <div className="pt-4 text-center">
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-[#4a0581] text-white px-10 py-3.5 rounded-full text-[14px] font-semibold hover:bg-[#622999] transition-all duration-300 flex items-center justify-center gap-2 w-full md:w-auto mx-auto disabled:opacity-50 shadow-[0_4px_20px_rgba(74,5,129,0.3)]"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    <><Send size={16} /> Send Message</>
                  )}
                </button>
              </div>
            </form>
          )}
        </article>
      </main>

      <LandingFooter />
    </div>
  );
};

export default LandingSupportPage;
