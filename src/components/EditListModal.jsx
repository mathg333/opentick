import React, { useState, useEffect } from 'react';
import { X, Trash2, Check } from 'lucide-react';

export default function EditListModal({ isOpen, onClose, project, store }) {
  const { updateProject, deleteProject } = store;
  const [name, setName] = useState('');
  const [color, setColor] = useState('#3b82f6');
  const [icon, setIcon] = useState('📁');

  useEffect(() => {
    if (project) {
      setName(project.name);
      setColor(project.color || '#3b82f6');
      setIcon(project.icon || '📁');
    }
  }, [project]);

  if (!isOpen || !project) return null;

  const colors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', 
    '#8b5cf6', '#ec4899', '#06b6d4', '#64748b'
  ];

  const emojis = ['📁', '📚', '🚀', '🔥', '⚡', '🎯', '💼', '🏠', '💡', '⭐', '☰'];

  const handleSave = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    updateProject(project.id, {
      name: name.trim(),
      color,
      icon
    });
    onClose();
  };

  const handleDelete = () => {
    if (confirm(`Deseja excluir a lista "${project.name}"? As tarefas voltarão para a Caixa de Entrada.`)) {
      deleteProject(project.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4 backdrop-blur-xs select-none animate-in fade-in">
      <div 
        onClick={e => e.stopPropagation()} 
        className="w-full max-w-sm bg-[#1c1c1e] border border-[#2c2c2e] rounded-3xl p-5 shadow-2xl space-y-4"
      >
        <div className="flex items-center justify-between pb-2 border-b border-[#28282b]">
          <h2 className="text-base font-bold text-white">Editar Lista</h2>
          <button onClick={onClose} className="p-1 text-neutral-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="text-xs text-neutral-400 block mb-1">Nome da Lista</label>
            <div className="flex items-center gap-2 bg-[#141416] border border-[#2c2c2e] rounded-xl px-3 py-2">
              <span className="text-lg">{icon}</span>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                autoFocus
                className="w-full bg-transparent text-sm text-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-neutral-400 block mb-1.5">Ícone / Emoji</label>
            <div className="flex flex-wrap gap-2">
              {emojis.map(em => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setIcon(em)}
                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm transition-transform ${
                    icon === em ? 'bg-[#2c2c2e] scale-110 ring-1 ring-white' : 'hover:bg-[#141416]'
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-neutral-400 block mb-1.5">Cor da Lista</label>
            <div className="flex gap-2">
              {colors.map(c => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-6 h-6 rounded-full transition-transform ${
                    color === c ? 'scale-125 ring-2 ring-white' : 'opacity-70'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-[#28282b] flex items-center justify-between gap-2">
            {project.id !== 'inbox' ? (
              <button
                type="button"
                onClick={handleDelete}
                className="px-3 py-2 rounded-xl text-xs text-rose-400 hover:bg-rose-500/10 flex items-center gap-1.5 border border-rose-500/20"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Excluir</span>
              </button>
            ) : <div />}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-2 rounded-xl text-xs text-neutral-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#4c82f7] hover:bg-[#3b72e7] text-white shadow-md"
              >
                Salvar
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
