import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { DB2_CONFIG } from './config/db2';

// --- DB2 mirror (Batch 149) ---
// The main project's free Firestore quota can die mid-day (it did on
// 2026-11-07 and again on 2026-11-11: reads hit the 50K/day cap and
// every read returned RESOURCE_EXHAUSTED). While it is dead, a
// first-time visitor has no local cache and the site falls back to
// the built-in seed config — which looks exactly like "everything
// the admin uploaded has vanished", even though nothing was deleted.
//
// The fix: every successful Publish also writes a copy of the
// published config into this second project's Firestore (its own
// separate free quota), and the published-config read path falls
// back to that copy when — and only when — the main read actually
// fails. Normal traffic never touches DB2, so its quota stays
// untouched for the days it is needed.
let db2Instance: any = null;
try {
  const app2 = initializeApp(DB2_CONFIG, 'db2');
  db2Instance = getFirestore(app2);
} catch (e) {
  console.warn('[DB2 MIRROR] Second Firebase app failed to initialise; mirror disabled.', e);
}

export const db2 = db2Instance;

// Read the mirrored published config from DB2. Returns null when the
// mirror is unavailable or empty — callers then use their existing
// local-cache / default fallbacks.
export async function readPublishedFromDb2(): Promise<any | null> {
  if (!db2Instance) return null;
  try {
    const snap = await getDoc(doc(db2Instance, 'config', 'published'));
    return snap.exists() ? snap.data() : null;
  } catch (e) {
    console.warn('[DB2 MIRROR] Mirror read failed:', e);
    return null;
  }
}

// Write the published config into DB2. Best-effort by design: a
// mirror failure must never fail or delay the real publish, so this
// swallows its own errors (and is called fire-and-forget).
export async function mirrorPublishedToDb2(data: any): Promise<boolean> {
  if (!db2Instance || !data) return false;
  try {
    await setDoc(doc(db2Instance, 'config', 'published'), data);
    return true;
  } catch (e) {
    console.warn('[DB2 MIRROR] Mirror write failed:', e);
    return false;
  }
}
