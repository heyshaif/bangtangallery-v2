import { MEMBERS } from '../data/btsData';

// Member birthdays come from the site's own member data (btsData), so
// the countdown and the birthday wish can never drift out of sync
// with the profiles. Dates use the visitor's local calendar day.

export interface MemberBirthday {
  id: string;
  name: string;
  emoji: string;
  month: number; // 0-11
  day: number;
  birthYear: number;
}

export const MEMBER_BIRTHDAYS: MemberBirthday[] = MEMBERS.map((m: any) => {
  const d = new Date(m.birthday);
  return {
    id: m.id,
    name: m.name,
    emoji: m.emoji || '💜',
    month: d.getMonth(),
    day: d.getDate(),
    birthYear: d.getFullYear()
  };
}).filter((b) => Number.isFinite(b.month) && Number.isFinite(b.day) && Number.isFinite(b.birthYear));

export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export interface BirthdayInfo {
  member: MemberBirthday;
  /** Local midnight at the start of the (next) birthday. */
  date: Date;
  /** Age the member turns on that date. */
  turningAge: number;
  isToday: boolean;
}

export function getBirthdayInfo(now: Date = new Date()): BirthdayInfo | null {
  let best: BirthdayInfo | null = null;
  for (const member of MEMBER_BIRTHDAYS) {
    const isToday = now.getMonth() === member.month && now.getDate() === member.day;
    let year = now.getFullYear();
    let date = new Date(year, member.month, member.day);
    if (!isToday && date.getTime() < new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) {
      year += 1;
      date = new Date(year, member.month, member.day);
    }
    const info: BirthdayInfo = {
      member,
      date,
      turningAge: year - member.birthYear,
      isToday
    };
    if (!best || date.getTime() < best.date.getTime()) best = info;
  }
  return best;
}
