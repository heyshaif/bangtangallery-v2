import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { MEMBER_BIRTHDAYS } from '../utils/birthdays';
import { BTSEvent } from '../types';

// Batch 78 — ARMY Calendar: one month grid for the Events page
// showing member birthdays (from the site's own member data),
// concerts (published config) and events (published config) on
// their real dates. Everything comes from data the page already
// has — nothing extra is fetched and nothing is written.

interface CalItem {
  kind: 'birthday' | 'concert' | 'event';
  emoji: string;
  label: string;
  sub?: string;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];
const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const DOT: Record<CalItem['kind'], string> = {
  birthday: 'bg-pink-400',
  concert: 'bg-purple-400',
  event: 'bg-rose-400'
};

function parseDay(raw: any): Date | null {
  if (!raw) return null;
  const d = new Date(raw);
  return isNaN(d.getTime()) ? null : d;
}

export default function ArmyCalendar({
  events,
  concerts
}: {
  events: BTSEvent[];
  concerts: any[];
}) {
  const today = useMemo(() => new Date(), []);
  const [cursor, setCursor] = useState({ y: today.getFullYear(), m: today.getMonth() });
  const [selected, setSelected] = useState({
    y: today.getFullYear(),
    m: today.getMonth(),
    d: today.getDate()
  });

  const itemsByDay = useMemo(() => {
    const map = new Map<number, CalItem[]>();
    const add = (day: number, item: CalItem) => {
      const arr = map.get(day) || [];
      arr.push(item);
      map.set(day, arr);
    };
    MEMBER_BIRTHDAYS.forEach((b) => {
      if (b.month === cursor.m) {
        add(b.day, {
          kind: 'birthday',
          emoji: '🎂',
          label: `${b.emoji} ${b.name}'s Birthday`,
          sub: `Turns ${cursor.y - b.birthYear}`
        });
      }
    });
    (events || []).forEach((evt) => {
      const d = parseDay((evt as any).countdownTarget || (evt as any).dDayTarget || evt.date);
      if (d && d.getFullYear() === cursor.y && d.getMonth() === cursor.m) {
        add(d.getDate(), {
          kind: 'event',
          emoji: '🎤',
          label: evt.title,
          sub: (evt as any).location || (evt as any).venue || undefined
        });
      }
    });
    (concerts || []).forEach((c) => {
      const d = parseDay(c?.date);
      if (d && d.getFullYear() === cursor.y && d.getMonth() === cursor.m) {
        add(d.getDate(), {
          kind: 'concert',
          emoji: '🎬',
          label: c.title,
          sub: c.venue || c.quality || undefined
        });
      }
    });
    return map;
  }, [cursor, events, concerts]);

  const firstWeekday = new Date(cursor.y, cursor.m, 1).getDay();
  const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1)
  ];

  const move = (delta: number) => {
    setCursor((c) => {
      const nm = c.m + delta;
      return { y: c.y + Math.floor(nm / 12), m: ((nm % 12) + 12) % 12 };
    });
  };
  const goToday = () => {
    setCursor({ y: today.getFullYear(), m: today.getMonth() });
    setSelected({ y: today.getFullYear(), m: today.getMonth(), d: today.getDate() });
  };

  const selectedItems =
    selected.y === cursor.y && selected.m === cursor.m
      ? itemsByDay.get(selected.d) || []
      : [];
  const selectedDate = new Date(selected.y, selected.m, selected.d);

  return (
    <div className="rounded-3xl border border-white/5 bg-black/40 backdrop-blur-md p-4 sm:p-6 space-y-4">
      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base sm:text-lg font-extrabold text-white flex items-center gap-2">
          📅 ARMY Calendar
        </h3>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => move(-1)}
            aria-label="Previous month"
            className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-white flex items-center justify-center hover:bg-white/10 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-bold text-purple-200 min-w-[118px] sm:min-w-[132px] text-center">
            {MONTHS[cursor.m]} {cursor.y}
          </span>
          <button
            onClick={() => move(1)}
            aria-label="Next month"
            className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-white flex items-center justify-center hover:bg-white/10 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={goToday}
            className="ml-1 px-3 h-8 rounded-lg bg-purple-600 text-white text-[11px] font-bold hover:bg-purple-500 cursor-pointer"
          >
            Today
          </button>
        </div>
      </div>

      {/* weekday header */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-[10px] font-mono font-bold text-gray-500 uppercase py-1">
            {w}
          </div>
        ))}
        {cells.map((day, i) => {
          if (day === null) return <div key={`blank-${i}`} />;
          const items = itemsByDay.get(day) || [];
          const isToday =
            day === today.getDate() && cursor.m === today.getMonth() && cursor.y === today.getFullYear();
          const isSelected = selected.d === day && selected.m === cursor.m && selected.y === cursor.y;
          return (
            <button
              key={day}
              onClick={() => setSelected({ y: cursor.y, m: cursor.m, d: day })}
              className={`h-12 sm:h-14 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                isSelected
                  ? 'bg-purple-600 border-purple-400 text-white'
                  : isToday
                    ? 'border-pink-400/70 bg-pink-500/10 text-white'
                    : 'border-white/5 bg-white/[0.02] text-gray-300 hover:border-purple-400/40'
              }`}
            >
              <span className={`text-sm leading-none ${items.length ? 'font-extrabold text-white' : ''}`}>
                {day}
              </span>
              {items.length > 0 && (
                <span className="flex gap-1">
                  {items.slice(0, 3).map((it, j) => (
                    <span key={j} className={`w-1.5 h-1.5 rounded-full ${DOT[it.kind]}`} />
                  ))}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* legend */}
      <div className="flex flex-wrap gap-4 text-[11px] text-gray-400">
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-pink-400" /> 🎂 Birthday</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-purple-400" /> 🎬 Concert</span>
        <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-400" /> 🎤 Event</span>
      </div>

      {/* selected day */}
      <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-4">
        <p className="text-xs font-mono font-bold text-purple-300 uppercase tracking-wider mb-2">
          {selectedDate.toLocaleDateString(undefined, {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric'
          })}
        </p>
        {selectedItems.length === 0 ? (
          <p className="text-sm text-gray-400">Nothing scheduled — a quiet ARMY day 💜</p>
        ) : (
          <ul className="space-y-2">
            {selectedItems.map((it, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm">
                <span className="text-base leading-none mt-0.5">{it.emoji}</span>
                <span>
                  <span className="font-bold text-white">{it.label}</span>
                  {it.sub && <span className="block text-xs text-gray-400">{it.sub}</span>}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
