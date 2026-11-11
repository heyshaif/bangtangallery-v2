import fs from 'fs';
import path from 'path';

const distDir = path.resolve('dist');
const indexHtmlPath = path.join(distDir, 'index.html');

if (fs.existsSync(indexHtmlPath)) {
  const indexHtmlContent = fs.readFileSync(indexHtmlPath, 'utf8');

  // 1. Fallback 404.html তৈরি করে
  fs.writeFileSync(path.join(distDir, '404.html'), indexHtmlContent);

  // 2. প্রতিটি ট্যাবের জন্য স্ট্যাটিক ফোল্ডার ও html তৈরি করে
  const routes = [
    'livestream',
    'live-stream',
    'live',
    'news',
    'gallery',
    'music',
    'videos',
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

  console.log('✅ SPA Route files successfully generated!');
}