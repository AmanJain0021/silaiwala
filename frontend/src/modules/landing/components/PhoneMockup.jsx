import React, { useEffect, useRef, useState } from 'react';
import { Check, Search, Scissors, Truck, Ruler, Package, ShieldCheck, Bell, Home, Shirt, User } from 'lucide-react';
import { Glyph } from './landingShared';
import { SERIF } from './landingTokens';

/* Illustrative SewZella app screens rendered in HTML/CSS (sharp at any size, no image weight). */

const StatusBar = ({ dark }) => (
  <div className={`flex items-center justify-between px-6 pt-3 text-[10px] font-semibold ${dark ? 'text-white' : 'text-[#1A1523]'}`}>
    <span>9:41</span>
    <span className="flex items-center gap-1">
      <span className="flex items-end gap-[2px]">
        {[4, 6, 8, 10].map((h) => (
          <span key={h} className={`w-[3px] rounded-sm ${dark ? 'bg-white' : 'bg-[#1A1523]'}`} style={{ height: h }} />
        ))}
      </span>
      <span className={`ml-1 h-[9px] w-[18px] rounded-[3px] border ${dark ? 'border-white/80' : 'border-[#1A1523]/70'} p-[1px]`}>
        <span className={`block h-full w-3/4 rounded-[1px] ${dark ? 'bg-white' : 'bg-[#1A1523]'}`} />
      </span>
    </span>
  </div>
);

const HomeScreen = () => (
  <div className="flex h-full flex-col bg-[#FBF8FD]">
    <StatusBar />
    <div className="flex items-center justify-between px-5 pt-4">
      <div>
        <p className="text-[10px] font-medium text-[#6B6575]">Good evening</p>
        <p className="text-[16px] font-semibold text-[#1A1523]" style={{ fontFamily: SERIF }}>
          Hello, <span className="text-[#843D9B]">Aanya</span>
        </p>
      </div>
      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white ring-1 ring-[#EDE5F3]">
        <Bell size={14} className="text-[#843D9B]" />
      </span>
    </div>
    <div className="mx-5 mt-3 flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-[10px] text-[#9A94A3] ring-1 ring-[#EDE5F3]">
      <Search size={12} /> Search styles, tailors, fabrics
    </div>
    <div className="relative mx-5 mt-3 h-[118px] overflow-hidden rounded-2xl bg-[#4A1560]">
      <img src="/landing/opt/womens-wear.jpg" alt="" loading="lazy" className="absolute right-0 top-0 h-full w-[55%] object-cover object-top" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#4A1560] via-[#4A1560]/85 to-transparent" />
      <div className="relative p-3.5">
        <p className="text-[13px] font-semibold leading-tight text-white" style={{ fontFamily: SERIF }}>
          Design your
          <br />
          <em>dream outfit</em>
        </p>
        <span className="mt-2.5 inline-block rounded-full bg-white px-2.5 py-1 text-[8.5px] font-bold text-[#843D9B]">Start stitching</span>
      </div>
    </div>
    <div className="mt-3 grid grid-cols-4 gap-2 px-5">
      {[
        ['Women', '/landing/opt/womens-wear.jpg'],
        ['Men', '/landing/opt/mens-wear.jpg'],
        ['Kids', '/landing/opt/kids-wear.jpg'],
        ['Fabric', '/landing/opt/fabrics.jpg'],
      ].map(([label, src]) => (
        <div key={label} className="flex flex-col items-center gap-1">
          <img src={src} alt="" loading="lazy" className="h-11 w-11 rounded-full object-cover object-top ring-2 ring-white shadow" />
          <span className="text-[8.5px] font-semibold text-[#3A3343]">{label}</span>
        </div>
      ))}
    </div>
    <div className="mx-5 mt-3 rounded-2xl bg-white p-3 ring-1 ring-[#EDE5F3]">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold text-[#1A1523]">Active order</p>
        <span className="rounded-full bg-[#F3E9F8] px-2 py-0.5 text-[8px] font-bold text-[#843D9B]">Stitching</span>
      </div>
      <p className="mt-1 text-[9px] text-[#6B6575]">Bridal lehenga · Est. delivery 14 Dec</p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#F3E9F8]">
        <div className="h-full w-[64%] rounded-full bg-gradient-to-r from-[#843D9B] to-[#B46CCB]" />
      </div>
    </div>
    <div className="mt-auto flex items-center justify-around border-t border-[#EDE5F3] bg-white px-4 pb-5 pt-2.5">
      {[
        ['Home', Home, true],
        ['Styles', Shirt],
        ['Orders', Package],
        ['Profile', User],
      ].map(([label, icon, active]) => (
        <span key={label} className={`flex flex-col items-center gap-0.5 text-[8.5px] font-semibold ${active ? 'text-[#843D9B]' : 'text-[#9A94A3]'}`}>
          <Glyph icon={icon} size={14} strokeWidth={active ? 2.4 : 1.8} />
          {label}
        </span>
      ))}
    </div>
  </div>
);

const TRACK_STEPS = [
  { label: 'Order confirmed', icon: Check, done: true },
  { label: 'Measurements taken', icon: Ruler, done: true },
  { label: 'Fabric picked up', icon: Package, done: true },
  { label: 'Stitching in progress', icon: Scissors, active: true },
  { label: 'Out for delivery', icon: Truck },
];

const TrackingScreen = () => (
  <div className="flex h-full flex-col bg-white">
    <div className="bg-gradient-to-b from-[#4A1560] to-[#843D9B] pb-5">
      <StatusBar dark />
      <div className="px-5 pt-4 text-white">
        <p className="text-[9px] uppercase tracking-[0.16em] text-white/60">Order SZ-2481</p>
        <p className="mt-0.5 text-[15px] font-semibold" style={{ fontFamily: SERIF }}>Bridal Lehenga</p>
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-white/10 p-2 ring-1 ring-white/15">
          <img src="/landing/opt/tailor-partner.jpg" alt="" loading="lazy" className="h-7 w-7 rounded-full object-cover" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[10px] font-semibold">Your tailor</p>
            <p className="flex items-center gap-1 whitespace-nowrap text-[8.5px] text-white/70">
              <ShieldCheck size={9} /> Verified professional
            </p>
          </div>
          <span className="rounded-full bg-white px-2 py-0.5 text-[8px] font-bold text-[#843D9B]">64%</span>
        </div>
      </div>
    </div>
    <div className="-mt-3 flex-1 rounded-t-3xl bg-white px-5 pt-5">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#9A94A3]">Live progress</p>
      <ol className="relative mt-3 space-y-3.5">
        <span className="absolute left-[11px] top-2 bottom-2 w-px bg-[#EDE5F3]" />
        {TRACK_STEPS.map(({ label, icon, done, active }) => (
          <li key={label} className="relative flex items-center gap-3">
            <span
              className={`relative z-10 flex h-[23px] w-[23px] items-center justify-center rounded-full ${
                done ? 'bg-[#843D9B] text-white' : active ? 'bg-white text-[#843D9B] ring-2 ring-[#843D9B]' : 'bg-[#F3EFF6] text-[#B5ADBF]'
              }`}
            >
              <Glyph icon={icon} size={11} strokeWidth={2.4} />
              {active && <span className="absolute inset-0 animate-ping rounded-full ring-2 ring-[#843D9B]/40" />}
            </span>
            <span className={`text-[10.5px] ${done || active ? 'font-semibold text-[#1A1523]' : 'text-[#9A94A3]'}`}>{label}</span>
          </li>
        ))}
      </ol>
      <div className="mt-4 overflow-hidden rounded-2xl ring-1 ring-[#EDE5F3]">
        <img src="/landing/opt/artisan.jpg" alt="" loading="lazy" className="h-[70px] w-full object-cover" />
        <p className="px-3 py-2 text-[9px] text-[#6B6575]">New photo from your tailor · 2h ago</p>
      </div>
    </div>
  </div>
);

/**
 * Realistic phone frame. `screen`: 'home' | 'tracking'. Width scales with `className`.
 */
// Screens are laid out at a fixed "device" size and scaled to whatever width the frame
// gets, so the mockup looks identical on phones, tablets and desktops.
const SCREEN_W = 270;
const SCREEN_H = 570;

const PhoneMockup = ({ screen = 'home', className = '' }) => {
  const screenRef = useRef(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const el = screenRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver(([entry]) => setScale(entry.contentRect.width / SCREEN_W));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div className={`relative rounded-[42px] bg-[#16121C] p-[9px] shadow-[0_40px_80px_-30px_rgba(42,15,56,0.6),inset_0_0_0_1.5px_rgba(255,255,255,0.08)] ${className}`}>
      <div
        ref={screenRef}
        className="relative w-full overflow-hidden rounded-[34px]"
        style={{ aspectRatio: `${SCREEN_W} / ${SCREEN_H}` }}
      >
        <div
          className="absolute left-0 top-0 origin-top-left"
          style={{ width: SCREEN_W, height: SCREEN_H, transform: `scale(${scale})` }}
          aria-hidden="true"
        >
          {screen === 'tracking' ? <TrackingScreen /> : <HomeScreen />}
          <span className="absolute left-1/2 top-2 h-[18px] w-[70px] -translate-x-1/2 rounded-full bg-[#16121C]" />
          <span className="absolute bottom-1.5 left-1/2 h-[3px] w-[90px] -translate-x-1/2 rounded-full bg-[#1A1523]/30" />
        </div>
      </div>
      <span className="absolute -left-[2px] top-[22%] h-10 w-[3px] rounded-l bg-[#2A2433]" />
      <span className="absolute -right-[2px] top-[28%] h-14 w-[3px] rounded-r bg-[#2A2433]" />
    </div>
  );
};

export default PhoneMockup;
