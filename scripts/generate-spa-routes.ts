// Batch 151 — pre-rendered SEO route files + sitemap.
// Every pre-rendered route HTML now gets its OWN title, description,
// canonical URL, Open Graph / Twitter tags and BreadcrumbList + WebPage
// JSON-LD from the single source of truth in src/utils/seo.ts
// (previously every main route copied the homepage HTML verbatim, so
// Google saw the same title/description on all of them).
// No visible change: the app shell served is byte-identical apart
// from <head> meta + JSON-LD.
import fs from 'fs';
import path from 'path';
import { MEMBERS, NEWS_ARTICLES, GALLERY_ITEMS } from '../src/data/btsData.js';
import {
  injectRouteMetadata,
  resolveFullImageUrl,
  SITE_DOMAIN,
  DEFAULT_OG_IMAGE,
  escapeHtml,
  type MetaTagsConfig,
} from '../src/utils/seoHtmlInjector.js';
import {
  ROUTE_SEO,
  routeSeoForPath,
  memberSeo,
  memberSlug,
  articleSeo,
  galleryPhotoSeo,
  buildBreadcrumbJsonLd,
  buildWebPageJsonLd,
  buildPersonJsonLd,
  buildImageObjectJsonLd,
  type RouteSeo,
} from '../src/utils/seo.js';

const distDir = path.resolve('dist');
const indexHtmlPath = path.join(distDir, 'index.html');

// Batch 151 sitemap date: update this when the sitemap content changes.
const SITEMAP_LASTMOD = '2026-11-12';

function toMeta(seo: RouteSeo, article?: any): MetaTagsConfig {
  return {
    title: seo.title,
    description: seo.description,
    canonicalUrl: seo.canonical,
    ogTitle: seo.title,
    ogDescription: seo.description,
    ogImage: seo.ogImage,
    ogUrl: seo.canonical,
    ogType: seo.ogType || 'website',
    twitterTitle: seo.title,
    twitterDescription: seo.description,
    twitterImage: seo.ogImage,
    article,
  };
}

/** Write both /dist/<rel>.html and /dist/<rel>/index.html with the same HTML. */
function writePage(rel: string, html: string): void {
  fs.writeFileSync(path.join(distDir, `${rel}.html`), html);
  const dir = path.join(distDir, rel);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(path.join(dir, 'index.html'), html);
}

interface SitemapEntry {
  loc: string;
  lastmod: string;
  changefreq: 'daily' | 'weekly' | 'monthly';
  priority: string;
  images?: string[];
}

(async () => {
if (fs.existsSync(indexHtmlPath)) {
  const indexHtmlContent = fs.readFileSync(indexHtmlPath, 'utf8');

  // 1. Generate 404.html (fallback for GitHub Pages, Render, etc.)
  fs.writeFileSync(path.join(distDir, '404.html'), indexHtmlContent);

  // 2. Pre-generate static route files for general SPA tabs — each with
  // its OWN title/description/canonical/OG + BreadcrumbList + WebPage
  // JSON-LD (Batch 151; previously all of these were the homepage HTML).
  const routes = [
    'livestream',
    'live-stream',
    'live',
    'gallery',
    'music',
    'videos',
    'concert',
    'concerts',
    'members',
    'events',
    'timeline',
    'memes',
    'download',
    'downloads',
    'faq',
    'dictionary',
    'privacy',
    'contact',
    'feedback',
    'setting',
    'community',
    'GeneratePic',
    'generatepic',
    'game',
    'profile',
  ];

  routes.forEach((route) => {
    const lookup = routeSeoForPath(`/${route}`, {
      members: MEMBERS as any,
      galleryItems: GALLERY_ITEMS as any,
      articles: NEWS_ARTICLES as any,
    });
    const html = injectRouteMetadata(indexHtmlContent, toMeta(lookup.seo), [
      buildBreadcrumbJsonLd(lookup.breadcrumb),
      buildWebPageJsonLd(lookup.seo),
    ]);
    writePage(route, html);
    console.log(`   [SSG Route] Pre-rendered: /${route} → ${lookup.seo.canonical}`);
  });

  // 2b. /wallpapers + /wallpaper alias: new URL only, serves the Gallery
  // app with BTS-wallpaper meta (Batch 151; no visible change).
  const wallpaperLookup = routeSeoForPath('/wallpapers', {
    members: MEMBERS as any,
    galleryItems: GALLERY_ITEMS as any,
    articles: NEWS_ARTICLES as any,
  });
  const wallpaperHtml = injectRouteMetadata(indexHtmlContent, toMeta(wallpaperLookup.seo), [
    buildBreadcrumbJsonLd(wallpaperLookup.breadcrumb),
    buildWebPageJsonLd(wallpaperLookup.seo),
  ]);
  writePage('wallpapers', wallpaperHtml);
  writePage('wallpaper', wallpaperHtml);
  console.log(`   [SSG Route] Pre-rendered: /wallpapers + /wallpaper → ${wallpaperLookup.seo.canonical}`);

  // 3. Generate Main News Portal Page with News OG Tags
  const newsLanding = routeSeoForPath('/news', {
    members: MEMBERS as any,
    galleryItems: GALLERY_ITEMS as any,
    articles: NEWS_ARTICLES as any,
  });
  const newsLandingHtml = injectRouteMetadata(indexHtmlContent, toMeta(newsLanding.seo), [
    buildBreadcrumbJsonLd(newsLanding.breadcrumb),
    buildWebPageJsonLd(newsLanding.seo),
  ]);
  writePage('news', newsLandingHtml);

  // 3b. Concert Replay landing page with its own share metadata
  // (share link: https://bangtangallery.online/arirang_concert_reply)
  const concertLanding = routeSeoForPath('/arirang_concert_reply', {
    members: MEMBERS as any,
    galleryItems: GALLERY_ITEMS as any,
    articles: NEWS_ARTICLES as any,
  });
  const concertHtml = injectRouteMetadata(indexHtmlContent, toMeta(concertLanding.seo), [
    buildBreadcrumbJsonLd(concertLanding.breadcrumb),
    buildWebPageJsonLd(concertLanding.seo),
  ]);
  writePage('arirang_concert_reply', concertHtml);

  // 3c. Member profile pages (Batch 151): /members/<slug> for all 7
  // members, each with its own title/description/OG (that member's
  // portrait) + Person JSON-LD. Aliases j-hope / jung-kook are also
  // pre-rendered with the same HTML (canonical stays the app slug:
  // /members/jhope and /members/jungkook).
  const memberAliases: Record<string, string[]> = {
    jhope: ['j-hope'],
    jungkook: ['jung-kook'],
  };
  MEMBERS.forEach((member: any) => {
    const slug = memberSlug(member);
    const seo = memberSeo(member);
    const html = injectRouteMetadata(indexHtmlContent, toMeta(seo), [
      buildBreadcrumbJsonLd([
        { name: 'Home', url: `${SITE_DOMAIN}/` },
        { name: 'Members', url: `${SITE_DOMAIN}/members` },
        { name: member.name, url: seo.canonical },
      ]),
      buildWebPageJsonLd(seo),
      buildPersonJsonLd(member, seo.canonical),
    ]);
    writePage(`members/${slug}`, html);
    console.log(`   [SSG Member] Pre-rendered: /members/${slug}`);
    for (const alias of memberAliases[slug] || []) {
      writePage(`members/${alias}`, html);
      console.log(`   [SSG Member] Pre-rendered alias: /members/${alias} → ${seo.canonical}`);
    }
  });

  // 4. Pre-generate EVERY single News Article with Dedicated Dynamic Open Graph Metadata
  // Articles the owner publishes from the Admin Panel live only in
  // Firestore, not in code — merge them in (best effort) so a shared
  // panel-added article ALSO gets its own preview page with its own
  // cover, instead of falling back to the site's default cover.
  let allArticles: any[] = [...NEWS_ARTICLES];
  try {
    const fbCfg = JSON.parse(fs.readFileSync(path.resolve('firebase-applet-config.json'), 'utf8'));
    const fsUrl = `https://firestore.googleapis.com/v1/projects/${fbCfg.projectId}/databases/${fbCfg.firestoreDatabaseId}/documents/config/published?key=${fbCfg.apiKey}&mask.fieldPaths=news`;
    const fsRes = await fetch(fsUrl);
    if (fsRes.ok) {
      const fsJson: any = await fsRes.json();
      const fromFsValue = (v: any): any => {
        if (v == null) return v;
        if ('stringValue' in v) return v.stringValue;
        if ('booleanValue' in v) return v.booleanValue;
        if ('integerValue' in v) return Number(v.integerValue);
        if ('doubleValue' in v) return v.doubleValue;
        if ('arrayValue' in v) return (v.arrayValue.values || []).map(fromFsValue);
        if ('mapValue' in v) {
          const o: any = {};
          for (const [k, vv] of Object.entries(v.mapValue.fields || {})) o[k] = fromFsValue(vv);
          return o;
        }
        return '';
      };
      const TEMPLATE_SLUGS = new Set([
        'jimin-bts-best-kpop-soloists-2026',
        'bts-announces-2026-world-tour-festa-stadium-concerts',
        'welcome-to-bangtan-gallery-bts-army-space'
      ]);
      const liveArticles = (fsJson?.fields?.news?.arrayValue?.values || [])
        .map((v: any) => fromFsValue(v))
        .filter((a: any) => a && a.title && a.published !== false && !TEMPLATE_SLUGS.has(a.slug))
        .map((a: any) => {
          // An embedded (data:) cover can never be a share image —
          // clear it so the resolver falls back to the site cover.
          if (typeof a.featuredImage === 'string' && a.featuredImage.startsWith('data:')) a.featuredImage = '';
          if (typeof a.imageUrl === 'string' && a.imageUrl.startsWith('data:')) a.imageUrl = '';
          return a;
        });
      const bySlug = new Map(allArticles.map((a: any) => [(a.slug || a.id), a]));
      for (const a of liveArticles) {
        const key = a.slug || a.id;
        if (key) bySlug.set(key, a);
      }
      allArticles = [...bySlug.values()];
      console.log(`   [SSG News] Merged live articles from Firestore: ${allArticles.length} total.`);
    }
  } catch (e) {
    console.warn('   [SSG News] Live article fetch failed, using local articles only:', (e as Error).message);
  }

  console.log(` Generating Open Graph preview HTML for ${allArticles.length} news articles...`);

  allArticles.forEach((article) => {
    const slug = article.slug || article.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || article.id;
    const seo = articleSeo(article);
    const articleHtml = injectRouteMetadata(indexHtmlContent, toMeta(seo, article), [
      buildBreadcrumbJsonLd([
        { name: 'Home', url: `${SITE_DOMAIN}/` },
        { name: 'News', url: `${SITE_DOMAIN}/news` },
        { name: article.title, url: seo.canonical },
      ]),
      buildWebPageJsonLd(seo),
    ]);

    // Write to /dist/news/<slug>/index.html (standard directory structure)
    const articleDir = path.join(distDir, 'news', slug);
    if (!fs.existsSync(articleDir)) {
      fs.mkdirSync(articleDir, { recursive: true });
    }
    fs.writeFileSync(path.join(articleDir, 'index.html'), articleHtml);

    // Also write /dist/news/<slug>.html (support static servers that map /news/<slug> to <slug>.html)
    fs.writeFileSync(path.join(distDir, 'news', `${slug}.html`), articleHtml);

    console.log(`   [SSG News] Pre-rendered: /news/${slug} (Cover: ${seo.ogImage.slice(0, 50)}...)`);
  });

  // 5. Pre-generate Gallery photo pages so a shared photo link shows
  // THAT picture in the link preview (the app opens the same photo in
  // the gallery viewer when the link is visited). Covers the built-in
  // gallery items; photos uploaded later share the same link format
  // and open in the viewer, with the site cover as their preview.
  // Batch 151: titles now target "BTS wallpaper" and each page carries
  // ImageObject JSON-LD so Google can index the photo itself.
  console.log(` Generating Open Graph preview HTML for ${GALLERY_ITEMS.length} gallery photos...`);
  GALLERY_ITEMS.forEach((item) => {
    const seo = galleryPhotoSeo(item);
    const html = injectRouteMetadata(indexHtmlContent, toMeta(seo), [
      buildBreadcrumbJsonLd([
        { name: 'Home', url: `${SITE_DOMAIN}/` },
        { name: 'Gallery', url: `${SITE_DOMAIN}/gallery` },
        { name: item.title, url: seo.canonical },
      ]),
      buildWebPageJsonLd(seo),
      buildImageObjectJsonLd(item, seo.canonical),
    ]);
    const dir = path.join(distDir, 'gallery', item.id);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(path.join(dir, 'index.html'), html);
    fs.writeFileSync(path.join(distDir, 'gallery', `${item.id}.html`), html);
    console.log(`   [SSG Gallery] Pre-rendered: /gallery/${item.id}`);
  });

  // 6. Full sitemap.xml for Google (Batch 151): every main page + each
  // member page + each news article + each gallery photo page, with
  // lastmod / changefreq / priority and image entries for photos and
  // news covers. Regenerated on every build. Canonical URLs only —
  // the app's own URLs (e.g. /livestream, /community, /download), not
  // the old /live /voting /downloads aliases. Utility pages
  // (/setting, /game, /GeneratePic, /profile/…) are intentionally
  // left out of the sitemap; they still get route meta above.
  const galleryImageUrls = GALLERY_ITEMS.map((i: any) => resolveFullImageUrl(i.url));
  const sitemapEntries: SitemapEntry[] = [
    { loc: `${SITE_DOMAIN}/`, lastmod: SITEMAP_LASTMOD, changefreq: 'daily', priority: '1.0', images: [DEFAULT_OG_IMAGE] },
    { loc: `${SITE_DOMAIN}/members`, lastmod: SITEMAP_LASTMOD, changefreq: 'weekly', priority: '0.8' },
    { loc: `${SITE_DOMAIN}/music`, lastmod: SITEMAP_LASTMOD, changefreq: 'weekly', priority: '0.8' },
    { loc: `${SITE_DOMAIN}/videos`, lastmod: SITEMAP_LASTMOD, changefreq: 'weekly', priority: '0.8' },
    { loc: `${SITE_DOMAIN}/arirang_concert_reply`, lastmod: SITEMAP_LASTMOD, changefreq: 'weekly', priority: '0.8' },
    { loc: `${SITE_DOMAIN}/gallery`, lastmod: SITEMAP_LASTMOD, changefreq: 'weekly', priority: '0.7', images: galleryImageUrls },
    { loc: `${SITE_DOMAIN}/wallpapers`, lastmod: SITEMAP_LASTMOD, changefreq: 'weekly', priority: '0.7', images: galleryImageUrls },
    { loc: `${SITE_DOMAIN}/news`, lastmod: SITEMAP_LASTMOD, changefreq: 'daily', priority: '0.7' },
    { loc: `${SITE_DOMAIN}/events`, lastmod: SITEMAP_LASTMOD, changefreq: 'weekly', priority: '0.8' },
    { loc: `${SITE_DOMAIN}/timeline`, lastmod: SITEMAP_LASTMOD, changefreq: 'weekly', priority: '0.8' },
    { loc: `${SITE_DOMAIN}/livestream`, lastmod: SITEMAP_LASTMOD, changefreq: 'weekly', priority: '0.8' },
    { loc: `${SITE_DOMAIN}/community`, lastmod: SITEMAP_LASTMOD, changefreq: 'weekly', priority: '0.8' },
    { loc: `${SITE_DOMAIN}/download`, lastmod: SITEMAP_LASTMOD, changefreq: 'weekly', priority: '0.8' },
    { loc: `${SITE_DOMAIN}/faq`, lastmod: SITEMAP_LASTMOD, changefreq: 'monthly', priority: '0.8' },
    { loc: `${SITE_DOMAIN}/dictionary`, lastmod: SITEMAP_LASTMOD, changefreq: 'monthly', priority: '0.8' },
    { loc: `${SITE_DOMAIN}/privacy`, lastmod: SITEMAP_LASTMOD, changefreq: 'monthly', priority: '0.5' },
    { loc: `${SITE_DOMAIN}/contact`, lastmod: SITEMAP_LASTMOD, changefreq: 'monthly', priority: '0.5' },
    { loc: `${SITE_DOMAIN}/feedback`, lastmod: SITEMAP_LASTMOD, changefreq: 'monthly', priority: '0.5' },
  ];
  MEMBERS.forEach((member: any) => {
    const seo = memberSeo(member);
    sitemapEntries.push({
      loc: seo.canonical,
      lastmod: SITEMAP_LASTMOD,
      changefreq: 'weekly',
      priority: '0.8',
      images: [seo.ogImage],
    });
  });
  allArticles.forEach((article) => {
    const seo = articleSeo(article);
    sitemapEntries.push({
      loc: seo.canonical,
      lastmod: SITEMAP_LASTMOD,
      changefreq: 'weekly',
      priority: '0.7',
      images: [seo.ogImage],
    });
  });
  GALLERY_ITEMS.forEach((item: any) => {
    const seo = galleryPhotoSeo(item);
    sitemapEntries.push({
      loc: seo.canonical,
      lastmod: SITEMAP_LASTMOD,
      changefreq: 'monthly',
      priority: '0.7',
      images: [seo.ogImage],
    });
  });
  const sitemapXml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n' +
    '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n' +
    sitemapEntries
      .map((e) => {
        const imgs = (e.images || [])
          .map((img) => `    <image:image><image:loc>${escapeHtml(img)}</image:loc></image:image>`)
          .join('\n');
        return (
          `  <url>\n    <loc>${escapeHtml(e.loc)}</loc>\n    <lastmod>${e.lastmod}</lastmod>\n` +
          `    <changefreq>${e.changefreq}</changefreq>\n    <priority>${e.priority}</priority>\n` +
          (imgs ? imgs + '\n' : '') +
          `  </url>`
        );
      })
      .join('\n') +
    '\n</urlset>\n';
  fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemapXml);
  console.log(`🗺️  Sitemap written with ${sitemapEntries.length} URLs.`);

  console.log('✅ Successfully pre-generated all static SPA and dynamic News Open Graph route files!');
} else {
  console.warn('⚠️ Warning: dist/index.html not found, skipping route generation.');
}
})();
