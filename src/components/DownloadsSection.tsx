/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { DownloadItem } from '../types';
import { DOWNLOADS } from '../data/btsData';
import { Search, Download, FileText, Image, Smile, Laptop, Archive, Sparkles, CheckCircle2 } from 'lucide-react';

export default function DownloadsSection({ items }: { items?: DownloadItem[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeType, setActiveType] = useState<string>('All');
  const [downloadSuccessItem, setDownloadSuccessItem] = useState<string | null>(null);

  // Type categorizations
  const typesList = ['All', 'Wallpaper', 'Icon', 'Photo', 'Logo', 'PDF', 'ZIP'];

  // Filter lists
  const displayDownloads = (items && items.length > 0) ? items : DOWNLOADS;
  const filteredDownloads = displayDownloads.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeType === 'All') return matchesSearch;
    return item.type === activeType && matchesSearch;
  });

  const getIconForType = (type: string) => {
    switch (type) {
      case 'Wallpaper': return <Laptop className="w-5 h-5 text-purple-400" />;
      case 'Icon': return <Smile className="w-5 h-5 text-amber-400" />;
      case 'Photo': return <Image className="w-5 h-5 text-rose-400" />;
      case 'PDF': return <FileText className="w-5 h-5 text-red-400" />;
      case 'ZIP': return <Archive className="w-5 h-5 text-emerald-400" />;
      default: return <Sparkles className="w-5 h-5 text-indigo-400" />;
    }
  };

  const handleDownloadTrigger = (item: DownloadItem) => {
    // Simulate real browser download behavior safely by opening the file asset link
    setDownloadSuccessItem(item.id);
    
    // Create temporary link and target blank
    const link = document.createElement('a');
    link.href = item.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.setAttribute('download', item.name);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => {
      setDownloadSuccessItem(null);
    }, 2500);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header index */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-sans font-extrabold text-white">
            ARMY Resource Base
          </h2>
          <p className="text-gray-400 text-sm">
            Download official, top-quality digital assets: wallpapers, icons, lyrics sheets and Festa celebration kits.
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search resource files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/40 text-xs pl-10 pr-4 py-2 rounded-lg border border-purple-500/20 focus:border-purple-500/50 text-white outline-none placeholder:text-gray-500"
          />
        </div>
      </div>

      {/* Categories chips horizontal line */}
      <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-purple-900 scrollbar-track-transparent">
        {typesList.map(type => (
          <button
            key={type}
            onClick={() => setActiveType(type)}
            className={`text-xs font-mono px-3.5 py-2 rounded-full border transition-all shrink-0 cursor-pointer ${
              activeType === type
                ? 'bg-purple-600 border-purple-500 text-white shadow-md shadow-purple-500/20'
                : 'bg-white/[0.02] border-white/5 text-gray-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Downloads Table-like cards grid */}
      {filteredDownloads.length === 0 ? (
        <div className="text-center py-20 rounded-xl border border-dashed border-white/5 bg-white/[0.01]">
          <p className="text-gray-400 font-mono text-sm">No downloadable files found matching query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDownloads.map((item, index) => (
            <React.Fragment key={item.id}>
              <div
                className="group p-5 rounded-xl border border-white/5 bg-black/45 backdrop-blur-md flex items-center justify-between gap-4 hover:border-purple-500/30 transition-all shadow-md relative"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white/5 rounded-xl border border-white/5 shrink-0 group-hover:bg-purple-950/20 group-hover:border-purple-500/10 transition-colors">
                    {getIconForType(item.type)}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono font-bold text-purple-400 bg-purple-950/40 border border-purple-500/15 px-2 py-0.5 rounded uppercase">
                        {item.type}
                      </span>
                      <span className="text-[10px] font-mono text-gray-500 font-semibold">{item.size}</span>
                    </div>
                    <h3 className="font-sans font-bold text-sm text-gray-200 group-hover:text-white transition-colors leading-relaxed line-clamp-2">
                      {item.name}
                    </h3>
                  </div>
                </div>

                <div className="shrink-0 pl-2">
                  <button
                    onClick={() => handleDownloadTrigger(item)}
                    id={`download-file-btn-${item.id}`}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-mono font-bold rounded-lg border border-purple-500/40 hover:border-purple-400 bg-purple-950/20 text-purple-300 hover:text-purple-200 transition-all cursor-pointer hover:bg-purple-950/50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Get File
                  </button>
                </div>

                {/* Dynamic trigger overlay for success notification */}
                {downloadSuccessItem === item.id && (
                  <div className="absolute inset-0 bg-[#0c0617]/95 rounded-xl flex items-center justify-center gap-2 border border-emerald-500/20 animate-fade-in z-20">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 animate-bounce" />
                    <span className="font-mono text-xs text-emerald-300 font-bold">Download Dispatched Successfully!</span>
                  </div>
                )}
              </div>
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
}
