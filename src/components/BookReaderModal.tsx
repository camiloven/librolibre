import React, { useState } from 'react';
import { Book } from '../types/book';
import { X, ChevronLeft, ChevronRight, Bookmark, Sun, Moon, Coffee } from 'lucide-react';

interface BookReaderModalProps {
  book: Book | null;
  onClose: () => void;
  onDownload: (book: Book) => void;
}

type ThemeMode = 'dark' | 'sepia' | 'light';

export const BookReaderModal: React.FC<BookReaderModalProps> = ({
  book,
  onClose,
  onDownload,
}) => {
  const [currentChapterIndex, setCurrentChapterIndex] = useState(0);
  const [fontSize, setFontSize] = useState<number>(18); // px
  const [theme, setTheme] = useState<ThemeMode>('sepia');

  if (!book) return null;

  const chapters = book.sampleChapters && book.sampleChapters.length > 0
    ? book.sampleChapters
    : [
        {
          id: 'ch-fallback',
          title: 'Prólogo y Primer Capítulo',
          content: `${book.synopsis}\n\nEn las próximas páginas descubrirás el inicio de esta cautivadora historia escrita por ${book.author}. Disfruta la lectura digital o descarga el libro completo en formato ${book.fileType}.`
        }
      ];

  const currentChapter = chapters[currentChapterIndex] || chapters[0];

  const getThemeClasses = () => {
    switch (theme) {
      case 'light':
        return {
          container: 'bg-[#faf8f5] text-[#1c1917]',
          header: 'bg-[#f4efe8] border-[#e7e0d6] text-[#292524]',
          toolbar: 'bg-[#f4efe8] border-[#e7e0d6]',
          card: 'bg-white border-[#e7e0d6]',
          muted: 'text-[#78716c]',
          accent: 'text-amber-800',
        };
      case 'sepia':
        return {
          container: 'bg-[#f5ebd7] text-[#2c221e]',
          header: 'bg-[#ebdcb9] border-[#d8c599] text-[#2c221e]',
          toolbar: 'bg-[#ebdcb9] border-[#d8c599]',
          card: 'bg-[#fdf8ee] border-[#d8c599]',
          muted: 'text-[#6b5849]',
          accent: 'text-amber-900',
        };
      case 'dark':
      default:
        return {
          container: 'bg-slate-950 text-slate-100',
          header: 'bg-slate-900 border-slate-800 text-slate-200',
          toolbar: 'bg-slate-900 border-slate-800',
          card: 'bg-slate-900/90 border-slate-800',
          muted: 'text-slate-400',
          accent: 'text-amber-400',
        };
    }
  };

  const currentTheme = getThemeClasses();

  return (
    <div className={`fixed inset-0 z-50 flex flex-col ${currentTheme.container} transition-colors duration-200`}>
      {/* Reader Top Bar */}
      <header className={`h-16 px-4 sm:px-8 border-b ${currentTheme.header} flex items-center justify-between gap-4 shrink-0`}>
        <div className="flex items-center gap-3 min-w-0">
          <Bookmark className={`w-5 h-5 ${currentTheme.accent} shrink-0`} />
          <div className="min-w-0">
            <h3 className="font-serif font-bold text-sm sm:text-base truncate">
              {book.title}
            </h3>
            <p className={`text-xs ${currentTheme.muted} truncate`}>
              Capítulo {currentChapterIndex + 1} de {chapters.length}: {currentChapter.title}
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {/* Theme switcher */}
          <div className="flex items-center gap-1 p-1 rounded-lg border border-black/10 dark:border-white/10">
            <button
              onClick={() => setTheme('light')}
              title="Tema Claro"
              className={`p-1.5 rounded cursor-pointer transition-colors ${
                theme === 'light' ? 'bg-amber-200 text-slate-900' : currentTheme.muted
              }`}
            >
              <Sun className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTheme('sepia')}
              title="Tema Sepia"
              className={`p-1.5 rounded cursor-pointer transition-colors ${
                theme === 'sepia' ? 'bg-amber-300 text-slate-900' : currentTheme.muted
              }`}
            >
              <Coffee className="w-4 h-4" />
            </button>
            <button
              onClick={() => setTheme('dark')}
              title="Tema Noche"
              className={`p-1.5 rounded cursor-pointer transition-colors ${
                theme === 'dark' ? 'bg-slate-800 text-amber-400' : currentTheme.muted
              }`}
            >
              <Moon className="w-4 h-4" />
            </button>
          </div>

          {/* Font Size */}
          <div className="hidden sm:flex items-center gap-1">
            <button
              onClick={() => setFontSize((s) => Math.max(14, s - 2))}
              className={`px-2 py-1 text-xs font-semibold rounded hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer ${currentTheme.muted}`}
            >
              A-
            </button>
            <span className={`text-xs font-mono tabular-nums ${currentTheme.muted}`}>
              {fontSize}px
            </span>
            <button
              onClick={() => setFontSize((s) => Math.min(26, s + 2))}
              className={`px-2 py-1 text-xs font-semibold rounded hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer ${currentTheme.muted}`}
            >
              A+
            </button>
          </div>

          {/* Download button */}
          <button
            onClick={() => onDownload(book)}
            className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg cursor-pointer transition-colors"
          >
            Descargar Completo
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className={`p-2 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors ${currentTheme.muted} hover:text-white`}
            aria-label="Cerrar visor"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Reading Canvas */}
      <main className="flex-1 overflow-y-auto px-4 sm:px-6 py-8 sm:py-12 flex justify-center">
        <article className="w-full max-w-2xl">
          <div className="mb-10 text-center pb-8 border-b border-black/10 dark:border-white/10">
            <span className={`text-xs uppercase tracking-widest font-mono ${currentTheme.accent}`}>
              Capítulo {currentChapterIndex + 1}
            </span>
            <h1 className="mt-2 text-2xl sm:text-3xl font-serif font-bold tracking-tight">
              {currentChapter.title}
            </h1>
            <p className={`mt-2 text-xs ${currentTheme.muted} italic`}>
              De la obra: "{book.title}" por {book.author}
            </p>
          </div>

          {/* Prose content */}
          <div 
            className="font-serif leading-relaxed text-justify space-y-6"
            style={{ fontSize: `${fontSize}px`, lineHeight: 1.85 }}
          >
            {currentChapter.content.split('\n\n').map((paragraph, idx) => (
              <p key={idx} className="indent-6 sm:indent-8 first:indent-0">
                {paragraph}
              </p>
            ))}
          </div>

          {/* Chapter completion card */}
          <div className={`mt-16 p-6 rounded-2xl border ${currentTheme.card} text-center`}>
            <h4 className="font-serif font-bold text-lg mb-2">
              ¿Te ha gustado este adelanto?
            </h4>
            <p className={`text-sm ${currentTheme.muted} max-w-md mx-auto mb-5 leading-relaxed`}>
              Descarga la obra completa con todos sus capítulos en formato {book.fileType} para tu lector digital favorito o computadora.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => onDownload(book)}
                className="px-5 py-2.5 text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl cursor-pointer transition-colors shadow-md"
              >
                {book.isLiberated || book.pricingType === 'free' ? 'Descargar Libro Gratis' : `Adquirir Libro (${book.price > 0 ? `$${book.price}` : 'Paga lo que quieras'})`}
              </button>
            </div>
          </div>
        </article>
      </main>

      {/* Reader Bottom Navigation */}
      <footer className={`h-14 px-4 sm:px-8 border-t ${currentTheme.header} flex items-center justify-between shrink-0`}>
        <button
          onClick={() => setCurrentChapterIndex((i) => Math.max(0, i - 1))}
          disabled={currentChapterIndex === 0}
          className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${currentTheme.muted} hover:text-white`}
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Capítulo anterior</span>
        </button>

        <span className={`text-xs font-mono tabular-nums ${currentTheme.muted}`}>
          {currentChapterIndex + 1} / {chapters.length}
        </span>

        <button
          onClick={() => setCurrentChapterIndex((i) => Math.min(chapters.length - 1, i + 1))}
          disabled={currentChapterIndex === chapters.length - 1}
          className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${currentTheme.muted} hover:text-white`}
        >
          <span>Siguiente capítulo</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </footer>
    </div>
  );
};
