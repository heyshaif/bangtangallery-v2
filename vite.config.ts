import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import { defineConfig, type Plugin } from 'vite';
import { NEWS_ARTICLES } from './src/data/btsData';
import { injectNewsMetadata, resolveFullImageUrl, findArticleByUrlPath, SITE_DOMAIN } from './src/utils/seoHtmlInjector';

function newsSeoPlugin(): Plugin {
  return {
    name: 'vite-news-seo-metadata-crawler',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        const reqUrl = ctx.originalUrl || ctx.path || '';
        const article = findArticleByUrlPath(reqUrl, NEWS_ARTICLES);

        if (article) {
          const slug = article.slug || article.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || article.id;
          const coverPhoto = resolveFullImageUrl(article.featuredImage || article.imageUrl);
          const summary = article.seoDescription || article.summary || 'Read the full story on BANGTAN GALLERY.';
          const canonical = `${SITE_DOMAIN}/news/${slug}`;

          return injectNewsMetadata(html, {
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
          });
        }

        const cleanPath = reqUrl.split('?')[0].split('#')[0];
        if (cleanPath === '/news' || cleanPath === '/news/') {
          return injectNewsMetadata(html, {
            title: 'BTS News, Breaking Updates & Comeback Articles — BANGTAN GALLERY',
            description: 'Explore the latest BTS breaking news, 2026 World Tour announcements, FESTA updates, member awards, and exclusive ARMY features.',
            canonicalUrl: `${SITE_DOMAIN}/news`,
            ogTitle: 'BTS News, Breaking Updates & Comeback Articles — BANGTAN GALLERY',
            ogDescription: 'Explore breaking BTS announcements, 2026 tour schedules, member awards, and high-resolution photo archives.',
            ogImage: 'https://bangtangallery.online/images/og-cover-2.jpg',
            ogType: 'website'
          });
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

        // Check if request is directly for a news route
        if (cleanPath.startsWith('/news/') || cleanPath === '/news') {
          const article = findArticleByUrlPath(cleanPath, NEWS_ARTICLES);
          if (article || cleanPath === '/news') {
            try {
              const indexPath = path.resolve(__dirname, 'index.html');
              let rawHtml = fs.readFileSync(indexPath, 'utf-8');
              rawHtml = await server.transformIndexHtml(url, rawHtml);
              res.setHeader('Content-Type', 'text/html; charset=utf-8');
              res.statusCode = 200;
              res.end(rawHtml);
              return;
            } catch (err) {
              console.error('Error serving news preview HTML:', err);
            }
          }
        }
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url || '';
        const cleanPath = url.split('?')[0].split('#')[0];

        if (cleanPath.startsWith('/news/') || cleanPath === '/news') {
          const article = findArticleByUrlPath(cleanPath, NEWS_ARTICLES);
          if (article || cleanPath === '/news') {
            try {
              const indexPath = path.resolve(__dirname, 'dist', 'index.html');
              if (fs.existsSync(indexPath)) {
                let rawHtml = fs.readFileSync(indexPath, 'utf-8');
                if (article) {
                  const slug = article.slug || article.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '') || article.id;
                  const coverPhoto = resolveFullImageUrl(article.featuredImage || article.imageUrl);
                  const summary = article.seoDescription || article.summary || 'Read the full story on BANGTAN GALLERY.';
                  const canonical = `${SITE_DOMAIN}/news/${slug}`;

                  rawHtml = injectNewsMetadata(rawHtml, {
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
                  });
                }
                res.setHeader('Content-Type', 'text/html; charset=utf-8');
                res.statusCode = 200;
                res.end(rawHtml);
                return;
              }
            } catch (err) {
              console.error('Error serving preview HTML:', err);
            }
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
