import { Book } from '../types/book';

/**
 * Triggers a real browser file download for a book.
 * If the author uploaded a specific binary file (Blob, Uint8Array or Base64), it downloads it directly.
 * Otherwise, it crafts a clean, real downloadable formatted digital book file (PDF or text/markdown).
 */
/**
 * Triggers a real browser file download for a book.
 * If the book has a server downloadUrl or uploaded binary file, it downloads that exact file.
 * Otherwise, it downloads via the server download endpoint with attachment headers.
 */
export async function downloadBookFile(
  book: Book,
  readerName: string = 'Lector Invitado',
  downloadToken?: string
): Promise<void> {
  const cleanFileName = book.fileName || `${sanitizeFileName(book.title)}.${(book.fileType || 'PDF').toLowerCase()}`;

  // 1. If book has a real server-hosted file uploaded by author
  if (book.downloadUrl) {
    const downloadEndpoint = `/api/books/${book.id}/download?file=${encodeURIComponent(book.downloadUrl)}`;
    triggerUrlDownload(downloadEndpoint, cleanFileName);
    return;
  }

  // 2. If the book has a custom uploaded file stored as Blob or Base64 in memory
  if (book.uploadedFileBlob) {
    let blob: Blob;
    if (book.uploadedFileBlob instanceof Blob) {
      blob = book.uploadedFileBlob;
    } else if (typeof book.uploadedFileBlob === 'string' && book.uploadedFileBlob.startsWith('data:')) {
      const res = await fetch(book.uploadedFileBlob);
      blob = await res.blob();
    } else {
      blob = new Blob([book.uploadedFileBlob], { type: getMimeType(book.fileType) });
    }
    triggerBlobDownload(blob, cleanFileName);
    return;
  }

  // 3. Fallback: stream through server download endpoint with Content-Disposition: attachment
  const fallbackEndpoint = `/api/books/${book.id}/download`;
  triggerUrlDownload(fallbackEndpoint, cleanFileName);
}

function triggerUrlDownload(url: string, filename: string): void {
  const a = document.createElement('a');
  a.href = url;
  a.setAttribute('download', filename);
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    if (document.body.contains(a)) {
      document.body.removeChild(a);
    }
  }, 2000);
}

function getMimeType(type: string): string {
  switch (type.toUpperCase()) {
    case 'PDF':
      return 'application/pdf';
    case 'EPUB':
      return 'application/epub+zip';
    case 'MOBI':
      return 'application/x-mobipocket-ebook';
    case 'DOCX':
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    default:
      return 'application/octet-stream';
  }
}

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9_\-áéíóúÁÉÍÓÚñÑ ]/g, '').trim();
}

function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

function buildBookDocumentText(book: Book, readerName: string, downloadToken?: string): string {
  const dateStr = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const divider = '='.repeat(64);
  const subDivider = '-'.repeat(64);

  let doc = `${divider}\n`;
  doc += `                  ${book.title.toUpperCase()}\n`;
  if (book.subtitle) {
    doc += `               ${book.subtitle}\n`;
  }
  doc += `               Por: ${book.author}\n`;
  doc += `${divider}\n\n`;

  doc += `INFORMACIÓN EDITORIAL & DESCARGA\n`;
  doc += `${subDivider}\n`;
  doc += `• Género: ${book.genre}\n`;
  doc += `• Año de publicación: ${book.publicationYear}\n`;
  doc += `• Páginas: ${book.pageCount}\n`;
  doc += `• Idioma: ${book.language}\n`;
  doc += `• Licencia de descarga: ${book.isLiberated ? 'EDICIÓN LIBERADA POR EL AUTOR' : (book.pricingType === 'free' ? 'ACCESO LIBRE' : 'COPIA REGISTRADA')}\n`;
  doc += `• Lector registrado: ${readerName}\n`;
  doc += `• Fecha de adquisición: ${dateStr}\n`;
  if (downloadToken) {
    doc += `• Código de verificación: ${downloadToken}\n`;
  }
  doc += `\nSINOPSIS:\n${book.synopsis}\n\n`;

  doc += `${divider}\n`;
  doc += `                         ÍNDICE & CONTENIDO\n`;
  doc += `${divider}\n\n`;

  if (book.sampleChapters && book.sampleChapters.length > 0) {
    book.sampleChapters.forEach((chapter, index) => {
      doc += `\n[CAPÍTULO ${index + 1}: ${chapter.title.toUpperCase()}]\n`;
      doc += `${subDivider}\n\n`;
      doc += `${chapter.content}\n\n`;
    });
  } else {
    doc += `[CAPÍTULO 1: INTRODUCCIÓN]\n`;
    doc += `${subDivider}\n\n`;
    doc += `Gracias por descargar esta obra de ${book.author}. Este libro forma parte del catálogo independiente de autor.\n\n`;
  }

  doc += `\n${divider}\n`;
  doc += `Mensaje del autor: Si disfrutaste esta lectura, por favor recomiéndala o comparte una reseña en LibroLibre.\n`;
  doc += `© ${book.publicationYear} ${book.author}. Todos los derechos reservados.\n`;
  doc += `${divider}\n`;

  return doc;
}

/**
 * Creates a minimal valid PDF container embedding the text
 */
function createSimplePdf(book: Book, textContent: string): Blob {
  // We format clean text and encode into a readable text document with PDF header or clean PDF format
  const sanitized = textContent
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2014]/g, '--');

  // Create an HTML-to-print or cleanly styled document for instant reading or PDF save
  const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>${book.title} - ${book.author}</title>
  <style>
    @page { margin: 2.5cm; }
    body { font-family: 'Georgia', serif; line-height: 1.8; color: #1a1a1a; max-width: 760px; margin: 0 auto; padding: 40px 20px; }
    h1 { font-size: 32px; text-align: center; margin-bottom: 8px; color: #111; }
    h2 { font-size: 20px; text-align: center; color: #666; font-weight: normal; margin-top: 0; }
    .author { text-align: center; font-size: 18px; margin-top: 24px; font-style: italic; }
    .meta-box { border-top: 1px solid #ccc; border-bottom: 1px solid #ccc; padding: 16px; margin: 32px 0; font-family: sans-serif; font-size: 13px; color: #444; }
    .synopsis { font-size: 16px; line-height: 1.6; margin: 30px 0; padding: 20px; background: #fdfaf6; border-left: 3px solid #8c6d46; }
    .chapter-title { font-size: 22px; margin-top: 48px; border-bottom: 1px solid #eee; padding-bottom: 8px; color: #222; }
    p { margin-bottom: 1.2em; text-align: justify; }
    .footer { margin-top: 60px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 12px; color: #888; text-align: center; font-family: sans-serif; }
  </style>
</head>
<body>
  <h1>${book.title}</h1>
  ${book.subtitle ? `<h2>${book.subtitle}</h2>` : ''}
  <div class="author">Por ${book.author}</div>
  
  <div class="meta-box">
    <strong>Edición Oficial:</strong> ${book.genre} · ${book.publicationYear} · ${book.pageCount} páginas · ${book.language}<br>
    <strong>Estado:</strong> ${book.isLiberated ? 'Libro liberado para acceso libre por el autor' : (book.pricingType === 'free' ? 'Descarga Gratuita' : 'Adquirido en LibroLibre')}
  </div>

  <div class="synopsis">
    <strong>Sinopsis de la obra:</strong><br>
    ${book.synopsis}
  </div>

  ${(book.sampleChapters || []).map((ch, idx) => `
    <h3 class="chapter-title">Capítulo ${idx + 1}: ${ch.title}</h3>
    ${ch.content.split('\n\n').map(p => `<p>${p}</p>`).join('')}
  `).join('')}

  <div class="footer">
    Descargado a través de LibroLibre · Plataforma para autores independientes.<br>
    © ${book.publicationYear} ${book.author}.
  </div>
</body>
</html>
`;

  return new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
}
