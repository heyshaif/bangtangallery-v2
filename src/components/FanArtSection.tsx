/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { FanArt } from '../types';
import { FAN_ARTS as INITIAL_ARTS } from '../data/btsData';
import { Heart, Download, Share2, ZoomIn, X, Brush } from 'lucide-react';

export default function FanArtSection() {
  const [arts, setArts] = useState<FanArt[]>([]);
  const [viewerArt, setViewerArt] = useState<FanArt | null>(null);
  const [justLikedId, setJustLikedId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/fan-arts')
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setArts(data);
        } else {
          setArts(INITIAL_ARTS);
        }
      })
      .catch(() => {
        const saved = localStorage.getItem('bts_fan_arts');
        if (saved) {
          try {
            setArts(JSON.parse(saved));
          } catch (e) {
            setArts(INITIAL_ARTS);
          }
        } else {
          setArts(INITIAL_ARTS);
        }
      });
  }, []);

  const handleLike = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    let isCurrentlyLiked = false;
    const updated = arts.map(art => {
      if (art.id === id) {
        const alreadyLiked = art.userLiked;
        isCurrentlyLiked = !alreadyLiked;
        return {
          ...art,
          userLiked: isCurrentlyLiked,
          likes: alreadyLiked ? art.likes - 1 : art.likes + 1
        };
      }
      return art;
    });

    setArts(updated);
    
    // Call server to persist
    fetch(`/api/fan-arts/like/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decrement: !isCurrentlyLiked })
    }).catch(() => {});

    localStorage.setItem('bts_fan_arts', JSON.stringify(updated));

    // Fire tiny float animation for click
    setJustLikedId(id);
    setTimeout(() => setJustLikedId(null), 800);
  };

  const handleShare = (art: FanArt, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(art.imageUrl).then(() => {
      alert(`Shared link to "${art.title}" copied to clipboard! 💜`);
    });
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="border-b border-white/5 pb-6">
        <h2 className="text-2xl md:text-3xl font-sans font-extrabold text-white">
          ARMY Digital Canvas
        </h2>
        <p className="text-gray-400 text-sm">
          A glorious exhibition of fan arts created by ARMY artists globally. Express support with likes and download wallpapers.
        </p>
      </div>

      {/* Masonry Layout */}
      <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
        {arts.map(art => (
          <div
            key={art.id}
            onClick={() => setViewerArt(art)}
            className="break-inside-avoid relative rounded-xl overflow-hidden border border-white/5 bg-black hover:border-purple-500/40 transition-all duration-300 group cursor-pointer shadow-lg"
          >
            {/* Image */}
            <img
              src={art.imageUrl}
              alt={art.title}
              className="w-full h-auto object-cover"
              referrerPolicy="no-referrer"
              loading="lazy"
            />

            {/* Float Heart Animation Overlay on Like click */}
            {justLikedId === art.id && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                <Heart className="w-16 h-16 text-rose-500 fill-rose-500 animate-ping absolute" />
                <Heart className="w-12 h-12 text-rose-500 fill-rose-500 animate-bounce" />
              </div>
            )}

            {/* Glass Overlay on Hover */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-5 flex flex-col justify-end">
              <span className="text-[10px] font-mono px-2 py-0.5 border border-purple-400/30 bg-purple-950/40 text-purple-300 rounded self-start flex items-center gap-1 mb-2">
                <Brush className="w-3 h-3 text-purple-400" /> FAN ARTIST: {art.artist}
              </span>
              
              <h3 className="font-sans font-bold text-base text-white leading-tight">
                {art.title}
              </h3>

              <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                {/* Like Button */}
                <button
                  onClick={(e) => handleLike(art.id, e)}
                  className={`flex items-center gap-1 text-xs font-mono font-bold transition-transform active:scale-90 p-1 rounded hover:bg-white/5 ${
                    art.userLiked ? 'text-rose-500' : 'text-gray-400 hover:text-white'
                  }`}
                  title="Like artwork"
                >
                  <Heart className={`w-4 h-4 ${art.userLiked ? 'fill-rose-500' : ''}`} />
                  <span>{art.likes}</span>
                </button>
                
                {/* Share & Download tools */}
                <div className="flex gap-2">
                  <button
                    onClick={(e) => handleShare(art, e)}
                    className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                    title="Copy path link"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>
                  <a
                    href={art.imageUrl}
                    target="_blank"
                    rel="noreferrer"
                    download
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 rounded hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                    title="Download conceptual vector art"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Fullscreen Art Viewer Modal */}
      {viewerArt && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between animate-fade-in select-none">
          <div className="p-4 flex items-center justify-between border-b border-white/5 bg-black/40">
            <div>
              <span className="text-[10px] font-mono text-purple-400">EXHIBITION CANVAS BY {viewerArt.artist.toUpperCase()}</span>
              <h4 className="text-white text-sm font-sans font-bold">{viewerArt.title}</h4>
            </div>

            <button
              onClick={() => setViewerArt(null)}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="relative flex-grow flex items-center justify-center p-4">
            <img
              src={viewerArt.imageUrl}
              alt={viewerArt.title}
              className="max-w-full max-h-[80vh] rounded-lg object-contain shadow-2xl"
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="p-4 border-t border-white/5 bg-black/40 flex justify-between items-center px-8 text-xs font-mono">
            <span className="text-gray-500">Artist credit: {viewerArt.artist}</span>
            <div className="flex gap-4 text-purple-400">
              <button onClick={(e) => handleLike(viewerArt.id, e)} className="hover:text-purple-300 flex items-center gap-1">
                <Heart className={`w-4 h-4 ${viewerArt.userLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
                <span>Like ({viewerArt.likes})</span>
              </button>
              <button onClick={(e) => handleShare(viewerArt, e)} className="hover:text-purple-300">Share Art</button>
              <a href={viewerArt.imageUrl} target="_blank" rel="noreferrer" download className="hover:text-purple-300">Download File</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
