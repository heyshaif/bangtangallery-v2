import { useMemo, useState } from 'react';
import { BookMarked, Check, Copy, Megaphone, Search, Sparkles } from 'lucide-react';
import FanChantGuide from './FanChantGuide';
import { DEFAULT_DICTIONARY_ENTRIES, DICTIONARY_CATEGORIES, DictionaryEntry } from '../data/dictionaryEntries';

// ARMY Dictionary (Batch 92) — its own sidebar page, per the
// owner: a Lucide ICON (no book emoji), the site's dark-purple
// style, and fully manageable from the Admin Panel. Entries come
// from the published config (dictionaryEntries); the built-in
// verified starter set is the fallback so the page is never
// empty. Search + category chips filter instantly, client-side.

export default function DictionarySection({ items, audioUrl }: { items?: DictionaryEntry[]; audioUrl?: string }) {
  const entries = useMemo<DictionaryEntry[]>(() => {
    const list = (items || []).filter((e) => e && e.term && e.meaning);
    return list.length > 0 ? list : DEFAULT_DICTIONARY_ENTRIES;
  }, [items]);

  const [tab, setTab] = useState<'dictionary' | 'chant'>('dictionary'); // Batch 115
  const [query, setQuery] = useState('');
  const [copiedId, setCopiedId] = useState('');

  // Copy a card's text (Batch 100, owner's ask): tap the copy
  // icon and the term + meaning (+ origin) lands on the
  // clipboard, ready to paste anywhere. Clipboard API first,
  // with the classic textarea fallback for older browsers.
  const copyEntry = async (e: DictionaryEntry) => {
    const text = `${e.term} — ${e.meaning}${e.origin ? `\n${e.origin}` : ''}\n— ARMY Dictionary · Bangtan Gallery`;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch { /* clipboard unavailable */ }
      document.body.removeChild(ta);
    }
    setCopiedId(e.id);
    window.setTimeout(() => setCopiedId((cur) => (cur === e.id ? '' : cur)), 1600);
  };
  const [category, setCategory] = useState<string>('All');

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return entries.filter((e) => {
      if (category !== 'All' && e.category !== category) return false;
      if (!q) return true;
      return (
        e.term.toLowerCase().includes(q) ||
        e.meaning.toLowerCase().includes(q) ||
        (e.member || '').toLowerCase().includes(q) ||
        (e.origin || '').toLowerCase().includes(q)
      );
    });
  }, [entries, query, category]);

  const chip = (label: string) =>
    `px-4 py-2 rounded-full text-xs sm:text-sm font-bold cursor-pointer transition-all ${
      category === label
        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25'
        : 'bg-black/40 border border-purple-500/25 text-purple-200 hover:border-purple-400/50'
    }`;

  return (
    <section className="max-w-6xl mx-auto px-4 sm:px-6 pt-5 pb-8">
      {/* Header — icon, not emoji (owner's instruction) */}
      <div className="text-center space-y-2">
        <div className="mx-auto w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
          <BookMarked className="w-5 h-5 text-white" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-fuchsia-300 to-pink-300">
            ARMY Dictionary
          </span>
        </h2>
        <p className="text-sm text-gray-400 max-w-xl mx-auto">
          Every fandom word, nickname &amp; iconic line — in one place. {entries.length} entries and growing 💜
        </p>
      </div>

      {/* Page tabs (Batch 115, owner's placement): the Fan
          Chant Guide lives here as a tab, not on Concert. */}
      <div className="flex justify-center gap-2 mt-5">
        <button
          type="button"
          onClick={() => setTab('dictionary')}
          className={`inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full text-xs sm:text-sm font-black cursor-pointer transition-all ${
            tab === 'dictionary'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25'
              : 'bg-black/40 border border-purple-500/25 text-purple-200 hover:border-purple-400/50'
          }`}
        >
          <BookMarked className="w-4 h-4" /> ARMY Dictionary
        </button>
        <button
          type="button"
          onClick={() => setTab('chant')}
          className={`inline-flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-full text-xs sm:text-sm font-black cursor-pointer transition-all ${
            tab === 'chant'
              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25'
              : 'bg-black/40 border border-purple-500/25 text-purple-200 hover:border-purple-400/50'
          }`}
        >
          <Megaphone className="w-4 h-4" /> Fan Chant Guide
        </button>
      </div>

      {tab === 'chant' ? (
        <div className="mt-6 max-w-4xl mx-auto">
          <FanChantGuide audioUrl={audioUrl} />
        </div>
      ) : (
      <>

      {/* Search */}
      <div className="relative max-w-xl mx-auto mt-4">
        <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-purple-300/70 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='Search a word… try "Borahae"'
          className="w-full pl-11 pr-4 py-2.5 rounded-2xl bg-black/50 border border-purple-500/25 focus:border-purple-400/70 outline-none text-sm text-white placeholder:text-gray-500"
        />
      </div>

      {/* Category chips */}
      <div className="flex flex-wrap justify-center gap-2 mt-3">
        <button type="button" onClick={() => setCategory('All')} className={chip('All')}>
          All
        </button>
        {DICTIONARY_CATEGORIES.map((c) => (
          <button key={c} type="button" onClick={() => setCategory(c)} className={chip(c)}>
            {c}
          </button>
        ))}
      </div>

      {/* Cards */}
      {visible.length === 0 ? (
        <div className="text-center py-16 space-y-2">
          <Sparkles className="w-8 h-8 text-purple-400 mx-auto" />
          <p className="text-gray-300 font-bold">No entry found for “{query}”</p>
          <p className="text-xs text-gray-500">Try another word — or check a different category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
          {visible.map((e) => (
            <article
              key={e.id}
              className="rounded-3xl border border-white/8 bg-black/50 backdrop-blur-md p-5 flex flex-col gap-2.5 shadow-lg hover:border-purple-400/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="px-2.5 py-1 rounded-full bg-purple-700/80 text-[10px] font-black tracking-wider text-purple-100 uppercase">
                  {e.category}
                  {e.member ? ` · ${e.member}` : ''}
                </span>
                <button
                  type="button"
                  onClick={() => copyEntry(e)}
                  title={copiedId === e.id ? 'Copied!' : 'Copy'}
                  aria-label={`Copy ${e.term}`}
                  className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-purple-200 hover:bg-purple-500/25 hover:text-white transition-all cursor-pointer shrink-0"
                >
                  {copiedId === e.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
              <h3 className="text-xl font-black text-white leading-snug">{e.term}</h3>
              <p className="text-sm text-gray-300 leading-relaxed flex-1">{e.meaning}</p>
              {e.origin && <p className="text-xs text-purple-300/60 leading-relaxed">{e.origin}</p>}
            </article>
          ))}
        </div>
      )}
      </>
      )}
    </section>
  );
}
