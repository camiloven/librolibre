import { Book } from '../types/book';
import { jsPDF } from 'jspdf';

/**
 * Triggers a real browser file download for a book.
 * 1. If the author uploaded a specific binary file (Blob, Uint8Array or Base64), it downloads that exact file.
 * 2. If the author specified an external download URL, it downloads from that URL.
 * 3. For catalog books, it crafts a genuine, high-quality, formatted PDF file using jsPDF,
 *    complete with cover page, editorial metadata, reader license certificate, and sample chapters.
 */
export async function downloadBookFile(
  book: Book,
  readerName: string = 'Lector Invitado',
  downloadToken?: string
): Promise<void> {
  const safeBaseName = sanitizeFileName(book.title) || 'libro';
  const fileExt = (book.fileType || 'PDF').toLowerCase();
  const cleanFileName = book.fileName || `${safeBaseName}.${fileExt}`;

  // 1. If book has a custom uploaded file stored as Blob or Base64 in memory
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
      console.warn('Error reading uploadedFileBlob, generating PDF fallback:', err);
    }
  }

  // 2. If book has a server-hosted file uploaded by author
  if (book.downloadUrl && !book.downloadUrl.startsWith('data:')) {
    const downloadEndpoint = `/api/books/${book.id}/download?file=${encodeURIComponent(book.downloadUrl)}`;
    triggerUrlDownload(downloadEndpoint, cleanFileName);
    return;
  }

  // 3. For PDF (default): generate a real, beautifully formatted PDF document with jsPDF!
  if (fileExt === 'pdf') {
    try {
      const pdfBlob = createRealPdfBook(book, readerName, downloadToken);
      triggerBlobDownload(pdfBlob, `${safeBaseName}.pdf`);
      return;
    } catch (pdfErr) {
      console.error('Error generating jsPDF, falling back to document text:', pdfErr);
    }
  }

  // 4. For TXT or text-based formats
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

  // Technical metadata card
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(margin, nextY, contentWidth, 40, 2, 2, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(margin, nextY, contentWidth, 40, 2, 2, 'S');

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

  // ----------------------------------------------------
  // CHAPTERS PAGES
  // ----------------------------------------------------
  if (book.sampleChapters && book.sampleChapters.length > 0) {
    for (let i = 0; i < book.sampleChapters.length; i++) {
      const chapter = book.sampleChapters[i];
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
    // If no sample chapters, provide introductory reading
    doc.addPage();
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Capítulo 1: Introducción', margin, 28);
    doc.setDrawColor(245, 158, 11);
    doc.setLineWidth(0.8);
    doc.line(margin, 33, margin + 45, 33);

    doc.setTextColor(51, 65, 85);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    const introText = `Estimado(a) ${readerName}:\n\nGracias por descargar "${book.title}" de ${book.author} a través de la plataforma LibroLibre. Esta obra representa el compromiso con la literatura independiente y el acceso a la cultura sin intermediarios.\n\nEsperamos disfrutes cada página de esta lectura.\n\n© ${book.publicationYear} ${book.author}. Todos los derechos reservados.`;
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
