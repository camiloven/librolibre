import React from 'react';
import { Search, Sparkles, BookOpenCheck, ArrowDownToLine, HeartHandshake, Folder, Cloud, ExternalLink } from 'lucide-react';
import { BookFolder } from '../types/book';

interface HeroBannerProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedGenre: string;
  onGenreChange: (genre: string) => void;
  genres: string[];
  totalBooks: number;
  liberatedBooks: number;
  totalDownloads: number;
  folders?: BookFolder[];
  selectedFolderId?: string;
  onFolderChange?: (folderId: string) => void;
  onOpenFolderManage?: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  searchQuery,
  onSearchChange,
  selectedGenre,
  onGenreChange,
  genres,
  totalBooks,
  liberatedBooks,
  totalDownloads,
  folders = [],
  selectedFolderId = 'ALL',
  onFolderChange,
  onOpenFolderManage,
}) => {
  return (
    <section className="relative overflow-hidden pt-12 pb-10 bg-slate-950 border-b border-slate-900">
      {/* Subtle warm glow background accent */}
      <div 
        aria-hidden="true" 
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[720px] h-[320px] bg-amber-500/5 blur-[120px] pointer-events-none rounded-full"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs uppercase tracking-widest text-amber-400/90 font-medium mb-3">
            Editorial Independiente & Acceso Abierto
          </p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-bold text-slate-100 tracking-tight leading-tight text-balance">
            Libros creados por el autor, descargables directo para ti.
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-400 font-normal leading-relaxed max-w-2xl mx-auto text-balance">
            Explora títulos en formato digital (PDF y EPUB). Adquiere obras con distintas formas de pago o descárgalas sin costo cuando el autor decide liberarlas.
          </p>

          {/* Search bar */}
          <div className="mt-8 max-w-xl mx-auto relative">
            <div className="relative flex items-center">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Buscar por título, temática o palabras clave..."
                className="w-full pl-12 pr-4 py-3.5 bg-slate-900/90 text-sm text-slate-100 placeholder-slate-500 rounded-xl border border-slate-800 focus:outline-none focus:border-amber-500/60 focus:ring-2 focus:ring-amber-500/20 transition-all shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => onSearchChange('')}
                  className="absolute right-3 text-xs text-slate-400 hover:text-slate-200 px-2 py-1 rounded bg-slate-800"
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>

          {/* Functional Genre Filter Tabs (Buttons with click handlers) */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={() => onGenreChange('ALL')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                selectedGenre === 'ALL'
                  ? 'bg-amber-400 text-slate-950 font-semibold shadow-sm'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800/80'
              }`}
            >
              Todos los libros
            </button>
            <button
              onClick={() => onGenreChange('LIBERATED')}
              className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                selectedGenre === 'LIBERATED'
                  ? 'bg-emerald-500 text-slate-950 font-semibold shadow-sm'
                  : 'bg-emerald-950/30 text-emerald-300 hover:bg-emerald-950/60 border border-emerald-800/40'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Liberados & Gratuitos</span>
            </button>
            {genres.map((genre) => (
              <button
                key={genre}
                onClick={() => onGenreChange(genre)}
                className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  selectedGenre === genre
                    ? 'bg-amber-400 text-slate-950 font-semibold shadow-sm'
                    : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800/80'
                }`}
              >
                {genre}
              </button>
            ))}
          </div>

          {/* Thematic Folders (Medicina, Terror, Romántica, etc.) */}
          {onFolderChange && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5 pt-3 border-t border-slate-900/80">
              <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-semibold flex items-center gap-1 mr-1">
                <Folder className="w-3.5 h-3.5" />
                <span>Temáticas:</span>
              </span>
              <button
                type="button"
                onClick={() => onFolderChange('ALL')}
                className={`px-3 py-1 text-xs rounded-lg transition-colors cursor-pointer ${
                  selectedFolderId === 'ALL'
                    ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                    : 'bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                Todas las carpetas
              </button>

              {folders.map((folder) => (
                <button
                  key={folder.id}
                  type="button"
                  onClick={() => onFolderChange(selectedFolderId === folder.id ? 'ALL' : folder.id)}
                  className={`px-3 py-1 text-xs rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                    selectedFolderId === folder.id
                      ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
                      : 'bg-slate-900/90 text-amber-200/90 hover:text-white border border-amber-500/30 hover:border-amber-500/60'
                  }`}
                  title={folder.description || `Ver libros de ${folder.name}`}
                >
                  <span>📁 {folder.name}</span>
                  {folder.teraboxUrl && <span className="text-[10px] text-sky-400 font-mono">☁️</span>}
                </button>
              ))}

              {/* Quick Link to TeraBox if currently selected folder has one */}
              {(() => {
                const activeFolder = folders.find((f) => f.id === selectedFolderId);
                if (activeFolder?.teraboxUrl) {
                  return (
                    <a
                      href={activeFolder.teraboxUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 text-xs font-semibold rounded-lg bg-sky-500/25 hover:bg-sky-500/35 text-sky-300 hover:text-white border border-sky-400/50 transition-colors flex items-center gap-1.5 shadow-sm ml-1"
                      title={`Abrir carpeta "${activeFolder.name}" en TeraBox (1024 GB)`}
                    >
                      <Cloud className="w-3.5 h-3.5 text-sky-400" />
                      <span>Descargar desde TeraBox ({activeFolder.name})</span>
                      <ExternalLink className="w-3 h-3 text-sky-400" />
                    </a>
                  );
                }
                return null;
              })()}

              {onOpenFolderManage && (
                <button
                  type="button"
                  onClick={onOpenFolderManage}
                  className="px-2.5 py-1 text-xs font-semibold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
                  title="Crear y organizar carpetas temáticas de libros"
                >
                  <span>➕ {folders.length === 0 ? 'Crear Carpetas (Medicina, Terror...)' : 'Gestionar'}</span>
                </button>
              )}
            </div>
          )}
        </div>


        {/* Proof & Catalog Numbers */}
        <div className="mt-12 pt-8 border-t border-slate-900 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 text-amber-400 mb-1">
              <BookOpenCheck className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">En Catálogo</span>
            </div>
            <div className="text-2xl font-bold text-white font-mono tabular-nums">{totalBooks}</div>
            <div className="text-xs text-slate-500 mt-0.5">Obras publicadas</div>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 text-emerald-400 mb-1">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">Liberados</span>
            </div>
            <div className="text-2xl font-bold text-emerald-400 font-mono tabular-nums">{liberatedBooks}</div>
            <div className="text-xs text-slate-500 mt-0.5">Disponibles sin costo</div>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 text-sky-400 mb-1">
              <ArrowDownToLine className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">Descargas</span>
            </div>
            <div className="text-2xl font-bold text-white font-mono tabular-nums">{totalDownloads.toLocaleString()}</div>
            <div className="text-xs text-slate-500 mt-0.5">Lectores alcanzados</div>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center gap-1.5 text-purple-400 mb-1">
              <HeartHandshake className="w-4 h-4" />
              <span className="text-xs uppercase tracking-wider text-slate-400 font-medium">Acceso</span>
            </div>
            <div className="text-2xl font-bold text-white font-mono tabular-nums">100% Directo</div>
            <div className="text-xs text-slate-500 mt-0.5">Sin intermediarios</div>
          </div>
        </div>
      </div>
    </section>
  );
};
