import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Star, Quote, MessageSquareHeart } from 'lucide-react';
import api from '../../../utils/api';
import { Reveal, SectionHeading } from '../components/landingShared';
import { SERIF, fadeUp } from '../components/landingTokens';

const initials = (name = '') =>
  name
    .replace('.', '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');

/**
 * Real customer reviews (GET /cms/testimonials). The section renders nothing until there
 * are genuine reviews to show — no invented names or quotes.
 */
const Testimonials = () => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    let alive = true;
    api
      .get('/cms/testimonials')
      .then((res) => {
        if (alive && res.data?.success && Array.isArray(res.data.data)) setItems(res.data.data.slice(0, 6));
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  if (items.length === 0) return null;

  return (
    <section aria-label="Customer reviews" className="relative bg-white py-20 md:py-28">
      <div className="mx-auto max-w-[1240px] px-5 md:px-8">
        <Reveal>
          <SectionHeading
            eyebrow="Customer love"
            icon={MessageSquareHeart}
            title="Loved by people who"
            accent="love a perfect fit"
            lede="Straight from customers who got their outfits made on SewZella."
          />
        </Reveal>

        <Reveal className="-mx-5 mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 lg:grid-cols-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {items.map((t, i) => (
            <motion.figure
              key={t.id || i}
              // Data arrives after the section reveal, so each card animates itself in
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: '-40px' }}
              variants={fadeUp}
              custom={i}
              className="relative flex w-[85%] shrink-0 snap-center flex-col rounded-[26px] bg-[#FBF8FD] p-7 ring-1 ring-[#EDE5F3] transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-[0_30px_60px_-34px_rgba(74,21,96,0.5)] md:w-auto"
            >
              <Quote size={34} className="absolute right-6 top-6 text-[#E7D6F0]" />
              <div className="flex gap-0.5" aria-label={`${t.rating} out of 5 stars`}>
                {[0, 1, 2, 3, 4].map((s) => (
                  <Star key={s} size={15} className={s < Math.round(t.rating) ? 'fill-[#F5A524] text-[#F5A524]' : 'text-[#E3DCE8]'} />
                ))}
              </div>
              <blockquote className="mt-4 flex-1 text-[17px] leading-relaxed text-[#2A2433]" style={{ fontFamily: SERIF }}>
                &ldquo;{t.comment}&rdquo;
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3 border-t border-[#EDE5F3] pt-5">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#843D9B] to-[#B46CCB] text-[13px] font-bold text-white">
                  {initials(t.name)}
                </span>
                <span>
                  <span className="block text-[14px] font-bold text-[#1A1523]">{t.name}</span>
                  <span className="block text-[12px] text-[#6B6575]">{t.context}</span>
                </span>
              </figcaption>
            </motion.figure>
          ))}
        </Reveal>
      </div>
    </section>
  );
};

export default Testimonials;
