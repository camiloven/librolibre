import React, { useState, useRef } from 'react';
import { Book, PricingType, Chapter, BookFolder } from '../types/book';
import { 
  X, Upload, FileText, Image as ImageIcon, Sparkles, Plus, Trash2, 
  CheckCircle2, Loader2, RefreshCw, Eye, Folder, DollarSign,
  Cloud, ExternalLink, Link2, Info
} from 'lucide-react';
import { extractCoverFromPdf, generateTextBookCover } from '../utils/pdfCoverExtractor';
import { compressImage } from '../utils/imageCompressor';
import { saveBookFileToCache } from '../utils/fileStore';
import { saveBookFileChunksToFirestore } from '../services/firebase';

interface UploadBookModalProps {
  onClose: () => void;
  onSaveBook: (newBook: Book) => void;
  defaultAuthorName: string;
  folders?: BookFolder[];
  onOpenFolderManager?: () => void;
}

export const UploadBookModal: React.FC<UploadBookModalProps> = ({
  onClose,
  onSaveBook,
  defaultAuthorName,
  folders = [],
  onOpenFolderManager,
}) => {
  // Book fields
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [author, setAuthor] = useState(defaultAuthorName || 'Camilo V.');
  const [synopsis, setSynopsis] = useState('');
  const [genre, setGenre] = useState('Ficción Literaria');
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [pageCount, setPageCount] = useState<number>(100);
  const [language, setLanguage] = useState('Español');
  const [publicationYear, setPublicationYear] = useState<number>(new Date().getFullYear());
  
  // Pricing & Liberation: NO DEFAULT PRICES - Author specifies exact CLP and USD values
  const [pricingType, setPricingType] = useState<PricingType>('paid');
  const [priceCLP, setPriceCLP] = useState<string>(''); // starts EMPTY as requested
  const [priceUSD, setPriceUSD] = useState<string>(''); // starts EMPTY as requested
  const [isLiberated, setIsLiberated] = useState<boolean>(false);
  const [liberatedNote, setLiberatedNote] = useState('¡Edición especial liberada por el autor para acceso libre en Chile!');
  const [allowPwywMin, setAllowPwywMin] = useState<string>('');

  // File upload state
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [fileBase64Data, setFileBase64Data] = useState<string>('');
  const [downloadUrl, setDownloadUrl] = useState<string>('');
  const [megaUrl, setMegaUrl] = useState<string>('');
  const [uploadMode, setUploadMode] = useState<'mega' | 'local'>('mega');
  const [isUploadingFile, setIsUploadingFile] = useState<boolean>(false);
  const [uploadFileError, setUploadFileError] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'PDF' | 'EPUB' | 'MOBI' | 'TXT' | 'DOCX'>('PDF');
  const [fileSizeStr, setFileSizeStr] = useState('2.4 MB');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cover Image & Auto Extraction
  const [coverUrl, setCoverUrl] = useState('');
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [isExtractingCover, setIsExtractingCover] = useState(false);
  const [isExtractingFromMega, setIsExtractingFromMega] = useState(false);
  const [megaExtractNotice, setMegaExtractNotice] = useState<string | null>(null);
  const [coverSource, setCoverSource] = useState<'auto-pdf' | 'manual' | 'generated' | 'none'>('none');
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Sample Chapters (Initialized empty so dummy placeholder text is never published)
  const [chapters, setChapters] = useState<Chapter[]>([]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setUploadedFile(file);
      const ext = (file.name.split('.').pop()?.toUpperCase() || 'PDF');
      if (['PDF', 'EPUB', 'MOBI', 'TXT', 'DOCX'].includes(ext)) {
        setFileType(ext as any);
      }
      const mbSize = (file.size / (1024 * 1024)).toFixed(1);
      setFileSizeStr(`${mbSize} MB`);

      // Auto-suggest title if empty
      if (!title.trim()) {
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
        setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
      }

      setIsUploadingFile(true);
      setIsExtractingCover(true);
      setUploadFileError(null);

      try {
        // Read file sequentially as ArrayBuffer to prevent Android ContentResolver descriptor locking
        const arrayBuffer = await file.arrayBuffer();

        // 1. Extract cover from the in-memory arrayBuffer safely
        if (ext === 'PDF') {
          try {
            const extractedCover = await extractCoverFromPdf(arrayBuffer, file.name);
            if (extractedCover) {
              setCoverPreview(extractedCover);
              setCoverUrl(extractedCover);
              setCoverSource('auto-pdf');
            }
          } catch (covErr) {
            console.warn('Cover extraction notice:', covErr);
            const gen = generateTextBookCover(file.name.replace(/\.[^/.]+$/, ''));
            setCoverPreview(gen);
            setCoverUrl(gen);
            setCoverSource('generated');
          }
        } else {
          const gen = generateTextBookCover(file.name.replace(/\.[^/.]+$/, ''));
          setCoverPreview(gen);
          setCoverUrl(gen);
          setCoverSource('generated');
        }
        setIsExtractingCover(false);

        // 2. Convert ArrayBuffer to base64 data URL in non-blocking safe chunks
        const bytes = new Uint8Array(arrayBuffer);
        let binary = '';
        const chunkSize = 0x8000;
        for (let i = 0; i < bytes.byteLength; i += chunkSize) {
          binary += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + chunkSize, bytes.byteLength)) as any);
        }
        const mimeType = ext === 'PDF' ? 'application/pdf' : 'application/octet-stream';
        const base64Data = `data:${mimeType};base64,${btoa(binary)}`;
        setFileBase64Data(base64Data);

        // 3. Upload to server
        try {
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
            setUploadFileError(data.error || 'Aviso: Se guardará directamente en la base de datos.');
          }
        } catch (uploadErr) {
          console.warn('Server upload notice:', uploadErr);
        }
      } catch (err: any) {
        console.warn('Android file reading notice:', err);
        setUploadFileError(
          'Android restringió la lectura directa del archivo físico (posiblemente esté en la nube sin descargarse a la memoria interna). Puedes cambiar a la pestaña "Enlace MEGA" para vincularlo directamente con su enlace de mega.io sin necesidad de subir megabytes.'
        );
        if (!coverUrl) {
          const gen = generateTextBookCover(file.name.replace(/\.[^/.]+$/, ''));
          setCoverPreview(gen);
          setCoverUrl(gen);
          setCoverSource('generated');
        }
      } finally {
        setIsUploadingFile(false);
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

  const handleExtractFromMega = async (inputUrl?: string) => {
    const urlToUse = (inputUrl || megaUrl).trim();
    if (!urlToUse || (!urlToUse.includes('mega.nz') && !urlToUse.includes('mega.io'))) {
      alert('Por favor pega un enlace válido de MEGA con su clave (ej: https://mega.nz/file/...#...)');
      return;
    }

    setIsExtractingFromMega(true);
    setMegaExtractNotice(null);
    try {
      const res = await fetch('/api/extract-mega-cover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlToUse }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'No se pudo conectar al archivo de MEGA');
      }

      // Auto-populate Title & File info
      if (data.title && (!title || title.trim() === 'Libro')) {
        setTitle(data.title);
      }
      if (data.fileSize) {
        setFileSizeStr(data.fileSize);
      }
      if (data.fileType) {
        setFileType(data.fileType);
      }

      // Case 1: Direct Image Cover extracted
      if (data.coverUrl) {
        setCoverPreview(data.coverUrl);
        setCoverUrl(data.coverUrl);
        setCoverSource('manual');
        setMegaExtractNotice(`✓ Portada e información extraídas de "${data.fileName}"`);
        return;
      }

      // Case 2: PDF buffer returned -> Render Page 1 to Canvas
      if (data.pdfBase64) {
        // Convert base64 to ArrayBuffer
        const binaryStr = atob(data.pdfBase64);
        const len = binaryStr.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        const extractedCover = await extractCoverFromPdf(bytes.buffer, data.title);
        if (extractedCover) {
          setCoverPreview(extractedCover);
          setCoverUrl(extractedCover);
          setCoverSource('auto-pdf');
          setMegaExtractNotice(`✓ ¡Portada extraída de la 1ª página del PDF en MEGA! ("${data.fileName}")`);
          return;
        }
      }

      // Case 3: Folder or non-PDF without buffer -> Auto-generate editorial cover
      const gen = generateTextBookCover(data.title || title || 'Libro Digital', author || defaultAuthorName, 'navy');
      setCoverPreview(gen);
      setCoverUrl(gen);
      setCoverSource('generated');
      setMegaExtractNotice(`✓ Título "${data.title}" detectado. Portada generada automáticamente.`);
    } catch (err: any) {
      console.warn('Mega extract notice:', err);
      setMegaExtractNotice(`Aviso: ${err.message || 'No se pudo leer la portada automática'}. Puedes subir la imagen con el botón amarillo abajo.`);
    } finally {
      setIsExtractingFromMega(false);
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

    if (!uploadedFile && !megaUrl.trim()) {
      alert('Por favor ingresa un enlace de MEGA (mega.io) o sube un archivo para que tus lectores puedan descargarlo.');
      return;
    }

    const bookId = `book-${Date.now()}`;

    // 1. Cache the original file in client IndexedDB permanently
    if (uploadedFile) {
      try {
        await saveBookFileToCache(bookId, uploadedFile, uploadedFile.name);
        await saveBookFileToCache(uploadedFile.name, uploadedFile, uploadedFile.name);
      } catch (err) {
        console.warn('Could not cache file in IndexedDB:', err);
      }
    }

    // 2. Save full binary file in Cloud Firestore in persistent chunks (never wiped by Render restarts!)
    if (fileBase64Data && uploadedFile) {
      saveBookFileChunksToFirestore(bookId, uploadedFile.name, fileType, fileBase64Data).catch((err) => {
        console.warn('Could not save file to Firestore chunks:', err);
      });
    }

    const chosenFolder = (folders || []).find((f) => f.id === selectedFolderId);
    const parsedPriceCLP = isLiberated ? 0 : (priceCLP ? Number(priceCLP) : 0);
    const parsedPriceUSD = isLiberated ? 0 : (priceUSD ? Number(priceUSD) : undefined);
    const parsedPwyw = allowPwywMin ? Number(allowPwywMin) : undefined;
    const finalCover = coverUrl || coverPreview || generateTextBookCover(title.trim());

    const newBook: Book = {
      id: bookId,
      title: title.trim(),
      subtitle: subtitle.trim() || undefined,
      author: author.trim() || 'Autor',
      synopsis: synopsis.trim() || 'Sinopsis disponible en la descarga completa.',
      genre,
      folderId: selectedFolderId || undefined,
      folderName: chosenFolder ? chosenFolder.name : undefined,
      coverUrl: finalCover,
      pricingType: isLiberated ? 'free' : pricingType,
      price: parsedPriceCLP,
      priceUSD: parsedPriceUSD,
      isLiberated: isLiberated,
      liberatedNote: isLiberated ? liberatedNote : undefined,
      liberatedAt: isLiberated ? new Date().toISOString() : undefined,
      downloadCount: 0,
      pageCount: Number(pageCount) || 100,
      language,
      publicationYear: Number(publicationYear) || new Date().getFullYear(),
      fileType,
      fileSize: fileSizeStr,
      fileName: uploadedFile?.name,
      downloadUrl: downloadUrl || undefined,
      megaUrl: megaUrl.trim() || undefined,
      teraboxUrl: megaUrl.trim() || undefined,
      uploadedFileBlob: uploadedFile || undefined,
      sampleChapters: chapters.filter(c => c.title.trim() && c.content.trim() && !c.content.includes('Escribe aquí el texto')),
      rating: 5.0,
      reviewCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
      tags: [genre, chosenFolder ? chosenFolder.name : 'General', language],
      allowPwywMin: parsedPwyw,
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
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-semibold">
                Panel del Autor
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono font-bold border border-rose-500/30 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                🔴 MEGA.io Nube Integrada
              </span>
            </div>
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
          {/* Section 1: File / Cloud Hosting */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <span>Método de Entrega del Libro</span>
              </label>

              {/* Mode switch tabs */}
              <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setUploadMode('mega')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    uploadMode === 'mega'
                      ? 'bg-rose-600 text-white shadow-md font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Cloud className="w-3.5 h-3.5" />
                  <span>🔴 Enlace MEGA (Recomendado)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode('local')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    uploadMode === 'local'
                      ? 'bg-amber-400 text-slate-950 shadow-md font-bold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>📁 Subir Archivo Local</span>
                </button>
              </div>
            </div>

            {uploadMode === 'mega' ? (
              /* TAB 1: MEGA.IO CLOUD LINK (RECOMMENDED) */
              <div className="p-4 rounded-xl bg-rose-950/20 border border-rose-500/35 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-rose-600 text-white font-bold text-[11px] flex items-center justify-center font-mono shadow-sm">
                        M
                      </span>
                      <span className="text-xs font-bold text-rose-300">
                        Alojamiento en Nube MEGA (mega.io / mega.nz)
                      </span>
                      <span className="text-[10px] px-2 py-0.5 bg-rose-500/20 text-rose-300 rounded font-mono font-bold">
                        SIN ANUNCIOS · MÁXIMA VELOCIDAD
                      </span>
                    </div>
                    <p className="text-xs text-rose-200/90 mt-1.5 leading-relaxed">
                      Sube tu libro a tu cuenta o carpeta especial de <strong>MEGA (mega.io)</strong> y pega el enlace compartido aquí. Tus lectores descargarán el libro completo de inmediato con un solo clic, sin límites molestos ni publicidad.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-500/25 text-xs text-slate-300 space-y-1.5">
                  <div className="font-semibold text-rose-300 text-[11px] flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                    <span>¿Cómo obtener el enlace de MEGA en 10 segundos?</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-300 pl-0.5 leading-relaxed">
                    <li>Abre tu app o entra a <strong className="text-rose-300">mega.io</strong> (o mega.nz) desde tu celular o PC.</li>
                    <li>Sube tu libro en PDF o ePub a tu nube o crea una carpeta especial.</li>
                    <li>Toca los tres puntos <span className="font-mono text-amber-300">···</span> junto al archivo o carpeta y elige <strong>«Obtener enlace»</strong>.</li>
                    <li>Verifica que incluya la clave de descifrado, copia el enlace y pégalo abajo.</li>
                  </ol>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1 flex items-center justify-between">
                    <span>Enlace compartido de MEGA (Archivo o Carpeta Especial) *</span>
                    <a
                      href="https://mega.io"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-rose-400 hover:text-rose-300 hover:underline flex items-center gap-1"
                    >
                      <span>Ir a mega.io</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="url"
                      value={megaUrl}
                      onChange={(e) => setMegaUrl(e.target.value)}
                      placeholder="https://mega.nz/file/...#... o https://mega.nz/folder/...#..."
                      className="w-full px-3.5 py-2.5 bg-slate-950 text-xs text-rose-200 placeholder-slate-600 rounded-xl border border-rose-500/40 focus:outline-none focus:border-rose-400 font-mono"
                      autoFocus
                    />
                    <div className="flex gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleExtractFromMega()}
                        disabled={isExtractingFromMega || !megaUrl.trim()}
                        className="px-3.5 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md transition-colors"
                        title="Descifra el archivo de MEGA y extrae automáticamente la primera página del PDF como portada"
                      >
                        {isExtractingFromMega ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Extrayendo...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                            <span>⚡ Extraer Portada y Datos</span>
                          </>
                        )}
                      </button>
                      {megaUrl && (
                        <a
                          href={megaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 bg-rose-600/30 hover:bg-rose-600/50 text-rose-200 rounded-xl text-xs font-semibold flex items-center gap-1 shrink-0"
                          title="Verificar enlace en MEGA"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  </div>

                  {megaExtractNotice && (
                    <div className={`mt-2 p-2.5 rounded-lg text-xs leading-relaxed ${
                      megaExtractNotice.startsWith('✓') 
                        ? 'bg-emerald-950/50 border border-emerald-800 text-emerald-300' 
                        : 'bg-amber-950/50 border border-amber-800 text-amber-300'
                    }`}>
                      {megaExtractNotice}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                    <span>💡 Puedes pulsar el botón <strong>«⚡ Extraer Portada y Datos»</strong> para obtener la portada del PDF en MEGA automáticamente.</span>
                    <button
                      type="button"
                      onClick={() => setUploadMode('local')}
                      className="text-amber-400 hover:underline cursor-pointer ml-2 shrink-0"
                    >
                      Subir archivo local
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* TAB 2: LOCAL FILE UPLOAD */
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Selecciona el PDF o EPUB almacenado en tu dispositivo:</span>
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
                        Procesando y empaquetando archivo...
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Leyendo páginas y preparando descarga permanente.
                      </p>
                    </div>
                  ) : downloadUrl ? (
                    <div className="flex flex-col items-center justify-center py-1">
                      <CheckCircle2 className="w-8 h-8 text-emerald-400 mb-2" />
                      <p className="text-sm font-semibold text-emerald-200">
                        ¡Archivo cargado exitosamente!
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {uploadedFile?.name} ({fileSizeStr}) · Haz clic para cambiarlo
                      </p>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-slate-500 group-hover:text-amber-400 mx-auto mb-2 transition-colors" />
                      <p className="text-sm font-medium text-slate-200">
                        {uploadedFile ? 'Haz clic para cambiar el archivo' : 'Toca aquí para seleccionar archivo PDF o EPUB'}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Soporta PDFs con maquetación completa, ePubs o documentos de texto digital.
                      </p>
                    </>
                  )}
                  {uploadFileError && (
                    <div className="mt-3 p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs text-left leading-relaxed">
                      <p className="font-semibold mb-1">⚠️ Aviso de lectura en el teléfono:</p>
                      <p>{uploadFileError}</p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setUploadMode('mega');
                        }}
                        className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-lg font-bold text-xs cursor-pointer shadow transition-colors"
                      >
                        <Cloud className="w-3.5 h-3.5" />
                        <span>Usar Enlace MEGA (Sin subir archivo pesado)</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
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
                <label className="block text-xs text-slate-400 mb-1">Género Literario</label>
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
                  <option value="Medicina & Salud">Medicina & Salud</option>
                  <option value="Terror & Suspenso">Terror & Suspenso</option>
                  <option value="Romántica">Romántica</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs text-slate-400 flex items-center gap-1.5">
                    <Folder className="w-3.5 h-3.5 text-amber-400" />
                    <span>Carpeta Temática (Administrador)</span>
                  </label>
                  {onOpenFolderManager && (
                    <button
                      type="button"
                      onClick={onOpenFolderManager}
                      className="text-[11px] text-amber-400 hover:text-amber-300 cursor-pointer font-medium"
                    >
                      + Crear / Gestionar Carpetas
                    </button>
                  )}
                </div>
                <select
                  value={selectedFolderId}
                  onChange={(e) => setSelectedFolderId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 text-sm text-white rounded-lg border border-slate-800 focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="">Sin carpeta asignada (Catálogo General)</option>
                  {folders.map(f => (
                    <option key={f.id} value={f.id}>
                      📁 {f.name} {f.description ? `(${f.description})` : ''}
                    </option>
                  ))}
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
                ) : coverSource === 'manual' ? (
                  <div className="p-3 bg-sky-950/40 border border-sky-800/60 rounded-lg">
                    <div className="text-xs font-semibold text-sky-400">
                      ✓ Imagen de portada personalizada seleccionada
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      Esta imagen representará tu libro en la biblioteca y en los resultados de búsqueda.
                    </p>
                  </div>
                ) : coverSource === 'generated' ? (
                  <div className="p-3 bg-indigo-950/40 border border-indigo-800/60 rounded-lg">
                    <div className="text-xs font-semibold text-indigo-300 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Portada editorial generada automáticamente</span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-0.5">
                      Diseñada con tipografía clásica, marcos de edición y tu nombre de autor. Puedes cambiar de color abajo.
                    </p>
                  </div>
                ) : coverSource === 'auto-pdf' ? (
                  <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-lg space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>¡Portada extraída con éxito de la primera página del libro subido!</span>
                    </div>
                    <p className="text-[11px] text-slate-300">
                      La plataforma usará la carátula o portada original que viene en tu archivo PDF.
                    </p>
                  </div>
                ) : uploadMode === 'mega' ? (
                  <div className="p-3 bg-slate-900/90 border border-slate-800 rounded-lg space-y-1">
                    <div className="text-xs font-semibold text-rose-300 flex items-center gap-1.5">
                      <Info className="w-3.5 h-3.5 text-rose-400" />
                      <span>¿Cómo añadir la portada al usar enlace de MEGA?</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      1. <strong className="text-amber-400">Sube una foto o imagen</strong> desde tu celular/PC con el botón amarillo (pesa poco y carga al instante).
                    </p>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      2. O toca <strong className="text-indigo-400">«Generar Portada Editorial»</strong> para crear una carátula elegante con el título en 1 segundo.
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
                    className="px-3.5 py-1.5 text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>📸 Subir Foto de Portada</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const gen = generateTextBookCover(title || 'Libro Digital', author || defaultAuthorName, 'navy');
                      setCoverPreview(gen);
                      setCoverUrl(gen);
                      setCoverSource('generated');
                    }}
                    className="px-3 py-1.5 text-xs font-semibold bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-400/30 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>🎨 Generar Portada Editorial</span>
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

                {/* Theme Selector when generating or customizing cover */}
                <div className="flex items-center gap-2 pt-1.5 text-[11px] text-slate-400">
                  <span>Estilos de portada automática:</span>
                  <div className="flex items-center gap-1.5">
                    {[
                      { id: 'navy', label: 'Azul Noche', color: 'bg-sky-600' },
                      { id: 'burgundy', label: 'Borgoña', color: 'bg-rose-700' },
                      { id: 'emerald', label: 'Esmeralda', color: 'bg-emerald-600' },
                      { id: 'amber', label: 'Dorado', color: 'bg-amber-600' },
                      { id: 'noir', label: 'Carbón', color: 'bg-zinc-800' }
                    ].map((th) => (
                      <button
                        key={th.id}
                        type="button"
                        onClick={() => {
                          const gen = generateTextBookCover(title || 'Libro Digital', author || defaultAuthorName, th.id as any);
                          setCoverPreview(gen);
                          setCoverUrl(gen);
                          setCoverSource('generated');
                        }}
                        className={`w-5 h-5 rounded-full ${th.color} border border-white/30 hover:scale-110 transition-transform cursor-pointer`}
                        title={`Generar portada en color ${th.label}`}
                      />
                    ))}
                  </div>
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
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>Valores del Libro (Indica los montos que tú desees, sin valores por defecto)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">
                      Valor en Pesos Chilenos ($ CLP)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-mono">CLP $</span>
                      <input
                        type="number"
                        step="100"
                        min="0"
                        value={priceCLP}
                        onChange={(e) => setPriceCLP(e.target.value)}
                        placeholder="Ej: 5000"
                        className="w-full pl-16 pr-3 py-2 bg-slate-900 text-sm text-white placeholder-slate-600 rounded-lg border border-slate-800 font-mono focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <span className="text-[11px] text-slate-500 mt-1 block">Para compras dentro de Chile</span>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 mb-1">
                      Valor en Dólares ($ USD)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-xs text-slate-500 font-mono">USD $</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={priceUSD}
                        onChange={(e) => setPriceUSD(e.target.value)}
                        placeholder="Ej: 5.99"
                        className="w-full pl-16 pr-3 py-2 bg-slate-900 text-sm text-white placeholder-slate-600 rounded-lg border border-slate-800 font-mono focus:outline-none focus:border-amber-500"
                      />
                    </div>
                    <span className="text-[11px] text-slate-500 mt-1 block">Para compras internacionales (PayPal)</span>
                  </div>
                </div>
              </div>
            )}

            {pricingType === 'pwyw' && !isLiberated && (
              <div>
                <label className="block text-xs text-slate-400 mb-1">Aporte mínimo sugerido ($ CLP)</label>
                <input
                  type="number"
                  step="500"
                  min="0"
                  value={allowPwywMin}
                  onChange={(e) => setAllowPwywMin(e.target.value)}
                  placeholder="Ej: 1000 (o vacío para $0)"
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
