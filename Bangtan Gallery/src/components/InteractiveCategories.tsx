import React from 'react';
import { motion } from 'motion/react';
import { 
  Play, Globe, Camera, Hash, Image as ImageIcon, Film, Flame, Sparkles, ExternalLink, HelpCircle 
} from 'lucide-react';

interface CategoryItem {
  id: string;
  name: string;
  label: string;
  count: string;
  icon: string | React.ReactNode;
  tab: string; // Destination tab in the portal
  color: string; // Gradient color theme
  glowClass: string; // Glow class target
  imageUrl?: string;
}

interface InteractiveCategoriesProps {
  config?: CategoryItem[];
  onCategoryClick: (tab: string) => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  Play: <Play className="w-5 h-5 text-white fill-white/10" />,
  Globe: <Globe className="w-5 h-5 text-white" />,
  Camera: <Camera className="w-5 h-5 text-white" />,
  Hash: <Hash className="w-5 h-5 text-white" />,
  Image: <ImageIcon className="w-5 h-5 text-white" />,
  Film: <Film className="w-5 h-5 text-white" />,
  Flame: <Flame className="w-5 h-5 text-white animate-pulse" />,
  Sparkles: <Sparkles className="w-5 h-5 text-white" />,
};

export default function InteractiveCategories({ config, onCategoryClick }: InteractiveCategoriesProps) {
  
  const fallbackCategories: CategoryItem[] = [
    {
      id: 'cat-youtube',
      name: 'YouTube Cinema',
      label: 'Watch Music Videos, concerts, and logs.',
      count: '150+ Clips',
      icon: 'Play',
      tab: 'YouTube',
      color: 'from-red-650 via-rose-650 to-red-750',
      glowClass: 'hover:shadow-red-600/35 hover:border-red-500/55'
    },
    {
      id: 'cat-facebook',
      name: 'Facebook Base',
      label: 'Explore global official fanbase coordinates.',
      count: '4 Big Groups',
      icon: 'Globe',
      tab: 'News',
      color: 'from-blue-600 via-indigo-600 to-indigo-700',
      glowClass: 'hover:shadow-blue-600/35 hover:border-blue-500/55'
    },
    {
      id: 'cat-instagram',
      name: 'Instagram Feeds',
      label: 'Savor high definition individual and group stories.',
      count: '540+ V-Cuts',
      icon: 'Camera',
      tab: 'Gallery',
      color: 'from-pink-600 via-fuchsia-600 to-rose-600',
      glowClass: 'hover:shadow-pink-600/35 hover:border-pink-500/55'
    },
    {
      id: 'cat-x',
      name: 'X (Twitter) Feed',
      label: 'Interact with trending hashtags and schedule announcements.',
      count: '99+ Updates',
      icon: 'Hash',
      tab: 'News',
      color: 'from-slate-800 via-slate-900 to-black',
      glowClass: 'hover:shadow-slate-500/25 hover:border-slate-500/55'
    },
    {
      id: 'cat-images',
      name: 'Image Gallery',
      label: 'Inspect professional media, concepts and stages.',
      count: '480+ Artifacts',
      icon: 'Image',
      tab: 'Gallery',
      color: 'from-violet-600 via-purple-650 to-indigo-700',
      glowClass: 'hover:shadow-violet-600/35 hover:border-purple-500/55'
    },
    {
      id: 'cat-shorts',
      name: 'Festa Shorts',
      label: 'Amuse yourself with funny variety and dance routines.',
      count: '34 Snippets',
      icon: 'Film',
      tab: 'YouTube',
      color: 'from-rose-500 via-orange-550 to-red-500',
      glowClass: 'hover:shadow-orange-500/35 hover:border-orange-500/55'
    },
    {
      id: 'cat-trending',
      name: 'Trending Hot',
      label: 'Indulge in highest rated community albums and charts.',
      count: 'Top 10 listings',
      icon: 'Flame',
      tab: 'Music',
      color: 'from-amber-500 via-orange-600 to-red-650',
      glowClass: 'hover:shadow-amber-500/35 hover:border-amber-500/55'
    },
    {
      id: 'cat-new',
      name: 'New Uploads',
      label: 'Explore device wallpapers and downloads published today.',
      count: '15 items',
      icon: 'Sparkles',
      tab: 'Downloads',
      color: 'from-emerald-600 via-teal-600 to-indigo-600',
      glowClass: 'hover:shadow-emerald-600/35 hover:border-emerald-500/55'
    }
  ];

  const categories = config && config.length > 0 ? config : fallbackCategories;

  const renderIcon = (iconVal: string | React.ReactNode) => {
    if (React.isValidElement(iconVal)) {
      return iconVal;
    }
    if (typeof iconVal === 'string' && ICON_MAP[iconVal]) {
      return ICON_MAP[iconVal];
    }
    return <Sparkles className="w-5 h-5 text-white" />;
  };

  return (
    <section className="space-y-6">
      
      {/* Header Info */}
      <div className="px-1">
        <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-purple-400 font-bold block mb-1">
          🗂️ Interactive portals
        </span>
        <h3 className="text-xl md:text-2xl font-sans font-black text-white uppercase tracking-wider flex items-center gap-1.5">
          Interactive Categories <Sparkles className="w-5 h-5 text-purple-400" />
        </h3>
        <p className="text-gray-400 text-xs mt-1">
          Navigate the ARMY realm through dynamic portals. Explore social vectors, HD photo libraries, and curated videos.
        </p>
      </div>

      {/* Categories Grid (Dynamic Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {categories.map((cat, idx) => (
          <motion.div
            key={cat.id || idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: idx * 0.05 }}
            whileHover={{ 
              scale: 1.05, 
              y: -5,
              transition: { duration: 0.25, ease: 'easeOut' }
            }}
            onClick={() => onCategoryClick(cat.tab)}
            className={`p-5 rounded-2xl border border-white/5 bg-black/45 cursor-pointer flex flex-col justify-between h-[180px] transition-shadow duration-300 relative overflow-hidden group select-none ${cat.glowClass || 'hover:shadow-purple-600/35 hover:border-purple-500/55'}`}
          >
            {/* Visual background category image when uploaded */}
            {cat.imageUrl ? (
              <div className="absolute inset-0 z-0 opacity-10 group-hover:opacity-20 transition-opacity duration-300 pointer-events-none">
                <img 
                  src={cat.imageUrl} 
                  alt="" 
                  className="w-full h-full object-cover scale-105 group-hover:scale-100 transition-transform duration-700" 
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
              </div>
            ) : (
              /* Visual background gradient reflection fallback */
              <div className={`absolute -right-12 -bottom-12 w-28 h-28 rounded-full bg-gradient-to-tr ${cat.color || 'from-purple-600 to-indigo-700'} opacity-5 group-hover:opacity-15 blur-2xl transition-opacity duration-300 pointer-events-none`} />
            )}

            {/* Top row: Icon box + total count */}
            <div className="flex justify-between items-center relative z-10">
              <motion.div 
                whileHover={{ rotate: 15 }}
                className={`p-2.5 rounded-xl bg-gradient-to-tr ${cat.color || 'from-purple-650 via-purple-750 to-indigo-850'} shadow-lg shadow-black/35 flex items-center justify-center`}
              >
                {renderIcon(cat.icon)}
              </motion.div>
              
              <span className="text-[10px] font-mono text-purple-300 font-bold px-2 py-0.5 rounded-full border border-purple-500/20 bg-purple-950/20 shadow-inner">
                {cat.count}
              </span>
            </div>

            {/* Bottom row: Details & Link title */}
            <div className="space-y-1 relative z-10">
              <h4 className="font-sans font-extrabold text-sm text-white group-hover:text-purple-300 transition-colors flex items-center gap-1">
                {cat.name} 
                <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-purple-400" />
              </h4>
              <p className="text-[11px] text-gray-400 leading-snug font-sans group-hover:text-gray-300 transition-colors">
                {cat.label}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
