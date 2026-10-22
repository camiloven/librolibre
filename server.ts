import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Directories for server-side persistence
const DATA_DIR = path.resolve(__dirname, 'data');
const UPLOADS_DIR = path.resolve(__dirname, 'public', 'uploads');
const BOOKS_UPLOADS_DIR = path.resolve(UPLOADS_DIR, 'books');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
if (!fs.existsSync(BOOKS_UPLOADS_DIR)) {
  fs.mkdirSync(BOOKS_UPLOADS_DIR, { recursive: true });
}

const BOOKS_FILE = path.resolve(DATA_DIR, 'books.json');
const AUTHOR_FILE = path.resolve(DATA_DIR, 'author.json');
const COUPONS_FILE = path.resolve(DATA_DIR, 'coupons.json');
const TRANSACTIONS_FILE = path.resolve(DATA_DIR, 'transactions.json');

// Helper to save base64 data URLs to file system and return static URL
function processBase64Media(dataUrl: string | undefined, prefix: string): string {
  if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:')) {
    return dataUrl || '';
  }
  try {
    const matches = dataUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return dataUrl;
    }
    const mime = matches[1];
    const ext = mime.includes('png') ? 'png' : mime.includes('webp') ? 'webp' : mime.includes('pdf') ? 'pdf' : 'jpg';
    const buffer = Buffer.from(matches[2], 'base64');
    const filename = `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${ext}`;
    const filePath = path.resolve(UPLOADS_DIR, filename);
    fs.writeFileSync(filePath, buffer);
    return `/uploads/${filename}`;
  } catch (err) {
    console.error('Failed to write base64 media:', err);
    return dataUrl;
  }
}

// Helpers for reading/writing persistent JSON files
function readJsonFile<T>(filePath: string, fallback: T): T {
  try {
    if (!fs.existsSync(filePath)) {
      return fallback;
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return fallback;
  }
}

function writeJsonFile<T>(filePath: string, data: T): void {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
  }
}

app.use(express.json({ limit: '60mb' }));
app.use(express.urlencoded({ extended: true, limit: '60mb' }));

// Static route for uploaded book covers and files
app.use('/uploads', express.static(UPLOADS_DIR));

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    app: 'LibroLibre',
    timestamp: new Date().toISOString(),
  });
});

// ==========================================
// PERSISTENT BOOKS REST API
// ==========================================

// GET /api/books - Returns all books stored on the server
app.get('/api/books', (_req: Request, res: Response) => {
  const books = readJsonFile(BOOKS_FILE, []);
  res.json({ success: true, books });
});

// POST /api/upload-book-file - Uploads binary book files (PDF, EPUB, MOBI, etc.) to permanent storage
app.post('/api/upload-book-file', (req: Request, res: Response) => {
  try {
    const { fileName, fileData, fileType } = req.body;
    if (!fileData || typeof fileData !== 'string') {
      return res.status(400).json({ success: false, error: 'Datos de archivo requeridos' });
    }

    // Clean base64 prefix if present
    const base64Data = fileData.replace(/^data:([A-Za-z-+\/]+);base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    const extMatch = (fileName || '').match(/\.([0-9a-z]+)(?:[\?#]|$)/i);
    const ext = extMatch ? extMatch[1].toLowerCase() : (fileType ? fileType.toLowerCase() : 'pdf');

    const safeBaseName = (fileName || 'libro')
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_\-]/g, '_')
      .substring(0, 60);

    const generatedFileName = `${safeBaseName}-${Date.now()}.${ext}`;
    const targetPath = path.resolve(BOOKS_UPLOADS_DIR, generatedFileName);

    fs.writeFileSync(targetPath, buffer);

    const fileSizeMb = (buffer.length / (1024 * 1024)).toFixed(1);
    const fileSizeStr = buffer.length > 1024 * 1024 ? `${fileSizeMb} MB` : `${Math.round(buffer.length / 1024)} KB`;
    const downloadUrl = `/uploads/books/${generatedFileName}`;

    res.json({
      success: true,
      downloadUrl,
      fileName: fileName || generatedFileName,
      fileSize: fileSizeStr,
      fileType: ext.toUpperCase(),
    });
  } catch (err: any) {
    console.error('Error saving book file to server:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/books/:id/download - Stream downloadable book with attachment headers
app.get('/api/books/:id/download', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const books = readJsonFile<any[]>(BOOKS_FILE, []);
    const book = books.find((b) => b.id === id);

    // Support passing direct file url parameter
    const requestedFile = (req.query.file as string) || (book ? book.downloadUrl : null);

    if (requestedFile && typeof requestedFile === 'string') {
      const sanitizedRelative = requestedFile.replace(/^\/+/, '');
      const filePath = path.resolve(__dirname, 'public', sanitizedRelative);

      if (fs.existsSync(filePath)) {
        const originalName = book?.fileName || path.basename(filePath);
        return res.download(filePath, originalName);
      }
    }

    // Fallback: Generate real readable text-based eBook file with attachment header
    const safeTitle = (book?.title || 'LibroLibre-Edicion')
      .replace(/[^a-zA-Z0-9_\-áéíóúÁÉÍÓÚñÑ ]/g, '')
      .trim();
    const ext = book?.fileType?.toLowerCase() === 'epub' ? 'txt' : (book?.fileType?.toLowerCase() || 'txt');
    const filename = `${safeTitle}.${ext}`;

    let content = `================================================================\n`;
    content += `                  ${(book?.title || 'LIBRO').toUpperCase()}\n`;
    if (book?.subtitle) content += `               ${book.subtitle}\n`;
    content += `               Por: ${book?.author || 'Autor'}\n`;
    content += `================================================================\n\n`;
    content += `INFORMACIÓN EDITORIAL\n----------------------------------------------------------------\n`;
    content += `Género: ${book?.genre || 'General'}\nAño: ${book?.publicationYear || 2026}\nIdioma: ${book?.language || 'Español'}\n`;
    content += `\nSINOPSIS:\n${book?.synopsis || ''}\n\n`;

    if (book?.sampleChapters && book.sampleChapters.length > 0) {
      book.sampleChapters.forEach((ch: any, idx: number) => {
        content += `\n[CAPÍTULO ${idx + 1}: ${(ch.title || '').toUpperCase()}]\n----------------------------------------------------------------\n\n${ch.content || ''}\n\n`;
      });
    }

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.send(content);
  } catch (err: any) {
    res.status(500).send('Error al procesar la descarga: ' + err.message);
  }
});

// POST /api/books - Adds or updates a book on the server
app.post('/api/books', (req: Request, res: Response) => {
  try {
    const bookData = req.body;
    if (!bookData || !bookData.title) {
      return res.status(400).json({ success: false, error: 'Título requerido' });
    }

    // Process cover if it's base64
    if (bookData.coverUrl && bookData.coverUrl.startsWith('data:')) {
      bookData.coverUrl = processBase64Media(bookData.coverUrl, 'cover');
    }

    const books = readJsonFile<any[]>(BOOKS_FILE, []);
    const existingIndex = books.findIndex((b) => b.id === bookData.id);

    if (existingIndex >= 0) {
      books[existingIndex] = { ...books[existingIndex], ...bookData };
    } else {
      books.unshift(bookData);
    }

    writeJsonFile(BOOKS_FILE, books);
    res.json({ success: true, book: bookData, books });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/books/:id - Updates an existing book
app.put('/api/books/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    if (updates.coverUrl && updates.coverUrl.startsWith('data:')) {
      updates.coverUrl = processBase64Media(updates.coverUrl, 'cover');
    }

    const books = readJsonFile<any[]>(BOOKS_FILE, []);
    const index = books.findIndex((b) => b.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Libro no encontrado' });
    }

    books[index] = { ...books[index], ...updates };
    writeJsonFile(BOOKS_FILE, books);
    res.json({ success: true, book: books[index], books });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/books/:id - Deletes a book permanently (Admin only)
app.delete('/api/books/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const books = readJsonFile<any[]>(BOOKS_FILE, []);
    const filtered = books.filter((b) => b.id !== id);
    writeJsonFile(BOOKS_FILE, filtered);
    res.json({ success: true, books: filtered });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/books/:id/toggle-liberate - Toggles book liberation
app.post('/api/books/:id/toggle-liberate', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const books = readJsonFile<any[]>(BOOKS_FILE, []);
    const index = books.findIndex((b) => b.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Libro no encontrado' });
    }

    const book = books[index];
    const isNowLiberated = !book.isLiberated;
    books[index] = {
      ...book,
      isLiberated: isNowLiberated,
      liberatedAt: isNowLiberated ? new Date().toISOString() : undefined,
      liberatedNote: isNowLiberated
        ? (book.liberatedNote || '¡Obra liberada gratuitamente por el autor para acceso libre en Chile!')
        : undefined,
    };

    writeJsonFile(BOOKS_FILE, books);
    res.json({ success: true, book: books[index], books });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/books/:id/increment-download
app.post('/api/books/:id/increment-download', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const books = readJsonFile<any[]>(BOOKS_FILE, []);
    const index = books.findIndex((b) => b.id === id);
    if (index !== -1) {
      books[index].downloadCount = (books[index].downloadCount || 0) + 1;
      writeJsonFile(BOOKS_FILE, books);
      return res.json({ success: true, book: books[index] });
    }
    res.status(404).json({ success: false, error: 'Libro no encontrado' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// AUTHOR PROFILE REST API
// ==========================================

app.get('/api/author', (_req: Request, res: Response) => {
  const author = readJsonFile(AUTHOR_FILE, null);
  res.json({ success: true, author });
});

app.post('/api/author', (req: Request, res: Response) => {
  try {
    const authorData = req.body;
    if (authorData.avatarUrl && authorData.avatarUrl.startsWith('data:')) {
      authorData.avatarUrl = processBase64Media(authorData.avatarUrl, 'avatar');
    }
    writeJsonFile(AUTHOR_FILE, authorData);
    res.json({ success: true, author: authorData });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ==========================================
// COUPONS & TRANSACTIONS REST API
// ==========================================

app.get('/api/coupons', (_req: Request, res: Response) => {
  const coupons = readJsonFile(COUPONS_FILE, []);
  res.json({ success: true, coupons });
});

app.post('/api/coupons', (req: Request, res: Response) => {
  try {
    const coupon = req.body;
    const coupons = readJsonFile<any[]>(COUPONS_FILE, []);
    coupons.unshift(coupon);
    writeJsonFile(COUPONS_FILE, coupons);
    res.json({ success: true, coupons });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/coupons/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const coupons = readJsonFile<any[]>(COUPONS_FILE, []);
    const filtered = coupons.filter((c) => c.id !== id);
    writeJsonFile(COUPONS_FILE, filtered);
    res.json({ success: true, coupons: filtered });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/transactions', (_req: Request, res: Response) => {
  const txs = readJsonFile(TRANSACTIONS_FILE, []);
  res.json({ success: true, transactions: txs });
});

app.post('/api/transactions', (req: Request, res: Response) => {
  try {
    const tx = req.body;
    const txs = readJsonFile<any[]>(TRANSACTIONS_FILE, []);
    txs.unshift(tx);
    writeJsonFile(TRANSACTIONS_FILE, txs);
    res.json({ success: true, transactions: txs });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

async function startServer() {
  const distPath = path.resolve(__dirname, 'dist');
  const hasDist = fs.existsSync(distPath) && fs.existsSync(path.resolve(distPath, 'index.html'));

  if (isProduction) {
    // Serve production static assets from dist
    app.use(express.static(distPath));

    // Serve public directory assets as fallback
    app.use(express.static(path.resolve(__dirname, 'public')));

    // SPA wildcard fallback
    app.get('*', (_req: Request, res: Response) => {
      const indexPath = path.resolve(distPath, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.sendFile(path.resolve(__dirname, 'index.html'));
      }
    });
  } else {
    // Development mode with Vite live middlewares
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LibroLibre server running on port ${PORT} with persistent disk storage enabled`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start LibroLibre server:', err);
});
