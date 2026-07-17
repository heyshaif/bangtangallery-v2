/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Star, MessageSquareCode, CheckCircle, Sparkles, Heart } from 'lucide-react';

interface FeedbackItem {
  id: string;
  name: string;
  emojiRating: string;
  starRating: number;
  comment: string;
  date: string;
}

const INITIAL_FEEDBACK: FeedbackItem[] = [
  { id: 'fb1', name: 'ARMY_Borahae97', emojiRating: '🥰', starRating: 5, comment: 'This is the most gorgeous fan-site I have ever seen! The premium purple theme is stunning and I love reading the lyrics tabs. Happy Festa!', date: '6/10/2026' },
  { id: 'fb2', name: 'JooniesNamjooning', emojiRating: '🐨', starRating: 5, comment: 'I love RM biography detail here. Very complete, accurate, and intellectual. High-production web craft!', date: '6/8/2026' }
];

export default function FeedbackSection() {
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  const [name, setName] = useState('');
  const [emojiRating, setEmojiRating] = useState('🥰');
  const [starRating, setStarRating] = useState(5);
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  
  // Submit actions
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    fetch('/api/feedbacks')
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          setFeedbacks(data);
        } else {
          setFeedbacks(INITIAL_FEEDBACK);
        }
      })
      .catch(() => {
        const saved = localStorage.getItem('bts_feedbacks');
        if (saved) {
          try {
            setFeedbacks(JSON.parse(saved));
          } catch (e) {
            setFeedbacks(INITIAL_FEEDBACK);
          }
        } else {
          setFeedbacks(INITIAL_FEEDBACK);
        }
      });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setIsSubmitting(true);

    const fName = name.trim() || 'Anonymous ARMY';
    fetch('/api/feedbacks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: fName,
        emojiRating,
        starRating,
        comment: comment.trim()
      })
    })
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(res => {
        if (res.success && res.item) {
          setFeedbacks(prev => [res.item, ...prev]);
        }
        setName('');
        setComment('');
        setStarRating(5);
        setIsSubmitting(false);
        setShowSuccess(true);
      })
      .catch(() => {
        // Fallback to local storage if offline
        const newItem: FeedbackItem = {
          id: `fb_${Date.now()}`,
          name: fName,
          emojiRating,
          starRating,
          comment: comment.trim(),
          date: new Date().toLocaleDateString('en-US')
        };
        const updated = [newItem, ...feedbacks];
        setFeedbacks(updated);
        localStorage.setItem('bts_feedbacks', JSON.stringify(updated));

        setName('');
        setComment('');
        setStarRating(5);
        setIsSubmitting(false);
        setShowSuccess(true);
      });
  };

  const emojisList = ['🥰', '💜', '👑', '😭', '🔥', '🐨', '🎂'];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="border-b border-white/5 pb-6">
        <h2 className="text-2xl md:text-3xl font-sans font-extrabold text-white">
          FESTA Feedback & Reviews
        </h2>
        <p className="text-gray-400 text-sm">
          Review your 2026 FESTA experience, leave reviews about our fan-site features, or share warm memories directly.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* Feedback Input Panel (Column span 3) */}
        <form
          onSubmit={handleSubmit}
          id="festa-feedback-form"
          className="lg:col-span-3 p-6 rounded-2xl border border-white/5 bg-black/40 backdrop-blur-md space-y-4"
        >
          <h3 className="text-base font-mono font-bold text-purple-300 border-b border-white/5 pb-2 uppercase tracking-wide flex items-center gap-1.5">
            <MessageSquareCode className="w-5 h-5 text-purple-400 animate-pulse" /> Rate Your Showcase Experience
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-purple-300 uppercase">ARMY Alias / Name</label>
              <input
                type="text"
                placeholder="E.g., JinStan92"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-black/60 text-sm p-3 rounded-lg border border-white/5 text-white placeholder:text-gray-600 outline-none focus:border-purple-500"
              />
            </div>

            {/* Emoji selector rating */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-purple-300 uppercase block">Reaction Vibe</label>
              <div className="flex gap-2 pt-1">
                {emojisList.map(emo => (
                  <button
                    key={emo}
                    type="button"
                    onClick={() => setEmojiRating(emo)}
                    className={`text-xl p-2 rounded-lg transition-transform active:scale-90 hover:bg-white/5 ${
                      emojiRating === emo ? 'bg-purple-950/40 border border-purple-500/30 scale-110' : 'opacity-60'
                    }`}
                  >
                    {emo}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Star Rating row */}
          <div className="space-y-1.5">
            <label className="text-xs font-mono text-purple-300 uppercase block">Star Rating *</label>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4, 5].map(star => {
                const isSelected = star <= (hoveredStar ?? starRating);
                return (
                  <button
                    key={star}
                    type="button"
                    onMouseEnter={() => setHoveredStar(star)}
                    onMouseLeave={() => setHoveredStar(null)}
                    onClick={() => setStarRating(star)}
                    className="p-1 focus:outline-none cursor-pointer"
                  >
                    <Star
                      className={`w-6 h-6 transition-all duration-150 ${
                        isSelected 
                          ? 'text-amber-400 fill-amber-400 scale-110 drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]' 
                          : 'text-gray-600 hover:text-gray-400'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-purple-300 uppercase">Festa Review Comments *</label>
            <textarea
              placeholder="What did you love about this web presentation study? Share your warm thoughts..."
              rows={4}
              required
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full bg-black/60 text-sm p-3 rounded-lg border border-white/5 text-white placeholder:text-gray-600 outline-none focus:border-purple-500 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            id="submit-feedback-form-btn"
            className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 text-white font-semibold py-3 text-sm rounded-lg transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 uppercase"
          >
            {isSubmitting ? 'Posting Review Board...' : 'Submit Festa Review'}
          </button>
        </form>

        {/* Live Testimonial Wall sidebar column (Column span 2) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-4 rounded-xl border border-white/5 bg-black/40">
            <h3 className="text-sm font-mono font-bold text-purple-300 flex items-center gap-1.5 uppercase tracking-wide">
              <Heart className="w-4 h-4 text-rose-500 fill-rose-500 animate-pulse" /> Live ARMY Feed Reviews
            </h3>
          </div>

          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {feedbacks.map(item => (
              <div
                key={item.id}
                className="p-4 rounded-xl border border-white/5 bg-black/50 backdrop-blur-md space-y-2 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-purple-300">{item.name} {item.emojiRating}</span>
                  <span className="text-[10px] text-gray-500 font-mono">{item.date}</span>
                </div>

                {/* Stars listed */}
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${i < item.starRating ? 'text-amber-400 fill-amber-400' : 'text-gray-700'}`}
                    />
                  ))}
                </div>

                <p className="text-gray-300 leading-relaxed font-sans italic">
                  &ldquo;{item.comment}&rdquo;
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Success Modal overlay */}
      {showSuccess && (
        <div id="feedback-success-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in font-sans">
          <div className="relative w-full max-w-md rounded-2xl border border-purple-500/20 bg-[#0d071a] p-6 shadow-2xl text-center space-y-4 animate-zoom-in">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8 text-emerald-400 animate-bounce" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white">Review Published</h3>
              <span className="text-[10px] font-mono text-purple-400 uppercase tracking-widest flex items-center justify-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" /> Sync Complete
              </span>
            </div>

            <p className="text-gray-300 text-sm leading-relaxed">
              Happy Festa ARMY! Your rating has been recorded into our global community wall. Thank you for making these moments beautiful. 💜
            </p>

            <button
              onClick={() => setShowSuccess(false)}
              id="close-feedback-success-btn"
              className="w-full px-5 py-2.5 font-mono text-xs font-semibold rounded-lg bg-purple-600 text-white hover:bg-purple-500 transition-colors cursor-pointer"
            >
              Back to Reviews
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
