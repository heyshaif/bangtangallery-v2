/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useId } from 'react';
import { NewsArticle } from '../types';
import AdsterraAd from './AdsterraAd';
import { NEWS_ARTICLES } from '../data/btsData';
import { Search, ChevronLeft, CalendarDays, X, BookOpen, Share2, Clock, User, ArrowRight, MessageCircle, Send } from 'lucide-react';
import { useBackend } from '../context/BackendContext';

function CopyButton({ shareUrl }: { shareUrl: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="text-gray-400 hover:text-purple-400 transition-colors flex items-center gap-1 text-[10px] font-mono font-bold cursor-pointer"
      title="Copy Link"
    >
      <Share2 className="w-3.5 h-3.5" />
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

// Interactive gallery displaying 2 to 10 images with high-fidelity lightbox
function ArticleGallery({ images }: { images?: string[] }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (!images || images.length === 0) return null;
  const validImages = images.filter(url => url && url.trim() !== "");
  if (validImages.length === 0) return null;

  return (
    <div className="space-y-3 my-6 p-4 md:p-6 bg-purple-950/15 border border-purple-500/10 rounded-2xl font-sans">
      <div className="flex justify-between items-center border-b border-purple-500/10 pb-2">
        <h4 className="text-[11px] font-mono font-bold tracking-widest text-purple-300 uppercase">Editorial News Gallery</h4>
        <span className="text-[10px] font-mono text-purple-400 font-semibold">{validImages.length} Exclusive Photos</span>
      </div>

      <div 
        className="relative aspect-[16/10] rounded-xl overflow-hidden group cursor-zoom-in bg-black/60 border border-white/5"
        onClick={() => setLightboxOpen(true)}
      >
        <img 
          src={validImages[activeIdx]} 
          alt={`Gallery ${activeIdx + 1}`} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.01]"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent p-4 flex justify-between items-center">
          <span className="text-xs font-mono text-zinc-300 font-medium">Photo {activeIdx + 1} of {validImages.length}</span>
          <span className="text-[10px] font-mono text-purple-300 bg-purple-950/80 px-2 py-0.5 rounded border border-purple-500/25 opacity-0 group-hover:opacity-100 transition-opacity">Expand Photo ⛶</span>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 select-scrollbar">
        {validImages.map((img, idx) => (
          <button
            key={idx}
            onClick={() => setActiveIdx(idx)}
            className={`w-16 h-12 md:w-20 md:h-14 rounded-lg overflow-hidden border shrink-0 transition-all ${
              activeIdx === idx 
                ? 'border-purple-500 ring-2 ring-purple-500/20 scale-95' 
                : 'border-white/5 hover:border-purple-500/25 opacity-70 hover:opacity-100'
            }`}
          >
            <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </button>
        ))}
      </div>

      {lightboxOpen && (
        <div className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-4" onClick={() => setLightboxOpen(false)}>
          <button 
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 p-2 bg-white/5 hover:bg-white/10 text-white rounded-full transition-colors cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
          <div className="relative max-w-4xl max-h-[80vh] w-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setActiveIdx((activeIdx - 1 + validImages.length) % validImages.length)}
              className="absolute left-2 md:left-4 p-3 bg-black/70 border border-white/10 hover:bg-black text-white rounded-full transition-all shrink-0 z-10 cursor-pointer font-bold"
            >
              &larr;
            </button>
            <img 
              src={validImages[activeIdx]} 
              alt="" 
              className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
              referrerPolicy="no-referrer"
            />
            <button
              onClick={() => setActiveIdx((activeIdx + 1) % validImages.length)}
              className="absolute right-2 md:right-4 p-3 bg-black/70 border border-white/10 hover:bg-black text-white rounded-full transition-all shrink-0 z-10 cursor-pointer font-bold"
            >
              &rarr;
            </button>
          </div>
          <div className="mt-4 text-center text-xs font-mono text-zinc-400 bg-purple-950/40 border border-purple-500/10 px-3 py-1 rounded-full">
            Photo {activeIdx + 1} of {validImages.length}
          </div>
        </div>
      )}
    </div>
  );
}

interface NewsComment {
  id: string;
  articleId: string;
  username: string;
  displayName: string;
  content: string;
  timestamp: string;
  parentId: string | null;
}

function NewsCommentsSection({ articleId, articleTitle }: { articleId: string; articleTitle: string }) {
  const { currentUser, registerUser } = useBackend();
  const [comments, setComments] = useState<NewsComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // In-line credentials fallback
  const [usernameInput, setUsernameInput] = useState('');
  const [displayNameInput, setDisplayNameInput] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/news/comments?articleId=${encodeURIComponent(articleId)}`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (err) {
      console.error('Failed to fetch news comments:', err);
    }
  };

  useEffect(() => {
    fetchComments();
  }, [articleId]);

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    let activeUser = currentUser;

    if (!activeUser) {
      if (!usernameInput.trim() || !displayNameInput.trim()) {
        alert('Please pick a username and display name first! 💜');
        return;
      }
      setIsRegistering(true);
      const cleanUsername = usernameInput.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
      const success = await registerUser(cleanUsername, displayNameInput.trim());
      setIsRegistering(false);
      if (success) {
        activeUser = { username: cleanUsername, displayName: displayNameInput.trim(), avatarUrl: '' };
      } else {
        alert('Could not register that username. Please try another!');
        return;
      }
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/news/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          articleId,
          articleTitle,
          username: activeUser.username,
          displayName: activeUser.displayName,
          content: commentText.trim()
        })
      });
      if (res.ok) {
        setCommentText('');
        fetchComments();
      }
    } catch (err) {
      console.error('Failed to submit news comment:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-12 pt-8 border-t border-purple-500/15 space-y-6">
      <div className="flex items-center gap-2.5">
        <MessageCircle className="w-5 h-5 text-purple-400" />
        <h3 className="text-base md:text-lg font-bold text-white uppercase tracking-wider font-sans">
          Fandom Reactions ({comments.length})
        </h3>
      </div>

      {/* List of comments */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <div className="py-8 text-center text-zinc-500 text-xs font-mono">
            No comments yet. Write down your ARMY response first! 💜
          </div>
        ) : (
          comments.map(comment => {
            return (
              <div key={comment.id} className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/10 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-xs font-extrabold text-purple-300 shrink-0">
                      {comment.displayName ? comment.displayName.slice(0, 1).toUpperCase() : 'A'}
                    </div>
                    <div>
                      <span className="text-xs font-extrabold text-white block leading-tight">
                        {comment.displayName}
                      </span>
                      <span className="text-[10px] text-purple-400 font-mono block">
                        @{comment.username}
                      </span>
                    </div>
                  </div>
                  <span className="text-[9px] text-zinc-500 font-mono">
                    {new Date(comment.timestamp).toLocaleDateString()}
                  </span>
                </div>

                <p className="text-xs md:text-sm text-zinc-300 pl-1 leading-relaxed whitespace-pre-line">
                  {comment.content}
                </p>
              </div>
            );
          })
        )}
      </div>

      {/* Main post comment form */}
      <form onSubmit={handlePostComment} className="p-4 rounded-xl bg-black/45 border border-purple-500/10 space-y-4">
        <h4 className="text-xs font-mono font-bold text-purple-300 uppercase tracking-widest block leading-none">
          Leave a comment
        </h4>

        {!currentUser && (
          <div className="p-3 rounded-lg bg-purple-950/20 border border-purple-500/10 space-y-3">
            <span className="text-[10px] font-mono text-purple-300 block font-bold leading-normal">
              💜 Pick a fandom handle and pen name to join the comment thread:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] font-mono text-zinc-400 block mb-1 font-bold uppercase tracking-wider">Username Handle</label>
                <input
                  type="text"
                  placeholder="e.g. suga_rebel (letters/numbers/underscores)"
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="w-full bg-black/50 text-xs px-3 py-2.5 rounded-lg border border-white/5 text-white outline-none focus:border-purple-500 font-sans"
                />
              </div>
              <div>
                <label className="text-[9px] font-mono text-zinc-400 block mb-1 font-bold uppercase tracking-wider">ARMY Pen Name</label>
                <input
                  type="text"
                  placeholder="e.g. AgustD Fansite"
                  value={displayNameInput}
                  onChange={(e) => setDisplayNameInput(e.target.value)}
                  className="w-full bg-black/50 text-xs px-3 py-2.5 rounded-lg border border-white/5 text-white outline-none focus:border-purple-500 font-sans"
                />
              </div>
            </div>
          </div>
        )}

        {currentUser && (
          <div className="flex items-center gap-2 text-xs font-sans text-purple-300 bg-purple-950/25 px-3 py-2 rounded-lg border border-purple-500/10">
            <span className="relative flex h-1.5 w-1.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-purple-500"></span>
            </span>
            <span>Commenting as: <strong className="text-white">{currentUser.displayName}</strong> (@{currentUser.username})</span>
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Share your thoughts about this article..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            className="flex-grow bg-black/60 text-xs px-4 py-3 rounded-xl border border-purple-500/20 focus:border-purple-500/50 outline-none text-white placeholder:text-zinc-600 font-sans"
          />
          <button
            type="submit"
            disabled={isLoading || isRegistering}
            className="p-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-md shadow-purple-500/10 disabled:opacity-50 shrink-0 flex items-center justify-center"
            title="Post Comment"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}

interface NewsSectionProps {
  items?: NewsArticle[];
  selectedArticleIdOrSlug?: string | null;
  onSelectArticle?: (slug: string | null) => void;
  relatedTopics?: string[];
}

export default function NewsSection({ items, selectedArticleIdOrSlug, onSelectArticle, relatedTopics }: NewsSectionProps) {
  const displayArticles = (items && items.length > 0) ? items : NEWS_ARTICLES;
  const getSlug = (title: string) => title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

  const [internalSelectedArticle, setInternalSelectedArticle] = useState<NewsArticle | null>(null);
  const selectedArticle = selectedArticleIdOrSlug 
    ? (displayArticles.find(a => a.id === selectedArticleIdOrSlug || getSlug(a.title) === selectedArticleIdOrSlug || a.slug === selectedArticleIdOrSlug) || null)
    : internalSelectedArticle;

  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');

  const categoryPills = ['All', 'Announcement', 'Comeback', 'Schedule', 'Award', 'Festa'];
  const popularTags = ['#BTS2026', '#Comeback', '#Taehyung', '#Jungkook', '#FESTA2026', '#WorldTour', '#Billboard', '#CelineShow'];

  // Sub-filtering
  const filteredArticles = displayArticles.filter(art => {
    if (art.published === false) return false;
    const matchesSearch = art.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      art.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (art.content || '').toLowerCase().includes(searchTerm.toLowerCase());
    if (activeCategory === 'All') return matchesSearch;
    return art.category === activeCategory && matchesSearch;
  });

  const handleReadArticle = (art: NewsArticle) => {
    if (onSelectArticle) {
      onSelectArticle(art.slug || getSlug(art.title) || art.id);
    } else {
      setInternalSelectedArticle(art);
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackToGrid = () => {
    if (onSelectArticle) {
      onSelectArticle(null);
    } else {
      setInternalSelectedArticle(null);
    }
  };

  // Authors & Reading Time Helpers
  const getAuthorName = (articleId: string, title: string = "") => {
    return "By Admin";
  };

  const getReadingTime = (content: string = "", summary: string = "") => {
    const words = (content || summary || "").split(/\s+/).filter(Boolean).length;
    const minutes = Math.max(3, Math.ceil(words / 180));
    return `${minutes} min read`;
  };

  const heroArticle = filteredArticles[0];
  const gridArticles = filteredArticles.slice(1);
  const trendingArticles = displayArticles.slice(0, 5);

  const renderContentWithAds = (content: string) => {
    if (!content) return null;
    const paragraphs = content.split('\n\n').filter(Boolean);
    return (
      <div className="space-y-4">
        {paragraphs.map((p, idx) => (
          <p key={idx} className="leading-relaxed text-zinc-300 text-sm md:text-base">{p}</p>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fade-in font-sans">
      {!selectedArticle ? (
        <>
          {/* Magazine Brand Header Block */}
          <div className="text-center py-10 border-b border-white/5 space-y-3">
            <div className="flex justify-center items-center gap-2">
              <span className="h-px w-8 bg-purple-500/50"></span>
              <span className="text-purple-400 font-mono text-[10px] uppercase tracking-[0.3em] font-bold">Bangtan Editorial Portal</span>
              <span className="h-px w-8 bg-purple-500/50"></span>
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white uppercase font-serif font-black">
              BANGTAN GALLERY NEWS PORTAL
            </h1>
            <p className="text-xs text-gray-400 font-mono max-w-lg mx-auto leading-relaxed">
              Your premium daily destination for verified schedules, fashion reports, exclusive comeback logs, and ARMY news.
            </p>
          </div>

          {/* Search, Categories, and Tags Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
            <div className="flex gap-1.5 flex-wrap overflow-x-auto select-scrollbar py-1">
              {categoryPills.map(cat => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3.5 py-1 rounded-full font-mono text-[10px] uppercase tracking-wider transition-all cursor-pointer ${
                    activeCategory === cat
                      ? 'bg-purple-600 text-white font-extrabold border border-purple-500/30'
                      : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white border border-white/5'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Premium Search input */}
            <div className="relative w-full md:w-64 shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-purple-400/60" />
              <input
                type="text"
                placeholder="Search headlines..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-black/45 border border-white/5 focus:border-purple-500/30 focus:outline-none rounded-lg text-xs font-mono text-white placeholder-gray-500 transition-colors"
              />
            </div>
          </div>

          {filteredArticles.length === 0 ? (
            <div className="text-center py-16 rounded-xl border border-dashed border-white/5 bg-white/[0.01]">
              <p className="text-gray-400 font-mono text-xs">No editorial broadcasts match your search parameters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Left Column: Hero Article & Magazine Grid */}
              <div className="lg:col-span-3 space-y-10">
                {/* Large Featured Hero Article (Vogue-Style) */}
                {heroArticle && (
                  <div 
                    onClick={() => handleReadArticle(heroArticle)}
                    className="group relative rounded-2xl overflow-hidden border border-white/5 bg-gradient-to-b from-[#110924] to-[#04010a] shadow-xl hover:border-purple-500/20 transition-all duration-300 cursor-pointer"
                  >
                    <div className="aspect-[21/10] md:max-h-[380px] w-full overflow-hidden relative">
                      <img 
                        src={heroArticle.imageUrl} 
                        alt={heroArticle.title} 
                        className="w-full h-full object-cover transition-transform group-hover:scale-101 duration-700"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
                      <span className="absolute top-4 left-4 text-[9px] font-mono px-2 py-0.5 rounded-full border border-purple-400/35 bg-purple-950/80 text-purple-300 font-bold uppercase tracking-wider">
                        ★ {heroArticle.category}
                      </span>
                    </div>

                    <div className="p-6 md:p-8 -mt-16 relative z-10 space-y-4">
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-mono text-zinc-400 font-semibold">
                        <span className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5 text-purple-400" /> {heroArticle.date}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-purple-400" /> {getReadingTime(heroArticle.content, heroArticle.summary)}</span>
                        <span className="flex items-center gap-1 text-purple-300 uppercase"><User className="w-3.5 h-3.5" /> {getAuthorName(heroArticle.id, heroArticle.title)}</span>
                      </div>

                      <h2 className="text-xl md:text-3xl font-extrabold text-white group-hover:text-purple-300 transition-colors tracking-tight leading-tight uppercase font-serif font-black">
                        {heroArticle.title}
                      </h2>

                      <p className="text-xs md:text-sm text-zinc-300 leading-relaxed line-clamp-2 max-w-4xl">
                        {heroArticle.summary}
                      </p>

                      <div className="pt-2">
                        <button className="px-5 py-2.5 bg-white text-black hover:bg-purple-300 hover:text-black transition-colors rounded-lg font-mono text-xs font-bold flex items-center gap-1.5 uppercase shadow-md shrink-0">
                          Read Article <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Sub-grid of Remaining Articles */}
                {gridArticles.length > 0 && (
                  <div className="space-y-5">
                    <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-purple-300 border-b border-purple-500/10 pb-2 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span> Latest Releases
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {gridArticles.map((article, index) => (
                        <React.Fragment key={article.id}>
                          <div
                            onClick={() => handleReadArticle(article)}
                            className="group rounded-xl border border-white/5 bg-black/45 overflow-hidden hover:border-purple-500/25 transition-all cursor-pointer flex flex-col h-full"
                          >
                            <div className="aspect-[16/10] overflow-hidden relative bg-black">
                              <img
                                src={article.imageUrl}
                                alt={article.title}
                                className="w-full h-full object-cover transition-transform group-hover:scale-102 duration-500"
                                referrerPolicy="no-referrer"
                              />
                              <span className="absolute top-3 right-3 text-[9px] font-mono px-2 py-0.5 border border-purple-400/30 bg-black/85 rounded text-purple-300 uppercase font-bold">
                                {article.category}
                              </span>
                            </div>

                            <div className="p-4 flex flex-col flex-grow justify-between space-y-3">
                              <div className="space-y-2">
                                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[9px] font-mono text-zinc-400">
                                  <span>{article.date}</span>
                                  <span>•</span>
                                  <span>{getReadingTime(article.content, article.summary)}</span>
                                </div>
                                <h4 className="font-sans font-extrabold text-sm text-white group-hover:text-purple-300 transition-colors leading-snug line-clamp-2 uppercase">
                                  {article.title}
                                </h4>
                                <p className="text-[11px] text-gray-400 leading-relaxed line-clamp-2">
                                  {article.summary}
                                </p>
                              </div>

                              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-purple-400">
                                <span className="truncate opacity-75">{getAuthorName(article.id, article.title)}</span>
                                <span className="font-bold flex items-center gap-0.5 shrink-0 group-hover:underline">Read &rarr;</span>
                              </div>
                            </div>
                          </div>
                          
                          {index === 1 && (
                            <div className="md:col-span-2 flex justify-center py-2">
                              <AdsterraAd type={5} />
                            </div>
                          )}
                          {index === 3 && (
                            <div className="md:col-span-2 flex justify-center py-2">
                              <AdsterraAd type={6} />
                            </div>
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column: Trending Sidebar, Tags, ads */}
              <div className="lg:col-span-1 space-y-6">
                {/* Trending News Widget */}
                <div className="p-5 rounded-2xl border border-purple-500/10 bg-purple-950/10 space-y-4">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-purple-300 border-b border-purple-500/10 pb-2">
                    Trending
                  </h3>
                  <div className="space-y-4">
                    {trendingArticles.map((art, tIdx) => (
                      <div 
                        key={art.id} 
                        onClick={() => handleReadArticle(art)}
                        className="flex gap-3 group cursor-pointer"
                      >
                        <span className="text-xl font-serif font-black text-purple-500/30 group-hover:text-purple-400 transition-colors shrink-0 leading-none">
                          {String(tIdx + 1).padStart(2, '0')}
                        </span>
                        <div className="min-w-0">
                          <span className="text-[8px] font-mono text-purple-400 uppercase tracking-widest font-bold block">{art.category}</span>
                          <h4 className="text-[11px] font-sans font-bold text-white group-hover:text-purple-300 transition-colors line-clamp-2 mt-0.5 leading-snug">
                            {art.title}
                          </h4>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Popular Tags Widget */}
                <div className="p-5 rounded-2xl border border-purple-500/10 bg-purple-950/10 space-y-3">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-purple-300 border-b border-purple-500/10 pb-2">
                    Popular Tags
                  </h3>
                  <div className="flex flex-wrap gap-1.5">
                    {popularTags.map(tag => (
                      <button
                        key={tag}
                        onClick={() => setSearchTerm(tag.replace('#', ''))}
                        className="px-2 py-0.5 text-[9px] font-mono text-purple-300 bg-purple-950/40 border border-purple-500/15 rounded hover:bg-purple-900/40 hover:text-white transition-all cursor-pointer"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Related Topics Widget */}
                <div className="p-5 rounded-2xl border border-white/5 bg-black/45 space-y-3">
                  <h3 className="text-xs font-mono font-bold uppercase tracking-widest text-purple-300 border-b border-white/5 pb-2">
                    Related Topics
                  </h3>
                  <div className="space-y-2 text-[11px] font-mono text-zinc-400">
                    {(relatedTopics && relatedTopics.length > 0 ? relatedTopics : [
                      "2026 Reunion Tour Planning",
                      "Exclusive Photoshoots",
                      "FESTA Multi-City Exhibitions",
                      "https://bangtangallery.online/faq"
                    ]).map((topic, index) => {
                      const isUrl = topic.startsWith('http://') || topic.startsWith('https://') || topic.includes('.online/');
                      const displayTitle = isUrl ? topic.replace(/^https?:\/\/(www\.)?/, '') : topic;
                      
                      return (
                        <div 
                          key={index} 
                          onClick={() => {
                            if (isUrl) {
                              if (topic.includes('bangtangallery.online/faq') || topic.endsWith('/faq')) {
                                window.history.pushState({}, '', '/faq');
                                window.dispatchEvent(new PopStateEvent('popstate'));
                              } else if (topic.includes('bangtangallery.online') || topic.startsWith('/')) {
                                const localPath = topic.replace(/^https?:\/\/[^\/]+/, '');
                                window.history.pushState({}, '', localPath);
                                window.dispatchEvent(new PopStateEvent('popstate'));
                              } else {
                                window.open(topic, '_blank');
                              }
                            } else {
                              setSearchTerm(topic.split(' ')[0]);
                            }
                          }}
                          className="hover:text-purple-300 transition-colors cursor-pointer flex items-center gap-1.5 break-all"
                        >
                          <span className="text-purple-500 shrink-0">•</span> 
                          <span className={isUrl ? "underline decoration-purple-500/30 hover:decoration-purple-400" : ""}>
                            {displayTitle}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        /* Upgraded Magazine Article Detail View */
        <div className="w-full max-w-4xl mx-auto rounded-2xl border border-white/5 bg-gradient-to-b from-[#100824] to-[#04010a] overflow-hidden p-5 md:p-8 space-y-6 animate-fade-in font-sans">
          {/* Back Button */}
          <button
            onClick={handleBackToGrid}
            id="news-back-to-grid-btn"
            className="flex items-center gap-1.5 text-xs font-mono text-purple-400 hover:text-purple-300 cursor-pointer group shrink-0"
          >
            <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to News Portal
          </button>

          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2.5 py-0.5 border border-purple-400/35 bg-purple-950/50 text-purple-200 rounded-full font-bold uppercase tracking-wider">
                  {selectedArticle.category}
                </span>
                <span className="text-[10px] text-zinc-400 font-mono flex items-center gap-1">
                  <CalendarDays className="w-3.5 h-3.5 text-purple-400" /> {selectedArticle.date}
                </span>
              </div>
              
              <div className="flex items-center gap-2 bg-white/[0.02] border border-white/5 px-2.5 py-1 rounded-full text-xs">
                <span className="text-[9px] font-mono text-zinc-500 uppercase mr-1">Share:</span>
                <CopyButton shareUrl={window.location.origin + '/news/' + (selectedArticle.slug || getSlug(selectedArticle.title) || selectedArticle.id)} />
              </div>
            </div>

            <h1 className="text-2xl md:text-4xl font-extrabold text-white leading-tight uppercase font-serif font-black">
              {selectedArticle.title}
            </h1>

            <div className="flex items-center gap-2 text-xs font-mono text-purple-300 border-l-2 border-purple-500 pl-3 py-0.5">
              <span>{getAuthorName(selectedArticle.id, selectedArticle.title)}</span>
              <span className="text-zinc-600">|</span>
              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {getReadingTime(selectedArticle.content, selectedArticle.summary)}</span>
            </div>

            {/* Featured Wide Banner Image */}
            <div className="rounded-xl overflow-hidden aspect-[16/9] relative shadow-2xl bg-black border border-white/5">
              <img
                src={selectedArticle.featuredImage || selectedArticle.imageUrl}
                alt={selectedArticle.title}
                className="w-full h-full object-cover filter brightness-[0.85]"
                referrerPolicy="no-referrer"
              />
            </div>

            {/* Main Content Area */}
            <div className="space-y-6 text-zinc-300 text-sm md:text-base leading-relaxed">
              <p className="text-sm md:text-lg text-purple-100 font-serif italic border-b border-white/5 pb-4">
                {selectedArticle.summary}
              </p>

              <div className="whitespace-pre-line space-y-4 font-serif">
                {renderContentWithAds(selectedArticle.content || selectedArticle.summary)}
              </div>

              {/* Dynamic Image Gallery from admin uploads (Supports 2-10 Images) */}
              {selectedArticle.gallery && selectedArticle.gallery.length > 0 && (
                <ArticleGallery images={selectedArticle.gallery} />
              )}
              
              {/* Fandom Interactive Comments & Nested Replies */}
              <NewsCommentsSection articleId={selectedArticle.id} articleTitle={selectedArticle.title} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
