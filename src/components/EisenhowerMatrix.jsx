import React, { useState } from 'react';
import { 
  Grid, 
  Plus, 
  Check, 
  AlertTriangle, 
  Target, 
  Clock, 
  Coffee,
  ArrowRight,
  ArrowDown
} from 'lucide-react';

export default function EisenhowerMatrix({ store }) {
  const { state, addTask, toggleTaskCompleted, updateTask, setSelectedTaskId } = store;
  const [quickInputs, setQuickInputs] = useState({ q1: '', q2: '', q3: '', q4: '' });
  const [mobileTab, setMobileTab] = useState('all'); // 'all', 'q1', 'q2', 'q3', 'q4'

  const activeTasks = state.tasks.filter(t => !t.completed);

  const q1Tasks = activeTasks.filter(t => t.urgent && t.important);
  const q2Tasks = activeTasks.filter(t => !t.urgent && t.important);
  const q3Tasks = activeTasks.filter(t => t.urgent && !t.important);
  const q4Tasks = activeTasks.filter(t => !t.urgent && !t.important);

  const handleAdd = (qKey, urgent, important) => {
    const title = quickInputs[qKey];
    if (!title || !title.trim()) return;

    addTask({
      title: title.trim(),
      urgent,
      important,
      priority: urgent && important ? 3 : important ? 2 : urgent ? 1 : 0
    });

    setQuickInputs(prev => ({ ...prev, [qKey]: '' }));
  };

  const moveQuadrant = (taskId, targetQ) => {
    if (targetQ === 'q1') updateTask(taskId, { urgent: true, important: true });
    if (targetQ === 'q2') updateTask(taskId, { urgent: false, important: true });
    if (targetQ === 'q3') updateTask(taskId, { urgent: true, important: false });
    if (targetQ === 'q4') updateTask(taskId, { urgent: false, important: false });
  };

  const quadrants = [
    {
      key: 'q1',
      urgent: true,
      important: true,
      title: 'Urgente & Importante',
      subtitle: 'Fazer Primeiro (Crítico)',
      icon: AlertTriangle,
      border: 'border-rose-900/50',
      badgeBg: 'bg-rose-950/60 text-rose-300 border-rose-800/40',
      tasks: q1Tasks
    },
    {
      key: 'q2',
      urgent: false,
      important: true,
      title: 'Não Urgente, Importante',
      subtitle: 'Planejar & Focar (Estratégico)',
      icon: Target,
      border: 'border-blue-900/50',
      badgeBg: 'bg-blue-950/60 text-blue-300 border-blue-800/40',
      tasks: q2Tasks
    },
    {
      key: 'q3',
      urgent: true,
      important: false,
      title: 'Urgente, Não Importante',
      subtitle: 'Delegar (Demandas Rápidas)',
      icon: Clock,
      border: 'border-amber-900/50',
      badgeBg: 'bg-amber-950/60 text-amber-300 border-amber-800/40',
      tasks: q3Tasks
    },
    {
      key: 'q4',
      urgent: false,
      important: false,
      title: 'Nem Urgente, Nem Importante',
      subtitle: 'Eliminar (Distrações)',
      icon: Coffee,
      border: 'border-neutral-800',
      badgeBg: 'bg-neutral-800 text-neutral-300 border-neutral-700',
      tasks: q4Tasks
    }
  ];

  const filteredQuadrants = mobileTab === 'all' 
    ? quadrants 
    : quadrants.filter(q => q.key === mobileTab);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#121215]">
      {/* Header */}
      <div className="px-4 py-3 md:px-8 md:pt-6 md:pb-4 border-b border-[#222226] bg-[#0c0c0e] shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#18181c] border border-[#27272a] flex items-center justify-center shrink-0">
              <Grid className="w-4 h-4 text-neutral-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base md:text-xl font-bold text-neutral-100">
                  Matriz de Eisenhower
                </h1>
              </div>
              <p className="text-xs text-neutral-500 hidden sm:block">
                Priorização estratégica dos 4 quadrantes
              </p>
            </div>
          </div>

          <div className="text-xs text-neutral-400 bg-[#09090b] px-2.5 py-1 rounded-lg border border-[#222226]">
            Total: <span className="font-bold text-white">{activeTasks.length}</span>
          </div>
        </div>

        {/* Mobile Tab Filter (Visível apenas em celulares/telas pequenas) */}
        <div className="flex md:hidden items-center gap-1 mt-3 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setMobileTab('all')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
              mobileTab === 'all' ? 'bg-white text-black' : 'bg-[#18181c] text-neutral-400'
            }`}
          >
            Todos ({activeTasks.length})
          </button>
          <button
            onClick={() => setMobileTab('q1')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
              mobileTab === 'q1' ? 'bg-rose-500 text-white font-bold' : 'bg-[#18181c] text-rose-300'
            }`}
          >
            Q1 Fazer ({q1Tasks.length})
          </button>
          <button
            onClick={() => setMobileTab('q2')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
              mobileTab === 'q2' ? 'bg-blue-600 text-white font-bold' : 'bg-[#18181c] text-blue-300'
            }`}
          >
            Q2 Planejar ({q2Tasks.length})
          </button>
          <button
            onClick={() => setMobileTab('q3')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
              mobileTab === 'q3' ? 'bg-amber-600 text-white font-bold' : 'bg-[#18181c] text-amber-300'
            }`}
          >
            Q3 Delegar ({q3Tasks.length})
          </button>
          <button
            onClick={() => setMobileTab('q4')}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
              mobileTab === 'q4' ? 'bg-neutral-600 text-white font-bold' : 'bg-[#18181c] text-neutral-400'
            }`}
          >
            Q4 Eliminar ({q4Tasks.length})
          </button>
        </div>
      </div>

      {/* Main Quadrants View - Responsive 1 column on mobile, 2x2 grid on desktop */}
      <div className="flex-1 p-3 md:p-6 overflow-y-auto pb-28 md:pb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 md:grid-rows-2 gap-4 h-auto md:h-full">
          {filteredQuadrants.map(q => {
            const Icon = q.icon;
            return (
              <div
                key={q.key}
                className={`bg-[#0a0a0c] rounded-2xl border ${q.border} flex flex-col overflow-hidden shadow-xl min-h-[280px] md:min-h-0`}
              >
                {/* Quadrant Header */}
                <div className="p-3 md:p-3.5 border-b border-[#1c1c20] flex items-center justify-between bg-[#0f0f13]">
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-neutral-300 shrink-0" />
                    <div>
                      <h2 className="text-xs font-bold text-neutral-100 leading-tight">
                        {q.title}
                      </h2>
                      <p className="text-[10px] text-neutral-500">{q.subtitle}</p>
                    </div>
                  </div>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold border ${q.badgeBg}`}>
                    {q.tasks.length}
                  </span>
                </div>

                {/* Quick Add within Quadrant */}
                <div className="px-3 py-2 border-b border-[#18181c] bg-[#0c0c0e]">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleAdd(q.key, q.urgent, q.important);
                    }}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      placeholder={`+ Adicionar em ${q.title.split('&')[0]}...`}
                      value={quickInputs[q.key]}
                      onChange={(e) => setQuickInputs(prev => ({ ...prev, [q.key]: e.target.value }))}
                      className="flex-1 bg-[#151518] border border-[#222226] rounded-lg px-2.5 py-1 text-xs text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-neutral-500"
                    />
                    <button
                      type="submit"
                      disabled={!quickInputs[q.key]?.trim()}
                      className="bg-neutral-200 hover:bg-white disabled:opacity-30 text-black px-2.5 py-1 rounded-lg text-xs font-bold transition-colors shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </form>
                </div>

                {/* Task List */}
                <div className="flex-1 p-3 overflow-y-auto space-y-2">
                  {q.tasks.map(task => (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTaskId(task.id)}
                      className="group p-2.5 rounded-xl bg-[#131317] border border-[#1f1f24] hover:border-neutral-600 hover:bg-[#18181e] transition-all cursor-pointer flex items-center justify-between gap-2 shadow-xs"
                    >
                      <div className="flex items-center gap-2.5 flex-1 min-w-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTaskCompleted(task.id);
                          }}
                          className="w-4 h-4 rounded border border-neutral-600 hover:border-white flex items-center justify-center shrink-0"
                        >
                          {task.completed && <Check className="w-3 h-3 text-white" />}
                        </button>
                        <span className="text-xs text-neutral-200 font-medium truncate">
                          {task.title}
                        </span>
                      </div>

                      {/* Move Quick Actions */}
                      <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <select
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => moveQuadrant(task.id, e.target.value)}
                          defaultValue={q.key}
                          className="bg-[#09090b] border border-[#27272a] text-[10px] text-neutral-400 rounded px-1.5 py-0.5 focus:outline-none"
                        >
                          <option value="q1">Q1 (Fazer)</option>
                          <option value="q2">Q2 (Planejar)</option>
                          <option value="q3">Q3 (Delegar)</option>
                          <option value="q4">Q4 (Eliminar)</option>
                        </select>
                      </div>
                    </div>
                  ))}

                  {q.tasks.length === 0 && (
                    <div className="h-full flex items-center justify-center text-center py-6 text-neutral-600 text-xs italic">
                      Nenhuma tarefa neste quadrante
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
