import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, collection, doc, onSnapshot, getDocs, 
  getDoc, setDoc, updateDoc, deleteDoc, query, increment
} from 'firebase/firestore';
import { Book, AuthorProfile, Transaction, BookFolder } from '../types/book';
import { INITIAL_BOOKS, DEFAULT_AUTHOR } from '../utils/storage';
import { compressImage } from '../utils/imageCompressor';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with specific database ID from config
export const db = getFirestore(
  app, 
  firebaseConfig.firestoreDatabaseId || '(default)'
);

export const isFirebaseActive = true;

/**
 * Deep-clean an object for Firestore to guarantee no undefined values or non-serializable objects
 */
function deepCleanForFirestore(obj: any): any {
  if (obj === undefined) return null;
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return obj.toISOString();
  if (Array.isArray(obj)) {
    return obj.map(deepCleanForFirestore);
  }

  const cleaned: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    // Exclude raw File / Blob instances
    if (key === 'uploadedFileBlob') continue;
    if (val !== undefined) {
      cleaned[key] = deepCleanForFirestore(val);
    }
  }
  return cleaned;
}

/**
 * Real-time subscription to books collection.
 * Syncs seamlessly across all connected devices and browsers.
 */
export function subscribeToBooks(
  onBooksChanged: (books: Book[]) => void,
  onError?: (err: Error) => void
): () => void {
  const booksCol = collection(db, 'books');

  const unsubscribe = onSnapshot(
    booksCol,
    async (snapshot) => {
      // Check if initialization has ever happened
      if (snapshot.empty) {
        try {
          const initDocRef = doc(db, 'settings', 'systemInit');
          const initDocSnap = await getDoc(initDocRef);

          if (!initDocSnap.exists()) {
            // First time ever: seed initial books
            console.log('Seeding initial Chilean catalog into Cloud Firestore...');
            for (const book of INITIAL_BOOKS) {
              await setDoc(doc(db, 'books', book.id), deepCleanForFirestore(book));
            }
            await setDoc(initDocRef, { initializedAt: new Date().toISOString(), version: '2.0' });
            onBooksChanged(INITIAL_BOOKS);
            return;
          } else {
            // Admin legitimately deleted all books
            onBooksChanged([]);
            return;
          }
        } catch (initErr) {
          console.warn('System initialization check error:', initErr);
          onBooksChanged([]);
          return;
        }
      }

      const booksList: Book[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Book;
        booksList.push({
          ...data,
          id: docSnap.id,
        });
      });

      // Sort with newest or pinned books first
      booksList.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

      onBooksChanged(booksList);
    },
    (error) => {
      console.warn('Firestore books listener error:', error);
      if (onError) onError(error);
    }
  );

  return unsubscribe;
}

/**
 * Real-time subscription to author profile & Chilean payment info
 */
export function subscribeToAuthor(
  onAuthorChanged: (author: AuthorProfile) => void,
  onError?: (err: Error) => void
): () => void {
  const authorDocRef = doc(db, 'settings', 'authorProfile');

  const unsubscribe = onSnapshot(
    authorDocRef,
    async (docSnap) => {
      if (!docSnap.exists()) {
        try {
          await setDoc(authorDocRef, deepCleanForFirestore(DEFAULT_AUTHOR));
        } catch (e) {
          console.warn('Could not seed author profile:', e);
        }
        onAuthorChanged(DEFAULT_AUTHOR);
        return;
      }

      const data = docSnap.data() as AuthorProfile;
      onAuthorChanged({
        ...DEFAULT_AUTHOR,
        ...data,
        paymentMethods: {
          ...DEFAULT_AUTHOR.paymentMethods,
          ...(data.paymentMethods || {}),
          chile: {
            ...DEFAULT_AUTHOR.paymentMethods.chile,
            ...(data.paymentMethods?.chile || {}),
          },
        },
      });
    },
    (error) => {
      console.warn('Firestore author listener error:', error);
      if (onError) onError(error);
    }
  );

  return unsubscribe;
}

/**
 * Save new or updated book to Cloud Firestore (Available to all users instantly)
 */
export async function saveBookToFirestore(book: Book): Promise<void> {
  // Compress cover image if it's a long base64 string
  let optimizedCoverUrl = book.coverUrl;
  if (optimizedCoverUrl && optimizedCoverUrl.startsWith('data:') && optimizedCoverUrl.length > 80000) {
    try {
      optimizedCoverUrl = await compressImage(optimizedCoverUrl, {
        maxWidth: 500,
        maxHeight: 750,
        quality: 0.82,
      });
    } catch (e) {
      console.warn('Cover compression fallback:', e);
    }
  }

  const bookToSave: Book = {
    ...book,
    coverUrl: optimizedCoverUrl,
  };

  const cleanData = deepCleanForFirestore(bookToSave);
  const bookRef = doc(db, 'books', book.id);
  await setDoc(bookRef, cleanData, { merge: true });
}

/**
 * Delete book permanently from Cloud Firestore (Admin Only)
 */
export async function deleteBookFromFirestore(bookId: string): Promise<void> {
  const bookRef = doc(db, 'books', bookId);
  await deleteDoc(bookRef);
}

/**
 * Delete all demo books from Firestore in one go (Leaves only author's real books)
 */
export async function deleteAllDemoBooksFromFirestore(): Promise<void> {
  const demoIds = ['book-1', 'book-2', 'book-3', 'book-4'];
  for (const id of demoIds) {
    try {
      await deleteDoc(doc(db, 'books', id));
    } catch (e) {
      console.warn('Error deleting demo book:', id, e);
    }
  }
}

/**
 * Clean duplicate books in Cloud Firestore:
 * If multiple books share the exact same normalized title, keeps the one with the uploaded file
 * (or the most recent) and deletes the redundant duplicates from Firestore.
 */
export async function cleanDuplicateBooksInFirestore(): Promise<number> {
  try {
    const booksCol = collection(db, 'books');
    const snapshot = await getDocs(booksCol);
    const seenTitles = new Map<string, { id: string; hasFile: boolean; createdAt: string }>();
    let deletedCount = 0;

    for (const docSnap of snapshot.docs) {
      const data = docSnap.data() as Book;
      const rawTitle = (data.title || '').trim().toLowerCase();
      const normTitle = rawTitle.replace(/[^a-záéíóúñ0-9]/g, '');
      if (!normTitle) continue;

      const hasFile = Boolean(data.downloadUrl);
      const createdAt = data.createdAt || '';

      if (seenTitles.has(normTitle)) {
        const existing = seenTitles.get(normTitle)!;
        if (hasFile && !existing.hasFile) {
          // Current has a file, existing doesn't: delete existing
          await deleteDoc(doc(db, 'books', existing.id));
          seenTitles.set(normTitle, { id: docSnap.id, hasFile, createdAt });
          deletedCount++;
        } else {
          // Delete current duplicate
          await deleteDoc(doc(db, 'books', docSnap.id));
          deletedCount++;
        }
      } else {
        seenTitles.set(normTitle, { id: docSnap.id, hasFile, createdAt });
      }
    }

    return deletedCount;
  } catch (err) {
    console.warn('Error cleaning duplicates in Firestore:', err);
    return 0;
  }
}

/**
 * Update book's attached downloadable file in Cloud Firestore
 */
export async function updateBookFileInFirestore(
  bookId: string,
  fileInfo: { downloadUrl: string; fileName: string; fileSize: string; fileType: string }
): Promise<void> {
  const bookRef = doc(db, 'books', bookId);
  await updateDoc(bookRef, {
    downloadUrl: fileInfo.downloadUrl,
    fileName: fileInfo.fileName,
    fileSize: fileInfo.fileSize,
    fileType: fileInfo.fileType,
  });
}

/**
 * Toggle book liberation status in Cloud Firestore (1-Click Liberation)
 */
export async function toggleLiberationInFirestore(
  bookId: string,
  newLiberatedState: boolean,
  liberatedNote?: string
): Promise<void> {
  const bookRef = doc(db, 'books', bookId);
  await updateDoc(bookRef, {
    isLiberated: newLiberatedState,
    liberatedAt: newLiberatedState ? new Date().toISOString() : null,
    liberatedNote: newLiberatedState ? (liberatedNote || '¡Obra liberada gratuitamente por el autor para Chile!') : null,
  });
}

/**
 * Increment download count in Cloud Firestore
 */
export async function incrementDownloadInFirestore(bookId: string): Promise<void> {
  try {
    const bookRef = doc(db, 'books', bookId);
    await updateDoc(bookRef, {
      downloadCount: increment(1),
    });
  } catch (err) {
    console.warn('Could not increment download count in Firestore:', err);
  }
}

/**
 * Save author profile to Cloud Firestore with automatic compression of avatar photo
 */
export async function saveAuthorToFirestore(profile: AuthorProfile): Promise<void> {
  let optimizedAvatarUrl = profile.avatarUrl;
  
  // If avatar is base64 and larger than 50KB, compress to max 360x360
  if (optimizedAvatarUrl && optimizedAvatarUrl.startsWith('data:') && optimizedAvatarUrl.length > 50000) {
    try {
      optimizedAvatarUrl = await compressImage(optimizedAvatarUrl, {
        maxWidth: 360,
        maxHeight: 360,
        quality: 0.82,
      });
    } catch (e) {
      console.warn('Avatar compression fallback:', e);
    }
  }

  const cleanAuthor = deepCleanForFirestore({
    ...profile,
    avatarUrl: optimizedAvatarUrl,
  });

  const authorDocRef = doc(db, 'settings', 'authorProfile');
  await setDoc(authorDocRef, cleanAuthor, { merge: true });
}

/**
 * Record a transaction in Cloud Firestore
 */
export async function recordTransactionInFirestore(tx: Transaction): Promise<void> {
  try {
    const txRef = doc(db, 'transactions', tx.id);
    await setDoc(txRef, deepCleanForFirestore(tx));
  } catch (err) {
    console.warn('Could not record transaction in Firestore:', err);
  }
}

/**
 * Real-time subscription to folders collection
 */
export function subscribeToFolders(
  onFoldersChanged: (folders: BookFolder[]) => void,
  onError?: (err: Error) => void
): () => void {
  const foldersCol = collection(db, 'folders');

  const unsubscribe = onSnapshot(
    foldersCol,
    (snapshot) => {
      const foldersList: BookFolder[] = [];
      snapshot.forEach((docSnap) => {
        foldersList.push({
          ...(docSnap.data() as BookFolder),
          id: docSnap.id,
        });
      });
      foldersList.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      onFoldersChanged(foldersList);
    },
    (error) => {
      console.warn('Firestore folders listener error:', error);
      if (onError) onError(error);
    }
  );

  return unsubscribe;
}

/**
 * Save or update a folder in Cloud Firestore
 */
export async function saveFolderToFirestore(folder: BookFolder): Promise<void> {
  const folderRef = doc(db, 'folders', folder.id);
  await setDoc(folderRef, deepCleanForFirestore(folder), { merge: true });
}

/**
 * Delete a folder from Cloud Firestore
 */
export async function deleteFolderFromFirestore(folderId: string): Promise<void> {
  await deleteDoc(doc(db, 'folders', folderId));
}

/**
 * Update any book details in Cloud Firestore (prices in CLP/USD, liberation, folder assignment, etc.)
 */
export async function updateBookDetailsInFirestore(
  bookId: string,
  updates: Partial<Book>
): Promise<void> {
  const bookRef = doc(db, 'books', bookId);
  await updateDoc(bookRef, deepCleanForFirestore(updates));
}
