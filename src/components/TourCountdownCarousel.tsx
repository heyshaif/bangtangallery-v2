/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
    filter: 'blur(4px)',
    scale: 0.98
  }),
  center: {
    x: 0,
    opacity: 1,
    filter: 'blur(0px)',
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1]
    }
  },
  exit: (direction: number) => ({
    x: direction < 0 ? 80 : -80,
    opacity: 0,
    filter: 'blur(4px)',
    scale: 0.98,
    transition: {
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1]
    }
  })
};
import { 
  Calendar, 
  MapPin, 
  ChevronLeft, 
  ChevronRight, 
  Compass, 
  Sparkles, 
  Activity, 
  Music,
  Clock,
  Ticket
} from 'lucide-react';

interface ConcertSchedule {
  id: string;
  region: 'EUROPE' | 'NORTH AMERICA' | 'ASIA & AUSTRALIA';
  dateStr: string;
  targetDate: string; // ISO or parseable format for countdown
  city: string;
  country: string;
  venue: string;
  imageUrl: string;
}

const CONCERT_DATES: ConcertSchedule[] = [
  // EUROPE
  {
    id: 'madrid-1',
    region: 'EUROPE',
    dateStr: 'June 26 & 27, 2026',
    targetDate: '2026-06-26T19:30:00',
    city: 'Madrid',
    country: 'Spain',
    venue: 'Riyadh Air Metropolitano',
    imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'brussels-1',
    region: 'EUROPE',
    dateStr: 'July 1 & 2, 2026',
    targetDate: '2026-07-01T19:30:00',
    city: 'Brussels',
    country: 'Belgium',
    venue: 'King Baudouin Stadium',
    imageUrl: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'london-1',
    region: 'EUROPE',
    dateStr: 'July 6 & 7, 2026',
    targetDate: '2026-07-06T19:30:00',
    city: 'London',
    country: 'United Kingdom',
    venue: 'Tottenham Hotspur Stadium',
    imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'munich-1',
    region: 'EUROPE',
    dateStr: 'July 11 & 12, 2026',
    targetDate: '2026-07-11T19:30:00',
    city: 'Munich',
    country: 'Germany',
    venue: 'Allianz Arena',
    imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'paris-1',
    region: 'EUROPE',
    dateStr: 'July 17 & 18, 2026',
    targetDate: '2026-07-17T19:30:00',
    city: 'Paris',
    country: 'France',
    venue: 'Stade de France',
    imageUrl: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=800&q=80'
  },

  // NORTH AMERICA
  {
    id: 'nj-1',
    region: 'NORTH AMERICA',
    dateStr: 'August 1 & 2, 2026',
    targetDate: '2026-08-01T20:00:00',
    city: 'East Rutherford, NJ',
    country: 'USA',
    venue: 'MetLife Stadium',
    imageUrl: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'foxborough-1',
    region: 'NORTH AMERICA',
    dateStr: 'August 5 & 6, 2026',
    targetDate: '2026-08-05T20:00:00',
    city: 'Foxborough, MA',
    country: 'USA',
    venue: 'Gillette Stadium',
    imageUrl: 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'baltimore-1',
    region: 'NORTH AMERICA',
    dateStr: 'August 10 & 11, 2026',
    targetDate: '2026-08-10T20:00:00',
    city: 'Baltimore, MD',
    country: 'USA',
    venue: 'M&T Bank Stadium',
    imageUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'arlington-1',
    region: 'NORTH AMERICA',
    dateStr: 'August 15 & 16, 2026',
    targetDate: '2026-08-15T20:00:00',
    city: 'Arlington, TX',
    country: 'USA',
    venue: 'AT&T Stadium',
    imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'toronto-1',
    region: 'NORTH AMERICA',
    dateStr: 'August 22 & 23, 2026',
    targetDate: '2026-08-22T20:00:00',
    city: 'Toronto',
    country: 'Canada',
    venue: 'Rogers Stadium',
    imageUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'chicago-1',
    region: 'NORTH AMERICA',
    dateStr: 'August 27 & 28, 2026',
    targetDate: '2026-08-27T20:00:00',
    city: 'Chicago, IL',
    country: 'USA',
    venue: 'Soldier Field',
    imageUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80'
  },

  // ASIA & AUSTRALIA
  {
    id: 'kaohsiung-1',
    region: 'ASIA & AUSTRALIA',
    dateStr: 'Nov 19, 21 & 22, 2026',
    targetDate: '2026-11-19T19:00:00',
    city: 'Kaohsiung',
    country: 'Taiwan',
    venue: 'Kaohsiung National Stadium',
    imageUrl: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'bangkok-1',
    region: 'ASIA & AUSTRALIA',
    dateStr: 'Dec 3, 5 & 6, 2026',
    targetDate: '2026-12-03T19:00:00',
    city: 'Bangkok',
    country: 'Thailand',
    venue: 'Rajamangala National Stadium',
    imageUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'kl-1',
    region: 'ASIA & AUSTRALIA',
    dateStr: 'Dec 12 & 13, 2026',
    targetDate: '2026-12-12T19:00:00',
    city: 'Kuala Lumpur',
    country: 'Malaysia',
    venue: 'TM Stadium Nasional',
    imageUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'singapore-1',
    region: 'ASIA & AUSTRALIA',
    dateStr: 'Dec 17, 19, 20 & 22, 2026',
    targetDate: '2026-12-17T19:00:00',
    city: 'Singapore',
    country: 'Singapore',
    venue: 'National Stadium',
    imageUrl: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'jakarta-1',
    region: 'ASIA & AUSTRALIA',
    dateStr: 'Dec 26 & 27, 2026',
    targetDate: '2026-12-26T19:00:00',
    city: 'Jakarta',
    country: 'Indonesia',
    venue: 'Gelora Bung Karno Main Stadium',
    imageUrl: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'melbourne-1',
    region: 'ASIA & AUSTRALIA',
    dateStr: 'Feb 10, 12 & 13, 2027',
    targetDate: '2027-02-10T19:00:00',
    city: 'Melbourne',
    country: 'Australia',
    venue: 'Marvel Stadium',
    imageUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'sydney-1',
    region: 'ASIA & AUSTRALIA',
    dateStr: 'Feb 20 & 21, 2027',
    targetDate: '2027-02-20T19:00:00',
    city: 'Sydney',
    country: 'Australia',
    venue: 'Accor Stadium',
    imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'hk-1',
    region: 'ASIA & AUSTRALIA',
    dateStr: 'March 4, 6 & 7, 2027',
    targetDate: '2027-03-04T19:00:00',
    city: 'Hong Kong',
    country: 'Hong Kong',
    venue: 'Kai Tak Stadium',
    imageUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=800&q=80'
  },
  {
    id: 'bulacan-1',
    region: 'ASIA & AUSTRALIA',
    dateStr: 'March 13 & 14, 2027',
    targetDate: '2027-03-13T19:00:00',
    city: 'Bulacan',
    country: 'Philippines',
    venue: 'Philippine Sports Stadium',
    imageUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80'
  }
];

interface TourCountdownCarouselProps {
  config?: {
    title?: string;
    subtitle?: string;
    buttonText?: string;
    buttonLink?: string;
    events?: Array<{
      id: string;
      region: string;
      dateStr: string;
      targetDate: string;
      city: string;
      country: string;
      venue: string;
      imageUrl: string;
    }>;
  };
}

export default function TourCountdownCarousel({ config }: TourCountdownCarouselProps = {}) {
  const [selectedRegion, setSelectedRegion] = useState<'ALL' | 'EUROPE' | 'NORTH AMERICA' | 'ASIA & AUSTRALIA'>('ALL');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState(1);
  const [timeLeft, setTimeLeft] = useState<{ d: number; h: number; m: number; s: number }>({ d: 0, h: 0, m: 0, s: 0 });
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  const activeEvents = config?.events && config.events.length > 0 ? config.events : CONCERT_DATES;

  // Filter list by selected region
  const filteredSchedules = activeEvents.filter(item => 
    selectedRegion === 'ALL' ? true : item.region === selectedRegion
  );

  // Safeguard index constraints on state switch
  useEffect(() => {
    setCurrentIndex(0);
  }, [selectedRegion]);

  const activeConcert = filteredSchedules[currentIndex] || null;

  // Real-time live countdown updating
  useEffect(() => {
    if (!activeConcert) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const target = new Date(activeConcert.targetDate).getTime();
      const diff = target - now;

      if (diff <= 0) {
        setTimeLeft({ d: 0, h: 0, m: 0, s: 0 });
      } else {
        const d = Math.floor(diff / (1000 * 60 * 60 * 24));
        const h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const s = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft({ d, h, m, s });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeConcert]);

  // Autoplay functionality: cycle through concerts automatically
  useEffect(() => {
    resetAutoplay();
    return () => stopAutoplay();
  }, [currentIndex, selectedRegion]);

  const startAutoplay = () => {
    stopAutoplay();
    autoPlayRef.current = setInterval(() => {
      handleNext();
    }, 8000); // 8 seconds per slide
  };

  const stopAutoplay = () => {
    if (autoPlayRef.current) {
      clearInterval(autoPlayRef.current);
    }
  };

  const resetAutoplay = () => {
    startAutoplay();
  };

  const handleNext = () => {
    if (filteredSchedules.length <= 1) return;
    setSlideDirection(1);
    setCurrentIndex(prev => (prev + 1) % filteredSchedules.length);
  };

  const handlePrev = () => {
    if (filteredSchedules.length <= 1) return;
    setSlideDirection(-1);
    setCurrentIndex(prev => (prev - 1 + filteredSchedules.length) % filteredSchedules.length);
  };

  if (!activeConcert) return null;

  return (
    <div className="w-full bg-[#0a0516] border border-white/5 rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-[0_15px_40px_rgba(139,92,246,0.07)]">
      {/* Decorative backing spotlights */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-purple-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />

      {/* HEADER ROW */}
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/[0.04] pb-5 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 px-2.5 rounded-full bg-purple-500/10 text-purple-300 font-mono text-[9px] font-bold uppercase tracking-widest border border-purple-500/15">
              Live Starlight Route
            </span>
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
          </div>
          <h2 className="text-xl md:text-2xl font-sans font-extrabold text-white mt-1 flex items-center gap-2 tracking-tight">
            {config?.title || "ARIRANG World Tour Countdown"} <Activity className="w-5 h-5 text-purple-400" />
          </h2>
          <p className="text-gray-400 text-xs mt-0.5 font-sans">
            {config?.subtitle || "Real-time daily countdown coordinate to upcoming spectacular concert stadiums around the globe."}
          </p>
        </div>

        {/* REGIONAL FLUID CONTROLS */}
        <div className="flex flex-wrap gap-1.5 bg-black/40 p-1 rounded-xl border border-white/5 self-start">
          {(['ALL', 'EUROPE', 'NORTH AMERICA', 'ASIA & AUSTRALIA'] as const).map(region => (
            <button
              key={region}
              onClick={() => setSelectedRegion(region)}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-mono uppercase font-extrabold transition-all cursor-pointer ${
                selectedRegion === region 
                  ? 'bg-purple-650 text-white shadow shadow-purple-500/20' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              {region}
            </button>
          ))}
        </div>
      </div>

      {/* CAROUSEL BODY PART WITH ANIMATION */}
      <AnimatePresence mode="wait" custom={slideDirection}>
        <motion.div
          key={activeConcert.id}
          custom={slideDirection}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          className="relative z-10 grid grid-cols-1 lg:grid-cols-5 gap-6 items-stretch w-full"
        >
          
          {/* LEFT COLUMN: CONCERT GRAPHIC OR DECOR (2 spans) */}
        <div className="lg:col-span-2 relative rounded-2xl overflow-hidden min-h-[220px] lg:min-h-[320px] border border-white/10 group bg-black/30">
          <img 
            src={activeConcert.imageUrl} 
            alt={activeConcert.city} 
            className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700 pointer-events-none"
            referrerPolicy="no-referrer"
          />
          {/* Neon vertical overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/99 via-black/40 to-transparent" />
          
          {/* Metadata badges overlay info */}
          <div className="absolute inset-x-0 bottom-0 p-5 space-y-2 pointer-events-none">
            <span className="px-2 py-0.5 text-[9px] font-mono text-cyan-400 border border-cyan-500/30 bg-cyan-950/40 rounded">
              {activeConcert.region} Segment
            </span>

            <div className="space-y-0.5 pt-1">
              <h3 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-purple-400 shrink-0" />
                {activeConcert.city}, {activeConcert.country}
              </h3>
              <p className="text-gray-300 text-xs font-medium font-sans">
                {activeConcert.venue}
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-white/5 mt-1 font-mono text-[10px] text-gray-400">
              <Calendar className="w-3.5 h-3.5 text-purple-400" />
              <span>{activeConcert.dateStr}</span>
            </div>
          </div>
          
          {/* Floating ticket label */}
          <div className="absolute top-4 right-4 bg-purple-600/90 text-white font-mono text-[9px] rounded-full px-2.5 py-1 font-bold flex items-center gap-1 shadow-lg shadow-purple-900/40 uppercase">
            <Ticket className="w-3 h-3 text-white" /> Live Stadium
          </div>
        </div>

        {/* RIGHT COLUMN: HIGH-CONTRAST DIGITAL COUNTDOWN MODULE (3 spans) */}
        <div className="lg:col-span-3 flex flex-col justify-between p-6 rounded-2xl bg-[#0e0a1f]/80 border border-purple-500/10 relative">
          
          {/* Header segment */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono text-purple-400 tracking-widest uppercase block">
              Active Countdown Segment Coordinates
            </span>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-sans text-white/90">Next Scheduled Performance:</span>
              <span className="text-xs font-mono font-bold text-cyan-400 bg-cyan-950/40 border border-cyan-500/20 px-2 py-0.5 rounded">
                {activeConcert.city} Stage
              </span>
            </div>
          </div>

          {/* ACTIVE NEON SEGMENT COUNTERS */}
          <div className="my-6 grid grid-cols-4 gap-2.5 sm:gap-4 text-center">
            {/* Days block */}
            <div className="bg-black/40 border border-white/[0.04] rounded-xl p-3 sm:p-4 flex flex-col justify-center relative group overflow-hidden">
              <div className="absolute bottom-0 inset-x-0 h-1 bg-purple-500 scale-x-0 group-hover:scale-x-100 transition-transform origin-center" />
              <span className="text-2xl sm:text-4xl font-mono font-black text-white leading-none tracking-tight">
                {String(timeLeft.d).padStart(2, '0')}
              </span>
              <span className="text-[9px] sm:text-[10px] font-mono text-gray-500 uppercase mt-2 select-none">Days</span>
            </div>

            {/* Hours block */}
            <div className="bg-black/40 border border-white/[0.04] rounded-xl p-3 sm:p-4 flex flex-col justify-center relative group overflow-hidden">
              <div className="absolute bottom-0 inset-x-0 h-1 bg-cyan-400 scale-x-0 group-hover:scale-x-100 transition-transform origin-center" />
              <span className="text-2xl sm:text-4xl font-mono font-black text-white leading-none tracking-tight">
                {String(timeLeft.h).padStart(2, '0')}
              </span>
              <span className="text-[9px] sm:text-[10px] font-mono text-gray-500 uppercase mt-2 select-none">Hours</span>
            </div>

            {/* Minutes block */}
            <div className="bg-black/40 border border-white/[0.04] rounded-xl p-3 sm:p-4 flex flex-col justify-center relative group overflow-hidden">
              <div className="absolute bottom-0 inset-x-0 h-1 bg-pink-400 scale-x-0 group-hover:scale-x-100 transition-transform origin-center" />
              <span className="text-2xl sm:text-4xl font-mono font-black text-white leading-none tracking-tight">
                {String(timeLeft.m).padStart(2, '0')}
              </span>
              <span className="text-[9px] sm:text-[10px] font-mono text-gray-500 uppercase mt-2 select-none">Mins</span>
            </div>

            {/* Seconds block */}
            <div className="bg-black/40 border border-white/[0.04] rounded-xl p-3 sm:p-4 flex flex-col justify-center relative group overflow-hidden">
              <div className="absolute bottom-0 inset-x-0 h-1 bg-yellow-400 scale-x-0 group-hover:scale-x-100 transition-transform origin-center" />
              <span className="text-2xl sm:text-4xl font-mono font-black text-yellow-400 leading-none tracking-tight">
                {String(timeLeft.s).padStart(2, '0')}
              </span>
              <span className="text-[9px] sm:text-[10px] font-mono text-gray-500 uppercase mt-2 select-none">Secs</span>
            </div>
          </div>

          {/* Action Row - Sliders, indicators, ticket button */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 pt-4 border-t border-white/[0.04]">
            
            {/* Pagination Controls */}
            <div className="flex items-center gap-3">
              {/* Previous button */}
              <button
                onClick={() => { stopAutoplay(); handlePrev(); }}
                className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 active:scale-90 transition-all cursor-pointer"
                title="Previous Scheduled Venue"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Dots tracker */}
              <div className="flex items-center gap-1.5">
                {filteredSchedules.map((_, dotIdx) => (
                  <button
                    key={dotIdx}
                    onClick={() => {
                      stopAutoplay();
                      setSlideDirection(dotIdx > currentIndex ? 1 : -1);
                      setCurrentIndex(dotIdx);
                    }}
                    className={`h-1.5 rounded-full transition-all cursor-pointer ${
                      currentIndex === dotIdx ? 'w-4 bg-purple-400' : 'w-1.5 bg-gray-650 hover:bg-gray-500'
                    }`}
                  />
                ))}
              </div>

              {/* Next button */}
              <button
                onClick={() => { stopAutoplay(); handleNext(); }}
                className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 active:scale-90 transition-all cursor-pointer"
                title="Next Scheduled Venue"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Custom Interactive Status Box / Ticket trigger */}
            <div className="flex items-center justify-between sm:justify-end gap-3 text-xs">
              <div className="text-right hidden sm:block">
                <span className="text-[10px] font-mono text-gray-500 block uppercase">Starlight Arena Queue</span>
                <span className="text-[9px] font-mono text-purple-400 font-bold block">ARMY Ticket Booth active</span>
              </div>
              <a
                href={config?.buttonLink || "https://ibighit.com/bts"}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-650 to-pink-650 hover:from-purple-600 hover:to-pink-600 text-white font-mono text-[10px] font-extrabold shadow shadow-purple-500/20 active:scale-95 transition-all text-center"
              >
                {config?.buttonText || "Official Tickets Inquiry"}
              </a>
            </div>

          </div>

        </div>

      </motion.div>
      </AnimatePresence>

    </div>
  );
}
