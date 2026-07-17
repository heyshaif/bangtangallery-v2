/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import { 
  Gift, 
  Zap, 
  Sparkles, 
  MessageSquareHeart, 
  ChevronLeft, 
  ChevronRight, 
  MapPin, 
  Calendar, 
  Clock, 
  Award,
  Globe,
  Radio
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FestaCountdownProps {
  onFeedbackTrigger: () => void;
}

interface BTSCarouselEvent {
  id: string;
  title: string;
  city: string;
  country: string;
  date: string;
  time: string;
  countdownTarget: string; // ISO representation e.g. "2026-06-13T18:00:00"
  bgGradient: string;
  details: string;
}

// 2026 / 2027 BTS Full World Tour & Milestones Event List
const BTS_EVENTS_2026_2027: BTSCarouselEvent[] = [
  {
    id: 'festa-2026',
    title: 'BTS 13th Anniversary FESTA',
    city: 'Seoul',
    country: 'South Korea',
    date: 'June 13, 2026',
    time: '18:00 KST',
    countdownTarget: '2026-06-13T18:00:00',
    bgGradient: 'from-purple-950/80 via-indigo-950/50 to-neutral-950/90',
    details: 'The official collective 13th anniversary FESTA! Featuring special stage returns, lightsticks synchronization, and a beautiful synchronized purple fireworks displays.'
  },
  {
    id: 'madrid-1',
    title: 'BTS "Apobangpo" World Tour - Madrid Day 1',
    city: 'Madrid',
    country: 'Spain',
    date: 'June 26, 2026',
    time: '19:30 Local',
    countdownTarget: '2026-06-26T19:30:00',
    bgGradient: 'from-amber-950/80 via-red-950/45 to-neutral-950/95',
    details: 'Opening night in Spain! Experience the explosive soundscapes of their reunion stadium performance under the summer skies of Madrid.'
  },
  {
    id: 'madrid-2',
    title: 'BTS "Apobangpo" World Tour - Madrid Day 2',
    city: 'Madrid',
    country: 'Spain',
    date: 'June 27, 2026',
    time: '19:30 Local',
    countdownTarget: '2026-06-27T19:30:00',
    bgGradient: 'from-amber-950/80 via-red-950/45 to-neutral-950/95',
    details: 'Second night at the Estadio Metropolitano with enhanced stage setups and exclusive encore singles.'
  },
  {
    id: 'brussels-1',
    title: 'BTS "Apobangpo" World Tour - Brussels Day 1',
    city: 'Brussels',
    country: 'Belgium',
    date: 'July 1, 2026',
    time: '19:30 Local',
    countdownTarget: '2026-07-01T19:30:00',
    bgGradient: 'from-yellow-950/60 via-red-950/40 to-neutral-950/95',
    details: 'Witness the iconic bulletproof performance live in Belgium for the first of two historic sold-out stadium dates.'
  },
  {
    id: 'brussels-2',
    title: 'BTS "Apobangpo" World Tour - Brussels Day 2',
    city: 'Brussels',
    country: 'Belgium',
    date: 'July 2, 2026',
    time: '19:30 Local',
    countdownTarget: '2026-07-02T19:30:00',
    bgGradient: 'from-yellow-950/60 via-red-950/40 to-neutral-950/95',
    details: 'The second legendary evening where thousands of purple lightsticks will illuminate Brussels with deep cosmic rhythms.'
  },
  {
    id: 'london-1',
    title: 'BTS "Apobangpo" World Tour - London Day 1',
    city: 'London',
    country: 'United Kingdom',
    date: 'July 6, 2026',
    time: '19:30 Local',
    countdownTarget: '2026-07-06T19:30:00',
    bgGradient: 'from-blue-950/80 via-indigo-950/50 to-neutral-950/90',
    details: 'Returning to take over the massive Wembley Stadium with unprecedented sound production, solo showcases, and collective reunions.'
  },
  {
    id: 'london-2',
    title: 'BTS "Apobangpo" World Tour - London Day 2',
    city: 'London',
    country: 'United Kingdom',
    date: 'July 7, 2026',
    time: '19:30 Local',
    countdownTarget: '2026-07-07T19:30:00',
    bgGradient: 'from-blue-950/80 via-indigo-950/50 to-neutral-950/90',
    details: 'Night two in the UK where fans will create giant lightwaves and chant in beautiful unison under starlight.'
  },
  {
    id: 'munich-1',
    title: 'BTS "Apobangpo" World Tour - Munich Day 1',
    city: 'Munich',
    country: 'Germany',
    date: 'July 11, 2026',
    time: '19:30 Local',
    countdownTarget: '2026-07-11T19:30:00',
    bgGradient: 'from-red-950/70 via-stone-900/40 to-neutral-950/95',
    details: 'Unleashing energy in Germany! An unforgettable night filled with choreography and stunning laser stages.'
  },
  {
    id: 'munich-2',
    title: 'BTS "Apobangpo" World Tour - Munich Day 2',
    city: 'Munich',
    country: 'Germany',
    date: 'July 12, 2026',
    time: '19:30 Local',
    countdownTarget: '2026-07-12T19:30:00',
    bgGradient: 'from-red-950/70 via-stone-900/40 to-neutral-950/95',
    details: 'The final night in Germany with surprises, dynamic beats, and heart-felt speeches from the members.'
  },
  {
    id: 'paris-1',
    title: 'BTS "Apobangpo" World Tour - Paris Day 1',
    city: 'Paris',
    country: 'France',
    date: 'July 17, 2026',
    time: '19:30 Local',
    countdownTarget: '2026-07-17T19:30:00',
    bgGradient: 'from-indigo-950/80 via-rose-950/40 to-neutral-950/95',
    details: 'Bonjour ARMY! Let the beautiful melodies and elegant vocals echoes inside Paris Olympic Stadium.'
  },
  {
    id: 'paris-2',
    title: 'BTS "Apobangpo" World Tour - Paris Day 2',
    city: 'Paris',
    country: 'France',
    date: 'July 18, 2026',
    time: '19:30 Local',
    countdownTarget: '2026-07-18T19:30:00',
    bgGradient: 'from-indigo-950/80 via-rose-950/40 to-neutral-950/95',
    details: 'Bringing the European leg to a beautiful close with special encores and emotional memories to treasure forever.'
  },
  {
    id: 'nj-1',
    title: 'BTS "Apobangpo" World Tour - East Rutherford Day 1',
    city: 'East Rutherford',
    country: 'New Jersey, USA',
    date: 'August 1, 2026',
    time: '19:30 Local',
    countdownTarget: '2026-08-01T19:30:00',
    bgGradient: 'from-blue-950/80 via-rose-950/30 to-neutral-950/90',
    details: 'Kicking off the highly anticipated North American stadium tour at MetLife Stadium under beautiful august meteor showers.'
  },
  {
    id: 'nj-2',
    title: 'BTS "Apobangpo" World Tour - East Rutherford Day 2',
    city: 'East Rutherford',
    country: 'New Jersey, USA',
    date: 'August 2, 2026',
    time: '19:30 Local',
    countdownTarget: '2026-08-02T19:30:00',
    bgGradient: 'from-blue-950/80 via-rose-950/30 to-neutral-950/90',
    details: 'Double header in New Jersey! Guaranteed to have custom setlists, intense dance breaks, and massive crowd engagement.'
  },
  {
    id: 'ma-1',
    title: 'BTS "Apobangpo" World Tour - Foxborough Day 1',
    city: 'Foxborough',
    country: 'Massachusetts, USA',
    date: 'August 5, 2026',
    time: '19:30 Local',
    countdownTarget: '2026-08-05T19:30:00',
    bgGradient: 'from-indigo-950/70 via-blue-955/40 to-neutral-950/95',
    details: 'Performing at the historic Gillette Stadium with massive staging, interactive soundboards and deep basslines.'
  },
  {
    id: 'ma-2',
    title: 'BTS "Apobangpo" World Tour - Foxborough Day 2',
    city: 'Foxborough',
    country: 'Massachusetts, USA',
    date: 'August 6, 2026',
    time: '19:30 Local',
    countdownTarget: '2026-08-06T19:30:00',
    bgGradient: 'from-indigo-950/70 via-blue-955/40 to-neutral-950/95',
    details: 'Night two where the energy of the crowd and members unites to turn the Massachusetts skies purple.'
  },
  {
    id: 'baltimore-1',
    title: 'BTS "Apobangpo" World Tour - Baltimore Day 1',
    city: 'Baltimore',
    country: 'Maryland, USA',
    date: 'August 10, 2026',
    time: '19:30 Local',
    countdownTarget: '2026-08-10T19:30:00',
    bgGradient: 'from-slate-900/80 via-purple-950/40 to-neutral-950/95',
    details: 'Bringing the starlight spectacle to Baltimore. Expect massive fireworks, member solos, and iconic sub-unit tracks.'
  },
  {
    id: 'baltimore-2',
    title: 'BTS "Apobangpo" World Tour - Baltimore Day 2',
    city: 'Baltimore',
    country: 'Maryland, USA',
    date: 'August 11, 2026',
    time: '19:30 Local',
    countdownTarget: '2026-08-11T19:30:00',
    bgGradient: 'from-slate-900/80 via-purple-950/40 to-neutral-950/95',
    details: 'Night two in Baltimore with incredible stadium-wide light rings and full crowd interactive choruses.'
  },
  {
    id: 'texas-1',
    title: 'BTS "Apobangpo" World Tour - Arlington Day 1',
    city: 'Arlington',
    country: 'Texas, USA',
    date: 'August 15, 2026',
    time: '19:30 Local',
    countdownTarget: '2026-08-15T19:30:00',
    bgGradient: 'from-red-950/50 via-purple-950/45 to-neutral-950/90',
    details: 'Giga-scale stage inside the massive AT&T Stadium. A spectacular, high-tech experience with flying camera tracks and deep visual art.'
  },
  {
    id: 'texas-2',
    title: 'BTS "Apobangpo" World Tour - Arlington Day 2',
    city: 'Arlington',
    country: 'Texas, USA',
    date: 'August 16, 2026',
    time: '19:30 Local',
    countdownTarget: '2026-08-16T19:30:00',
    bgGradient: 'from-red-950/50 via-purple-950/45 to-neutral-950/90',
    details: 'Deep in the heart of Texas, round two brings extra special encore requests and memorable chats.'
  },
  {
    id: 'toronto-1',
    title: 'BTS "Apobangpo" World Tour - Toronto Day 1',
    city: 'Toronto',
    country: 'Canada',
    date: 'August 22, 2026',
    time: '19:30 Local',
    countdownTarget: '2026-08-22T19:30:00',
    bgGradient: 'from-rose-950/70 via-indigo-950/40 to-neutral-950/95',
    details: 'The official Canadian homecoming event! Prepare for incredible, beautiful vocal lines echoing in Toronto.'
  },
  {
    id: 'toronto-2',
    title: 'BTS "Apobangpo" World Tour - Toronto Day 2',
    city: 'Toronto',
    country: 'Canada',
    date: 'August 23, 2026',
    time: '19:30 Local',
    countdownTarget: '2026-08-23T19:30:00',
    bgGradient: 'from-rose-950/70 via-indigo-950/40 to-neutral-950/95',
    details: 'Closing the Canadian stage under majestic autumn coordinates with customized ARMY fan highlights.'
  },
  {
    id: 'chicago-1',
    title: 'BTS "Apobangpo" World Tour - Chicago Day 1',
    city: 'Chicago',
    country: 'Illinois, USA',
    date: 'August 27, 2026',
    time: '19:30 Local',
    countdownTarget: '2026-08-27T19:30:00',
    bgGradient: 'from-blue-950/80 via-slate-900/40 to-neutral-950/95',
    details: 'Sold-out concert at Soldier Field! Bringing emotional performances of legacy tracks and new modern hip-hop joints.'
  },
  {
    id: 'chicago-2',
    title: 'BTS "Apobangpo" World Tour - Chicago Day 2',
    city: 'Chicago',
    country: 'Illinois, USA',
    date: 'August 28, 2026',
    time: '19:30 Local',
    countdownTarget: '2026-08-28T19:30:00',
    bgGradient: 'from-blue-950/80 via-slate-900/40 to-neutral-950/95',
    details: 'Closing the first main summer leg of their North American tour with an emotional, breathtaking reunion display.'
  },
  {
    id: 'kaohsiung-1',
    title: 'BTS "Apobangpo" World Tour - Kaohsiung Day 1',
    city: 'Kaohsiung',
    country: 'Taiwan',
    date: 'November 19, 2026',
    time: '19:30 Local',
    countdownTarget: '2026-11-19T19:30:00',
    bgGradient: 'from-purple-950/70 via-fuchsia-950/35 to-neutral-950/95',
    details: 'The official launch of the Asian stadium leg! Unprecedented visual projection mapping in Kaohsiung National Stadium.'
  },
  {
    id: 'kaohsiung-2',
    title: 'BTS "Apobangpo" World Tour - Kaohsiung Day 2',
    city: 'Kaohsiung',
    country: 'Taiwan',
    date: 'November 21, 2026',
    time: '19:30 Local',
    countdownTarget: '2026-11-21T19:30:00',
    bgGradient: 'from-purple-950/70 via-fuchsia-950/35 to-neutral-950/95',
    details: 'Day two in Kaohsiung filled with incredible warmth and a synchronized ARMY lightwave show.'
  },
  {
    id: 'kaohsiung-3',
    title: 'BTS "Apobangpo" World Tour - Kaohsiung Day 3',
    city: 'Kaohsiung',
    country: 'Taiwan',
    date: 'November 22, 2026',
    time: '19:30 Local',
    countdownTarget: '2026-11-22T19:30:00',
    bgGradient: 'from-purple-950/70 via-fuchsia-950/35 to-neutral-950/95',
    details: 'The final stadium night in Kaohsiung celebrating friendship and Bulletproof history.'
  },
  {
    id: 'bangkok-1',
    title: 'BTS "Apobangpo" World Tour - Bangkok Day 1',
    city: 'Bangkok',
    country: 'Thailand',
    date: 'December 3, 2026',
    time: '19:30 Local',
    countdownTarget: '2026-12-03T19:30:00',
    bgGradient: 'from-amber-950/60 via-purple-950/40 to-neutral-950/95',
    details: 'Bringing the majestic Purple Wave to Rajamangala Stadium! A high-voltage evening with incredible tropical vibes.'
  },
  {
    id: 'bangkok-2',
    title: 'BTS "Apobangpo" World Tour - Bangkok Day 2',
    city: 'Bangkok',
    country: 'Thailand',
    date: 'December 5, 2026',
    time: '19:30 Local',
    countdownTarget: '2026-12-05T19:30:00',
    bgGradient: 'from-amber-950/60 via-purple-950/40 to-neutral-950/95',
    details: 'Special celebration stage with royal laser displays and custom member stage costumes.'
  },
  {
    id: 'bangkok-3',
    title: 'BTS "Apobangpo" World Tour - Bangkok Day 3',
    city: 'Bangkok',
    country: 'Thailand',
    date: 'December 6, 2026',
    time: '19:30 Local',
    countdownTarget: '2026-12-06T19:30:00',
    bgGradient: 'from-amber-950/60 via-purple-950/40 to-neutral-950/95',
    details: 'A beautiful tropical finale. Moving speeches and tearful encores from RM, Jin, SUGA, j-hope, Jimin, V, and JK.'
  },
  {
    id: 'kl-1',
    title: 'BTS "Apobangpo" World Tour - Kuala Lumpur Day 1',
    city: 'Kuala Lumpur',
    country: 'Malaysia',
    date: 'December 12, 2026',
    time: '19:30 Local',
    countdownTarget: '2026-12-12T19:30:00',
    bgGradient: 'from-indigo-950/70 via-fuchsia-950/40 to-neutral-950/95',
    details: 'Explosive anthems to be delivered under the starry skies of Bukit Jalil National Stadium. An incredible production.'
  },
  {
    id: 'kl-2',
    title: 'BTS "Apobangpo" World Tour - Kuala Lumpur Day 2',
    city: 'Kuala Lumpur',
    country: 'Malaysia',
    date: 'December 13, 2026',
    time: '19:30 Local',
    countdownTarget: '2026-12-13T19:30:00',
    bgGradient: 'from-indigo-950/70 via-fuchsia-950/40 to-neutral-950/95',
    details: 'Closing Malaysia\'s massive gathering with beautiful group photographs and stunning fireworks.'
  },
  {
    id: 'singapore-1',
    title: 'BTS "Apobangpo" World Tour - Singapore Day 1',
    city: 'Singapore',
    country: 'Singapore',
    date: 'December 17, 2026',
    time: '19:30 Local',
    countdownTarget: '2026-12-17T19:30:00',
    bgGradient: 'from-blue-950/70 via-indigo-950/50 to-neutral-950/90',
    details: 'Four historic nights begin inside the Singapore National Stadium! A high-definition cosmic projection stage.'
  },
  {
    id: 'singapore-2',
    title: 'BTS "Apobangpo" World Tour - Singapore Day 2',
    city: 'Singapore',
    country: 'Singapore',
    date: 'December 19, 2026',
    time: '19:30 Local',
    countdownTarget: '2026-12-19T19:30:00',
    bgGradient: 'from-blue-950/70 via-indigo-950/50 to-neutral-950/90',
    details: 'Night two feature deeper acoustic sets, spontaneous covers, and heartwarming talks.'
  },
  {
    id: 'singapore-3',
    title: 'BTS "Apobangpo" World Tour - Singapore Day 3',
    city: 'Singapore',
    country: 'Singapore',
    date: 'December 20, 2026',
    time: '19:30 Local',
    countdownTarget: '2026-12-20T19:30:00',
    bgGradient: 'from-blue-950/70 via-indigo-950/50 to-neutral-950/90',
    details: 'Third spectacular evening featuring stadium wave routines and vibrant synchronized light sticks.'
  },
  {
    id: 'singapore-4',
    title: 'BTS "Apobangpo" World Tour - Singapore Day 4',
    city: 'Singapore',
    country: 'Singapore',
    date: 'December 22, 2026',
    time: '19:30 Local',
    countdownTarget: '2026-12-22T19:30:00',
    bgGradient: 'from-blue-950/70 via-indigo-950/50 to-neutral-950/90',
    details: 'A glorious, monumental fourth show in Singapore, concluding with emotional holiday-themed special stages.'
  },
  {
    id: 'jakarta-1',
    title: 'BTS "Apobangpo" World Tour - Jakarta Day 1',
    city: 'Jakarta',
    country: 'Indonesia',
    date: 'December 26, 2026',
    time: '19:30 Local',
    countdownTarget: '2026-12-26T19:30:00',
    bgGradient: 'from-fuchsia-950/70 via-purple-950/40 to-neutral-950/95',
    details: 'Witness high-energy vocal stages at Gelora Bung Karno Stadium as the year 2026 comes to a beautiful, melodic end.'
  },
  {
    id: 'jakarta-2',
    title: 'BTS "Apobangpo" World Tour - Jakarta Day 2',
    city: 'Jakarta',
    country: 'Indonesia',
    date: 'December 27, 2026',
    time: '19:30 Local',
    countdownTarget: '2026-12-27T19:30:00',
    bgGradient: 'from-fuchsia-950/70 via-purple-950/40 to-neutral-950/95',
    details: 'The final 2026 world tour stop! Celebrating with giant global countdowns and heartfelt year-end wishes.'
  },
  {
    id: 'melbourne-1',
    title: 'BTS "Apobangpo" World Tour - Melbourne Day 1',
    city: 'Melbourne',
    country: 'Australia',
    date: 'February 10, 2027',
    time: '19:30 Local',
    countdownTarget: '2027-02-10T19:30:00',
    bgGradient: 'from-teal-950/70 via-emerald-950/40 to-neutral-950/95',
    details: 'Launching the highly anticipated Oceania leg! Breathtaking visual effects inside Melbourne Stadium.'
  },
  {
    id: 'melbourne-2',
    title: 'BTS "Apobangpo" World Tour - Melbourne Day 2',
    city: 'Melbourne',
    country: 'Australia',
    date: 'February 12, 2027',
    time: '19:30 Local',
    countdownTarget: '2027-02-12T19:30:00',
    bgGradient: 'from-teal-950/70 via-emerald-950/40 to-neutral-950/95',
    details: 'An energetic night two in Melbourne with incredible choreographies and beautiful sunset vocals.'
  },
  {
    id: 'melbourne-3',
    title: 'BTS "Apobangpo" World Tour - Melbourne Day 3',
    city: 'Melbourne',
    country: 'Australia',
    date: 'February 13, 2027',
    time: '19:30 Local',
    countdownTarget: '2027-02-13T19:30:00',
    bgGradient: 'from-teal-950/70 via-emerald-950/40 to-neutral-950/95',
    details: 'Closing three legendary concerts in Melbourne under beautiful blue Southern Cross laser paths.'
  },
  {
    id: 'sydney-1',
    title: 'BTS "Apobangpo" World Tour - Sydney Day 1',
    city: 'Sydney',
    country: 'Australia',
    date: 'February 20, 2027',
    time: '19:30 Local',
    countdownTarget: '2027-02-20T19:30:00',
    bgGradient: 'from-teal-950/80 via-blue-950/40 to-neutral-950/95',
    details: 'Sold-out stadium night in beautiful Sydney! Delivering emotional vocal colors and intense performance dynamics.'
  },
  {
    id: 'sydney-2',
    title: 'BTS "Apobangpo" World Tour - Sydney Day 2',
    city: 'Sydney',
    country: 'Australia',
    date: 'February 21, 2027',
    time: '19:30 Local',
    countdownTarget: '2027-02-21T19:30:00',
    bgGradient: 'from-teal-950/80 via-blue-950/40 to-neutral-950/95',
    details: 'Concluding the majestic Oceania leg in Sydney with stunning ocean theme lightshows.'
  },
  {
    id: 'hk-1',
    title: 'BTS "Apobangpo" World Tour - Hong Kong Day 1',
    city: 'Hong Kong',
    country: 'Hong Kong',
    date: 'March 4, 2027',
    time: '19:30 Local',
    countdownTarget: '2027-03-04T19:30:00',
    bgGradient: 'from-purple-950/70 via-stone-900/40 to-neutral-950/95',
    details: 'Unrivaled stadium scale in Hong Kong! Featuring three-dimensional projection platforms and high fidelity staging.'
  },
  {
    id: 'hk-2',
    title: 'BTS "Apobangpo" World Tour - Hong Kong Day 2',
    city: 'Hong Kong',
    country: 'Hong Kong',
    date: 'March 6, 2027',
    time: '19:30 Local',
    countdownTarget: '2027-03-06T19:30:00',
    bgGradient: 'from-purple-950/70 via-stone-900/40 to-neutral-950/95',
    details: 'Incredible fan light configurations and beautifully consolidated group chorus segments.'
  },
  {
    id: 'hk-3',
    title: 'BTS "Apobangpo" World Tour - Hong Kong Day 3',
    city: 'Hong Kong',
    country: 'Hong Kong',
    date: 'March 7, 2027',
    time: '19:30 Local',
    countdownTarget: '2027-03-07T19:30:00',
    bgGradient: 'from-purple-950/70 via-stone-900/40 to-neutral-950/95',
    details: 'Emotional third night in Hong Kong showing beautiful summaries of the member journey.'
  },
  {
    id: 'bulacan-1',
    title: 'BTS "Apobangpo" World Tour - Bulacan Day 1',
    city: 'Bulacan',
    country: 'Philippines',
    date: 'March 13, 2027',
    time: '19:30 Local',
    countdownTarget: '2027-03-13T19:30:00',
    bgGradient: 'from-purple-950/80 via-rose-955/40 to-neutral-950/95',
    details: 'The massive Philippine Arena turns into a sea of purple stars! Deep vocals and intense dance numbers.'
  },
  {
    id: 'bulacan-2',
    title: 'BTS "Apobangpo" World Tour - Bulacan Day 2',
    city: 'Bulacan',
    country: 'Philippines',
    date: 'March 14, 2027',
    time: '19:30 Local',
    countdownTarget: '2027-03-14T19:30:00',
    bgGradient: 'from-purple-950/80 via-rose-955/40 to-neutral-950/95',
    details: 'The historic tour finale! Concluding with custom fan-designed memoirs, crying encores, and an eternal vow.'
  }
];

// Seeded target for next announced event AFTER all tour stops are completed
const NEXT_DEBUT_ANNOUNCED = {
  id: 'future-album',
  title: 'BTS Special Reunion Album & FESTA 15th Anniversary',
  city: 'Seoul',
  country: 'South Korea & Worldwide',
  date: 'June 13, 2028',
  time: '18:00 KST',
  countdownTarget: '2028-06-13T18:00:00',
  bgGradient: 'from-fuchsia-950/90 via-purple-950/60 to-black',
  details: 'The ultimate next chapter milestone: celebrating 15 winters and summers together with a massive worldwide studio record release and live stream.'
};

interface FireworkParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  decay: number;
  size: number;
}

interface ConfettiParticle {
  x: number;
  y: number;
  size: number;
  color: string;
  speedY: number;
  speedX: number;
  angle: number;
  spinSpeed: number;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

export default function FestaCountdown({ onFeedbackTrigger }: FestaCountdownProps) {
  const [activeEvents, setActiveEvents] = useState<BTSCarouselEvent[]>([]);
  const [countdowns, setCountdowns] = useState<Record<string, TimeLeft>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isSimulatedConclusion, setIsSimulatedConclusion] = useState(false);
  const [isFestaDayAnimation, setIsFestaDayAnimation] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  const fpArrayRef = useRef<FireworkParticle[]>([]);
  const cpArrayRef = useRef<ConfettiParticle[]>([]);

  // Calculate local time on mount and initialize events
  useEffect(() => {
    const checkActiveEvents = () => {
      const now = new Date().getTime();
      const futureEvents = BTS_EVENTS_2026_2027.filter(
        (evt) => new Date(evt.countdownTarget).getTime() > now
      );
      setActiveEvents(futureEvents);
    };

    checkActiveEvents();
    // Re-check periodically
    const tInterval = setInterval(checkActiveEvents, 5000);
    return () => clearInterval(tInterval);
  }, []);

  // Update live countdown timers every second + auto-prune passed events
  useEffect(() => {
    const updateTimers = () => {
      const now = new Date().getTime();
      const newCountdowns: Record<string, TimeLeft> = {};

      const allPossibleEvents = [...BTS_EVENTS_2026_2027, NEXT_DEBUT_ANNOUNCED];

      allPossibleEvents.forEach((evt) => {
        const target = new Date(evt.countdownTarget).getTime();
        const difference = target - now;

        if (difference <= 0) {
          newCountdowns[evt.id] = { days: 0, hours: 0, minutes: 0, seconds: 0 };
        } else {
          const days = Math.floor(difference / (1000 * 60 * 60 * 24));
          const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((difference % (1000 * 60)) / 1000);
          newCountdowns[evt.id] = { days, hours, minutes, seconds };
        }
      });

      setCountdowns(newCountdowns);
    };

    updateTimers();
    const intervalId = setInterval(updateTimers, 1000);
    return () => clearInterval(intervalId);
  }, []);

  // Handle active index normalization when list length changes
  useEffect(() => {
    if (activeEvents.length > 0 && currentIndex >= activeEvents.length) {
      setCurrentIndex(0);
    }
  }, [activeEvents, currentIndex]);

  // Automatic slide rotation (carousel) every 8 seconds (safely >= the requested 6 seconds!)
  useEffect(() => {
    if (!isAutoPlaying || activeEvents.length <= 1 || isSimulatedConclusion) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeEvents.length);
    }, 8000);

    return () => clearInterval(timer);
  }, [isAutoPlaying, activeEvents.length, isSimulatedConclusion]);

  // Determine current display mode
  const isAllEventsConcluded = isSimulatedConclusion || activeEvents.length === 0;
  const showEffectsCanvas = isFestaDayAnimation || isAllEventsConcluded;

  // Fireworks & Confetti Canvas Animation
  useEffect(() => {
    if (!showEffectsCanvas) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = canvas.parentElement?.clientWidth || window.innerWidth;
      canvas.height = canvas.parentElement?.clientHeight || 450;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const fpArray = fpArrayRef.current;
    const cpArray = cpArrayRef.current;

    const colors = [
      '#a855f7', // Purple
      '#c084fc', // Light Purple
      '#ef4444', // Red
      '#f43f5e', // Rose
      '#eab308', // Gold
      '#ec4899', // Pink
    ];

    const createFirework = (x: number, y: number) => {
      const particleCount = 45;
      const baseColor = colors[Math.floor(Math.random() * colors.length)];
      for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 3.5 + 1.5;
        fpArray.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 0.5,
          color: baseColor,
          alpha: 1,
          decay: Math.random() * 0.018 + 0.012,
          size: Math.random() * 2.2 + 1.2
        });
      }
    };

    const createConfetti = () => {
      if (cpArray.length > 80) return;
      cpArray.push({
        x: Math.random() * canvas.width,
        y: -10,
        size: Math.random() * 5 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        speedY: Math.random() * 2 + 1,
        speedX: Math.random() * 1.2 - 0.6,
        angle: Math.random() * 360,
        spinSpeed: Math.random() * 3 - 1.5
      });
    };

    let lastFireworkTime = 0;

    const animate = (time: number) => {
      ctx.fillStyle = 'rgba(10, 5, 23, 0.25)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Trigger automatic random fireworks
      if (time - lastFireworkTime > 1400) {
        createFirework(
          Math.random() * (canvas.width * 0.8) + canvas.width * 0.1,
          Math.random() * (canvas.height * 0.5) + canvas.height * 0.15
        );
        lastFireworkTime = time;
      }

      // Generate confetti
      if (Math.random() < 0.25) {
        createConfetti();
      }

      // Update & Draw Fireworks
      for (let i = fpArray.length - 1; i >= 0; i--) {
        const p = fpArray[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.045; // gravity
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          fpArray.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Update & Draw Confetti
      for (let i = cpArray.length - 1; i >= 0; i--) {
        const c = cpArray[i];
        c.y += c.speedY;
        c.x += c.speedX;
        c.angle += c.spinSpeed;

        if (c.y > canvas.height) {
          cpArray.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.fillStyle = c.color;
        ctx.translate(c.x, c.y);
        ctx.rotate((c.angle * Math.PI) / 180);
        ctx.fillRect(-c.size / 2, -c.size / 2, c.size, c.size / 1.5);
        ctx.restore();
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [showEffectsCanvas]);

  const handleNext = () => {
    if (activeEvents.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % activeEvents.length);
  };

  const handlePrev = () => {
    if (activeEvents.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + activeEvents.length) % activeEvents.length);
  };

  // Determine current active event or the future seeded follow up
  const currentEvent = isAllEventsConcluded ? NEXT_DEBUT_ANNOUNCED : activeEvents[currentIndex];
  const currentTimer = currentEvent ? countdowns[currentEvent.id] : null;

  // Verify match with current date to display the LIVE TODAY pulsing red badge
  const isLiveToday = currentEvent ? (() => {
    const today = new Date();
    const eventDate = new Date(currentEvent.countdownTarget);
    return today.getFullYear() === eventDate.getFullYear() &&
           today.getMonth() === eventDate.getMonth() &&
           today.getDate() === eventDate.getDate();
  })() : false;

  // Manual burst celebration trigger
  const triggerManualCelebrationBurst = () => {
    setIsFestaDayAnimation(true);
    const canvas = canvasRef.current;
    if (canvas) {
      const w = canvas.width;
      const h = canvas.height;
      const colorsList = ['#a855f7', '#eab308', '#ec4899', '#ef4444'];
      for (let k = 0; k < 3; k++) {
        const fx = Math.random() * (w * 0.6) + w * 0.2;
        const fy = Math.random() * (h * 0.4) + h * 0.15;
        const baseColor = colorsList[k % colorsList.length];
        for (let i = 0; i < 40; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 3 + 1;
          fpArrayRef.current.push({
            x: fx,
            y: fy,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 0.2,
            color: baseColor,
            alpha: 1,
            decay: Math.random() * 0.02 + 0.015,
            size: Math.random() * 2 + 1
          });
        }
      }
    }
  };

  return (
    <div 
      id="festa-countdown" 
      className={`relative w-full rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-b ${currentEvent?.bgGradient || 'from-purple-950/40 via-purple-900/10 to-neutral-950/90'} backdrop-blur-md p-6 md:p-8 shadow-2xl transition-all duration-700`}
    >
      {/* Decorative Blur Ambient Layer */}
      <div className="absolute inset-x-0 -top-40 h-80 bg-purple-600/15 rounded-full filter blur-[100px] pointer-events-none" />

      {/* Interactive Render Canvas */}
      {showEffectsCanvas && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
        />
      )}

      <div className="relative z-20 flex flex-col items-center justify-center text-center">
        {/* Subtitle Badge Header */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-purple-400/30 bg-purple-950/60 text-purple-300 text-[10px] md:text-xs font-mono mb-4 tracking-wider uppercase">
          <Gift className="w-3.5 h-3.5 text-purple-400 animate-bounce" />
          {isAllEventsConcluded ? 'CHAPTER 3 REUNION ANNALS' : `STADIUM CONCERT STAGE ${currentIndex + 1} OF ${activeEvents.length}`}
        </div>

        {isAllEventsConcluded ? (
          /* Conclusion Card: "Thank You ARMY" */
          <div className="py-6 flex flex-col items-center animate-fade-in w-full max-w-2xl">
            <div className="relative mb-5">
              <div className="absolute inset-0 bg-purple-500/30 rounded-full filter blur-xl animate-pulse" />
              <div className="relative w-20 h-20 rounded-full border-2 border-yellow-400 bg-gradient-to-tr from-purple-600 to-rose-500 flex items-center justify-center shadow-lg shadow-purple-500/50">
                <Award className="w-10 h-10 text-yellow-300 animate-spin" style={{ animationDuration: '10s' }} />
              </div>
            </div>

            <h1 className="text-3xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-purple-300 to-rose-400 tracking-tighter mb-2 font-sans uppercase">
              💜 THANK YOU ARMY!
            </h1>
            <p className="text-lg md:text-xl text-purple-200 font-bold max-w-xl mb-3 font-sans">
              See You at the Next Tour • ARIRANG ⟭⟬⁷
            </p>
            <p className="text-gray-300 text-xs md:text-sm max-w-lg mb-6 leading-relaxed">
              All 2026/2027 World Tour schedules have concluded beautifully under the starlight coordinates. We look forward to gathering under the skies again in 2028.
            </p>

            {/* In Conclusion display countdown to next announced bts event */}
            {currentTimer && (
              <div className="w-full max-w-md bg-black/40 border border-white/10 rounded-2xl p-4 mb-6">
                <span className="text-[10px] font-mono text-purple-300 uppercase tracking-widest block mb-2">
                  Countdown to {NEXT_DEBUT_ANNOUNCED.title}
                </span>

                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'DAYS', value: currentTimer.days },
                    { label: 'HRS', value: currentTimer.hours },
                    { label: 'MINS', value: currentTimer.minutes },
                    { label: 'SECS', value: currentTimer.seconds }
                  ].map((item, i) => (
                    <div key={i} className="flex flex-col items-center bg-black/50 p-2 rounded-lg border border-purple-500/10">
                      <span className="text-lg md:text-xl font-mono font-bold text-white tracking-tight">
                        {String(item.value).padStart(2, '0')}
                      </span>
                      <span className="text-[8px] font-bold text-purple-400 mt-0.5 tracking-wider">
                        {item.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2.5 w-full justify-center">
              <button
                onClick={onFeedbackTrigger}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full font-semibold text-black bg-gradient-to-r from-yellow-300 to-purple-300 hover:from-yellow-200 hover:to-purple-200 shadow-md shadow-purple-500/30 hover:scale-[1.03] active:scale-[0.98] transition-all text-xs uppercase tracking-wider"
              >
                <MessageSquareHeart className="w-4 h-4 text-purple-950" />
                Submit memoir & Feedback
              </button>

              <button
                onClick={() => setIsSimulatedConclusion(false)}
                className="text-[10px] font-mono text-purple-300 hover:text-white px-5 py-2.5 rounded-full border border-purple-500/40 hover:border-purple-400 bg-purple-950/30 hover:bg-purple-900/40 transition-all uppercase tracking-wider"
              >
                Show Live Timelines
              </button>
            </div>
          </div>
        ) : (
          /* Active Event Slide Card */
          <div className="w-full max-w-3xl flex flex-col items-center">
            {/* Live Today Badge */}
            {isLiveToday && (
              <div className="flex items-center gap-1 bg-red-600/90 text-white font-mono text-[9px] font-black uppercase px-3 py-1 rounded-full animate-pulse shadow-md shadow-red-500/40 mb-3.5">
                <Radio className="w-3 h-3 text-white animate-spin" /> Live Today
              </div>
            )}

            {/* Slider header controllers */}
            <div className="w-full flex items-center justify-between gap-1.5 px-0 sm:px-4 mb-2.5">
              <button
                onClick={handlePrev}
                id="festa-prev-btn"
                aria-label="Previous concert"
                className="p-1.5 sm:p-2 rounded-lg border border-white/10 hover:border-purple-400 bg-black/40 text-gray-300 hover:text-white transition-all cursor-pointer backdrop-blur shadow active:scale-95"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex-1 px-2 select-none">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentEvent?.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.35 }}
                    className="min-h-[56px] flex flex-col justify-center"
                  >
                    <h2 className="text-lg md:text-3xl font-sans font-extrabold text-white leading-tight uppercase tracking-tight">
                      {currentEvent?.title}
                    </h2>
                  </motion.div>
                </AnimatePresence>
              </div>

              <button
                onClick={handleNext}
                id="festa-next-btn"
                aria-label="Next concert"
                className="p-1.5 sm:p-2 rounded-lg border border-white/10 hover:border-purple-400 bg-black/40 text-gray-300 hover:text-white transition-all cursor-pointer backdrop-blur shadow active:scale-95"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Region Coordinates Metadata */}
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-purple-300 font-mono mb-4 text-shadow-sm">
              <span className="flex items-center gap-1 font-bold text-[11px] uppercase tracking-wider text-purple-200">
                <Globe className="w-3.5 h-3.5 text-purple-400" />
                {currentEvent?.city}, {currentEvent?.country}
              </span>
              <span className="text-white/20">|</span>
              <span className="flex items-center gap-1 text-[11px]">
                <Calendar className="w-3.5 h-3.5 text-purple-400" />
                {currentEvent?.date}
              </span>
              <span className="text-white/20">|</span>
              <span className="flex items-center gap-1 text-[11px]">
                <Clock className="w-3.5 h-3.5 text-purple-400" />
                {currentEvent?.time}
              </span>
            </div>

            {/* Description Text */}
            <div className="min-h-[48px] max-w-xl mx-auto mb-5">
              <AnimatePresence mode="wait">
                <motion.p
                  key={currentEvent?.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-gray-300 text-xs md:text-sm leading-relaxed"
                >
                  {currentEvent?.details}
                </motion.p>
              </AnimatePresence>
            </div>

            {/* Main Countdown Timer display */}
            {currentTimer && (
              <div className="grid grid-cols-4 gap-2.5 sm:gap-4 w-full max-w-md mb-7 relative z-20">
                {[
                  { label: 'DAYS', value: currentTimer.days },
                  { label: 'HOURS', value: currentTimer.hours },
                  { label: 'MINUTES', value: currentTimer.minutes },
                  { label: 'SECONDS', value: currentTimer.seconds }
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex flex-col items-center py-3 px-2 sm:p-4 rounded-xl border border-white/10 bg-black/40 hover:border-purple-500/40 transition-all duration-300 shadow bg-gradient-to-tr from-black/20 to-purple-950/10 hover:scale-[1.03]"
                  >
                    <span className="text-xl sm:text-3xl font-mono font-black text-white tracking-tight drop-shadow-[0_0_8px_rgba(168,85,247,0.35)]">
                      {String(item.value).padStart(2, '0')}
                    </span>
                    <span className="text-[8px] sm:text-[9px] font-black text-purple-300 tracking-widest mt-1 uppercase">
                      {item.label}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination Bullet Indicators & Settings Footer */}
            <div className="flex flex-col items-center gap-4 w-full pt-2.5 border-t border-white/5">
              <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-xs sm:max-w-md px-4">
                {activeEvents.map((evt, idx) => (
                  <button
                    key={evt.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      idx === currentIndex ? 'w-5 bg-purple-400' : 'w-1.5 bg-purple-950/80 hover:bg-purple-800'
                    }`}
                    aria-label={`Concert slide ${idx + 1}`}
                  />
                ))}
              </div>

              {/* Autoplay Status Toggle */}
              <div className="flex flex-wrap items-center justify-center gap-2 bg-black/30 p-1.5 rounded-xl border border-white/5">
                <button
                  onClick={() => setIsAutoPlaying(!isAutoPlaying)}
                  className="flex items-center gap-1 px-2.5 py-1 text-[9px] font-mono font-bold text-gray-300 hover:text-white rounded bg-white/5 border border-white/5 transition-all text-shadow-sm select-none"
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${isAutoPlaying ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                  {isAutoPlaying ? 'Carousel Autoplay: Active' : 'Carousel Autoplay: Paused'}
                </button>

                <button
                  onClick={triggerManualCelebrationBurst}
                  className="flex items-center gap-1.5 text-[9px] font-mono font-bold px-2.5 py-1 rounded bg-purple-900/10 hover:bg-purple-900/30 border border-purple-500/20 hover:border-purple-400 text-purple-300 hover:text-white transition-all pointer-events-auto"
                >
                  <Zap className="w-3 h-3 text-amber-400" /> Spark Fireworks
                </button>

                <button
                  onClick={() => setIsSimulatedConclusion(true)}
                  className="text-[9px] font-mono font-bold text-yellow-300 hover:text-white px-2.5 py-1 rounded border border-yellow-500/20 hover:border-yellow-400 bg-yellow-950/20 hover:bg-yellow-950/45 transition-all"
                >
                  Force Conclusion Card
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
