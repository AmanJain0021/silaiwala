import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Instagram, Facebook, Twitter } from 'lucide-react';
import api from '../../utils/api';

const LandingCMSPage = () => {
  const { slug } = useParams();
  const [content, setContent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Scroll to top when loaded
    window.scrollTo(0, 0);
    
    const fetchContent = async () => {
      setIsLoading(true);
      try {
        const res = await api.get(`/cms/content/${slug}`);
        if (res.data.success) {
          setContent(res.data.data);
        } else {
          setContent(null);
        }
      } catch (error) {
        console.error('Error fetching CMS content:', error);
        setContent(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchContent();
  }, [slug]);

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
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-[var(--color-sage)]/30 border-t-[var(--color-evergreen)] rounded-full animate-spin"></div>
          </div>
        ) : !content ? (
          <div className="text-center py-20">
            <h2 className="font-serif text-4xl text-[var(--color-evergreen)] mb-6">Page Not Found</h2>
            <p className="text-[var(--color-sage)] mb-8">The page you are looking for does not exist or has been removed.</p>
            <Link to="/" className="bg-[var(--color-evergreen)] text-white px-8 py-3.5 rounded text-sm tracking-widest uppercase font-semibold hover:bg-[var(--color-gold)] transition-colors inline-block">
              Return Home
            </Link>
          </div>
        ) : (
          <article className="bg-white p-8 md:p-12 rounded-lg shadow-sm border border-[var(--color-stone)]">
            <div className="mb-10 pb-6 border-b border-[var(--color-stone)]">
              <span className="text-[var(--color-sage)] uppercase tracking-[0.2em] text-xs font-semibold block mb-4">Official Document</span>
              <h1 className="font-serif text-4xl md:text-5xl text-[var(--color-evergreen)]">{content.title}</h1>
              <p className="text-[var(--color-sage)] text-sm tracking-widest mt-6 font-medium">
                LAST UPDATED: {new Date(content.updatedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()}
              </p>
            </div>
            
            <div 
              className="prose prose-lg max-w-none prose-headings:font-serif prose-headings:text-[var(--color-evergreen)] prose-p:text-[var(--color-sage)] prose-a:text-[var(--color-gold)] prose-a:no-underline hover:prose-a:underline prose-li:text-[var(--color-sage)] cms-landing-content"
              dangerouslySetInnerHTML={{ __html: content.content }}
            />
          </article>
        )}
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

      <style dangerouslySetInnerHTML={{
        __html: `
        .cms-landing-content h1, .cms-landing-content h2, .cms-landing-content h3 {
          margin-top: 2rem;
          margin-bottom: 1rem;
        }
        .cms-landing-content p {
          margin-bottom: 1.5rem;
          line-height: 1.8;
        }
        .cms-landing-content ul {
          list-style-type: disc;
          padding-left: 1.5rem;
          margin-bottom: 1.5rem;
        }
        .cms-landing-content li {
          margin-bottom: 0.5rem;
        }
      `}} />
    </div>
  );
};

export default LandingCMSPage;
