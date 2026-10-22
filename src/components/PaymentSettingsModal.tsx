import React, { useState } from 'react';
import { AuthorProfile, ChileanPaymentConfig } from '../types/book';
import { X, Building2, Smartphone, CreditCard, ShieldCheck, Check, KeyRound } from 'lucide-react';

interface PaymentSettingsModalProps {
  authorProfile: AuthorProfile;
  onClose: () => void;
  onSaveProfile: (profile: AuthorProfile) => void;
}

export const PaymentSettingsModal: React.FC<PaymentSettingsModalProps> = ({
  authorProfile,
  onClose,
  onSaveProfile,
}) => {
  const [profile, setProfile] = useState<AuthorProfile>({ ...authorProfile });
  const [adminPin, setAdminPin] = useState(authorProfile.adminPin || '1234');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const updateChilean = <K extends keyof ChileanPaymentConfig>(
    key: K,
    field: keyof ChileanPaymentConfig[K],
    value: any
  ) => {
    setProfile((prev) => ({
      ...prev,
      paymentMethods: {
        ...prev.paymentMethods,
        chile: {
          ...prev.paymentMethods.chile,
          [key]: {
            ...prev.paymentMethods.chile[key],
            [field]: value,
          },
        },
      },
    }));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile({
      ...profile,
      adminPin: adminPin.trim() || '1234',
    });
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 900);
  };

  const chile = profile.paymentMethods.chile;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div 
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-6 text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/70">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-semibold">
              Configuración Editorial Chile
            </span>
            <h3 className="font-serif font-bold text-xl text-white">
              Formas de Pago en Chile & Clave de Administrador
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          <p className="text-xs text-slate-400 leading-relaxed">
            Configura tus cuentas bancarias de Chile (BancoEstado, CuentaRUT, Mercado Pago Chile, Webpay) para que los lectores te paguen directamente en pesos chilenos (CLP).
          </p>

          {/* Section 0: PIN de Administrador (User Requirement) */}
          <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-500/30 space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs uppercase tracking-wider">
              <KeyRound className="w-4 h-4" />
              <span>Clave / PIN del Modo Administrador</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Esta clave protege la plataforma: <strong>solo tú con este PIN puedes borrar libros</strong> o liberar obras.
            </p>
            <div className="w-full sm:w-64">
              <input
                type="text"
                required
                value={adminPin}
                onChange={(e) => setAdminPin(e.target.value)}
                placeholder="Ej: 1234"
                className="w-full px-3.5 py-2 bg-slate-950 text-sm text-white font-mono rounded-lg border border-slate-700 focus:outline-none focus:border-amber-400"
              />
            </div>
          </div>

          {/* BancoEstado / CuentaRUT */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-semibold text-white">BancoEstado (CuentaRUT / Cuenta Corriente)</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={chile.bancoEstado.enabled}
                  onChange={(e) => updateChilean('bancoEstado', 'enabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>

            {chile.bancoEstado.enabled && (
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Tipo de Cuenta</label>
                    <select
                      value={chile.bancoEstado.accountType}
                      onChange={(e) => updateChilean('bancoEstado', 'accountType', e.target.value as any)}
                      className="w-full px-3 py-2 bg-slate-900 text-xs text-white rounded-lg border border-slate-800 cursor-pointer"
                    >
                      <option value="CuentaRUT">CuentaRUT</option>
                      <option value="Cuenta Corriente">Cuenta Corriente</option>
                      <option value="Cuenta Vista">Cuenta Vista</option>
                      <option value="Chequera Electrónica">Chequera Electrónica</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">RUT del Titular (con guión)</label>
                    <input
                      type="text"
                      value={chile.bancoEstado.rut}
                      onChange={(e) => updateChilean('bancoEstado', 'rut', e.target.value)}
                      placeholder="Ej: 18.234.567-8"
                      className="w-full px-3 py-2 bg-slate-900 text-xs text-amber-300 font-mono font-semibold rounded-lg border border-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Número de Cuenta</label>
                    <input
                      type="text"
                      value={chile.bancoEstado.accountNumber}
                      onChange={(e) => updateChilean('bancoEstado', 'accountNumber', e.target.value)}
                      placeholder="RUT sin DV o N° Cuenta"
                      className="w-full px-3 py-2 bg-slate-900 text-xs text-white font-mono rounded-lg border border-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Nombre Completo del Titular</label>
                    <input
                      type="text"
                      value={chile.bancoEstado.holderName}
                      onChange={(e) => updateChilean('bancoEstado', 'holderName', e.target.value)}
                      placeholder="Camilo V."
                      className="w-full px-3 py-2 bg-slate-900 text-xs text-white rounded-lg border border-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Correo para notificación de transferencias</label>
                  <input
                    type="email"
                    value={chile.bancoEstado.notifyEmail}
                    onChange={(e) => updateChilean('bancoEstado', 'notifyEmail', e.target.value)}
                    placeholder="camiloven@gmail.com"
                    className="w-full px-3 py-2 bg-slate-900 text-xs text-amber-400 font-mono rounded-lg border border-slate-800"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Mercado Pago Chile */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-semibold text-white">Mercado Pago Chile</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={chile.mercadoPagoChile.enabled}
                  onChange={(e) => updateChilean('mercadoPagoChile', 'enabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>

            {chile.mercadoPagoChile.enabled && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Alias de cobro Mercado Pago Chile</label>
                  <input
                    type="text"
                    value={chile.mercadoPagoChile.qrOrCode}
                    onChange={(e) => updateChilean('mercadoPagoChile', 'qrOrCode', e.target.value)}
                    placeholder="camilo.libros.mp"
                    className="w-full px-3 py-2 bg-slate-900 text-xs text-cyan-300 font-mono rounded-lg border border-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Enlace de cobro (Link de pago)</label>
                  <input
                    type="text"
                    value={chile.mercadoPagoChile.linkOrAlias}
                    onChange={(e) => updateChilean('mercadoPagoChile', 'linkOrAlias', e.target.value)}
                    placeholder="mpago.la/..."
                    className="w-full px-3 py-2 bg-slate-900 text-xs text-white rounded-lg border border-slate-800"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Webpay Plus / Redcompra */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-semibold text-white">Webpay Plus / Transbank / Redcompra</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={chile.webpay.enabled}
                  onChange={(e) => updateChilean('webpay', 'enabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>
            {chile.webpay.enabled && (
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Link de pago Webpay (opcional)</label>
                <input
                  type="text"
                  value={chile.webpay.paymentLink}
                  onChange={(e) => updateChilean('webpay', 'paymentLink', e.target.value)}
                  placeholder="https://webpay.transbank.cl/..."
                  className="w-full px-3 py-2 bg-slate-900 text-xs text-white rounded-lg border border-slate-800 font-mono"
                />
              </div>
            )}
          </div>

          {/* Mach / Tenpo */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-purple-400" />
                <span className="text-sm font-semibold text-white">Billeteras Mach / Tenpo</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={chile.machTenpo.enabled}
                  onChange={(e) => updateChilean('machTenpo', 'enabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
              </label>
            </div>
            {chile.machTenpo.enabled && (
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Teléfono o usuario Mach/Tenpo</label>
                <input
                  type="text"
                  value={chile.machTenpo.phoneOrHandle}
                  onChange={(e) => updateChilean('machTenpo', 'phoneOrHandle', e.target.value)}
                  placeholder="+56 9 1234 5678"
                  className="w-full px-3 py-2 bg-slate-900 text-xs text-purple-300 font-mono rounded-lg border border-slate-800"
                />
              </div>
            )}
          </div>

          {/* Save & Feedback */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            {savedSuccess ? (
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                <span>Configuración guardada exitosamente</span>
              </span>
            ) : (
              <span className="text-xs text-slate-500">Se actualiza en tiempo real en la tienda</span>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl cursor-pointer"
              >
                Cerrar
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors cursor-pointer shadow-md"
              >
                Guardar Configuración
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
