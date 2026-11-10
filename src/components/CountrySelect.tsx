import { COUNTRIES } from '../data/countries';

// Shared required Country select (Batch 91) used by every visitor
// submission form — Supporters Wall, video/music submissions,
// feedback and contact. The ARMY World Map's join bar uses the
// same country list.
export default function CountrySelect({
  value,
  onChange,
  className = ''
}: {
  value: string;
  onChange: (country: string) => void;
  className?: string;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      required
      className={`w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/10 focus:border-purple-400/60 outline-none text-sm text-white cursor-pointer ${className}`}
      aria-label="Your country"
    >
      <option value="" disabled className="bg-[#150a26]">
        Select your country *
      </option>
      {COUNTRIES.map((c) => (
        <option key={c.name} value={c.name} className="bg-[#150a26]">
          {c.name}
        </option>
      ))}
    </select>
  );
}
