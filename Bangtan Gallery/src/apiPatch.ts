import { handleApiRequest } from './firebaseController';
import { getMediaItemFromIndexedDB } from './utils/mediaStore';

/**
 * Client-side API router, shared by the public website entry (main.tsx)
 * and the standalone Admin Panel entry (admin-main.tsx). Every /api/*
 * fetch is handled in the browser by the Firebase controller, so both
 * apps talk to the exact same backend and database.
 */
export function installApiPatch() {
// Intercept all relative API fetch requests and route them to our client-side Firebase Controller
const originalFetch = window.fetch.bind(window);

const patchedFetch = async function (input: any, init: any) {
  let urlStr = '';
  if (typeof input === 'string') {
    urlStr = input;
  } else if (input instanceof URL) {
    urlStr = input.toString();
  } else if (input && typeof input === 'object' && 'url' in input) {
    urlStr = (input as Request).url;
  }

  // Check if this is an API route (relative like /api/..., or full URL like https://bangtangallery.online/api/... or https://api.bangtangallery.online/api/...)
  let isApiRoute = false;
  let apiPath = '';

  try {
    const parsed = new URL(urlStr, window.location.origin);
    if (parsed.pathname.startsWith('/api/') || parsed.pathname === '/api') {
      isApiRoute = true;
      apiPath = parsed.pathname + parsed.search;
    }
  } catch {
    if (urlStr.startsWith('/api/') || urlStr.match(/^\/api(?:\/|$)/)) {
      isApiRoute = true;
      apiPath = urlStr;
    }
  }

  if (isApiRoute) {
    console.log(`[FIREBASE ROUTER] Intercepting request: ${apiPath} (original: ${urlStr})`);
    
    let body = undefined;
    if (init && init.body) {
      try {
        if (typeof init.body === 'string') {
          body = JSON.parse(init.body);
        } else if (init.body instanceof FormData) {
          // If body is FormData (such as for file uploads), we can extract its keys
          const parsed: Record<string, any> = {};
          init.body.forEach((val, key) => {
            parsed[key] = val;
          });
          body = parsed;
        }
      } catch (e) {
        console.warn('[FIREBASE ROUTER] Non-JSON payload or parsing failed:', e);
      }
    }

    let headers: Record<string, any> = {};
    if (init && init.headers) {
      try {
        if (typeof (init.headers as any).entries === 'function') {
          headers = Object.fromEntries((init.headers as any).entries());
        } else if (typeof init.headers === 'object') {
          headers = { ...init.headers };
        }
      } catch {}
    }

    // Direct audio upload endpoint: let native dev server middleware save the file into public/audio/
    if (apiPath.startsWith('/api/upload/audio') || (apiPath.startsWith('/api/admin/media/upload') && (body?.category === 'Audio' || body?.category === 'Music'))) {
      try {
        const netRes = await originalFetch(input, init);
        if (netRes.ok) {
          return netRes;
        }
      } catch (e) {
        console.warn('[AUDIO ROUTER] Dev server direct upload fell back to client controller:', e);
      }
    }

    // Serve binary media directly from IndexedDB persistent store
    if (apiPath.startsWith('/api/media/serve/')) {
      try {
        const mediaId = apiPath.replace('/api/media/serve/', '').split('?')[0];
        if (mediaId) {
          const item = await getMediaItemFromIndexedDB(mediaId);
          if (item && item.blob) {
            return new Response(item.blob, {
              status: 200,
              headers: {
                'Content-Type': item.type || 'audio/mpeg',
                'Content-Length': String(item.size || item.blob.size),
                'Accept-Ranges': 'bytes'
              }
            });
          }
        }
      } catch (err) {
        console.warn('[MEDIA STORE ROUTER] Error serving blob from IndexedDB:', err);
      }
    }

    try {
      const result = await handleApiRequest(apiPath, init?.method || 'GET', body, headers);
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error: any) {
      console.error('[FIREBASE ROUTER ERROR] Failed executing route:', error);
      return new Response(JSON.stringify({ success: false, error: error.message || String(error) }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }

  // Otherwise, default to native fetch (for external assets/URLs)
  return originalFetch(input, init);
};

try {
  Object.defineProperty(window, 'fetch', {
    value: patchedFetch,
    writable: true,
    configurable: true,
    enumerable: true
  });
} catch (e) {
  console.warn('[API PROXY] Failed putting direct descriptor on window.fetch, falling back to direct assignment:', e);
  try {
    (window as any).fetch = patchedFetch;
  } catch (err) {
    console.error('[API PROXY] Could not override window.fetch:', err);
  }
}
}
