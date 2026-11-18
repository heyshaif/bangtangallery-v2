import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { defineConfig, type Plugin } from 'vite';
import { MEMBERS, GALLERY_ITEMS, NEWS_ARTICLES } from './src/data/btsData';
import { injectNewsMetadata, injectRouteMetadata, resolveFullImageUrl, findArticleByUrlPath, SITE_DOMAIN } from './src/utils/seoHtmlInjector';
import { routeSeoForPath, isKnownRoutePath, buildBreadcrumbJsonLd, buildWebPageJsonLd } from './src/utils/seo';

function newsSeoPlugin(): Plugin {
  return {
    name: 'vite-news-seo-metadata-crawler',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        const reqUrl = ctx.originalUrl || ctx.path || '';
        const cleanPath = reqUrl.split('?')[0].split('#')[0];

        // Batch 151: every known route (sections, member pages, gallery
        // photos, news landing + articles) gets its own title /
        // description / canonical / OG / Twitter + BreadcrumbList and
        // WebPage JSON-LD from the shared ROUTE_SEO map. The homepage
        // ('/') keeps the base index.html meta untouched.
        if (cleanPath !== '/' && cleanPath !== '') {
          const lookup = routeSeoForPath(cleanPath, {
            members: MEMBERS,
            galleryItems: GALLERY_ITEMS,
            articles: NEWS_ARTICLES,
          });
          if (lookup.member || lookup.photo || lookup.article || isKnownRoutePath(cleanPath)) {
            const seo = lookup.seo;
            return injectRouteMetadata(html, {
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
              article: lookup.article,
            }, [
              buildBreadcrumbJsonLd(lookup.breadcrumb),
              buildWebPageJsonLd(seo),
            ]);
          }
        }

        return html;
      }
    },
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const url = req.url || '';
        const cleanPath = url.split('?')[0].split('#')[0];

        if ((cleanPath === '/api/upload/audio' || cleanPath === '/api/admin/media/upload') && req.method === 'POST') {
          let bodyData = '';
          req.on('data', (chunk: Buffer) => {
            bodyData += chunk.toString();
          });
          req.on('end', () => {
            try {
              const body = JSON.parse(bodyData);
              const uploadData = body.fileData || body.base64 || body.url || body.data;
              const category = body.category || '';
              const isAudio = cleanPath === '/api/upload/audio' || category === 'Audio' || category === 'Music' || body.type?.includes('audio') || body.filename?.match(/\.(mp3|wav|m4a|aac|ogg|flac)$/i) || body.name?.match(/\.(mp3|wav|m4a|aac|ogg|flac)$/i);

              if (isAudio && uploadData && typeof uploadData === 'string' && uploadData.startsWith('data:')) {
                const parts = uploadData.split(';base64,');
                const base64Data = parts[1] || '';
                const buffer = Buffer.from(base64Data, 'base64');
                const rawName = body.filename || body.name || `track_${Date.now()}.mp3`;
                const cleanName = rawName.replace(/[^a-zA-Z0-9._-]/g, '_');
                const audioDir = path.resolve(__dirname, 'public', 'audio');
                if (!fs.existsSync(audioDir)) {
                  fs.mkdirSync(audioDir, { recursive: true });
                }
                const filePath = path.join(audioDir, cleanName);
                fs.writeFileSync(filePath, buffer);

                res.setHeader('Content-Type', 'application/json');
                res.statusCode = 200;
                res.end(JSON.stringify({
                  success: true,
                  url: `/audio/${cleanName}`,
                  filename: cleanName
                }));
                return;
              }
            } catch (err) {
              console.error('Audio upload middleware error:', err);
            }
            next();
          });
          return;
        }
        next();
      });

      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '';
        const cleanPath = url.split('?')[0].split('#')[0];

        // Batch 151: serve the transformed (per-route SEO) HTML for any
        // known route in dev, not just /news.
        if (isKnownRoutePath(cleanPath, { members: MEMBERS, galleryItems: GALLERY_ITEMS, articles: NEWS_ARTICLES })) {
          try {
            const indexPath = path.resolve(__dirname, 'index.html');
            let rawHtml = fs.readFileSync(indexPath, 'utf-8');
            rawHtml = await server.transformIndexHtml(url, rawHtml);
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.statusCode = 200;
            res.end(rawHtml);
            return;
          } catch (err) {
            console.error('Error serving route preview HTML:', err);
          }
        }
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '';
        const cleanPath = url.split('?')[0].split('#')[0];

        // Batch 151: same per-route SEO injection for preview as for dev.
        // (The built dist/ files are already pre-rendered; this covers
        // direct hits that fall through to the base index.html.)
        if (isKnownRoutePath(cleanPath, { members: MEMBERS, galleryItems: GALLERY_ITEMS, articles: NEWS_ARTICLES })) {
          try {
            const indexPath = path.resolve(__dirname, 'dist', 'index.html');
            if (fs.existsSync(indexPath)) {
              let rawHtml = fs.readFileSync(indexPath, 'utf-8');
              const lookup = routeSeoForPath(cleanPath, {
                members: MEMBERS,
                galleryItems: GALLERY_ITEMS,
                articles: NEWS_ARTICLES,
              });
              const seo = lookup.seo;
              rawHtml = injectRouteMetadata(rawHtml, {
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
                article: lookup.article,
              }, [
                buildBreadcrumbJsonLd(lookup.breadcrumb),
                buildWebPageJsonLd(seo),
              ]);
              res.setHeader('Content-Type', 'text/html; charset=utf-8');
              res.statusCode = 200;
              res.end(rawHtml);
              return;
            }
          } catch (err) {
            console.error('Error serving preview HTML:', err);
          }
        }
        next();
      });
    }
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), newsSeoPlugin()],
    build: {
      rollupOptions: {
        input: {
          // Public website — contains no admin code at all.
          main: path.resolve(__dirname, 'index.html'),
          // Standalone Admin Panel app (admin.html), same backend.
          admin: path.resolve(__dirname, 'admin.html'),
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâ€”file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {
        ignored: ['**/data_store.json', '**/uploads/**'],
      },
      proxy: process.env.DISABLE_HMR !== 'true' ? {
        '/api': {
          target: 'https://api.bangtangallery.online',
          changeOrigin: true,
          secure: false,
        }
      } : undefined,
    },
  };
});
