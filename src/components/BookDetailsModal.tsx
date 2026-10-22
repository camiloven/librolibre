import React from 'react';
import { Book, formatCurrency } from '../types/book';
import { X, BookOpen, Download, Star, Sparkles, CheckCircle2, ShieldCheck, FileText, Calendar, Globe, Layers } from 'lucide-react';

interface BookDetailsModalProps {
  book: Book | null;
  onClose: () => void;
  onPreview: (book: Book) => void;
  onProceedToCheckout: (book: Book) => void;
  isAuthorMode?: boolean;
  onToggleLiberate?: (bookId: string) => void;
}

export const BookDetailsModal: React.FC<BookDetailsModalProps> = ({
  book,
  onClose,
  onPreview,
  onProceedToCheckout,
  isAuthorMode = false,
  onToggleLiberate,
}) => {
  if (!book) return null;

  const isFree = book.pricingType === 'free';
  const isLiberated = book.isLiberated;
  const isPwyw = book.pricingType === 'pwyw';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div 
        className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-slate-950/70 border border-slate-700/60 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          aria-label="Cerrar modal"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-0">
          {/* Cover Column (5 cols) */}
          <div className="md:col-span-5 bg-slate-950 p-6 sm:p-8 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-800">
            <div className="w-full max-w-[240px] aspect-[3/4] rounded-lg overflow-hidden shadow-2xl border border-slate-800 bg-slate-900 relative">
              <img
                src={book.coverUrl}
                alt={book.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Author Liberation Box */}
            {isLiberated && (
              <div className="mt-5 w-full p-3.5 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-center">
                <div className="flex items-center justify-center gap-1.5 text-emerald-400 text-xs font-semibold">
                  <Sparkles className="w-4 h-4" />
                  <span>Obra Liberada por el Autor</span>
                </div>
                <p className="text-[11px] text-emerald-200/80 mt-1">
                  {book.liberatedNote || 'Disponible sin costo para toda la comunidad lectora.'}
                </p>
              </div>
            )}

            {/* Author Quick Switch (if in author mode) */}
            {isAuthorMode && onToggleLiberate && (
              <div className="mt-4 w-full p-3 bg-slate-900 border border-slate-700/60 rounded-xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-slate-200">Control de Liberación</div>
                  <div className="text-[11px] text-slate-400">
                    {book.isLiberated ? 'Actualmente Gratis' : `De Pago (${formatCurrency(book.price, 'CLP')})`}
                  </div>
                </div>
                <button
                  onClick={() => onToggleLiberate(book.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg cursor-pointer transition-colors ${
                    book.isLiberated
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30'
                      : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400'
                  }`}
                >
                  {book.isLiberated ? 'Cobrar' : 'Liberar Gratis'}
                </button>
              </div>
            )}
          </div>

          {/* Details Column (7 cols) */}
          <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
            <div>
              {/* Category & Status */}
              <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mb-2">
                <span className="uppercase tracking-wider text-amber-400">{book.genre}</span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span>{book.publicationYear}</span>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <div className="flex items-center gap-1 text-amber-400">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span className="font-semibold text-slate-200 tabular-nums">{book.rating}</span>
                </div>
              </div>

              {/* Title & Subtitle */}
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-white tracking-tight leading-snug">
                {book.title}
              </h2>
              {book.subtitle && (
                <p className="text-sm text-slate-400 mt-1 italic font-serif">
                  {book.subtitle}
                </p>
              )}
              <p className="text-xs text-slate-300 mt-2 font-medium">
                Escrito por <span className="text-amber-400 font-semibold">{book.author}</span>
              </p>

              {/* Synopsis */}
              <div className="mt-4 pt-4 border-t border-slate-800">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Sinopsis
                </h4>
                <p className="text-sm text-slate-300 leading-relaxed max-h-44 overflow-y-auto pr-2">
                  {book.synopsis}
                </p>
              </div>

              {/* Metadata specs grid */}
              <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">Formato</div>
                    <div className="font-mono font-medium">{book.fileType} ({book.fileSize})</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">Extensión</div>
                    <div className="font-mono font-medium">{book.pageCount} páginas</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">Idioma</div>
                    <div className="font-medium">{book.language}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-6 pt-5 border-t border-slate-800">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-xs text-slate-400">Modalidad de acceso</div>
                  <div className="text-xl font-bold font-mono text-white tabular-nums">
                    {isLiberated ? (
                      <span className="text-emerald-400">$0 CLP (Liberado)</span>
                    ) : isFree ? (
                      <span className="text-amber-400">Descarga Gratuita</span>
                    ) : isPwyw ? (
                      <span>Aporte libre (min {formatCurrency(book.allowPwywMin || 1000, 'CLP')})</span>
                    ) : (
                      <span>{formatCurrency(book.price, 'CLP')}</span>
                    )}
                  </div>
                </div>
                <div className="text-right text-xs text-slate-400">
                  <span className="font-mono tabular-nums text-slate-200">{book.downloadCount.toLocaleString()}</span> descargas
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => {
                    onClose();
                    onPreview(book);
                  }}
                  className="px-4 py-2.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Leer Muestra Online</span>
                </button>

                <button
                  onClick={() => {
                    onClose();
                    onProceedToCheckout(book);
                  }}
                  className={`px-4 py-2.5 text-xs font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
                    isLiberated || isFree
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-950/40'
                      : 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-amber-950/40'
                  }`}
                >
                  <Download className="w-4 h-4" />
                  <span>{isLiberated || isFree ? 'Descargar Gratis Ahora' : 'Comprar y Descargar'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
