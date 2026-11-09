import fs from 'fs';
import path from 'path';
import { NEWS_ARTICLES, GALLERY_ITEMS } from '../src/data/btsData.js';

const distDir = path.resolve('dist');
const indexHtmlPath = path.join(distDir, 'index.html');

const DEFAULT_COVER_IMAGE = 'https://bangtangallery.online/images/og-cover-2.jpg';
const SITE_DOMAIN = 'https://bangtangallery.online';

function escapeHtml(str = '') {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function resolveFullImageUrl(imgUrl = '') {
  if (!imgUrl) return DEFAULT_COVER_IMAGE;
  if (imgUrl.startsWith('http://') || imgUrl.startsWith('https://')) {
    return imgUrl;
  }
  const cleanPath = imgUrl.startsWith('/') ? imgUrl : `/${imgUrl}`;
  return `${SITE_DOMAIN}${cleanPath}`;
}

function injectMetadata(baseHtml, meta) {
  let html = baseHtml;

  // Replace <title>
  if (meta.title) {
    html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(meta.title)}</title>`);
  }

  // Replace or inject canonical link
  if (meta.canonicalUrl) {
    if (html.includes('rel="canonical"')) {
      html = html.replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i, `<link rel="canonical" href="${meta.canonicalUrl}" />`);
    } else {
      html = html.replace('</head>', `    <link rel="canonical" href="${meta.canonicalUrl}" />\n  </head>`);
    }
  }

  // Replace standard description
  if (meta.description) {
    html = html.replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i, `<meta name="description" content="${escapeHtml(meta.description)}" />`);
  }

  // Replace Open Graph tags
  const ogTags = [
    { prop: 'og:title', content: meta.ogTitle || meta.title },
    { prop: 'og:description', content: meta.ogDescription || meta.description },
    { prop: 'og:image', content: meta.ogImage },
    { prop: 'og:image:secure_url', content: meta.ogImage },
    { prop: 'og:image:width', content: '1200' },
    { prop: 'og:image:height', content: '630' },
    { prop: 'og:image:alt', content: meta.ogTitle || meta.title },
    { prop: 'og:url', content: meta.ogUrl || meta.canonicalUrl },
    { prop: 'og:type', content: meta.ogType || 'article' },
    { prop: 'og:site_name', content: 'BANGTAN GALLERY' }
  ];

  ogTags.forEach(({ prop, content }) => {
    if (!content) return;
    const regex = new RegExp(`<meta\\s+property="${prop}"\\s+content="[^"]*"\\s*\\/?>`, 'i');
    if (regex.test(html)) {
      html = html.replace(regex, `<meta property="${prop}" content="${escapeHtml(content)}" />`);
    } else {
      html = html.replace('</head>', `    <meta property="${prop}" content="${escapeHtml(content)}" />\n  </head>`);
    }
  });

  // Replace Twitter card tags
  const twitterTags = [
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: meta.twitterTitle || meta.ogTitle || meta.title },
    { name: 'twitter:description', content: meta.twitterDescription || meta.ogDescription || meta.description },
    { name: 'twitter:image', content: meta.twitterImage || meta.ogImage },
    { name: 'twitter:image:alt', content: meta.twitterTitle || meta.title }
  ];

  twitterTags.forEach(({ name, content }) => {
    if (!content) return;
    const regex = new RegExp(`<meta\\s+name="${name}"\\s+content="[^"]*"\\s*\\/?>`, 'i');
    if (regex.test(html)) {
      html = html.replace(regex, `<meta name="${name}" content="${escapeHtml(content)}" />`);
    } else {
      html = html.replace('</head>', `    <meta name="${name}" content="${escapeHtml(content)}" />\n  </head>`);
    }
  });

  // Replace image_src link
  if (meta.ogImage) {
    if (html.includes('rel="image_src"')) {
      html = html.replace(/<link\s+rel="image_src"\s+href="[^"]*"\s*\/?>/i, `<link rel="image_src" href="${meta.ogImage}" />`);
    } else {
      html = html.replace('</head>', `    <link rel="image_src" href="${meta.ogImage}" />\n  </head>`);
    }
  }

  // Inject Rich JSON-LD if article
  if (meta.article) {
    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      "headline": meta.article.title,
      "description": meta.article.summary,
      "image": [meta.ogImage],
      "datePublished": meta.article.date || "2026-03-11",
      "articleSection": meta.article.category || "General",
      "author": {
        "@type": "Organization",
        "name": "BANGTAN GALLERY Editorial"
      },
      "publisher": {
        "@type": "Organization",
        "name": "BANGTAN GALLERY",
        "logo": {
          "@type": "ImageObject",
          "url": "https://bangtangallery.online/favicon-512.png"
        }
      },
      "mainEntityOfPage": {
        "@type": "WebPage",
        "@id": meta.canonicalUrl
      }
    };

    html = html.replace('</head>', `    <script type="application/ld+json">\n${JSON.stringify(jsonLd, null, 2)}\n    </script>\n  </head>`);
  }

  return html;
}

(async () => {
if (fs.existsSync(indexHtmlPath)) {
  const indexHtmlContent = fs.readFileSync(indexHtmlPath, 'utf8');

  // 1. Generate 404.html (fallback for GitHub Pages, Render, etc.)
  fs.writeFileSync(path.join(distDir, '404.html'), indexHtmlContent);

  // 2. Pre-generate static route files for general SPA tabs
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
    'contact',
    'feedback',
    'setting',
    'community',
    'GeneratePic',
    'generatepic',
    'game',
    'profile'
  ];

  routes.forEach((route) => {
    fs.writeFileSync(path.join(distDir, `${route}.html`), indexHtmlContent);

    const routeDir = path.join(distDir, route);
    if (!fs.existsSync(routeDir)) {
      fs.mkdirSync(routeDir, { recursive: true });
    }
    fs.writeFileSync(path.join(routeDir, 'index.html'), indexHtmlContent);
  });

  // 3. Generate Main News Portal Page with News OG Tags
  const newsLandingMeta = {
    title: 'BTS News, Breaking Updates & Comeback Articles — BANGTAN GALLERY',
    description: 'Explore the latest BTS breaking news, 2026 World Tour announcements, FESTA updates, member awards, and exclusive ARMY features.',
    canonicalUrl: `${SITE_DOMAIN}/news`,
    ogTitle: 'BTS News, Breaking Updates & Comeback Articles — BANGTAN GALLERY',
    ogDescription: 'Explore breaking BTS announcements, 2026 tour schedules, member awards, and high-resolution photo archives.',
    ogImage: 'https://bangtangallery.online/images/og-cover-2.jpg',
    ogType: 'website'
  };

  const newsLandingHtml = injectMetadata(indexHtmlContent, newsLandingMeta);
  const newsBaseDir = path.join(distDir, 'news');
  if (!fs.existsSync(newsBaseDir)) {
    fs.mkdirSync(newsBaseDir, { recursive: true });
  }
  fs.writeFileSync(path.join(distDir, 'news.html'), newsLandingHtml);
  fs.writeFileSync(path.join(newsBaseDir, 'index.html'), newsLandingHtml);

  // 3b. Concert Replay landing page with its own share metadata
  // (share link: https://bangtangallery.online/arirang_concert_reply)
  const concertMeta = {
    title: 'BTS Concert Replay — Full Concerts | BANGTAN GALLERY',
    description: 'Watch full BTS concert replays — world tour stages, FESTA performances and exclusive stage archives, free for ARMY.',
    canonicalUrl: `${SITE_DOMAIN}/arirang_concert_reply`,
    ogTitle: 'BTS Concert Replay — Full Concerts | BANGTAN GALLERY',
    ogDescription: 'Relive your favorite BTS concert moments — full concert replays and exclusive stage archives.',
    ogImage: 'https://bangtangallery.online/images/og-cover-2.jpg',
    ogType: 'website'
  };

  const concertHtml = injectMetadata(indexHtmlContent, concertMeta);
  const concertDir = path.join(distDir, 'arirang_concert_reply');
  if (!fs.existsSync(concertDir)) {
    fs.mkdirSync(concertDir, { recursive: true });
  }
  fs.writeFileSync(path.join(distDir, 'arirang_concert_reply.html'), concertHtml);
  fs.writeFileSync(path.join(concertDir, 'index.html'), concertHtml);

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
    const coverPhoto = resolveFullImageUrl(article.featuredImage || article.imageUrl);
    const summary = article.seoDescription || article.summary || 'Read the full story on BANGTAN GALLERY.';
    const canonical = `${SITE_DOMAIN}/news/${slug}`;

    const articleMeta = {
      title: `${article.title} — BANGTAN GALLERY`,
      description: summary,
      canonicalUrl: canonical,
      ogTitle: article.title,
      ogDescription: summary,
      ogImage: coverPhoto,
      ogUrl: canonical,
      ogType: 'article',
      twitterTitle: article.title,
      twitterDescription: summary,
      twitterImage: coverPhoto,
      article
    };

    const articleHtml = injectMetadata(indexHtmlContent, articleMeta);

    // Write to /dist/news/<slug>/index.html (standard directory structure)
    const articleDir = path.join(newsBaseDir, slug);
    if (!fs.existsSync(articleDir)) {
      fs.mkdirSync(articleDir, { recursive: true });
    }
    fs.writeFileSync(path.join(articleDir, 'index.html'), articleHtml);

    // Also write /dist/news/<slug>.html (support static servers that map /news/<slug> to <slug>.html)
    fs.writeFileSync(path.join(newsBaseDir, `${slug}.html`), articleHtml);

    console.log(`   [SSG News] Pre-rendered: /news/${slug} (Cover: ${coverPhoto.slice(0, 50)}...)`);
  });

  // 5. Pre-generate Gallery photo pages so a shared photo link shows
  // THAT picture in the link preview (the app opens the same photo in
  // the gallery viewer when the link is visited). Covers the built-in
  // gallery items; photos uploaded later share the same link format
  // and open in the viewer, with the site cover as their preview.
  console.log(` Generating Open Graph preview HTML for ${GALLERY_ITEMS.length} gallery photos...`);
  const galleryBaseDir = path.join(distDir, 'gallery');
  if (!fs.existsSync(galleryBaseDir)) {
    fs.mkdirSync(galleryBaseDir, { recursive: true });
  }
  GALLERY_ITEMS.forEach((item) => {
    const photo = resolveFullImageUrl(item.url);
    const canonical = `${SITE_DOMAIN}/gallery/${item.id}`;
    const meta = {
      title: `${item.title} — BANGTAN GALLERY`,
      description: item.title,
      canonicalUrl: canonical,
      ogTitle: item.title,
      ogDescription: `${item.category} • BANGTAN GALLERY`,
      ogImage: photo,
      ogUrl: canonical,
      ogType: 'website',
      twitterTitle: item.title,
      twitterDescription: `${item.category} • BANGTAN GALLERY`,
      twitterImage: photo
    };
    const html = injectMetadata(indexHtmlContent, meta);
    const dir = path.join(galleryBaseDir, item.id);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(path.join(dir, 'index.html'), html);
    fs.writeFileSync(path.join(galleryBaseDir, `${item.id}.html`), html);
    console.log(`   [SSG Gallery] Pre-rendered: /gallery/${item.id}`);
  });

  // Full sitemap.xml for Google: every main page + each news article +
  // each gallery photo page, regenerated on every build so Google can
  // discover and index the whole site (and its real photos) instead of
  // only the homepage. Build-script only — the site itself is unchanged.
  const sitemapUrls: string[] = [
    `${SITE_DOMAIN}/`,
    `${SITE_DOMAIN}/members`,
    `${SITE_DOMAIN}/music`,
    `${SITE_DOMAIN}/videos`,
    `${SITE_DOMAIN}/arirang_concert_reply`,
    `${SITE_DOMAIN}/gallery`,
    `${SITE_DOMAIN}/news`,
    `${SITE_DOMAIN}/events`,
    `${SITE_DOMAIN}/timeline`,
    `${SITE_DOMAIN}/live`,
    `${SITE_DOMAIN}/voting`,
    `${SITE_DOMAIN}/downloads`,
    `${SITE_DOMAIN}/faq`,
    `${SITE_DOMAIN}/contact`,
    `${SITE_DOMAIN}/feedback`,
    `${SITE_DOMAIN}/community`
  ];
  allArticles.forEach((article) => {
    const slug = article.slug || article.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || article.id;
    sitemapUrls.push(`${SITE_DOMAIN}/news/${slug}`);
  });
  GALLERY_ITEMS.forEach((item) => {
    sitemapUrls.push(`${SITE_DOMAIN}/gallery/${item.id}`);
  });
  const sitemapXml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    sitemapUrls.map((u) => `  <url><loc>${u}</loc></url>`).join('\n') +
    '\n</urlset>\n';
  fs.writeFileSync(path.join(distDir, 'sitemap.xml'), sitemapXml);
  console.log(`🗺️  Sitemap written with ${sitemapUrls.length} URLs.`);

  console.log('✅ Successfully pre-generated all static SPA and dynamic News Open Graph route files!');
} else {
  console.warn('⚠️ Warning: dist/index.html not found, skipping route generation.');
}
})();
