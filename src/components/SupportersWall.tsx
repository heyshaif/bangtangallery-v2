import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Heart, Users, UserCheck, CheckCircle } from 'lucide-react';
import { useBackend } from '../context/BackendContext';

interface Supporter {
  id: string;
  username: string;
  joinedDate: string;
  avatarSeed: string; // Used to pick design template
  avatarBg: string; // Gradient style
  bias: string; // BTS Bias Member
  message: string;
}

export default function SupportersWall() {
  const { stats, registerUser } = useBackend();
  const [supporters, setSupporters] = useState<Supporter[]>([
    {
      id: 'sup-1',
      username: '@jk_golden_star',
      joinedDate: 'Jun 11, 2026',
      avatarSeed: '🐰',
      avatarBg: 'from-purple-500 to-indigo-600',
      bias: 'Jungkook',
      message: 'Still in love with Golden and Standing Next to You! Forever ARMY!💜'
    },
    {
      id: 'sup-2',
      username: '@borahae_clouds',
      joinedDate: 'Jun 10, 2026',
      avatarSeed: '🐯',
      avatarBg: 'from-purple-600 to-rose-500',
      bias: 'V',
      message: 'Celebrating another amazing Festa Anniversary in 2026!'
    },
    {
      id: 'sup-3',
      username: '@rm_philosophies',
      joinedDate: 'Jun 09, 2026',
      avatarSeed: '🐨',
      avatarBg: 'from-amber-500 to-purple-600',
      bias: 'RM',
      message: 'Namjooning around art galleries all season. Love from Seoul!'
    },
    {
      id: 'sup-4',
      username: '@hobi_sunshine26',
      joinedDate: 'Jun 08, 2026',
      avatarSeed: '🐿️',
      avatarBg: 'from-emerald-500 to-teal-600',
      bias: 'j-hope',
      message: 'You are my Hope, I am your Hope! Dynamic energy!'
    },
    {
      id: 'sup-5',
      username: '@suga_agustd_reign',
      joinedDate: 'Jun 08, 2026',
      avatarSeed: '🐱',
      avatarBg: 'from-gray-700 to-slate-900',
      bias: 'SUGA',
      message: 'Agust D tour remains unmatched. D-Day rules forever.'
    },
    {
      id: 'sup-6',
      username: '@jimin_filter_dream',
      joinedDate: 'Jun 07, 2026',
      avatarSeed: '🐥',
      avatarBg: 'from-pink-500 to-rose-600',
      bias: 'Jimin',
      message: 'Like Crazy is still on repeat on my Spotify! Beautiful vocals.'
    },
    {
      id: 'sup-7',
      username: '@jin_super_tuna',
      joinedDate: 'Jun 06, 2026',
      avatarSeed: '🐹',
      avatarBg: 'from-blue-400 to-purple-600',
      bias: 'Jin',
      message: 'Our worldwide handsome is back and blessing us with humor!'
    },
    {
      id: 'sup-8',
      username: '@army_forever_7',
      joinedDate: 'Jun 05, 2026',
      avatarSeed: '💜',
      avatarBg: 'from-red-500 to-pink-500',
      bias: 'All 7 Members',
      message: 'ARIRANG! Seven forever!'
    }
  ]);

  // Form states to join
  const [inputUsername, setInputUsername] = useState('');
  const [selectedBias, setSelectedBias] = useState('Jungkook');
  const [inputMessage, setInputMessage] = useState('Borahae! Proud member of the global ARMY families 💜');
  const [avatarSeed, setAvatarSeed] = useState('💜');
  const [showSuccessParticles, setShowSuccessParticles] = useState(false);
  const [errorText, setErrorText] = useState('');

  // Total authenticated count starting from real data
  const totalCount = stats.registeredUsers + 8;

  const biasEmojis: Record<string, string> = {
    'RM': '🐨',
    'Jin': '🐹',
    'SUGA': '🐱',
    'j-hope': '🐿️',
    'Jimin': '🐥',
    'V': '🐯',
    'Jungkook': '🐰',
    'All 7 Members': '💜'
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUsername = inputUsername.trim().replace('@', '');
    if (!cleanUsername) {
      setErrorText('Please enter your ARMY handle!');
      return;
    }
    
    // Format handle to start with @
    const formattedUsername = `@${cleanUsername.toLowerCase()}`;
    
    // Prevent duplicates
    if (supporters.some(s => s.username === formattedUsername)) {
      setErrorText('This handle is already registered on the wall!');
      return;
    }

    setErrorText('');

    const avatarGradients = [
      'from-purple-600 to-pink-500',
      'from-indigo-600 to-purple-600',
      'from-pink-500 to-rose-600',
      'from-teal-500 to-indigo-600',
      'from-amber-500 to-rose-500'
    ];
    const pickedGradient = avatarGradients[Math.floor(Math.random() * avatarGradients.length)];
    const emojiSymbol = biasEmojis[selectedBias] || '💜';

    const newSupporter: Supporter = {
      id: `sup-${Date.now()}`,
      username: formattedUsername,
      joinedDate: 'Today',
      avatarSeed: emojiSymbol,
      avatarBg: pickedGradient,
      bias: selectedBias,
      message: inputMessage || 'Borahae! Forever bulletproof BTS supporter.'
    };

    // Register user in our backend data store!
    const ok = await registerUser(cleanUsername, `${selectedBias} Bias ${emojiSymbol}`);

    if (ok) {
      setSupporters(prev => [newSupporter, ...prev]);
      setInputUsername('');
      setInputMessage('');
      setShowSuccessParticles(true);
    } else {
      setErrorText('Could not register support. Try a different username handle.');
    }
  };

  useEffect(() => {
    if (showSuccessParticles) {
      const timer = setTimeout(() => {
        setShowSuccessParticles(false);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessParticles]);

  return (
    <section className="p-6 md:p-8 rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl space-y-8 relative overflow-hidden">
      
      {/* Success Particles Layer */}
      {showSuccessParticles && (
        <div className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1.1 }}
            exit={{ opacity: 0 }}
            className="text-center p-6 bg-[#05000a]/95 rounded-2xl border border-purple-500/30 shadow-[0_0_50px_rgba(168,85,247,0.4)] backdrop-blur-md"
          >
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
              className="inline-block"
            >
              <Sparkles className="w-12 h-12 text-amber-400 stroke-[1.5]" />
            </motion.div>
            <h4 className="text-white font-sans font-black tracking-widest uppercase mt-4 text-sm">
              WELCOME TO THE WALL! 💜
            </h4>
            <p className="text-[11px] text-gray-300 mt-2">
              Your supporter coordinates have been added with dynamic entering animations.
            </p>
          </motion.div>
        </div>
      )}

      {/* Header Info */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-white/10 pb-6 relative z-10">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-purple-400 font-bold block mb-1">
            💜 Global fandom coordinates
          </span>
          <h3 className="text-xl md:text-2xl font-sans font-black text-white uppercase tracking-wider flex items-center gap-1.5">
            Supporters Wall & Comunidad <Users className="w-5 h-5 text-purple-300" />
          </h3>
          <p className="text-gray-400 text-xs mt-1 md:max-w-xl">
            Interactive, self-updating grid celebrating fans around the world. Become a supporter below to record your coordinates upon the wall!
          </p>
        </div>

        {/* Real Dynamic Counter Box */}
        <div className="p-3 px-5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-3.5 shadow-xl">
          <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-300 animate-pulse">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[9px] font-mono uppercase text-gray-500 block leading-none">ARMY VERIFIED</span>
            <span className="text-sm font-sans font-black text-white block mt-1 tracking-wider">
              {totalCount.toLocaleString()} Members
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
        
        {/* Supporters interactive grid list */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 h-[330px] overflow-y-auto pr-2 custom-scrollbar">
            <AnimatePresence>
              {supporters.map((sup, idx) => (
                <motion.div
                  key={sup.id}
                  initial={{ opacity: 0, scale: 0.8, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.5, delay: idx * 0.04 }}
                  whileHover={{ y: -5 }}
                  className="p-3 bg-white/[0.02] border border-white/5 rounded-2xl flex flex-col items-center justify-center text-center relative group select-none hover:bg-white/[0.04]"
                >
                  {/* Decorative float glow */}
                  <div className="absolute inset-0 bg-purple-500/0 group-hover:bg-purple-500/5 rounded-2xl transition-all duration-300 pointer-events-none" />

                  {/* Avatar bubble */}
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-tr ${sup.avatarBg} flex items-center justify-center text-xl shadow-lg shadow-black/40 group-hover:scale-110 active:scale-95 transition-transform duration-300`}>
                    <span>{sup.avatarSeed}</span>
                  </div>

                  <h5 className="font-sans font-bold text-[11px] text-white mt-2.5 truncate w-full px-1">
                    {sup.username}
                  </h5>
                  <span className="text-[8px] font-mono text-purple-400 uppercase tracking-widest mt-1 block">
                    Bias: {sup.bias}
                  </span>

                  {/* Hover preview tooltip box */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-44 p-3 rounded-xl border border-white/10 bg-[#07000e] text-left opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-300 shadow-2xl z-20">
                    <div className="flex justify-between items-center border-b border-white/5 pb-1 mb-1.5 font-mono text-[8px] text-purple-400">
                      <span>BIAS: {sup.bias}</span>
                      <span>{sup.joinedDate}</span>
                    </div>
                    <p className="text-[10px] text-gray-300 leading-normal italic">
                      &ldquo;{sup.message}&rdquo;
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          
          <div className="p-3 rounded-xl bg-[#090011]/80 border border-purple-500/10 text-center text-[10px] font-mono text-purple-300">
            💖 Showing latest real-time supporters &bull; updates instantly without full page reloads!
          </div>
        </div>

        {/* Join form container */}
        <div className="lg:col-span-5 p-5 bg-white/[0.02] border border-white/10 rounded-2xl flex flex-col justify-between">
          <form onSubmit={handleJoin} className="space-y-4">
            <div>
              <h4 className="font-sans font-black text-xs text-white uppercase tracking-widest flex items-center gap-1">
                Join Supporters Wall <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              </h4>
              <p className="text-[10px] text-gray-400 mt-1">
                Enter your username to place your supporter node directly alongside other ARMYs.
              </p>
            </div>

            <div className="space-y-3.5">
              {/* Username Input */}
              <div className="space-y-1">
                <label className="text-[9px] font-mono uppercase text-gray-500 block">ARMY Username Handle</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="@BTS7"
                    value={inputUsername}
                    onChange={(e) => {
                      setInputUsername(e.target.value);
                      setErrorText('');
                    }}
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-purple-500 placeholder:text-gray-600 transition-colors"
                  />
                </div>
              </div>

              {/* Bias Radio selection */}
              <div className="space-y-1">
                <label className="text-[9px] font-mono uppercase text-gray-500 block">Select Bias Artist</label>
                <select
                  value={selectedBias}
                  onChange={(e) => {
                    setSelectedBias(e.target.value);
                    const selected = e.target.value;
                    setAvatarSeed(biasEmojis[selected] || '💜');
                  }}
                  className="w-full bg-[#0a0014] border border-white/10 rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-purple-500 transition-colors custom-select"
                >
                  <option value="RM">RM 🐨</option>
                  <option value="Jin">Jin 🐹</option>
                  <option value="SUGA">SUGA 🐱</option>
                  <option value="j-hope">j-hope 🐿️</option>
                  <option value="Jimin">Jimin 🐥</option>
                  <option value="V">V 🐯</option>
                  <option value="Jungkook">Jungkook 🐰</option>
                  <option value="All 7 Members">All 7 Members 💜</option>
                </select>
              </div>

              {/* Message Input */}
              <div className="space-y-1">
                <label className="text-[9px] font-mono uppercase text-gray-500 block">Personalized Message</label>
                <textarea
                  rows={2}
                  maxLength={100}
                  placeholder="Enter custom text..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-purple-500 placeholder:text-gray-600 transition-colors resize-none"
                />
              </div>
            </div>

            {errorText && (
              <p className="text-[10px] text-rose-400 font-mono italic">{errorText}</p>
            )}

            <button
              type="submit"
              className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg transition-all duration-300 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Heart className="w-3.5 h-3.5 fill-white" />
              <span>Record Support</span>
            </button>
          </form>
        </div>

      </div>

    </section>
  );
}
