import React, { useState } from 'react';
import { Book, AuthorProfile, formatCurrency } from '../types/book';
import { downloadBookFile } from '../utils/fileDownloader';
import { recordTransaction } from '../utils/storage';
import { 
  X, Download, CheckCircle2, Building2, Smartphone, 
  Sparkles, Coffee, ShieldCheck, Tag, ArrowRight, Copy, Check, CreditCard
} from 'lucide-react';

interface CheckoutModalProps {
  book: Book | null;
  authorProfile: AuthorProfile;
  onClose: () => void;
  onDownloadCompleted: (bookId: string) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  book,
  authorProfile,
  onClose,
  onDownloadCompleted,
}) => {
  if (!book) return null;

  const isLiberated = book.isLiberated;
  const isFree = book.pricingType === 'free';
  const isPwyw = book.pricingType === 'pwyw';
  const chileanPayments = authorProfile.paymentMethods.chile;

  // Form State
  const [readerName, setReaderName] = useState('');
  const [readerEmail, setReaderEmail] = useState('');
  const [readerPhone, setReaderPhone] = useState('');
  const [transferRef, setTransferRef] = useState('');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // PWYW & Tips in Chilean Pesos
  const [pwywAmount, setPwywAmount] = useState<number>(book.allowPwywMin || 3000);
  const [voluntaryTip, setVoluntaryTip] = useState<number>(0);
  const [selectedPayment, setSelectedPayment] = useState<'bancoestado' | 'mercadopago' | 'webpay' | 'machtempo'>('bancoestado');
  const [couponCode, setCouponCode] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  
  // Checkout stages
  const [stage, setStage] = useState<'form' | 'processing' | 'success'>('form');
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadToken, setDownloadToken] = useState('');

  // Calculate base price in CLP
  let baseAmount = book.price;
  if (isLiberated || isFree) {
    baseAmount = 0;
  } else if (isPwyw) {
    baseAmount = Math.max(book.allowPwywMin || 1000, pwywAmount);
  }

  // Apply discount
  const finalBookPrice = appliedDiscount === 100 ? 0 : Math.max(0, baseAmount * (1 - appliedDiscount / 100));
  const totalToPay = Math.round(finalBookPrice + (isLiberated || isFree ? voluntaryTip : 0));

  const copyToClipboard = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = couponCode.trim().toUpperCase();
    if (cleanCode === 'CHILELIBRE' || cleanCode === 'AUTORGRATIS' || cleanCode === 'LIBRE2026') {
      setAppliedDiscount(100);
      setCouponMessage('¡Cupón verificado! 100% de descuento. El libro es tuyo sin costo.');
    } else if (cleanCode === 'LECTORVIP') {
      setAppliedDiscount(50);
      setCouponMessage('¡Cupón aplicado! 50% de descuento en pesos chilenos.');
    } else {
      setCouponMessage('Código no válido o no disponible en Chile.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!readerEmail) {
      alert('Por favor ingresa un correo para registrar tu descarga y enviarte la licencia.');
      return;
    }

    setStage('processing');

    setTimeout(async () => {
      const generatedToken = `CL-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      setDownloadToken(generatedToken);

      const paymentMethodName = totalToPay === 0
        ? (isLiberated ? 'Liberado Gratis por Autor' : 'Descarga Gratuita')
        : selectedPayment === 'bancoestado'
        ? 'BancoEstado CuentaRUT'
        : selectedPayment === 'mercadopago'
        ? 'Mercado Pago Chile'
        : selectedPayment === 'webpay'
        ? 'Webpay Plus / Redcompra'
        : 'Mach / Tenpo';

      // Record transaction
      recordTransaction({
        bookId: book.id,
        bookTitle: book.title,
        readerName: readerName || 'Lector Registrado',
        readerEmail,
        readerPhone,
        amount: totalToPay,
        currency: 'CLP',
        type: isLiberated ? 'liberated' : (isFree ? 'free' : (appliedDiscount === 100 ? 'coupon' : 'paid')),
        paymentMethod: paymentMethodName,
        transferReference: transferRef || undefined,
        downloadFormat: book.fileType,
      });

      onDownloadCompleted(book.id);
      setStage('success');

      try {
        await downloadBookFile(book, readerName || 'Lector Registrado (Chile)', generatedToken);
      } catch (err) {
        console.error('Error triggering download:', err);
      }
    }, 1100);
  };

  const handleManualDownloadAgain = async () => {
    setIsDownloading(true);
    await downloadBookFile(book, readerName || 'Lector Registrado (Chile)', downloadToken);
    setIsDownloading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div 
        className="relative w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-6 text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/70">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-semibold">
              {stage === 'success' ? 'Descarga Lista' : 'Adquisición & Descarga · Chile'}
            </span>
            <h3 className="font-serif font-bold text-lg text-white">
              {book.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* STAGE: SUCCESS */}
        {stage === 'success' ? (
          <div className="p-6 sm:p-8 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mb-4">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <h3 className="font-serif font-bold text-2xl text-white">
              ¡Tu libro ha comenzado a descargarse!
            </h3>
            <p className="mt-2 text-sm text-slate-300 max-w-md mx-auto leading-relaxed">
              El archivo <span className="font-mono text-amber-400 font-semibold">{book.fileType}</span> se está guardando en tu dispositivo sin candados ni DRM restrictivo.
            </p>

            <div className="my-6 p-4 rounded-xl bg-slate-950 border border-slate-800 text-left text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Obra:</span>
                <span className="text-white font-medium">{book.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Autor:</span>
                <span className="text-white font-medium">{book.author}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Lector:</span>
                <span className="text-amber-400 font-medium">{readerEmail}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Monto cancelado:</span>
                <span className="text-emerald-400 font-mono font-bold">{formatCurrency(totalToPay, 'CLP')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Código de descarga:</span>
                <span className="text-slate-300 font-mono">{downloadToken}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={handleManualDownloadAgain}
                disabled={isDownloading}
                className="px-5 py-2.5 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-md"
              >
                <Download className="w-4 h-4" />
                <span>{isDownloading ? 'Generando...' : 'Descargar de nuevo'}</span>
              </button>

              <button
                onClick={onClose}
                className="px-5 py-2.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Volver al catálogo
              </button>
            </div>
          </div>
        ) : stage === 'processing' ? (
          /* STAGE: PROCESSING */
          <div className="p-12 text-center">
            <div className="w-12 h-12 mx-auto border-3 border-amber-400/20 border-t-amber-400 rounded-full animate-spin mb-4" />
            <h4 className="font-serif font-bold text-lg text-white">Verificando y preparando tu libro...</h4>
            <p className="text-xs text-slate-400 mt-2">
              Validando registro con el autor en Chile y empaquetando archivo {book.fileType}.
            </p>
          </div>
        ) : (
          /* STAGE: FORM */
          <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            {/* Banner if book was liberated by author */}
            {isLiberated && (
              <div className="p-4 bg-emerald-950/40 border border-emerald-800/60 rounded-xl flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-emerald-300">
                    ¡Libro Liberado Gratuitamente por el Autor!
                  </div>
                  <p className="text-xs text-emerald-200/80 mt-1 leading-relaxed">
                    El autor ha liberado esta obra para descarga sin costo en Chile y el mundo. Puedes descargarlo gratis directamente o aportar una propina voluntaria si deseas apoyar su producción independiente.
                  </p>
                </div>
              </div>
            )}

            {/* Total Price in Chilean Pesos */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400">Total a pagar:</span>
                <div className="text-2xl font-bold font-mono text-white tabular-nums">
                  {formatCurrency(totalToPay, 'CLP')}
                </div>
              </div>

              {appliedDiscount === 100 ? (
                <div className="text-right">
                  <span className="text-xs font-semibold text-emerald-400">100% CORTESÍA</span>
                  <div className="text-[11px] text-slate-400 line-through">{formatCurrency(book.price, 'CLP')}</div>
                </div>
              ) : isLiberated || isFree ? (
                <div className="text-right">
                  <span className="text-xs font-semibold text-emerald-400">GRATIS POR EL AUTOR</span>
                  <div className="text-[11px] text-slate-400">$0 CLP</div>
                </div>
              ) : (
                <div className="text-right text-xs text-slate-400">
                  Formato: <span className="font-mono text-slate-200 font-semibold">{book.fileType}</span>
                </div>
              )}
            </div>

            {/* Reader information */}
            <div className="space-y-3">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Tus datos de lector en Chile
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <input
                    type="text"
                    required
                    value={readerName}
                    onChange={(e) => setReaderName(e.target.value)}
                    placeholder="Tu nombre completo"
                    className="w-full px-3.5 py-2.5 bg-slate-950 text-sm text-white placeholder-slate-500 rounded-lg border border-slate-800 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <input
                    type="email"
                    required
                    value={readerEmail}
                    onChange={(e) => setReaderEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    className="w-full px-3.5 py-2.5 bg-slate-950 text-sm text-white placeholder-slate-500 rounded-lg border border-slate-800 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Pay what you want in CLP */}
            {isPwyw && !isLiberated && appliedDiscount !== 100 && (
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <label className="text-xs font-medium text-slate-300 flex justify-between">
                  <span>Aporte voluntario (Mínimo {formatCurrency(book.allowPwywMin || 1000, 'CLP')}):</span>
                  <span className="font-mono text-amber-400 font-bold">{formatCurrency(pwywAmount, 'CLP')}</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[2000, 5000, 8000, 12000].map((amt) => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setPwywAmount(amt)}
                      className={`py-1.5 text-xs font-mono font-semibold rounded-lg border cursor-pointer ${
                        pwywAmount === amt
                          ? 'bg-amber-400 text-slate-950 border-amber-400'
                          : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      ${(amt / 1000).toFixed(0)}k CLP
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Voluntary Tip for Liberated / Free books in Chile */}
            {(isLiberated || isFree) && (
              <div className="p-3.5 bg-slate-950/80 rounded-xl border border-slate-800/80 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-300">
                  <Coffee className="w-4 h-4 text-amber-400" />
                  <span>¿Deseas invitarle un café al autor en Chile? (Opcional)</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setVoluntaryTip(0)}
                    className={`py-1.5 text-xs font-medium rounded-lg border cursor-pointer ${
                      voluntaryTip === 0
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    Gratis ($0)
                  </button>
                  {[1000, 2000, 5000].map((tip) => (
                    <button
                      key={tip}
                      type="button"
                      onClick={() => setVoluntaryTip(tip)}
                      className={`py-1.5 text-xs font-mono font-semibold rounded-lg border cursor-pointer ${
                        voluntaryTip === tip
                          ? 'bg-amber-400 text-slate-950 border-amber-400'
                          : 'bg-slate-900 text-slate-300 border-slate-800'
                      }`}
                    >
                      +${tip.toLocaleString('es-CL')}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chilean Payment Methods Selector (When totalToPay > 0) */}
            {totalToPay > 0 && (
              <div className="space-y-3">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Formas de Pago en Chile
                </label>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedPayment('bancoestado')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-colors ${
                      selectedPayment === 'bancoestado'
                        ? 'bg-amber-500/10 border-amber-500/70 text-white shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Building2 className="w-4 h-4 mb-1 text-amber-400" />
                    <div className="text-xs font-bold">BancoEstado</div>
                    <div className="text-[10px] text-slate-500">CuentaRUT</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedPayment('mercadopago')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-colors ${
                      selectedPayment === 'mercadopago'
                        ? 'bg-cyan-500/10 border-cyan-500/70 text-white shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 mb-1 text-cyan-400" />
                    <div className="text-xs font-bold">Mercado Pago</div>
                    <div className="text-[10px] text-slate-500">Chile / Débito</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedPayment('webpay')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-colors ${
                      selectedPayment === 'webpay'
                        ? 'bg-emerald-500/10 border-emerald-500/70 text-white shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 mb-1 text-emerald-400" />
                    <div className="text-xs font-bold">Webpay Plus</div>
                    <div className="text-[10px] text-slate-500">Redcompra</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedPayment('machtempo')}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-colors ${
                      selectedPayment === 'machtempo'
                        ? 'bg-purple-500/10 border-purple-500/70 text-white shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Smartphone className="w-4 h-4 mb-1 text-purple-400" />
                    <div className="text-xs font-bold">Mach / Tenpo</div>
                    <div className="text-[10px] text-slate-500">Transferencia</div>
                  </button>
                </div>

                {/* Specific Chilean details card */}
                {selectedPayment === 'bancoestado' && (
                  <div className="p-4 bg-slate-950 rounded-xl border border-amber-500/30 text-xs space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="font-bold text-amber-400 flex items-center gap-1.5">
                        <Building2 className="w-4 h-4" />
                        <span>Datos para Transferir a BancoEstado</span>
                      </div>
                      <span className="text-[10px] font-mono bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded border border-amber-500/20">
                        {chileanPayments.bancoEstado.accountType}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-slate-300 text-[11px]">
                      <div>
                        <span className="text-slate-500">Banco:</span>
                        <div className="font-semibold text-white">BancoEstado</div>
                      </div>
                      <div>
                        <span className="text-slate-500">Tipo de Cuenta:</span>
                        <div className="font-semibold text-white">{chileanPayments.bancoEstado.accountType}</div>
                      </div>

                      <div>
                        <span className="text-slate-500">RUT del Autor:</span>
                        <div className="flex items-center gap-1.5 font-mono text-amber-300 font-bold">
                          <span>{chileanPayments.bancoEstado.rut}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(chileanPayments.bancoEstado.rut, 'rut')}
                            className="p-1 text-slate-400 hover:text-white cursor-pointer"
                            title="Copiar RUT"
                          >
                            {copiedField === 'rut' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <span className="text-slate-500">N° de Cuenta:</span>
                        <div className="flex items-center gap-1.5 font-mono text-white font-bold">
                          <span>{chileanPayments.bancoEstado.accountNumber}</span>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(chileanPayments.bancoEstado.accountNumber, 'acc')}
                            className="p-1 text-slate-400 hover:text-white cursor-pointer"
                            title="Copiar Número de Cuenta"
                          >
                            {copiedField === 'acc' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <span className="text-slate-500">Titular:</span>
                        <div className="font-semibold text-white">{chileanPayments.bancoEstado.holderName}</div>
                      </div>

                      <div className="sm:col-span-2">
                        <span className="text-slate-500">Correo para comprobante:</span>
                        <div className="font-mono text-amber-400">{chileanPayments.bancoEstado.notifyEmail}</div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-900">
                      <label className="block text-[11px] text-slate-400 mb-1">
                        N° de Comprobante / Transacción (opcional para validación rápida):
                      </label>
                      <input
                        type="text"
                        value={transferRef}
                        onChange={(e) => setTransferRef(e.target.value)}
                        placeholder="Ej: 14829283 o tu RUT"
                        className="w-full px-3 py-1.5 bg-slate-900 text-xs text-white rounded-lg border border-slate-800"
                      />
                    </div>
                  </div>
                )}

                {selectedPayment === 'mercadopago' && (
                  <div className="p-4 bg-slate-950 rounded-xl border border-cyan-500/30 text-xs space-y-2">
                    <div className="font-bold text-cyan-400 flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4" />
                      <span>Mercado Pago Chile</span>
                    </div>
                    <p className="text-slate-300 text-[11px]">
                      Alias de cobro del autor: <span className="font-mono text-cyan-300 font-bold">{chileanPayments.mercadoPagoChile.qrOrCode}</span>
                    </p>
                    <p className="text-slate-400 text-[10px]">
                      {chileanPayments.mercadoPagoChile.instructions}
                    </p>
                  </div>
                )}

                {selectedPayment === 'webpay' && (
                  <div className="p-4 bg-slate-950 rounded-xl border border-emerald-500/30 text-xs space-y-2">
                    <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                      <CreditCard className="w-4 h-4" />
                      <span>Webpay Plus / Redcompra Transbank</span>
                    </div>
                    <p className="text-slate-300 text-[11px]">
                      Paga de forma segura con tu tarjeta de débito o crédito bancaria chilena.
                    </p>
                  </div>
                )}

                {selectedPayment === 'machtempo' && (
                  <div className="p-4 bg-slate-950 rounded-xl border border-purple-500/30 text-xs space-y-2">
                    <div className="font-bold text-purple-400 flex items-center gap-1.5">
                      <Smartphone className="w-4 h-4" />
                      <span>Mach / Tenpo Chile</span>
                    </div>
                    <p className="text-slate-300 text-[11px]">
                      Envío directo a: <span className="font-mono text-purple-300 font-bold">{chileanPayments.machTenpo.phoneOrHandle}</span>
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Chilean Coupon Code */}
            {totalToPay > 0 && (
              <div className="pt-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="w-4 h-4 text-slate-500 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      placeholder="¿Tienes cupón chileno? (Prueba: CHILELIBRE)"
                      className="w-full pl-9 pr-3 py-2 bg-slate-950 text-xs text-white placeholder-slate-500 rounded-lg border border-slate-800 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    className="px-3.5 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg cursor-pointer whitespace-nowrap"
                  >
                    Aplicar
                  </button>
                </div>
                {couponMessage && (
                  <p className={`text-[11px] mt-1.5 ${appliedDiscount > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {couponMessage}
                  </p>
                )}
              </div>
            )}

            {/* Submit button */}
            <div className="pt-3">
              <button
                type="submit"
                className={`w-full py-3.5 px-4 text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
                  totalToPay === 0
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-950/40'
                    : 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-amber-950/40'
                }`}
              >
                <Download className="w-4 h-4" />
                <span>
                  {totalToPay === 0
                    ? 'Descargar Gratis de Inmediato'
                    : `Confirmar Pago en Chile y Descargar (${formatCurrency(totalToPay, 'CLP')})`}
                </span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </button>
              <p className="text-[11px] text-slate-500 text-center mt-2.5">
                Al confirmar recibirás el archivo en formato {book.fileType} con licencia de lectura personal sin restricciones de dispositivo.
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
