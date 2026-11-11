// Batch 75 — captures the browser's PWA install prompt as early as
// possible (the event fires once per page load; components that mount
// later subscribe here instead of listening themselves).

let deferred: any = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((fn) => fn());

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e: any) => {
    e.preventDefault();
    deferred = e;
    emit();
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    emit();
  });
}

export const installPromptStore = {
  canInstall: () => !!deferred,
  subscribe: (fn: () => void) => {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },
  prompt: async (): Promise<boolean> => {
    if (!deferred) return false;
    try {
      deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice && choice.outcome === 'accepted') {
        deferred = null;
        emit();
        return true;
      }
    } catch {
      /* prompt dismissed or unavailable */
    }
    return false;
  }
};

export const isStandalone = (): boolean => {
  if (typeof window === 'undefined') return false;
  return (
    (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
    (window.navigator as any).standalone === true
  );
};

export const isIOS = (): boolean =>
  typeof navigator !== 'undefined' && /iphone|ipad|ipod/i.test(navigator.userAgent);
