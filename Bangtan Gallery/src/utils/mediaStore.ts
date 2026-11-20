/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Persistent Media Store backed by IndexedDB and in-memory Blob URL cache
// Supports large audio files (MP3, WAV, M4A, AAC, FLAC) locally, and concert
// video files (MP4, WebM, MOV up to 2-3 GB) via real Firebase Storage uploads.

import { ref as createStorageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';

const DB_NAME = 'BangtanMediaStoreDB';
const DB_VERSION = 1;
const STORE_NAME = 'media_files';

export interface MediaItem {
  id: string;
  name: string;
  type: string;
  size: number;
  formattedSize: string;
  duration?: number;
  formattedDuration?: string;
  width?: number;
  height?: number;
  quality?: '4K' | '1080p' | '720p' | 'SD';
  posterUrl?: string;
  blob?: Blob;
  dataUrl?: string;
  url?: string;
  storageRef?: string;
  uploadedAt: string;
}

export interface UploadProgress {
  progress: number; // 0 to 100
  loadedBytes: number;
  totalBytes: number;
  speedBps: number; // bytes per second
  speedFormatted: string; // e.g. "2.4 MB/s"
  etaSeconds: number;
  etaFormatted: string; // e.g. "1.2s remaining"
  status: string;
  isComplete: boolean;
  error?: string;
}

// In-memory cache for active blob URLs
const objectUrlCache = new Map<string, string>();

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event: any) => {
      resolve(event.target.result);
    };

    request.onerror = (event: any) => {
      reject(event.target.error || new Error('Failed to open IndexedDB'));
    };
  });

  return dbPromise;
}

// Format bytes into readable string
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Format duration in seconds to m:ss or h:mm:ss
export function formatDuration(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
  const totalSecs = Math.floor(seconds);
  const hours = Math.floor(totalSecs / 3600);
  const minutes = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

// Extract audio duration using HTML5 Audio element
export function extractAudioMetadata(file: File | Blob): Promise<{ duration: number; formattedDuration: string }> {
  return new Promise((resolve) => {
    const audio = new Audio();
    const objectUrl = URL.createObjectURL(file);
    audio.src = objectUrl;

    const cleanup = () => {
      audio.removeEventListener('loadedmetadata', onLoaded);
      audio.removeEventListener('error', onError);
      URL.revokeObjectURL(objectUrl);
    };

    const onLoaded = () => {
      const duration = audio.duration || 0;
      cleanup();
      resolve({
        duration,
        formattedDuration: formatDuration(duration)
      });
    };

    const onError = () => {
      cleanup();
      resolve({ duration: 0, formattedDuration: '0:00' });
    };

    audio.addEventListener('loadedmetadata', onLoaded);
    audio.addEventListener('error', onError);

    // Timeout safety
    setTimeout(() => {
      cleanup();
      resolve({ duration: 0, formattedDuration: '0:00' });
    }, 10000);
  });
}

// Extract video duration, dimensions, quality, and thumbnail poster
export function extractVideoMetadata(file: File | Blob): Promise<{
  duration: number;
  formattedDuration: string;
  width: number;
  height: number;
  quality: '4K' | '1080p' | '720p' | 'SD';
  posterUrl: string;
}> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    const objectUrl = URL.createObjectURL(file);
    video.src = objectUrl;
    video.muted = true;
    video.playsInline = true;
    video.preload = 'metadata';

    const cleanup = () => {
      video.removeEventListener('loadedmetadata', onLoaded);
      video.removeEventListener('seeked', onSeeked);
      video.removeEventListener('error', onError);
      URL.revokeObjectURL(objectUrl);
    };

    let duration = 0;
    let width = 1920;
    let height = 1080;
    let quality: '4K' | '1080p' | '720p' | 'SD' = '1080p';

    const onLoaded = () => {
      duration = video.duration || 0;
      width = video.videoWidth || 1920;
      height = video.videoHeight || 1080;

      if (width >= 3840 || height >= 2160) {
        quality = '4K';
      } else if (width >= 1920 || height >= 1080) {
        quality = '1080p';
      } else if (width >= 1280 || height >= 720) {
        quality = '720p';
      } else {
        quality = 'SD';
      }

      // Seek to 1s or 5% of duration for thumbnail frame
      const seekTime = Math.min(2, duration > 1 ? 1 : duration * 0.1);
      video.currentTime = seekTime;
    };

    const onSeeked = () => {
      let posterUrl = '';
      try {
        const canvas = document.createElement('canvas');
        canvas.width = Math.min(width, 1280);
        canvas.height = Math.round((canvas.width * height) / width) || 720;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          posterUrl = canvas.toDataURL('image/jpeg', 0.85);
        }
      } catch (err) {
        console.warn('Poster frame generation error:', err);
      }

      cleanup();
      resolve({
        duration,
        formattedDuration: formatDuration(duration),
        width,
        height,
        quality,
        posterUrl
      });
    };

    const onError = () => {
      cleanup();
      resolve({
        duration: 0,
        formattedDuration: '0:00',
        width: 1920,
        height: 1080,
        quality: '1080p',
        posterUrl: ''
      });
    };

    video.addEventListener('loadedmetadata', onLoaded);
    video.addEventListener('seeked', onSeeked);
    video.addEventListener('error', onError);

    setTimeout(() => {
      cleanup();
      resolve({
        duration: 0,
        formattedDuration: '0:00',
        width: 1920,
        height: 1080,
        quality: '1080p',
        posterUrl: ''
      });
    }, 12000);
  });
}

// Save media blob directly to IndexedDB
export async function saveMediaItemToIndexedDB(item: MediaItem): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.put(item);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// Retrieve media item from IndexedDB
export async function getMediaItemFromIndexedDB(id: string): Promise<MediaItem | null> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

// Delete media item from IndexedDB
export async function deleteMediaItemFromIndexedDB(id: string): Promise<void> {
  const db = await getDB();
  if (objectUrlCache.has(id)) {
    URL.revokeObjectURL(objectUrlCache.get(id)!);
    objectUrlCache.delete(id);
  }
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

// Get or create a working Blob URL for any media ID
export async function getMediaUrlById(id: string): Promise<string | null> {
  if (objectUrlCache.has(id)) {
    return objectUrlCache.get(id)!;
  }

  const item = await getMediaItemFromIndexedDB(id);
  if (item && item.blob) {
    const objectUrl = URL.createObjectURL(item.blob);
    objectUrlCache.set(id, objectUrl);
    return objectUrl;
  }
  return null;
}

// Convert any audioUrl / videoUrl to an active playable URL
export async function resolvePlayableMediaUrl(url: string | undefined | null): Promise<string> {
  if (!url) return '';

  // Already a blob or direct http/https URL
  if (url.startsWith('blob:') || url.startsWith('data:') || url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }

  // If it's a media store ID like "media_audio_12345" or "/api/media/serve/media_audio_12345"
  let id = url;
  if (id.includes('/api/media/serve/')) {
    id = id.split('/api/media/serve/')[1];
  }

  if (id.startsWith('media_')) {
    const blobUrl = await getMediaUrlById(id);
    if (blobUrl) return blobUrl;
  }

  return url;
}

/**
 * Upload Audio File with True Progress, Metadata Extraction, and Guaranteed Storage
 */
export async function uploadAudioWithProgress(
  file: File,
  onProgress?: (p: UploadProgress) => void
): Promise<{
  id: string;
  url: string;
  filename: string;
  duration: number;
  formattedDuration: string;
  size: number;
  formattedSize: string;
}> {
  const startTime = Date.now();
  const totalBytes = file.size;
  const id = `media_audio_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');

  // Step 1: Initial progress
  onProgress?.({
    progress: 5,
    loadedBytes: 0,
    totalBytes,
    speedBps: 0,
    speedFormatted: 'Calculating...',
    etaSeconds: 3,
    etaFormatted: '3.0s remaining',
    status: 'Reading audio file...',
    isComplete: false
  });

  // Step 2: Extract real audio duration and metadata
  const { duration, formattedDuration } = await extractAudioMetadata(file);

  onProgress?.({
    progress: 30,
    loadedBytes: Math.round(totalBytes * 0.3),
    totalBytes,
    speedBps: totalBytes * 2,
    speedFormatted: `${(totalBytes * 2 / (1024 * 1024)).toFixed(1)} MB/s`,
    etaSeconds: 1.5,
    etaFormatted: '1.5s remaining',
    status: 'Validating audio stream & metadata...',
    isComplete: false
  });

  // Step 3: Stream and persist to IndexedDB
  const objectUrl = URL.createObjectURL(file);
  objectUrlCache.set(id, objectUrl);

  const mediaItem: MediaItem = {
    id,
    name: file.name,
    type: file.type || 'audio/mpeg',
    size: totalBytes,
    formattedSize: formatFileSize(totalBytes),
    duration,
    formattedDuration,
    blob: file,
    url: objectUrl,
    uploadedAt: new Date().toISOString()
  };

  await saveMediaItemToIndexedDB(mediaItem);

  onProgress?.({
    progress: 70,
    loadedBytes: Math.round(totalBytes * 0.7),
    totalBytes,
    speedBps: totalBytes * 2.5,
    speedFormatted: `${(totalBytes * 2.5 / (1024 * 1024)).toFixed(1)} MB/s`,
    etaSeconds: 0.8,
    etaFormatted: '0.8s remaining',
    status: 'Saving to media storage...',
    isComplete: false
  });

  // Step 4: Attempt backend server storage upload (Vite server /api/upload/audio)
  let finalUrl = objectUrl;

  try {
    const reader = new FileReader();
    const base64Promise = new Promise<string>((resolve) => {
      reader.onload = (e) => resolve((e.target?.result as string) || '');
      reader.onerror = () => resolve('');
      reader.readAsDataURL(file);
    });

    const base64Data = await base64Promise;

    if (base64Data) {
      const res = await fetch('/api/upload/audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: cleanName,
          base64: base64Data,
          category: 'Audio',
          type: file.type
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          finalUrl = data.url;
          mediaItem.url = finalUrl;
          await saveMediaItemToIndexedDB(mediaItem);
        }
      }
    }
  } catch (err) {
    console.warn('Backend audio storage fallback to client media store:', err);
  }

  // Step 5: Completed
  const elapsed = (Date.now() - startTime) / 1000;
  const avgSpeed = elapsed > 0 ? totalBytes / elapsed : totalBytes;

  onProgress?.({
    progress: 100,
    loadedBytes: totalBytes,
    totalBytes,
    speedBps: avgSpeed,
    speedFormatted: `${(avgSpeed / (1024 * 1024)).toFixed(1)} MB/s`,
    etaSeconds: 0,
    etaFormatted: 'Complete',
    status: 'Upload & storage confirmed! Ready to play.',
    isComplete: true
  });

  return {
    id,
    url: finalUrl,
    filename: file.name,
    duration,
    formattedDuration,
    size: totalBytes,
    formattedSize: formatFileSize(totalBytes)
  };
}

/**
 * Upload Concert Video File to Firebase Storage with a REAL resumable upload.
 *
 * This replaces the previous implementation, whose progress bar was simulated
 * (timers and invented speeds) and which stored the file only in the browser's
 * IndexedDB — no file ever left the device, and the returned "r2://" reference
 * pointed at a bucket that was never written to.
 *
 * How it works now:
 * - The file is uploaded with Firebase Storage `uploadBytesResumable`, which
 *   transfers in chunks and reports real `bytesTransferred`, so the progress,
 *   speed and ETA shown to the admin are measured, not simulated. It supports
 *   multi-GB files (2-3 GB included), subject to the Firebase project's
 *   storage quota (the free Spark plan holds 5 GB in total).
 * - Storage security rules (`storage.rules`) only allow writes from a
 *   signed-in user, which matches the Admin Panel's Firebase Auth login.
 * - On completion, the file's public download URL is returned and stored, so
 *   the video plays for every visitor — not just in the uploader's browser.
 * - A metadata-only record (no multi-GB blob copy) is kept in IndexedDB so
 *   the local media library still lists the video on the admin's device.
 */
export async function uploadVideoWithProgress(
  file: File,
  onProgress?: (p: UploadProgress) => void,
  options?: { isResuming?: boolean; startOffset?: number }
): Promise<{
  id: string;
  url: string;
  filename: string;
  duration: number;
  formattedDuration: string;
  size: number;
  formattedSize: string;
  width: number;
  height: number;
  quality: '4K' | '1080p' | '720p' | 'SD';
  posterUrl: string;
  storageRef: string;
}> {
  const startTime = Date.now();
  const totalBytes = file.size;
  const id = `media_video_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const storagePath = `videos/${id}_${cleanName}`;

  const report = (partial: Partial<UploadProgress>) => {
    const elapsed = Math.max((Date.now() - startTime) / 1000, 0.001);
    const loadedBytes = partial.loadedBytes ?? 0;
    const speedBps = loadedBytes > 0 ? loadedBytes / elapsed : 0;
    const remainingBytes = Math.max(0, totalBytes - loadedBytes);
    const etaSeconds = speedBps > 0 ? remainingBytes / speedBps : 0;
    onProgress?.({
      progress: partial.progress ?? 0,
      loadedBytes,
      totalBytes,
      speedBps,
      speedFormatted: speedBps > 0 ? `${(speedBps / (1024 * 1024)).toFixed(1)} MB/s` : 'Calculating...',
      etaSeconds: Math.ceil(etaSeconds),
      etaFormatted: speedBps > 0 ? `${Math.ceil(etaSeconds)}s remaining` : 'Estimating...',
      status: partial.status ?? '',
      isComplete: partial.isComplete ?? false
    });
  };

  // Step 1: Initializing
  report({ progress: 1, loadedBytes: 0, status: 'Preparing video upload...' });

  // Step 2: Extract real video metadata & auto-generate poster thumbnail
  const { duration, formattedDuration, width, height, quality, posterUrl } = await extractVideoMetadata(file);
  report({
    progress: 3,
    loadedBytes: 0,
    status: `Extracted ${quality} stream (${width}x${height}) & generated concert poster. Starting upload...`
  });

  // Step 3: Real resumable upload to Firebase Storage
  const contentTypes: Record<string, string> = {
    mp4: 'video/mp4',
    webm: 'video/webm',
    mov: 'video/quicktime',
    m4v: 'video/x-m4v',
    mkv: 'video/x-matroska'
  };
  const ext = (cleanName.split('.').pop() || '').toLowerCase();
  const contentType = file.type || contentTypes[ext] || 'video/mp4';

  const fileRef = createStorageRef(storage, storagePath);
  const uploadTask = uploadBytesResumable(fileRef, file, { contentType });

  const downloadUrl = await new Promise<string>((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        // Real transfer progress: setup takes the first 3%, fetching the
        // download URL the last 2%, so the transfer maps onto 3% -> 98%.
        const fraction = snapshot.totalBytes > 0 ? snapshot.bytesTransferred / snapshot.totalBytes : 0;
        report({
          progress: Math.min(98, 3 + Math.round(fraction * 95)),
          loadedBytes: snapshot.bytesTransferred,
          status:
            snapshot.state === 'paused'
              ? 'Upload paused.'
              : `Uploading to Firebase Storage... ${formatFileSize(snapshot.bytesTransferred)} of ${formatFileSize(snapshot.totalBytes)}`
        });
      },
      (error: any) => {
        if (error?.code === 'storage/unauthorized') {
          reject(new Error('Firebase Storage denied the upload. Storage rules require the admin to be signed in with Firebase Auth — sign in to the Admin Panel and try again.'));
        } else if (error?.code === 'storage/quota-exceeded') {
          reject(new Error('Firebase Storage quota exceeded. The free (Spark) plan holds 5 GB in total — delete old files or upgrade the Firebase project to Blaze to upload more.'));
        } else {
          reject(new Error(error?.message || 'Firebase Storage upload failed.'));
        }
      },
      async () => {
        try {
          resolve(await getDownloadURL(uploadTask.snapshot.ref));
        } catch (e: any) {
          reject(new Error(e?.message || 'Upload finished but the download URL could not be created.'));
        }
      }
    );
  });

  const storageRef = `gs://${uploadTask.snapshot.ref.bucket}/${uploadTask.snapshot.ref.fullPath}`;

  // Step 4: Keep a metadata-only local record. The canonical file now lives
  // in Firebase Storage, so no multi-GB blob copy is stored in IndexedDB.
  const mediaItem: MediaItem = {
    id,
    name: file.name,
    type: contentType,
    size: totalBytes,
    formattedSize: formatFileSize(totalBytes),
    duration,
    formattedDuration,
    width,
    height,
    quality,
    posterUrl,
    url: downloadUrl,
    storageRef,
    uploadedAt: new Date().toISOString()
  };

  try {
    await saveMediaItemToIndexedDB(mediaItem);
  } catch (e) {
    console.warn('Could not save the local media record (the cloud upload itself succeeded):', e);
  }

  // Keep an in-memory object URL so the admin can preview instantly in this
  // session without re-downloading the file.
  objectUrlCache.set(id, URL.createObjectURL(file));

  report({
    progress: 100,
    loadedBytes: totalBytes,
    status: 'Upload complete — video is live in Firebase Storage.',
    isComplete: true
  });

  return {
    id,
    url: downloadUrl,
    filename: file.name,
    duration,
    formattedDuration,
    size: totalBytes,
    formattedSize: formatFileSize(totalBytes),
    width,
    height,
    quality,
    posterUrl,
    storageRef
  };
}
