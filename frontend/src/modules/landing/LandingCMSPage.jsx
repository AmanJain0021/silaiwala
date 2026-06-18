import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../utils/api';
import LandingNavbar from './components/LandingNavbar';
import LandingFooter from './components/LandingFooter';

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
    <div
      className="min-h-screen bg-[#fcf9f8] text-[#1c1b1b] flex flex-col overflow-x-hidden"
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      <LandingNavbar />

      {/* Main Content Area */}
      <main className="flex-grow pt-28 pb-20 px-5 md:px-16 max-w-4xl mx-auto w-full">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-10 h-10 border-4 border-[#e9def5] border-t-[#4a0581] rounded-full animate-spin"></div>
          </div>
        ) : !content ? (
          <div className="text-center py-20">
            <h2 className="text-4xl font-bold text-[#1c1b1b] mb-6" style={{ fontFamily: "'Libre Caslon Text', serif" }}>
              Page Not Found
            </h2>
            <p className="text-[#7d7483] mb-8">The page you are looking for does not exist or has been removed.</p>
            <Link
              to="/"
              className="bg-[#4a0581] text-white px-8 py-3.5 rounded-full text-[14px] font-semibold hover:bg-[#622999] transition-colors inline-block"
            >
              Return Home
            </Link>
          </div>
        ) : (
          <article className="bg-white p-8 md:p-12 rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-[#eae7e7]">
            <div className="mb-10 pb-6 border-b border-[#f0eded]">
              <span className="text-[#7d7483] uppercase tracking-[0.15em] text-[12px] font-semibold block mb-4">Official Document</span>
              <h1 className="text-3xl md:text-4xl font-bold text-[#1c1b1b]" style={{ fontFamily: "'Libre Caslon Text', serif" }}>
                {content.title}
              </h1>
              <p className="text-[#7d7483] text-[13px] tracking-wide mt-4 font-medium">
                LAST UPDATED: {new Date(content.updatedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).toUpperCase()}
              </p>
            </div>
            
            <div 
              className="prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-[#1c1b1b] prose-p:text-[#4c4451] prose-a:text-[#4a0581] prose-a:no-underline hover:prose-a:underline prose-li:text-[#4c4451] cms-landing-content"
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
              dangerouslySetInnerHTML={{ __html: content.content }}
            />
          </article>
        )}
      </main>

      <LandingFooter />

      <style dangerouslySetInnerHTML={{
        __html: `
        .cms-landing-content h1, .cms-landing-content h2, .cms-landing-content h3 {
          margin-top: 2rem;
          margin-bottom: 1rem;
          font-family: 'Libre Caslon Text', serif;
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
