import React from 'react';

/**
 * Each BTS member's fan emoji. Visitors pick their bias here; the emoji
 * then shows beside their name wherever they comment or submit, in
 * place of a generic profile avatar.
 */
export const MEMBER_EMOJIS: { member: string; emoji: string }[] = [
  { member: 'RM', emoji: '🐨' },
  { member: 'Jin', emoji: '🐹' },
  { member: 'SUGA', emoji: '🐱' },
  { member: 'j-hope', emoji: '🐿️' },
  { member: 'Jimin', emoji: '🐥' },
  { member: 'V', emoji: '🐯' },
  { member: 'Jung Kook', emoji: '🐰' },
];

export function loadBiasEmoji(): string {
  try {
    return localStorage.getItem('bts_bias_emoji') || '';
  } catch {
    return '';
  }
}

export function saveBiasEmoji(emoji: string) {
  try {
    if (emoji) localStorage.setItem('bts_bias_emoji', emoji);
    else localStorage.removeItem('bts_bias_emoji');
  } catch {}
}

interface MemberEmojiPickerProps {
  value: string;
  onChange: (emoji: string) => void;
  compact?: boolean;
}

export default function MemberEmojiPicker({ value, onChange, compact = false }: MemberEmojiPickerProps) {
  const pick = (emoji: string) => {
    const next = value === emoji ? '' : emoji;
    saveBiasEmoji(next);
    onChange(next);
  };

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {!compact && (
        <span className="text-[9px] font-mono uppercase tracking-wider text-gray-500 mr-0.5">
          Your bias emoji:
        </span>
      )}
      {MEMBER_EMOJIS.map(({ member, emoji }) => (
        <button
          key={member}
          type="button"
          onClick={() => pick(emoji)}
          title={member}
          aria-label={`${member} emoji`}
          className={`w-7 h-7 rounded-full flex items-center justify-center text-[15px] leading-none transition-all cursor-pointer border ${
            value === emoji
              ? 'bg-purple-600/30 border-purple-400 scale-110 shadow-lg shadow-purple-600/30'
              : 'bg-white/5 border-white/10 hover:bg-white/10 hover:scale-105'
          }`}
        >
          {emoji}
        </button>
      ))}
      {value && (
        <span className="text-[9px] font-mono text-purple-300 ml-0.5">
          {MEMBER_EMOJIS.find(m => m.emoji === value)?.member}
        </span>
      )}
    </div>
  );
}
