/**
 * Persistent client-side IndexedDB storage for book binary files (PDF, EPUB, etc.)
 * Ensures author-uploaded book files are never lost even if the backend container restarts.
 */

const DB_NAME = 'librolibre_storage_v1';
const STORE_NAME = 'book_files';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Stores a book file (Blob, File, or base64) in IndexedDB
 */
export async function saveBookFileToCache(
  key: string,
  file: Blob | File | string,
  fileName?: string
): Promise<void> {
  try {
    const db = await openDB();
    let blobToStore: Blob;

    if (file instanceof Blob) {
      blobToStore = file;
    } else if (typeof file === 'string' && file.startsWith('data:')) {
      const res = await fetch(file);
      blobToStore = await res.blob();
    } else {
      blobToStore = new Blob([file], { type: 'application/octet-stream' });
    }

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put({
        blob: blobToStore,
        fileName: fileName || 'libro.pdf',
        savedAt: new Date().toISOString(),
      }, key);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to save book file to IndexedDB cache:', err);
  }
}

/**
 * Retrieves a book file from IndexedDB
 */
export async function getBookFileFromCache(
  key: string
): Promise<{ blob: Blob; fileName: string } | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);

      req.onsuccess = () => {
        if (req.result && req.result.blob) {
          resolve({
            blob: req.result.blob,
            fileName: req.result.fileName || 'libro.pdf',
          });
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn('Error reading book file from IndexedDB cache:', err);
    return null;
  }
}
