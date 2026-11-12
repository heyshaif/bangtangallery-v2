import { NEWS_ARTICLES } from '../data/btsData.js';
import type { NewsArticle } from '../types.js';

export const SITE_DOMAIN = 'https://bangtangallery.online';
export const DEFAULT_OG_IMAGE = 'https://bangtangallery.online/images/og-cover-2.jpg';

export function escapeHtml(str = ''): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export function resolveFullImageUrl(imgUrl = ''): string {
  if (!imgUrl) return DEFAULT_OG_IMAGE;
  if (imgUrl.startsWith('http://') || imgUrl.startsWith('https://')) {
    return imgUrl;
  }
  const cleanPath = imgUrl.startsWith('/') ? imgUrl : `/${imgUrl}`;
  return `${SITE_DOMAIN}${cleanPath}`;
}

export interface MetaTagsConfig {
  title: string;
  description: string;
  canonicalUrl: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage: string;
  ogUrl?: string;
  ogType?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  article?: NewsArticle;
}

export function injectNewsMetadata(baseHtml: string, meta: MetaTagsConfig): string {
  let html = baseHtml;

  // 1. Replace <title>
  if (meta.title) {
    html = html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(meta.title)}</title>`);
  }

  // 2. Canonical URL
  if (meta.canonicalUrl) {
    if (html.includes('rel="canonical"')) {
      html = html.replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i, `<link rel="canonical" href="${meta.canonicalUrl}" />`);
    } else {
      html = html.replace('</head>', `    <link rel="canonical" href="${meta.canonicalUrl}" />\n  </head>`);
    }
  }

  // 3. Meta Description
  if (meta.description) {
    html = html.replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i, `<meta name="description" content="${escapeHtml(meta.description)}" />`);
  }

  // 4. Open Graph Tags
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

  // 5. Twitter Card Tags (Large Image)
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

  // 6. image_src link
  if (meta.ogImage) {
    if (html.includes('rel="image_src"')) {
      html = html.replace(/<link\s+rel="image_src"\s+href="[^"]*"\s*\/?>/i, `<link rel="image_src" href="${meta.ogImage}" />`);
    } else {
      html = html.replace('</head>', `    <link rel="image_src" href="${meta.ogImage}" />\n  </head>`);
    }
  }

  // 7. Schema.org NewsArticle JSON-LD
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

export function injectJsonLd(html: string, jsonLd: Record<string, unknown> | Record<string, unknown>[]): string {
  const blocks = Array.isArray(jsonLd) ? jsonLd : [jsonLd];
  const script = blocks
    .map((b) => `    <script type="application/ld+json">\n${JSON.stringify(b, null, 2)}\n    </script>`)
    .join('\n');
  return html.replace('</head>', `${script}\n  </head>`);
}

/**
 * Batch 151 — generic version of injectNewsMetadata: the same
 * title/canonical/description/OG/Twitter handling, plus optional extra
 * JSON-LD blocks (BreadcrumbList, WebPage, Person, ImageObject).
 * News articles keep using injectNewsMetadata (unchanged) so their
 * NewsArticle JSON-LD is still added by that function.
 */
export function injectRouteMetadata(
  baseHtml: string,
  meta: MetaTagsConfig,
  extraJsonLd?: Record<string, unknown>[],
): string {
  const html = injectNewsMetadata(baseHtml, meta);
  if (!extraJsonLd || extraJsonLd.length === 0) return html;
  return injectJsonLd(html, extraJsonLd);
}

export function findArticleByUrlPath(pathname: string, customArticles?: NewsArticle[]): NewsArticle | null {
  const articles = customArticles && customArticles.length > 0 ? customArticles : NEWS_ARTICLES;
  const cleanPath = pathname.split('?')[0].split('#')[0];
  const parts = cleanPath.split('/').filter(Boolean);

  if (parts.length >= 2 && parts[0] === 'news') {
    const targetSlug = parts[1].toLowerCase().replace(/\.html$/, '');
    return articles.find(a => {
      const slug = a.slug || a.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
      return slug.toLowerCase() === targetSlug || a.id.toLowerCase() === targetSlug;
    }) || null;
  }

  return null;
}
