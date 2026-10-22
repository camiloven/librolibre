import React, { useState, useRef } from 'react';
import { AuthorProfile } from '../types/book';
import { X, Camera, Upload, Check, User, Mail, Sparkles, Feather, Image as ImageIcon, Link2, RefreshCw } from 'lucide-react';
import { compressImage } from '../utils/imageCompressor';

interface EditAuthorProfileModalProps {
  isOpen: boolean;
  authorProfile: AuthorProfile;
  onClose: () => void;
  onSaveProfile: (updatedProfile: AuthorProfile) => Promise<void> | void;
}

export const EditAuthorProfileModal: React.FC<EditAuthorProfileModalProps> = ({
  isOpen,
  authorProfile,
  onClose,
  onSaveProfile,
}) => {
  const [name, setName] = useState(authorProfile.name);
  const [tagline, setTagline] = useState(authorProfile.tagline);
  const [email, setEmail] = useState(authorProfile.email);
  const [bio, setBio] = useState(authorProfile.bio);
  const [avatarUrl, setAvatarUrl] = useState(authorProfile.avatarUrl);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(authorProfile.avatarUrl);
  
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIsProcessingImage(true);
      setErrorMessage(null);
      try {
        // Automatically compress and resize down to lightweight profile size (< 50KB)
        const compressed = await compressImage(file, {
          maxWidth: 360,
          maxHeight: 360,
          quality: 0.85,
          mimeType: 'image/jpeg',
        });
        setAvatarPreview(compressed);
        setAvatarUrl(compressed);
      } catch (err: any) {
        console.error('Error compressing author photo:', err);
        setErrorMessage('No se pudo procesar la imagen seleccionada.');
      } finally {
        setIsProcessingImage(false);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);

    try {
      const finalAvatar = avatarUrl || avatarPreview || authorProfile.avatarUrl;
      const updated: AuthorProfile = {
        ...authorProfile,
        name: name.trim() || authorProfile.name,
        tagline: tagline.trim() || authorProfile.tagline,
        email: email.trim() || authorProfile.email,
        bio: bio.trim() || authorProfile.bio,
        avatarUrl: finalAvatar,
      };

      await onSaveProfile(updated);
      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        setIsSaving(false);
        onClose();
      }, 700);
    } catch (err: any) {
      console.error('Error saving author profile:', err);
      setErrorMessage(err.message || 'Error al guardar en Cloud Firestore.');
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div 
        className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-6 text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/70">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-semibold flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5" />
              <span>Modo Administrador · Chile</span>
            </span>
            <h3 className="font-serif font-bold text-xl text-white">
              Modificar Foto & Perfil del Autor
            </h3>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-3 bg-rose-950/50 border border-rose-800/80 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <span>⚠️</span>
              <span>{errorMessage}</span>
            </div>
          )}

          {/* PHOTO UPLOAD SECTION */}
          <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col items-center text-center">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageFileChange}
              accept="image/*"
              className="hidden"
            />

            <div 
              className="relative group cursor-pointer mb-3" 
              onClick={() => !isProcessingImage && fileInputRef.current?.click()}
            >
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-2 border-amber-500/50 p-1 shadow-xl bg-slate-900 flex items-center justify-center">
                {isProcessingImage ? (
                  <div className="flex flex-col items-center justify-center">
                    <RefreshCw className="w-7 h-7 text-amber-400 animate-spin mb-1" />
                    <span className="text-[10px] text-amber-300">Optimizando...</span>
                  </div>
                ) : avatarPreview ? (
                  <img
                    src={avatarPreview}
                    alt="Foto de perfil"
                    className="w-full h-full object-cover rounded-full"
                  />
                ) : (
                  <User className="w-12 h-12 text-slate-500" />
                )}
              </div>

              {/* Hover / Tap camera badge */}
              {!isProcessingImage && (
                <div className="absolute inset-0 bg-black/60 rounded-full flex flex-col items-center justify-center opacity-90 group-hover:opacity-100 transition-opacity">
                  <Camera className="w-7 h-7 text-amber-400 mb-1" />
                  <span className="text-[10px] text-white font-semibold">Tocar para cambiar</span>
                </div>
              )}
            </div>

            <div className="space-y-2 w-full max-w-sm">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessingImage}
                className="w-full py-2.5 text-xs font-semibold bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl cursor-pointer transition-colors shadow-md inline-flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                <span>Subir Foto desde Celular o Computador</span>
              </button>
              <p className="text-[11px] text-slate-400 leading-tight">
                Se optimiza automáticamente para sincronizarse al instante con todos los dispositivos.
              </p>
            </div>
          </div>

          {/* AUTHOR DETAILS SECTION */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Nombre del Autor / Editorial
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Camilo V."
                className="w-full px-3.5 py-2.5 bg-slate-950 text-sm text-white rounded-lg border border-slate-800 focus:outline-none focus:border-amber-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Lema o Frase Corta
              </label>
              <input
                type="text"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="Ej: Literatura y conocimiento independiente en Chile."
                className="w-full px-3.5 py-2.5 bg-slate-950 text-sm text-white rounded-lg border border-slate-800 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Correo Electrónico de Contacto
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="camiloven@gmail.com"
                className="w-full px-3.5 py-2.5 bg-slate-950 text-sm text-amber-400 font-mono rounded-lg border border-slate-800 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
                Biografía o Manifiesto del Autor
              </label>
              <textarea
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Escribe aquí tu presentación para los lectores en Chile y el mundo..."
                className="w-full px-3.5 py-2.5 bg-slate-950 text-xs text-slate-200 rounded-lg border border-slate-800 focus:outline-none focus:border-amber-500 font-serif leading-relaxed"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
            {savedSuccess ? (
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                <span>Foto y datos guardados en Cloud Firestore</span>
              </span>
            ) : isSaving ? (
              <span className="text-xs text-amber-400 font-medium flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Guardando en la nube...</span>
              </span>
            ) : (
              <span className="text-[11px] text-slate-500">Sincronización en tiempo real</span>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="px-4 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSaving || isProcessingImage}
                className="px-5 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors cursor-pointer shadow-md disabled:opacity-50 flex items-center gap-1.5"
              >
                {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                <span>Guardar Mi Foto y Datos</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
