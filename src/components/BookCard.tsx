import { Book, formatCurrency } from '../types/book';
import { BookOpen, Download, Star, Sparkles } from 'lucide-react';

interface BookCardProps {
  book: Book;
  onSelect: (book: Book) => void;
  onPreview: (book: Book) => void;
  onDownload: (book: Book) => void;
  isAuthorMode?: boolean;
  onToggleLiberate?: (bookId: string) => void;
}

export const BookCard: React.FC<BookCardProps> = ({
  book,
  onSelect,
  onPreview,
  onDownload,
  isAuthorMode = false,
  onToggleLiberate,
}) => {
  const isFree = book.pricingType === 'free';
  const isLiberated = book.isLiberated;
  const isPwyw = book.pricingType === 'pwyw';

  // Determine display price string in CLP
  let priceDisplay = formatCurrency(book.price, 'CLP');
  if (isLiberated) {
    priceDisplay = 'GRATIS (LIBERADO)';
  } else if (isFree) {
    priceDisplay = 'GRATIS';
  } else if (isPwyw) {
    priceDisplay = `Desde ${formatCurrency(book.allowPwywMin || 1000, 'CLP')}`;
  }

  return (
    <article className="group bg-slate-900/60 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col overflow-hidden hover:shadow-xl hover:shadow-black/40">
      {/* Cover Image Container (3:4 ratio) */}
      <div 
        onClick={() => onSelect(book)} 
        className="relative aspect-[3/4] w-full bg-slate-950 overflow-hidden cursor-pointer"
      >
        <img
          src={book.coverUrl}
          alt={`Portada de ${book.title}`}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
          loading="lazy"
          onError={(e) => {
            // Styled graceful CSS fallback
            (e.target as HTMLElement).style.display = 'none';
          }}
        />

        {/* Fallback container in case image fails */}
        <div className="absolute inset-0 -z-10 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800">
          <BookOpen className="w-10 h-10 text-amber-500/40 mb-3" />
          <span className="font-serif font-bold text-white text-base leading-snug">{book.title}</span>
          <span className="text-xs text-slate-400 mt-2">{book.author}</span>
        </div>

        {/* Author Quick Toggle Switch Overlay (if in Author Mode) */}
        {isAuthorMode && onToggleLiberate && (
          <div 
            onClick={(e) => e.stopPropagation()}
            className="absolute top-3 right-3 bg-slate-950/90 backdrop-blur-md p-2 rounded-lg border border-slate-700 shadow-lg flex items-center gap-2"
          >
            <span className="text-[11px] font-medium text-slate-300">
              {book.isLiberated ? 'Liberado' : 'De Pago'}
            </span>
            <button
              type="button"
              onClick={() => onToggleLiberate(book.id)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                book.isLiberated ? 'bg-emerald-500' : 'bg-slate-700'
              }`}
              title={book.isLiberated ? 'Hacer de pago nuevamente' : 'Liberar gratis para todos'}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  book.isLiberated ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        )}
      </div>

      {/* Book Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Metadata line with typographic separators (Zero-Pill compliant) */}
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-2 font-medium">
            <span className="uppercase tracking-wider text-amber-400/90">{book.genre}</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>{book.pageCount} págs</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="font-mono">{book.fileType}</span>
          </div>

          {/* Book Title */}
          <h3 
            onClick={() => onSelect(book)}
            className="font-serif font-bold text-lg text-slate-100 hover:text-amber-400 transition-colors cursor-pointer line-clamp-1"
          >
            {book.title}
          </h3>

          {/* Subtitle / Author */}
          <p className="text-xs text-slate-400 mt-1 line-clamp-1">
            Por <span className="text-slate-300 font-medium">{book.author}</span>
          </p>

          {/* Short synopsis */}
          <p className="text-xs text-slate-400 mt-2.5 line-clamp-2 leading-relaxed">
            {book.synopsis}
          </p>
        </div>

        {/* Price & Action Section */}
        <div className="mt-5 pt-4 border-t border-slate-800/80">
          <div className="flex items-center justify-between gap-2 mb-3">
            <div>
              {isLiberated ? (
                <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Liberado por el autor</span>
                </div>
              ) : (
                <div className="text-xs text-slate-400 font-medium">
                  {isFree ? 'Acceso abierto' : 'Precio oficial'}
                </div>
              )}
              <div className={`text-base font-bold font-mono tabular-nums ${
                isLiberated ? 'text-emerald-300' : (isFree ? 'text-amber-400' : 'text-white')
              }`}>
                {priceDisplay}
              </div>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              <span className="font-semibold text-slate-200 tabular-nums">{book.rating}</span>
              <span className="text-slate-500">({book.reviewCount})</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onPreview(book)}
              className="px-3 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Leer Muestra</span>
            </button>
            <button
              onClick={() => onDownload(book)}
              className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap ${
                isLiberated || isFree
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-sm'
                  : 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-sm'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isLiberated || isFree ? 'Descargar' : 'Obtener'}</span>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};
