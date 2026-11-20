/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Mail, Search, Trash2, CheckCircle2, RotateCcw, Download, Calendar, ArrowUpDown, Filter, ShieldCheck, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject?: string;
  message: string;
  createdAt: string;
  ip: string;
  country: string;
  browser: string;
  device: string;
  status: 'Unread' | 'Read' | 'Replied';
}

const thankYouQuotes = [
  {
    quote: "Thank you so much for creating this beautiful digital sanctuary! The music player and HD wallpapers are absolutely stunning. Much love from a proud ARMY! 💜",
    author: "Sarah L., USA",
    badge: "ARMY Core"
  },
  {
    quote: "I’m in awe of how cohesive and elegant this space is. Thank you for preserving these BTS memories so beautifully. Streaming from Seoul with love! 🇰🇷✨",
    author: "Min-ji Kim, South Korea",
    badge: "Gallery Enthusiast"
  },
  {
    quote: "Being able to track BTS anniversary milestones and read Festa histories here feels like a warm hug. Thank you for your hard work in running this! 🎂🌸",
    author: "Chloe B., UK",
    badge: "Festa Historian"
  },
  {
    quote: "The design, the music select, and the dark cosmic aesthetic are so premium. Truly the ultimate fan portal. Keep up the amazing work! 🌌⟭⟬",
    author: "Elena R., Spain",
    badge: "Regular Visitor"
  }
];

export default function AdminContactDashboard() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorOnLoad, setErrorOnLoad] = useState('');
  
  // Search & Filter controls
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Unread' | 'Read' | 'Replied'>('All');
  const [sortByDate, setSortByDate] = useState<'desc' | 'asc'>('desc');
  const [selectedMsg, setSelectedMsg] = useState<ContactMessage | null>(null);

  const [activeQuoteIndex, setActiveQuoteIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveQuoteIndex(prev => (prev + 1) % thankYouQuotes.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  // Load administrative messages list
  const fetchMessages = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    setErrorOnLoad('');
    try {
      const res = await fetch('/api/admin/contact');
      if (!res.ok) {
        throw new Error('Could not retrieve administrators inbox logs.');
      }
      const data = await res.json();
      setMessages(data);
    } catch (err: any) {
      setErrorOnLoad(err.message || 'Failure connecting to database endpoints.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setIsAdmin(true);
        // Defer fetch briefly to allow auth token propagation
        setTimeout(() => {
          fetchMessages();
        }, 100);
      } else {
        setIsAdmin(false);
        setMessages([]);
      }
    });
    return () => unsubscribe();
  }, []);

  if (!isAdmin) return null;

  // Update status (Read / Replied)
  const handleUpdateStatus = async (id: string, newStatus: 'Read' | 'Replied') => {
    try {
      const res = await fetch(`/api/admin/contact/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        // Update local list state
        setMessages(prev => prev.map(m => m.id === id ? { ...m, status: newStatus } : m));
        if (selectedMsg && selectedMsg.id === id) {
          setSelectedMsg(prev => prev ? { ...prev, status: newStatus } : null);
        }
      }
    } catch (err) {
      console.error('Failed to update message status:', err);
    }
  };

  // Delete message
  const handleDeleteMessage = async (id: string) => {
    if (!confirm('Are you absolutely sure you want to permanently erase this message record?')) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/contact/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setMessages(prev => prev.filter(m => m.id !== id));
        if (selectedMsg && selectedMsg.id === id) {
          setSelectedMsg(null);
        }
      }
    } catch (err) {
      console.error('Failed to delete message:', err);
    }
  };

  // Export as JSON file
  const handleExportJSON = () => {
    try {
      const fileData = JSON.stringify(messages, null, 2);
      const blob = new Blob([fileData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bangtan_gallery_contact_logs_${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  // Export as CSV
  const handleExportCSV = () => {
    try {
      const headers = ['id', 'name', 'email', 'subject', 'message', 'createdAt', 'ip', 'country', 'browser', 'device', 'status'];
      const csvRows = [headers.join(',')];

      for (const msg of messages) {
        const values = headers.map(header => {
          const val = (msg as any)[header] || '';
          const escaped = ('' + val).replace(/"/g, '""');
          return `"${escaped}"`;
        });
        csvRows.push(values.join(','));
      }

      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `bangtan_gallery_contact_logs_${Date.now()}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('CSV Export failed:', err);
    }
  };

  // Filter and sort items
  const filteredMessages = messages
    .filter(msg => {
      const matchesSearch = 
        msg.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (msg.subject && msg.subject.toLowerCase().includes(searchQuery.toLowerCase())) ||
        msg.message.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusFilter === 'All' || msg.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortByDate === 'desc' ? dateB - dateA : dateA - dateB;
    });

  const unreadCount = messages.filter(m => m.status === 'Unread').length;

  return (
    <div id="admin-dashboard-container" className="rounded-2xl border border-white/5 bg-black/40 backdrop-blur-md p-6 mt-8 space-y-6 font-sans">
      
      {/* SECURE ADMINISTRATIVE COMMUNICATION HUB with Animated Carousel thanks and heart pops */}
      <div className="bg-[#120b29]/60 border border-purple-500/20 rounded-xl p-5 relative overflow-hidden backdrop-blur-xl">
        {/* Subtle glowing background accents */}
        <div className="absolute -right-10 -top-10 w-45 h-45 bg-purple-600/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -left-10 -bottom-10 w-45 h-45 bg-fuchsia-600/10 rounded-full blur-2xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center relative z-10">
          
          {/* Left Side: Quote Carousel Info Block */}
          <div className="lg:col-span-8 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-2.1 h-2.1 rounded-full bg-fuchsia-500 animate-ping shrink-0" />
              <h3 className="text-xs font-black text-white uppercase tracking-widest font-mono flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-fuchsia-400" /> SECURE ADMINISTRATIVE COMMUNICATION HUB
              </h3>
            </div>

            {/* Dynamic Quote Box with line-clamp */}
            <div className="relative h-[80px] sm:h-[65px] overflow-hidden flex items-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeQuoteIndex}
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  transition={{ duration: 0.25, ease: "easeOut" }}
                  className="space-y-1"
                >
                  <p className="text-xs text-purple-200 italic leading-relaxed font-sans font-medium">
                    "{thankYouQuotes[activeQuoteIndex].quote}"
                  </p>
                  <div className="flex items-center gap-2 text-[10px] font-mono">
                    <span className="text-slate-400 font-bold">— {thankYouQuotes[activeQuoteIndex].author}</span>
                    <span className="px-1.5 py-0.5 rounded bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-300 font-extrabold text-[8px] uppercase tracking-wider">
                      {thankYouQuotes[activeQuoteIndex].badge}
                    </span>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Progress/bullet slider trackers */}
            <div className="flex gap-2 items-center pt-0.5">
              {thankYouQuotes.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveQuoteIndex(i)}
                  className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                    activeQuoteIndex === i ? 'w-6 bg-fuchsia-500' : 'w-1.5 bg-purple-950/50 hover:bg-purple-800'
                  }`}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Right Side: Database & export toolkit controls */}
          <div className="lg:col-span-4 flex flex-col items-stretch lg:items-end justify-between self-stretch gap-3">
            <div className="flex items-center gap-1.5 bg-black/40 border border-purple-500/10 p-2.5 rounded-lg text-[10px] text-fuchsia-200 self-stretch justify-center lg:justify-start">
              <Heart className="w-3.5 h-3.5 text-fuchsia-400 fill-fuchsia-400/20 animate-pulse" />
              <span>ARMY visitor appreciation messages stream</span>
            </div>

            <div className="flex items-center justify-between lg:justify-end gap-2 w-full">
              <button 
                onClick={fetchMessages}
                disabled={loading}
                className="flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold rounded bg-purple-950/35 text-purple-200 hover:text-white border border-purple-500/25 hover:border-purple-500/50 cursor-pointer hover:bg-purple-900/40 transition-all flex-grow lg:flex-grow-0 disabled:opacity-50"
                title="Reload Logs"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> {loading ? 'Syncing...' : 'Reload Hub'}
              </button>
              
              <div className="flex gap-1.5 flex-grow lg:flex-grow-0">
                <button 
                  onClick={handleExportJSON}
                  disabled={messages.length === 0}
                  className="flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-mono rounded bg-white/5 text-gray-300 hover:text-white border border-white/10 disabled:opacity-40 cursor-pointer transition-all flex-grow lg:flex-grow-0"
                  title="Export JSON"
                >
                  <Download className="w-3 h-3" /> JSON
                </button>

                <button 
                  onClick={handleExportCSV}
                  disabled={messages.length === 0}
                  className="flex items-center justify-center gap-1 px-2.5 py-1.5 text-xs font-mono rounded bg-white/5 text-gray-300 hover:text-white border border-white/10 disabled:opacity-40 cursor-pointer transition-all flex-grow lg:flex-grow-0"
                  title="Export CSV"
                >
                  <Download className="w-3 h-3" /> CSV Export
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Simple Messages List Stream */}
      {messages.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h4 className="text-xs font-mono font-bold text-fuchsia-300 uppercase tracking-widest">
              ✉️ Received Messages ({messages.length})
            </h4>
            {loading && (
              <span className="text-[10px] font-mono text-purple-400 animate-pulse">
                Syncing with database...
              </span>
            )}
          </div>

          {errorOnLoad && (
            <div className="p-3 bg-red-950/20 border border-red-500/20 text-red-200 rounded-lg text-xs font-mono">
              ⚠️ {errorOnLoad}
            </div>
          )}

          <div className="space-y-3.5">
            {messages.map((msg) => (
              <div 
                key={msg.id}
                className="p-4 rounded-xl border border-white/5 bg-black/30 hover:bg-black/50 transition-all space-y-3"
              >
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <span>👤 {msg.name}</span>
                      <span className="text-[10px] text-purple-400 font-mono font-normal">&lt;{msg.email}&gt;</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                    <span className="text-[10px] font-mono text-gray-500">
                      📅 {new Date(msg.createdAt).toLocaleString(undefined, { 
                        month: 'short', 
                        day: 'numeric', 
                        year: 'numeric',
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                    <button
                      onClick={() => handleDeleteMessage(msg.id)}
                      className="p-1 px-2.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/20 rounded border border-rose-500/10 hover:border-rose-500/30 font-mono text-[10px] font-bold cursor-pointer transition-all flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>

                <div className="p-3.5 bg-black/40 border border-white/[0.03] rounded-lg text-xs text-gray-300 leading-relaxed font-sans whitespace-pre-wrap">
                  {msg.message}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
