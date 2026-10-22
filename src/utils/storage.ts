import { Book, AuthorProfile, Coupon, Transaction } from '../types/book';

// Seed book covers from assets
import coverSilence from '../assets/images/cover_silence_lighthouses_1792626123142.jpg';
import coverCalmMind from '../assets/images/cover_calm_mind_1792626123638.jpg';
import coverFutureChronicles from '../assets/images/cover_future_chronicles_1792626125054.jpg';
import coverDailyHabits from '../assets/images/cover_daily_habits_1792626124494.jpg';

const STORAGE_KEYS = {
  BOOKS: 'librolibre_books_clp_v2',
  AUTHOR: 'librolibre_author_chile_v2',
  COUPONS: 'librolibre_coupons_chile_v2',
  TRANSACTIONS: 'librolibre_transactions_chile_v2',
  ADMIN_SESSION: 'librolibre_admin_logged_in_v1',
};

// Default Chilean Author Profile with BancoEstado & Mercado Pago Chile
export const DEFAULT_AUTHOR: AuthorProfile = {
  name: 'Camilo V. & Ediciones Independientes Chile',
  bio: 'Escritor e investigador independiente chileno. Publico y distribuyo directamente mis obras para la comunidad lectora en Chile y el mundo, sin intermediarios ni recargos editoriales. Puedes descargar gratis los títulos que libero o apoyar con transferencias locales y Mercado Pago.',
  tagline: 'Literatura y conocimiento independiente en Chile.',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  email: 'camiloven@gmail.com',
  website: 'https://camiloven.com',
  currency: 'CLP',
  currencySymbol: '$',
  adminPin: '1234', // PIN por defecto para el Modo Administrador
  paymentMethods: {
    chile: {
      bancoEstado: {
        enabled: true,
        accountType: 'CuentaRUT',
        accountNumber: '18234567',
        rut: '18.234.567-8',
        holderName: 'Camilo V.',
        notifyEmail: 'camiloven@gmail.com',
        instructions: 'Transfiere desde tu app BancoEstado o cualquier banco chileno usando los datos indicados y envía el comprobante a camiloven@gmail.com o regístralo aquí para descarga inmediata.',
      },
      mercadoPagoChile: {
        enabled: true,
        linkOrAlias: 'mercadopago.cl/camilo-autor',
        qrOrCode: 'camilo.libros.mp',
        instructions: 'Paga con dinero en cuenta de Mercado Pago Chile, Tarjeta de Débito (Redcompra) o Crédito.',
      },
      webpay: {
        enabled: true,
        paymentLink: 'https://webpay.transbank.cl/camilo-libros',
        provider: 'Webpay Plus / Transbank / Redcompra',
      },
      machTenpo: {
        enabled: true,
        walletType: 'Mach',
        phoneOrHandle: '+56 9 8765 4321 / @camilo-autor',
      },
    },
    paypal: {
      enabled: true,
      emailOrLink: 'camiloven@gmail.com',
      username: 'paypal.me/camiloven',
    },
  },
};

// Initial library with prices configured in Chilean Pesos (CLP)
export const INITIAL_BOOKS: Book[] = [
  {
    id: 'book-1',
    title: 'El Faro del Silencio',
    subtitle: 'Una novela sobre la soledad, el mar y los secretos familiares',
    author: 'Camilo V.',
    synopsis: 'En una costa azotada por el oleaje del Pacífico sur, Clara hereda la bitácora del viejo faro. Al descifrar los apuntes que su abuelo guardó durante cuatro décadas, descubre que algunos naufragios nunca fueron accidentes, sino pactos para salvar vidas que el continente creía perdidas.',
    genre: 'Ficción Literaria',
    coverUrl: coverSilence,
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
    reviewCount: 88,
    createdAt: '2025-01-15',
    tags: ['Novela', 'Chile', 'Misterio', 'Drama'],
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
    coverUrl: coverCalmMind,
    pricingType: 'paid',
    price: 9990, // $9.990 CLP
    isLiberated: true, // LIBERADO POR EL AUTOR
    liberatedNote: '¡Obra liberada gratuitamente por el autor para todos los lectores en Chile y el mundo!',
    liberatedAt: '2026-10-15',
    downloadCount: 3840,
    pageCount: 224,
    language: 'Español',
    publicationYear: 2024,
    fileType: 'PDF',
    fileSize: '4.2 MB',
    rating: 4.95,
    reviewCount: 215,
    createdAt: '2024-08-20',
    tags: ['Mindfulness', 'Minimalismo', 'Paz Mental', 'Bienestar'],
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
    coverUrl: coverFutureChronicles,
    pricingType: 'paid',
    price: 6990, // $6.990 CLP
    isLiberated: false,
    downloadCount: 890,
    pageCount: 440,
    language: 'Español',
    publicationYear: 2026,
    fileType: 'EPUB',
    fileSize: '5.1 MB',
    rating: 4.8,
    reviewCount: 64,
    createdAt: '2026-03-01',
    tags: ['Sci-Fi', 'Cyberpunk', 'Futuro'],
    sampleChapters: [
      {
        id: 'ch-1',
        title: 'El mercado de memorias',
        content: `Bajo los paneles holográficos del Sector 9, la lluvia ácida tenía el sabor de los metales pesados. Kael ajustó el collar neural que amortiguaba la sobrecarga sensorial de la red central.\n\nEn su terminal de cuarzo, la transacción apareció sin remitente: 40 gigabits de memoria pura no indexada.`
      }
    ]
  },
  {
    id: 'book-4',
    title: 'Elevate: Hábitos para el Alto Rendimiento',
    subtitle: 'Estrategias probadas de productividad con propósito y foco profundo',
    author: 'Camilo V.',
    synopsis: 'Cómo multiplicar tu capacidad creativa y laboral sin sacrificar tu salud ni tus relaciones personales. Un sistema práctico probado paso a paso para profesionales y creadores.',
    genre: 'Productividad & Negocios',
    coverUrl: coverDailyHabits,
    pricingType: 'pwyw',
    price: 8990, // $8.990 CLP sugerido
    allowPwywMin: 1000, // $1.000 CLP mínimo
    isLiberated: false,
    downloadCount: 2150,
    pageCount: 280,
    language: 'Español',
    publicationYear: 2025,
    fileType: 'PDF',
    fileSize: '3.2 MB',
    rating: 4.88,
    reviewCount: 142,
    createdAt: '2025-05-10',
    tags: ['Productividad', 'Hábitos', 'Enfoque', 'Carrera'],
    sampleChapters: [
      {
        id: 'ch-1',
        title: 'La regla del bloque intocable',
        content: `Los profesionales mediocres gestionan su tiempo; los creadores extraordinarios gestionan su atención. No necesitas ocho horas de trabajo extenuante para producir una obra maestra: necesitas noventa minutos de concentración profunda sin interrupciones.`
      }
    ]
  }
];

export const INITIAL_COUPONS: Coupon[] = [
  {
    id: 'c-1',
    code: 'CHILELIBRE',
    discountPercent: 100,
    uses: 18,
    maxUses: 200,
    active: true,
    description: 'Cupón especial 100% gratuito para lectores en Chile',
  },
  {
    id: 'c-2',
    code: 'AUTORGRATIS',
    discountPercent: 100,
    uses: 14,
    maxUses: 100,
    active: true,
    description: 'Cupón de cortesía para difusión y prensa',
  }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-clp-101',
    bookId: 'book-2',
    bookTitle: 'El Arte de Encontrar el Equilibrio',
    readerName: 'Ignacio Morales',
    readerEmail: 'ignacio.morales.chile@gmail.com',
    amount: 0,
    currency: 'CLP',
    type: 'liberated',
    paymentMethod: 'Descarga Directa (Liberado por Autor)',
    date: '2026-10-21 16:30',
    downloadFormat: 'PDF',
  },
  {
    id: 'tx-clp-102',
    bookId: 'book-3',
    bookTitle: 'The Aeon Chronicles: Horizontes de Neón',
    readerName: 'Valentina Soto',
    readerEmail: 'valesoto.design@gmail.com',
    amount: 6990,
    currency: 'CLP',
    type: 'paid',
    paymentMethod: 'BancoEstado CuentaRUT',
    transferReference: 'TRF-98231',
    date: '2026-10-21 15:10',
    downloadFormat: 'EPUB',
  },
  {
    id: 'tx-clp-103',
    bookId: 'book-4',
    bookTitle: 'Elevate: Hábitos para el Alto Rendimiento',
    readerName: 'Matías Silva',
    readerEmail: 'matias.silva@uai.cl',
    amount: 8990,
    currency: 'CLP',
    type: 'paid',
    paymentMethod: 'Mercado Pago Chile',
    date: '2026-10-21 12:45',
    downloadFormat: 'PDF',
  }
];

// Load & Save Books (Local Cache + Quota Protection)
export function loadBooks(): Book[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BOOKS);
    if (!raw) {
      saveBooks(INITIAL_BOOKS);
      return INITIAL_BOOKS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_BOOKS;
  } catch {
    return INITIAL_BOOKS;
  }
}

export function saveBooks(books: Book[]): void {
  try {
    const sanitized = books.map((b) => {
      // Omit huge raw binary blob objects from localStorage
      const { uploadedFileBlob, ...rest } = b;
      return rest;
    });
    localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(sanitized));
  } catch (e) {
    console.warn('LocalStorage save failed, trying lightweight cache:', e);
    // Fallback: strip heavy base64 covers if localStorage quota exceeded
    try {
      const lightweight = books.map((b) => {
        const { uploadedFileBlob, ...rest } = b;
        if (rest.coverUrl && rest.coverUrl.length > 5000 && rest.coverUrl.startsWith('data:')) {
          return { ...rest, coverUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80' };
        }
        return rest;
      });
      localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(lightweight));
    } catch {
      // Server will maintain the primary source of truth
    }
  }
}

// ==========================================
// SERVER-SIDE PERSISTENCE APIS (PRIMARY TRUTH)
// ==========================================

export async function fetchBooksFromServer(): Promise<Book[]> {
  try {
    const res = await fetch('/api/books');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.success && Array.isArray(data.books) && data.books.length > 0) {
      saveBooks(data.books);
      return data.books;
    }
  } catch (err) {
    console.warn('Server fetchBooks failed, using local cache:', err);
  }
  return loadBooks();
}

export async function saveBookToServer(book: Book): Promise<Book> {
  // Strip non-serializable blob before JSON stringifying
  const { uploadedFileBlob, ...serializableBook } = book;

  try {
    const res = await fetch('/api/books', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(serializableBook),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.success && data.book) {
      const savedBook: Book = { ...data.book, uploadedFileBlob };
      return savedBook;
    }
  } catch (err) {
    console.error('Failed to save book to server, falling back to local:', err);
  }
  return book;
}

export async function deleteBookFromServer(bookId: string): Promise<boolean> {
  try {
    const res = await fetch(`/api/books/${bookId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return !!data.success;
  } catch (err) {
    console.error('Failed to delete book from server:', err);
    return false;
  }
}

export async function toggleLiberateBookOnServer(bookId: string): Promise<Book | null> {
  try {
    const res = await fetch(`/api/books/${bookId}/toggle-liberate`, {
      method: 'POST',
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.success && data.book) {
      return data.book;
    }
  } catch (err) {
    console.error('Failed to toggle liberation on server:', err);
  }
  return null;
}

export async function incrementDownloadOnServer(bookId: string): Promise<void> {
  try {
    await fetch(`/api/books/${bookId}/increment-download`, {
      method: 'POST',
    });
  } catch (err) {
    console.warn('Failed to increment download on server:', err);
  }
}

export async function fetchAuthorFromServer(): Promise<AuthorProfile> {
  try {
    const res = await fetch('/api/author');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.success && data.author) {
      saveAuthorProfile(data.author);
      return data.author;
    }
  } catch (err) {
    console.warn('Failed to fetch author from server:', err);
  }
  return loadAuthorProfile();
}

export async function saveAuthorToServer(profile: AuthorProfile): Promise<AuthorProfile> {
  try {
    const res = await fetch('/api/author', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data.success && data.author) {
      saveAuthorProfile(data.author);
      return data.author;
    }
  } catch (err) {
    console.error('Failed to save author to server:', err);
  }
  saveAuthorProfile(profile);
  return profile;
}

// Admin Authentication State
export function isAdminAuthenticated(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEYS.ADMIN_SESSION) === 'true';
  } catch {
    return false;
  }
}

export function setAdminAuthenticated(auth: boolean): void {
  try {
    if (auth) {
      localStorage.setItem(STORAGE_KEYS.ADMIN_SESSION, 'true');
    } else {
      localStorage.removeItem(STORAGE_KEYS.ADMIN_SESSION);
    }
  } catch (e) {
    console.error('Failed to set admin session:', e);
  }
}

// Author Profile
export function loadAuthorProfile(): AuthorProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.AUTHOR);
    if (!raw) {
      saveAuthorProfile(DEFAULT_AUTHOR);
      return DEFAULT_AUTHOR;
    }
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_AUTHOR,
      ...parsed,
      paymentMethods: {
        ...DEFAULT_AUTHOR.paymentMethods,
        ...(parsed.paymentMethods || {}),
        chile: {
          ...DEFAULT_AUTHOR.paymentMethods.chile,
          ...(parsed.paymentMethods?.chile || {}),
        },
      },
    };
  } catch {
    return DEFAULT_AUTHOR;
  }
}

export function saveAuthorProfile(profile: AuthorProfile): void {
  try {
    localStorage.setItem(STORAGE_KEYS.AUTHOR, JSON.stringify(profile));
  } catch (e) {
    console.error('Failed to save author profile:', e);
  }
}

// Coupons
export function loadCoupons(): Coupon[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.COUPONS);
    if (!raw) {
      saveCoupons(INITIAL_COUPONS);
      return INITIAL_COUPONS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_COUPONS;
  }
}

export function saveCoupons(coupons: Coupon[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.COUPONS, JSON.stringify(coupons));
  } catch (e) {
    console.error('Failed to save coupons:', e);
  }
}

// Transactions
export function loadTransactions(): Transaction[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!raw) {
      saveTransactions(INITIAL_TRANSACTIONS);
      return INITIAL_TRANSACTIONS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_TRANSACTIONS;
  }
}

export function saveTransactions(txs: Transaction[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(txs));
  } catch (e) {
    console.error('Failed to save transactions:', e);
  }
}

export function recordTransaction(tx: Omit<Transaction, 'id' | 'date'>): Transaction {
  const all = loadTransactions();
  const newTx: Transaction = {
    ...tx,
    id: `tx-cl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    date: new Date().toISOString().replace('T', ' ').slice(0, 16),
  };
  const updated = [newTx, ...all];
  saveTransactions(updated);

  // Send to server asynchronously
  fetch('/api/transactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(newTx),
  }).catch((err) => console.warn('Could not post tx to server:', err));

  return newTx;
}
