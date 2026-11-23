// One-off: retitle the Live Stream from Day 1 to Day 3 (owner 2026-11-23).
// Title + description only — the video URL is untouched (it is dead; the
// owner still needs to supply a Day 3 video link). Updated everywhere the
// liveStream object lives: main published + main draft + the config/liveStream
// doc (which publish merges in — without this the next publish would revert
// the change) + DB2 published. Verified by fresh re-read.
const store = new Map<string, string>();
(global as any).localStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => store.set(k, String(v)),
  removeItem: (k: string) => store.delete(k),
  clear: () => store.clear(),
};
(global as any).window = {
  localStorage: (global as any).localStorage,
  location: { hostname: 'localhost', href: 'http://localhost/' },
  addEventListener: () => {},
  removeEventListener: () => {},
};
(global as any).location = (global as any).window.location;
Object.defineProperty(global, 'navigator', { value: { userAgent: 'node' }, configurable: true });

const { getDocFromServer, doc, updateDoc } = await import('firebase/firestore');
const { db } = await import('./src/firebase');
const { db2 } = await import('./src/firebaseDb2');

const NEW_TITLE = "BTS World Tour 'ARIRANG' in Kaohsiung \u2014 Day 3 Fancam Replay";
const NEW_DESC = 'Day 3 of the ARIRANG world tour at Kaohsiung National Stadium, November 22, 2026 \u2014 full HD fancam replay.';

const targets: Array<{ label: string; ref: any; nested: boolean }> = [
  { label: 'main published', ref: doc(db, 'config', 'published'), nested: true },
  { label: 'main draft', ref: doc(db, 'config', 'draft'), nested: true },
  { label: 'DB2 published', ref: doc(db2, 'config', 'published'), nested: true },
  { label: 'config/liveStream doc', ref: doc(db, 'config', 'liveStream'), nested: false },
];

for (const t of targets) {
  const snap = await getDocFromServer(t.ref);
  if (!snap.exists()) {
    console.log(t.label, 'MISSING — skipped');
    continue;
  }
  const data: any = snap.data();
  const ls = t.nested ? data?.liveStream : data;
  if (!ls || typeof ls !== 'object') {
    console.log(t.label, 'no liveStream object — skipped');
    continue;
  }
  if (t.nested) {
    await updateDoc(t.ref, { liveStream: { ...ls, title: NEW_TITLE, description: NEW_DESC } });
  } else {
    await updateDoc(t.ref, { title: NEW_TITLE, description: NEW_DESC });
  }
  console.log(t.label, 'updated from:', JSON.stringify(ls.title));
}

for (const t of targets) {
  const snap = await getDocFromServer(t.ref);
  if (!snap.exists()) continue;
  const data: any = snap.data();
  const ls = t.nested ? data?.liveStream : data;
  console.log(t.label, 'verify title:', JSON.stringify(ls?.title), '| desc day:', (ls?.description || '').includes('Day 3') ? 'Day 3 OK' : 'NOT DAY 3', '| url still:', ls?.url || ls?.embedCode || null);
}
process.exit(0);
