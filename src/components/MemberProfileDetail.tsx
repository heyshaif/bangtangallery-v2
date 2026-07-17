/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Member } from '../types';
import { Calendar, User, Ruler, Heart, Compass, Award, Music, BookOpen, Clock, ChevronLeft, Quote } from 'lucide-react';
import { Sparkles } from './CustomSparkles';

const getHandleOrValue = (url: string, defaultValue: string) => {
  if (!url) return defaultValue;
  try {
    const trimmed = url.trim().replace(/\/$/, "");
    const parts = trimmed.split('/');
    if (parts.length > 0) {
      const last = parts[parts.length - 1];
      if (last && last.length > 2 && !last.includes('?') && !last.includes('.')) {
        return last.startsWith('@') ? last : '@' + last;
      }
    }
  } catch (e) {}
  return defaultValue;
};

const getMemberSocials = (member: Member) => {
  const customList: { platform: string; url: string; handle: string; color: string; bgColor: string }[] = [];
  
  if (member.instagramUrl) {
    customList.push({
      platform: 'Instagram',
      url: member.instagramUrl,
      handle: getHandleOrValue(member.instagramUrl, '@instagram'),
      color: 'hover:text-fuchsia-400',
      bgColor: 'bg-fuchsia-950/20 hover:bg-fuchsia-900/30'
    });
  }
  if (member.facebookUrl) {
    customList.push({
      platform: 'Facebook',
      url: member.facebookUrl,
      handle: 'Facebook Profile',
      color: 'hover:text-blue-400',
      bgColor: 'bg-blue-950/20 hover:bg-blue-900/30'
    });
  }
  if (member.youtubeUrl) {
    customList.push({
      platform: 'YouTube',
      url: member.youtubeUrl,
      handle: 'YouTube Channel',
      color: 'hover:text-red-400',
      bgColor: 'bg-red-950/20 hover:bg-red-900/30'
    });
  }
  if (member.tiktokUrl) {
    customList.push({
      platform: 'TikTok',
      url: member.tiktokUrl,
      handle: getHandleOrValue(member.tiktokUrl, '@tiktok'),
      color: 'hover:text-cyan-400',
      bgColor: 'bg-sky-950/20 hover:bg-sky-900/30'
    });
  }
  if (member.spotifyUrl) {
    customList.push({
      platform: 'Spotify',
      url: member.spotifyUrl,
      handle: 'Spotify Profile',
      color: 'hover:text-emerald-400',
      bgColor: 'bg-emerald-950/20 hover:bg-emerald-900/30'
    });
  }
  if (member.weverseUrl) {
    customList.push({
      platform: 'Weverse',
      url: member.weverseUrl,
      handle: 'Weverse Community',
      color: 'hover:text-teal-400',
      bgColor: 'bg-teal-950/20 hover:bg-teal-900/30'
    });
  }
  if (member.twitterUrl) {
    customList.push({
      platform: 'X (Twitter)',
      url: member.twitterUrl,
      handle: getHandleOrValue(member.twitterUrl, '@twitter'),
      color: 'hover:text-sky-400',
      bgColor: 'bg-slate-900/40 hover:bg-slate-800/50'
    });
  }
  if (member.websiteUrl) {
    customList.push({
      platform: 'Official Website',
      url: member.websiteUrl,
      handle: 'Visit Website',
      color: 'hover:text-purple-400',
      bgColor: 'bg-purple-950/20 hover:bg-purple-900/30'
    });
  }

  if (customList.length > 0) {
    return customList;
  }

  const lowercaseName = member.name.toLowerCase();
  if (lowercaseName.includes('rm')) {
    return [
      { platform: 'Instagram', url: 'https://instagram.com/rkive', handle: '@rkive', color: 'hover:text-fuchsia-400', bgColor: 'bg-fuchsia-950/20 hover:bg-fuchsia-900/30' },
      { platform: 'Spotify', url: 'https://open.spotify.com/artist/2d0ZjVeeptb9fSI4967v3D', handle: 'RM on Spotify', color: 'hover:text-emerald-400', bgColor: 'bg-emerald-950/20 hover:bg-emerald-900/30' },
      { platform: 'Weverse', url: 'https://weverse.io/bts/artist/rm', handle: 'RM Weverse', color: 'hover:text-teal-400', bgColor: 'bg-teal-950/20 hover:bg-teal-900/30' }
    ];
  }
  if (lowercaseName.includes('jin')) {
    return [
      { platform: 'Instagram', url: 'https://instagram.com/jin', handle: '@jin', color: 'hover:text-fuchsia-400', bgColor: 'bg-fuchsia-950/20 hover:bg-fuchsia-900/30' },
      { platform: 'Spotify', url: 'https://open.spotify.com/artist/5vA3Ls9vRvaZ0S76Yv969s', handle: 'Jin on Spotify', color: 'hover:text-emerald-400', bgColor: 'bg-emerald-950/20 hover:bg-emerald-900/30' },
      { platform: 'Weverse', url: 'https://weverse.io/bts/artist/jin', handle: 'Jin Weverse', color: 'hover:text-teal-400', bgColor: 'bg-teal-950/20 hover:bg-teal-900/30' }
    ];
  }
  if (lowercaseName.includes('suga')) {
    return [
      { platform: 'Instagram', url: 'https://instagram.com/agustd', handle: '@agustd', color: 'hover:text-fuchsia-400', bgColor: 'bg-fuchsia-950/20 hover:bg-fuchsia-900/30' },
      { platform: 'Spotify', url: 'https://open.spotify.com/artist/773vUnv79IQ6S0S3uLY77d', handle: 'Agust D on Spotify', color: 'hover:text-emerald-400', bgColor: 'bg-emerald-950/20 hover:bg-emerald-900/30' },
      { platform: 'Weverse', url: 'https://weverse.io/bts/artist/suga', handle: 'SUGA Weverse', color: 'hover:text-teal-400', bgColor: 'bg-teal-950/20 hover:bg-teal-900/30' }
    ];
  }
  if (lowercaseName.includes('hope')) {
    return [
      { platform: 'Instagram', url: 'https://instagram.com/uarmyhope', handle: '@uarmyhope', color: 'hover:text-fuchsia-400', bgColor: 'bg-fuchsia-950/20 hover:bg-fuchsia-900/30' },
      { platform: 'Spotify', url: 'https://open.spotify.com/artist/0b186v6gZshveZ7gU7v97e', handle: 'j-hope on Spotify', color: 'hover:text-emerald-400', bgColor: 'bg-emerald-950/20 hover:bg-emerald-900/30' },
      { platform: 'Weverse', url: 'https://weverse.io/bts/artist/j_hope', handle: 'j-hope Weverse', color: 'hover:text-teal-400', bgColor: 'bg-teal-950/20 hover:bg-teal-900/30' }
    ];
  }
  if (lowercaseName.includes('jimin')) {
    return [
      { platform: 'Instagram', url: 'https://instagram.com/j.m', handle: '@j.m', color: 'hover:text-fuchsia-400', bgColor: 'bg-fuchsia-950/20 hover:bg-fuchsia-900/30' },
      { platform: 'Spotify', url: 'https://open.spotify.com/artist/163tK9879u7vXg6vTI46z0', handle: 'Jimin on Spotify', color: 'hover:text-emerald-400', bgColor: 'bg-emerald-950/20 hover:bg-emerald-900/30' },
      { platform: 'Weverse', url: 'https://weverse.io/bts/artist/jimin', handle: 'Jimin Weverse', color: 'hover:text-teal-400', bgColor: 'bg-teal-950/20 hover:bg-teal-900/30' }
    ];
  }
  if (lowercaseName.includes('v') || lowercaseName === 'v') {
    return [
      { platform: 'Instagram', url: 'https://instagram.com/thv', handle: '@thv', color: 'hover:text-fuchsia-400', bgColor: 'bg-fuchsia-950/20 hover:bg-fuchsia-900/30' },
      { platform: 'Spotify', url: 'https://open.spotify.com/artist/3Js7i7b09vT7S593Y6CshV', handle: 'V on Spotify', color: 'hover:text-emerald-400', bgColor: 'bg-emerald-950/20 hover:bg-emerald-900/30' },
      { platform: 'Weverse', url: 'https://weverse.io/bts/artist/v', handle: 'V Weverse', color: 'hover:text-teal-400', bgColor: 'bg-teal-950/20 hover:bg-teal-900/30' }
    ];
  }
  // Default to Jung Kook
  return [
    { platform: 'Spotify', url: 'https://open.spotify.com/artist/6Ha97v48vCuR7Oiyvt8Ost', handle: 'Jung Kook on Spotify', color: 'hover:text-emerald-400', bgColor: 'bg-emerald-950/20 hover:bg-emerald-900/30' },
    { platform: 'TikTok', url: 'https://www.tiktok.com/@jungkook', handle: '@jungkook', color: 'hover:text-cyan-400', bgColor: 'bg-sky-950/20 hover:bg-sky-900/30' },
    { platform: 'Weverse', url: 'https://weverse.io/bts/artist/jungkook', handle: 'Jung Kook Weverse', color: 'hover:text-teal-400', bgColor: 'bg-teal-950/20 hover:bg-teal-900/30' }
  ];
};

interface MemberProfileDetailProps {
  member: Member;
  onBack: () => void;
}

export default function MemberProfileDetail({ member, onBack }: MemberProfileDetailProps) {
  return (
    <div className="w-full max-w-5xl mx-auto rounded-2xl border border-white/5 bg-black/70 backdrop-blur-2xl shadow-2xl overflow-hidden animate-fade-in">
      
      {/* Back Header Bar */}
      <div className="p-4 border-b border-white/5 flex items-center bg-black/40">
        <button
          onClick={onBack}
          id="member-profile-back-btn"
          className="flex items-center gap-2 text-sm font-medium text-purple-400 hover:text-purple-300 transition-all cursor-pointer group"
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Back to Members
        </button>
      </div>

      {/* Hero Banner with Avatar overlapping */}
      <div className="relative h-64 md:h-80 w-full overflow-hidden">
        <img
          src={member.bannerUrl}
          alt={`${member.name} Banner`}
          className="w-full h-full object-cover filter brightness-[0.4]"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent" />
        
        {/* Name and Title overlays on banner */}
        <div className="absolute bottom-6 left-6 md:left-12 flex flex-col md:flex-row items-start md:items-end gap-6 z-10">
          <div className="relative group">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-purple-500 to-rose-500 opacity-70 blur-md group-hover:opacity-100 transition-opacity" />
            <img
              src={member.portraitUrl}
              alt={`${member.name} Portrait`}
              className="relative w-28 h-28 md:w-36 md:h-36 rounded-full object-cover border-2 border-purple-400 shadow-xl"
              referrerPolicy="no-referrer"
            />
          </div>
          
          <div className="mb-2">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="text-3xl md:text-5xl font-sans font-black text-white hover:text-purple-300 transition-colors">
                {member.name}
              </span>
              <span className="text-2xl md:text-3xl animate-bounce" style={{ animationDuration: '4s' }}>
                {member.emoji}
              </span>
            </div>
            <p className="text-purple-300 font-mono text-xs md:text-sm tracking-wider uppercase">
              {member.fullName} | {member.position.join(' & ')}
            </p>
          </div>
        </div>
      </div>

      <div className="p-6 md:p-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Quick Stats Cards */}
        <div className="lg:col-span-1 space-y-6">
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5 space-y-4">
            <h3 className="text-sm font-mono font-bold text-purple-300 flex items-center gap-2 border-b border-white/5 pb-2 uppercase tracking-widest">
              <User className="w-4 h-4" /> Personal Stats
            </h3>
            
            <div className="space-y-3 font-sans text-sm text-gray-300">
              <div className="flex justify-between items-center bg-white/[0.01] p-2.5 rounded-lg border border-white/[0.03]">
                <span className="text-gray-400 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Birthday</span>
                <span className="font-medium text-white">{member.birthday}</span>
              </div>
              <div className="flex justify-between items-center bg-white/[0.01] p-2.5 rounded-lg border border-white/[0.03]">
                <span className="text-gray-400 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Age</span>
                <span className="font-medium text-white">{member.age} years old</span>
              </div>
              <div className="flex justify-between items-center bg-white/[0.01] p-2.5 rounded-lg border border-white/[0.03]">
                <span className="text-gray-400 flex items-center gap-1.5"><Ruler className="w-3.5 h-3.5" /> Height</span>
                <span className="font-medium text-white">{member.height}</span>
              </div>
              <div className="flex justify-between items-center bg-white/[0.01] p-2.5 rounded-lg border border-white/[0.03]">
                <span className="text-gray-400 flex items-center gap-1.5"><Heart className="w-3.5 h-3.5" /> Blood Group</span>
                <span className="font-semibold text-rose-400">{member.bloodGroup}</span>
              </div>
              <div className="flex justify-between items-center bg-white/[0.01] p-2.5 rounded-lg border border-white/[0.03]">
                <span className="text-gray-400 flex items-center gap-1.5"><Compass className="w-3.5 h-3.5" /> MBTI</span>
                <span className="font-semibold text-amber-400 uppercase tracking-widest">{member.mbti}</span>
              </div>
            </div>
          </div>

          {/* Social Channels Section */}
          <div className="rounded-xl border border-white/5 bg-white/[0.02] p-5 space-y-4 shadow-xl">
            <h3 className="text-sm font-mono font-bold text-purple-300 flex items-center gap-2 border-b border-white/5 pb-2 uppercase tracking-widest">
              <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" /> Official Socials & Links
            </h3>
            <div className="space-y-2 font-sans text-xs">
              {getMemberSocials(member).map((soc, i) => (
                <a
                  key={i}
                  href={soc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center justify-between p-3 rounded-xl border border-white/5 transition-all text-gray-300 hover:text-white group cursor-pointer ${soc.bgColor} ${soc.color} shadow-sm`}
                >
                  <span className="font-semibold uppercase tracking-wider text-[10px]">{soc.platform}</span>
                  <span className="font-mono text-gray-400 group-hover:text-white truncate max-w-[140px]">{soc.handle}</span>
                </a>
              ))}
            </div>
          </div>

          {/* Quotes Section */}
          <div className="rounded-xl border border-purple-500/10 bg-purple-950/10 p-5 space-y-4">
            <h3 className="text-sm font-mono font-bold text-purple-300 flex items-center gap-2 border-b border-white/5 pb-2 uppercase tracking-widest">
              <Quote className="w-4 h-4" /> Message to ARMY
            </h3>
            <div className="space-y-4">
              {member.quotes.map((quote, idx) => (
                <div key={idx} className="relative pl-6 py-1 italic text-gray-300 text-xs md:text-sm leading-relaxed border-l-2 border-purple-400/50">
                  <span className="absolute left-1.5 top-0 text-purple-500/30 text-3xl font-serif leading-none">&ldquo;</span>
                  {quote}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Columns: Bio, Facts, Timeline and Solo Career */}
        <div className="lg:col-span-2 space-y-8 font-sans">
          
          {/* Introduction Text (Dynamic Highlight Banner) */}
          {member.introductionText && (
            <div className="p-5 rounded-xl border border-purple-500/25 bg-gradient-to-r from-purple-950/20 to-indigo-950/20 text-purple-200 text-sm md:text-base italic leading-relaxed font-sans shadow-md">
              <span className="text-purple-400 text-2xl font-serif leading-none mr-2">&ldquo;</span>
              {member.introductionText}
              <span className="text-purple-400 text-2xl font-serif leading-none ml-2">&rdquo;</span>
            </div>
          )}

          {/* Biography */}
          <div className="space-y-3">
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-purple-400" /> Biography
            </h2>
            <p className="text-gray-300 text-sm md:text-base leading-relaxed p-4 rounded-xl bg-white/[0.01] border border-white/5 whitespace-pre-line">
              {member.biography}
            </p>
          </div>

          {/* Description (Dynamic Bio Appendix) */}
          {member.description && (
            <div className="space-y-3 animate-fade-in">
              <h3 className="text-xs font-mono text-purple-400 uppercase tracking-widest font-bold">Comprehensive Overview</h3>
              <p className="text-gray-400 text-xs md:text-sm leading-relaxed p-4 rounded-xl bg-black/45 border border-purple-500/10 whitespace-pre-line">
                {member.description}
              </p>
            </div>
          )}

          {/* Discography & Solo Works */}
          <div className="space-y-3">
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <Music className="w-5 h-5 text-rose-400" /> Solos & Releases
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {member.soloActivities.map((act, idx) => (
                <div key={idx} className="flex items-start gap-2.5 p-3 rounded-lg bg-white/[0.02] border border-white/5 hover:border-purple-500/20 transition-all">
                  <div className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 flex-shrink-0" />
                  <span className="text-sm text-gray-300">{act}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Awards */}
          <div className="space-y-3">
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-400" /> Key Awards & Honours
            </h2>
            <div className="space-y-2">
              {member.awards.map((aw, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/10 text-amber-300 text-sm">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{aw}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Fun Facts Accordion Details */}
          <div className="space-y-3">
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" /> Fun Trivia Facts
            </h2>
            <div className="space-y-2.5">
              {member.funFacts.map((fact, idx) => (
                <div key={idx} className="p-3.5 rounded-lg bg-purple-950/5 border border-purple-950/20 text-gray-300 text-xs md:text-sm flex gap-3">
                  <span className="text-purple-400 font-mono font-bold">#{idx + 1}</span>
                  <span>{fact}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Internal Member Timeline */}
          <div className="space-y-4 pt-4 border-t border-white/5">
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <Clock className="w-5 h-5 text-emerald-400" /> Career Journey
            </h2>
            <div className="space-y-4 pl-2">
              {member.timeline.map((event, idx) => (
                <div key={idx} className="flex gap-4 relative pb-4 border-l border-white/10 last:border-0 pl-4 last:pb-0">
                  <div className="absolute -left-[5px] top-1.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-black shadow" />
                  <div>
                    <span className="text-xs font-mono font-bold text-emerald-300 bg-emerald-900/20 px-2 py-0.5 rounded border border-emerald-500/15">
                      {event.year}
                    </span>
                    <p className="text-sm text-gray-300 mt-1.5">{event.event}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Member Personal Portrait Gallery */}
          <div className="space-y-4">
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Aesthetic Moments
            </h2>
            <div className="grid grid-cols-2 gap-4">
              {member.gallery.map((imgUrl, itemIdx) => (
                <div key={itemIdx} className="group rounded-xl overflow-hidden border border-white/5 bg-white/[0.01] hover:border-purple-500/30 transition-all">
                  <img
                    src={imgUrl}
                    alt={`${member.name} Gallery Shot`}
                    className="w-full h-40 md:h-52 object-cover transition-transform group-hover:scale-105 duration-500"
                    referrerPolicy="no-referrer"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Highlighted Youtube Videos */}
          <div className="space-y-4">
            <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              Solo Performance Spotlight
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {member.videoIds.map((vid, idx) => (
                <div key={idx} className="rounded-xl overflow-hidden aspect-video border border-white/10 shadow bg-black relative">
                  <iframe
                    src={`https://www.youtube.com/embed/${vid}`}
                    title={`${member.name} Spotlight Video`}
                    className="w-full h-full"
                    allowFullScreen
                  />
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
