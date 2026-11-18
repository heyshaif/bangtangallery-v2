/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Batch 160 — seed data for the admin-editable Discography and Awards
// tabs. These lists live in the published config (`discography` and
// `awards` keys inside the existing config doc — NOT new Firestore
// collections). When a stored config has no list yet, the serve-time
// migration in firebaseController fills it from here; once the owner
// edits or publishes from the Admin Panel, their version wins and this
// file is never consulted again for that list.
//
// Every entry below was verified against public sources (Wikipedia,
// Kpop Wiki, Yonhap, award-show pages) on 2026-11-14. Anything that
// could not be verified was left out on purpose — never add an entry
// here without a source.
import { DiscographyEntry, AwardEntry } from '../types';

// BTS Korean discography, 2013–2026. Era groups match the filter
// chips on the Discography tab. Singles live in their own 'Singles'
// era so the album eras stay clean.
export const DISCOGRAPHY_ENTRIES: DiscographyEntry[] = [
  { id: 'disc-2-cool-4-skool', title: '2 Cool 4 Skool', type: 'Single Album', releaseDate: '2013-06-13', titleTrack: 'No More Dream', era: 'School Trilogy' },
  { id: 'disc-orul82', title: 'O!RUL8,2?', type: 'Mini Album', releaseDate: '2013-09-11', titleTrack: 'N.O', era: 'School Trilogy' },
  { id: 'disc-skool-luv-affair', title: 'Skool Luv Affair', type: 'Mini Album', releaseDate: '2014-02-12', titleTrack: 'Boy in Luv', era: 'School Trilogy' },
  { id: 'disc-dark-and-wild', title: 'Dark & Wild', type: 'Studio Album', releaseDate: '2014-08-19', titleTrack: 'Danger', era: 'School Trilogy' },
  { id: 'disc-hyyh-pt1', title: 'The Most Beautiful Moment in Life, Pt. 1', type: 'Mini Album', releaseDate: '2015-04-29', titleTrack: 'I Need U', era: 'HYYH' },
  { id: 'disc-hyyh-pt2', title: 'The Most Beautiful Moment in Life, Pt. 2', type: 'Mini Album', releaseDate: '2015-11-30', titleTrack: 'Run', era: 'HYYH' },
  { id: 'disc-young-forever', title: 'The Most Beautiful Moment in Life: Young Forever', type: 'Special Album', releaseDate: '2016-05-02', titleTrack: 'Fire', era: 'HYYH' },
  { id: 'disc-wings', title: 'WINGS', type: 'Studio Album', releaseDate: '2016-10-10', titleTrack: 'Blood Sweat & Tears', era: 'WINGS' },
  { id: 'disc-ynwa', title: 'You Never Walk Alone', type: 'Repackage', releaseDate: '2017-02-13', titleTrack: 'Spring Day', era: 'WINGS' },
  { id: 'disc-ly-her', title: 'Love Yourself: Her', type: 'Mini Album', releaseDate: '2017-09-18', titleTrack: 'DNA', era: 'Love Yourself' },
  { id: 'disc-ly-tear', title: 'Love Yourself: Tear', type: 'Studio Album', releaseDate: '2018-05-18', titleTrack: 'Fake Love', era: 'Love Yourself' },
  { id: 'disc-ly-answer', title: 'Love Yourself: Answer', type: 'Compilation Album', releaseDate: '2018-08-24', titleTrack: 'Idol', era: 'Love Yourself' },
  { id: 'disc-mots-persona', title: 'Map of the Soul: Persona', type: 'Mini Album', releaseDate: '2019-04-12', titleTrack: 'Boy with Luv', era: 'Map of the Soul' },
  { id: 'disc-mots-7', title: 'Map of the Soul: 7', type: 'Studio Album', releaseDate: '2020-02-21', titleTrack: 'On', era: 'Map of the Soul' },
  { id: 'disc-dynamite', title: 'Dynamite', type: 'Digital Single', releaseDate: '2020-08-21', titleTrack: 'Dynamite', era: 'Singles' },
  { id: 'disc-be', title: 'BE', type: 'Studio Album', releaseDate: '2020-11-20', titleTrack: 'Life Goes On', era: 'BE & Proof' },
  { id: 'disc-butter', title: 'Butter', type: 'Digital Single', releaseDate: '2021-05-21', titleTrack: 'Butter', era: 'Singles' },
  { id: 'disc-proof', title: 'Proof', type: 'Anthology Album', releaseDate: '2022-06-10', titleTrack: 'Yet to Come', era: 'BE & Proof' },
  { id: 'disc-take-two', title: 'Take Two', type: 'Digital Single', releaseDate: '2023-06-09', titleTrack: 'Take Two', era: 'Singles' },
  { id: 'disc-arirang', title: 'ARIRANG', type: 'Studio Album', releaseDate: '2026-03-20', titleTrack: 'SWIM', era: 'ARIRANG' },
  { id: 'disc-come-over', title: 'Come Over', type: 'Digital Single', releaseDate: '2026-06-12', titleTrack: 'Come Over', era: 'Singles' },
];

// Era filter chips on the Discography tab, in story order.
export const DISCOGRAPHY_ERAS: string[] = [
  'School Trilogy',
  'HYYH',
  'WINGS',
  'Love Yourself',
  'Map of the Soul',
  'BE & Proof',
  'ARIRANG',
  'Singles',
];

// BTS group awards — wins only, except the Grammy entry which is a
// nomination and is marked 'Nominated' (BTS have 0 Grammy wins).
// Per-year details that could not be verified (e.g. MMA Song/Album of
// the Year per year, Golden Disc Album of the Year other years, VMA
// Best K-Pop/Best Group 2019–2021, EMAs, People's Choice, iHeartRadio,
// Seoul Music Awards Grand Prize years) are deliberately omitted.
export const AWARD_ENTRIES: AwardEntry[] = [
  // ---- MTV Video Music Awards 2026 (3 wins, all for SWIM / group) ----
  { id: 'aw-vma-2026-soty', show: 'MTV Video Music Awards', category: 'Song of the Year', year: 2026, work: 'SWIM', result: 'Won' },
  { id: 'aw-vma-2026-kpop', show: 'MTV Video Music Awards', category: 'Best K-Pop', year: 2026, work: 'SWIM', result: 'Won' },
  { id: 'aw-vma-2026-group', show: 'MTV Video Music Awards', category: 'Best Group', year: 2026, result: 'Won' },

  // ---- Kids' Choice Awards 2026 (Batch 163): 3 wins from 3 nominations; 39th KCA, Nov 14, 2026 ----
  { id: 'aw-kca-2026-group', show: "Kids' Choice Awards", category: 'Favorite Music Group or Duo', year: 2026, result: 'Won', note: '5th win in this category' },
  { id: 'aw-kca-2026-album', show: "Kids' Choice Awards", category: 'Favorite Album', year: 2026, work: 'ARIRANG', result: 'Won' },
  { id: 'aw-kca-2026-song', show: "Kids' Choice Awards", category: 'Favorite Song', year: 2026, work: 'SWIM', result: 'Won' },

  // ---- Billboard Music Awards (12 wins) ----
  { id: 'aw-bbma-2017-tsa', show: 'Billboard Music Awards', category: 'Top Social Artist', year: 2017, result: 'Won' },
  { id: 'aw-bbma-2018-tsa', show: 'Billboard Music Awards', category: 'Top Social Artist', year: 2018, result: 'Won' },
  { id: 'aw-bbma-2019-tsa', show: 'Billboard Music Awards', category: 'Top Social Artist', year: 2019, result: 'Won' },
  { id: 'aw-bbma-2019-duo', show: 'Billboard Music Awards', category: 'Top Duo/Group', year: 2019, result: 'Won' },
  { id: 'aw-bbma-2020-tsa', show: 'Billboard Music Awards', category: 'Top Social Artist', year: 2020, result: 'Won' },
  { id: 'aw-bbma-2021-tsa', show: 'Billboard Music Awards', category: 'Top Social Artist', year: 2021, result: 'Won' },
  { id: 'aw-bbma-2021-duo', show: 'Billboard Music Awards', category: 'Top Duo/Group', year: 2021, result: 'Won' },
  { id: 'aw-bbma-2021-ssa', show: 'Billboard Music Awards', category: 'Top Song Sales Artist', year: 2021, result: 'Won' },
  { id: 'aw-bbma-2021-tss', show: 'Billboard Music Awards', category: 'Top Selling Song', year: 2021, work: 'Dynamite', result: 'Won' },
  { id: 'aw-bbma-2022-duo', show: 'Billboard Music Awards', category: 'Top Duo/Group', year: 2022, result: 'Won' },
  { id: 'aw-bbma-2022-ssa', show: 'Billboard Music Awards', category: 'Top Song Sales Artist', year: 2022, result: 'Won' },
  { id: 'aw-bbma-2022-tss', show: 'Billboard Music Awards', category: 'Top Selling Song', year: 2022, work: 'Butter', result: 'Won' },

  // ---- American Music Awards (11 wins) ----
  { id: 'aw-ama-2018-fsa', show: 'American Music Awards', category: 'Favorite Social Artist', year: 2018, result: 'Won' },
  { id: 'aw-ama-2019-fsa', show: 'American Music Awards', category: 'Favorite Social Artist', year: 2019, result: 'Won' },
  { id: 'aw-ama-2019-toy', show: 'American Music Awards', category: 'Tour of the Year', year: 2019, result: 'Won' },
  { id: 'aw-ama-2019-duo', show: 'American Music Awards', category: 'Favorite Duo or Group – Pop/Rock', year: 2019, result: 'Won' },
  { id: 'aw-ama-2020-fsa', show: 'American Music Awards', category: 'Favorite Social Artist', year: 2020, result: 'Won' },
  { id: 'aw-ama-2020-duo', show: 'American Music Awards', category: 'Favorite Duo or Group – Pop/Rock', year: 2020, result: 'Won' },
  { id: 'aw-ama-2021-duo', show: 'American Music Awards', category: 'Favorite Duo or Group – Pop/Rock', year: 2021, result: 'Won' },
  { id: 'aw-ama-2021-aoty', show: 'American Music Awards', category: 'Artist of the Year', year: 2021, result: 'Won', note: 'First Asian act to win Artist of the Year' },
  { id: 'aw-ama-2021-fps', show: 'American Music Awards', category: 'Favorite Pop Song', year: 2021, work: 'Butter', result: 'Won' },
  { id: 'aw-ama-2022-duo', show: 'American Music Awards', category: 'Favorite Duo or Group – Pop/Rock', year: 2022, result: 'Won', note: 'Most wins in this category’s history' },
  { id: 'aw-ama-2022-kpop', show: 'American Music Awards', category: 'Favorite K-pop Artist', year: 2022, result: 'Won', note: 'Inaugural winner of the category' },

  // ---- MAMA Awards (21 daesangs — most in MAMA history) ----
  { id: 'aw-mama-2016-aoty', show: 'MAMA Awards', category: 'Artist of the Year', year: 2016, result: 'Won' },
  { id: 'aw-mama-2017-aoty', show: 'MAMA Awards', category: 'Artist of the Year', year: 2017, result: 'Won' },
  { id: 'aw-mama-2017-bmv', show: 'MAMA Awards', category: 'Best Music Video', year: 2017, work: 'Spring Day', result: 'Won' },
  { id: 'aw-mama-2018-aoty', show: 'MAMA Awards', category: 'Artist of the Year', year: 2018, result: 'Won' },
  { id: 'aw-mama-2018-aloty', show: 'MAMA Awards', category: 'Album of the Year', year: 2018, work: 'Love Yourself: Tear', result: 'Won' },
  { id: 'aw-mama-2018-wioty', show: 'MAMA Awards', category: 'Worldwide Icon of the Year', year: 2018, result: 'Won' },
  { id: 'aw-mama-2018-bmv', show: 'MAMA Awards', category: 'Best Music Video', year: 2018, result: 'Won' },
  { id: 'aw-mama-2019-aoty', show: 'MAMA Awards', category: 'Artist of the Year', year: 2019, result: 'Won' },
  { id: 'aw-mama-2019-aloty', show: 'MAMA Awards', category: 'Album of the Year', year: 2019, work: 'Map of the Soul: Persona', result: 'Won' },
  { id: 'aw-mama-2019-soty', show: 'MAMA Awards', category: 'Song of the Year', year: 2019, work: 'Boy With Luv', result: 'Won' },
  { id: 'aw-mama-2019-wioty', show: 'MAMA Awards', category: 'Worldwide Icon of the Year', year: 2019, result: 'Won' },
  { id: 'aw-mama-2019-bmv', show: 'MAMA Awards', category: 'Best Music Video', year: 2019, result: 'Won' },
  { id: 'aw-mama-2020-aoty', show: 'MAMA Awards', category: 'Artist of the Year', year: 2020, result: 'Won' },
  { id: 'aw-mama-2020-aloty', show: 'MAMA Awards', category: 'Album of the Year', year: 2020, work: 'Map of the Soul: 7', result: 'Won' },
  { id: 'aw-mama-2020-soty', show: 'MAMA Awards', category: 'Song of the Year', year: 2020, work: 'Dynamite', result: 'Won' },
  { id: 'aw-mama-2020-wioty', show: 'MAMA Awards', category: 'Worldwide Icon of the Year', year: 2020, result: 'Won' },
  { id: 'aw-mama-2020-bmv', show: 'MAMA Awards', category: 'Best Music Video', year: 2020, result: 'Won' },
  { id: 'aw-mama-2021-aoty', show: 'MAMA Awards', category: 'Artist of the Year', year: 2021, result: 'Won' },
  { id: 'aw-mama-2021-aloty', show: 'MAMA Awards', category: 'Album of the Year', year: 2021, work: 'BE', result: 'Won' },
  { id: 'aw-mama-2021-soty', show: 'MAMA Awards', category: 'Song of the Year', year: 2021, work: 'Butter', result: 'Won' },
  { id: 'aw-mama-2021-wioty', show: 'MAMA Awards', category: 'Worldwide Icon of the Year', year: 2021, result: 'Won' },
  { id: 'aw-mama-2021-bmv', show: 'MAMA Awards', category: 'Best Music Video', year: 2021, result: 'Won' },
  { id: 'aw-mama-2022-aoty', show: 'MAMA Awards', category: 'Artist of the Year', year: 2022, result: 'Won', note: '7th consecutive Artist of the Year win' },
  { id: 'aw-mama-2022-aloty', show: 'MAMA Awards', category: 'Album of the Year', year: 2022, work: 'Proof', result: 'Won' },
  { id: 'aw-mama-2022-wioty', show: 'MAMA Awards', category: 'Worldwide Icon of the Year', year: 2022, result: 'Won' },
  { id: 'aw-mama-2022-plat', show: 'MAMA Awards', category: 'MAMA Platinum', year: 2022, result: 'Won', note: 'Special honour for winning all four daesangs' },

  // ---- Melon Music Awards (15 daesangs in total) ----
  { id: 'aw-mma-2013-new', show: 'Melon Music Awards', category: 'New Artist of the Year', year: 2013, result: 'Won' },
  { id: 'aw-mma-2016-aloty', show: 'Melon Music Awards', category: 'Album of the Year', year: 2016, work: 'The Most Beautiful Moment in Life: Young Forever', result: 'Won', note: 'First MMA daesang' },
  { id: 'aw-mma-2019-aoty', show: 'Melon Music Awards', category: 'Artist of the Year', year: 2019, result: 'Won' },
  { id: 'aw-mma-2020-aoty', show: 'Melon Music Awards', category: 'Artist of the Year', year: 2020, result: 'Won' },
  { id: 'aw-mma-2021-aoty', show: 'Melon Music Awards', category: 'Artist of the Year', year: 2021, result: 'Won' },
  // ---- MMA 2026 (Batch 161): 6 wins, incl. 2 daesangs; group did not attend (ARIRANG tour) ----
  { id: 'aw-mma-2026-aoty', show: 'Melon Music Awards', category: 'Artist of the Year', year: 2026, result: 'Won', note: 'Second MMA daesang of the weekend' },
  { id: 'aw-mma-2026-aloty', show: 'Melon Music Awards', category: 'Album of the Year', year: 2026, work: 'ARIRANG', result: 'Won' },
  { id: 'aw-mma-2026-stage', show: 'Melon Music Awards', category: 'Stage of the Year', year: 2026, result: 'Won' },
  { id: 'aw-mma-2026-group', show: 'Melon Music Awards', category: 'Best Male Group', year: 2026, result: 'Won' },
  { id: 'aw-mma-2026-top10', show: 'Melon Music Awards', category: 'Top 10', year: 2026, result: 'Won' },
  { id: 'aw-mma-2026-gtop10', show: 'Melon Music Awards', category: 'Global Top 10', year: 2026, result: 'Won' },

  // ---- Golden Disc Awards ----
  { id: 'aw-gda-2014-new', show: 'Golden Disc Awards', category: 'Newcomer Award', year: 2014, result: 'Won' },
  { id: 'aw-gda-2022-aloty', show: 'Golden Disc Awards', category: 'Album of the Year', year: 2022, work: 'BE', result: 'Won' },

  // ---- IFPI ----
  { id: 'aw-ifpi-2020', show: 'IFPI', category: 'Global Recording Artist of the Year', year: 2020, result: 'Won' },
  { id: 'aw-ifpi-2021', show: 'IFPI', category: 'Global Recording Artist of the Year', year: 2021, result: 'Won' },

  // ---- Grammy Awards: NOMINATIONS ONLY (0 wins, 5 nominations).
  // Shown with a Nominee badge, never counted as a win.
  { id: 'aw-grammy-2021-bpdgp', show: 'Grammy Awards', category: 'Best Pop Duo/Group Performance', year: 2021, work: 'Dynamite', result: 'Nominated', note: 'First Grammy nomination' },
];

// Trophy-cabinet headline numbers (verified 2026-11-15).
export const AWARD_STATS = [
  { value: '69', label: 'Daesangs', sub: 'Most-awarded artist in South Korean history' },
  { value: '21', label: 'MAMA Daesangs', sub: 'Most in MAMA history' },
  { value: '15', label: 'MMA Daesangs', sub: 'Melon Music Awards' },
  { value: '12', label: 'Billboard Music Awards', sub: 'Including 5× Top Social Artist' },
];
