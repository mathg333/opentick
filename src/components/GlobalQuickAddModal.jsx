import React, { useState } from 'react';
import { Plus, Flag, Calendar as CalendarIcon, Clock, X, Grid } from 'lucide-react';

export default function GlobalQuickAddModal({ store, isOpen, onClose }) {
  if (!isOpen) return null;

  const { state, addTask } = store;
  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState('inbox');
  const [priority, setPriority] = useState(0);
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [urgent, setUrgent] = useState(false);
  const [important, setImportant] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    addTask({
      title: title.trim(),
      projectId,
      priority,
      dueDate,
      startTime,
      endTime,
      urgent: urgent || priority >= 2,
      important: important || priority >= 2
    });

    setTitle('');
    onClose();
  };

  const priorityColors = {
    0: 'text-neutral-500',
    1: 'text-blue-400',
    2: 'text-amber-400',
    3: 'text-rose-500'
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0c0c0e] border border-[#27272a] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
        <div className="p-4 border-b border-[#222226] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-neutral-300">Nova Tarefa Rápida</span>
            <span className="text-[10px] bg-[#1a1a1f] text-neutral-400 px-1.5 py-0.5 rounded font-mono border border-[#27272a]">
              Atalho: Q
            </span>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-white p-1 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <input
            type="text"
            placeholder="O que você precisa fazer?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            className="w-full bg-[#151518] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-400"
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-neutral-400 block mb-1">Lista / Projeto</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full bg-[#151518] border border-[#27272a] rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-none"
              >
                {state.projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] text-neutral-400 block mb-1">Vencimento</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-[#151518] border border-[#27272a] rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div>
              <span className="text-[11px] text-neutral-400 block mb-1">Prioridade</span>
              <div className="flex gap-1 bg-[#151518] border border-[#27272a] rounded-lg p-1">
                {[0, 1, 2, 3].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`px-2 py-1 rounded text-xs flex items-center gap-1 ${priority === p ? 'bg-[#27272a] text-white font-bold' : 'text-neutral-500 hover:text-neutral-300'}`}
                  >
                    <Flag className={`w-3 h-3 ${priorityColors[p]}`} />
                    <span>{p === 0 ? 'Nenhuma' : p === 1 ? 'Baixa' : p === 2 ? 'Média' : 'Alta'}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-1.5 items-end">
              <button
                type="button"
                onClick={() => setUrgent(!urgent)}
                className={`text-[11px] px-2.5 py-1.5 rounded-lg border font-semibold ${
                  urgent ? 'bg-rose-950/60 border-rose-800 text-rose-300' : 'bg-[#151518] border-[#27272a] text-neutral-500'
                }`}
              >
                ⚡ Urgente
              </button>
              <button
                type="button"
                onClick={() => setImportant(!important)}
                className={`text-[11px] px-2.5 py-1.5 rounded-lg border font-semibold ${
                  important ? 'bg-amber-950/60 border-amber-800 text-amber-300' : 'bg-[#151518] border-[#27272a] text-neutral-500'
                }`}
              >
                🎯 Importante
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-[#222226] flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs text-neutral-400 hover:text-white"
            >
              Cancelar (Esc)
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="bg-white hover:bg-neutral-200 disabled:opacity-30 text-black text-xs font-bold px-4 py-1.5 rounded-xl transition-colors"
            >
              Criar Tarefa (Enter)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
