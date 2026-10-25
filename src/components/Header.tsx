import React from 'react';
import { BookOpen, ShieldCheck, Lock, Unlock, ShoppingBag, Plus, Folder } from 'lucide-react';

interface HeaderProps {
  currentView: 'catalog' | 'author';
  onViewChange: (view: 'catalog' | 'author') => void;
  onOpenUpload: () => void;
  onOpenFolderManage?: () => void;
  onOpenAdminLogin: () => void;
  isAdmin: boolean;
  onLogoutAdmin: () => void;
  liberatedCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onViewChange,
  onOpenUpload,
  onOpenFolderManage,
  onOpenAdminLogin,
  isAdmin,
  onLogoutAdmin,
  liberatedCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Brand title wordmark */}
          <button
            onClick={() => onViewChange('catalog')}
            className="flex items-center gap-2.5 text-left group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 rounded-md"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
              <BookOpen className="w-4 h-4" />
            </div>
            <span className="text-xl font-bold tracking-tight text-white font-serif whitespace-nowrap shrink-0">
              LibroLibre
            </span>
          </button>

          {/* Zone 2: 4 clean single-line navigation links */}
          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-300">
            <button
              onClick={() => {
                onViewChange('catalog');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`hover:text-amber-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                currentView === 'catalog' ? 'text-amber-400 font-semibold' : ''
              }`}
            >
              Catálogo de Obras
            </button>
            <button
              onClick={() => {
                onViewChange('catalog');
                const el = document.getElementById('liberated-section');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hover:text-amber-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-1.5"
            >
              <span>Libros Liberados</span>
              {liberatedCount > 0 && (
                <span className="text-[11px] font-mono font-semibold px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {liberatedCount}
                </span>
              )}
            </button>
            <button
              onClick={() => {
                onViewChange('catalog');
                const el = document.getElementById('chile-payments');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hover:text-amber-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Pagos en Chile (BancoEstado / MP)
            </button>
            <button
              onClick={() => {
                onViewChange('catalog');
                const el = document.getElementById('author-bio');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hover:text-amber-400 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Sobre el Autor
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-3 shrink-0">
            {isAdmin ? (
              <div className="flex items-center gap-2">
                {/* Direct access to Folder Management from anywhere */}
                {onOpenFolderManage && (
                  <button
                    onClick={onOpenFolderManage}
                    className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-amber-300 bg-amber-950/60 hover:bg-amber-900/80 border border-amber-500/40 rounded-lg transition-colors whitespace-nowrap cursor-pointer shadow-sm"
                    title="Crear y Gestionar Carpetas Temáticas (Medicina, Terror, Romántica...)"
                  >
                    <Folder className="w-3.5 h-3.5 text-amber-400" />
                    <span>Carpetas</span>
                  </button>
                )}

                {currentView === 'author' ? (
                  <>
                    <button
                      onClick={onOpenUpload}
                      className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap cursor-pointer shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Subir Libro</span>
                    </button>
                    <button
                      onClick={() => onViewChange('catalog')}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Ver Tienda</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={onOpenUpload}
                      className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap cursor-pointer shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Subir Libro</span>
                    </button>
                    <button
                      onClick={() => onViewChange('author')}
                      className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap cursor-pointer shadow-sm"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>Panel Admin</span>
                    </button>
                  </>
                )}

                <button
                  onClick={onLogoutAdmin}
                  className="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Bloquear y Salir de Admin"
                >
                  <Unlock className="w-4 h-4 text-emerald-400" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAdminLogin}
                className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-amber-500/50 rounded-lg transition-colors whitespace-nowrap cursor-pointer shadow-sm"
              >
                <Lock className="w-3.5 h-3.5 text-amber-400" />
                <span>Modo Administrador</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
