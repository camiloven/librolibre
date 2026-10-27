import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { File as MegaFile } from 'megajs';

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

const DEFAULT_SERVER_BOOKS = [
  {
    id: 'book-1',
    title: 'El Faro del Silencio',
    subtitle: 'Una novela sobre la soledad, el mar y los secretos familiares',
    author: 'Camilo V.',
    synopsis: 'En una costa azotada por el oleaje del Pacífico sur, Clara hereda la bitácora del viejo faro. Al descifrar los apuntes que su abuelo guardó durante cuatro décadas, descubre que algunos naufragios nunca fueron accidentes, sino pactos para salvar vidas que el continente creía perdidas.',
    genre: 'Ficción Literaria',
    pricingType: 'free',
    price: 0,
    isLiberated: false,
    downloadCount: 1420,
    pageCount: 312,
    language: 'Español',
    publicationYear: 2025,
    fileType: 'PDF',
    fileSize: '3.8 MB',
    rating: 4.9,
    sampleChapters: [
      {
        id: 'ch-1',
        title: 'La marea de medianoche',
        content: `La linterna del faro giraba con un quejido mecánico que Clara recordaba desde sus siete años. Aquel chirrido rítmico no era una molestia, sino el latido del acantilado. Afuera, la tormenta de octubre golpeaba los cristales con salitre blanco.\n\nEn la mesa de roble, el cuaderno encuadernado en cuero crudo descansaba junto a una taza de té humeante. La primera página no contenía registros de mareas ni velocidades de viento, sino siete nombres tachados con tinta negra. El primero de ellos era el de su propia madre.\n\n"Quien vigila la luz no decide a quién salva", rezaba una anotación al margen con la caligrafía temblorosa del viejo Tomás.`
      }
    ]
  },
  {
    id: 'book-2',
    title: 'El Arte de Encontrar el Equilibrio',
    subtitle: 'Guía minimalista para calmar la mente y simplificar la vida diaria',
    author: 'Camilo V.',
    synopsis: 'Un manual sereno y profundamente humano para desarmar la prisa moderna. A través de reflexiones breves, ejercicios de atención plena y principios de diseño vital, este libro enseña a soltar el exceso de equipaje emocional y construir rutinas con calma y propósito.',
    genre: 'Desarrollo Personal',
    pricingType: 'paid',
    price: 9990,
    isLiberated: true,
    liberatedNote: '¡Obra liberada gratuitamente por el autor para todos los lectores en Chile y el mundo!',
    downloadCount: 3840,
    pageCount: 224,
    language: 'Español',
    publicationYear: 2024,
    fileType: 'PDF',
    fileSize: '4.2 MB',
    rating: 4.95,
    sampleChapters: [
      {
        id: 'ch-1',
        title: 'El peso de lo innecesario',
        content: `Creemos que necesitamos más: más horas en el día, más proyectos en la libreta, más opiniones que escuchar. Pero la serenidad no es el resultado de acumular recursos, sino de tener la valentía de restar ruido.\n\nCuando colocas tres piedras en equilibrio, la última no se sostiene por la fuerza, sino por la precisión de su punto de contacto. Lo mismo ocurre con tu mente: cada compromiso que aceptas sin convicción es un peso muerto que desestabiliza el conjunto.`
      }
    ]
  },
  {
    id: 'book-3',
    title: 'The Aeon Chronicles: Horizontes de Neón',
    subtitle: 'Ciencia ficción especulativa en un futuro de megaciudades y conciencia digital',
    author: 'Camilo V.',
    synopsis: 'Año 2184. En la megalópolis costera de Nueva Valparaíso, los recuerdos humanos cotizan en bolsa de valores sintética. Kael, un archivista disidente, tropieza con una memoria prohibida que demuestra que la última extinción biológica fue programada.',
    genre: 'Ciencia Ficción',
    pricingType: 'paid',
    price: 6990,
    isLiberated: false,
    downloadCount: 890,
    pageCount: 440,
    language: 'Español',
    publicationYear: 2026,
    fileType: 'PDF',
    fileSize: '5.1 MB',
    rating: 4.88,
    sampleChapters: [
      {
        id: 'ch-1',
        title: 'Mercaderes de memoria',
        content: `La lluvia ácida repiqueteaba sobre la cúpula de acrílico blindado. En los callejones del nivel 12, los hologramas corporativos parpadeaban ofreciendo recuerdos ajenos a cambio de créditos de carbono.\n\nKael ajustó su visor neural. El fragmento de memoria que sostenía en el chip de cuarzo no era una simulación: latía con la frecuencia biológica de un cerebro real.`
      }
    ]
  },
  {
    id: 'book-4',
    title: 'Hábitos Cotidianos de Alto Rendimiento',
    subtitle: 'Sistemas sencillos para trabajar con foco profundo y bienestar sostenible',
    author: 'Camilo V.',
    synopsis: 'Estrategias probadas para maximizar tu energía y concentración diaria. Aprende a crear bloques de trabajo profundo, eliminar la fatiga por decisiones y diseñar un entorno que fomente la excelencia constante sin caer en el agotamiento.',
    genre: 'Productividad & Foco',
    pricingType: 'paid',
    price: 7990,
    isLiberated: false,
    downloadCount: 2150,
    pageCount: 260,
    language: 'Español',
    publicationYear: 2025,
    fileType: 'PDF',
    fileSize: '3.5 MB',
    rating: 4.92,
    sampleChapters: [
      {
        id: 'ch-1',
        title: 'La arquitectura del foco matutino',
        content: `Las dos primeras horas de tu jornada determinan la dirección de tu energía. Si comienzas reaccionando a las demandas de otros en tu teléfono, cedes el control del día antes de haberlo empezado.\n\nEl trabajo profundo no es una cuestión de fuerza de voluntad, sino de fricción: reduce la fricción hacia lo que importa y auméntala exponencialmente hacia las distracciones.`
      }
    ]
  }
];

// Ensure initial books are present
try {
  if (!fs.existsSync(BOOKS_FILE) || fs.readFileSync(BOOKS_FILE, 'utf-8').trim() === '[]' || fs.readFileSync(BOOKS_FILE, 'utf-8').trim() === '') {
    fs.writeFileSync(BOOKS_FILE, JSON.stringify(DEFAULT_SERVER_BOOKS, null, 2), 'utf-8');
  }
} catch (e) {
  console.warn('Initial books check warning:', e);
}

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

const DATA_BOOKS_DIR = path.resolve(DATA_DIR, 'book_files');
if (!fs.existsSync(DATA_BOOKS_DIR)) {
  fs.mkdirSync(DATA_BOOKS_DIR, { recursive: true });
}

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
    const backupPath = path.resolve(DATA_BOOKS_DIR, generatedFileName);

    // Save in public uploads and in data directory
    fs.writeFileSync(targetPath, buffer);
    try {
      fs.writeFileSync(backupPath, buffer);
    } catch (e) {
      console.warn('Backup book write warning:', e);
    }

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
    const books = readJsonFile<any[]>(BOOKS_FILE, DEFAULT_SERVER_BOOKS);
    const book = books.find((b) => b.id === id) || DEFAULT_SERVER_BOOKS.find((b) => b.id === id) || DEFAULT_SERVER_BOOKS[0];

    // Support passing direct file url parameter
    const requestedFile = (req.query.file as string) || (book ? book.downloadUrl : null);

    if (requestedFile && typeof requestedFile === 'string') {
      const baseName = path.basename(requestedFile);
      const candidates = [
        path.resolve(__dirname, 'public', requestedFile.replace(/^\/+/, '')),
        path.resolve(BOOKS_UPLOADS_DIR, baseName),
        path.resolve(DATA_BOOKS_DIR, baseName),
        path.resolve(__dirname, requestedFile.replace(/^\/+/, '')),
      ];

      for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
          const originalName = book?.fileName || path.basename(candidate);
          return res.download(candidate, originalName);
        }
      }
    }

    // If file is not present on ephemeral server disk, return 404 JSON so client uses Cloud Firestore chunks or jsPDF
    return res.status(404).json({
      error: 'file_not_found_on_server',
      message: 'Archivo no encontrado en disco local del servidor; el cliente procederá con la descarga desde Firestore.'
    });
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

// ==========================================
// MEGA.IO COVER & METADATA AUTO-EXTRACTOR API
// ==========================================

app.post('/api/extract-mega-cover', async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ success: false, error: 'URL requerida' });
    }

    const cleanUrl = url.trim();
    if (!cleanUrl.includes('mega.nz') && !cleanUrl.includes('mega.io')) {
      return res.status(400).json({ success: false, error: 'Enlace no válido de MEGA' });
    }

    let targetFile: any;
    try {
      const megaItem = MegaFile.fromURL(cleanUrl);
      await megaItem.loadAttributes();

      if (megaItem.directory) {
        // If it's a folder, look for an image file first, or the first PDF
        const children = megaItem.children || [];
        const imageFile = children.find((c: any) => 
          !c.directory && /\.(jpe?g|png|webp)$/i.test(c.name || '')
        );
        const pdfFile = children.find((c: any) => 
          !c.directory && /\.pdf$/i.test(c.name || '')
        );
        targetFile = imageFile || pdfFile || children.find((c: any) => !c.directory);
        
        if (!targetFile) {
          const folderName = megaItem.name || 'Carpeta MEGA';
          return res.json({
            success: true,
            title: folderName,
            fileName: folderName,
            isFolder: true,
            fileType: 'PDF'
          });
        }
      } else {
        targetFile = megaItem;
      }
    } catch (megaErr: any) {
      console.warn('MEGA loadAttributes error:', megaErr?.message);
      return res.status(400).json({ 
        success: false, 
        error: 'No se pudo leer el archivo en MEGA. Asegúrate de incluir la clave de descifrado del enlace (ej: #...)' 
      });
    }

    const fileName = targetFile.name || 'Libro Digital';
    const fileSize = targetFile.size ? `${(targetFile.size / (1024 * 1024)).toFixed(1)} MB` : '3.0 MB';
    const ext = (fileName.split('.').pop() || '').toUpperCase();
    const cleanTitle = fileName.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
    const formattedTitle = cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1);

    // If target file is an image (JPG, PNG, WEBP), download it directly (up to 5MB)
    if (['JPG', 'JPEG', 'PNG', 'WEBP'].includes(ext)) {
      const buffer = await targetFile.downloadBuffer({ maxBytes: 5 * 1024 * 1024 });
      const mime = ext === 'PNG' ? 'image/png' : ext === 'WEBP' ? 'image/webp' : 'image/jpeg';
      const coverUrl = `data:${mime};base64,${buffer.toString('base64')}`;
      return res.json({
        success: true,
        title: formattedTitle,
        fileName,
        fileSize,
        fileType: 'PDF',
        coverUrl
      });
    }

    // If target file is a PDF, download up to 6MB so the client can extract page 1 with PDF.js
    if (ext === 'PDF') {
      const maxBytes = Math.min(targetFile.size || 6 * 1024 * 1024, 6 * 1024 * 1024);
      const buffer = await targetFile.downloadBuffer({ maxBytes });
      const pdfBase64 = buffer.toString('base64');
      return res.json({
        success: true,
        title: formattedTitle,
        fileName,
        fileSize,
        fileType: 'PDF',
        pdfBase64
      });
    }

    // Other file types
    return res.json({
      success: true,
      title: formattedTitle,
      fileName,
      fileSize,
      fileType: ['EPUB', 'MOBI', 'TXT', 'DOCX'].includes(ext) ? ext : 'PDF'
    });
  } catch (err: any) {
    console.error('Unhandled error in /api/extract-mega-cover:', err);
    res.status(500).json({ success: false, error: err.message || 'Error procesando archivo de MEGA' });
  }
});

async function startServer() {
  const rootDir = process.cwd();
  const distPath = path.resolve(rootDir, 'dist');
  const indexPath = path.resolve(distPath, 'index.html');

  if (isProduction) {
    // If production build does not exist yet, build it automatically on startup
    if (!fs.existsSync(indexPath)) {
      console.log('⚡ dist/index.html not detected. Running production build now...');
      try {
        const { execSync } = await import('child_process');
        execSync('npm run build', { stdio: 'inherit' });
      } catch (err) {
        console.error('Failed to run automated build:', err);
      }
    }

    // Serve production static assets from dist with no-cache on HTML/SW
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath, {
        setHeaders: (res, filePath) => {
          if (filePath.endsWith('.html') || filePath.endsWith('sw.js') || filePath.endsWith('registerSW.js')) {
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
          } else {
            res.setHeader('Cache-Control', 'public, max-age=86400');
          }
        },
        index: false
      }));
    }

    // Serve public directory assets as fallback
    const publicPath = path.resolve(rootDir, 'public');
    if (fs.existsSync(publicPath)) {
      app.use(express.static(publicPath, { maxAge: '1d', index: false }));
    }

    // SPA wildcard fallback
    app.get('*', (req: Request, res: Response) => {
      // Do not return HTML for missing static files (scripts, styles, images)
      if (req.path.match(/\.[a-zA-Z0-9]+$/)) {
        return res.status(404).end();
      }

      if (fs.existsSync(indexPath)) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        return res.sendFile(indexPath);
      }

      // Fallback HTML if build failed
      return res.status(200).send(`<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>LibroLibre - Iniciando</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body { background: #0b0f19; color: #f8fafc; font-family: sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; text-align: center; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 16px; padding: 32px; max-width: 480px; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.5); }
    h1 { color: #f59e0b; font-size: 24px; margin-bottom: 12px; }
    p { color: #94a3b8; font-size: 15px; line-height: 1.5; margin-bottom: 24px; }
    button { background: #f59e0b; color: #0b0f19; font-weight: bold; border: none; border-radius: 8px; padding: 12px 24px; font-size: 14px; cursor: pointer; }
    button:hover { background: #d97706; }
  </style>
</head>
<body>
  <div class="card">
    <h1>📖 LibroLibre</h1>
    <p>La plataforma se está compilando para producción en el servidor. Por favor recarga en unos segundos.</p>
    <button onclick="window.location.reload()">Recargar Aplicación</button>
  </div>
</body>
</html>`);
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
