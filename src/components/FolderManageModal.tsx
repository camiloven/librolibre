import React, { useState } from 'react';
import { Book, BookFolder } from '../types/book';
import { 
  FolderPlus, Folder, Trash2, Edit3, X, Check, BookOpen, 
  Sparkles, Plus, AlertCircle, Heart, Skull, Activity, ShieldCheck
} from 'lucide-react';

interface FolderManageModalProps {
  folders: BookFolder[];
  books: Book[];
  onClose: () => void;
  onCreateFolder?: (newFolder: BookFolder) => Promise<void> | void;
  onUpdateFolder?: (folderId: string, updates: Partial<BookFolder>) => Promise<void> | void;
  onSaveFolder?: (folder: BookFolder) => Promise<void> | void;
  onDeleteFolder: (folderId: string) => Promise<void> | void;
  onAssignBookToFolder?: (bookId: string, folderId: string | undefined, folderName: string | undefined) => Promise<void> | void;
  onMoveBookToFolder?: (bookId: string, folderId: string | undefined, folderName: string | undefined) => Promise<void> | void;
}

const AVAILABLE_COLORS = [
  { id: 'emerald', label: 'Verde (Salud/Naturaleza)', bg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', badge: 'bg-emerald-500' },
  { id: 'rose', label: 'Rojo/Terror (Suspenso)', bg: 'bg-rose-500/20 text-rose-300 border-rose-500/40', badge: 'bg-rose-500' },
  { id: 'purple', label: 'Púrpura (Romántica/Fantasía)', bg: 'bg-purple-500/20 text-purple-300 border-purple-500/40', badge: 'bg-purple-500' },
  { id: 'amber', label: 'Ámbar (Historia/Clásicos)', bg: 'bg-amber-500/20 text-amber-300 border-amber-500/40', badge: 'bg-amber-500' },
  { id: 'sky', label: 'Azul Cielo (Ciencia/Técnico)', bg: 'bg-sky-500/20 text-sky-300 border-sky-500/40', badge: 'bg-sky-500' },
  { id: 'indigo', label: 'Índigo (Filosofía/Ensayo)', bg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40', badge: 'bg-indigo-500' },
];

export const PRESET_FOLDERS = [
  { name: 'Medicina', icon: '🩺', color: 'emerald', desc: 'Obras y textos de medicina, salud y anatomía' },
  { name: 'Terror', icon: '🔪', color: 'rose', desc: 'Novelas y relatos de terror, suspenso y misterio' },
  { name: 'Romántica', icon: '💖', color: 'purple', desc: 'Novelas románticas, poesía y drama emocional' },
  { name: 'Ciencia Ficción', icon: '🚀', color: 'sky', desc: 'Ciencia ficción, distopías y literatura especulativa' },
  { name: 'Historia & Crónica', icon: '📜', color: 'amber', desc: 'Ensayos históricos, crónicas y biografías' },
];

export const FolderManageModal: React.FC<FolderManageModalProps> = ({
  folders,
  books,
  onClose,
  onCreateFolder,
  onUpdateFolder,
  onSaveFolder,
  onDeleteFolder,
  onAssignBookToFolder,
  onMoveBookToFolder,
}) => {
  const createFolderFn = onCreateFolder || onSaveFolder || (() => {});
  const updateFolderFn = onUpdateFolder || ((id: string, updates: Partial<BookFolder>) => {
    const existing = folders.find((f) => f.id === id);
    if (existing && onSaveFolder) {
      onSaveFolder({ ...existing, ...updates });
    }
  });
  const assignBookFn = onAssignBookToFolder || onMoveBookToFolder || (() => {});
  const [selectedFolderId, setSelectedFolderId] = useState<string>(folders[0]?.id || '');
  const [isCreatingNew, setIsCreatingNew] = useState(folders.length === 0);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderDesc, setNewFolderDesc] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('emerald');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync selectedFolderId when folders list updates
  React.useEffect(() => {
    if ((!selectedFolderId || !folders.some((f) => f.id === selectedFolderId)) && folders.length > 0) {
      setSelectedFolderId(folders[0].id);
    }
  }, [folders, selectedFolderId]);

  // Edit folder state
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const currentFolder = folders.find((f) => f.id === selectedFolderId);
  const booksInCurrentFolder = books.filter((b) => b.folderId === selectedFolderId);

  const handleQuickCreatePreset = async (preset: typeof PRESET_FOLDERS[0]) => {
    const existing = folders.find((f) => f.name.trim().toLowerCase() === preset.name.toLowerCase());
    if (existing) {
      setSelectedFolderId(existing.id);
      return;
    }
    const folderId = `folder-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newFolder: BookFolder = {
      id: folderId,
      name: preset.name,
      description: preset.desc,
      color: preset.color,
      createdAt: new Date().toISOString().split('T')[0],
    };
    await createFolderFn(newFolder);
    setSelectedFolderId(folderId);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) {
      alert('Por favor ingresa un nombre para la carpeta (ej: Medicina, Terror, Romántica)');
      return;
    }

    setIsSubmitting(true);
    try {
      const folderId = `folder-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
      const newFolder: BookFolder = {
        id: folderId,
        name: newFolderName.trim(),
        description: newFolderDesc.trim() || undefined,
        color: newFolderColor,
        createdAt: new Date().toISOString().split('T')[0],
      };

      await createFolderFn(newFolder);
      setSelectedFolderId(folderId);
      setNewFolderName('');
      setNewFolderDesc('');
      setIsCreatingNew(false);
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleStartEdit = (f: BookFolder) => {
    setEditingFolderId(f.id);
    setEditName(f.name);
    setEditDesc(f.description || '');
  };

  const handleSaveEdit = async () => {
    if (!editingFolderId || !editName.trim()) return;
    await updateFolderFn(editingFolderId, {
      name: editName.trim(),
      description: editDesc.trim(),
    });
    setEditingFolderId(null);
  };

  const handleDelete = async (folderId: string, folderName: string) => {
    if (confirm(`¿Estás seguro de eliminar la carpeta "${folderName}"? Los libros que contiene no se borrarán, solo quedarán sin carpeta asignada.`)) {
      // Unassign books in this folder
      for (const b of books.filter((book) => book.folderId === folderId)) {
        await assignBookFn(b.id, undefined, undefined);
      }
      await onDeleteFolder(folderId);
      if (selectedFolderId === folderId) {
        const remaining = folders.filter((f) => f.id !== folderId);
        setSelectedFolderId(remaining[0]?.id || '');
      }
    }
  };

  const handleToggleBookInFolder = async (book: Book) => {
    if (!currentFolder) return;
    const isAlreadyIn = book.folderId === currentFolder.id;
    if (isAlreadyIn) {
      // Remove from this folder
      await assignBookFn(book.id, undefined, undefined);
    } else {
      // Move to this folder
      await assignBookFn(book.id, currentFolder.id, currentFolder.name);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div 
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-6 text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/70">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-amber-400 font-semibold flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Panel del Administrador</span>
              </span>
              <span className="text-xs text-slate-500">·</span>
              <span className="text-xs text-slate-400">Organización Editorial</span>
            </div>
            <h3 className="font-serif font-bold text-xl text-white mt-0.5">
              Gestión de Carpetas & Temáticas de Libros
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Solo tú como administrador puedes crear carpetas temáticas (ej: Medicina, Terror, Romántica) y mover libros en ellas.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 min-h-[460px]">
          {/* Left Column: Folders List */}
          <div className="md:col-span-5 p-5 border-r border-slate-800 bg-slate-950/40 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
                Tus Carpetas ({folders.length})
              </h4>
              <button
                type="button"
                onClick={() => setIsCreatingNew((prev) => !prev)}
                className="px-2.5 py-1 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isCreatingNew ? 'Ocultar Formulario' : 'Nueva Carpeta'}</span>
              </button>
            </div>

            {/* Quick 1-Click Presets (Medicina, Terror, Romántica...) */}
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-amber-300">Crear Rápido en 1 Clic:</span>
                <span className="text-[10px] text-slate-500">Temáticas sugeridas</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_FOLDERS.map((preset) => {
                  const alreadyExists = folders.some((f) => f.name.toLowerCase() === preset.name.toLowerCase());
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      disabled={alreadyExists}
                      onClick={() => handleQuickCreatePreset(preset)}
                      className={`px-2.5 py-1 text-xs rounded-lg flex items-center gap-1 transition-all ${
                        alreadyExists
                          ? 'bg-slate-800/50 text-slate-500 border border-slate-800 cursor-not-allowed opacity-60'
                          : 'bg-slate-800 text-amber-200 hover:text-slate-950 hover:bg-amber-400 border border-amber-500/30 cursor-pointer shadow-sm'
                      }`}
                      title={alreadyExists ? `Carpeta "${preset.name}" ya existe` : `Crear carpeta "${preset.name}" al instante`}
                    >
                      <span>{preset.icon}</span>
                      <span>+ {preset.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Create Folder Form */}
            {isCreatingNew && (
              <form onSubmit={handleCreateSubmit} className="p-3.5 rounded-xl bg-slate-900 border border-amber-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-amber-300 font-serif">Crear Carpeta Personalizada</span>
                  <button
                    type="button"
                    onClick={() => setIsCreatingNew(false)}
                    className="text-slate-400 hover:text-white text-xs cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Nombre de la temática</label>
                  <input
                    type="text"
                    required
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Ej: Medicina, Terror, Romántica..."
                    className="w-full px-3 py-1.5 bg-slate-950 text-xs text-white rounded-lg border border-slate-800 focus:border-amber-400 focus:outline-none"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Descripción breve (opcional)</label>
                  <input
                    type="text"
                    value={newFolderDesc}
                    onChange={(e) => setNewFolderDesc(e.target.value)}
                    placeholder="Ej: Obras especializadas en salud y anatomía"
                    className="w-full px-3 py-1.5 bg-slate-950 text-xs text-white rounded-lg border border-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Color identificador</label>
                  <div className="flex gap-2">
                    {AVAILABLE_COLORS.map((col) => (
                      <button
                        key={col.id}
                        type="button"
                        onClick={() => setNewFolderColor(col.id)}
                        className={`w-6 h-6 rounded-full cursor-pointer transition-transform ${col.badge} ${
                          newFolderColor === col.id ? 'ring-2 ring-white scale-110' : 'opacity-70 hover:opacity-100'
                        }`}
                        title={col.label}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsCreatingNew(false)}
                    className="px-2.5 py-1 text-xs text-slate-400 hover:text-white cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? 'Guardando...' : 'Guardar Carpeta'}
                  </button>
                </div>
              </form>
            )}


            {/* Folders List */}
            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {folders.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
                  No has creado ninguna carpeta aún. Haz clic en "Nueva Carpeta" para crear temas como Medicina, Terror o Romántica.
                </div>
              ) : (
                folders.map((f) => {
                  const isSelected = f.id === selectedFolderId;
                  const count = books.filter((b) => b.folderId === f.id).length;
                  const isEditing = editingFolderId === f.id;

                  return (
                    <div
                      key={f.id}
                      onClick={() => setSelectedFolderId(f.id)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-slate-900 border-amber-500/60 shadow-md'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {isEditing ? (
                        <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full px-2.5 py-1 bg-slate-950 text-xs text-white rounded border border-amber-400"
                            autoFocus
                          />
                          <input
                            type="text"
                            value={editDesc}
                            onChange={(e) => setEditDesc(e.target.value)}
                            placeholder="Descripción"
                            className="w-full px-2.5 py-1 bg-slate-950 text-xs text-slate-300 rounded border border-slate-800"
                          />
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setEditingFolderId(null)}
                              className="px-2 py-0.5 text-xs text-slate-400 hover:text-white"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={handleSaveEdit}
                              className="px-2.5 py-0.5 text-xs font-semibold text-slate-950 bg-amber-400 rounded"
                            >
                              Guardar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-8 h-8 rounded-lg bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center shrink-0">
                              <Folder className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <h5 className="font-semibold text-xs text-white truncate">{f.name}</h5>
                              <p className="text-[11px] text-slate-400 truncate">{count} {count === 1 ? 'libro' : 'libros'}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              onClick={() => handleStartEdit(f)}
                              className="p-1 text-slate-500 hover:text-amber-400 cursor-pointer"
                              title="Editar nombre"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(f.id, f.name)}
                              className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer"
                              title="Eliminar carpeta"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Manage Books in Selected Folder */}
          <div className="md:col-span-7 p-5 space-y-4 flex flex-col justify-between">
            {currentFolder ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-semibold">
                      Contenido de la Carpeta
                    </span>
                    <h4 className="font-serif font-bold text-lg text-white flex items-center gap-2">
                      <span>{currentFolder.name}</span>
                      <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                        {booksInCurrentFolder.length} en esta carpeta
                      </span>
                    </h4>
                    {currentFolder.description && (
                      <p className="text-xs text-slate-400 mt-0.5">{currentFolder.description}</p>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-slate-300 mb-2 font-medium">
                    Haz clic en cualquier libro para agregarlo o quitarlo de esta carpeta:
                  </p>

                  <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                    {books.map((book) => {
                      const isInCurrent = book.folderId === currentFolder.id;
                      const hasOtherFolder = book.folderId && book.folderId !== currentFolder.id;

                      return (
                        <div
                          key={book.id}
                          onClick={() => handleToggleBookInFolder(book)}
                          className={`p-3 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-colors ${
                            isInCurrent
                              ? 'bg-emerald-950/30 border-emerald-500/50 hover:bg-emerald-950/40'
                              : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-10 h-14 rounded overflow-hidden bg-slate-800 shrink-0 border border-slate-700">
                              <img src={book.coverUrl} alt={book.title} className="w-full h-full object-cover" />
                            </div>
                            <div className="min-w-0">
                              <h6 className="font-semibold text-xs text-white truncate">{book.title}</h6>
                              <p className="text-[11px] text-slate-400">{book.author} · {book.genre}</p>
                              <div className="flex items-center gap-2 mt-1">
                                {book.isLiberated ? (
                                  <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                    Liberado Gratis
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-amber-300 font-mono bg-amber-500/10 px-1.5 py-0.5 rounded">
                                    ${book.price?.toLocaleString('es-CL')} CLP {book.priceUSD ? `/ $${book.priceUSD} USD` : ''}
                                  </span>
                                )}
                                {hasOtherFolder && (
                                  <span className="text-[10px] text-slate-500 truncate">
                                    (En: {book.folderName || 'Otra carpeta'})
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="shrink-0">
                            <div className={`w-6 h-6 rounded-md flex items-center justify-center border transition-colors ${
                              isInCurrent
                                ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                                : 'border-slate-700 text-transparent'
                            }`}>
                              <Check className="w-4 h-4 stroke-[3]" />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-20 text-slate-500 text-xs">
                Selecciona o crea una carpeta en la columna izquierda para gestionar sus libros.
              </div>
            )}

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 text-xs font-semibold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl transition-colors cursor-pointer"
              >
                Listo / Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
