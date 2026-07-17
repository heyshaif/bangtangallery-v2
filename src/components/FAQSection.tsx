/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { FAQItem } from '../types';
import { FAQS } from '../data/btsData';
import { Search, ChevronDown, ChevronUp, HelpCircle, CheckCircle, Sparkles } from 'lucide-react';

export default function FAQSection({ items }: { items?: FAQItem[] }) {
  const displayFaqs = (items && items.length > 0) ? items : FAQS;
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>(null);

  // Toggle expanding faq
  const handleToggleFaq = (id: string) => {
    if (expandedFaqId === id) {
      setExpandedFaqId(null);
    } else {
      setExpandedFaqId(id);
    }
  };

  // Unique categories list
  const categoriesList = ['All', 'General', 'Music', 'Website', 'Lore'];

  // Search filter
  const filteredFaqs = displayFaqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (activeCategory === 'All') return matchesSearch;
    return faq.category === activeCategory && matchesSearch;
  });

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header and search bar context */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-6">
        <div>
          <h2 className="text-2xl md:text-3xl font-sans font-extrabold text-white">
            ARMY Help Desk (FAQ)
          </h2>
          <p className="text-gray-400 text-sm">
            Quick answers about the website, streaming rules, fan community insights and BTS lore resources.
          </p>
        </div>

        <div className="relative w-full md:w-80">
          <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search questions or terms..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/40 text-xs pl-10 pr-4 py-2 rounded-lg border border-purple-500/20 focus:border-purple-500/50 text-white outline-none placeholder:text-gray-500"
          />
        </div>
      </div>

      {/* Horizontal categories list */}
      <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-thin scrollbar-thumb-purple-900 scrollbar-track-transparent">
        {categoriesList.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`text-xs font-mono px-3.5 py-2 rounded-full border transition-all shrink-0 cursor-pointer ${
              activeCategory === cat
                ? 'bg-purple-600 border-purple-500 text-white shadow-md shadow-purple-500/20'
                : 'bg-white/[0.02] border-white/5 text-gray-400 hover:text-white hover:bg-white/[0.05]'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Accordion FAQ elements list */}
      {filteredFaqs.length === 0 ? (
        <div className="text-center py-20 rounded-xl border border-dashed border-white/5 bg-white/[0.01]">
          <p className="text-gray-400 font-mono text-sm">No matching questions in help directory.</p>
        </div>
      ) : (
        <div className="space-y-4 max-w-3xl mx-auto">
          {filteredFaqs.map(faq => {
            const isExpanded = expandedFaqId === faq.id;
            return (
              <div
                key={faq.id}
                className={`rounded-xl border transition-all duration-300 overflow-hidden ${
                  isExpanded 
                    ? 'border-purple-500/30 bg-[#0d071a]/50 shadow-[0_4px_25px_-5px_rgba(168,85,247,0.15)]' 
                    : 'border-white/5 bg-black/40 hover:border-purple-500/10'
                }`}
              >
                {/* Trigger Button */}
                <button
                  onClick={() => handleToggleFaq(faq.id)}
                  id={`faq-toggle-${faq.id}`}
                  className="w-full text-left p-5 flex justify-between items-center gap-4 cursor-pointer"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <HelpCircle className={`w-5 h-5 shrink-0 mt-0.5 transition-colors ${isExpanded ? 'text-purple-400' : 'text-gray-500'}`} />
                    <span className={`font-sans font-bold text-sm md:text-base leading-snug transition-colors ${isExpanded ? 'text-purple-300' : 'text-gray-200'}`}>
                      {faq.question}
                    </span>
                  </div>

                  <div className="shrink-0">
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-purple-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Collapsible Answer area with smooth transitions */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-1.5 pl-11 border-t border-white/[0.03] text-gray-300 text-xs md:text-sm leading-relaxed space-y-3 font-sans animate-fade-in">
                    <p>{faq.answer}</p>
                    <div className="flex justify-between items-center pt-2.5">
                      <span className="text-[10px] font-mono text-gray-500 uppercase">Category: {faq.category}</span>
                      <span className="text-[10px] font-mono text-purple-400 flex items-center gap-0.5"><Sparkles className="w-3 h-3" /> Fully Verified FAQ</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
