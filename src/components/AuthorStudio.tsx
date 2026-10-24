import React, { useState } from 'react';
import { Book, AuthorProfile, Coupon, Transaction, formatCurrency } from '../types/book';
import { 
  BookOpen, Sparkles, Plus, Settings, Tag, ArrowDownToLine, 
  DollarSign, Trash2, Edit3, Download, Check, ShieldAlert, ShieldCheck,
  Building2, Smartphone, CreditCard, Lock, KeyRound, Copy, Camera,
  Upload, Loader2, FileText, Search, LayoutGrid, List, X, Library, RefreshCw
} from 'lucide-react';
import { BookshelfView } from './BookshelfView';
import { downloadBookFile } from '../utils/fileDownloader';

interface AuthorStudioProps {
  books: Book[];
  authorProfile: AuthorProfile;
  coupons: Coupon[];
  transactions: Transaction[];
  onOpenUpload: () => void;
  onOpenPaymentSettings: () => void;
  onOpenEditProfile: () => void;
  onToggleLiberate: (bookId: string) => void;
  onRequestDeleteBook: (book: Book) => void;
  onAddCoupon: (newCoupon: Coupon) => void;
  onDeleteCoupon: (couponId: string) => void;
  onResetCatalog: () => void;
  onLogoutAdmin: () => void;
  onDeleteAllDemoBooks?: () => void;
  onCleanDuplicates?: () => void;
  onUpdateBookFile?: (bookId: string, fileInfo: { downloadUrl: string; fileName: string; fileSize: string; fileType: string }) => Promise<void>;
}

export const AuthorStudio: React.FC<AuthorStudioProps> = ({
  books,
  authorProfile,
  coupons,
  transactions,
  onOpenUpload,
  onOpenPaymentSettings,
  onOpenEditProfile,
  onToggleLiberate,
  onRequestDeleteBook,
  onAddCoupon,
  onDeleteCoupon,
  onResetCatalog,
  onLogoutAdmin,
  onDeleteAllDemoBooks,
  onCleanDuplicates,
  onUpdateBookFile,
}) => {
  const [activeTab, setActiveTab] = useState<'books' | 'payments' | 'coupons' | 'history'>('books');
  const [filterType, setFilterType] = useState<'all' | 'liberated' | 'paid' | 'free'>('all');
  const [studioViewMode, setStudioViewMode] = useState<'bookshelf' | 'grid4' | 'table'>('bookshelf');
  const [bookSearchQuery, setBookSearchQuery] = useState('');
  const [uploadingBookId, setUploadingBookId] = useState<string | null>(null);

  const handleAttachFileToBook = async (bookId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const ext = (file.name.split('.').pop() || 'PDF').toUpperCase();
      setUploadingBookId(bookId);
      try {
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const res = await fetch('/api/upload-book-file', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                fileName: file.name,
                fileData: reader.result,
                fileType: ext,
              }),
            });
            const data = await res.json();
            if (data.success && data.downloadUrl && onUpdateBookFile) {
              await onUpdateBookFile(bookId, {
                downloadUrl: data.downloadUrl,
                fileName: file.name,
                fileSize: data.fileSize || `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
                fileType: ext,
              });
            }
          } catch (err) {
            console.error('Error attaching file to book:', err);
          } finally {
            setUploadingBookId(null);
          }
        };
        reader.readAsDataURL(file);
      } catch (err) {
        setUploadingBookId(null);
      }
    }
  };
  
  // Coupon form state
  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponDiscount, setNewCouponDiscount] = useState<number>(100);
  const [newCouponDesc, setNewCouponDesc] = useState('');

  // Calculations
  const totalBooks = books.length;
  const liberatedBooks = books.filter((b) => b.isLiberated).length;
  const totalDownloads = books.reduce((acc, b) => acc + (b.downloadCount || 0), 0);
  const totalRevenue = transactions.reduce((acc, t) => acc + (t.amount || 0), 0);
  const chile = authorProfile.paymentMethods.chile;

  // Filtered books with live search
  const filteredBooks = books.filter((b) => {
    if (filterType === 'liberated' && !b.isLiberated) return false;
    if (filterType === 'paid' && (b.isLiberated || b.pricingType !== 'paid')) return false;
    if (filterType === 'free' && b.pricingType !== 'free') return false;

    if (bookSearchQuery.trim()) {
      const q = bookSearchQuery.toLowerCase().trim();
      const matches =
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.genre.toLowerCase().includes(q) ||
        (b.tags && b.tags.some((t) => t.toLowerCase().includes(q))) ||
        (b.fileType && b.fileType.toLowerCase().includes(q));
      if (!matches) return false;
    }

    return true;
  });

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCouponCode.trim()) return;
    const coupon: Coupon = {
      id: `c-${Date.now()}`,
      code: newCouponCode.trim().toUpperCase(),
      discountPercent: Number(newCouponDiscount) || 100,
      uses: 0,
      active: true,
      description: newCouponDesc.trim() || 'Cupón generado en Chile',
    };
    onAddCoupon(coupon);
    setNewCouponCode('');
    setNewCouponDesc('');
  };

  const exportDataJson = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      author: authorProfile,
      books,
      coupons,
      transactions,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `librolibre_chile_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-widest text-emerald-400 font-mono font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Modo Administrador Activo · Chile</span>
            </span>
            <span className="text-xs text-slate-500">·</span>
            <span className="text-xs text-slate-400">BancoEstado / Mercado Pago</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-white mt-1">
            Gestión Editorial & Liberación de Libros
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Los libros permanecen guardados en la plataforma indefinidamente hasta que tú como administrador decidas borrarlos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={onOpenEditProfile}
            className="px-3.5 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors flex items-center gap-2 cursor-pointer shadow-md shadow-amber-950/20"
          >
            <Camera className="w-4 h-4" />
            <span>Modificar Mi Foto & Perfil</span>
          </button>

          <button
            onClick={onOpenPaymentSettings}
            className="px-3.5 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Settings className="w-4 h-4 text-amber-400" />
            <span>Configurar Pagos Chile & PIN</span>
          </button>

          <button
            onClick={onOpenUpload}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Subir Nuevo Libro</span>
          </button>

          <button
            onClick={onLogoutAdmin}
            className="px-3 py-2 text-xs font-medium text-rose-300 bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/60 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
            title="Cerrar sesión de administrador"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Cerrar Admin</span>
          </button>
        </div>
      </div>

      {/* Author Profile Quick Preview Card with photo change */}
      <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div 
            onClick={onOpenEditProfile}
            className="relative group cursor-pointer w-14 h-14 rounded-full overflow-hidden border-2 border-amber-500/40 p-0.5 shadow-md bg-slate-950 shrink-0"
            title="Tocar para cambiar foto"
          >
            <img
              src={authorProfile.avatarUrl}
              alt={authorProfile.name}
              className="w-full h-full object-cover rounded-full"
            />
            <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-4 h-4 text-white" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-serif font-bold text-base text-white">{authorProfile.name}</h3>
              <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-500/30">Modo Admin</span>
            </div>
            <p className="text-xs text-amber-400/90">{authorProfile.tagline}</p>
            <p className="text-[11px] text-slate-500 font-mono">{authorProfile.email}</p>
          </div>
        </div>

        <button
          onClick={onOpenEditProfile}
          className="px-3.5 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
        >
          <Camera className="w-3.5 h-3.5 text-amber-400" />
          <span>Cambiar Foto del Autor</span>
        </button>
      </div>

      {/* Security notice box */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed text-slate-300">
          <strong className="text-white">Custodia Permanente del Catálogo:</strong> Tus libros subidos se mantienen seguros en la plataforma. Ningún visitante ni lector puede alterarlos ni borrarlos. Para borrar cualquier título, se solicita tu clave de administrador.
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Libros Custodiados</span>
            <BookOpen className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white tabular-nums">{totalBooks}</div>
          <div className="text-[11px] text-slate-500 mt-1">Permanentes en catálogo</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-emerald-900/50 bg-emerald-950/10">
          <div className="flex items-center justify-between text-emerald-400 text-xs mb-2">
            <span>Obras Liberadas Gratis</span>
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-300 tabular-nums">{liberatedBooks}</div>
          <div className="text-[11px] text-emerald-400/70 mt-1">Disponibles sin costo</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Descargas en Chile</span>
            <ArrowDownToLine className="w-4 h-4 text-sky-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white tabular-nums">{totalDownloads.toLocaleString()}</div>
          <div className="text-[11px] text-slate-500 mt-1">Lectores totales</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
            <span>Ingresos en Chile</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">{formatCurrency(totalRevenue, 'CLP')}</div>
          <div className="text-[11px] text-slate-500 mt-1">BancoEstado & MP</div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('books')}
          className={`px-4 py-2 text-xs font-medium rounded-lg cursor-pointer whitespace-nowrap transition-colors ${
            activeTab === 'books'
              ? 'bg-amber-400 text-slate-950 font-semibold shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          Mis Libros & Liberación Rápida ({totalBooks})
        </button>

        <button
          onClick={() => setActiveTab('payments')}
          className={`px-4 py-2 text-xs font-medium rounded-lg cursor-pointer whitespace-nowrap transition-colors ${
            activeTab === 'payments'
              ? 'bg-amber-400 text-slate-950 font-semibold shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          Pagos en Chile (BancoEstado / MP)
        </button>

        <button
          onClick={() => setActiveTab('coupons')}
          className={`px-4 py-2 text-xs font-medium rounded-lg cursor-pointer whitespace-nowrap transition-colors ${
            activeTab === 'coupons'
              ? 'bg-amber-400 text-slate-950 font-semibold shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          Cupones de Gratuidad ({coupons.length})
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2 text-xs font-medium rounded-lg cursor-pointer whitespace-nowrap transition-colors ${
            activeTab === 'history'
              ? 'bg-amber-400 text-slate-950 font-semibold shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          Historial de Descargas ({transactions.length})
        </button>
      </div>

      {/* TAB 1: BOOKS & ONE-CLICK LIBERATION */}
      {activeTab === 'books' && (
        <div className="space-y-4">
          {/* Controls Bar: Search & View Switcher */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 bg-slate-900/80 border border-slate-800 rounded-xl">
            {/* Live Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={bookSearchQuery}
                onChange={(e) => setBookSearchQuery(e.target.value)}
                placeholder="Buscar por título, autor o género..."
                className="w-full pl-9 pr-8 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400/60"
              />
              {bookSearchQuery && (
                <button
                  type="button"
                  onClick={() => setBookSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                  title="Limpiar búsqueda"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter buttons & View switcher */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setFilterType('all')}
                  className={`px-2.5 py-1.5 text-xs rounded-lg cursor-pointer transition-colors ${
                    filterType === 'all' ? 'bg-slate-800 text-white font-medium border border-slate-700' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Todos ({books.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('liberated')}
                  className={`px-2.5 py-1.5 text-xs rounded-lg cursor-pointer transition-colors ${
                    filterType === 'liberated' ? 'bg-emerald-950 text-emerald-300 font-medium border border-emerald-800/60' : 'text-slate-400 hover:text-emerald-300'
                  }`}
                >
                  Liberados ({liberatedBooks})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterType('paid')}
                  className={`px-2.5 py-1.5 text-xs rounded-lg cursor-pointer transition-colors ${
                    filterType === 'paid' ? 'bg-amber-950/60 text-amber-300 font-medium border border-amber-800/60' : 'text-slate-400 hover:text-amber-300'
                  }`}
                >
                  De Pago ({books.filter((b) => !b.isLiberated && b.pricingType === 'paid').length})
                </button>

                {onDeleteAllDemoBooks && books.some((b) => ['book-1', 'book-2', 'book-3', 'book-4'].includes(b.id)) && (
                  <button
                    type="button"
                    onClick={onDeleteAllDemoBooks}
                    className="px-2.5 py-1.5 text-xs rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/50 cursor-pointer flex items-center gap-1 transition-colors"
                    title="Eliminar libros de prueba para ver solo tus libros subidos"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span className="hidden sm:inline">Limpiar Demo</span>
                  </button>
                )}

                {onCleanDuplicates && (
                  <button
                    type="button"
                    onClick={onCleanDuplicates}
                    className="px-2.5 py-1.5 text-xs rounded-lg bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-800/50 cursor-pointer flex items-center gap-1 transition-colors"
                    title="Detectar y eliminar libros repetidos en la base de datos"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span className="hidden sm:inline">Limpiar Duplicados</span>
                  </button>
                )}
              </div>

              {/* View Layout Switcher (Estantería / Cuadrícula 4 / Tabla) */}
              <div className="flex items-center gap-1 p-0.5 bg-slate-950 border border-slate-800 rounded-lg ml-auto">
                <button
                  type="button"
                  onClick={() => setStudioViewMode('bookshelf')}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors ${
                    studioViewMode === 'bookshelf'
                      ? 'bg-amber-400 text-slate-950 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Ver en estantería de madera clásica"
                >
                  <Library className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Estantería</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStudioViewMode('grid4')}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors ${
                    studioViewMode === 'grid4'
                      ? 'bg-amber-400 text-slate-950 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Ver en cuadrículas de 4"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Cuadrícula 4</span>
                </button>
                <button
                  type="button"
                  onClick={() => setStudioViewMode('table')}
                  className={`px-2.5 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors ${
                    studioViewMode === 'table'
                      ? 'bg-amber-400 text-slate-950 font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Ver en tabla detallada"
                >
                  <List className="w-3.5 h-3.5" />
                  <span className="text-[11px]">Tabla</span>
                </button>
              </div>
            </div>
          </div>

          {filteredBooks.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/50 rounded-xl border border-slate-800">
              <BookOpen className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-300">No hay libros que coincidan con la búsqueda</p>
              <button
                type="button"
                onClick={() => {
                  setBookSearchQuery('');
                  setFilterType('all');
                }}
                className="mt-3 px-3 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg cursor-pointer"
              >
                Limpiar filtros
              </button>
            </div>
          ) : studioViewMode === 'bookshelf' ? (
            /* ESTANTERÍA DE MADERA CLÁSICA */
            <BookshelfView
              books={filteredBooks}
              onSelectBook={(book) => {
                // Trigger preview or details
              }}
              onPreviewBook={(book) => {
                // Reading preview
              }}
              onDownloadBook={(book) => {
                downloadBookFile(book);
              }}
              isAuthorMode={true}
              onToggleLiberate={onToggleLiberate}
              onRequestDeleteBook={onRequestDeleteBook}
              onAttachFile={handleAttachFileToBook}
              uploadingBookId={uploadingBookId}
            />
          ) : studioViewMode === 'grid4' ? (
            /* CUADRÍCULA PEQUEÑA DE 4 (Solicitud del usuario) */
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredBooks.map((b) => (
                <div
                  key={b.id}
                  className="group bg-slate-900 rounded-xl border border-slate-800 hover:border-slate-700 transition-all flex flex-col overflow-hidden shadow-lg hover:shadow-black/50"
                >
                  {/* Small Book Cover with Overlay Tags */}
                  <div className="relative aspect-[3/4] w-full bg-slate-950 overflow-hidden">
                    <img
                      src={b.coverUrl}
                      alt={b.title}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                      loading="lazy"
                    />

                    {/* Status Chip */}
                    <div className="absolute top-2 left-2">
                      {b.isLiberated ? (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-950/90 border border-emerald-500/50 text-emerald-300 font-bold text-[10px] tracking-wide shadow-md flex items-center gap-1 backdrop-blur-sm">
                          <Sparkles className="w-2.5 h-2.5" />
                          <span>LIBERADO $0</span>
                        </span>
                      ) : b.pricingType === 'free' ? (
                        <span className="px-2 py-0.5 rounded-md bg-amber-950/90 border border-amber-500/50 text-amber-300 font-bold text-[10px] tracking-wide shadow-md backdrop-blur-sm">
                          GRATIS
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-slate-950/90 border border-slate-700 text-amber-300 font-mono font-bold text-[10px] tracking-wide shadow-md backdrop-blur-sm">
                          {formatCurrency(b.price, 'CLP')}
                        </span>
                      )}
                    </div>

                    {/* Admin Delete Action */}
                    <button
                      type="button"
                      onClick={() => onRequestDeleteBook(b)}
                      className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-slate-950/80 border border-rose-500/40 text-rose-400 hover:text-white hover:bg-rose-600/60 flex items-center justify-center transition-colors shadow-md cursor-pointer"
                      title="Eliminar libro"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Card Content */}
                  <div className="p-3.5 flex-1 flex flex-col justify-between">
                    <div>
                      {/* Genre & Format */}
                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mb-1 truncate font-medium">
                        <span className="text-amber-400 uppercase tracking-wider truncate">{b.genre}</span>
                        <span aria-hidden="true" className="text-slate-600">·</span>
                        <span className="shrink-0">{b.pageCount} pág</span>
                        <span aria-hidden="true" className="text-slate-600">·</span>
                        <span className="font-mono text-slate-400 shrink-0">{b.fileType}</span>
                      </div>

                      {/* Title & Author */}
                      <h4
                        className="font-serif font-bold text-sm text-white line-clamp-1 group-hover:text-amber-400 transition-colors"
                        title={b.title}
                      >
                        {b.title}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                        Por {b.author}
                      </p>

                      {/* Digital File Status */}
                      <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                        <div className="truncate">
                          {b.downloadUrl ? (
                            <span className="inline-flex items-center gap-1 text-emerald-400 font-medium truncate">
                              <Check className="w-3 h-3 text-emerald-400 shrink-0" />
                              <span className="truncate">{b.fileName || `${b.fileType} en nube`}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-400 font-medium truncate">
                              <span>⚠️ Falta archivo</span>
                            </span>
                          )}
                        </div>
                        <span className="text-slate-400 font-mono text-[10px] shrink-0 ml-1">
                          {b.downloadCount.toLocaleString()} descargas
                        </span>
                      </div>
                    </div>

                    {/* Quick Management Buttons */}
                    <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-2">
                      {/* One-Click Liberate Button */}
                      {b.pricingType === 'free' ? (
                        <div className="text-center py-1 text-[11px] text-slate-500 font-mono">
                          Siempre gratuito
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => onToggleLiberate(b.id)}
                          className={`w-full py-1.5 px-2.5 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-sm ${
                            b.isLiberated
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                              : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold'
                          }`}
                          title={b.isLiberated ? 'Hacer de pago nuevamente' : 'Liberar gratis para todos los lectores'}
                        >
                          <Sparkles className="w-3 h-3 shrink-0" />
                          <span className="truncate">{b.isLiberated ? 'Cobrar de nuevo' : '¡Liberar Gratis Ahora!'}</span>
                        </button>
                      )}

                      {/* Upload / Replace Digital File */}
                      <label className="w-full py-1.5 px-2.5 rounded-lg text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer transition-colors flex items-center justify-center gap-1.5 shadow-sm">
                        {uploadingBookId === b.id ? (
                          <>
                            <Loader2 className="w-3 h-3 animate-spin text-amber-400 shrink-0" />
                            <span className="truncate">Subiendo...</span>
                          </>
                        ) : (
                          <>
                            <Upload className="w-3 h-3 text-amber-400 shrink-0" />
                            <span className="truncate">{b.downloadUrl ? 'Cambiar archivo' : 'Subir archivo original'}</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept=".pdf,.epub,.mobi,.docx,.txt"
                          disabled={uploadingBookId === b.id}
                          onChange={(e) => handleAttachFileToBook(b.id, e)}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* TABLA DETALLADA ALTERNATIVA */
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800 uppercase font-mono tracking-wider">
                    <tr>
                      <th className="py-3 px-4">Portada & Obra</th>
                      <th className="py-3 px-4">Género / Archivo</th>
                      <th className="py-3 px-4">Precio Oficial Chile</th>
                      <th className="py-3 px-4">Estado de Liberación</th>
                      <th className="py-3 px-4 text-center">Acción Inmediata</th>
                      <th className="py-3 px-4 text-center">Archivo Digital</th>
                      <th className="py-3 px-4 text-right">Descargas</th>
                      <th className="py-3 px-4 text-right">Borrar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {filteredBooks.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-850/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={b.coverUrl}
                              alt={b.title}
                              className="w-10 h-14 object-cover rounded bg-slate-950 shrink-0 border border-slate-800"
                            />
                            <div>
                              <div className="font-serif font-bold text-sm text-white line-clamp-1">{b.title}</div>
                              <div className="text-[11px] text-slate-400">Por {b.author}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div>{b.genre}</div>
                          <div className="font-mono text-[11px] text-slate-500">{b.fileType} · {b.fileSize}</div>
                          {b.downloadUrl ? (
                            <div className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-medium mt-1">
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span>Archivo en la nube</span>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1 text-[10px] text-amber-400 font-medium mt-1">
                              <span>⚠️ Falta subir archivo</span>
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4 font-mono">
                          {b.pricingType === 'free' ? (
                            <span className="text-slate-400">Siempre Gratis</span>
                          ) : b.pricingType === 'pwyw' ? (
                            <span className="text-amber-400">Aporte (min {formatCurrency(b.allowPwywMin || 1000, 'CLP')})</span>
                          ) : (
                            <span className="text-white font-semibold">{formatCurrency(b.price, 'CLP')}</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          {b.isLiberated ? (
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-950/70 border border-emerald-800 text-emerald-300 font-medium text-[11px]">
                              <Sparkles className="w-3 h-3 text-emerald-400" />
                              <span>LIBERADO GRATIS</span>
                            </div>
                          ) : b.pricingType === 'free' ? (
                            <span className="text-slate-400 font-medium">Gratis permanente</span>
                          ) : (
                            <span className="text-slate-400 font-medium">Bloqueado a Pago</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          {b.pricingType === 'free' ? (
                            <span className="text-[11px] text-slate-500 italic">Es gratuito</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onToggleLiberate(b.id)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center justify-center gap-1.5 mx-auto shadow-sm ${
                                b.isLiberated
                                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold'
                              }`}
                              title={b.isLiberated ? 'Volver a cobrar este libro' : 'Liberar gratis inmediatamente para todos los lectores'}
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>{b.isLiberated ? 'Cobrar de nuevo' : '¡Liberar Gratis Ahora!'}</span>
                            </button>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <label className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 cursor-pointer transition-colors shadow-sm">
                            {uploadingBookId === b.id ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
                                <span>Subiendo...</span>
                              </>
                            ) : (
                              <>
                                <Upload className="w-3.5 h-3.5 text-amber-400" />
                                <span>{b.downloadUrl ? 'Cambiar archivo' : 'Subir archivo'}</span>
                              </>
                            )}
                            <input
                              type="file"
                              accept=".pdf,.epub,.mobi,.docx,.txt"
                              disabled={uploadingBookId === b.id}
                              onChange={(e) => handleAttachFileToBook(b.id, e)}
                              className="hidden"
                            />
                          </label>
                        </td>

                        <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-200">
                          {b.downloadCount.toLocaleString()}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => onRequestDeleteBook(b)}
                            className="px-2.5 py-1.5 text-xs text-rose-400 hover:text-white hover:bg-rose-600/30 border border-rose-800/40 rounded-lg transition-colors cursor-pointer flex items-center gap-1 ml-auto"
                            title="Borrar libro (Exclusivo Administrador)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Borrar</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ACTIVE CHILEAN PAYMENT METHODS */}
      {activeTab === 'payments' && (
        <div className="space-y-6">
          <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between">
            <div>
              <h3 className="font-serif font-bold text-lg text-white">
                Métodos de Cobro Configurados en Chile
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Tus compradores en Chile transferirán directamente a estas cuentas.
              </p>
            </div>
            <button
              onClick={onOpenPaymentSettings}
              className="px-4 py-2 text-xs font-semibold bg-amber-400 text-slate-950 rounded-xl hover:bg-amber-300 cursor-pointer"
            >
              Modificar Cuentas & RUT
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* BancoEstado / CuentaRUT */}
            <div className="p-5 rounded-xl bg-slate-900 border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-amber-400" />
                  <span className="font-bold text-white text-sm">BancoEstado ({chile.bancoEstado.accountType})</span>
                </div>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                  chile.bancoEstado.enabled ? 'bg-emerald-950 text-emerald-400' : 'bg-slate-800 text-slate-500'
                }`}>
                  {chile.bancoEstado.enabled ? 'ACTIVO' : 'INACTIVO'}
                </span>
              </div>
              <div className="text-xs text-slate-300 bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-1.5 font-mono">
                <div><span className="text-slate-500">RUT:</span> <strong className="text-amber-300">{chile.bancoEstado.rut}</strong></div>
                <div><span className="text-slate-500">Cuenta:</span> <strong className="text-white">{chile.bancoEstado.accountNumber}</strong></div>
                <div><span className="text-slate-500">Titular:</span> <span className="text-slate-300 font-sans">{chile.bancoEstado.holderName}</span></div>
                <div><span className="text-slate-500">Aviso:</span> <span className="text-amber-400 font-sans">{chile.bancoEstado.notifyEmail}</span></div>
              </div>
            </div>

            {/* Mercado Pago Chile */}
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-cyan-400" />
                  <span className="font-bold text-white text-sm">Mercado Pago Chile</span>
                </div>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                  chile.mercadoPagoChile.enabled ? 'bg-emerald-950 text-emerald-400' : 'bg-slate-800 text-slate-500'
                }`}>
                  {chile.mercadoPagoChile.enabled ? 'ACTIVO' : 'INACTIVO'}
                </span>
              </div>
              <p className="text-xs text-slate-400">Alias de cobro:</p>
              <div className="font-mono text-xs text-cyan-300 bg-slate-950 p-2 rounded border border-slate-800 truncate">
                {chile.mercadoPagoChile.qrOrCode || 'camilo.libros.mp'}
              </div>
            </div>

            {/* Webpay Plus */}
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-emerald-400" />
                  <span className="font-bold text-white text-sm">Webpay Plus / Redcompra</span>
                </div>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                  chile.webpay.enabled ? 'bg-emerald-950 text-emerald-400' : 'bg-slate-800 text-slate-500'
                }`}>
                  {chile.webpay.enabled ? 'ACTIVO' : 'INACTIVO'}
                </span>
              </div>
              <p className="text-xs text-slate-400">Proveedor Transbank habilitado para tarjetas bancarias chilenas.</p>
            </div>

            {/* Mach / Tenpo */}
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-purple-400" />
                  <span className="font-bold text-white text-sm">Mach / Tenpo</span>
                </div>
                <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                  chile.machTenpo.enabled ? 'bg-emerald-950 text-emerald-400' : 'bg-slate-800 text-slate-500'
                }`}>
                  {chile.machTenpo.enabled ? 'ACTIVO' : 'INACTIVO'}
                </span>
              </div>
              <p className="text-xs text-slate-400">Envío directo de billetera digital chilena.</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: COUPONS (GRATUITY CODES) */}
      {activeTab === 'coupons' && (
        <div className="space-y-6">
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
            <h3 className="font-serif font-bold text-lg text-white mb-1">
              Crear Cupones de Descarga Gratuita o Descuento
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Genera códigos para regalar libros a lectores en Chile, prensa, o como promoción en tus redes sociales.
            </p>

            <form onSubmit={handleCreateCoupon} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Código del cupón</label>
                <input
                  type="text"
                  required
                  value={newCouponCode}
                  onChange={(e) => setNewCouponCode(e.target.value)}
                  placeholder="Ej: CHILE2026"
                  className="w-full px-3 py-2 bg-slate-950 text-xs text-white rounded-lg border border-slate-800 uppercase font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Descuento (%)</label>
                <select
                  value={newCouponDiscount}
                  onChange={(e) => setNewCouponDiscount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 text-xs text-white rounded-lg border border-slate-800 cursor-pointer"
                >
                  <option value={100}>100% de Descuento (Gratis)</option>
                  <option value={50}>50% de Descuento</option>
                  <option value={25}>25% de Descuento</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Descripción / Destinatario</label>
                <input
                  type="text"
                  value={newCouponDesc}
                  onChange={(e) => setNewCouponDesc(e.target.value)}
                  placeholder="Para lectores en Chile"
                  className="w-full px-3 py-2 bg-slate-950 text-xs text-white rounded-lg border border-slate-800"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2 px-4 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg cursor-pointer transition-colors"
                >
                  Crear Cupón
                </button>
              </div>
            </form>
          </div>

          {/* Coupons List */}
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 uppercase font-mono border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4">Beneficio</th>
                  <th className="py-3 px-4">Descripción</th>
                  <th className="py-3 px-4 text-center">Usos</th>
                  <th className="py-3 px-4 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {coupons.map((c) => (
                  <tr key={c.id}>
                    <td className="py-3 px-4 font-mono font-bold text-amber-400">{c.code}</td>
                    <td className="py-3 px-4 font-semibold text-emerald-400">
                      {c.discountPercent === 100 ? '100% GRATIS' : `${c.discountPercent}% OFF`}
                    </td>
                    <td className="py-3 px-4 text-slate-400">{c.description}</td>
                    <td className="py-3 px-4 text-center font-mono">{c.uses} descargas</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onDeleteCoupon(c.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                        title="Eliminar cupón"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: TRANSACTION & DOWNLOAD HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-lg text-white">
              Historial de Descargas de Lectores
            </h3>
            <button
              onClick={exportDataJson}
              className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar Respaldo JSON</span>
            </button>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 uppercase font-mono border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Fecha & Hora</th>
                    <th className="py-3 px-4">Libro Adquirido</th>
                    <th className="py-3 px-4">Lector</th>
                    <th className="py-3 px-4">Modalidad</th>
                    <th className="py-3 px-4">Monto (CLP)</th>
                    <th className="py-3 px-4 text-right">Formato</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-850/50">
                      <td className="py-3 px-4 font-mono text-slate-400">{tx.date}</td>
                      <td className="py-3 px-4 font-medium text-white">{tx.bookTitle}</td>
                      <td className="py-3 px-4">
                        <div className="text-slate-200">{tx.readerName}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{tx.readerEmail}</div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${
                          tx.type === 'liberated' || tx.type === 'free'
                            ? 'bg-emerald-950 text-emerald-400'
                            : 'bg-amber-950 text-amber-300'
                        }`}>
                          {tx.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-white">
                        {formatCurrency(tx.amount, 'CLP')}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-400">
                        {tx.downloadFormat}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Footer Tools: Reset to factory seed or backup */}
      <div className="pt-8 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-500">
        <div>
          <span>LibroLibre Chile · Custodia Permanente & Modo Administrador</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={exportDataJson}
            className="hover:text-slate-300 underline cursor-pointer"
          >
            Descargar Respaldo JSON
          </button>
          <span>·</span>
          <button
            onClick={() => {
              if (confirm('¿Restablecer el catálogo inicial de demostración? Se recargarán las 4 obras maestras.')) {
                onResetCatalog();
              }
            }}
            className="hover:text-amber-400 underline cursor-pointer"
          >
            Restablecer Catálogo Demo
          </button>
        </div>
      </div>
    </div>
  );
};
