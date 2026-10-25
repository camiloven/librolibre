import React, { useState, useEffect, useMemo } from 'react';
import { Book, AuthorProfile, Coupon, Transaction, BookFolder, formatCurrency } from './types/book';
import { 
  loadBooks, saveBooks, loadAuthorProfile, saveAuthorProfile,
  loadCoupons, saveCoupons, loadTransactions, loadFolders, saveFolders, INITIAL_BOOKS,
  isAdminAuthenticated, setAdminAuthenticated,
  fetchBooksFromServer, saveBookToServer, deleteBookFromServer,
  toggleLiberateBookOnServer, incrementDownloadOnServer,
  fetchAuthorFromServer, saveAuthorToServer
} from './utils/storage';
import {
  subscribeToBooks,
  subscribeToAuthor,
  subscribeToFolders,
  saveBookToFirestore,
  deleteBookFromFirestore,
  deleteAllDemoBooksFromFirestore,
  cleanDuplicateBooksInFirestore,
  updateBookFileInFirestore,
  updateBookDetailsInFirestore,
  saveFolderToFirestore,
  deleteFolderFromFirestore,
  toggleLiberationInFirestore,
  incrementDownloadInFirestore,
  saveAuthorToFirestore
} from './services/firebase';
import { Header } from './components/Header';
import { HeroBanner } from './components/HeroBanner';
import { BookCard } from './components/BookCard';
import { BookDetailsModal } from './components/BookDetailsModal';
import { BookReaderModal } from './components/BookReaderModal';
import { CheckoutModal } from './components/CheckoutModal';
import { AuthorStudio } from './components/AuthorStudio';
import { UploadBookModal } from './components/UploadBookModal';
import { PaymentSettingsModal } from './components/PaymentSettingsModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { DeleteBookConfirmModal } from './components/DeleteBookConfirmModal';
import { EditAuthorProfileModal } from './components/EditAuthorProfileModal';
import { BookshelfView } from './components/BookshelfView';
import { 
  Sparkles, BookOpen, ShieldCheck, Heart, ArrowRight, 
  HelpCircle, CheckCircle, Feather, Download, Building2, Smartphone, CreditCard, Lock, Camera, Upload,
  LayoutGrid, Columns, Library, Folder
} from 'lucide-react';

export default function App() {
  // State
  const [books, setBooks] = useState<Book[]>(() => loadBooks());
  const [authorProfile, setAuthorProfile] = useState<AuthorProfile>(() => loadAuthorProfile());
  const [coupons, setCoupons] = useState<Coupon[]>(() => loadCoupons());
  const [transactions, setTransactions] = useState<Transaction[]>(() => loadTransactions());
  const [folders, setFolders] = useState<BookFolder[]>(() => loadFolders());

  // Administrator Mode State
  const [isAdmin, setIsAdmin] = useState<boolean>(() => isAdminAuthenticated());
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [bookPendingDelete, setBookPendingDelete] = useState<Book | null>(null);

  // Views & Modals
  const [currentView, setCurrentView] = useState<'catalog' | 'author'>('catalog');
  const [selectedBookForDetails, setSelectedBookForDetails] = useState<Book | null>(null);
  const [selectedBookForReader, setSelectedBookForReader] = useState<Book | null>(null);
  const [selectedBookForCheckout, setSelectedBookForCheckout] = useState<Book | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isPaymentSettingsOpen, setIsPaymentSettingsOpen] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGenre, setSelectedGenre] = useState('ALL');
  const [selectedFolderId, setSelectedFolderId] = useState<string>('ALL');
  const [catalogGridMode, setCatalogGridMode] = useState<'bookshelf' | 'grid4' | 'comfort'>('bookshelf');

  // Floating Toast Notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Helper to deduplicate books in memory by ID and normalized title
  const deduplicateBookList = (bookList: Book[]): Book[] => {
    const seenIds = new Set<string>();
    const seenTitles = new Map<string, Book>();
    const unique: Book[] = [];

    for (const b of bookList) {
      if (!b || !b.id || seenIds.has(b.id)) continue;

      const normTitle = (b.title || '')
        .trim()
        .toLowerCase()
        .replace(/[^a-záéíóúñ0-9]/g, '');

      if (!normTitle) {
        seenIds.add(b.id);
        unique.push(b);
        continue;
      }

      if (seenTitles.has(normTitle)) {
        const existing = seenTitles.get(normTitle)!;
        // Prefer the version that has a real downloadUrl or uploaded file
        if (!existing.downloadUrl && b.downloadUrl) {
          const idx = unique.findIndex((item) => item.id === existing.id);
          if (idx !== -1) {
            unique[idx] = b;
            seenIds.delete(existing.id);
            seenIds.add(b.id);
            seenTitles.set(normTitle, b);
          }
        }
        continue;
      }

      seenIds.add(b.id);
      seenTitles.set(normTitle, b);
      unique.push(b);
    }

    return unique;
  };

  // REAL-TIME FIRESTORE SYNCHRONIZATION
  // Connects dev app, shared preview URL, and any device in real-time!
  useEffect(() => {
    // 1. Subscribe to Cloud Firestore books collection (Real-time updates)
    const unsubBooks = subscribeToBooks((cloudBooks) => {
      if (Array.isArray(cloudBooks)) {
        const cleanBooks = deduplicateBookList(cloudBooks);
        setBooks(cleanBooks);
        saveBooks(cleanBooks);
      }
    });

    // 2. Subscribe to Cloud Firestore author settings
    const unsubAuthor = subscribeToAuthor((cloudAuthor) => {
      if (cloudAuthor) {
        setAuthorProfile(cloudAuthor);
        saveAuthorProfile(cloudAuthor);
      }
    });

    // 3. Subscribe to Cloud Firestore thematic folders
    const unsubFolders = subscribeToFolders((cloudFolders) => {
      if (Array.isArray(cloudFolders) && cloudFolders.length > 0) {
        setFolders(cloudFolders);
        saveFolders(cloudFolders);
      }
    });

    // Fallback: server disk check
    fetchBooksFromServer().then((srvBooks) => {
      if (srvBooks && srvBooks.length > 0) {
        setBooks((current) => {
          const combined = current.length > 0 ? current : srvBooks;
          return deduplicateBookList(combined);
        });
      }
    });

    return () => {
      unsubBooks();
      unsubAuthor();
      unsubFolders();
    };
  }, []);

  // Sync books with local storage cache whenever modified
  useEffect(() => {
    saveBooks(books);
  }, [books]);

  // Sync folders with local storage cache
  useEffect(() => {
    saveFolders(folders);
  }, [folders]);

  // Sync author profile with local cache
  useEffect(() => {
    saveAuthorProfile(authorProfile);
  }, [authorProfile]);

  // Sync coupons
  useEffect(() => {
    saveCoupons(coupons);
  }, [coupons]);

  // Handle Admin Login Success
  const handleAdminLoginSuccess = () => {
    setIsAdmin(true);
    setAdminAuthenticated(true);
    setCurrentView('author');
  };

  // Handle Admin Logout
  const handleAdminLogout = () => {
    setIsAdmin(false);
    setAdminAuthenticated(false);
    setCurrentView('catalog');
  };

  // Genres list derived from current books
  const genres = useMemo(() => {
    const list = Array.from(new Set(books.map((b) => b.genre)));
    return list;
  }, [books]);

  // Liberated books
  const liberatedBooks = useMemo(() => {
    return books.filter((b) => b.isLiberated);
  }, [books]);

  // Total downloads
  const totalDownloads = useMemo(() => {
    return books.reduce((acc, b) => acc + (b.downloadCount || 0), 0);
  }, [books]);

  // Filtered books for catalog view
  const filteredCatalogBooks = useMemo(() => {
    return books.filter((b) => {
      const matchesSearch =
        !searchQuery ||
        b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.synopsis.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.folderName && b.folderName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        b.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      if (selectedFolderId !== 'ALL' && b.folderId !== selectedFolderId) return false;

      if (selectedGenre === 'ALL') return true;
      if (selectedGenre === 'LIBERATED') return b.isLiberated || b.pricingType === 'free';
      return b.genre === selectedGenre;
    });
  }, [books, searchQuery, selectedGenre, selectedFolderId]);

  // Prevents repeating books: if a book is already featured in the top spotlight, exclude it from the grid below
  const isSpotlightActive = liberatedBooks.length > 0 && selectedGenre !== 'LIBERATED' && !searchQuery;
  const spotlightIds = useMemo(() => new Set(liberatedBooks.slice(0, 4).map((b) => b.id)), [liberatedBooks]);

  const catalogDisplayBooks = useMemo(() => {
    if (isSpotlightActive && selectedGenre === 'ALL') {
      return filteredCatalogBooks.filter((b) => !spotlightIds.has(b.id));
    }
    return filteredCatalogBooks;
  }, [filteredCatalogBooks, isSpotlightActive, selectedGenre, spotlightIds]);

  // CORE FEATURE: Toggle Liberation Status for a Book (One-click)
  const handleToggleLiberate = async (bookId: string) => {
    if (!isAdmin) {
      setIsAdminLoginOpen(true);
      return;
    }

    const currentBook = books.find((b) => b.id === bookId);
    const nextState = currentBook ? !currentBook.isLiberated : true;
    const note = nextState
      ? '¡Obra liberada gratuitamente por el autor para toda la comunidad lectora en Chile!'
      : undefined;

    setBooks((prevBooks) => {
      const updated = prevBooks.map((book) => {
        if (book.id === bookId) {
          return {
            ...book,
            isLiberated: nextState,
            liberatedAt: nextState ? new Date().toISOString() : undefined,
            liberatedNote: note,
          };
        }
        return book;
      });
      return updated;
    });

    if (selectedBookForDetails?.id === bookId) {
      setSelectedBookForDetails((prev) =>
        prev
          ? {
              ...prev,
              isLiberated: nextState,
              liberatedNote: note,
            }
          : null
      );
    }

    // Real-time Cloud Firestore update (syncs to all devices immediately)
    try {
      await toggleLiberationInFirestore(bookId, nextState, note);
      showToast(nextState ? '¡Obra liberada gratuitamente para toda la comunidad lectora!' : 'Libro configurado nuevamente como de pago.');
    } catch (e: any) {
      showToast('Error al actualizar estado en Firestore: ' + (e?.message || ''), 'error');
    }
    // Server disk backup
    toggleLiberateBookOnServer(bookId).catch(() => {});
  };

  // Add new book (Admin only) - PERSISTS PERMANENTLY IN CLOUD FIRESTORE
  const handleSaveBook = async (newBook: Book) => {
    // Immediate optimistic UI update
    setBooks((prev) => [newBook, ...prev.filter((b) => b.id !== newBook.id)]);
    
    // 1. Real-time Cloud Firestore save (All other people see this book instantly!)
    try {
      await saveBookToFirestore(newBook);
      showToast(`¡Libro "${newBook.title}" guardado y publicado en la nube!`);
    } catch (fsErr: any) {
      console.warn('Firestore book save error, using server fallback:', fsErr);
      showToast('Error al guardar en Cloud Firestore: ' + (fsErr?.message || ''), 'error');
    }

    // 2. Secondary server disk backup
    saveBookToServer(newBook).then((saved) => {
      if (saved) {
        setBooks((prev) => prev.map((b) => (b.id === newBook.id ? saved : b)));
      }
    }).catch(() => {});
  };

  // Request Delete Book (Opens Admin PIN Modal)
  const handleRequestDeleteBook = (book: Book) => {
    if (!isAdmin) {
      setIsAdminLoginOpen(true);
      return;
    }
    setBookPendingDelete(book);
  };

  // Confirm Delete Book (Executes permanent delete in Cloud Firestore after PIN verification)
  const handleConfirmDeleteBook = async (bookId: string) => {
    setBooks((prev) => prev.filter((b) => b.id !== bookId));
    setBookPendingDelete(null);

    // Delete from Cloud Firestore
    try {
      await deleteBookFromFirestore(bookId);
      showToast('Libro eliminado permanentemente de la plataforma.');
    } catch (fsErr: any) {
      console.warn('Firestore book delete error:', fsErr);
      showToast('Error al eliminar de Firestore: ' + (fsErr?.message || ''), 'error');
    }

    // Delete from server disk backup
    deleteBookFromServer(bookId).catch(() => {});
  };

  // Delete all demo books in one click (leaves only the author's real books)
  const handleDeleteAllDemoBooks = async () => {
    if (!isAdmin) {
      setIsAdminLoginOpen(true);
      return;
    }
    const demoIds = ['book-1', 'book-2', 'book-3', 'book-4'];
    setBooks((prev) => prev.filter((b) => !demoIds.includes(b.id)));

    try {
      await deleteAllDemoBooksFromFirestore();
      showToast('Libros de demostración eliminados. Ahora solo se muestran tus libros.');
    } catch (e: any) {
      console.warn('Error deleting demo books from Firestore:', e);
      showToast('Error al limpiar libros demo: ' + (e?.message || ''), 'error');
    }
  };

  // Clean duplicate books in Cloud Firestore
  const handleCleanDuplicates = async () => {
    if (!isAdmin) {
      setIsAdminLoginOpen(true);
      return;
    }
    try {
      const count = await cleanDuplicateBooksInFirestore();
      setBooks((prev) => deduplicateBookList(prev));
      if (count > 0) {
        showToast(`¡Se eliminaron ${count} libros duplicados de la base de datos!`);
      } else {
        showToast('No se encontraron libros duplicados en la base de datos.');
      }
    } catch (e: any) {
      console.warn('Error cleaning duplicates:', e);
      showToast('Error al limpiar duplicados: ' + (e?.message || ''), 'error');
    }
  };

  // Increment download count after successful checkout/download
  const handleDownloadCompleted = (bookId: string) => {
    setBooks((prev) =>
      prev.map((b) => (b.id === bookId ? { ...b, downloadCount: (b.downloadCount || 0) + 1 } : b))
    );
    setTransactions(loadTransactions());
    incrementDownloadInFirestore(bookId);
    incrementDownloadOnServer(bookId);
  };

  // Author profile persistence (BancoEstado, Mercado Pago, Photo) in Cloud Firestore
  const handleSaveAuthorProfile = async (updatedProfile: AuthorProfile) => {
    setAuthorProfile(updatedProfile);
    try {
      await saveAuthorToFirestore(updatedProfile);
      showToast('¡Foto de perfil y datos actualizados en Cloud Firestore!');
    } catch (e: any) {
      console.warn('Could not save profile to Firestore:', e);
      showToast('Error al guardar foto en Firestore: ' + (e?.message || ''), 'error');
    }
    saveAuthorToServer(updatedProfile).catch(() => {});
  };

  // Update book original downloadable file (PDF / EPUB) in Cloud Firestore
  const handleUpdateBookFile = async (
    bookId: string,
    fileInfo: { downloadUrl: string; fileName: string; fileSize: string; fileType: string }
  ) => {
    const validFileType: Book['fileType'] = (['PDF', 'EPUB', 'MOBI', 'TXT', 'DOCX'].includes(fileInfo.fileType.toUpperCase())
      ? fileInfo.fileType.toUpperCase()
      : 'PDF') as Book['fileType'];

    setBooks((prev) =>
      prev.map((b) => (b.id === bookId ? { ...b, ...fileInfo, fileType: validFileType } : b))
    );
    try {
      await updateBookFileInFirestore(bookId, { ...fileInfo, fileType: validFileType });
      showToast(`¡Archivo para "${fileInfo.fileName}" vinculado en la nube con éxito!`);
    } catch (e: any) {
      console.warn('Error updating book file in Firestore:', e);
      showToast('Error al vincular archivo en Firestore: ' + (e?.message || ''), 'error');
    }
  };

  // Edit book details (price in CLP/USD, liberation toggle, folder assignment)
  const handleSaveBookEdit = async (updatedBook: Book) => {
    setBooks((prev) => prev.map((b) => (b.id === updatedBook.id ? updatedBook : b)));
    try {
      await saveBookToFirestore(updatedBook);
      showToast(`¡Libro "${updatedBook.title}" actualizado con éxito!`);
    } catch (err: any) {
      console.warn('Error saving book edit to Firestore:', err);
      showToast('Error al actualizar libro en Firestore: ' + (err?.message || ''), 'error');
    }
  };

  // Save / Update Folder (Admin only)
  const handleSaveFolder = async (folder: BookFolder) => {
    setFolders((prev) => {
      const exists = prev.some((f) => f.id === folder.id);
      const updated = exists ? prev.map((f) => (f.id === folder.id ? folder : f)) : [...prev, folder];
      saveFolders(updated);
      return updated;
    });
    try {
      await saveFolderToFirestore(folder);
      showToast(`Carpeta "${folder.name}" guardada en la nube.`);
    } catch (err: any) {
      console.warn('Error saving folder to Firestore:', err);
      showToast('Error al guardar carpeta en Firestore: ' + (err?.message || ''), 'error');
    }
  };

  // Delete Folder (Admin only)
  const handleDeleteFolder = async (folderId: string) => {
    setFolders((prev) => {
      const updated = prev.filter((f) => f.id !== folderId);
      saveFolders(updated);
      return updated;
    });
    setBooks((prev) =>
      prev.map((b) => (b.folderId === folderId ? { ...b, folderId: undefined, folderName: undefined } : b))
    );
    try {
      await deleteFolderFromFirestore(folderId);
      showToast('Carpeta eliminada.');
    } catch (err: any) {
      console.warn('Error deleting folder from Firestore:', err);
      showToast('Error al eliminar carpeta: ' + (err?.message || ''), 'error');
    }
  };

  // Move book to a folder
  const handleMoveBookToFolder = async (
    bookId: string,
    folderId: string | undefined,
    folderName: string | undefined
  ) => {
    setBooks((prev) =>
      prev.map((b) => (b.id === bookId ? { ...b, folderId, folderName } : b))
    );
    try {
      await updateBookDetailsInFirestore(bookId, {
        folderId: folderId || undefined,
        folderName: folderName || undefined,
      });
      showToast('Asignación de carpeta actualizada.');
    } catch (err: any) {
      console.warn('Error moving book in Firestore:', err);
      showToast('Error al mover libro: ' + (err?.message || ''), 'error');
    }
  };

  // Add Coupon
  const handleAddCoupon = (newCoupon: Coupon) => {
    setCoupons((prev) => [newCoupon, ...prev]);
  };

  // Delete Coupon
  const handleDeleteCoupon = (couponId: string) => {
    setCoupons((prev) => prev.filter((c) => c.id !== couponId));
  };

  // Reset to initial demo catalog
  const handleResetCatalog = () => {
    setBooks(INITIAL_BOOKS);
    saveBooks(INITIAL_BOOKS);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-amber-500/30 selection:text-amber-200">
      {/* Top Bar with Admin Mode controls */}
      <Header
        currentView={currentView}
        onViewChange={(view) => {
          if (view === 'author' && !isAdmin) {
            setIsAdminLoginOpen(true);
          } else {
            setCurrentView(view);
          }
        }}
        onOpenUpload={() => {
          if (!isAdmin) {
            setIsAdminLoginOpen(true);
          } else {
            setIsUploadModalOpen(true);
          }
        }}
        onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
        isAdmin={isAdmin}
        onLogoutAdmin={handleAdminLogout}
        liberatedCount={liberatedBooks.length}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {currentView === 'author' && isAdmin ? (
          /* AUTHOR / ADMIN STUDIO VIEW */
          <AuthorStudio
            books={books}
            authorProfile={authorProfile}
            coupons={coupons}
            transactions={transactions}
            folders={folders}
            onOpenUpload={() => setIsUploadModalOpen(true)}
            onOpenPaymentSettings={() => setIsPaymentSettingsOpen(true)}
            onOpenEditProfile={() => setIsEditProfileOpen(true)}
            onToggleLiberate={handleToggleLiberate}
            onRequestDeleteBook={handleRequestDeleteBook}
            onAddCoupon={handleAddCoupon}
            onDeleteCoupon={handleDeleteCoupon}
            onResetCatalog={handleResetCatalog}
            onLogoutAdmin={handleAdminLogout}
            onDeleteAllDemoBooks={handleDeleteAllDemoBooks}
            onCleanDuplicates={handleCleanDuplicates}
            onUpdateBookFile={handleUpdateBookFile}
            onSaveBookEdit={handleSaveBookEdit}
            onSaveFolder={handleSaveFolder}
            onDeleteFolder={handleDeleteFolder}
            onMoveBookToFolder={handleMoveBookToFolder}
          />
        ) : (
          /* READER / PUBLIC STOREFRONT VIEW */
          <div className="space-y-16 pb-20">
            {/* Hero Banner with Search & Filters */}
            <HeroBanner
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              selectedGenre={selectedGenre}
              onGenreChange={setSelectedGenre}
              genres={genres}
              totalBooks={books.length}
              liberatedBooks={liberatedBooks.length}
              totalDownloads={totalDownloads}
              folders={folders}
              selectedFolderId={selectedFolderId}
              onFolderChange={setSelectedFolderId}
            />

            {/* LIBERATED BOOKS SPOTLIGHT SECTION */}
            {liberatedBooks.length > 0 && selectedGenre !== 'LIBERATED' && selectedFolderId === 'ALL' && !searchQuery && (
              <section id="liberated-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-emerald-950/30 via-slate-900 to-slate-950 border border-emerald-900/40 relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                      <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-1">
                        <Sparkles className="w-4 h-4" />
                        <span>Obras Liberadas por el Autor · Chile</span>
                      </div>
                      <h2 className="text-xl sm:text-2xl font-serif font-bold text-white">
                        Descarga libre para toda la comunidad lectora
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
                        Títulos puestos a disposición gratuita en formato PDF y EPUB. Disfrútalos en tu computador o teléfono sin costo.
                      </p>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedGenre('LIBERATED');
                        setSelectedFolderId('ALL');
                      }}
                      className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer whitespace-nowrap self-start sm:self-center"
                    >
                      <span>Ver todas las obras libres</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                    {liberatedBooks.slice(0, 4).map((book) => (
                      <BookCard
                        key={book.id}
                        book={book}
                        onSelect={setSelectedBookForDetails}
                        onPreview={setSelectedBookForReader}
                        onDownload={setSelectedBookForCheckout}
                        compact={true}
                      />
                    ))}
                  </div>
                </div>
              </section>
            )}

            {/* MAIN CATALOG GRID */}
            {(!isSpotlightActive || catalogDisplayBooks.length > 0 || searchQuery || selectedGenre !== 'ALL' || selectedFolderId !== 'ALL') && (
              <section id="catalog-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-xl sm:text-2xl lg:text-3xl font-serif font-bold text-white">
                      {selectedFolderId !== 'ALL'
                        ? `Temática: ${folders.find((f) => f.id === selectedFolderId)?.name || 'Carpeta'}`
                        : selectedGenre === 'ALL' && isSpotlightActive
                        ? 'Más Obras del Catálogo'
                        : selectedGenre === 'ALL'
                        ? 'Catálogo Disponible en Chile'
                        : selectedGenre === 'LIBERATED'
                        ? 'Libros Liberados & Sin Costo'
                        : `Categoría: ${selectedGenre}`}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-400 mt-1">
                      Precios expresados en Pesos Chilenos (CLP) y Dólares (USD) · Libros custodiados por el autor
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    {(selectedGenre !== 'ALL' || selectedFolderId !== 'ALL' || searchQuery) && (
                      <button
                        onClick={() => {
                          setSelectedGenre('ALL');
                          setSelectedFolderId('ALL');
                          setSearchQuery('');
                        }}
                        className="text-xs font-medium text-amber-400 hover:text-amber-300 cursor-pointer"
                      >
                        Restablecer filtros
                      </button>
                    )}

                    {/* View Mode Switcher: Estantería (Moon+ Reader style) / Cuadrícula 4 / Amplia */}
                    <div className="flex items-center gap-1 p-0.5 bg-slate-900 border border-slate-800 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setCatalogGridMode('bookshelf')}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors ${
                          catalogGridMode === 'bookshelf'
                            ? 'bg-amber-400 text-slate-950 font-semibold shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                        title="Ver en estantería de madera clásica (estilo lector digital)"
                      >
                        <Library className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Estantería</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCatalogGridMode('grid4')}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors ${
                          catalogGridMode === 'grid4'
                            ? 'bg-amber-400 text-slate-950 font-semibold shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                        title="Ver en cuadrículas pequeñas de 4"
                      >
                        <LayoutGrid className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Cuadrícula 4</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCatalogGridMode('comfort')}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors ${
                          catalogGridMode === 'comfort'
                            ? 'bg-amber-400 text-slate-950 font-semibold shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                        title="Ver en cuadrícula amplia"
                      >
                        <Columns className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Amplia</span>
                      </button>
                    </div>
                  </div>
                </div>

                {catalogDisplayBooks.length === 0 ? (
                  <div className="text-center py-16 px-4 bg-slate-900/50 rounded-2xl border border-slate-800">
                    <BookOpen className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                    <h3 className="text-base font-serif font-bold text-slate-200">
                      No se encontraron libros con los criterios seleccionados
                    </h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      Prueba buscando por otra temática o restablece la búsqueda.
                    </p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSelectedGenre('ALL');
                      }}
                      className="mt-4 px-4 py-2 text-xs font-semibold bg-amber-400 text-slate-950 rounded-lg cursor-pointer"
                    >
                      Ver todos los libros
                    </button>
                  </div>
                ) : catalogGridMode === 'bookshelf' ? (
                  /* ESTANTERÍA DE MADERA CLÁSICA (Moon+ Reader style) */
                  <BookshelfView
                    books={catalogDisplayBooks}
                    onSelectBook={setSelectedBookForDetails}
                    onPreviewBook={setSelectedBookForReader}
                    onDownloadBook={setSelectedBookForCheckout}
                  />
                ) : (
                  <div className={
                    catalogGridMode === 'grid4'
                      ? 'grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4'
                      : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
                  }>
                    {catalogDisplayBooks.map((book) => (
                      <BookCard
                        key={book.id}
                        book={book}
                        onSelect={setSelectedBookForDetails}
                        onPreview={setSelectedBookForReader}
                      onDownload={setSelectedBookForCheckout}
                      compact={catalogGridMode === 'grid4'}
                    />
                  ))}
                </div>
              )}
            </section>
          )}

            {/* CHILEAN PAYMENTS SHOWCASE SECTION */}
            <section id="chile-payments" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="p-8 sm:p-10 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="text-center max-w-2xl mx-auto mb-8">
                  <span className="text-xs uppercase tracking-widest text-amber-400 font-mono font-semibold">
                    Medios Locales de Pago en Chile
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white mt-1">
                    Paga en Pesos Chilenos de forma directa
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-400 mt-2">
                    Sin comisiones abusivas ni tarifas internacionales. Apoya al autor con los métodos que ya usas en Chile.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* BancoEstado / CuentaRUT */}
                  <div className="p-6 rounded-xl bg-slate-950 border border-amber-500/30">
                    <div className="w-10 h-10 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-4">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <h3 className="font-serif font-bold text-base text-white mb-1">
                      BancoEstado & CuentaRUT
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed mb-3">
                      Transfiere fácilmente desde tu aplicación BancoEstado con el RUT del autor ({authorProfile.paymentMethods.chile.bancoEstado.rut}).
                    </p>
                    <span className="text-[11px] font-mono text-emerald-400 font-medium">✓ Validación y descarga instantánea</span>
                  </div>

                  {/* Mercado Pago Chile */}
                  <div className="p-6 rounded-xl bg-slate-950 border border-cyan-500/30">
                    <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mb-4">
                      <Smartphone className="w-5 h-5" />
                    </div>
                    <h3 className="font-serif font-bold text-base text-white mb-1">
                      Mercado Pago Chile
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed mb-3">
                      Paga con dinero en cuenta de Mercado Pago o con tarjetas bancarias chilenas vía alias o link directo.
                    </p>
                    <span className="text-[11px] font-mono text-cyan-400 font-medium">✓ Débito y Crédito local</span>
                  </div>

                  {/* Webpay Plus / Mach / Tenpo */}
                  <div className="p-6 rounded-xl bg-slate-950 border border-purple-500/30">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-4">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <h3 className="font-serif font-bold text-base text-white mb-1">
                      Webpay, Mach & Tenpo
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed mb-3">
                      Compatible con Redcompra Transbank, Mach, Tenpo y billeteras móviles autorizadas en Chile.
                    </p>
                    <span className="text-[11px] font-mono text-purple-400 font-medium">✓ Máxima comodidad</span>
                  </div>
                </div>
              </div>
            </section>

            {/* ABOUT THE AUTHOR SECTION */}
            <section id="author-bio" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="p-8 sm:p-10 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                  <div className="md:col-span-4 flex flex-col items-center text-center">
                    {/* Author Avatar with Camera Overlay (Admin Mode) */}
                    <div 
                      onClick={() => {
                        if (!isAdmin) {
                          setIsAdminLoginOpen(true);
                        } else {
                          setIsEditProfileOpen(true);
                        }
                      }}
                      className="relative group cursor-pointer w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-2 border-amber-500/40 p-1 mb-3 shadow-xl bg-slate-950"
                      title={isAdmin ? "Haz clic para cambiar tu foto de perfil" : "Ingresa como administrador para cambiar tu foto"}
                    >
                      <img
                        src={authorProfile.avatarUrl}
                        alt={authorProfile.name}
                        className="w-full h-full object-cover rounded-full"
                      />
                      {/* Interactive camera badge */}
                      <div className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center opacity-85 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                        <Camera className="w-6 h-6 text-amber-400 mb-0.5" />
                        <span className="text-[10px] text-white font-semibold">
                          {isAdmin ? 'Cambiar Foto' : 'Modo Admin'}
                        </span>
                      </div>
                    </div>

                    <h3 className="font-serif font-bold text-xl text-white">
                      {authorProfile.name}
                    </h3>
                    <p className="text-xs text-amber-400 mt-0.5">
                      {authorProfile.tagline}
                    </p>
                    <span className="text-[11px] text-slate-500 font-mono mt-1">
                      {authorProfile.email}
                    </span>

                    {/* Direct Admin Edit Button */}
                    <button
                      onClick={() => {
                        if (!isAdmin) {
                          setIsAdminLoginOpen(true);
                        } else {
                          setIsEditProfileOpen(true);
                        }
                      }}
                      className="mt-3.5 inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg transition-colors cursor-pointer shadow-sm"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>{isAdmin ? 'Modificar Mi Foto & Perfil' : 'Modificar en Modo Admin'}</span>
                    </button>
                  </div>

                  <div className="md:col-span-8 space-y-4">
                    <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider font-mono">
                      <Feather className="w-4 h-4" />
                      <span>Compromiso del Autor en Chile</span>
                    </div>
                    <h4 className="text-2xl font-serif font-bold text-white">
                      "Libros directos para la comunidad lectora chilena."
                    </h4>
                    <p className="text-sm text-slate-300 leading-relaxed font-serif text-justify">
                      {authorProfile.bio}
                    </p>
                    <div className="pt-3 flex flex-wrap items-center gap-4 text-xs text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        <span>Pago directo en pesos chilenos (BancoEstado / MP)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        <span>Obras protegidas y mantenidas permanentemente</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <CheckCircle className="w-4 h-4 text-emerald-400" />
                        <span>Libros liberados con un solo clic</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-900 bg-slate-950 py-10 px-4 sm:px-6 lg:px-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-white text-sm">LibroLibre Chile</span>
            <span>·</span>
            <span>Plataforma para Autores Independientes en Chile</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setCurrentView('catalog')}
              className="hover:text-slate-300 cursor-pointer"
            >
              Catálogo
            </button>
            <button
              onClick={() => {
                if (!isAdmin) {
                  setIsAdminLoginOpen(true);
                } else {
                  setCurrentView('author');
                }
              }}
              className="hover:text-amber-400 font-medium cursor-pointer flex items-center gap-1"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>{isAdmin ? 'Panel de Administrador' : 'Ingreso Administrador'}</span>
            </button>
          </div>

          <div>
            <span>© {new Date().getFullYear()} {authorProfile.name}. Obras custodiadas de por vida.</span>
          </div>
        </div>
      </footer>

      {/* Floating Reader Quick Action Button (FAB - Inspired by Moon+ Reader) */}
      <button
        type="button"
        onClick={() => {
          const targetBook = books.find((b) => b.isLiberated) || books[0];
          if (targetBook) {
            setSelectedBookForReader(targetBook);
          }
        }}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-[#cb6858] hover:bg-[#b85647] text-white flex items-center justify-center shadow-[0_8px_25px_rgba(203,104,88,0.55)] border-2 border-white/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
        title="Abrir lector digital rápido"
        aria-label="Abrir lector digital rápido"
      >
        <BookOpen className="w-6 h-6" />
      </button>

      {/* MODALS */}
      {/* 1. Admin Login Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onSuccess={handleAdminLoginSuccess}
        correctPin={authorProfile.adminPin || '1234'}
      />

      {/* 2. Admin Delete Book Confirmation Modal */}
      <DeleteBookConfirmModal
        book={bookPendingDelete}
        onClose={() => setBookPendingDelete(null)}
        onConfirmDelete={handleConfirmDeleteBook}
        adminPin={authorProfile.adminPin || '1234'}
      />

      {/* 3. Book Details Modal */}
      <BookDetailsModal
        book={selectedBookForDetails}
        onClose={() => setSelectedBookForDetails(null)}
        onPreview={(book) => setSelectedBookForReader(book)}
        onProceedToCheckout={(book) => setSelectedBookForCheckout(book)}
        isAuthorMode={currentView === 'author' && isAdmin}
        onToggleLiberate={handleToggleLiberate}
      />

      {/* 4. In-App Book Reader Modal */}
      <BookReaderModal
        book={selectedBookForReader}
        onClose={() => setSelectedBookForReader(null)}
        onDownload={(book) => {
          setSelectedBookForReader(null);
          setSelectedBookForCheckout(book);
        }}
      />

      {/* 5. Checkout & Download Modal (Chilean Pesos / BancoEstado / MP) */}
      <CheckoutModal
        book={selectedBookForCheckout}
        authorProfile={authorProfile}
        onClose={() => setSelectedBookForCheckout(null)}
        onDownloadCompleted={handleDownloadCompleted}
      />

      {/* 6. Upload Book Modal (Admin Only) */}
      {isUploadModalOpen && (
        <UploadBookModal
          onClose={() => setIsUploadModalOpen(false)}
          onSaveBook={handleSaveBook}
          defaultAuthorName={authorProfile.name}
          folders={folders}
        />
      )}

      {/* 7. Payment Settings & PIN Modal (Admin Only) */}
      {isPaymentSettingsOpen && (
        <PaymentSettingsModal
          authorProfile={authorProfile}
          onClose={() => setIsPaymentSettingsOpen(false)}
          onSaveProfile={handleSaveAuthorProfile}
        />
      )}

      {/* 8. Edit Author Profile & Photo Modal (Admin Only) */}
      {isEditProfileOpen && (
        <EditAuthorProfileModal
          isOpen={isEditProfileOpen}
          authorProfile={authorProfile}
          onClose={() => setIsEditProfileOpen(false)}
          onSaveProfile={handleSaveAuthorProfile}
        />
      )}

      {/* 9. Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md animate-fade-in pointer-events-auto">
          <div
            className={`px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border text-sm font-medium ${
              toast.type === 'error'
                ? 'bg-rose-950/95 text-rose-200 border-rose-500/50 backdrop-blur'
                : 'bg-emerald-950/95 text-emerald-200 border-emerald-500/50 backdrop-blur'
            }`}
          >
            <span className="text-base">{toast.type === 'error' ? '⚠️' : '✅'}</span>
            <span className="flex-1">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="text-slate-400 hover:text-white ml-2 text-xs font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
