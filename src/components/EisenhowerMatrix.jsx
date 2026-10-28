import React, { useState } from 'react';
import { 
  Grid, 
  Plus, 
  Check, 
  AlertTriangle, 
  Target, 
  Clock, 
  Coffee 
} from 'lucide-react';

export default function EisenhowerMatrix({ store }) {
  const { state, addTask, toggleTaskCompleted, updateTask, setSelectedTaskId } = store;
  const [quickInputs, setQuickInputs] = useState({ q1: '', q2: '', q3: '', q4: '' });

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
      subtitle: 'Fazer Primeiro (Crises e Prazos Críticos)',
      icon: AlertTriangle,
      border: 'border-rose-900/50',
      badgeBg: 'bg-rose-950/60 text-rose-300 border-rose-800/40',
      tasks: q1Tasks
    },
    {
      key: 'q2',
      urgent: false,
      important: true,
      title: 'Não Urgente, mas Importante',
      subtitle: 'Planejar & Focar (Crescimento e Estratégia)',
      icon: Target,
      border: 'border-blue-900/50',
      badgeBg: 'bg-blue-950/60 text-blue-300 border-blue-800/40',
      tasks: q2Tasks
    },
    {
      key: 'q3',
      urgent: true,
      important: false,
      title: 'Urgente, mas Não Importante',
      subtitle: 'Delegar / Automatizar (Urgências e Pedidos)',
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
      subtitle: 'Eliminar / Reduzir (Distrações e Desperdício)',
      icon: Coffee,
      border: 'border-neutral-800',
      badgeBg: 'bg-neutral-800 text-neutral-300 border-neutral-700',
      tasks: q4Tasks
    }
  ];

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#121215]">
      {/* Header */}
      <div className="px-8 pt-6 pb-4 border-b border-[#222226] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#18181c] border border-[#27272a] flex items-center justify-center">
            <Grid className="w-4 h-4 text-neutral-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-neutral-100">
                Matriz de Eisenhower
              </h1>
              <span className="text-[10px] bg-neutral-800 text-neutral-300 font-bold px-2 py-0.5 rounded border border-neutral-700">
                PRO GRATUITO
              </span>
            </div>
            <p className="text-xs text-neutral-500">
              Priorização estratégica dos 4 quadrantes
            </p>
          </div>
        </div>

        <div className="text-xs text-neutral-400 bg-[#09090b] px-3 py-1.5 rounded-lg border border-[#222226]">
          Total Ativo: <span className="font-bold text-white">{activeTasks.length}</span> tarefas
        </div>
      </div>

      {/* 2x2 Grid Quadrants */}
      <div className="flex-1 p-6 grid grid-cols-2 grid-rows-2 gap-4 overflow-hidden">
        {quadrants.map(q => {
          const Icon = q.icon;
          return (
            <div
              key={q.key}
              className={`bg-[#0a0a0c] rounded-2xl border ${q.border} flex flex-col overflow-hidden shadow-xl`}
            >
              {/* Quadrant Header */}
              <div className="p-3.5 border-b border-[#1c1c20] flex items-center justify-between bg-[#0f0f13]">
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 text-neutral-300" />
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
                    placeholder={`Adicionar tarefa em ${q.title}...`}
                    value={quickInputs[q.key]}
                    onChange={(e) => setQuickInputs(prev => ({ ...prev, [q.key]: e.target.value }))}
                    className="flex-1 bg-[#141417] border border-[#27272a] text-xs text-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-neutral-500 placeholder-neutral-600"
                  />
                  <button
                    type="submit"
                    disabled={!quickInputs[q.key]?.trim()}
                    className="bg-[#27272a] hover:bg-[#3f3f46] disabled:opacity-20 text-white px-2.5 rounded-lg text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>

              {/* Tasks List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {q.tasks.map(task => (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTaskId(task.id)}
                    className="group bg-[#131317] border border-[#222226] hover:border-neutral-600 p-2.5 rounded-xl transition-all cursor-pointer flex items-center justify-between shadow-sm"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleTaskCompleted(task.id);
                        }}
                        className="w-3.5 h-3.5 rounded border border-neutral-600 hover:border-white flex items-center justify-center shrink-0"
                      >
                        {task.completed && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                      </button>
                      <span className="text-xs font-medium text-neutral-200 truncate">
                        {task.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {q.key !== 'q1' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); moveQuadrant(task.id, 'q1'); }}
                          className="text-[9px] bg-neutral-800 text-neutral-300 hover:bg-neutral-700 px-1.5 py-0.5 rounded font-bold"
                          title="Mover para Q1"
                        >
                          Q1
                        </button>
                      )}
                      {q.key !== 'q2' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); moveQuadrant(task.id, 'q2'); }}
                          className="text-[9px] bg-neutral-800 text-neutral-300 hover:bg-neutral-700 px-1.5 py-0.5 rounded font-bold"
                          title="Mover para Q2"
                        >
                          Q2
                        </button>
                      )}
                      {q.key !== 'q3' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); moveQuadrant(task.id, 'q3'); }}
                          className="text-[9px] bg-neutral-800 text-neutral-300 hover:bg-neutral-700 px-1.5 py-0.5 rounded font-bold"
                          title="Mover para Q3"
                        >
                          Q3
                        </button>
                      )}
                      {q.key !== 'q4' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); moveQuadrant(task.id, 'q4'); }}
                          className="text-[9px] bg-neutral-800 text-neutral-300 hover:bg-neutral-700 px-1.5 py-0.5 rounded font-bold"
                          title="Mover para Q4"
                        >
                          Q4
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {q.tasks.length === 0 && (
                  <div className="h-full flex items-center justify-center text-xs text-neutral-600 italic">
                    Nenhuma tarefa aqui
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
