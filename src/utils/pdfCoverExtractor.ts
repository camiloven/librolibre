import * as pdfjsLib from 'pdfjs-dist';

// Set up worker source
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version || '4.10.38'}/pdf.worker.min.mjs`;
}

/**
 * Automatically extracts the first page of an uploaded PDF file and returns it as a JPEG data URL
 * so that the user's book uses its own actual cover page without needing to manually upload a cover image!
 */
export async function extractCoverFromPdf(fileOrBuffer: File | ArrayBuffer, fallbackTitle?: string): Promise<string> {
  try {
    const arrayBuffer = fileOrBuffer instanceof ArrayBuffer ? fileOrBuffer : await fileOrBuffer.arrayBuffer();

    // Load PDF document
    const loadingTask = pdfjsLib.getDocument({
      data: arrayBuffer,
    });

    const pdf = await loadingTask.promise;
    
    // Page 1 is the cover of the book
    const page = await pdf.getPage(1);
    
    // Desired resolution (standard 480px width for sharp book cover display & lightweight storage)
    const baseViewport = page.getViewport({ scale: 1.0 });
    const targetWidth = 480;
    const scale = targetWidth / baseViewport.width;
    const viewport = page.getViewport({ scale });

    // Create offscreen canvas
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas 2D context not available');
    }

    // White background to prevent transparency issues
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Render PDF page into canvas
    const renderContext = {
      canvasContext: ctx,
      viewport: viewport,
    };

    await page.render(renderContext as any).promise;

    // Convert to optimized JPEG data URL (~70KB - 110KB)
    const coverDataUrl = canvas.toDataURL('image/jpeg', 0.78);
    return coverDataUrl;
  } catch (error) {
    console.warn('PDF.js cover extraction failed, trying direct binary scan fallback:', error);
    return extractCoverFromPdfBinary(fileOrBuffer, fallbackTitle);
  }
}

/**
 * Fallback: scans the PDF binary for the first embedded JPEG or PNG stream
 */
async function extractCoverFromPdfBinary(fileOrBuffer: File | ArrayBuffer, fallbackTitle?: string): Promise<string> {
  try {
    const arrayBuffer = fileOrBuffer instanceof ArrayBuffer ? fileOrBuffer : await fileOrBuffer.arrayBuffer();
    const uint8 = new Uint8Array(arrayBuffer);

    // Look for JPEG magic bytes (FF D8 FF)
    for (let i = 0; i < Math.min(uint8.length - 3, 2000000); i++) {
      if (uint8[i] === 0xFF && uint8[i + 1] === 0xD8 && uint8[i + 2] === 0xFF) {
        // Find JPEG end (FF D9)
        for (let j = i + 3; j < Math.min(uint8.length - 1, i + 5000000); j++) {
          if (uint8[j] === 0xFF && uint8[j + 1] === 0xD9) {
            const jpegBytes = uint8.slice(i, j + 2);
            if (jpegBytes.length > 10000) { // Reasonable image size
              const blob = new Blob([jpegBytes], { type: 'image/jpeg' });
              return await blobToDataUrl(blob);
            }
          }
        }
      }
    }
  } catch (e) {
    console.error('Binary cover scan failed:', e);
  }

  // Graceful fallback: generate cover canvas with title
  const nameToUse = fallbackTitle || (fileOrBuffer instanceof File ? fileOrBuffer.name.replace(/\.[^/.]+$/, '') : 'Libro Digital');
  return generateTextBookCover(nameToUse);
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Creates a clean cover canvas fallback with the title if PDF has no rasterized cover
 */
export function generateTextBookCover(title: string): string {
  const canvas = document.createElement('canvas');
  canvas.width = 600;
  canvas.height = 800; // 3:4 aspect ratio
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background gradient (elegant navy / charcoal)
  const grad = ctx.createLinearGradient(0, 0, 600, 800);
  grad.addColorStop(0, '#0f172a');
  grad.addColorStop(1, '#020617');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 600, 800);

  // Decorative border
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
  ctx.lineWidth = 4;
  ctx.strokeRect(30, 30, 540, 740);

  ctx.strokeStyle = 'rgba(245, 158, 11, 0.2)';
  ctx.lineWidth = 1;
  ctx.strokeRect(40, 40, 520, 720);

  // Title text
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 36px Georgia, serif';
  ctx.textAlign = 'center';

  const cleanTitle = title.replace(/[_-]/g, ' ').toUpperCase();
  wrapText(ctx, cleanTitle, 300, 320, 440, 48);

  // Footer label
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 16px sans-serif';
  ctx.fillText('EDICIÓN DIGITAL DEL AUTOR', 300, 700);

  return canvas.toDataURL('image/jpeg', 0.85);
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
  const words = text.split(' ');
  let line = '';
  let curY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + ' ';
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && n > 0) {
      ctx.fillText(line.trim(), x, curY);
      line = words[n] + ' ';
      curY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line.trim(), x, curY);
}
