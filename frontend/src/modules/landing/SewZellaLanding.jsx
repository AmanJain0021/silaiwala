import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronRight, Scissors, Ruler, Shirt, CheckCircle, Mail, MapPin, Phone, Instagram, Facebook, Twitter, Truck } from 'lucide-react';

const SewZellaLanding = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="font-body bg-[var(--color-alabaster)] text-[var(--color-evergreen)] min-h-screen selection:bg-[var(--color-evergreen)] selection:text-[var(--color-gold)] overflow-x-hidden">
      
      {/* 1. Transparent Luxury Navbar */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-500 border-b ${scrolled ? 'bg-[var(--color-evergreen)] border-[var(--color-evergreen-container)] py-4 shadow-lg' : 'bg-transparent border-transparent py-6'}`}>
        <div className="max-w-7xl mx-auto px-8 md:px-16 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2 group">
            <h1 className={`font-serif text-2xl tracking-wide transition-colors ${scrolled ? 'text-white' : 'text-[var(--color-gold)]'}`}>
              SewZella
            </h1>
          </Link>
          
          <div className="hidden md:flex gap-10 items-center">
            {['Services', 'Artisans', 'Portfolio', 'Contact'].map((item) => (
              item === 'Contact' ? (
                <Link key={item} to="/page/contact-us" className={`text-sm tracking-widest uppercase transition-colors hover:text-white ${scrolled ? 'text-white/80' : 'text-[var(--color-gold)]/90'}`}>
                  {item}
                </Link>
              ) : (
                <a key={item} href={`#${item.toLowerCase()}`} className={`text-sm tracking-widest uppercase transition-colors hover:text-white ${scrolled ? 'text-white/80' : 'text-[var(--color-gold)]/90'}`}>
                  {item}
                </a>
              )
            ))}
          </div>

          <div className="flex gap-4 items-center">
            <a href="https://play.google.com/store" target="_blank" rel="noopener noreferrer" className="bg-[var(--color-gold)] text-[var(--color-evergreen)] px-6 py-2.5 rounded text-sm tracking-widest uppercase font-semibold hover:bg-white transition-all duration-300">
              Book Consultation
            </a>
          </div>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <section className="relative min-h-[90vh] flex items-center justify-center pt-20">
        <div className="absolute inset-0 z-0">
          <img 
            src="/landing/landing_hero_1779536482633.png" 
            alt="Cinematic luxury bespoke tailoring" 
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-[var(--color-evergreen)]/60"></div>
        </div>
        
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto flex flex-col items-center mt-12 pb-20 md:pb-24">
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-[var(--color-gold)] uppercase tracking-[0.3em] text-sm mb-6 font-semibold"
          >
            Hand-Crafted Excellence Since 1952
          </motion.p>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="font-serif text-5xl md:text-7xl lg:text-[80px] text-white leading-[1.1] mb-8"
          >
            Transform Your Presence<br/>With Bespoke Artistry
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-white/80 text-lg md:text-xl max-w-2xl font-light leading-relaxed mb-10"
          >
            Experience the fine art of artisanal tailoring, where every stitch is a testament to heritage, precision, and your unique identity.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-6"
          >
            <a href="https://play.google.com/store" target="_blank" rel="noopener noreferrer" className="bg-[var(--color-gold)] text-[var(--color-evergreen)] px-8 py-4 rounded text-sm tracking-widest uppercase font-bold hover:bg-white transition-all duration-300 flex items-center justify-center gap-2">
              Book Consultation <ChevronRight size={16} />
            </a>
            <a href="#portfolio" className="border border-white/30 text-white px-8 py-4 rounded text-sm tracking-widest uppercase font-semibold hover:bg-white/10 hover:border-white transition-all duration-300 flex items-center justify-center">
              View Portfolio
            </a>
          </motion.div>
        </div>

        {/* Bottom Trust Indicators */}
        <div className="absolute bottom-0 w-full border-t border-white/10 bg-[var(--color-evergreen)]/40 backdrop-blur-md hidden md:block">
          <div className="max-w-7xl mx-auto px-8 py-5 flex justify-between items-center text-white/70 text-xs uppercase tracking-widest">
            <span className="flex items-center gap-2"><CheckCircle size={14} className="text-[var(--color-gold)]" /> Ethically Sourced</span>
            <span className="flex items-center gap-2"><Scissors size={14} className="text-[var(--color-gold)]" /> Master Tailors</span>
            <span className="flex items-center gap-2"><Ruler size={14} className="text-[var(--color-gold)]" /> Precision Fitting</span>
            <span className="flex items-center gap-2"><Shirt size={14} className="text-[var(--color-gold)]" /> Sustainable Silks</span>
          </div>
        </div>
      </section>

      {/* 3. Premium Services Cards */}
      <section id="services" className="py-24 md:py-32 bg-[var(--color-alabaster)]">
        <div className="max-w-7xl mx-auto px-8 md:px-16">
          <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
            <div className="max-w-xl">
              <h2 className="font-serif text-4xl md:text-5xl text-[var(--color-evergreen)] mb-4">Our Curated Services</h2>
              <p className="text-[var(--color-sage)] text-lg leading-relaxed">From the formal structure of a bespoke suit to the delicate flow of bridal silk, we provide specialized tailoring services for every milestone.</p>
            </div>
            <Link to="/user/services" className="text-[var(--color-evergreen)] border-b border-[var(--color-evergreen)] pb-1 text-sm tracking-widest uppercase font-medium hover:text-[var(--color-gold)] hover:border-[var(--color-gold)] transition-colors">
              View All Services
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { title: "Men's Suits", desc: "Precision-engineered garments for the modern gentleman.", img: "/landing/service_suit_1779536603895.png" },
              { title: "Bridal Wear", desc: "Ethereal designs meticulously crafted for your special day.", img: "/landing/service_bridal_1779536675225.png" },
              { title: "Alterations", desc: "Renewing and refining your favorite wardrobe pieces.", img: "/landing/landing_hero_1779536482633.png" }, 
              { title: "Ethnic Wear", desc: "Celebrating heritage through bespoke traditional tailoring.", img: "/landing/service_suit_1779536603895.png" } 
            ].map((service, idx) => (
              <div key={idx} className="group cursor-pointer">
                <div className="aspect-[4/5] overflow-hidden rounded-lg mb-6 bg-[var(--color-stone)]">
                  <img src={service.img} alt={service.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                </div>
                <h3 className="font-serif text-2xl mb-2 text-[var(--color-evergreen)]">{service.title}</h3>
                <p className="text-[var(--color-sage)] text-sm mb-4 leading-relaxed">{service.desc}</p>
                <span className="text-[var(--color-evergreen)] text-xs tracking-widest uppercase font-semibold flex items-center gap-1 group-hover:text-[var(--color-gold)] transition-colors">
                  Learn More <ChevronRight size={14} />
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Bespoke Process Timeline */}
      <section className="py-24 md:py-32 bg-[var(--color-stone)]">
        <div className="max-w-7xl mx-auto px-8 md:px-16">
          <div className="text-center mb-20">
            <span className="text-[var(--color-sage)] uppercase tracking-[0.2em] text-xs font-semibold block mb-4">The Process</span>
            <h2 className="font-serif text-4xl md:text-5xl text-[var(--color-evergreen)]">A Seamless Bespoke Journey</h2>
          </div>

          <div className="relative">
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-[1px] bg-[var(--color-sage)]/20 -translate-y-1/2 z-0"></div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-6 relative z-10">
              {[
                { step: "01", title: "Consult", desc: "Discuss your vision and material preferences with our design team.", icon: <CheckCircle className="w-6 h-6" /> },
                { step: "02", title: "Measure", desc: "Expert measurements to ensure a flawless, custom-fit silhouette.", icon: <Ruler className="w-6 h-6" /> },
                { step: "03", title: "Stitch", desc: "Artisans bring your garment to life using traditional hand-finishing.", icon: <Scissors className="w-6 h-6" /> },
                { step: "04", title: "Deliver", desc: "Your masterpiece is inspected and delivered to your doorstep.", icon: <Shirt className="w-6 h-6" /> }
              ].map((item, idx) => (
                <div key={idx} className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded bg-[var(--color-evergreen)] text-[var(--color-gold)] flex items-center justify-center mb-6 shadow-xl">
                    {item.icon}
                  </div>
                  <span className="text-[var(--color-sage)] text-sm tracking-widest mb-2 font-medium">{item.step}. {item.title}</span>
                  <p className="text-[var(--color-evergreen)] text-sm leading-relaxed max-w-[240px]">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 5. Master Artisan Story */}
      <section id="artisans" className="py-24 md:py-32 bg-[var(--color-alabaster)]">
        <div className="max-w-7xl mx-auto px-8 md:px-16">
          <div className="flex flex-col lg:flex-row gap-16 items-center">
            <div className="w-full lg:w-1/2 relative">
              <div className="aspect-square md:aspect-[4/5] rounded-lg overflow-hidden">
                <img src="/landing/artisan_portrait_1779536723229.png" alt="Master Artisan" className="w-full h-full object-cover" />
              </div>
              <div className="absolute -bottom-8 -right-8 md:-bottom-12 md:-right-12 bg-[var(--color-evergreen)] text-[var(--color-alabaster)] p-8 md:p-12 rounded-lg max-w-sm shadow-2xl hidden sm:block">
                <p className="font-serif text-xl md:text-2xl italic leading-relaxed mb-4 text-[var(--color-gold)]">
                  "Tailoring is not just about measurements; it's about translating a person's character into fabric."
                </p>
                <span className="text-xs tracking-widest uppercase text-white/60">— Elias Thorne, Lead Artisan</span>
              </div>
            </div>
            
            <div className="w-full lg:w-1/2 lg:pl-12 mt-12 lg:mt-0">
              <span className="text-[var(--color-sage)] uppercase tracking-[0.2em] text-xs font-semibold block mb-4">The Hands Behind SewZella</span>
              <h2 className="font-serif text-4xl md:text-5xl text-[var(--color-evergreen)] mb-8">Master Artisans</h2>
              <p className="text-[var(--color-sage)] text-lg leading-relaxed mb-8">
                Our collective consists of second and third-generation tailors who have dedicated their lives to the craft. Each artisan specializes in a specific textile family, ensuring that your linen, silk, or wool is handled with expert knowledge.
              </p>
              
              <div className="flex flex-col gap-6 mb-10">
                <div className="flex gap-4">
                  <CheckCircle className="text-[var(--color-gold)] shrink-0 mt-1" size={20} />
                  <div>
                    <h4 className="text-[var(--color-evergreen)] font-semibold mb-1 text-sm tracking-wider uppercase">Heritage Techniques</h4>
                    <p className="text-[var(--color-sage)] text-sm">We preserve traditional methods like hand-canvassing and pick-stitching.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <CheckCircle className="text-[var(--color-gold)] shrink-0 mt-1" size={20} />
                  <div>
                    <h4 className="text-[var(--color-evergreen)] font-semibold mb-1 text-sm tracking-wider uppercase">Sustainable Makers</h4>
                    <p className="text-[var(--color-sage)] text-sm">Our artisans are committed to zero-waste cutting and natural dyes.</p>
                  </div>
                </div>
              </div>
              
              <a href="https://play.google.com/store" target="_blank" rel="noopener noreferrer" className="bg-[var(--color-evergreen)] text-white px-8 py-3.5 rounded text-sm tracking-widest uppercase font-semibold hover:bg-[var(--color-evergreen-container)] transition-colors inline-block">
                Meet the Collective
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 9. Join/Partner Section */}
      <section className="py-24 bg-[var(--color-evergreen)] text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}></div>
        <div className="max-w-7xl mx-auto px-8 md:px-16 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-[var(--color-evergreen-container)] p-12 md:p-16 rounded-lg border border-white/10 relative overflow-hidden group">
              <Scissors className="absolute -right-8 -bottom-8 w-64 h-64 text-white/[0.03] group-hover:text-white/[0.06] transition-colors duration-500 transform -rotate-12" />
              <h3 className="font-serif text-3xl md:text-4xl mb-4 text-[var(--color-gold)]">Join as an Artisan</h3>
              <p className="text-white/70 mb-10 text-lg max-w-md">Are you a master of the needle? Join our global network of elite tailors and reach a discerning clientele.</p>
              <a href="https://play.google.com/store" target="_blank" rel="noopener noreferrer" className="border border-[var(--color-gold)] text-[var(--color-gold)] px-8 py-3.5 rounded text-sm tracking-widest uppercase font-semibold hover:bg-[var(--color-gold)] hover:text-[var(--color-evergreen)] transition-all">
                Apply Now
              </a>
            </div>
            
            <div className="bg-[var(--color-sage)]/20 p-12 md:p-16 rounded-lg border border-white/10 relative overflow-hidden group">
              <Truck className="absolute -right-8 -bottom-8 w-64 h-64 text-white/[0.03] group-hover:text-white/[0.06] transition-colors duration-500" />
              <h3 className="font-serif text-3xl md:text-4xl mb-4 text-white">Join as a Partner</h3>
              <p className="text-white/70 mb-10 text-lg max-w-md">Become a logistics partner and help us deliver artisanal excellence to customers worldwide with white-glove service.</p>
              <a href="https://play.google.com/store" target="_blank" rel="noopener noreferrer" className="border border-white/30 text-white px-8 py-3.5 rounded text-sm tracking-widest uppercase font-semibold hover:bg-white hover:text-[var(--color-evergreen)] transition-all">
                Partner With Us
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 10. Newsletter CTA */}
      <section className="py-24 bg-[var(--color-stone)] border-b border-[var(--color-evergreen)]/10">
        <div className="max-w-5xl mx-auto px-8 text-center">
          <h2 className="font-serif text-3xl md:text-4xl text-[var(--color-evergreen)] mb-6">Plan Your Next Masterpiece</h2>
          <p className="text-[var(--color-sage)] mb-10 text-lg max-w-2xl mx-auto">Subscribe to receive seasonal textile guides, style inspiration, and exclusive invitations to our traveling tailor events.</p>
          
          <form className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto" onSubmit={(e) => e.preventDefault()}>
            <input 
              type="email" 
              placeholder="Your email address" 
              className="flex-1 bg-white border border-[var(--color-sage)]/30 rounded px-6 py-4 text-[var(--color-evergreen)] placeholder:text-[var(--color-sage)] focus:outline-none focus:border-[var(--color-gold)] transition-colors"
            />
            <button className="bg-[var(--color-evergreen)] text-white px-10 py-4 rounded text-sm tracking-widest uppercase font-semibold hover:bg-[var(--color-gold)] transition-colors">
              Subscribe
            </button>
          </form>
        </div>
      </section>

      {/* 11. Luxury Footer */}
      <footer id="contact" className="bg-[var(--color-evergreen)] text-white pt-24 pb-12">
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
                <li><a href="#" className="text-white/60 hover:text-[var(--color-gold)] transition-colors text-sm">Artisans</a></li>
                <li><a href="#" className="text-white/60 hover:text-[var(--color-gold)] transition-colors text-sm">Materials</a></li>
                <li><a href="#" className="text-white/60 hover:text-[var(--color-gold)] transition-colors text-sm">Sustainability</a></li>
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

export default SewZellaLanding;
