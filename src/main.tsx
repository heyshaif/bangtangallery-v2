import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { handleApiRequest } from './firebaseController';

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

  // If this is a relative API route, process it using our Firebase controller
  if (urlStr.startsWith('/api/') || urlStr.match(/^\/api(?:\/|$)/)) {
    console.log(`[FIREBASE ROUTER] Intercepting request: ${urlStr}`);
    
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

    try {
      const result = await handleApiRequest(urlStr, init?.method || 'GET', body);
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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

