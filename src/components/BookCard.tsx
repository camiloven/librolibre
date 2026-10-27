import { Book, formatCurrency, formatBothPrices } from '../types/book';
import { BookOpen, Download, Star, Sparkles, Folder } from 'lucide-react';

interface BookCardProps {
  book: Book;
  onSelect: (book: Book) => void;
  onPreview: (book: Book) => void;
  onDownload: (book: Book) => void;
  isAuthorMode?: boolean;
  onToggleLiberate?: (bookId: string) => void;
  compact?: boolean;
}

export const BookCard: React.FC<BookCardProps> = ({
  book,
  onSelect,
  onPreview,
  onDownload,
  isAuthorMode = false,
  onToggleLiberate,
  compact = true,
}) => {
  const isFree = book.pricingType === 'free';
  const isLiberated = book.isLiberated;
  const isPwyw = book.pricingType === 'pwyw';

  // Determine display price string (CLP and USD dual currency)
  let priceDisplay = formatBothPrices(book.price, book.priceUSD);
  if (isLiberated) {
    priceDisplay = 'GRATIS (LIBERADO)';
  } else if (isFree) {
    priceDisplay = 'GRATIS';
  } else if (isPwyw) {
    priceDisplay = `Desde ${formatCurrency(book.allowPwywMin || 1000, 'CLP')}`;
  }

  return (
    <article className="group bg-slate-900/70 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col overflow-hidden hover:shadow-xl hover:shadow-black/40">
      {/* Cover Image Container (3:4 ratio) */}
      <div 
        onClick={() => onSelect(book)} 
        className="relative aspect-[3/4] w-full bg-slate-950 overflow-hidden cursor-pointer"
      >
        <img
          src={book.coverUrl}
          alt={`Portada de ${book.title}`}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-500"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLElement).style.display = 'none';
          }}
        />

        {/* Fallback container in case image fails */}
        <div className="absolute inset-0 -z-10 flex flex-col items-center justify-center p-4 text-center bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800">
          <BookOpen className="w-8 h-8 text-amber-500/40 mb-2" />
          <span className="font-serif font-bold text-white text-sm leading-snug line-clamp-2">{book.title}</span>
          <span className="text-[11px] text-slate-400 mt-1">{book.author}</span>
        </div>

        {/* Status Chip Overlay */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start">
          {isLiberated ? (
            <span className="px-2 py-0.5 rounded-md bg-emerald-950/90 border border-emerald-500/40 text-emerald-300 font-semibold text-[10px] tracking-wide shadow-md flex items-center gap-1 backdrop-blur-sm">
              <Sparkles className="w-2.5 h-2.5" />
              <span>LIBERADO</span>
            </span>
          ) : isFree ? (
            <span className="px-2 py-0.5 rounded-md bg-amber-950/90 border border-amber-500/40 text-amber-300 font-semibold text-[10px] tracking-wide shadow-md backdrop-blur-sm">
              GRATIS
            </span>
          ) : null}
          {book.teraboxUrl && (
            <span className="px-2 py-0.5 rounded-md bg-sky-950/90 border border-sky-400/40 text-sky-300 font-semibold text-[9px] tracking-wider shadow-md backdrop-blur-sm flex items-center gap-1">
              <span>☁️</span>
              <span>TERABOX</span>
            </span>
          )}
        </div>

        {/* Author Quick Toggle Switch Overlay (if in Author Mode) */}
        {isAuthorMode && onToggleLiberate && (
          <div 
            onClick={(e) => e.stopPropagation()}
            className="absolute top-2.5 right-2.5 bg-slate-950/90 backdrop-blur-md p-1.5 rounded-lg border border-slate-700 shadow-lg flex items-center gap-1.5"
          >
            <span className="text-[10px] font-medium text-slate-300">
              {book.isLiberated ? 'Liberado' : 'De Pago'}
            </span>
            <button
              type="button"
              onClick={() => onToggleLiberate(book.id)}
              className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                book.isLiberated ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
              title={book.isLiberated ? 'Hacer de pago nuevamente' : 'Liberar gratis para todos'}
            >
              <span
                className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  book.isLiberated ? 'translate-x-3' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        )}
      </div>

      {/* Book Content */}
      <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Metadata line with typographic separators (Zero-Pill compliant) */}
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mb-1.5 font-medium truncate">
            <span className="uppercase tracking-wider text-amber-400/90 truncate">{book.genre}</span>
            {book.folderName && (
              <>
                <span aria-hidden="true" className="text-slate-600">·</span>
                <span className="text-amber-300 font-semibold flex items-center gap-0.5 truncate">
                  <Folder className="w-2.5 h-2.5 text-amber-400 shrink-0" />
                  <span className="truncate">{book.folderName}</span>
                </span>
              </>
            )}
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="shrink-0">{book.pageCount} pág</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="font-mono text-slate-400 shrink-0">{book.fileType}</span>
          </div>

          {/* Book Title */}
          <h3 
            onClick={() => onSelect(book)}
            className="font-serif font-bold text-sm sm:text-base text-slate-100 hover:text-amber-400 transition-colors cursor-pointer line-clamp-1 leading-snug"
            title={book.title}
          >
            {book.title}
          </h3>

          {/* Subtitle / Author */}
          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
            Por <span className="text-slate-300 font-medium">{book.author}</span>
          </p>

          {/* Short synopsis */}
          <p className="text-[11px] text-slate-400 mt-2 line-clamp-2 leading-relaxed">
            {book.synopsis}
          </p>
        </div>

        {/* Price & Action Section */}
        <div className="mt-3.5 pt-3 border-t border-slate-800/80">
          <div className="flex items-center justify-between gap-1 mb-2.5">
            <div>
              {isLiberated ? (
                <div className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  <span>Liberado</span>
                </div>
              ) : (
                <div className="text-[10px] text-slate-400 font-medium">
                  {isFree ? 'Acceso libre' : 'Precio'}
                </div>
              )}
              <div className={`text-xs sm:text-sm font-bold font-mono tabular-nums ${
                isLiberated ? 'text-emerald-300' : (isFree ? 'text-amber-400' : 'text-white')
              }`}>
                {priceDisplay}
              </div>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-1 text-[11px] text-slate-400 shrink-0">
              <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span className="font-semibold text-slate-200 tabular-nums">{book.rating}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => onPreview(book)}
              className="px-2 py-1.5 text-[11px] font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap"
              title="Leer muestra en línea"
            >
              <BookOpen className="w-3 h-3 shrink-0" />
              <span className="truncate">Muestra</span>
            </button>
            <button
              onClick={() => onDownload(book)}
              className={`px-2 py-1.5 text-[11px] font-semibold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap ${
                isLiberated || isFree
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-sm'
                  : 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-sm'
              }`}
              title={isLiberated || isFree ? 'Descargar gratis' : 'Comprar libro'}
            >
              <Download className="w-3 h-3 shrink-0" />
              <span className="truncate">{isLiberated || isFree ? 'Descargar' : 'Obtener'}</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};
