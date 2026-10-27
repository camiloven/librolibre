export type PricingType = 'free' | 'paid' | 'pwyw';

export interface Chapter {
  id: string;
  title: string;
  content: string;
}

export interface Book {
  id: string;
  title: string;
  subtitle?: string;
  author: string;
  synopsis: string;
  genre: string;
  folderId?: string; // ID of the folder/thematic collection (Medicina, Terror, Romántica...)
  folderName?: string; // Name of the folder
  coverUrl: string;
  pricingType: PricingType;
  price: number; // In CLP (Pesos Chilenos)
  priceUSD?: number; // In USD (Dólares estadounidenses)
  isLiberated: boolean; // Flag for "Liberado gratis por el autor"
  liberatedNote?: string;
  liberatedAt?: string;
  downloadCount: number;
  pageCount: number;
  language: string;
  publicationYear: number;
  isbn?: string;
  fileType: 'PDF' | 'EPUB' | 'MOBI' | 'TXT' | 'DOCX';
  fileSize: string;
  fileName?: string;
  downloadUrl?: string;
  megaUrl?: string; // Direct MEGA (mega.nz / mega.io) file or folder download link
  teraboxUrl?: string; // Optional legacy TeraBox link
  uploadedFileBlob?: Blob | ArrayBuffer | string;
  sampleChapters: Chapter[];
  rating: number;
  reviewCount: number;
  createdAt: string;
  tags: string[];
  allowPwywMin?: number;
  featured?: boolean;
}

export interface BookFolder {
  id: string;
  name: string; // e.g. "Medicina", "Terror", "Romántica", "Ciencia Ficción"
  description?: string;
  color?: string; // Color identifier: "emerald" | "rose" | "purple" | "amber" | "sky" | "red" | "indigo"
  megaUrl?: string; // Direct MEGA folder link for this entire thematic collection
  teraboxUrl?: string; // Optional legacy link
  iconName?: string;
  createdAt: string;
}

export interface ChileanPaymentConfig {
  bancoEstado: {
    enabled: boolean;
    accountType: 'CuentaRUT' | 'Cuenta Corriente' | 'Cuenta Vista' | 'Chequera Electrónica';
    accountNumber: string;
    rut: string;
    holderName: string;
    notifyEmail: string;
    instructions: string;
  };
  mercadoPagoChile: {
    enabled: boolean;
    linkOrAlias: string;
    qrOrCode: string;
    instructions: string;
  };
  webpay: {
    enabled: boolean;
    paymentLink: string;
    provider: string; // Transbank / Webpay Plus / Redcompra
  };
  machTenpo: {
    enabled: boolean;
    walletType: 'Mach' | 'Tenpo' | 'Khipu' | 'Fpay';
    phoneOrHandle: string;
  };
}

export interface PaymentMethodsConfig {
  chile: ChileanPaymentConfig;
  paypal?: {
    enabled: boolean;
    emailOrLink: string;
    username: string;
  };
}

export interface AuthorProfile {
  name: string;
  bio: string;
  tagline: string;
  avatarUrl: string;
  email: string;
  website?: string;
  megaLibraryUrl?: string; // Master MEGA cloud folder for the author's collection
  teraboxLibraryUrl?: string; // Optional legacy link
  currency: 'CLP' | 'USD';
  currencySymbol: string;
  adminPin: string; // PIN for administrator mode to protect book deletion and library controls
  paymentMethods: PaymentMethodsConfig;
}

export interface Coupon {
  id: string;
  code: string;
  discountPercent: number; // 100 for free access
  uses: number;
  maxUses?: number;
  active: boolean;
  bookId?: string;
  description?: string;
}

export interface Transaction {
  id: string;
  bookId: string;
  bookTitle: string;
  readerName: string;
  readerEmail: string;
  readerPhone?: string;
  amount: number;
  currency: string;
  type: 'free' | 'liberated' | 'paid' | 'pwyw' | 'coupon';
  paymentMethod: string;
  transferReference?: string;
  date: string;
  downloadFormat: string;
}

/**
 * Format amounts in Chilean Pesos (CLP) or USD cleanly
 */
export function formatCurrency(amount: number, currency: string = 'CLP'): string {
  if (currency === 'CLP') {
    // Chilean pesos do not use decimals
    return `$${Math.round(amount).toLocaleString('es-CL')} CLP`;
  }
  return `$${amount.toFixed(2)} USD`;
}

export function formatCLP(amount: number): string {
  return `$${Math.round(amount || 0).toLocaleString('es-CL')} CLP`;
}

export function formatUSD(amount: number): string {
  return `$${Number(amount || 0).toFixed(2)} USD`;
}

export function formatBothPrices(priceCLP: number, priceUSD?: number): string {
  if (priceCLP === 0 && (!priceUSD || priceUSD === 0)) return 'Gratis';
  const parts: string[] = [];
  if (priceCLP > 0) parts.push(formatCLP(priceCLP));
  if (priceUSD && priceUSD > 0) parts.push(formatUSD(priceUSD));
  return parts.length > 0 ? parts.join(' · ') : '$0 CLP';
}
