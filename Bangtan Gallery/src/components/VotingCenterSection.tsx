/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { VotingEvent, VotingSubmission } from '../types';
import AdsterraAd from './AdsterraAd';
import { 
  Vote, Calendar, ExternalLink, Plus, AlertCircle, Clock, 
  Trash2, Edit, CheckCircle, XCircle, Tag, Info, Image, Upload, Search, Link as LinkIcon,
  CheckCircle2, Shield, User, Sparkles, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useBackend } from '../context/BackendContext';
import { pinCountry } from '../utils/armyMap';
import { ensureProfile, profileName, profileHandle } from '../utils/profile';

const COUNTRIES = [
  'Bangladesh', 'India', 'Pakistan', 'Nepal', 'Sri Lanka', 'Bhutan', 'Maldives',
  'South Korea', 'Japan', 'China', 'Taiwan', 'Hong Kong', 'Thailand', 'Vietnam',
  'Philippines', 'Indonesia', 'Malaysia', 'Singapore', 'Myanmar', 'Cambodia', 'Laos',
  'United States', 'Canada', 'Mexico', 'Brazil', 'Argentina', 'Chile', 'Peru',
  'Colombia', 'Venezuela', 'Ecuador', 'Bolivia',
  'United Kingdom', 'France', 'Germany', 'Spain', 'Italy', 'Portugal', 'Netherlands',
  'Belgium', 'Poland', 'Romania', 'Ukraine', 'Russia', 'Turkey', 'Greece', 'Sweden',
  'Norway', 'Denmark', 'Finland', 'Ireland', 'Austria', 'Switzerland',
  'Saudi Arabia', 'United Arab Emirates', 'Qatar', 'Kuwait', 'Oman', 'Iraq', 'Iran',
  'Israel', 'Jordan', 'Lebanon', 'Egypt',
  'Nigeria', 'South Africa', 'Kenya', 'Ghana', 'Morocco', 'Algeria', 'Ethiopia',
  'Australia', 'New Zealand',
  'Other'
];

// Compress a vote screenshot to a modest JPEG data URL so it fits inside
// the ballot's database record (Firestore caps a document at 1 MiB).
const readScreenshot = (file: File): Promise<string> => new Promise((resolve, reject) => {
  const url = URL.createObjectURL(file);
  const img = new window.Image();
  img.onload = () => {
    try {
      const maxW = 900;
      const scale = Math.min(1, maxW / (img.width || maxW));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round((img.width || maxW) * scale);
      canvas.height = Math.round((img.height || maxW) * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas unavailable');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.72));
    } catch (e) { reject(e); }
  };
  img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read that image.')); };
  img.src = url;
});

// Generate some unique user id for local suggestions persistence if not loaded
const getUserId = () => {
  let uid = localStorage.getItem('bts_voter_uid');
  if (!uid) {
    uid = 'bts-voter-' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('bts_voter_uid', uid);
  }
  return uid;
};

interface VotingCenterSectionProps {
  votingEvents?: VotingEvent[];
  onRefresh?: () => void;
}

export default function VotingCenterSection({ votingEvents = [], onRefresh }: VotingCenterSectionProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'suggest' | 'my-subs'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Create / Edit states
  const [userId] = useState(() => getUserId());
  const [mySubmissions, setMySubmissions] = useState<VotingSubmission[]>([]);
  const [isLoadingSubs, setIsLoadingSubs] = useState(false);
  
  // Submit Form States
  const [subTitle, setSubTitle] = useState('');
  const [subPlatform, setSubPlatform] = useState('');
  const [subCoverUrl, setSubCoverUrl] = useState('');
  const [subVoteUrl, setSubVoteUrl] = useState('');
  const [subDesc, setSubDesc] = useState('');
  const [subStart, setSubStart] = useState('');
  const [subEnd, setSubEnd] = useState('');
  const [subCaption, setSubCaption] = useState('');
  const [subExtra, setSubExtra] = useState('');
  
  // Upload State
  const [uploadProgress, setUploadProgress] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [uploadError, setUploadError] = useState('');

  // Editing state for user's own submissions
  const [editingSub, setEditingSub] = useState<VotingSubmission | null>(null);
  
  // Form success alert states
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // User Information & Vote Confirmation Modal States (Requirement 3)
  const { currentUser } = useBackend();
  const [voteModalEvent, setVoteModalEvent] = useState<VotingEvent | null>(null);
  const [detailsEvent, setDetailsEvent] = useState<VotingEvent | null>(null);
  const [voteUsername, setVoteUsername] = useState('');
  // Batch 109: a profile name covers the ballot identity too.
  useEffect(() => {
    if (profileName()) {
      setVoteFullName(profileName());
      setVoteUsername(profileHandle());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [voteFullName, setVoteFullName] = useState('');
  const [voteError, setVoteError] = useState('');
  const [voteSuccess, setVoteSuccess] = useState(false);
  const [isSubmittingVote, setIsSubmittingVote] = useState(false);

  // Vote proof states: X username, country and the vote screenshot.
  // The owner can switch the whole proof system off from the Admin
  // Panel (Voting Center CMS -> Vote Proof switch, then Publish).
  const [voteProofEnabled, setVoteProofEnabled] = useState(true);
  const [voteXUsername, setVoteXUsername] = useState('');
  const [voteCountry, setVoteCountry] = useState('');
  const [voteShot, setVoteShot] = useState('');
  const [voteShotName, setVoteShotName] = useState('');
  // Batch 142 (owner): vote proofs are ADMIN-ONLY. The public page
  // no longer fetches or shows them; the owner views them in
  // Admin Panel -> Voting Center CMS.

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/config/published');
        if (res.ok) {
          const cfg = await res.json();
          if (cfg && typeof cfg.voteProofEnabled === 'boolean') {
            setVoteProofEnabled(cfg.voteProofEnabled);
          }
        }
      } catch {}
    })();
  }, []);

  const handleOpenVoteModal = (event: VotingEvent) => {
    setVoteModalEvent(event);
    setVoteUsername(currentUser?.username || localStorage.getItem('bts_vote_username') || '');
    setVoteFullName(currentUser?.displayName || localStorage.getItem('bts_vote_fullname') || '');
    setVoteXUsername(localStorage.getItem('bts_vote_x') || '');
    setVoteCountry(localStorage.getItem('bts_vote_country') || '');
    setVoteShot('');
    setVoteShotName('');
    setVoteError('');
    setVoteSuccess(false);
  };

  const handleConfirmVote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voteModalEvent) return;

    const trimmedUser = profileHandle() || voteUsername.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    const trimmedName = profileName() || voteFullName.trim();

    if (!trimmedUser || trimmedUser.length < 2) {
      setVoteError('Please enter a valid username (at least 2 alphanumeric characters).');
      return;
    }
    if (!trimmedName || trimmedName.length < 2) {
      setVoteError('Please enter your full name for voter verification.');
      return;
    }

    const trimmedX = voteXUsername.trim().toLowerCase().replace(/^@+/, '').replace(/[^a-z0-9_]/g, '');
    if (voteProofEnabled) {
      if (!trimmedX || trimmedX.length < 2) {
        setVoteError('Please enter your X (Twitter) username — it is shown with your vote proof.');
        return;
      }
      if (!voteCountry) {
        setVoteError('Please select your country — votes are counted country by country.');
        return;
      }
      if (!voteShot) {
        setVoteError('Please upload a screenshot of your vote as proof.');
        return;
      }
    }

    // Check duplicate voting rule
    const voteKey = `bts_voted_${voteModalEvent.id}_${trimmedUser}`;
    if (localStorage.getItem(voteKey)) {
      setVoteError(`You have already cast a vote for "${voteModalEvent.title}" as @${trimmedUser}. Duplicate voting is restricted according to event rules!`);
      return;
    }

    setIsSubmittingVote(true);
    setVoteError('');

    try {
      const res = await fetch('/api/voting/ballot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventId: voteModalEvent.id,
          eventTitle: voteModalEvent.title,
          username: trimmedUser,
          fullName: trimmedName,
          xUsername: voteProofEnabled ? trimmedX : '',
          country: voteProofEnabled ? voteCountry : '',
          screenshotUrl: voteProofEnabled ? voteShot : '',
          timestamp: new Date().toISOString()
        })
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        throw new Error(data?.error || 'The vote could not be recorded. Please try again.');
      }

      localStorage.setItem('bts_vote_username', trimmedUser);
      localStorage.setItem('bts_vote_fullname', trimmedName);
      if (voteProofEnabled) {
        localStorage.setItem('bts_vote_x', trimmedX);
        localStorage.setItem('bts_vote_country', voteCountry);
      }
      localStorage.setItem(voteKey, new Date().toISOString());

      // Batch 91: a vote proof's country also lights the ARMY World Map
      if (voteProofEnabled && voteCountry) pinCountry(voteCountry);
      ensureProfile(trimmedName || trimmedUser, { country: voteCountry });

      setVoteSuccess(true);
    } catch (err: any) {
      setVoteError(err.message || 'Error recording vote. Please try again.');
    } finally {
      setIsSubmittingVote(false);
    }
  };

  // Fetch my submissions
  const fetchMySubmissions = async () => {
    setIsLoadingSubs(true);
    try {
      const res = await fetch(`/api/voting/submissions?submittedBy=${userId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setMySubmissions(data.submissions || []);
        }
      }
    } catch (err) {
      console.error('Error fetching submissions:', err);
    } finally {
      setIsLoadingSubs(false);
    }
  };

  useEffect(() => {
    fetchMySubmissions();
  }, [userId, activeTab]);

  // Standard preset banner options for easier suggestions
  const presetCovers = [
    { title: 'Golden FESTA Violet', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/BTS_during_a_White_House_press_conference_May_31%2C_2022_%28cropped%29.jpg/1280px-BTS_during_a_White_House_press_conference_May_31%2C_2022_%28cropped%29.jpg' },
    { title: 'Concert Light Arena', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/BTS_during_a_White_House_press_conference_May_31%2C_2022_%28cropped%29.jpg/1280px-BTS_during_a_White_House_press_conference_May_31%2C_2022_%28cropped%29.jpg' },
    { title: 'Euphoria Blue Stage', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/BTS_during_a_White_House_press_conference_May_31%2C_2022_%28cropped%29.jpg/1280px-BTS_during_a_White_House_press_conference_May_31%2C_2022_%28cropped%29.jpg' },
    { title: 'Neon Magic Shop', url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/BTS_during_a_White_House_press_conference_May_31%2C_2022_%28cropped%29.jpg/1280px-BTS_during_a_White_House_press_conference_May_31%2C_2022_%28cropped%29.jpg' }
  ];

  // Drag and drop handler
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setUploadError('');

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleImageUpload(e.target.files[0]);
    }
  };

  const handleImageUpload = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setUploadError('Only image files are permitted.');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setUploadError('File size must be strictly smaller than 4MB.');
      return;
    }

    setUploadProgress(true);
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        if (editingSub) {
          setEditingSub({ ...editingSub, coverUrl: reader.result });
        } else {
          setSubCoverUrl(reader.result);
        }
        setUploadProgress(false);
      }
    };
    reader.onerror = () => {
      setUploadError('Failed to encode the file as Base64.');
      setUploadProgress(false);
    };
    reader.readAsDataURL(file);
  };

  const resetForm = () => {
    setSubTitle('');
    setSubPlatform('');
    setSubCoverUrl('');
    setSubVoteUrl('');
    setSubDesc('');
    setSubStart('');
    setSubEnd('');
    setSubCaption('');
    setSubExtra('');
    setFeedbackMsg(null);
  };

  const handleSubmissionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMsg(null);

    if (!subTitle.trim()) {
      setFeedbackMsg({ type: 'error', text: 'Voting Title is required.' });
      return;
    }
    if (!subVoteUrl.trim()) {
      setFeedbackMsg({ type: 'error', text: 'Official redirect voting link are required.' });
      return;
    }

    try {
      const res = await fetch('/api/voting/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: subTitle,
          platform: subPlatform || 'Online platform',
          coverUrl: subCoverUrl || presetCovers[0].url,
          voteNowUrl: subVoteUrl,
          description: subDesc || 'Suggested community voice project.',
          startDate: subStart,
          endDate: subEnd,
          caption: subCaption,
          additionalInfo: subExtra,
          submittedBy: userId
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFeedbackMsg({ type: 'success', text: 'Thank you! Your voting event suggestion was submitted successfully and is pending admin moderation.' });
        resetForm();
        fetchMySubmissions();
        if (onRefresh) onRefresh();
        // Redirect to tab
        setTimeout(() => setActiveTab('my-subs'), 1500);
      } else {
        setFeedbackMsg({ type: 'error', text: data.error || 'Failed to submit.' });
      }
    } catch (err: any) {
      setFeedbackMsg({ type: 'error', text: err.message || 'System connectivity issue.' });
    }
  };

  const handleUpdateSubmissionValue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSub) return;

    try {
      const res = await fetch(`/api/voting/submit/${editingSub.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editingSub,
          submittedBy: userId
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setEditingSub(null);
        fetchMySubmissions();
        if (onRefresh) onRefresh();
      } else {
        alert(data.error || 'Failed to save edits.');
      }
    } catch (err: any) {
      alert(err.message || 'Connecting error.');
    }
  };

  const handleDeleteSubmission = async (id: string) => {
    if (!window.confirm('Delete this suggested voting event permanently?')) return;

    try {
      const res = await fetch(`/api/voting/submit/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submittedBy: userId })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        fetchMySubmissions();
        if (onRefresh) onRefresh();
      } else {
        alert(data.error || 'Deletion rejected.');
      }
    } catch (err: any) {
      alert(err.message || 'Connecting error.');
    }
  };

  // Sort ongoing voting events
  // Pinned first, then featured, then order
  const displayEvents = votingEvents
    .filter(ev => ev.status === 'published')
    .sort((a, b) => {
      // Pinned
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      // Featured
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      // Order
      return (a.order || 0) - (b.order || 0);
    });

  const filteredEvents = displayEvents.filter(ev => 
    ev.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    ev.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
    ev.platform.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div id="voting-center-hub" className="space-y-6 animate-fade-in">
      
      {/* Top Header Card */}
      <div className="relative overflow-hidden rounded-2xl border border-purple-500/10 bg-gradient-to-br from-[#120726] to-[#04010a] p-5 md:p-6 shadow-[0_10px_50px_-15px_rgba(168,85,247,0.2)]">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-purple-500/5 blur-3xl pointer-events-none" />
        <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full border border-purple-500/20 bg-purple-500/10 text-[11px] font-mono text-purple-300">
              <Vote className="w-4 h-4 animate-pulse" /> BTS Voting Center Active Desk
            </div>
            <h1 className="text-xl md:text-2xl font-sans font-extrabold text-white tracking-tight">
              🗳️ BTS Voting Center
            </h1>
            <p className="text-gray-300 max-w-2xl text-xs md:text-sm leading-relaxed">
              Every official, ongoing and upcoming voting campaign for BTS — in one place. 💜
            </p>
          </div>
          
          <button
            onClick={() => setActiveTab('suggest')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs md:text-sm cursor-pointer shadow-lg shadow-purple-600/20 active:scale-95 transition-all text-center shrink-0"
          >
            <Plus className="w-4 h-4" /> Suggest Voting Event
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-white/5 mt-5 gap-5 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('all')}
            className={`pb-2.5 text-xs md:text-sm font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'all' 
                ? 'border-purple-500 text-purple-300' 
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            🔥 Live Voting Events ({filteredEvents.length})
          </button>
          <button
            onClick={() => setActiveTab('suggest')}
            className={`pb-2.5 text-xs md:text-sm font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'suggest' 
                ? 'border-purple-500 text-purple-300' 
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            💡 Suggest New Poll
          </button>
          <button
            onClick={() => setActiveTab('my-subs')}
            className={`pb-2.5 text-xs md:text-sm font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'my-subs' 
                ? 'border-purple-500 text-purple-300' 
                : 'border-transparent text-gray-400 hover:text-white'
            }`}
          >
            💜 My Suggestions ({mySubmissions.length})
          </button>
        </div>
      </div>

      {/* Main Tab Render Grid */}
      <AnimatePresence mode="wait">
        
        {/* Tab 1: Live Voting Events Grid */}
        {activeTab === 'all' && (
          <motion.div
            key="live-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Search filter area */}
            <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4">
              <div className="text-gray-400 text-xs font-mono">
                Showing {filteredEvents.length} of {displayEvents.length} running major campaigns
              </div>
              <div className="relative md:w-80 w-full">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Filter by title, platform or details..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-black/40 text-xs pl-9 pr-4 py-2.5 rounded-lg border border-purple-500/10 focus:border-purple-500/45 text-white outline-none placeholder:text-gray-500"
                />
              </div>
            </div>

            {filteredEvents.length === 0 ? (
              <div className="text-center py-20 rounded-2xl border border-dashed border-white/5 bg-white/[0.01]">
                <Vote className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 font-mono text-sm">No match found in current active voting campaigns.</p>
                <button 
                  onClick={() => setSearchTerm('')} 
                  className="mt-3 text-purple-400 text-xs underline hover:text-purple-300 cursor-pointer"
                >
                  Clear search filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEvents.map((event) => {
                  // Calculate time metadata
                  const isPinned = event.isPinned;
                  const isFeatured = event.isFeatured;
                  const daysLeft = () => {
                    if (!event.endDate) return null;
                    const end = new Date(event.endDate).getTime();
                    const now = new Date().getTime();
                    const diff = end - now;
                    if (diff <= 0) return 'Closed';
                    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24))) + ' days left';
                  };
                  const timeBadge = daysLeft();

                  return (
                    <div 
                      key={event.id}
                      className={`group relative flex flex-col rounded-xl border overflow-hidden transition-all duration-300 bg-black/40 ${
                        isPinned 
                          ? 'border-purple-500/40 bg-gradient-to-b from-[#1c082e] to-black/40 shadow-[0_4px_30px_-5px_rgba(168,85,247,0.2)]'
                          : 'border-white/5 hover:border-purple-500/20'
                      }`}
                    >
                      {/* Cover Banner Area */}
                      <div className="relative h-44 overflow-hidden w-full bg-gray-950 cursor-pointer" onClick={() => setDetailsEvent(event)} title="View event details">
                        <img 
                          src={event.coverUrl} 
                          alt={event.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" />
                        
                        {/* Pinned / Featured Badges */}
                        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                          {isPinned && (
                            <span className="px-2 py-0.5 rounded bg-purple-600 text-[10px] font-mono font-bold text-white shadow-md">
                              📌 PINNED
                            </span>
                          )}
                          {isFeatured && (
                            <span className="px-2 py-0.5 rounded bg-amber-500 text-[10px] font-mono font-bold text-black shadow-md">
                              ⭐ FEATURED
                            </span>
                          )}
                        </div>

                        {/* End Date counter badge */}
                        {timeBadge && (
                          <div className={`absolute bottom-3 right-3 px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                            timeBadge === 'Closed' ? 'bg-red-950/60 text-red-300 border border-red-500/30' : 'bg-black/75 text-amber-300 border border-amber-500/20'
                          }`}>
                            <Clock className="w-3 h-3 inline mr-1" /> {timeBadge}
                          </div>
                        )}
                      </div>

                      {/* Info Area */}
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          <span className="inline-block px-2 py-0.5 rounded bg-white/[0.04] text-[10px] font-mono uppercase text-gray-400 tracking-wider">
                            🛡 {event.platform}
                          </span>
                          <h3 className="text-base font-bold text-white line-clamp-1 group-hover:text-purple-300 transition-colors cursor-pointer" onClick={() => setDetailsEvent(event)} title="View event details">
                            {event.title}
                          </h3>
                          <p className="text-gray-400 text-xs line-clamp-3 leading-relaxed">
                            {event.description}
                          </p>
                        </div>

                        {/* Dates info bar */}
                        <div className="border-t border-white/5 pt-3.5 flex items-center justify-between text-[11px] font-mono text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-purple-400" />
                            <span>{event.startDate || 'flexible'}</span>
                          </div>
                          <span>to</span>
                          <span>{event.endDate || 'ongoing'}</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => setDetailsEvent(event)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-white/10 hover:border-purple-500/40 bg-white/[0.03] hover:bg-purple-950/30 transition-all font-bold text-xs text-purple-200 cursor-pointer active:scale-95"
                        >
                          <span>👁 View Details</span>
                        </button>

                        {/* Submit Vote Button - Triggers User Information Confirmation Flow */}
                        <button 
                          type="button"
                          onClick={() => handleOpenVoteModal(event)}
                          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-purple-500/20 hover:border-purple-500/50 bg-gradient-to-r from-purple-700/60 to-pink-700/60 hover:from-purple-600 hover:to-pink-600 transition-all font-bold text-xs text-white text-center shadow-lg shadow-purple-900/30 cursor-pointer active:scale-95"
                        >
                          <Vote className="w-3.5 h-3.5 text-purple-200" />
                          <span>Submit Vote</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <AdsterraAd type={7} />
          </motion.div>
        )}

        {/* Tab 2: Suggest a Voting Event Form */}
        {activeTab === 'suggest' && (
          <motion.div
            key="suggest-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="max-w-3xl mx-auto rounded-xl border border-white/5 bg-black/40 p-6 md:p-8"
          >
            <h2 className="text-xl md:text-2xl font-bold text-white mb-2 flex items-center gap-2">
              💡 Suggest BTS Voting Campaign
            </h2>
            <p className="text-gray-400 text-xs md:text-sm mb-6 leading-relaxed">
              Discovered a new ongoing polling desk? Add details below. Submissions are loaded 
              into pending state for Admin curation before appearing to the general public live!
            </p>

            <form onSubmit={handleSubmissionSubmit} className="space-y-6">
              
              {/* Error/Success Feedbacks */}
              {feedbackMsg && (
                <div className={`p-4 rounded-xl border text-xs flex gap-2.5 items-start ${
                  feedbackMsg.type === 'success' 
                    ? 'bg-emerald-950/40 border-emerald-500/20 text-emerald-300' 
                    : 'bg-red-950/40 border-red-500/20 text-red-300'
                }`}>
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>{feedbackMsg.text}</div>
                </div>
              )}

              {/* Grid 1: Title and Platform */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono uppercase text-gray-400">Voting Event Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., MAMA Awards 2026 - Best Fans Group"
                    value={subTitle}
                    onChange={(e) => setSubTitle(e.target.value)}
                    className="w-full bg-[#120b1f]/40 text-xs px-3.5 py-2.5 rounded-lg border border-purple-500/10 focus:border-purple-500/40 text-white outline-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono uppercase text-gray-400">Voting Platform / App Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Idol Champ, Mubeat, MNET"
                    value={subPlatform}
                    onChange={(e) => setSubPlatform(e.target.value)}
                    className="w-full bg-[#120b1f]/40 text-xs px-3.5 py-2.5 rounded-lg border border-purple-500/10 focus:border-purple-500/40 text-white outline-none"
                  />
                </div>
              </div>

              {/* Grid 2: Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono uppercase text-gray-400 font-medium">Start Date</label>
                  <input
                    type="date"
                    value={subStart}
                    onChange={(e) => setSubStart(e.target.value)}
                    className="w-full bg-[#120b1f]/40 text-xs px-3.5 py-2.5 rounded-lg border border-purple-500/10 focus:border-purple-500/45 text-white outline-none text-gray-300"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono uppercase text-gray-400 font-medium">End Date</label>
                  <input
                    type="date"
                    value={subEnd}
                    onChange={(e) => setSubEnd(e.target.value)}
                    className="w-full bg-[#120b1f]/40 text-xs px-3.5 py-2.5 rounded-lg border border-purple-500/10 focus:border-purple-500/45 text-white outline-none text-gray-300"
                  />
                </div>
              </div>

              {/* Link URL */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono uppercase text-gray-400 flex items-center justify-between">
                  <span>Official Voting Website Link *</span>
                  <LinkIcon className="w-3 h-3 text-purple-400" />
                </label>
                <input
                  type="url"
                  required
                  placeholder="https://www.official-voting-site.com/"
                  value={subVoteUrl}
                  onChange={(e) => setSubVoteUrl(e.target.value)}
                  className="w-full bg-[#120b1f]/40 text-xs px-3.5 py-2.5 rounded-lg border border-purple-500/10 focus:border-purple-500/40 text-white outline-none placeholder:text-gray-600"
                />
              </div>

              {/* Image Cover Selection & Upload */}
              <div className="space-y-3.5 border-t border-white/5 pt-4">
                <label className="text-[11px] font-mono uppercase text-gray-400 block">Voting Cover Banner Screen</label>
                
                {/* Visual Preset Selection */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {presetCovers.map((pc, idx) => (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => setSubCoverUrl(pc.url)}
                      className={`relative h-14 rounded-lg overflow-hidden border cursor-pointer group transition-all text-left ${
                        subCoverUrl === pc.url ? 'border-purple-500 ring-2 ring-purple-500/20' : 'border-white/5'
                      }`}
                    >
                      <img src={pc.url} alt={pc.title} className="w-full h-full object-cover brightness-50 group-hover:brightness-75" />
                      <div className="absolute inset-0 flex items-center justify-center p-1">
                        <span className="text-[9px] font-mono text-white text-center leading-tight">{pc.title}</span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Manual Link Input */}
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="Paste custom graphic banner URL here..."
                    value={subCoverUrl}
                    onChange={(e) => setSubCoverUrl(e.target.value)}
                    className="flex-1 bg-[#120b1f]/40 text-xs px-3.5 py-2.5 rounded-lg border border-purple-500/10 focus:border-purple-500/40 text-white outline-none"
                  />
                  {subCoverUrl && (
                    <button
                      type="button"
                      onClick={() => setSubCoverUrl('')}
                      className="px-3 rounded-lg border border-white/5 hover:border-red-500 text-xs text-gray-400 hover:text-red-400 transition-all cursor-pointer"
                    >
                      Reset
                    </button>
                  )}
                </div>

                {/* Drag Drop Area */}
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`p-6 border rounded-xl flex flex-col items-center justify-center text-center transition-all ${
                    dragActive 
                      ? 'border-purple-500 bg-purple-500/5' 
                      : 'border-white/5 bg-white/[0.01]'
                  }`}
                >
                  <label className="flex flex-col items-center justify-center cursor-pointer space-y-2">
                    <Upload className="w-6 h-6 text-purple-400" />
                    <span className="text-xs text-gray-300">
                      Drag & Drop files or <span className="text-purple-400 font-medium">Browse Files</span>
                    </span>
                    <span className="text-[10px] text-gray-500">Supports PNG, JPG, JPEG (Max 4MB)</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileChange} 
                      className="hidden" 
                    />
                  </label>
                  {uploadProgress && <div className="text-[10px] text-purple-300 animate-pulse mt-2">Encoding Base64 file...</div>}
                  {uploadError && <div className="text-[10px] text-red-400 mt-2">{uploadError}</div>}
                </div>

                {/* Render Cover preview indicator */}
                {subCoverUrl && (
                  <div className="relative h-20 rounded-lg overflow-hidden border border-white/10 w-44">
                    <img src={subCoverUrl} alt="Preview Banner" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 text-[9px] font-mono text-emerald-300 flex items-center justify-center">
                      ✓ Banner Loaded
                    </div>
                  </div>
                )}
              </div>

              {/* Multi-line fields */}
              <div className="space-y-4 border-t border-white/5 pt-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-mono uppercase text-gray-400">Description</label>
                  <textarea
                    rows={3}
                    placeholder="Provide short detailed parameters about the voting criteria and categories..."
                    value={subDesc}
                    onChange={(e) => setSubDesc(e.target.value)}
                    className="w-full bg-[#120b1f]/40 text-xs px-3.5 py-2 rounded-lg border border-purple-500/10 focus:border-purple-500/40 text-white outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono uppercase text-gray-400">Social Caption Tag</label>
                    <input
                      type="text"
                      placeholder="e.g., #BTSWorldwideChoice or #VoteforBTS"
                      value={subCaption}
                      onChange={(e) => setSubCaption(e.target.value)}
                      className="w-full bg-[#120b1f]/40 text-xs px-3.5 py-2.5 rounded-lg border border-purple-500/10 focus:border-purple-500/40 text-white outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-mono uppercase text-gray-400">Additional Information / Steps</label>
                    <input
                      type="text"
                      placeholder="e.g., Limit 10 votes daily using Google Login codes/tips"
                      value={subExtra}
                      onChange={(e) => setSubExtra(e.target.value)}
                      className="w-full bg-[#120b1f]/40 text-xs px-3.5 py-2.5 rounded-lg border border-purple-500/10 focus:border-purple-500/40 text-white outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Submission CTA BUTTON */}
              <button
                type="submit"
                className="w-full py-3 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-semibold cursor-pointer tracking-wide flex justify-center items-center gap-2"
              >
                📥 Submit Proposition for Validation
              </button>
            </form>
          </motion.div>
        )}

        {/* Tab 3: My suggestions with tracking status */}
        {activeTab === 'my-subs' && (
          <motion.div
            key="my-subs-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            <div className="max-w-2xl">
              <h2 className="text-lg md:text-xl font-bold text-white mb-1">
                🗳️ Suggested Tracks & Voting Desk Items 
              </h2>
              <p className="text-gray-405 text-xs">
                Your submitted items cookies identification is bound to this browser cache sandbox. 
                Pending suggestions can be changed or deleted securely.
              </p>
            </div>

            {isLoadingSubs ? (
              <div className="text-center py-10 font-mono text-purple-300 text-xs animate-pulse">
                Refreshing user contributions registry...
              </div>
            ) : mySubmissions.length === 0 ? (
              <div className="text-center py-16 rounded-xl border border-white/5 bg-white/[0.01]">
                <Plus className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-400 font-mono text-xs">You have not submitted any suggestions yet.</p>
                <button
                  onClick={() => setActiveTab('suggest')}
                  className="mt-3 text-xs bg-purple-600/10 hover:bg-purple-600/25 text-purple-300 px-4 py-1.5 rounded border border-purple-500/25 shrink-0 hover:border-purple-500/40 transition-all cursor-pointer"
                >
                  Create suggestion proposition
                </button>
              </div>
            ) : (
              <div className="space-y-4 max-w-4xl">
                {mySubmissions.map((sub) => {
                  const isPending = sub.status === 'pending';
                  const isApproved = sub.status === 'approved';
                  const isRejected = sub.status === 'rejected';

                  return (
                    <div
                      key={sub.id}
                      className="rounded-xl border border-white/5 bg-black/50 p-5 flex flex-col md:flex-row gap-5 items-stretch transition-all hover:border-white/10"
                    >
                      {/* Graphics Thumb */}
                      <div className="w-full md:w-36 h-24 rounded-lg overflow-hidden bg-gray-900 shrink-0 border border-white/5">
                        <img src={sub.coverUrl} alt={sub.title} className="w-full h-full object-cover" />
                      </div>

                      {/* Descriptive content */}
                      <div className="flex-1 flex flex-col justify-between space-y-2.5">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <span className="px-2 py-0.5 rounded bg-white/[0.04] text-[10px] font-mono text-gray-400 border border-white/5 uppercase">
                              🗳 {sub.platform}
                            </span>
                            
                            {/* Status label badge */}
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 border ${
                              isApproved 
                                ? 'bg-emerald-950/40 border-emerald-500/20 text-emerald-400' 
                                : isRejected 
                                ? 'bg-red-950/40 border-red-500/20 text-red-400'
                                : 'bg-amber-950/40 border-amber-500/20 text-amber-400 animate-pulse'
                            }`}>
                              {isApproved && <CheckCircle className="w-3 h-3 text-emerald-400" />}
                              {isRejected && <XCircle className="w-3 h-3 text-red-400" />}
                              {isPending && <Clock className="w-3 h-3 text-amber-400" />}
                              {sub.status.toUpperCase()}
                            </span>
                          </div>
                          
                          <h3 className="text-base font-bold text-white">{sub.title}</h3>
                          <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                            {sub.description}
                          </p>
                        </div>

                        {/* Extra indicators */}
                        <div className="flex items-center gap-4 text-[10px] font-mono text-gray-500">
                          {sub.caption && <span>Tag: <strong className="text-purple-400">{sub.caption}</strong></span>}
                          <span>Submitted: {new Date(sub.submittedAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* Action Triggers before approval */}
                      <div className="flex md:flex-col justify-end items-end gap-2 shrink-0 md:border-l border-white/5 md:pl-5">
                        {isPending ? (
                          <>
                            <button
                              onClick={() => setEditingSub(sub)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/10 hover:bg-purple-600/20 text-purple-300 hover:text-white text-xs border border-purple-500/15 cursor-pointer transition-all"
                            >
                              <Edit className="w-3 h-3" /> Edit
                            </button>
                            <button
                              onClick={() => handleDeleteSubmission(sub.id)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-950/10 hover:bg-red-950/30 text-red-300 hover:text-red-205 text-xs border border-red-500/10 cursor-pointer transition-all"
                            >
                              <Trash2 className="w-3 h-3" /> Delete
                            </button>
                          </>
                        ) : (
                          <span className="text-[10px] text-gray-550 font-mono italic">
                            Approved & Live website sync completed
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Editing Dialog Modal overlay */}
      {editingSub && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto backdrop-blur-sm animate-fade-in">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-2xl rounded-xl border border-purple-500/20 bg-[#0d071a] p-6 space-y-5 flex flex-col max-h-[90vh]"
          >
            <div className="flex justify-between items-center pb-3 border-b border-white/5">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Edit className="w-4 h-4 text-purple-400" /> Edit Own Submission Proposal
              </h3>
              <button 
                onClick={() => setEditingSub(null)}
                className="text-gray-400 hover:text-white text-xs px-2.5 py-1 rounded bg-white/[0.04] transition"
              >
                ✕ Cancel
              </button>
            </div>

            <form onSubmit={handleUpdateSubmissionValue} className="space-y-4 overflow-y-auto flex-1 pr-1 custom-scrollbar">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-gray-400 uppercase">Voting Title *</label>
                <input
                  type="text"
                  required
                  value={editingSub.title}
                  onChange={(e) => setEditingSub({ ...editingSub, title: e.target.value })}
                  className="w-full bg-black/40 text-xs px-3.5 py-2.5 rounded-lg border border-purple-500/15 text-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-gray-400 uppercase">Platform Name *</label>
                  <input
                    type="text"
                    required
                    value={editingSub.platform}
                    onChange={(e) => setEditingSub({ ...editingSub, platform: e.target.value })}
                    className="w-full bg-black/40 text-xs px-3.5 py-2.5 rounded-lg border border-purple-500/15 text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-gray-400 uppercase">Official Voting Link *</label>
                  <input
                    type="url"
                    required
                    value={editingSub.voteNowUrl}
                    onChange={(e) => setEditingSub({ ...editingSub, voteNowUrl: e.target.value })}
                    className="w-full bg-black/40 text-xs px-3.5 py-2.5 rounded-lg border border-purple-500/15 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-gray-400 uppercase">Start Date</label>
                  <input
                    type="date"
                    value={editingSub.startDate}
                    onChange={(e) => setEditingSub({ ...editingSub, startDate: e.target.value })}
                    className="w-full bg-black/40 text-xs px-3.5 py-2.5 rounded-lg border border-purple-500/15 text-white text-gray-300"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-gray-400 uppercase">End Date</label>
                  <input
                    type="date"
                    value={editingSub.endDate}
                    onChange={(e) => setEditingSub({ ...editingSub, endDate: e.target.value })}
                    className="w-full bg-black/40 text-xs px-3.5 py-2.5 rounded-lg border border-purple-500/15 text-white text-gray-300"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-gray-400 uppercase">Cover Banner URL / Custom Upload</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={editingSub.coverUrl}
                    onChange={(e) => setEditingSub({ ...editingSub, coverUrl: e.target.value })}
                    className="flex-1 bg-black/40 text-xs px-3.5 py-2.5 rounded-lg border border-purple-500/15 text-white"
                  />
                  
                  {/* File Selector Helper */}
                  <label className="px-3.5 py-2.5 rounded-lg bg-purple-600/20 text-purple-300 hover:text-white border border-purple-500/25 hover:bg-purple-600/30 text-xs cursor-pointer flex items-center gap-1.5 shrink-0">
                    <Upload className="w-3.5 h-3.5" /> Upload File
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileChange} 
                      className="hidden" 
                    />
                  </label>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-gray-400 uppercase">Voting Description</label>
                <textarea
                  rows={3}
                  value={editingSub.description}
                  onChange={(e) => setEditingSub({ ...editingSub, description: e.target.value })}
                  className="w-full bg-black/40 text-xs px-3.5 py-2 rounded-lg border border-purple-500/15 text-white resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-gray-400 uppercase">Caption Hashtag</label>
                  <input
                    type="text"
                    value={editingSub.caption || ''}
                    onChange={(e) => setEditingSub({ ...editingSub, caption: e.target.value })}
                    className="w-full bg-black/40 text-xs px-3.5 py-2.5 rounded-lg border border-purple-500/15 text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-mono text-gray-400 uppercase">Additional Instructions</label>
                  <input
                    type="text"
                    value={editingSub.additionalInfo || ''}
                    onChange={(e) => setEditingSub({ ...editingSub, additionalInfo: e.target.value })}
                    className="w-full bg-black/40 text-xs px-3.5 py-2.5 rounded-lg border border-purple-500/15 text-white"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3 justify-end">
                <button
                  type="button"
                  onClick={() => setEditingSub(null)}
                  className="px-4 py-2 rounded-lg border border-white/5 bg-white/[0.02] text-xs text-gray-300 hover:bg-white/[0.05] cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white shadow-lg cursor-pointer"
                >
                  Save Updates
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* User Information & Vote Confirmation Modal */}
      {detailsEvent && (
        <div
          className="fixed inset-0 z-[100001] bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setDetailsEvent(null)}
        >
          <div
            className="w-full max-w-lg rounded-2xl border border-purple-500/25 bg-[#0b0618] overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-52 w-full bg-gray-950">
              <img
                src={detailsEvent.coverUrl || (detailsEvent as any).coverImageUrl || ''}
                alt={detailsEvent.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b0618] via-transparent to-transparent" />
              <button
                type="button"
                onClick={() => setDetailsEvent(null)}
                className="absolute top-3 right-3 p-2 rounded-full bg-black/70 hover:bg-black border border-white/20 text-white cursor-pointer"
                aria-label="Close details"
              >
                ✕
              </button>
              <span className="absolute bottom-3 left-4 px-2 py-0.5 rounded bg-white/[0.08] text-[10px] font-mono uppercase text-gray-200 tracking-wider">
                🛡 {detailsEvent.platform}
              </span>
            </div>
            <div className="p-5 space-y-4">
              <h3 className="text-lg font-bold text-white leading-snug">{detailsEvent.title}</h3>
              <p className="text-gray-300 text-xs leading-relaxed whitespace-pre-wrap">{detailsEvent.description || 'No extra details were provided for this voting event.'}</p>
              <div className="grid grid-cols-2 gap-3 text-[11px] font-mono">
                <div className="rounded-lg border border-white/5 bg-black/30 p-3">
                  <span className="block text-gray-500 uppercase tracking-wider text-[9px]">Starts</span>
                  <span className="text-purple-200">{detailsEvent.startDate || 'Flexible'}</span>
                </div>
                <div className="rounded-lg border border-white/5 bg-black/30 p-3">
                  <span className="block text-gray-500 uppercase tracking-wider text-[9px]">Ends</span>
                  <span className="text-purple-200">{detailsEvent.endDate || 'Ongoing'}</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                {detailsEvent.voteNowUrl && (
                  <a
                    href={detailsEvent.voteNowUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#1db954]/80 hover:bg-[#1db954] transition-all font-bold text-xs text-white cursor-pointer active:scale-95"
                  >
                    🗳 Vote Now
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => { const ev = detailsEvent; setDetailsEvent(null); handleOpenVoteModal(ev); }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-purple-500/20 hover:border-purple-500/50 bg-gradient-to-r from-purple-700/60 to-pink-700/60 hover:from-purple-600 hover:to-pink-600 transition-all font-bold text-xs text-white cursor-pointer active:scale-95"
                >
                  <Vote className="w-3.5 h-3.5 text-purple-200" />
                  <span>Submit Vote</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {voteModalEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="w-full max-w-md max-h-[92vh] overflow-y-auto bg-[#0f0a1c] border border-purple-500/30 rounded-2xl p-6 shadow-2xl relative text-left"
          >
            {/* Top decorative gradient bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500" />

            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-900/50 border border-purple-500/30 flex items-center justify-center text-purple-300">
                  <Vote className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white leading-tight">Cast Verified Vote</h3>
                  <p className="text-[10px] text-gray-400">ARMY Official Voter Identity Verification</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setVoteModalEvent(null)}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Campaign Summary */}
            <div className="bg-purple-950/20 border border-purple-500/20 rounded-xl p-3 mb-4 flex items-center gap-3">
              {voteModalEvent.coverUrl ? (
                <img 
                  src={voteModalEvent.coverUrl} 
                  alt={voteModalEvent.title} 
                  className="w-12 h-12 rounded-lg object-cover border border-purple-500/30 shrink-0" 
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-purple-900/40 border border-purple-500/30 flex items-center justify-center text-purple-300 font-bold shrink-0">
                  💜
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h4 className="text-xs font-bold text-white truncate">{voteModalEvent.title}</h4>
                <div className="flex items-center gap-2 mt-0.5 text-[10px] text-purple-300">
                  <span className="font-mono bg-purple-900/40 px-1.5 py-0.5 rounded border border-purple-500/20">
                    {voteModalEvent.platform || 'ARMY Polling'}
                  </span>
                  <span>•</span>
                  <span>{voteModalEvent.status === 'published' ? 'Active' : voteModalEvent.status || 'Active'}</span>
                </div>
              </div>
            </div>

            {voteSuccess ? (
              <div className="text-center py-4 space-y-4">
                <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white flex items-center justify-center gap-1.5">
                    Vote Recorded Successfully! 💜
                  </h4>
                  <p className="text-xs text-gray-300 mt-1 max-w-xs mx-auto">
                    Thank you, <strong className="text-purple-300">@{voteUsername}</strong> ({voteFullName}). Your verified ballot has been logged.
                  </p>
                </div>

                <div className="p-3 bg-purple-950/40 border border-purple-500/20 rounded-xl text-left text-[11px] text-gray-300 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-bold text-purple-300">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Ballot Status: Validated & Protected</span>
                  </div>
                  <p className="text-[10px] text-gray-400">
                    Duplicate vote restriction is now active for this account on this device.
                  </p>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  {voteModalEvent.voteNowUrl && (
                    <a
                      href={voteModalEvent.voteNowUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs shadow-lg shadow-purple-900/40 transition-all cursor-pointer"
                    >
                      <span>Proceed to Official Voting Platform 🔗</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => setVoteModalEvent(null)}
                    className="w-full py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-300 transition-colors cursor-pointer"
                  >
                    Done & Return to Voting Center
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleConfirmVote} className="space-y-4">
                <div className="space-y-3">
                  {voteProofEnabled && (
                    <div>
                      <label className="block text-[11px] font-mono uppercase text-gray-300 mb-1 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <span className="text-purple-400 font-bold text-xs">𝕏</span>
                          <span>Your X Username *</span>
                        </span>
                        <span className="text-[10px] text-gray-500">Shown on proof wall</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-gray-500">@</span>
                        <input
                          type="text"
                          value={voteXUsername}
                          onChange={(e) => setVoteXUsername(e.target.value)}
                          placeholder="your_x_handle"
                          className="w-full bg-[#160d26] border border-purple-500/20 focus:border-purple-500/60 rounded-xl pl-8 pr-3.5 py-2.5 text-xs text-white placeholder-gray-600 outline-none transition-all"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-mono uppercase text-gray-300 mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-purple-400" />
                        <span>Voter Username *</span>
                      </span>
                      <span className="text-[10px] text-gray-500">Handle / Nickname</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-gray-500">@</span>
                      <input
                        type="text"
                        required
                        value={voteUsername}
                        readOnly={!!profileName()}
                        onChange={(e) => setVoteUsername(e.target.value)}
                        placeholder="army_jungkook7"
                        className="w-full bg-[#160d26] border border-purple-500/20 focus:border-purple-500/60 rounded-xl pl-8 pr-3.5 py-2.5 text-xs text-white placeholder-gray-600 outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono uppercase text-gray-300 mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-purple-400" />
                        <span>Full Name / Legal Identifier *</span>
                      </span>
                      <span className="text-[10px] text-gray-500">Verification</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={voteFullName}
                        readOnly={!!profileName()}
                      onChange={(e) => setVoteFullName(e.target.value)}
                      placeholder="e.g., Min Yoon-gi or Jane Doe"
                      className="w-full bg-[#160d26] border border-purple-500/20 focus:border-purple-500/60 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-600 outline-none transition-all"
                    />
                  </div>

                  {voteProofEnabled && (
                    <>
                      <div>
                        <label className="block text-[11px] font-mono uppercase text-gray-300 mb-1 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <span className="text-purple-400 text-xs">🌍</span>
                            <span>Your Country *</span>
                          </span>
                          <span className="text-[10px] text-gray-500">Counted by country</span>
                        </label>
                        <select
                          value={voteCountry}
                          onChange={(e) => setVoteCountry(e.target.value)}
                          className="w-full bg-[#160d26] border border-purple-500/20 focus:border-purple-500/60 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none transition-all cursor-pointer"
                        >
                          <option value="">Select your country…</option>
                          {COUNTRIES.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-mono uppercase text-gray-300 mb-1 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <Image className="w-3.5 h-3.5 text-purple-400" />
                            <span>Vote Screenshot (Proof) *</span>
                          </span>
                          <span className="text-[10px] text-gray-500">JPG / PNG</span>
                        </label>
                        <label className="flex items-center gap-3 w-full bg-[#160d26] border border-dashed border-purple-500/30 hover:border-purple-500/60 rounded-xl px-3.5 py-3 cursor-pointer transition-all">
                          {voteShot ? (
                            <img src={voteShot} alt="Vote proof" className="w-10 h-10 rounded-lg object-cover border border-purple-500/30 shrink-0" />
                          ) : (
                            <Upload className="w-5 h-5 text-purple-400 shrink-0" />
                          )}
                          <span className="text-xs text-gray-300 truncate">
                            {voteShot ? (voteShotName || 'Screenshot attached ✓') : 'Tap to upload your vote screenshot'}
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const f = e.target.files?.[0];
                              if (!f) return;
                              try {
                                const data = await readScreenshot(f);
                                setVoteShot(data);
                                setVoteShotName(f.name);
                                setVoteError('');
                              } catch {
                                setVoteError('That image could not be read. Please pick another screenshot.');
                              }
                            }}
                          />
                        </label>
                      </div>
                    </>
                  )}
                </div>

                <div className="p-2.5 bg-black/40 border border-white/5 rounded-xl text-[10px] text-gray-400 flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                  <span>
                    To maintain fair democratic BTS fandom standings, only one verified vote per registered identity is counted for this poll.
                  </span>
                </div>

                {voteError && (
                  <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-xs text-red-300 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>{voteError}</span>
                  </div>
                )}

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setVoteModalEvent(null)}
                    className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-300 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingVote}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-bold text-xs shadow-lg shadow-purple-900/40 transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSubmittingVote ? (
                      <span>Verifying & Submitting...</span>
                    ) : (
                      <>
                        <Vote className="w-3.5 h-3.5" />
                        <span>Confirm & Submit</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
