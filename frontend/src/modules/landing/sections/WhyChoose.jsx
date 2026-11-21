import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Award, Clock3, Cpu, BadgeCheck, ArrowRight, Heart } from 'lucide-react';
import { Reveal, SectionHeading, Glyph } from '../components/landingShared';
import { SERIF, fadeUp, EASE } from '../components/landingTokens';

const PILLARS = [
  {
    icon: Award,
    title: 'Master craftsmanship',
    desc: 'Experienced tailors who handle every detail, from fine embroidery to the final hem.',
  },
  {
    icon: Clock3,
    title: 'Effortless convenience',
    desc: 'Order from your phone. Fabric pickup, home measurement visits and delivery are arranged for you.',
  },
  {
    icon: Cpu,
    title: 'Thoughtful technology',
    desc: 'Live tracking, instant updates and secure online payments. AI-assisted measurement is on the way.',
  },
  {
    icon: BadgeCheck,
    title: 'Trusted professionals',
    desc: 'Every tailor is verified by our team, and each pickup and handover is confirmed with an OTP.',
  },
];

const WhyChoose = ({ appName }) => (
  <section id="about" className="relative scroll-mt-24 overflow-hidden bg-white py-20 md:py-28">
    <div className="mx-auto grid max-w-[1240px] grid-cols-1 items-center gap-14 px-5 md:px-8 lg:grid-cols-2 lg:gap-20">
      {/* Image collage */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: '-80px' }}
        transition={{ duration: 0.9, ease: EASE }}
        className="relative mx-auto w-full max-w-[540px] pb-16 pr-10 sm:pr-16"
      >
        <div className="overflow-hidden rounded-[32px] shadow-[0_40px_80px_-40px_rgba(42,15,56,0.6)]">
          <img
            src="/landing/opt/artisan.jpg"
            alt="A tailor hand-stitching a tailored garment in his workshop"
            loading="lazy"
            className="aspect-[4/5] w-full object-cover transition-transform duration-[1.4s] hover:scale-[1.04]"
          />
        </div>
        <div className="absolute bottom-0 right-0 w-[58%] overflow-hidden rounded-[24px] bg-white p-2 shadow-[0_30px_60px_-30px_rgba(42,15,56,0.55)] ring-1 ring-[#EDE5F3]">
          <img
            src="/landing/opt/measurement.jpg"
            alt="Dress form with a measuring tape and a measurement chart"
            loading="lazy"
            className="aspect-[3/2] w-full rounded-[18px] object-cover"
          />
          <p className="px-2 pb-1 pt-2.5 text-[12px] font-semibold text-[#1A1523]">
            Precise measurements, every time
          </p>
        </div>
        <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full bg-white/90 px-3.5 py-2 text-[12px] font-semibold text-[#1A1523] shadow-lg backdrop-blur">
          <Heart size={14} className="fill-[#843D9B] text-[#843D9B]" />
          Handcrafted with care
        </div>
      </motion.div>

      {/* Copy */}
      <Reveal>
        <SectionHeading
          align="left"
          eyebrow={`Why ${appName}`}
          title="Craftsmanship you can trust,"
          accent="convenience you'll love."
          lede="We bring the neighbourhood tailor's personal touch together with the ease of a modern app, so getting clothes made feels effortless."
        />
        <ul className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {PILLARS.map(({ icon, title, desc }, i) => (
            <motion.li
              key={title}
              variants={fadeUp}
              custom={i + 1}
              className="group rounded-[22px] bg-[#FBF8FD] p-5 ring-1 ring-[#EDE5F3] transition-all duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-[0_24px_50px_-30px_rgba(74,21,96,0.5)]"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#843D9B] text-white shadow-[0_10px_20px_-10px_rgba(132,61,155,0.9)]">
                <Glyph icon={icon} size={20} strokeWidth={1.8} />
              </span>
              <h3 className="mt-4 text-[17px] font-semibold text-[#1A1523]" style={{ fontFamily: SERIF }}>{title}</h3>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#6B6575]">{desc}</p>
            </motion.li>
          ))}
        </ul>
        <motion.div variants={fadeUp} custom={5} className="mt-9">
          <Link
            to="/user/services"
            className="group inline-flex items-center gap-2 rounded-full bg-[#1A1523] px-6 py-3.5 text-[14px] font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#843D9B]"
          >
            Start your order
            <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </motion.div>
      </Reveal>
    </div>
  </section>
);

export default WhyChoose;
