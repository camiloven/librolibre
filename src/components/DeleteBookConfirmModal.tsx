import React, { useState } from 'react';
import { Book } from '../types/book';
import { X, AlertTriangle, Trash2, ShieldAlert } from 'lucide-react';

interface DeleteBookConfirmModalProps {
  book: Book | null;
  onClose: () => void;
  onConfirmDelete: (bookId: string) => void;
  adminPin: string;
}

export const DeleteBookConfirmModal: React.FC<DeleteBookConfirmModalProps> = ({
  book,
  onClose,
  onConfirmDelete,
  adminPin,
}) => {
  const [pinConfirm, setPinConfirm] = useState('');
  const [error, setError] = useState(false);

  if (!book) return null;

  const handleDelete = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinConfirm.trim() === adminPin.trim()) {
      onConfirmDelete(book.id);
      onClose();
      setPinConfirm('');
    } else {
      setError(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div 
        className="relative w-full max-w-md bg-slate-900 border border-rose-900/40 rounded-2xl shadow-2xl overflow-hidden p-6 text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center mb-5">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto mb-3 text-rose-400">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h3 className="font-serif font-bold text-xl text-white">
            Borrado Exclusivo de Administrador
          </h3>
          <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
            Esta obra está guardada de forma permanente y solo tú como administrador autorizado puedes retirarla del catálogo.
          </p>
        </div>

        {/* Book summary card */}
        <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 mb-5 flex items-center gap-3">
          <img
            src={book.coverUrl}
            alt={book.title}
            className="w-12 h-16 object-cover rounded bg-slate-900 border border-slate-800 shrink-0"
          />
          <div className="min-w-0">
            <h4 className="font-serif font-bold text-sm text-white truncate">{book.title}</h4>
            <p className="text-xs text-slate-400 truncate">Por {book.author}</p>
            <p className="text-[11px] text-amber-400/90 font-mono mt-0.5">
              {book.downloadCount} descargas registradas
            </p>
          </div>
        </div>

        <form onSubmit={handleDelete} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
              Introduce tu PIN de Administrador para confirmar
            </label>
            <input
              type="password"
              autoFocus
              required
              value={pinConfirm}
              onChange={(e) => {
                setPinConfirm(e.target.value);
                setError(false);
              }}
              placeholder="PIN de administrador (1234)"
              className="w-full px-4 py-2.5 bg-slate-950 text-white rounded-xl border border-slate-800 focus:outline-none focus:border-rose-400 text-center font-mono text-base tracking-widest"
            />
            {error && (
              <p className="text-xs text-rose-400 mt-1.5 text-center">
                PIN incorrecto. Ingresa el PIN de administrador para proceder.
              </p>
            )}
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl cursor-pointer"
            >
              Cancelar y Mantener Libro
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-colors cursor-pointer shadow-md flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              <span>Eliminar Obra</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
