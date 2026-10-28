import React, { useState } from 'react';
import { Search, X, Check, ArrowLeft, Calendar, Flag } from 'lucide-react';

export default function SearchModal({ isOpen, onClose, store }) {
  const { state, setSelectedTaskId, setActiveView } = store;
  const [query, setQuery] = useState('');

  if (!isOpen) return null;

  const results = query.trim()
    ? state.tasks.filter(t => 
        t.title.toLowerCase().includes(query.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(query.toLowerCase())) ||
        (t.tags && t.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase())))
      )
    : [];

  const handleSelect = (taskId) => {
    setSelectedTaskId(taskId);
    setActiveView('tasks-today');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#000000] flex flex-col h-full overflow-hidden select-none animate-in fade-in">
      {/* Search Header */}
      <div className="p-3.5 flex items-center gap-3 border-b border-[#1c1c1e] bg-[#141416] shrink-0">
        <button
          onClick={onClose}
          className="p-1 text-neutral-300 hover:text-white rounded-lg active:bg-neutral-800"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex-1 flex items-center gap-2 bg-[#1c1c1e] border border-[#2c2c2e] rounded-xl px-3 py-2">
          <Search className="w-4 h-4 text-neutral-400 shrink-0" />
          <input
            type="text"
            placeholder="Pesquisar tarefas, notas, tags..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            className="w-full bg-transparent text-xs text-white placeholder-neutral-500 focus:outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-neutral-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 max-w-lg mx-auto w-full pb-16">
        {results.map(task => (
          <div
            key={task.id}
            onClick={() => handleSelect(task.id)}
            className="bg-[#1c1c1e] border border-[#28282b] rounded-xl p-3 flex items-center justify-between cursor-pointer hover:border-neutral-500 transition-colors"
          >
            <div>
              <span className={`text-xs font-semibold text-white ${task.completed ? 'line-through text-neutral-500' : ''}`}>
                {task.title}
              </span>
              {task.dueDate && (
                <div className="flex items-center gap-1 text-[11px] text-neutral-400 mt-1">
                  <Calendar className="w-3 h-3" />
                  <span>{task.dueDate}</span>
                </div>
              )}
            </div>
            {task.priority > 0 && (
              <Flag className={`w-3.5 h-3.5 ${task.priority === 3 ? 'text-rose-500' : task.priority === 2 ? 'text-amber-500' : 'text-blue-400'}`} />
            )}
          </div>
        ))}

        {query.trim() && results.length === 0 && (
          <div className="text-center py-12 text-neutral-500 text-xs">
            Nenhuma tarefa encontrada para "{query}".
          </div>
        )}

        {!query.trim() && (
          <div className="text-center py-16 text-neutral-500 text-xs">
            Digite algo para buscar em todas as suas tarefas e listas.
          </div>
        )}
      </div>
    </div>
  );
}
