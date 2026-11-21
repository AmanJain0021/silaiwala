import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { SERIF } from '../components/landingTokens';

const WORDS = [
  'Bridal Lehengas',
  'Sherwanis & Bandhgalas',
  'Designer Blouses',
  'Salwar Suits',
  'Kurtas',
  'Festive Kidswear',
  'Alterations',
  'Bulk Stitching',
];

const Row = () => (
  <div className="flex shrink-0 items-center">
    {WORDS.map((w) => (
      <span key={w} className="flex items-center">
        <span className="whitespace-nowrap px-6 text-[22px] italic text-white/90 sm:px-8 sm:text-[28px]" style={{ fontFamily: SERIF }}>
          {w}
        </span>
        <span aria-hidden="true" className="text-[16px] text-[#E2C4EE]">✦</span>
      </span>
    ))}
  </div>
);

/** Endless ribbon of what we stitch — a little movement between sections. */
const Marquee = () => {
  const reduce = useReducedMotion();
  return (
    <section aria-label="What we stitch" className="relative mt-14 overflow-hidden bg-[#2A0F38] py-5 sm:mt-20 sm:py-6">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,#6B2A87_0%,transparent_70%)] opacity-70" />
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-[#2A0F38] to-transparent sm:w-32" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-[#2A0F38] to-transparent sm:w-32" />
      <motion.div
        className="relative flex w-max"
        animate={reduce ? undefined : { x: ['0%', '-50%'] }}
        transition={{ duration: 38, repeat: Infinity, ease: 'linear' }}
      >
        <Row />
        <div aria-hidden="true" className="flex">
          <Row />
        </div>
      </motion.div>
    </section>
  );
};

export default Marquee;
