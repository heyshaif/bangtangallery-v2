/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Send, MapPin, Mail, Globe, CheckCircle, ShieldAlert, Sparkles, MessageSquareHeart, Bookmark } from 'lucide-react';
import { useBackend } from '../context/BackendContext';

interface ContactSectionProps {
  config?: any;
}

export default function ContactSection({ config }: ContactSectionProps) {
  const { refreshData } = useBackend();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [honeypot, setHoneypot] = useState('');

  // Status and Validation states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const playSuccessChime = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.12); // E5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.24); // G5
      osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.36); // C6
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 1.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 1.2);
    } catch (err) {}
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    setSuccessMessage('');

    // Field integrity validations
    if (!name.trim()) {
      setFormError('Name is required.');
      return;
    }
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFormError('A valid email address is required.');
      return;
    }
    if (!message.trim()) {
      setFormError('Message is required.');
      return;
    }

    setIsSubmitting(true);

    try {
      const targetPayload = {
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim() || undefined,
        message: message.trim(),
        honeypot: honeypot.trim()
      };

      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(targetPayload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Server rejected transmission.');
      }

      // Play audio indicator
      playSuccessChime();

      // Refresh global feeds so message is updated
      if (refreshData) {
        await refreshData();
      }

      setIsSubmitting(false);
      setSuccessMessage('✅ Your message has been sent successfully.');
      setShowSuccessModal(true);

      // Scroll to top
      window.scrollTo({ top: 0, behavior: 'smooth' });

      // Reset form variables
      setName('');
      setEmail('');
      setSubject('');
      setMessage('');
      setHoneypot('');
    } catch (err: any) {
      setIsSubmitting(false);
      setFormError(err.message || 'Transmission failed. Please verify your connection.');
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="border-b border-white/5 pb-6">
        <h2 className="text-2xl md:text-3xl font-sans font-extrabold text-white">
          Contact Bangtan Gallery
        </h2>
        <p className="text-gray-400 text-sm font-sans">
          Have queries, feedback, or conceptual business proposals? Send a private transmission directly to the web administrative team.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        
        {/* Left columns Information boards (Column span 2) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl border border-white/5 bg-black/40 backdrop-blur-md space-y-6">
            <h3 className="text-base font-mono font-bold text-purple-300 flex items-center gap-1.5 uppercase tracking-wider">
              <MessageSquareHeart className="w-5 h-5 text-purple-400" /> Transmit Coordinates
            </h3>

            <div className="space-y-4 text-sm font-sans text-gray-300">
              <div className="flex items-start gap-3.5 p-3 rounded-lg bg-white/[0.01] border border-white/[0.03]">
                <Mail className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-white">General Email</h4>
                  <p className="text-xs text-gray-400 mt-1">{config?.socialLinks?.email || 'tgarirangarmy7@gmail.com'}</p>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-400 leading-relaxed pt-2">
              Note: This website operates purely as an independent non-commercial entity. Forms are processed locally on-device. Your metadata is completely secure.
            </p>
          </div>
        </div>

        {/* Right Columns form submission panel (Column span 3) */}
        <form
          onSubmit={handleSendMessage}
          id="bangtan-contact-form"
          className="lg:col-span-3 p-6 rounded-2xl border border-white/5 bg-black/40 backdrop-blur-md space-y-4"
        >
          {formError && (
            <div className="flex items-center gap-2 p-3 text-xs bg-red-950/40 border border-red-500/20 text-red-300 rounded-lg">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <span>{formError}</span>
            </div>
          )}

          {successMessage && (
            <div className="flex items-center gap-2 p-3 text-xs bg-emerald-950/45 border border-emerald-500/25 text-emerald-300 rounded-lg font-sans">
              <span>{successMessage}</span>
            </div>
          )}

          {/* Invisible Honeypot Spam Protection Field */}
          <div style={{ display: 'none' }} aria-hidden="true">
            <input
              type="text"
              name="honeypot"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-purple-300 uppercase">Your Name/Alias *</label>
              <input
                type="text"
                placeholder="E.g., ARMY Friend"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-black/60 text-sm p-3 rounded-lg border border-white/5 text-white placeholder:text-gray-600 outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-mono text-purple-300 uppercase">Your Email Coordinates *</label>
              <input
                type="email"
                placeholder="E.g., friend@army.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/60 text-sm p-3 rounded-lg border border-white/5 text-white placeholder:text-gray-600 outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-purple-300 uppercase">Your Subject (Optional)</label>
            <input
              type="text"
              placeholder="E.g., Support, Fan art setup, playlist contribution..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full bg-black/60 text-sm p-3 rounded-lg border border-white/5 text-white placeholder:text-gray-600 outline-none focus:border-purple-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-mono text-purple-300 uppercase">Your Message *</label>
            <textarea
              placeholder="Write your transmission here..."
              rows={5}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-black/60 text-sm p-3 rounded-lg border border-white/5 text-white placeholder:text-gray-600 outline-none focus:border-purple-500 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            id="contact-form-submit-btn"
            className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 text-white font-semibold py-3 text-sm rounded-lg transition-all cursor-pointer text-center flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Transmitting Secure Message...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" /> Send Secure Transmission
              </>
            )}
          </button>
        </form>

      </div>

      {/* Sent success popup drawer */}
      {showSuccessModal && (
        <div id="contact-success-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-md rounded-2xl border border-purple-500/20 bg-[#0d071a] p-6 shadow-2xl text-center space-y-4">
            <div className="relative w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto shadow-md">
              <CheckCircle className="w-8 h-8 text-emerald-400 animate-bounce" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-bold text-white font-sans">Message Transmitted</h3>
              <p className="text-gray-400 text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-300" /> Secure Node Dispatched
              </p>
            </div>

            <p className="text-emerald-400 font-bold font-sans text-sm leading-relaxed">
              ✅ Your message has been sent successfully.
            </p>

            <button
              onClick={() => setShowSuccessModal(false)}
              id="close-contact-success-btn"
              className="w-full px-5 py-2.5 font-mono text-xs font-semibold rounded-lg bg-purple-600 text-white hover:bg-purple-500 transition-colors"
            >
              Continue to Gallery
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
