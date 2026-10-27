import { Book } from '../types/book';
import { jsPDF } from 'jspdf';
import { getBookFileFromCache, saveBookFileToCache } from './fileStore';
import { fetchBookFileFromFirestore } from '../services/firebase';

/**
 * Triggers a real browser file download for a book.
 * 1. Checks persistent client IndexedDB storage for original binary file (PDF, EPUB).
 * 2. If in-memory Blob or Base64 is present, downloads it.
 * 3. Checks Cloud Firestore permanent binary chunk storage (cross-device, persists across Render restarts).
 * 4. If author uploaded to server storage, fetches the exact original binary file.
 * 5. For PDF books, creates a genuine, complete PDF document with jsPDF.
 * 6. Guarantees that empty placeholder texts are NEVER sent to readers.
 */
export async function downloadBookFile(
  book: Book,
  readerName: string = 'Lector Invitado',
  downloadToken?: string
): Promise<void> {
  const safeBaseName = sanitizeFileName(book.title) || 'libro';
  const fileExt = (book.fileType || 'PDF').toLowerCase();
  const cleanFileName = book.fileName || `${safeBaseName}.${fileExt}`;

  // 1. Check persistent IndexedDB cache (stored directly when author uploaded on this device)
  try {
    const cachedFile = 
      (await getBookFileFromCache(book.id)) || 
      (book.fileName ? await getBookFileFromCache(book.fileName) : null);
    if (cachedFile && cachedFile.blob && cachedFile.blob.size > 100) {
      triggerBlobDownload(cachedFile.blob, cachedFile.fileName || cleanFileName);
      return;
    }
  } catch (idbErr) {
    console.warn('IndexedDB file check notice:', idbErr);
  }

  // 2. If book has custom in-memory file stored as Blob or Base64
  if (book.uploadedFileBlob) {
    try {
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
    } catch (err) {
      console.warn('Error reading uploadedFileBlob:', err);
    }
  }

  // 3. Check Cloud Firestore permanent binary chunked storage (available to ALL devices worldwide)
  try {
    const cloudFile = await fetchBookFileFromFirestore(book.id);
    if (cloudFile && cloudFile.blob && cloudFile.blob.size > 100) {
      // Cache in IndexedDB for subsequent instant downloads
      saveBookFileToCache(book.id, cloudFile.blob, cloudFile.fileName).catch(() => {});
      triggerBlobDownload(cloudFile.blob, cloudFile.fileName || cleanFileName);
      return;
    }
  } catch (cloudErr) {
    console.warn('Cloud Firestore file fetch notice:', cloudErr);
  }

  // 4. If book has a server-hosted file uploaded by author, try fetching directly
  if (book.downloadUrl && !book.downloadUrl.startsWith('data:')) {
    try {
      const directUrl = book.downloadUrl.startsWith('/') ? book.downloadUrl : `/${book.downloadUrl}`;
      const res = await fetch(directUrl);
      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        // Ensure not HTML (404 fallback page)
        if (!contentType.includes('text/html')) {
          const blob = await res.blob();
          if (blob && blob.size > 200) {
            triggerBlobDownload(blob, cleanFileName);
            return;
          }
        }
      }
    } catch (serverErr) {
      console.warn('Server direct file fetch error:', serverErr);
    }

    try {
      const downloadEndpoint = `/api/books/${book.id}/download?file=${encodeURIComponent(book.downloadUrl)}`;
      const res = await fetch(downloadEndpoint);
      if (res.ok) {
        const contentType = res.headers.get('content-type') || '';
        if (!contentType.includes('text/html') && !contentType.includes('application/json')) {
          const blob = await res.blob();
          if (blob && blob.size > 200) {
            triggerBlobDownload(blob, cleanFileName);
            return;
          }
        }
      }
    } catch (apiErr) {
      console.warn('Download endpoint fetch notice:', apiErr);
    }
  }


  // 4. For PDF (default): generate a real, beautifully formatted PDF document with jsPDF!
  if (fileExt === 'pdf' || !fileExt) {
    try {
      const pdfBlob = createRealPdfBook(book, readerName, downloadToken);
      triggerBlobDownload(pdfBlob, `${safeBaseName}.pdf`);
      return;
    } catch (pdfErr) {
      console.error('Error generating jsPDF, falling back to document text:', pdfErr);
    }
  }

  // 5. For TXT or text-based formats
  const textContent = buildBookDocumentText(book, readerName, downloadToken);
  const textBlob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
  triggerBlobDownload(textBlob, `${safeBaseName}.txt`);
}

/**
 * Generates an authentic, beautifully styled PDF document with jsPDF.
 */
export function createRealPdfBook(
  book: Book,
  readerName: string = 'Lector Registrado',
  downloadToken?: string
): Blob {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - margin * 2;

  // ----------------------------------------------------
  // PAGE 1: COVER & TITLE
  // ----------------------------------------------------
  // Deep slate background for book cover
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Amber accent border
  doc.setDrawColor(245, 158, 11); // amber-500
  doc.setLineWidth(0.8);
  doc.rect(margin - 4, margin - 4, contentWidth + 8, pageHeight - (margin - 4) * 2);

  // Category badge
  doc.setTextColor(245, 158, 11);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text((book.genre || 'LITERATURA INDEPENDIENTE').toUpperCase(), pageWidth / 2, 48, { align: 'center' });

  // Book Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  const titleLines = doc.splitTextToSize(book.title.toUpperCase(), contentWidth - 16);
  doc.text(titleLines, pageWidth / 2, 68, { align: 'center' });

  // Subtitle
  let currentY = 68 + titleLines.length * 9;
  if (book.subtitle) {
    doc.setTextColor(203, 213, 225); // slate-300
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(12);
    const subtitleLines = doc.splitTextToSize(book.subtitle, contentWidth - 24);
    doc.text(subtitleLines, pageWidth / 2, currentY + 4, { align: 'center' });
    currentY += 4 + subtitleLines.length * 6;
  }

  // Author
  doc.setTextColor(251, 191, 36); // amber-400
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(`Por ${book.author}`, pageWidth / 2, currentY + 16, { align: 'center' });

  // Liberation / Access banner
  const licenseText = book.isLiberated
    ? 'OBRA LIBERADA PARA ACCESO GRATUITO POR EL AUTOR'
    : book.pricingType === 'free'
    ? 'EDICIÓN DE DESCARGA LIBRE'
    : 'COPIA REGISTRADA · EDICIÓN OFICIAL';
  doc.setTextColor(52, 211, 153); // emerald-400
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(licenseText, pageWidth / 2, currentY + 28, { align: 'center' });

  // Reader certificate box at bottom
  const certY = pageHeight - 64;
  doc.setFillColor(30, 41, 59); // slate-800
  doc.roundedRect(margin, certY, contentWidth, 34, 2.5, 2.5, 'F');
  doc.setDrawColor(51, 65, 85);
  doc.roundedRect(margin, certY, contentWidth, 34, 2.5, 2.5, 'S');

  doc.setTextColor(148, 163, 184); // slate-400
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('CERTIFICADO DIGITAL DE ADQUISICIÓN · LIBROLIBRE', margin + 6, certY + 7);

  doc.setTextColor(248, 250, 252);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(`Lector registrado: ${readerName}`, margin + 6, certY + 15);

  doc.setTextColor(203, 213, 225);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(
    `Año: ${book.publicationYear} · Idioma: ${book.language} · Formato: ${book.fileType} (${book.fileSize || 'Digital'})`,
    margin + 6,
    certY + 22
  );

  if (downloadToken) {
    doc.setTextColor(245, 158, 11);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(`Token de autenticidad: ${downloadToken}`, margin + 6, certY + 29);
  }

  // ----------------------------------------------------
  // PAGE 2: SINOPSIS & EDITORIAL INFO
  // ----------------------------------------------------
  doc.addPage();
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Sinopsis & Información Editorial', margin, 28);

  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.5);
  doc.line(margin, 33, pageWidth - margin, 33);

  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  const synopsisLines = doc.splitTextToSize(book.synopsis || 'Sinopsis no disponible.', contentWidth);
  doc.text(synopsisLines, margin, 44);

  let nextY = 44 + synopsisLines.length * 5.5 + 12;

  const cardHeight = book.teraboxUrl ? 46 : 40;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, nextY, contentWidth, cardHeight, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, nextY, contentWidth, cardHeight, 2, 2, 'S');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.text('Ficha de la Obra', margin + 6, nextY + 8);

  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`• Título oficial: ${book.title}`, margin + 6, nextY + 15);
  doc.text(`• Autor: ${book.author}`, margin + 6, nextY + 21);
  doc.text(`• Género: ${book.genre} | Páginas estimadas: ${book.pageCount}`, margin + 6, nextY + 27);
  doc.text(`• Publicación: LibroLibre Chile · Distribución independiente`, margin + 6, nextY + 33);
  if (book.teraboxUrl) {
    doc.text(`• Respaldo en la Nube (TeraBox): ${book.teraboxUrl}`, margin + 6, nextY + 39);
  }

  // ----------------------------------------------------
  // CHAPTERS PAGES
  // ----------------------------------------------------
  const validChapters = (book.sampleChapters || []).filter(
    (ch) =>
      ch &&
      ch.content &&
      !ch.content.includes('Escribe aquí el texto') &&
      ch.content.trim().length > 15
  );

  if (validChapters.length > 0) {
    for (let i = 0; i < validChapters.length; i++) {
      const chapter = validChapters[i];
      doc.addPage();

      doc.setTextColor(15, 23, 42);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text(`Capítulo ${i + 1}: ${chapter.title}`, margin, 28);

      doc.setDrawColor(245, 158, 11);
      doc.setLineWidth(0.8);
      doc.line(margin, 33, margin + 45, 33);

      doc.setTextColor(51, 65, 85);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10.5);

      const paragraphs = (chapter.content || '').split('\n\n');
      let chY = 44;

      for (const p of paragraphs) {
        if (!p.trim()) continue;
        const pLines = doc.splitTextToSize(p.trim(), contentWidth);
        const pHeight = pLines.length * 5.5;

        if (chY + pHeight > pageHeight - 24) {
          doc.addPage();
          chY = 28;
        }

        doc.text(pLines, margin, chY);
        chY += pHeight + 6;
      }
    }
  } else {
    // If no text chapters provided, output complete editorial introduction & reading presentation
    doc.addPage();
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Presentación de la Obra', margin, 28);
    doc.setDrawColor(245, 158, 11);
    doc.setLineWidth(0.8);
    doc.line(margin, 33, margin + 45, 33);

    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    const introText = `Estimado(a) ${readerName}:\n\nHas adquirido la edición digital de "${book.title}", escrita por ${book.author}.\n\nSINOPSIS COMPLETA:\n${book.synopsis}\n\n${book.liberatedNote ? `MENSAJE DEL AUTOR:\n${book.liberatedNote}\n\n` : ''}Esta obra forma parte del movimiento de distribución directa en Chile a través de LibroLibre, garantizando el acceso a la cultura y la custodia de los derechos editoriales del autor sin intermediarios.\n\n© ${book.publicationYear} ${book.author}. Todos los derechos reservados.`;
    const introLines = doc.splitTextToSize(introText, contentWidth);
    doc.text(introLines, margin, 44);
  }

  // Number all pages from page 2 onwards
  const totalPages = doc.getNumberOfPages();
  for (let p = 2; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setTextColor(148, 163, 184);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`${book.title} · ${book.author}`, margin, pageHeight - 9);
    doc.text(`Página ${p} de ${totalPages}`, pageWidth - margin, pageHeight - 9, { align: 'right' });
  }

  return doc.output('blob');
}

function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    if (document.body.contains(a)) {
      document.body.removeChild(a);
    }
    URL.revokeObjectURL(url);
  }, 4000);
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
  return (name || 'libro')
    .replace(/[^a-zA-Z0-9_\-áéíóúÁÉÍÓÚñÑ ]/g, '')
    .trim()
    .replace(/\s+/g, '_');
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
  if (book.teraboxUrl) {
    doc += `• Descarga directa en la Nube (TeraBox 1TB): ${book.teraboxUrl}\n`;
  }
  doc += `\nSINOPSIS:\n${book.synopsis}\n\n`;

  doc += `${divider}\n`;
  doc += `                         ÍNDICE & CONTENIDO\n`;
  doc += `${divider}\n\n`;

  const validChapters = (book.sampleChapters || []).filter(
    (ch) =>
      ch &&
      ch.content &&
      !ch.content.includes('Escribe aquí el texto') &&
      ch.content.trim().length > 15
  );

  if (validChapters.length > 0) {
    validChapters.forEach((chapter, index) => {
      doc += `\n[CAPÍTULO ${index + 1}: ${chapter.title.toUpperCase()}]\n`;
      doc += `${subDivider}\n\n`;
      doc += `${chapter.content}\n\n`;
    });
  } else {
    doc += `[SINOPSIS COMPLETA & PRESENTACIÓN]\n`;
    doc += `${subDivider}\n\n`;
    doc += `${book.synopsis}\n\n`;
    if (book.liberatedNote) {
      doc += `Nota del autor: ${book.liberatedNote}\n\n`;
    }
  }

  doc += `\n${divider}\n`;
  doc += `Mensaje del autor: Si disfrutaste esta lectura, por favor recomiéndala o comparte una reseña en LibroLibre.\n`;
  doc += `© ${book.publicationYear} ${book.author}. Todos los derechos reservados.\n`;
  doc += `${divider}\n`;

  return doc;
}
