import React, { useState } from 'react';
import { Book, BookFolder, PricingType } from '../types/book';
import { 
  X, Sparkles, DollarSign, Folder, Check, AlertCircle, 
  FileText, ShieldCheck, Tag, Loader2 
} from 'lucide-react';

interface EditBookModalProps {
  book: Book;
  folders: BookFolder[];
  onClose: () => void;
  onSaveBook?: (updatedBook: Book) => Promise<void> | void;
  onSave?: (updatedBook: Book) => Promise<void> | void;
  onSaveFolder?: (folder: BookFolder) => Promise<void> | void;
  onOpenFolderManager?: () => void;
}

export const EditBookModal: React.FC<EditBookModalProps> = ({
  book,
  folders,
  onClose,
  onSaveBook,
  onSave,
  onSaveFolder,
  onOpenFolderManager,
}) => {
  const saveFn = onSaveBook || onSave || (() => {});
  // Title & Editorial fields
  const [title, setTitle] = useState(book.title || '');
  const [subtitle, setSubtitle] = useState(book.subtitle || '');
  const [author, setAuthor] = useState(book.author || '');
  const [synopsis, setSynopsis] = useState(book.synopsis || '');
  const [genre, setGenre] = useState(book.genre || 'Ficción');
  const [pageCount, setPageCount] = useState<number>(book.pageCount || 100);
  const [language, setLanguage] = useState(book.language || 'Español');
  const [publicationYear, setPublicationYear] = useState<number>(book.publicationYear || 2026);

  // Folder Assignment
  const [folderId, setFolderId] = useState<string>(book.folderId || '');
  const [teraboxUrl, setTeraboxUrl] = useState<string>(book.teraboxUrl || '');

  // Liberation & Pricing
  const [isLiberated, setIsLiberated] = useState<boolean>(Boolean(book.isLiberated));
  const [liberatedNote, setLiberatedNote] = useState(
    book.liberatedNote || '¡Obra liberada por el autor para acceso libre en Chile y el mundo!'
  );
  const [pricingType, setPricingType] = useState<PricingType>(book.pricingType || (book.isLiberated ? 'free' : 'paid'));
  
  // Custom price in Chilean Pesos (CLP) and US Dollars (USD) - no default values enforced!
  const [priceCLP, setPriceCLP] = useState<string>(
    book.price && book.price > 0 ? String(book.price) : ''
  );
  const [priceUSD, setPriceUSD] = useState<string>(
    book.priceUSD && book.priceUSD > 0 ? String(book.priceUSD) : ''
  );

  const [isSaving, setIsSaving] = useState(false);

  // Quick helper to suggest USD based on CLP (~950 CLP/USD)
  const handleAutoSuggestUSD = () => {
    const clpNum = Number(priceCLP);
    if (clpNum > 0) {
      const approxUSD = (clpNum / 950).toFixed(2);
      setPriceUSD(approxUSD);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('El título del libro es obligatorio.');
      return;
    }

    setIsSaving(true);

    const selectedFolder = folders.find((f) => f.id === folderId);
    const parsedPriceCLP = isLiberated ? 0 : Number(priceCLP) || 0;
    const parsedPriceUSD = isLiberated ? 0 : (priceUSD ? Number(priceUSD) : undefined);

    const updatedBook: Book = {
      ...book,
      title: title.trim(),
      subtitle: subtitle.trim() || undefined,
      author: author.trim() || 'Autor',
      synopsis: synopsis.trim(),
      genre: genre.trim(),
      folderId: folderId ? folderId : undefined,
      folderName: selectedFolder ? selectedFolder.name : undefined,
      teraboxUrl: teraboxUrl.trim() || undefined,
      isLiberated: isLiberated,
      pricingType: isLiberated ? 'free' : pricingType,
      price: parsedPriceCLP,
      priceUSD: parsedPriceUSD,
      liberatedNote: isLiberated ? liberatedNote : undefined,
      liberatedAt: isLiberated ? (book.liberatedAt || new Date().toISOString()) : undefined,
      pageCount: Number(pageCount) || 100,
      language,
      publicationYear: Number(publicationYear) || new Date().getFullYear(),
    };

    try {
      await saveFn(updatedBook);
      onClose();
    } catch (err: any) {
      alert('Error al guardar cambios: ' + (err?.message || ''));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div 
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-6 text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Modo Administrador</span>
              </span>
              <span className="text-xs text-slate-500">·</span>
              <span className="text-xs text-slate-400">Edición de Obra</span>
            </div>
            <h3 className="font-serif font-bold text-xl text-white mt-0.5 truncate max-w-md sm:max-w-xl">
              Editar: {book.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[82vh] overflow-y-auto">
          {/* SECTION 1: LIBERATION & PRICING */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-400 font-mono flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              <span>Modalidad de Acceso & Valor del Libro</span>
            </h4>

            {/* Liberation Toggle */}
            <div className="p-3.5 rounded-xl bg-slate-900/90 border border-emerald-900/50 flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                  <span>Liberar libro para descarga gratuita</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Si activas esta opción, el libro estará libre y sin costo para todos los lectores. Si la desactivas, tendrá el valor comercial que indiques.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsLiberated(!isLiberated)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  isLiberated ? 'bg-emerald-500' : 'bg-slate-800'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    isLiberated ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {isLiberated ? (
              <div className="space-y-1.5 pt-1">
                <label className="block text-[11px] text-emerald-300 font-medium">
                  Mensaje del Autor para la descarga libre:
                </label>
                <input
                  type="text"
                  value={liberatedNote}
                  onChange={(e) => setLiberatedNote(e.target.value)}
                  placeholder="¡Edición liberada por el autor para acceso libre!"
                  className="w-full px-3 py-2 bg-slate-900 text-xs text-emerald-200 rounded-lg border border-emerald-900/60"
                />
              </div>
            ) : (
              /* Custom Price Configuration: CLP and USD (NO default values enforced!) */
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Price in Chilean Pesos */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-200 mb-1">
                      Valor en Pesos Chilenos ($ CLP)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono">$</span>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={priceCLP}
                        onChange={(e) => setPriceCLP(e.target.value)}
                        placeholder="Ej: 5000"
                        className="w-full pl-7 pr-3 py-2 bg-slate-900 text-xs text-white rounded-lg border border-slate-800 focus:border-amber-400 focus:outline-none font-mono"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Transferencias BancoEstado, Mercado Pago y Webpay
                    </span>
                  </div>

                  {/* Price in US Dollars */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-200">
                        Valor en Dólares ($ USD)
                      </label>
                      {priceCLP && Number(priceCLP) > 0 && (
                        <button
                          type="button"
                          onClick={handleAutoSuggestUSD}
                          className="text-[10px] text-amber-400 hover:text-amber-300 cursor-pointer underline"
                        >
                          Calcular USD
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-mono">$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={priceUSD}
                        onChange={(e) => setPriceUSD(e.target.value)}
                        placeholder="Ej: 5.50"
                        className="w-full pl-7 pr-3 py-2 bg-slate-900 text-xs text-white rounded-lg border border-slate-800 focus:border-amber-400 focus:outline-none font-mono"
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Para pagos internacionales vía PayPal
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                  <span>Visualización para lectores:</span>
                  <span className="font-mono font-semibold text-amber-300">
                    {priceCLP && Number(priceCLP) > 0 ? `$${Number(priceCLP).toLocaleString('es-CL')} CLP` : '$0 CLP'}
                    {priceUSD && Number(priceUSD) > 0 ? ` · $${Number(priceUSD).toFixed(2)} USD` : ''}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* SECTION 2: FOLDER / TEMÁTICA ASSIGNMENT */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-400 font-mono flex items-center gap-2">
                <Folder className="w-4 h-4" />
                <span>Carpeta / Temática del Libro</span>
              </h4>
              {onOpenFolderManager && (
                <button
                  type="button"
                  onClick={onOpenFolderManager}
                  className="text-xs text-amber-400 hover:text-amber-300 font-medium cursor-pointer"
                >
                  + Gestionar Carpetas
                </button>
              )}
            </div>

            <p className="text-[11px] text-slate-400">
              Organiza este libro dentro de una carpeta temática para que los lectores lo encuentren rápidamente (ej: Medicina, Terror, Romántica).
            </p>

            <select
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 text-xs text-white rounded-lg border border-slate-800 focus:border-amber-400 focus:outline-none cursor-pointer"
            >
              <option value="">📂 Sin carpeta asignada (Catálogo general)</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  📁 {f.name} {f.description ? `— ${f.description}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* SECTION 2.5: TERABOX CLOUD LINK */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-sky-400 font-mono flex items-center gap-2">
                <span>☁️</span>
                <span>Enlace TeraBox (Carpeta Especial o Descarga Nube)</span>
              </h4>
              <span className="text-[10px] text-sky-300 font-mono px-1.5 py-0.5 rounded bg-sky-950 border border-sky-800">
                1 TB Gratis
              </span>
            </div>
            <input
              type="url"
              value={teraboxUrl}
              onChange={(e) => setTeraboxUrl(e.target.value)}
              placeholder="https://terabox.com/s/... o https://terabox.app/s/..."
              className="w-full px-3 py-2 bg-slate-900 text-xs text-white rounded-lg border border-slate-800 focus:border-sky-400 focus:outline-none font-mono"
            />
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Pega aquí el enlace público o carpeta compartida de TeraBox para que los lectores descarguen la obra completa directamente desde la nube.
            </p>
          </div>

          {/* SECTION 3: METADATA */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
              Ficha Editorial de la Obra
            </h4>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Título de la Obra</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 text-xs text-white rounded-lg border border-slate-800 font-serif font-bold text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Subtítulo (opcional)</label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 text-xs text-slate-200 rounded-lg border border-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Autor</label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 text-xs text-slate-200 rounded-lg border border-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Género / Materia</label>
                <input
                  type="text"
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  placeholder="Ej: Medicina, Terror, Romántica"
                  className="w-full px-3 py-2 bg-slate-950 text-xs text-slate-200 rounded-lg border border-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Páginas estimadas</label>
                <input
                  type="number"
                  value={pageCount}
                  onChange={(e) => setPageCount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 text-xs text-slate-200 rounded-lg border border-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Año de publicación</label>
                <input
                  type="number"
                  value={publicationYear}
                  onChange={(e) => setPublicationYear(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 text-xs text-slate-200 rounded-lg border border-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Sinopsis oficial</label>
              <textarea
                rows={4}
                value={synopsis}
                onChange={(e) => setSynopsis(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 text-xs text-slate-200 rounded-lg border border-slate-800 font-serif leading-relaxed"
              />
            </div>
          </div>

          {/* Submit CTA */}
          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white bg-slate-800 rounded-xl cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors cursor-pointer shadow-md flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Guardando en la nube...</span>
                </>
              ) : (
                <span>Guardar Cambios</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
