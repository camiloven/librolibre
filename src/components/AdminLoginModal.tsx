import React, { useState } from 'react';
import { X, Lock, ShieldCheck, KeyRound, AlertCircle } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  correctPin: string;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  correctPin,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.trim() === correctPin.trim()) {
      setError(false);
      onSuccess();
      onClose();
      setPin('');
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div 
        className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden p-6 text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-3 text-amber-400">
            <Lock className="w-7 h-7" />
          </div>
          <h3 className="font-serif font-bold text-xl text-white">
            Modo Administrador
          </h3>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            Ingresa tu clave de acceso para gestionar obras, liberar libros y autorizar el borrado exclusivo del catálogo.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              <span>PIN o Clave de Administrador</span>
            </label>
            <input
              type="password"
              autoFocus
              required
              value={pin}
              onChange={(e) => {
                setPin(e.target.value);
                setError(false);
              }}
              placeholder="Introduce tu PIN (Por defecto: 1234)"
              className="w-full px-4 py-3 bg-slate-950 text-white rounded-xl border border-slate-800 focus:outline-none focus:border-amber-400 text-center font-mono text-lg tracking-widest"
            />
            {error && (
              <p className="text-xs text-rose-400 mt-2 flex items-center justify-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>PIN incorrecto. Vuelve a intentarlo o usa el PIN por defecto (1234).</span>
              </p>
            )}
          </div>

          <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
            🔒 <strong className="text-slate-300">Seguridad:</strong> Los libros se mantendrán de forma permanente en la plataforma y solo tú con este PIN podrás eliminarlos o modificar su precio.
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors cursor-pointer shadow-md shadow-amber-950/20"
            >
              Acceder como Admin
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
