import { useEffect, useState } from 'react';
import { Mail, Lock, Send, Sparkles } from 'lucide-react';
import CountrySelect from './CountrySelect';
import { getSavedCountry, saveCountry, pinCountry } from '../utils/armyMap';
import { ensureProfile, getProfile, profileName } from '../utils/profile';

// Batch 89 — ARMY Time Capsule (Events page section).
// Visitors seal a letter to BTS and ARMY of the future. Nobody —
// not even the writer — can read the letters until the capsule
// opens on FESTA, June 13, 2027 (00:00 KST); until then the
// public endpoint returns only the count. After opening day the
// same endpoint serves the letters and this section becomes a
// wall. Letters live in config/timeCapsule (see the controller);
// the admin moderates them from Admin Panel → Festa Events.
const OPEN_AT = new Date('2027-06-13T00:00:00+09:00').getTime();
const EMOJIS = ['🐨', '🐹', '🐱', '🐿️', '🐥', '🐯', '🐰', '💜'];

interface CapsuleLetter {
  id: string;
  name: string;
  emoji?: string;
  message: string;
  createdAt: number;
}

export default function TimeCapsule() {
  const [count, setCount] = useState<number | null>(null);
  const [opened, setOpened] = useState(false);
  const [letters, setLetters] = useState<CapsuleLetter[]>([]);
  const [name, setName] = useState(() => profileName()); // Batch 109/117
  const [country, setCountry] = useState(() => getProfile()?.country || getSavedCountry());
  const [emoji, setEmoji] = useState('💜');
  const [message, setMessage] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'sealed' | 'error'>('idle');
  const [error, setError] = useState('');

  const load = async () => {
    try {
      const r = await fetch('/api/capsule');
      const d = await r.json().catch(() => null);
      if (d?.success) {
        setCount(typeof d.count === 'number' ? d.count : 0);
        setOpened(!!d.opened);
        if (Array.isArray(d.letters)) setLetters(d.letters);
      }
    } catch {
      /* the section still renders; the count just stays unknown */
    }
  };

  useEffect(() => {
    load();
  }, []);

  const daysLeft = Math.max(0, Math.ceil((OPEN_AT - Date.now()) / 86400000));

  const seal = async () => {
    if (state === 'sending') return;
    const finalName = profileName() || name.trim();
    if (finalName.length < 1 || message.trim().length < 1) {
      setError('Please write your name and a letter first.');
      setState('error');
      return;
    }
    if (!country) {
      setError('Please select your country — it lights up on the ARMY World Map!');
      setState('error');
      return;
    }
    setState('sending');
    setError('');
    try {
      const r = await fetch('/api/capsule/letters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: finalName, message: message.trim(), emoji, country })
      });
      const d = await r.json().catch(() => null);
      if (r.ok && d?.success) {
        if (typeof d.count === 'number') setCount(d.count);
        saveCountry(country);
        void pinCountry(country);
        ensureProfile(finalName, { emoji, country });
        setState('sealed');
        setMessage('');
      } else {
        setError(d?.error || 'Could not seal your letter. Please try again.');
        setState('error');
      }
    } catch {
      setError('Could not seal your letter. Please try again.');
      setState('error');
    }
  };

  return (
    <section className="mt-10 p-6 sm:p-8 rounded-3xl border border-purple-500/15 bg-gradient-to-b from-purple-950/25 to-black/50 backdrop-blur-md relative overflow-hidden">
      <div className="absolute -top-16 -right-16 w-56 h-56 bg-fuchsia-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="relative">
        <div className="text-center space-y-2">
          <h3 className="text-xl sm:text-2xl font-black tracking-wide">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-fuchsia-300 to-pink-300">
              💌 ARMY Time Capsule
            </span>
          </h3>
          <p className="text-xs sm:text-sm text-gray-400 max-w-xl mx-auto leading-relaxed">
            Write a letter to BTS and ARMY of the future. It stays{' '}
            <span className="text-purple-300 font-semibold">sealed — nobody can read it</span> —
            until the capsule opens on <span className="text-purple-300 font-semibold">FESTA, June 13, 2027</span>.
          </p>
          <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-mono font-bold px-3 py-1 rounded-full border border-purple-400/30 bg-purple-950/50 text-purple-200">
              <Lock className="w-3.5 h-3.5" />
              {count === null ? '… letters sealed' : `${count} letter${count === 1 ? '' : 's'} sealed`}
            </span>
            {!opened && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-mono px-3 py-1 rounded-full border border-white/10 bg-white/5 text-gray-300">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" /> Opens in {daysLeft} days
              </span>
            )}
          </div>
        </div>

        {opened ? (
          <div className="mt-6">
            <p className="text-center text-sm text-purple-200 font-semibold">
              🎉 The capsule is open — happy FESTA, ARMY! 💜
            </p>
            {letters.length === 0 ? (
              <p className="text-center text-xs text-gray-500 mt-4">No letters were sealed.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
                {letters.map((l) => (
                  <div key={l.id} className="p-4 rounded-2xl border border-white/8 bg-black/40">
                    <p className="text-xs font-bold text-purple-300">
                      {l.emoji || '💜'} {l.name}
                    </p>
                    <p className="text-sm text-gray-200 leading-relaxed mt-1.5 whitespace-pre-line">{l.message}</p>
                    <p className="text-[10px] text-gray-500 font-mono mt-2">
                      Sealed {new Date(l.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : state === 'sealed' ? (
          <div className="mt-6 text-center space-y-3">
            <p className="text-3xl">💌🔐</p>
            <p className="text-sm text-purple-100 font-semibold">Your letter is sealed!</p>
            <p className="text-xs text-gray-400">It will be opened on FESTA — June 13, 2027. Borahae! 💜</p>
            <button
              type="button"
              onClick={() => setState('idle')}
              className="text-xs font-bold text-purple-300 underline underline-offset-4 hover:text-purple-200 cursor-pointer"
            >
              Seal another letter
            </button>
          </div>
        ) : (
          <div className="mt-6 max-w-xl mx-auto space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                value={name}
                onChange={(e) => setName(e.target.value.slice(0, 30))}
                readOnly={!!profileName()}
                placeholder="Your name or ARMY nickname"
                className="flex-1 px-4 py-2.5 rounded-xl bg-black/50 border border-white/10 focus:border-purple-400/50 outline-none text-sm text-white placeholder:text-gray-500"
                maxLength={30}
              />
              <div className="flex items-center gap-1 justify-center">
                {EMOJIS.map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEmoji(e)}
                    className={`w-8 h-8 rounded-full text-base transition-all cursor-pointer ${
                      emoji === e
                        ? 'bg-purple-600/60 ring-2 ring-fuchsia-400 scale-110'
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                    aria-label={`Pick ${e}`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <CountrySelect value={country} onChange={setCountry} />
            <div className="relative">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, 300))}
                placeholder="Dear BTS and ARMY of 2027…"
                rows={4}
                maxLength={300}
                className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 focus:border-purple-400/50 outline-none text-sm text-white placeholder:text-gray-500 resize-none"
              />
              <span className="absolute bottom-2 right-3 text-[10px] font-mono text-gray-500">
                {message.length}/300
              </span>
            </div>
            {state === 'error' && <p className="text-xs text-rose-300">{error}</p>}
            <button
              type="button"
              onClick={seal}
              disabled={state === 'sending'}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 text-white font-black text-sm shadow-[0_6px_24px_rgba(168,85,247,0.35)] hover:opacity-95 active:scale-[0.99] transition-all disabled:opacity-60 cursor-pointer"
            >
              {state === 'sending' ? (
                'Sealing…'
              ) : (
                <>
                  <Send className="w-4 h-4" /> Seal My Letter <Mail className="w-4 h-4" />
                </>
              )}
            </button>
            <p className="text-[10px] text-gray-500 text-center">
              Sealed letters cannot be read or edited by anyone until opening day.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
