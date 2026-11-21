import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowUpRight, LayoutGrid } from 'lucide-react';
import api from '../../../utils/api';
import { SOCKET_URL } from '../../../config/constants';
import { Reveal, SectionHeading } from '../components/landingShared';
import { SERIF, fadeUp, optimizedImg } from '../components/landingTokens';

/* Shown when the CMS list can't be loaded. Admin → CMS → Landing Categories overrides it. */
const DEFAULT_CATEGORIES = [
  { title: "Women's Wear", desc: 'Lehengas, suits, blouses & kurtis', img: '/landing/category_womens_wear.png', link: '/user/services' },
  { title: "Men's Wear", desc: 'Bandhgalas, kurtas, shirts & suits', img: '/landing/category_mens_wear.png', link: '/user/services' },
  { title: 'Kids Wear', desc: 'Festive outfits for little ones', img: '/landing/category_kids_wear.png', link: '/user/services' },
  { title: 'Fabrics', desc: 'Premium fabrics, delivered to your tailor', img: '/landing/opt/fabrics.jpg', link: '/user/store' },
];

const resolveCatImg = (img) => {
  if (!img) return '';
  if (img.startsWith('http') || img.startsWith('data:') || img.startsWith('/landing/')) return optimizedImg(img);
  const separator = img.startsWith('/') ? '' : '/';
  return `${SOCKET_URL}${separator}${img}`;
};

const CategoryCard = ({ cat, index, onOpen, tall }) => (
  <motion.button
    type="button"
    // Data arrives after the section reveal, so each card animates itself in
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: '-40px' }}
    variants={fadeUp}
    custom={index}
    onClick={onOpen}
    className={`group relative block w-full overflow-hidden rounded-[26px] bg-[#EFE6F3] text-left shadow-[0_20px_50px_-30px_rgba(42,15,56,0.5)] ring-1 ring-[#EDE5F3] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#843D9B] ${
      tall ? 'aspect-[3/4]' : 'aspect-[4/5]'
    }`}
  >
    <img
      src={resolveCatImg(cat.img)}
      alt={cat.title}
      loading="lazy"
      decoding="async"
      className="absolute inset-0 h-full w-full object-cover object-top transition-transform duration-[1.2s] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]"
      onError={(e) => {
        const fallback = DEFAULT_CATEGORIES[index % DEFAULT_CATEGORIES.length].img;
        if (!e.currentTarget.dataset.fallback) {
          e.currentTarget.dataset.fallback = '1';
          e.currentTarget.src = optimizedImg(fallback);
        }
      }}
    />
    <div className="absolute inset-0 bg-gradient-to-t from-[#1F0B2B]/75 via-[#1F0B2B]/5 to-transparent opacity-80 transition-opacity duration-500 group-hover:opacity-100" />

    <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-[17px] font-semibold leading-tight text-white sm:text-[22px]" style={{ fontFamily: SERIF }}>
            {cat.title}
          </h3>
          {cat.desc && (
            <p className="mt-1 max-h-0 overflow-hidden text-[12.5px] leading-snug text-white/80 opacity-0 transition-all duration-500 group-hover:max-h-12 group-hover:opacity-100 group-focus-visible:max-h-12 group-focus-visible:opacity-100">
              {cat.desc}
            </p>
          )}
        </div>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/90 text-[#843D9B] backdrop-blur sm:h-10 sm:w-10 transition-all duration-300 group-hover:rotate-45 group-hover:bg-white">
          <ArrowUpRight size={18} />
        </span>
      </div>
    </div>
  </motion.button>
);

const Categories = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);

  useEffect(() => {
    let alive = true;
    api
      .get('/cms/landing-categories')
      .then((res) => {
        if (alive && res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          setCategories(res.data.data);
        }
      })
      .catch(() => {
        /* keep defaults */
      });
    return () => {
      alive = false;
    };
  }, []);

  const count = categories.length;
  // 4 → one row of 4; 3/6/9 → rows of 3; otherwise rows of 4
  const cols = count % 3 === 0 && count !== 12 ? 'lg:grid-cols-3' : 'lg:grid-cols-4';

  return (
    <section id="categories" className="relative scroll-mt-24 bg-[#FBF8FD] py-20 md:py-28">
      <div className="mx-auto max-w-[1240px] px-5 md:px-8">
        <Reveal className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            align="left"
            eyebrow="Explore categories"
            icon={LayoutGrid}
            title="Find your"
            accent="perfect style"
            lede="From timeless traditional wear to modern silhouettes, tailored for every occasion."
          />
          <motion.div variants={fadeUp} custom={1} className="shrink-0">
            <Link
              to="/user/services"
              className="group inline-flex items-center gap-2 rounded-full bg-[#843D9B] px-6 py-3 text-[14px] font-semibold text-white shadow-[0_14px_30px_-12px_rgba(132,61,155,0.8)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#74338a]"
            >
              Explore all
              <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </motion.div>
        </Reveal>

        <Reveal className={`mt-12 grid grid-cols-2 gap-3 sm:gap-5 ${cols}`}>
          {categories.map((cat, i) => (
            <CategoryCard
              key={cat._id || cat.title || i}
              cat={cat}
              index={i}
              tall={count === 4}
              onOpen={() => navigate(cat.link || '/user/services')}
            />
          ))}
        </Reveal>
      </div>
    </section>
  );
};

export default Categories;
