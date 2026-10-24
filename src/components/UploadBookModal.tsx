import React, { useState, useRef } from 'react';
import { Book, PricingType, Chapter } from '../types/book';
import { 
  X, Upload, FileText, Image as ImageIcon, Sparkles, Plus, Trash2, 
  CheckCircle2, Loader2, RefreshCw, Eye
} from 'lucide-react';
import { extractCoverFromPdf, generateTextBookCover } from '../utils/pdfCoverExtractor';
import { compressImage } from '../utils/imageCompressor';
import { saveBookFileToCache } from '../utils/fileStore';

interface UploadBookModalProps {
  onClose: () => void;
  onSaveBook: (newBook: Book) => void;
  defaultAuthorName: string;
}

export const UploadBookModal: React.FC<UploadBookModalProps> = ({
  onClose,
  onSaveBook,
  defaultAuthorName,
}) => {
  // Book fields
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [author, setAuthor] = useState(defaultAuthorName || 'Camilo V.');
  const [synopsis, setSynopsis] = useState('');
  const [genre, setGenre] = useState('Ficción Literaria');
  const [pageCount, setPageCount] = useState<number>(180);
  const [language, setLanguage] = useState('Español');
  const [publicationYear, setPublicationYear] = useState<number>(new Date().getFullYear());
  
  // Pricing & Liberation in Chilean Pesos (CLP)
  const [pricingType, setPricingType] = useState<PricingType>('paid');
  const [price, setPrice] = useState<number>(7990); // $7.990 CLP
  const [isLiberated, setIsLiberated] = useState<boolean>(false);
  const [liberatedNote, setLiberatedNote] = useState('¡Edición especial liberada por el autor para acceso libre en Chile!');
  const [allowPwywMin, setAllowPwywMin] = useState<number>(1000); // $1.000 CLP

  // File upload state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string>('');
  const [isUploadingFile, setIsUploadingFile] = useState<boolean>(false);
  const [uploadFileError, setUploadFileError] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'PDF' | 'EPUB' | 'MOBI' | 'TXT' | 'DOCX'>('PDF');
  const [fileSizeStr, setFileSizeStr] = useState('2.4 MB');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cover Image & Auto Extraction
  const [coverUrl, setCoverUrl] = useState('');
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isExtractingCover, setIsExtractingCover] = useState(false);
  const [coverSource, setCoverSource] = useState<'auto-pdf' | 'manual' | 'generated' | 'none'>('none');
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Sample Chapters (Initialized empty so dummy placeholder text is never published)
  const [chapters, setChapters] = useState<Chapter[]>([]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFile(file);
      const ext = file.name.split('.').pop()?.toUpperCase();
      if (ext === 'PDF' || ext === 'EPUB' || ext === 'MOBI' || ext === 'TXT' || ext === 'DOCX') {
        setFileType(ext as any);
      }
      const mbSize = (file.size / (1024 * 1024)).toFixed(1);
      setFileSizeStr(`${mbSize} MB`);

      // Auto-suggest title if empty
      if (!title.trim()) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }

      // 1. Upload original book file to permanent storage immediately
      setIsUploadingFile(true);
      setUploadFileError(null);
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = reader.result as string;
          const res = await fetch('/api/upload-book-file', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileName: file.name,
              fileData: base64Data,
              fileType: ext || 'PDF',
            }),
          });
          const data = await res.json();
          if (data.success && data.downloadUrl) {
            setDownloadUrl(data.downloadUrl);
            if (data.fileSize) setFileSizeStr(data.fileSize);
          } else {
            setUploadFileError(data.error || 'Error al procesar archivo');
          }
        } catch (err: any) {
          console.warn('Error uploading original book to server:', err);
          setUploadFileError('No se pudo subir al servidor; se guardará de forma local.');
        } finally {
          setIsUploadingFile(false);
        }
      };
      reader.onerror = () => {
        setIsUploadingFile(false);
        setUploadFileError('Error al leer el archivo en el navegador.');
      };
      reader.readAsDataURL(file);

      // 2. Automatically extract cover from uploaded book (PDF page 1)
      setIsExtractingCover(true);
      try {
        if (ext === 'PDF') {
          const extractedCover = await extractCoverFromPdf(file);
          if (extractedCover) {
            setCoverPreview(extractedCover);
            setCoverUrl(extractedCover);
            setCoverSource('auto-pdf');
          }
        } else {
          // For non-PDF documents without raster pages, generate a typographic cover
          const gen = generateTextBookCover(file.name.replace(/\.[^/.]+$/, ''));
          setCoverPreview(gen);
          setCoverUrl(gen);
          setCoverSource('generated');
        }
      } catch (err) {
        console.warn('Cover extraction error:', err);
      } finally {
        setIsExtractingCover(false);
      }
    }
  };

  const handleManualReExtract = async () => {
    if (!uploadedFile) {
      fileInputRef.current?.click();
      return;
    }
    setIsExtractingCover(true);
    try {
      if (fileType === 'PDF') {
        const extractedCover = await extractCoverFromPdf(uploadedFile);
        if (extractedCover) {
          setCoverPreview(extractedCover);
          setCoverUrl(extractedCover);
          setCoverSource('auto-pdf');
        }
      } else {
        const gen = generateTextBookCover(title || uploadedFile.name);
        setCoverPreview(gen);
        setCoverUrl(gen);
        setCoverSource('generated');
      }
    } catch (err) {
      console.warn('Manual re-extract error:', err);
    } finally {
      setIsExtractingCover(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const compressed = await compressImage(file, {
          maxWidth: 500,
          maxHeight: 750,
          quality: 0.82,
        });
        setCoverPreview(compressed);
        setCoverUrl(compressed);
        setCoverSource('manual');
      } catch (err) {
        console.warn('Cover compress error:', err);
      }
    }
  };

  const addChapter = () => {
    setChapters([
      ...chapters,
      {
        id: `ch-${Date.now()}`,
        title: `Capítulo ${chapters.length + 1}`,
        content: ''
      }
    ]);
  };

  const updateChapter = (index: number, field: 'title' | 'content', value: string) => {
    const updated = [...chapters];
    updated[index] = { ...updated[index], [field]: value };
    setChapters(updated);
  };

  const removeChapter = (index: number) => {
    setChapters(chapters.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Por favor ingresa un título para el libro.');
      return;
    }

    if (isUploadingFile) {
      alert('El archivo del libro aún se está subiendo. Por favor espera a que finalice para garantizar la descarga completa.');
      return;
    }

    const bookId = `book-${Date.now()}`;

    // Cache the original file in client IndexedDB permanently so it can never be lost
    if (uploadedFile) {
      try {
        await saveBookFileToCache(bookId, uploadedFile, uploadedFile.name);
        await saveBookFileToCache(uploadedFile.name, uploadedFile, uploadedFile.name);
      } catch (err) {
        console.warn('Could not cache file in IndexedDB:', err);
      }
    }

    const newBook: Book = {
      id: bookId,
      title: title.trim(),
      subtitle: subtitle.trim() || undefined,
      author: author.trim() || 'Autor',
      synopsis: synopsis.trim() || 'Sinopsis disponible en la descarga completa.',
      genre,
      coverUrl: coverUrl || coverPreview || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
      pricingType: isLiberated ? 'paid' : pricingType,
      price: pricingType === 'free' ? 0 : Number(price) || 0,
      isLiberated: isLiberated,
      liberatedNote: isLiberated ? liberatedNote : undefined,
      liberatedAt: isLiberated ? new Date().toISOString() : undefined,
      downloadCount: 0,
      pageCount: Number(pageCount) || 120,
      language,
      publicationYear: Number(publicationYear) || new Date().getFullYear(),
      fileType,
      fileSize: fileSizeStr,
      fileName: uploadedFile?.name,
      downloadUrl: downloadUrl || undefined,
      uploadedFileBlob: uploadedFile || undefined,
      sampleChapters: chapters.filter(c => c.title.trim() && c.content.trim() && !c.content.includes('Escribe aquí el texto')),
      rating: 5.0,
      reviewCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
      tags: [genre, 'Novedad', language],
      allowPwywMin: pricingType === 'pwyw' ? allowPwywMin : undefined,
    };

    onSaveBook(newBook);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div 
        className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-6 text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/60">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-semibold">
              Panel del Autor
            </span>
            <h3 className="font-serif font-bold text-xl text-white">
              Publicar / Subir Nuevo Libro
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
          {/* Section 1: File Upload */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <span>Archivo del Libro (PDF, EPUB, MOBI, DOCX, TXT)</span>
              </label>
              {uploadedFile && (
                <span className="text-xs text-emerald-400 font-mono">
                  {uploadedFile.name} ({fileSizeStr})
                </span>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.epub,.mobi,.txt,.docx"
              className="hidden"
            />

            <div
              onClick={() => !isUploadingFile && fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-colors group ${
                downloadUrl
                  ? 'border-emerald-500/50 bg-emerald-950/20'
                  : 'border-slate-800 hover:border-amber-500/50 bg-slate-900/50'
              }`}
            >
              {isUploadingFile ? (
                <div className="flex flex-col items-center justify-center py-2">
                  <Loader2 className="w-8 h-8 text-amber-400 animate-spin mb-2" />
                  <p className="text-sm font-semibold text-amber-200">
                    Subiendo archivo a la nube para descarga permanente...
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Esto asegura que todos los lectores reciban el archivo original completo.
                  </p>
                </div>
              ) : downloadUrl ? (
                <div className="flex flex-col items-center justify-center py-1">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-2" />
                  <p className="text-sm font-semibold text-emerald-200">
                    ¡Archivo listo para descarga permanente!
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {uploadedFile?.name} ({fileSizeStr}) · Haz clic para cambiarlo
                  </p>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 text-slate-500 group-hover:text-amber-400 mx-auto mb-2 transition-colors" />
                  <p className="text-sm font-medium text-slate-200">
                    {uploadedFile ? 'Haz clic para cambiar el archivo' : 'Arrastra tu archivo o haz clic para seleccionarlo'}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Soporta PDFs con maquetación completa, ePubs o documentos de texto digital.
                  </p>
                </>
              )}
              {uploadFileError && (
                <p className="text-xs text-rose-400 mt-2 font-medium">
                  {uploadFileError}
                </p>
              )}
            </div>
          </div>

          {/* Section 2: General Info */}
          <div className="space-y-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Datos de la Obra
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Título principal *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: El Susurro de las Estrellas"
                  className="w-full px-3.5 py-2.5 bg-slate-950 text-sm text-white placeholder-slate-500 rounded-lg border border-slate-800 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Subtítulo (opcional)</label>
                <input
                  type="text"
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Ej: Crónica de un viaje sin retorno"
                  className="w-full px-3.5 py-2.5 bg-slate-950 text-sm text-white placeholder-slate-500 rounded-lg border border-slate-800 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Nombre del autor / firma</label>
                <input
                  type="text"
                  required
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Tu nombre o seudónimo"
                  className="w-full px-3.5 py-2.5 bg-slate-950 text-sm text-white placeholder-slate-500 rounded-lg border border-slate-800 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Género / Categoría</label>
                <select
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 text-sm text-white rounded-lg border border-slate-800 focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="Ficción Literaria">Ficción Literaria</option>
                  <option value="Desarrollo Personal">Desarrollo Personal</option>
                  <option value="Ciencia Ficción">Ciencia Ficción</option>
                  <option value="Productividad & Negocios">Productividad & Negocios</option>
                  <option value="Poesía">Poesía</option>
                  <option value="Filosofía & Ensayo">Filosofía & Ensayo</option>
                  <option value="Historia">Historia</option>
                  <option value="Infantil & Juvenil">Infantil & Juvenil</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Sinopsis de la obra</label>
              <textarea
                rows={3}
                required
                value={synopsis}
                onChange={(e) => setSynopsis(e.target.value)}
                placeholder="Describe de qué trata el libro, su propuesta y por qué los lectores deberían leerlo..."
                className="w-full px-3.5 py-2.5 bg-slate-950 text-sm text-white placeholder-slate-500 rounded-lg border border-slate-800 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Páginas</label>
                <input
                  type="number"
                  value={pageCount}
                  onChange={(e) => setPageCount(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 text-sm text-white rounded-lg border border-slate-800 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Año</label>
                <input
                  type="number"
                  value={publicationYear}
                  onChange={(e) => setPublicationYear(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-950 text-sm text-white rounded-lg border border-slate-800 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Idioma</label>
                <input
                  type="text"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 text-sm text-white rounded-lg border border-slate-800"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Cover Image (Automatic Extraction from Book Page 1) */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-amber-400" />
                <span>Portada del Libro (Extraída Automáticamente)</span>
              </h4>
              {coverSource === 'auto-pdf' && (
                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/70 border border-emerald-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Página 1 del PDF</span>
                </span>
              )}
            </div>

            <input
              type="file"
              ref={coverInputRef}
              onChange={handleCoverUpload}
              accept="image/*"
              className="hidden"
            />

            <div className="flex flex-col sm:flex-row gap-5 items-start">
              {/* Cover Thumbnail Preview */}
              <div 
                onClick={() => coverInputRef.current?.click()}
                className="relative w-28 h-38 sm:w-32 sm:h-44 rounded-xl bg-slate-900 border-2 border-dashed border-slate-700 overflow-hidden flex items-center justify-center cursor-pointer hover:border-amber-400 shrink-0 shadow-lg group transition-all"
              >
                {isExtractingCover ? (
                  <div className="flex flex-col items-center justify-center p-3 text-center">
                    <Loader2 className="w-7 h-7 text-amber-400 animate-spin mb-2" />
                    <span className="text-[10px] text-amber-300 font-medium">Extrayendo portada...</span>
                  </div>
                ) : coverPreview ? (
                  <>
                    <img 
                      src={coverPreview} 
                      alt="Portada del libro" 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                    />
                    <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-2 text-center">
                      <ImageIcon className="w-5 h-5 text-amber-400 mb-1" />
                      <span className="text-[10px] text-white font-medium">Cambiar portada</span>
                    </div>
                  </>
                ) : (
                  <div className="text-center p-3">
                    <ImageIcon className="w-7 h-7 text-slate-500 mx-auto mb-1 group-hover:text-amber-400 transition-colors" />
                    <span className="text-[11px] text-slate-400">Sin portada</span>
                  </div>
                )}
              </div>

              {/* Cover Details & Controls */}
              <div className="flex-1 space-y-2.5">
                {isExtractingCover ? (
                  <div className="p-3 bg-amber-950/30 border border-amber-900/50 rounded-lg flex items-center gap-2.5 text-xs text-amber-300">
                    <Loader2 className="w-4 h-4 text-amber-400 animate-spin shrink-0" />
                    <span>Leyendo el documento y renderizando la primera página como portada oficial...</span>
                  </div>
                ) : coverSource === 'auto-pdf' ? (
                  <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-lg space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>¡Portada extraída con éxito de la primera página del libro subido!</span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      La plataforma usará la carátula o portada original que viene en tu archivo PDF. No necesitas diseñar ni buscar otra imagen externa.
                    </p>
                  </div>
                ) : coverSource === 'manual' ? (
                  <div className="p-3 bg-sky-950/40 border border-sky-800/60 rounded-lg">
                    <div className="text-xs font-semibold text-sky-400">
                      Imagen de portada personalizada seleccionada
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      Has elegido una imagen personalizada para representar tu obra.
                    </p>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg">
                    <p className="text-xs text-slate-300">
                      <strong className="text-amber-400">Extracción Automática:</strong> Al seleccionar un libro en formato PDF arriba, el sistema extraerá automáticamente la primera página para usarla como portada.
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {uploadedFile && (
                    <button
                      type="button"
                      onClick={handleManualReExtract}
                      disabled={isExtractingCover}
                      className="px-3 py-1.5 text-xs font-medium bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isExtractingCover ? 'animate-spin' : ''}`} />
                      <span>Volver a extraer del archivo</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => coverInputRef.current?.click()}
                    className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center gap-1.5 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Subir otra imagen manualmente</span>
                  </button>

                  {coverPreview && (
                    <button
                      type="button"
                      onClick={() => {
                        setCoverPreview(null);
                        setCoverUrl('');
                        setCoverSource('none');
                      }}
                      className="px-2.5 py-1.5 text-xs text-slate-500 hover:text-rose-400 rounded-lg cursor-pointer transition-colors"
                      title="Quitar portada"
                    >
                      Limpiar
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Monetization & Liberation (CORE REQUIREMENT) */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                <span>Modelo de Precios & Liberación Gratuita</span>
              </h4>
            </div>

            {/* Pricing Mode Radio */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setPricingType('paid');
                  setIsLiberated(false);
                }}
                className={`p-3 rounded-lg border text-left cursor-pointer transition-colors ${
                  pricingType === 'paid' && !isLiberated
                    ? 'bg-amber-500/10 border-amber-500 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <div className="text-xs font-semibold text-white">De Pago</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Precio fijo para compradores</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPricingType('free');
                  setIsLiberated(false);
                }}
                className={`p-3 rounded-lg border text-left cursor-pointer transition-colors ${
                  pricingType === 'free' && !isLiberated
                    ? 'bg-amber-500/10 border-amber-500 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <div className="text-xs font-semibold text-white">100% Gratuito</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Acceso libre permanente</div>
              </button>

              <button
                type="button"
                onClick={() => {
                  setPricingType('pwyw');
                  setIsLiberated(false);
                }}
                className={`p-3 rounded-lg border text-left cursor-pointer transition-colors ${
                  pricingType === 'pwyw' && !isLiberated
                    ? 'bg-amber-500/10 border-amber-500 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-400'
                }`}
              >
                <div className="text-xs font-semibold text-white">Paga lo que gustes</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Aporte libre desde un mínimo</div>
              </button>
            </div>

            {pricingType === 'paid' && !isLiberated && (
              <div>
                <label className="block text-xs text-slate-400 mb-1">Precio de venta en Chile ($ CLP)</label>
                <input
                  type="number"
                  step="100"
                  min="500"
                  value={price}
                  onChange={(e) => setPrice(Number(e.target.value))}
                  placeholder="Ej: 7990"
                  className="w-48 px-3 py-2 bg-slate-900 text-sm text-white rounded-lg border border-slate-800 font-mono"
                />
                <span className="text-[11px] text-slate-500 ml-2">Pesos Chilenos</span>
              </div>
            )}

            {pricingType === 'pwyw' && !isLiberated && (
              <div>
                <label className="block text-xs text-slate-400 mb-1">Aporte mínimo sugerido ($ CLP)</label>
                <input
                  type="number"
                  step="500"
                  min="500"
                  value={allowPwywMin}
                  onChange={(e) => setAllowPwywMin(Number(e.target.value))}
                  placeholder="Ej: 1000"
                  className="w-48 px-3 py-2 bg-slate-900 text-sm text-white rounded-lg border border-slate-800 font-mono"
                />
                <span className="text-[11px] text-slate-500 ml-2">Pesos Chilenos</span>
              </div>
            )}

            {/* DIRECT LIBERATION TOGGLE */}
            <div className="pt-3 border-t border-slate-900 flex items-start justify-between gap-4">
              <div>
                <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>¿Deseas liberar este libro gratuitamente ahora mismo?</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Podrás activar o desactivar la liberación gratuita con un solo clic cuando tú quieras desde tu panel de control.
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

            {isLiberated && (
              <div className="space-y-2">
                <label className="block text-xs text-emerald-300">Mensaje de liberación visible para lectores</label>
                <input
                  type="text"
                  value={liberatedNote}
                  onChange={(e) => setLiberatedNote(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 text-xs text-emerald-200 rounded-lg border border-emerald-900/60"
                />
              </div>
            )}
          </div>

          {/* Section 5: Sample Chapter for in-app reader */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Capítulo de Muestra (Lectura en línea - Opcional)
              </h4>
              <button
                type="button"
                onClick={addChapter}
                className="text-xs font-medium text-amber-400 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Añadir fragmento web</span>
              </button>
            </div>

            {chapters.length === 0 ? (
              <div className="p-4 bg-slate-950/60 rounded-xl border border-dashed border-slate-800 text-center">
                <p className="text-xs text-slate-400">
                  {uploadedFile 
                    ? `El archivo original completo (${uploadedFile.name}) se entregará directamente a tus lectores al descargar.`
                    : 'Si subes un archivo PDF o EPUB completo arriba, tus lectores lo descargarán tal cual sin necesidad de transcribir texto aquí.'}
                </p>
                <button
                  type="button"
                  onClick={addChapter}
                  className="mt-2.5 px-3 py-1.5 text-xs font-medium text-amber-400 hover:text-amber-300 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 rounded-lg inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Añadir fragmento de lectura web (Opcional)</span>
                </button>
              </div>
            ) : (
              chapters.map((ch, idx) => (
                <div key={ch.id} className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={ch.title}
                      onChange={(e) => updateChapter(idx, 'title', e.target.value)}
                      placeholder="Título del capítulo (ej: Capítulo 1)"
                      className="w-full px-3 py-1.5 bg-slate-900 text-xs font-semibold text-white rounded-lg border border-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => removeChapter(idx)}
                      className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer"
                      title="Eliminar este capítulo"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <textarea
                    rows={4}
                    value={ch.content}
                    onChange={(e) => updateChapter(idx, 'content', e.target.value)}
                    placeholder="Fragmento o texto que tus lectores podrán leer en el navegador..."
                    className="w-full px-3 py-2 bg-slate-900 text-xs text-slate-200 rounded-lg border border-slate-800 font-serif leading-relaxed"
                  />
                </div>
              ))
            )}
          </div>

          {/* Submit CTA */}
          <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isUploadingFile}
              className="px-4 py-2.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl cursor-pointer disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isUploadingFile}
              className={`px-6 py-2.5 text-xs font-semibold rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-2 ${
                isUploadingFile
                  ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                  : 'text-slate-950 bg-amber-400 hover:bg-amber-300 shadow-amber-950/20'
              }`}
            >
              {isUploadingFile ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
                  <span>Subiendo archivo original... Por favor espera</span>
                </>
              ) : (
                <span>Publicar Libro en la Plataforma</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
