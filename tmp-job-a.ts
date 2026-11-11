import { readFileSync } from 'node:fs';
import { db } from './src/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const withTimeout = <T>(p: Promise<T>, ms = 280000, label = 'op'): Promise<T> =>
  Promise.race([
    p,
    new Promise<T>((_, rej) => setTimeout(() => rej(new Error(`TIMEOUT ${label} after ${ms}ms`)), ms)),
  ]);

async function run() {
  const file: any[] = JSON.parse(readFileSync('../seed-setlists-draft.json', 'utf8'));
  const fileIds = new Set(file.map((e) => e.id));
  console.log('file entries:', file.length);
  for (const name of ['published', 'draft']) {
    const ref = doc(db, 'config', name);
    const snap = await withTimeout(getDoc(ref), 280000, `get ${name}`);
    const cur: any[] = (snap.data() as any)?.tourSetlists ?? [];
    const curIds = new Set(cur.map((e: any) => e.id));
    const missing = file.filter((e) => !curIds.has(e.id));
    console.log(name, 'current:', cur.length, 'missing from file:', missing.length);
    if (missing.length === 0) { console.log(name, 'SKIP already complete'); continue; }
    const byId = new Map<string, any>();
    for (const e of cur) byId.set(e.id, e);
    for (const e of file) byId.set(e.id, e); // file wins on conflicts
    const merged = [...byId.values()];
    let ok = false;
    for (let attempt = 1; attempt <= 2 && !ok; attempt++) {
      try {
        await withTimeout(setDoc(ref, { tourSetlists: merged }, { merge: true }), 280000, `set ${name} attempt ${attempt}`);
        ok = true;
      } catch (e: any) {
        console.log(name, 'write attempt', attempt, 'failed:', e.message);
      }
    }
    console.log(name, ok ? `WROTE merged ${merged.length}` : 'WRITE FAILED both attempts');
  }
  process.exit(0);
}
run().catch((e) => { console.error('FATAL', e); process.exit(1); });
