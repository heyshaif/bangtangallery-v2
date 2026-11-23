// Batch 187 — one real, year-verified photo per timeline entry. The photos
// are keyed by year + date (the pair is unique across the 11 entries), NOT
// stored on the event objects: the live config's timeline array was seeded
// long ago without photo fields, so a code-side lookup keeps the photos
// working for every visitor without a database migration. Admin-added
// entries simply have no photo. All 11 photos are Wikimedia Commons files
// (collected 2026-11-23, verified via the Commons API), self-hosted under
// public/images/timeline/ as JPGs (max 1600px wide, ~2.7 MB total) so the
// page never depends on upload.wikimedia.org at visit time. 8 of 11 need
// attribution — the credit line shows in the year detail view. Four entries
// carry an honest `note`: no freely licensed photo exists for what the
// entry describes, so the photo is the closest real substitute.
export interface TimelinePhoto {
  photo: string;
  credit: string;
  note?: string;
}

export const TIMELINE_PHOTOS: Record<string, TimelinePhoto> = {
  '2013|June 13, 2013': {
    photo: '/images/timeline/2013.jpg',
    credit: 'Bulletproof7bts / Wikimedia Commons (CC BY 4.0)',
  },
  '2015|April 29, 2015': {
    photo: '/images/timeline/2015.jpg',
    credit: 'JinTime / Wikimedia Commons (CC BY 4.0)',
  },
  '2017|May 21, 2017': {
    photo: '/images/timeline/2017.jpg',
    credit: 'TenAsia / Wikimedia Commons (CC BY 3.0)',
  },
  '2018|May 28, 2018': {
    photo: '/images/timeline/2018-tear.jpg',
    credit: 'KOREA Dispatch / Wikimedia Commons (CC BY 3.0)',
  },
  '2018|September 24, 2018': {
    photo: '/images/timeline/2018-un.jpg',
    credit: 'Korean Culture and Information Service / Wikimedia Commons (KOGL Type 1)',
    note: 'No freely licensed photo of the UN speech itself exists — this is BTS at the Korea–France Friendship Concert in Paris, October 2018.',
  },
  '2020|August 31, 2020': {
    photo: '/images/timeline/2020.jpg',
    credit: 'Carolin von Petzholdt / Wikimedia Commons (CC BY 3.0)',
    note: 'No freely licensed 2020 group photo exists — this is BTS performing “Butter” at the American Music Awards, November 2021.',
  },
  '2022|June 10, 2022': {
    photo: '/images/timeline/2022.jpg',
    credit: 'The White House / Wikimedia Commons (Public domain)',
  },
  '2023|April-December 2023': {
    photo: '/images/timeline/2023.jpg',
    credit: 'Lynn Jatania / Wikimedia Commons (CC BY-SA 4.0)',
    note: 'No 2023 group photo exists — SUGA on his Agust D Tour, April 2023.',
  },
  '2024|June 12, 2024': {
    photo: '/images/timeline/2024.jpg',
    credit: 'K-POPIT / Wikimedia Commons (CC BY 3.0)',
  },
  '2025|June-October 2025': {
    photo: '/images/timeline/2025.jpg',
    credit: 'K-POPIT / Wikimedia Commons (CC BY 3.0)',
    note: 'Jung Kook & Jimin at their discharge, June 2025 — no full-group reunion photo exists yet.',
  },
  '2026|June 13, 2026': {
    photo: '/images/timeline/2026.jpg',
    credit: 'Elwin594 / Wikimedia Commons (CC0)',
  },
};

export function getTimelinePhoto(evt: { year: string; date: string }): TimelinePhoto | undefined {
  return TIMELINE_PHOTOS[`${evt.year}|${evt.date}`];
}
