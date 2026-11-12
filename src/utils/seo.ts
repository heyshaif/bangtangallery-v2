// Batch 151 — invisible-only SEO: one source of truth for per-route
// titles, descriptions, canonical URLs and Open Graph images.
//
// Nothing in this file renders anything on screen. It is used by:
//  - scripts/generate-spa-routes.ts (pre-rendered route HTML at build time)
//  - vite.config.ts (correct meta in dev / preview)
//  - src/App.tsx (runtime title/meta updates when the visitor changes tab)
// Target keywords are used naturally, once each where they fit:
// "BTS wallpaper" on Gallery / Wallpapers / gallery-photo pages and
// "Bangtan Sonyeondan" on Home / Members / Music / Timeline.
// Owner keyword list (2026-11-12) folded in: one page = one main focus,
// aliases only on their own member page, Telegram keywords on Home /
// Live Stream, song/album names on Music + member solo albums. Keywords
// that fit nowhere naturally (official-site claim, ticket sales, an
// invented "new song") are left out on purpose — see Batch 151 notes.
// No keyword stuffing, no hidden text, no cloaking.
import { SITE_DOMAIN, DEFAULT_OG_IMAGE, resolveFullImageUrl } from './seoHtmlInjector';
import type { GalleryItem, Member, NewsArticle } from '../types';

export interface RouteSeo {
  title: string;
  description: string;
  canonical: string;
  ogImage: string;
  ogType?: 'website' | 'article';
}

export const SITE_URL = SITE_DOMAIN;

export function truncateText(str: string, max: number): string {
  const clean = (str || '').replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 60 ? cut.slice(0, lastSpace) : cut).trimEnd() + '…';
}

export const HOME_SEO: RouteSeo = {
  title: 'BANGTAN GALLERY - The Ultimate Independent ARMY Archive',
  description:
    "Top BTS fansite for K-pop's Bangtan Sonyeondan (방탄소년단) and BTS ARMY — profiles, music, photos, news and the @arirang_army7 Telegram channel.",
  canonical: `${SITE_DOMAIN}/`,
  ogImage: DEFAULT_OG_IMAGE,
  ogType: 'website',
};

// Unique title + description + canonical for every route of the site.
// Descriptions are kept between 120 and 155 characters (checked by the
// Batch 151 verify step). Canonicals match the URL the app itself pushes
// for that tab (see the pushState effect in src/App.tsx).
export const ROUTE_SEO: Record<string, RouteSeo> = {
  home: HOME_SEO,
  members: {
    title: 'BTS Members List — Profiles, Ages & Birthdays | BANGTAN GALLERY',
    description:
      'Who are the BTS members? RM, Jin, SUGA, j-hope, Jimin, V and Jung Kook — names, ages, heights, birthdays and photos of Bangtan Sonyeondan.',
    canonical: `${SITE_DOMAIN}/members`,
    ogImage: DEFAULT_OG_IMAGE,
    ogType: 'website',
  },
  music: {
    title: 'BTS Songs List — Dynamite, Butter, ARIRANG | BANGTAN GALLERY',
    description:
      'BTS songs list and discography: Dynamite, Butter, Fake Love, Spring Day, Wings, Love Yourself, Map of the Soul, BE and ARIRANG — lyrics and best BTS songs.',
    canonical: `${SITE_DOMAIN}/music`,
    ogImage: DEFAULT_OG_IMAGE,
    ogType: 'website',
  },
  videos: {
    title: 'BTS Videos — MVs, Dance Practice & Performances | BANGTAN GALLERY',
    description:
      'Watch BTS videos: Dynamite, Butter dance practice, live performances and MVs — the video archive for ARMY, free for every fan to explore.',
    canonical: `${SITE_DOMAIN}/videos`,
    ogImage: DEFAULT_OG_IMAGE,
    ogType: 'website',
  },
  concert: {
    title: 'BTS Concert Replay — World Tour & Live Stages | BANGTAN GALLERY',
    description:
      'Watch full BTS concert replays from the ARIRANG world tour — live stages, FESTA performances and concert archives, free for ARMY.',
    canonical: `${SITE_DOMAIN}/arirang_concert_reply`,
    ogImage: DEFAULT_OG_IMAGE,
    ogType: 'website',
  },
  gallery: {
    title: 'BTS Wallpaper — HD BTS Wallpapers & Photos | BANGTAN GALLERY',
    description:
      'Free HD BTS wallpapers, fan art, edits and memes — photos of RM, Jin, SUGA, j-hope, Jimin, V and Jung Kook to download for phone and desktop.',
    canonical: `${SITE_DOMAIN}/gallery`,
    ogImage: DEFAULT_OG_IMAGE,
    ogType: 'website',
  },
  wallpapers: {
    title: 'BTS Wallpapers — Free HD BTS Wallpaper Downloads | BANGTAN GALLERY',
    description:
      'Download free HD BTS wallpapers for phone and desktop — Bangtan Sonyeondan photos of all seven members, ready to save and share.',
    canonical: `${SITE_DOMAIN}/wallpapers`,
    ogImage: DEFAULT_OG_IMAGE,
    ogType: 'website',
  },
  news: {
    title: 'BTS News, Breaking Updates & Comeback Articles — BANGTAN GALLERY',
    description:
      'BTS news: comeback updates, FESTA, military discharge, schedules and interviews — the latest BTS news, breaking updates and articles for ARMY.',
    canonical: `${SITE_DOMAIN}/news`,
    ogImage: DEFAULT_OG_IMAGE,
    ogType: 'website',
  },
  events: {
    title: 'BTS World Tour & Events 2026 — ARIRANG Tour Dates | BANGTAN GALLERY',
    description:
      'BTS world tour dates, ARIRANG tour stops, FESTA events, schedules and member birthdays — the ARMY events calendar, always up to date.',
    canonical: `${SITE_DOMAIN}/events`,
    ogImage: DEFAULT_OG_IMAGE,
    ogType: 'website',
  },
  timeline: {
    title: 'BTS Timeline — History, Meaning & Milestones | BANGTAN GALLERY',
    description:
      'BTS timeline: what BTS stands for, debut, enlistment, military discharge and the ARIRANG era — Bangtan Boys history from 2013 to now.',
    canonical: `${SITE_DOMAIN}/timeline`,
    ogImage: DEFAULT_OG_IMAGE,
    ogType: 'website',
  },
  live: {
    title: 'BTS Live Stream — Watch BTS Live & Replays | BANGTAN GALLERY',
    description:
      'Watch BTS live and replays, and follow the Bangtan Channel on Telegram @arirang_army7 — the top BTS Telegram channel for live ARMY updates.',
    canonical: `${SITE_DOMAIN}/livestream`,
    ogImage: DEFAULT_OG_IMAGE,
    ogType: 'website',
  },
  community: {
    title: 'ARMY Community & Voting Center — Vote for BTS | BANGTAN GALLERY',
    description:
      'Join the BTS ARMY fandom: vote for BTS, share Borahae purple-heart love and meet supporters worldwide in the Bangtan Sonyeondan community.',
    canonical: `${SITE_DOMAIN}/community`,
    ogImage: DEFAULT_OG_IMAGE,
    ogType: 'website',
  },
  downloads: {
    title: 'BTS Downloads — Wallpapers, Setlists & ARMY Freebies | BANGTAN GALLERY',
    description:
      'Free BTS downloads: HD wallpapers, concert setlists and ARMY extras — save photos, lyrics and keepsakes from Bangtan Gallery.',
    canonical: `${SITE_DOMAIN}/download`,
    ogImage: DEFAULT_OG_IMAGE,
    ogType: 'website',
  },
  faq: {
    title: 'BTS FAQ — Meaning, Members, Age & More | BANGTAN GALLERY',
    description:
      'BTS FAQ: what does BTS stand for, who are the BTS members, their ages, Instagram and YouTube — answers for ARMY, in one place.',
    canonical: `${SITE_DOMAIN}/faq`,
    ogImage: DEFAULT_OG_IMAGE,
    ogType: 'website',
  },
  dictionary: {
    title: 'ARMY Dictionary — BTS Terms, Slang & Fanchants | BANGTAN GALLERY',
    description:
      'ARMY dictionary: Borahae, Weverse BTS terms, fanchants and ARMY slang — the BTS fandom dictionary every new fan needs, A to Z.',
    canonical: `${SITE_DOMAIN}/dictionary`,
    ogImage: DEFAULT_OG_IMAGE,
    ogType: 'website',
  },
  privacy: {
    title: 'Privacy Policy | BANGTAN GALLERY',
    description:
      'How Bangtan Gallery handles visitor data, cookies and accounts — the privacy policy for this independent BTS fan archive.',
    canonical: `${SITE_DOMAIN}/privacy`,
    ogImage: DEFAULT_OG_IMAGE,
    ogType: 'website',
  },
  contact: {
    title: 'Contact Bangtan Gallery — BTS Fan Site | BANGTAN GALLERY',
    description:
      'Contact Bangtan Gallery about BTS news, photos or corrections — or join @arirang_army7 on Telegram. We read every message from ARMY.',
    canonical: `${SITE_DOMAIN}/contact`,
    ogImage: DEFAULT_OG_IMAGE,
    ogType: 'website',
  },
  feedback: {
    title: 'Feedback — Tell Bangtan Gallery What You Think | BANGTAN GALLERY',
    description:
      'Share feedback on Bangtan Gallery — what you love, what to fix, what BTS content to add next. ARMY ideas shape this fan archive.',
    canonical: `${SITE_DOMAIN}/feedback`,
    ogImage: DEFAULT_OG_IMAGE,
    ogType: 'website',
  },
  settings: {
    title: 'Settings — Themes & Preferences | BANGTAN GALLERY',
    description:
      'Choose your Bangtan Gallery theme and preferences — dark, light and ARIRANG looks, colours and layout for your BTS fan archive visit.',
    canonical: `${SITE_DOMAIN}/setting`,
    ogImage: DEFAULT_OG_IMAGE,
    ogType: 'website',
  },
  game: {
    title: 'BTS Games & Music Quiz — Play with ARMY | BANGTAN GALLERY',
    description:
      'Play BTS games, take the music quiz on Dynamite, Butter and ARIRANG, and climb the ARMY leaderboard — free fan games for BTS lovers.',
    canonical: `${SITE_DOMAIN}/game`,
    ogImage: DEFAULT_OG_IMAGE,
    ogType: 'website',
  },
  generatepic: {
    title: 'BTS Photo Studio — Create ARMY Pictures | BANGTAN GALLERY',
    description:
      'Create BTS-themed pictures, fan art and ARMY edits in the Bangtan Gallery studio — fun fan-made images to share with fellow ARMY.',
    canonical: `${SITE_DOMAIN}/GeneratePic`,
    ogImage: DEFAULT_OG_IMAGE,
    ogType: 'website',
  },
};

// App.tsx activeTab names -> ROUTE_SEO keys.
export const TAB_TO_ROUTE_KEY: Record<string, string> = {
  Home: 'home',
  Members: 'members',
  Music: 'music',
  Videos: 'videos',
  Concert: 'concert',
  Gallery: 'gallery',
  News: 'news',
  Events: 'events',
  Timeline: 'timeline',
  'Live Stream': 'live',
  'Voting Center': 'community',
  Downloads: 'downloads',
  FAQ: 'faq',
  'ARMY Dictionary': 'dictionary',
  'Privacy Policy': 'privacy',
  Contact: 'contact',
  Feedback: 'feedback',
  Settings: 'settings',
  'Play Game': 'game',
  'Generate Pic': 'generatepic',
};

export function memberSlug(member: Member): string {
  return (member.id || member.name || '').toLowerCase().replace(/\s+/g, '');
}

// Each member page targets only that member's own aliases + solo work
// (owner keyword list): BTS <Member> combo + full name / stage aliases.
// Solo album per member: RM Indigo, Jin solo songs, SUGA D-Day,
// j-hope Hope World, Jimin FACE, V Layover, Jung Kook Golden.
const MEMBER_KEYWORDS: Record<string, { combo: string; aliases: string; solo: string }> = {
  rm: { combo: 'BTS RM', aliases: 'Kim Namjoon', solo: 'the Indigo album' },
  jin: { combo: 'BTS Jin', aliases: 'Kim Seokjin', solo: 'solo songs and OSTs' },
  suga: { combo: 'BTS Suga', aliases: 'Min Yoongi / Agust D', solo: 'the D-Day album' },
  jhope: { combo: 'BTS J-Hope', aliases: 'Jung Hoseok / Hobi', solo: 'the Hope World album' },
  jimin: { combo: 'BTS Jimin', aliases: 'Park Jimin', solo: 'the FACE album' },
  v: { combo: 'BTS V', aliases: 'Kim Taehyung / Taehyung', solo: 'the Layover album' },
  jungkook: { combo: 'BTS Jungkook', aliases: 'Jeon Jungkook / JK', solo: 'the Golden album' },
};

export function memberSeo(member: Member): RouteSeo {
  const slug = memberSlug(member);
  const kw = MEMBER_KEYWORDS[slug] || {
    combo: `BTS ${member.name}`,
    aliases: member.fullName,
    solo: 'solo work',
  };
  const displayName = slug === 'jungkook' ? 'Jung Kook' : member.name;
  return {
    title: `${kw.combo} — Profile, Bio & Photos | BANGTAN GALLERY`,
    description: truncateText(
      `${kw.combo} (${kw.aliases}) — bio, age, height, birthday and ${kw.solo}. Profile, photos and songs of ${displayName} on Bangtan Gallery.`,
      155,
    ),
    canonical: `${SITE_DOMAIN}/members/${slug}`,
    ogImage: resolveFullImageUrl(member.bannerUrl || member.portraitUrl),
    ogType: 'website',
  };
}

export function articleSeo(article: NewsArticle): RouteSeo {
  const slug =
    article.slug ||
    article.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '') ||
    article.id;
  const summary =
    article.seoDescription || article.summary || 'Read the full story on BANGTAN GALLERY.';
  // Some live articles have a very short summary; pad with a generic
  // (true) suffix so the meta description is not a thin stub. Nothing
  // is invented about the article itself.
  const fullSummary =
    summary.length < 120
      ? `${summary} — Read the full story, photos and updates on BANGTAN GALLERY.`
      : summary;
  return {
    title: `${article.title} — BANGTAN GALLERY`,
    description: truncateText(fullSummary, 155),
    canonical: `${SITE_DOMAIN}/news/${slug}`,
    ogImage: resolveFullImageUrl(article.featuredImage || article.imageUrl),
    ogType: 'article',
  };
}

export function galleryPhotoSeo(item: GalleryItem): RouteSeo {
  const cleanTitle = (item.title || 'BTS photo').replace(/\s+/g, ' ').trim();
  return {
    title: truncateText(`${cleanTitle} — BTS Wallpaper | BANGTAN GALLERY`, 110),
    description: truncateText(
      `Download this BTS wallpaper in HD — ${cleanTitle}. Free Bangtan Sonyeondan photo for phone and desktop, from BANGTAN GALLERY.`,
      155,
    ),
    canonical: `${SITE_DOMAIN}/gallery/${item.id}`,
    ogImage: resolveFullImageUrl(item.url),
    ogType: 'website',
  };
}

/** Runtime (browser) lookup: which SEO fits the open tab / member / article. */
export function getSeoForTab(
  activeTab: string,
  opts?: { member?: Member | null; article?: NewsArticle | null },
): RouteSeo {
  if (opts?.member && activeTab === 'Members') return memberSeo(opts.member);
  if (opts?.article && activeTab === 'News') return articleSeo(opts.article);
  return ROUTE_SEO[TAB_TO_ROUTE_KEY[activeTab] || 'home'] || HOME_SEO;
}

export interface RouteLookup {
  seo: RouteSeo;
  breadcrumb: Array<{ name: string; url: string }>;
  member?: Member;
  photo?: GalleryItem;
  article?: NewsArticle;
}

const PATH_ALIASES: Record<string, string> = {
  '': 'home',
  home: 'home',
  members: 'members',
  music: 'music',
  videos: 'videos',
  concert: 'concert',
  concerts: 'concert',
  'concert-replay': 'concert',
  arirang_concert_reply: 'concert',
  gallery: 'gallery',
  wallpapers: 'wallpapers',
  wallpaper: 'wallpapers',
  news: 'news',
  events: 'events',
  timeline: 'timeline',
  live: 'live',
  livestream: 'live',
  'live-stream': 'live',
  community: 'community',
  download: 'downloads',
  downloads: 'downloads',
  faq: 'faq',
  faqs: 'faq',
  dictionary: 'dictionary',
  privacy: 'privacy',
  contact: 'contact',
  feedback: 'feedback',
  setting: 'settings',
  settings: 'settings',
  game: 'game',
  profile: 'game',
  memes: 'gallery',
  generatepic: 'generatepic',
  'generate-pic': 'generatepic',
  generate: 'generatepic',
  GeneratePic: 'generatepic',
};

/**
 * Build-time / dev-server lookup: which SEO fits a URL path.
 * Member slugs are matched against the passed member list (the ids the
 * app itself uses: rm, jin, suga, jhope, jimin, v, jungkook — plus the
 * hyphenated aliases j-hope / jung-kook, which share the same canonical).
 * Gallery photo ids (gal1…gal12, gal_meme1…5) match gallery items; any
 * other /gallery/<x> segment is a category filter and gets gallery SEO.
 */
export function routeSeoForPath(
  pathname: string,
  opts?: { members?: Member[]; galleryItems?: GalleryItem[]; articles?: NewsArticle[] },
): RouteLookup {
  const cleanPath = (pathname || '/').split('?')[0].split('#')[0];
  const parts = cleanPath.split('/').filter(Boolean);
  const homeCrumb = [{ name: 'Home', url: `${SITE_DOMAIN}/` }];

  if (parts.length === 0) {
    return { seo: HOME_SEO, breadcrumb: homeCrumb };
  }

  const first = parts[0].toLowerCase();

  // /members/<slug>
  if (first === 'members' && parts.length > 1 && opts?.members) {
    const raw = decodeURIComponent(parts[1] || '').toLowerCase().trim();
    const squashed = raw.replace(/[\s\-_%20]+/g, '');
    const found = opts.members.find((m) => {
      const id = (m.id || '').toLowerCase().replace(/[\s\-_]+/g, '');
      const name = (m.name || '').toLowerCase().replace(/[\s\-_]+/g, '');
      return id === squashed || name === squashed;
    });
    if (found) {
      const seo = memberSeo(found);
      return {
        seo,
        member: found,
        breadcrumb: [
          ...homeCrumb,
          { name: 'Members', url: `${SITE_DOMAIN}/members` },
          { name: found.name, url: seo.canonical },
        ],
      };
    }
    return {
      seo: ROUTE_SEO.members,
      breadcrumb: [...homeCrumb, { name: 'Members', url: `${SITE_DOMAIN}/members` }],
    };
  }

  // /news/<slug>
  if (first === 'news' && parts.length > 1 && opts?.articles) {
    const target = parts[1].toLowerCase().replace(/\.html$/, '');
    const found = opts.articles.find((a) => {
      const slug = (
        a.slug ||
        a.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '') ||
        a.id
      ).toLowerCase();
      return slug === target || a.id.toLowerCase() === target;
    });
    if (found) {
      const seo = articleSeo(found);
      return {
        seo,
        article: found,
        breadcrumb: [
          ...homeCrumb,
          { name: 'News', url: `${SITE_DOMAIN}/news` },
          { name: found.title, url: seo.canonical },
        ],
      };
    }
  }

  // /gallery/<photo-id>
  if (first === 'gallery' && parts.length > 1 && opts?.galleryItems) {
    const found = opts.galleryItems.find((g) => g.id.toLowerCase() === parts[1].toLowerCase());
    if (found) {
      const seo = galleryPhotoSeo(found);
      return {
        seo,
        photo: found,
        breadcrumb: [
          ...homeCrumb,
          { name: 'Gallery', url: `${SITE_DOMAIN}/gallery` },
          { name: found.title, url: seo.canonical },
        ],
      };
    }
  }

  const key = PATH_ALIASES[first] || PATH_ALIASES[parts[0]] || 'home';
  const seo = ROUTE_SEO[key] || HOME_SEO;
  const label = key === 'home' ? 'Home' : key.charAt(0).toUpperCase() + key.slice(1);
  return {
    seo,
    breadcrumb:
      key === 'home' ? homeCrumb : [...homeCrumb, { name: label, url: seo.canonical }],
  };
}

/** True when a path is a real site route (section, member, photo or article) — used by the Vite dev/preview middleware so it only intercepts real routes. */
export function isKnownRoutePath(
  pathname: string,
  opts?: { members?: Member[]; galleryItems?: GalleryItem[]; articles?: NewsArticle[] },
): boolean {
  const cleanPath = (pathname || '/').split('?')[0].split('#')[0];
  const parts = cleanPath.split('/').filter(Boolean);
  if (parts.length === 0) return true;
  if (PATH_ALIASES[parts[0].toLowerCase()] !== undefined || PATH_ALIASES[parts[0]] !== undefined) return true;
  const lookup = routeSeoForPath(pathname, opts);
  return Boolean(lookup.member || lookup.photo || lookup.article);
}

// ---- JSON-LD builders (plain objects; callers stringify them) ----

export function buildBreadcrumbJsonLd(items: Array<{ name: string; url: string }>): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function buildWebPageJsonLd(seo: RouteSeo): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${seo.canonical}#webpage`,
    url: seo.canonical,
    name: seo.title,
    description: seo.description,
    isPartOf: { '@id': `${SITE_DOMAIN}/#website` },
    primaryImageOfPage: {
      '@type': 'ImageObject',
      url: seo.ogImage,
    },
  };
}

export function buildPersonJsonLd(member: Member, url: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${url}#person`,
    url,
    name: member.name,
    alternateName: member.fullName,
    description: truncateText(member.biography || '', 300),
    image: resolveFullImageUrl(member.portraitUrl),
    jobTitle: (member.position || []).join(', '),
    memberOf: {
      '@type': 'MusicGroup',
      name: 'BTS (Bangtan Sonyeondan)',
      url: `${SITE_DOMAIN}/`,
    },
  };
}

export function buildImageObjectJsonLd(item: GalleryItem, url: string): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'ImageObject',
    '@id': `${url}#image`,
    contentUrl: resolveFullImageUrl(item.url),
    url,
    name: item.title,
    description: `BTS wallpaper — ${item.title}`,
    author: { '@type': 'Organization', name: 'BANGTAN GALLERY', url: `${SITE_DOMAIN}/` },
  };
}

// ---- Runtime DOM updater (browser only; no-op on the server) ----

function upsertMetaByName(name: string, content: string): void {
  let el = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertMetaByProperty(prop: string, content: string): void {
  let el = document.querySelector(`meta[property="${prop}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', prop);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

/**
 * Applies a route's SEO to the live document when the visitor changes
 * tab / member / article. Creates the tags if a build is missing them,
 * never duplicates them, and never touches anything visible.
 */
export function applyRouteSeo(seo: RouteSeo): void {
  if (typeof document === 'undefined') return;
  document.title = seo.title;
  upsertMetaByName('description', seo.description);
  let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.setAttribute('rel', 'canonical');
    document.head.appendChild(canonical);
  }
  canonical.setAttribute('href', seo.canonical);
  upsertMetaByProperty('og:title', seo.title);
  upsertMetaByProperty('og:description', seo.description);
  upsertMetaByProperty('og:url', seo.canonical);
  upsertMetaByProperty('og:image', seo.ogImage);
  upsertMetaByProperty('og:type', seo.ogType || 'website');
  upsertMetaByName('twitter:title', seo.title);
  upsertMetaByName('twitter:description', seo.description);
  upsertMetaByName('twitter:image', seo.ogImage);
}
