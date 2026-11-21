import React, { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion, useInView } from 'framer-motion';
import { Shirt, Ruler, Scissors, Radar, PackageCheck, Workflow } from 'lucide-react';
import { Reveal, SectionHeading, Glyph } from '../components/landingShared';
import { SERIF, EASE, fadeUp } from '../components/landingTokens';

const STEPS = [
  {
    icon: Shirt,
    title: 'Choose Your Style',
    desc: "Browse women's, men's and kids' styles, then pick your fabric, add-ons and design references.",
  },
  {
    icon: Ruler,
    title: 'Share Measurements',
    desc: "Enter them yourself, upload a tailor's slip, use a saved profile, or book a measurement expert at home.",
  },
  {
    icon: Scissors,
    title: 'Tailor Starts Stitching',
    desc: 'A verified tailor accepts your order and begins crafting as soon as your fabric arrives.',
  },
  {
    icon: Radar,
    title: 'Track Progress',
    desc: 'Follow every stage live, from fabric pickup to the final finish, with updates on your phone.',
  },
  {
    icon: PackageCheck,
    title: 'Get It Delivered',
    desc: 'Quality checked and delivered to your door. Pay the balance online or on delivery.',
  },
];

const HowItWorks = () => {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const sectionRef = useRef(null);
  const inView = useInView(sectionRef, { margin: '-120px' });

  // Auto-advance through the journey while visible (pauses on hover / reduced motion)
  useEffect(() => {
    if (reduce || paused || !inView) return undefined;
    const t = setInterval(() => setActive((a) => (a + 1) % STEPS.length), 3200);
    return () => clearInterval(t);
  }, [reduce, paused, inView]);

  const progress = (active / (STEPS.length - 1)) * 100;

  return (
    <section id="how-it-works" ref={sectionRef} className="relative scroll-mt-24 bg-white py-20 md:py-28">
      <div className="mx-auto max-w-[1240px] px-5 md:px-8">
        <Reveal>
          <SectionHeading
            eyebrow="Simple steps"
            icon={Workflow}
            title="How SewZella"
            accent="works"
            lede="From choosing a style to wearing it, your outfit is just five easy steps away."
          />
        </Reveal>

        {/* Desktop: connected horizontal journey */}
        <Reveal
          className="relative mt-16 hidden lg:block"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="absolute left-[10%] right-[10%] top-[30px] h-[2px] rounded-full bg-[#EDE5F3]">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-[#843D9B] to-[#C07AD8]"
              animate={{ width: `${progress}%` }}
              transition={{ duration: reduce ? 0 : 0.7, ease: EASE }}
            />
          </div>
          <ol className="relative grid grid-cols-5 gap-5">
            {STEPS.map(({ icon, title, desc }, i) => {
              const isActive = i === active;
              const isDone = i < active;
              return (
                <motion.li key={title} variants={fadeUp} custom={i}>
                  <button
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onFocus={() => setActive(i)}
                    onClick={() => setActive(i)}
                    aria-current={isActive ? 'step' : undefined}
                    className="group flex w-full flex-col items-center text-center focus:outline-none"
                  >
                    <span
                      className={`relative flex h-[62px] w-[62px] items-center justify-center rounded-full transition-all duration-500 ${
                        isActive
                          ? 'bg-[#843D9B] text-white shadow-[0_14px_30px_-10px_rgba(132,61,155,0.8)] scale-110'
                          : isDone
                            ? 'bg-[#F3E9F8] text-[#843D9B] ring-1 ring-[#E1CCEB]'
                            : 'bg-white text-[#9A8AA6] ring-1 ring-[#EDE5F3]'
                      }`}
                    >
                      <Glyph icon={icon} size={24} strokeWidth={1.7} />
                      <span
                        className={`absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ring-2 ring-white ${
                          isActive ? 'bg-[#1A1523] text-white' : 'bg-[#F3E9F8] text-[#843D9B]'
                        }`}
                      >
                        {String(i + 1).padStart(2, '0')}
                      </span>
                    </span>
                    <div
                      className={`mt-6 w-full rounded-[22px] p-5 transition-all duration-500 ${
                        isActive
                          ? 'bg-white shadow-[0_24px_50px_-28px_rgba(74,21,96,0.45)] ring-1 ring-[#E7D6F0]'
                          : 'ring-1 ring-transparent group-hover:bg-[#FBF8FD]'
                      }`}
                    >
                      <h3 className="text-[17px] font-semibold text-[#1A1523]" style={{ fontFamily: SERIF }}>
                        {title}
                      </h3>
                      <p className="mt-2 text-[13px] leading-relaxed text-[#6B6575]">{desc}</p>
                    </div>
                  </button>
                </motion.li>
              );
            })}
          </ol>
        </Reveal>

        {/* Mobile / tablet: vertical timeline */}
        <Reveal className="relative mx-auto mt-12 max-w-xl lg:hidden">
          <motion.span
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 1.6, ease: EASE }}
            className="absolute left-[27px] top-4 bottom-4 w-[2px] origin-top rounded-full bg-gradient-to-b from-[#843D9B] via-[#D7B9E4] to-[#EDE5F3]"
          />
          <ol className="space-y-4">
            {STEPS.map(({ icon, title, desc }, i) => (
              <motion.li key={title} variants={fadeUp} custom={i} className="relative flex gap-4">
                <span className="relative z-10 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white text-[#843D9B] shadow-[0_10px_24px_-12px_rgba(74,21,96,0.5)] ring-1 ring-[#EDE5F3]">
                  <Glyph icon={icon} size={22} strokeWidth={1.7} />
                  <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#843D9B] text-[9px] font-bold text-white ring-2 ring-white">
                    {i + 1}
                  </span>
                </span>
                <div className="min-w-0 flex-1 rounded-[20px] bg-[#FBF8FD] p-4 ring-1 ring-[#EDE5F3]">
                  <h3 className="text-[17px] font-semibold text-[#1A1523]" style={{ fontFamily: SERIF }}>{title}</h3>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-[#6B6575]">{desc}</p>
                </div>
              </motion.li>
            ))}
          </ol>
        </Reveal>
      </div>
    </section>
  );
};

export default HowItWorks;
