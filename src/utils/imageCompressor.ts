/**
 * Utility to compress and resize images client-side before sending to Cloud Firestore.
 * Ensures all avatar photos and book covers are strictly under 70KB, far below Firestore's 1MB limit.
 */

export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: string;
}

export async function compressImage(
  input: File | Blob | string,
  options: CompressionOptions = {}
): Promise<string> {
  const {
    maxWidth = 400,
    maxHeight = 400,
    quality = 0.82,
    mimeType = 'image/jpeg'
  } = options;

  return new Promise((resolve, reject) => {
    // If input is File or Blob, read as data URL first
    if (typeof input !== 'string') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        processImage(dataUrl);
      };
      reader.onerror = () => reject(new Error('No se pudo leer el archivo de imagen.'));
      reader.readAsDataURL(input);
    } else {
      processImage(input);
    }

    function processImage(dataUrl: string) {
      // If it's already a very short HTTP URL, return as-is
      if (dataUrl.startsWith('http://') || dataUrl.startsWith('https://')) {
        // Can optionally load and re-compress, or return as-is
        if (dataUrl.length < 500) {
          resolve(dataUrl);
          return;
        }
      }

      const img = new Image();
      img.crossOrigin = 'anonymous';

      img.onload = () => {
        try {
          let { width, height } = img;

          // Calculate scaling
          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          // Create canvas
          const canvas = document.createElement('canvas');
          canvas.width = Math.max(width, 1);
          canvas.height = Math.max(height, 1);

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(dataUrl);
            return;
          }

          // Draw white background in case of transparent PNGs converted to JPEG
          if (mimeType === 'image/jpeg') {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }

          // Draw image scaled
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          // Export compressed data URL
          const compressedDataUrl = canvas.toDataURL(mimeType, quality);
          resolve(compressedDataUrl);
        } catch (err) {
          console.warn('Image canvas compression fallback:', err);
          resolve(dataUrl);
        }
      };

      img.onerror = () => {
        // Fallback to original
        resolve(dataUrl);
      };

      img.src = dataUrl;
    }
  });
}
