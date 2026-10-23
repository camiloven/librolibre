import React, { useState, useRef, useEffect } from 'react';
import { Book, formatCurrency } from '../types/book';
import { 
  MoreVertical, BookOpen, Download, Sparkles, Trash2, 
  Upload, Loader2, Check, Star, Info, FileText 
} from 'lucide-react';

interface BookshelfViewProps {
  books: Book[];
  onSelectBook: (book: Book) => void;
  onPreviewBook: (book: Book) => void;
  onDownloadBook: (book: Book) => void;
  isAuthorMode?: boolean;
  onToggleLiberate?: (bookId: string) => void;
  onRequestDeleteBook?: (book: Book) => void;
  onAttachFile?: (bookId: string, e: React.ChangeEvent<HTMLInputElement>) => void;
  uploadingBookId?: string | null;
}

export const BookshelfView: React.FC<BookshelfViewProps> = ({
  books,
  onSelectBook,
  onPreviewBook,
  onDownloadBook,
  isAuthorMode = false,
  onToggleLiberate,
  onRequestDeleteBook,
  onAttachFile,
  uploadingBookId,
}) => {
  const [activeMenuBookId, setActiveMenuBookId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close popup menu on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuBookId(null);
      }
    };
    if (activeMenuBookId) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [activeMenuBookId]);

  if (books.length === 0) {
    return (
      <div className="py-20 px-4 text-center bg-[#241711] border border-[#4a3022] rounded-2xl shadow-2xl">
        <BookOpen className="w-14 h-14 text-amber-600/40 mx-auto mb-3" />
        <h3 className="text-lg font-serif font-bold text-[#e8d5be]">
          No hay libros en este estante
        </h3>
        <p className="text-xs text-[#a88d77] mt-1 max-w-sm mx-auto">
          Prueba cambiando el género o la búsqueda para encontrar otras obras.
        </p>
      </div>
    );
  }

  // Chunk books into shelves of 3 (mobile) or 4 (desktop)
  // We chunk into rows of 4 (with responsive grid that fits 3 on mobile and 4 on md/lg)
  const chunkSize = 4;
  const shelves: Book[][] = [];
  for (let i = 0; i < books.length; i += chunkSize) {
    shelves.push(books.slice(i, i + chunkSize));
  }

  return (
    <div className="relative rounded-2xl overflow-hidden border border-[#523524] shadow-[0_20px_50px_rgba(0,0,0,0.8)] bg-[#241711]">
      {/* Wooden Bookcase Outer Frame & Vertical Sides */}
      <div className="relative p-2 sm:p-4 bg-gradient-to-b from-[#2e1c14] via-[#24160f] to-[#1d110b]">
        {/* Subtle wood texture grain overlay */}
        <div 
          className="absolute inset-0 opacity-15 pointer-events-none mix-blend-overlay"
          style={{
            backgroundImage: `repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(0,0,0,0.2) 40px, rgba(0,0,0,0.2) 80px)`
          }}
        />

        {/* Shelves List */}
        <div className="space-y-4 sm:space-y-6 pt-3">
          {shelves.map((shelf, shelfIdx) => (
            <div key={`shelf-${shelfIdx}`} className="relative flex flex-col justify-end">
              {/* Row of Books resting on the shelf board */}
              <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-2 sm:gap-4 md:gap-6 px-2 sm:px-4 items-end relative z-10">
                {shelf.map((book) => {
                  const isLiberated = book.isLiberated;
                  const isFree = book.pricingType === 'free';
                  const isMenuOpen = activeMenuBookId === book.id;

                  return (
                    <div
                      key={book.id}
                      className="group relative flex flex-col items-center cursor-pointer select-none"
                    >
                      {/* Realistic 3D Standing Book Container */}
                      <div 
                        onClick={() => onSelectBook(book)}
                        className="relative w-full aspect-[2/3] sm:aspect-[3/4] rounded-sm sm:rounded-md transition-all duration-300 ease-out group-hover:-translate-y-2 group-hover:scale-[1.02]"
                        style={{
                          perspective: '1000px',
                        }}
                      >
                        {/* Book Spine Left Highlight & 3D Depth */}
                        <div className="absolute inset-0 rounded-sm sm:rounded-md overflow-hidden shadow-[0_12px_20px_-2px_rgba(0,0,0,0.8),0_4px_6px_-2px_rgba(0,0,0,0.6)] border-r border-black/30">
                          {/* Front Cover Image */}
                          <img
                            src={book.coverUrl}
                            alt={book.title}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                              // Elegant fallback faux cloth book cover
                              (e.target as HTMLElement).style.display = 'none';
                            }}
                          />

                          {/* Fallback Book Cover with Cloth Texture */}
                          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-[#3b271d] via-[#291a13] to-[#1c110c] p-2 sm:p-3 flex flex-col justify-between text-center border border-[#6b472e]/40">
                            <div className="text-[10px] uppercase font-mono tracking-wider text-amber-500/80">
                              {book.genre}
                            </div>
                            <div>
                              <BookOpen className="w-6 h-6 text-amber-400/50 mx-auto mb-1" />
                              <div className="font-serif font-bold text-xs sm:text-sm text-[#f1dfce] line-clamp-3 leading-snug">
                                {book.title}
                              </div>
                            </div>
                            <div className="text-[10px] text-amber-300/70 italic truncate">
                              {book.author}
                            </div>
                          </div>

                          {/* Left Book Spine 3D Curve Shadow Effect */}
                          <div className="absolute left-0 top-0 bottom-0 w-2.5 sm:w-3.5 bg-gradient-to-r from-black/60 via-black/20 to-transparent pointer-events-none" />
                          {/* Right Page Edge Gilded Effect */}
                          <div className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-l from-black/40 to-transparent pointer-events-none" />
                          {/* Top Spine Highlight */}
                          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
                        </div>

                        {/* Top-Right Price or Liberation Tag */}
                        <div className="absolute top-1.5 right-1.5 z-20 pointer-events-none">
                          {isLiberated ? (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-900/90 border border-emerald-400/60 text-emerald-300 font-bold text-[9px] sm:text-[10px] shadow-lg flex items-center gap-0.5 backdrop-blur-sm">
                              <Sparkles className="w-2.5 h-2.5" />
                              <span>LIBRE</span>
                            </span>
                          ) : isFree ? (
                            <span className="px-1.5 py-0.5 rounded bg-amber-900/90 border border-amber-400/60 text-amber-300 font-bold text-[9px] sm:text-[10px] shadow-lg backdrop-blur-sm">
                              GRATIS
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded bg-slate-950/90 border border-slate-700/80 text-amber-300 font-mono font-bold text-[9px] sm:text-[10px] shadow-lg backdrop-blur-sm">
                              {formatCurrency(book.price, 'CLP')}
                            </span>
                          )}
                        </div>

                        {/* Bottom-Left 3-Dots Action Menu Trigger (Exact match with Moon+ Reader screenshot) */}
                        <div 
                          className="absolute bottom-1.5 left-1.5 z-20"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => setActiveMenuBookId(isMenuOpen ? null : book.id)}
                            className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center backdrop-blur-sm transition-all border border-white/20 shadow-md cursor-pointer"
                            title="Opciones del libro"
                            aria-label={`Opciones de ${book.title}`}
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Bottom-Right Format Ribbon (e.g. EPUB / PDF badge like in screenshot) */}
                        <div className="absolute bottom-1.5 right-1.5 z-20 pointer-events-none">
                          <span className={`px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-mono font-bold uppercase shadow-md ${
                            book.fileType === 'EPUB'
                              ? 'bg-teal-900/90 text-teal-300 border border-teal-500/50'
                              : 'bg-rose-950/90 text-rose-300 border border-rose-500/50'
                          }`}>
                            {book.fileType || 'PDF'}
                          </span>
                        </div>

                        {/* Contact Shadow beneath the book resting on the shelf */}
                        <div className="absolute -bottom-1 left-2 right-2 h-2.5 bg-black/80 blur-[3px] rounded-full -z-10 group-hover:opacity-40 transition-opacity" />
                      </div>

                      {/* Quiet Book Title Label Beneath Book on the Wood Plank */}
                      <div className="w-full mt-1.5 mb-1 px-1 text-center">
                        <div 
                          onClick={() => onSelectBook(book)}
                          className="font-serif font-medium text-[11px] sm:text-xs text-[#eedcc9] group-hover:text-amber-300 line-clamp-1 transition-colors leading-tight"
                          title={book.title}
                        >
                          {book.title}
                        </div>
                        <div className="text-[10px] text-[#a98f79] line-clamp-1">
                          {book.author}
                        </div>
                      </div>

                      {/* 3-DOTS POPUP MENU (Floating dropdown over the shelf) */}
                      {isMenuOpen && (
                        <div
                          ref={menuRef}
                          onClick={(e) => e.stopPropagation()}
                          className="absolute bottom-10 left-2 sm:left-4 z-40 w-48 sm:w-56 bg-slate-900/95 border border-amber-600/40 rounded-xl shadow-2xl p-1.5 text-xs text-slate-200 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150"
                        >
                          <div className="px-2.5 py-1.5 border-b border-slate-800 mb-1">
                            <div className="font-serif font-bold text-white truncate text-xs">{book.title}</div>
                            <div className="text-[10px] text-amber-400 truncate">{book.genre} · {book.publicationYear}</div>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuBookId(null);
                              onSelectBook(book);
                            }}
                            className="w-full px-2.5 py-1.5 text-left rounded-lg hover:bg-slate-800 flex items-center gap-2 cursor-pointer transition-colors"
                          >
                            <Info className="w-3.5 h-3.5 text-slate-400" />
                            <span>Ver Ficha y Detalles</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuBookId(null);
                              onPreviewBook(book);
                            }}
                            className="w-full px-2.5 py-1.5 text-left rounded-lg hover:bg-slate-800 flex items-center gap-2 cursor-pointer transition-colors"
                          >
                            <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                            <span>Leer Muestra Online</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setActiveMenuBookId(null);
                              onDownloadBook(book);
                            }}
                            className="w-full px-2.5 py-1.5 text-left rounded-lg hover:bg-slate-800 flex items-center gap-2 cursor-pointer transition-colors font-medium text-emerald-400"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>{isLiberated || isFree ? 'Descargar Gratis (PDF)' : 'Comprar y Descargar'}</span>
                          </button>

                          {/* Author Management Actions inside 3-dots menu */}
                          {isAuthorMode && (
                            <>
                              <div className="border-t border-slate-800 my-1" />

                              {onToggleLiberate && book.pricingType !== 'free' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuBookId(null);
                                    onToggleLiberate(book.id);
                                  }}
                                  className={`w-full px-2.5 py-1.5 text-left rounded-lg flex items-center gap-2 cursor-pointer transition-colors ${
                                    isLiberated
                                      ? 'text-rose-400 hover:bg-rose-950/40'
                                      : 'text-emerald-400 hover:bg-emerald-950/40'
                                  }`}
                                >
                                  <Sparkles className="w-3.5 h-3.5" />
                                  <span>{isLiberated ? 'Cobrar de nuevo' : 'Liberar gratis ahora'}</span>
                                </button>
                              )}

                              {onAttachFile && (
                                <label className="w-full px-2.5 py-1.5 text-left rounded-lg hover:bg-slate-800 flex items-center gap-2 cursor-pointer transition-colors text-slate-300">
                                  {uploadingBookId === book.id ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                                  ) : (
                                    <Upload className="w-3.5 h-3.5 text-amber-400" />
                                  )}
                                  <span>{book.downloadUrl ? 'Cambiar archivo' : 'Subir archivo'}</span>
                                  <input
                                    type="file"
                                    accept=".pdf,.epub,.mobi,.docx,.txt"
                                    disabled={uploadingBookId === book.id}
                                    onChange={(e) => {
                                      setActiveMenuBookId(null);
                                      onAttachFile(book.id, e);
                                    }}
                                    className="hidden"
                                  />
                                </label>
                              )}

                              {onRequestDeleteBook && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuBookId(null);
                                    onRequestDeleteBook(book);
                                  }}
                                  className="w-full px-2.5 py-1.5 text-left rounded-lg hover:bg-rose-950/50 text-rose-400 flex items-center gap-2 cursor-pointer transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Eliminar libro</span>
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* REALISTIC 3D WOODEN SHELF PLANK (Where the books physically rest) */}
              <div className="relative w-full z-20 mt-1">
                {/* 1. Top Beveled Highlight Edge of the Wood Plank */}
                <div 
                  className="h-2 w-full shadow-[inset_0_1px_1px_rgba(255,255,255,0.4)]"
                  style={{
                    background: 'linear-gradient(90deg, #784c28 0%, #ba8a58 20%, #e0b686 50%, #ba8a58 80%, #784c28 100%)',
                  }}
                />
                {/* 2. Front Facade of Wooden Shelf Board (Deep Oak/Walnut) */}
                <div 
                  className="h-4 sm:h-5 w-full border-t border-[#f4cf9f]/30 border-b border-[#140b06] shadow-md flex items-center justify-between px-4"
                  style={{
                    background: 'linear-gradient(180deg, #613c1e 0%, #4a2c13 50%, #301b0a 100%)',
                  }}
                >
                  {/* Subtle wood grains */}
                  <div className="w-full h-full opacity-20 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-black pointer-events-none" />
                </div>
                {/* 3. Drop Shadow Cast by this shelf onto the shelf below */}
                <div className="h-6 w-full bg-gradient-to-b from-black/75 via-black/35 to-transparent pointer-events-none" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
