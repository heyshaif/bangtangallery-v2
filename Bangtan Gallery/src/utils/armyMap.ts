// ARMY World Map helpers (Batch 91): the visitor's country is
// remembered once and reused by every submission form; pinning a
// country lights it on the map (one shared endpoint).

export function getSavedCountry(): string {
  try {
    return localStorage.getItem('bg_country') || '';
  } catch {
    return '';
  }
}

export function saveCountry(country: string) {
  try {
    localStorage.setItem('bg_country', country);
  } catch {}
}

/** Best-effort pin after a successful submission — never blocks
 *  or fails the submission itself. */
export async function pinCountry(country: string, previous?: string): Promise<boolean> {
  if (!country) return false;
  try {
    const res = await fetch('/api/army-map/pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ country, previous: previous && previous !== country ? previous : '' })
    });
    const data = await res.json().catch(() => null);
    return !!(data && data.success);
  } catch {
    return false;
  }
}
