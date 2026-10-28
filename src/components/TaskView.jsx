import React, { useState } from 'react';
import { 
  Check, 
  Trash2, 
  Clock, 
  Play, 
  ListTree, 
  X,
  ChevronDown,
  ChevronRight,
  MoreVertical,
  Calendar as CalendarIcon,
  Flag,
  ArrowLeft,
  Plus
} from 'lucide-react';

export default function TaskView({ store, onStartPomodoroForTask, onOpenMobileMenu }) {
  const { 
    state, 
    activeView, 
    selectedTaskId, 
    setSelectedTaskId, 
    addTask, 
    updateTask, 
    toggleTaskCompleted, 
    deleteTask,
    addSubtask,
    toggleSubtask,
    deleteSubtask
  } = store;

  const [collapsedSections, setCollapsedSections] = useState({
    noDate: false,
    today: false,
    upcoming: false,
    completed: false
  });

  const todayStr = new Date().toISOString().split('T')[0];

  // Determine current view title
  let viewTitle = 'Caixa de Entrada';
  let filteredTasks = state.tasks;

  if (activeView === 'tasks-inbox') {
    viewTitle = 'Caixa de Entrada';
    filteredTasks = state.tasks.filter(t => t.projectId === 'inbox');
  } else if (activeView === 'tasks-today') {
    viewTitle = 'Hoje';
    filteredTasks = state.tasks.filter(t => t.dueDate === todayStr || (!t.completed && t.dueDate && t.dueDate < todayStr));
  } else if (activeView === 'tasks-completed') {
    viewTitle = 'Concluído';
    filteredTasks = state.tasks.filter(t => t.completed);
  } else if (activeView.startsWith('project-')) {
    const projId = activeView.replace('project-', '');
    const proj = state.projects.find(p => p.id === projId);
    viewTitle = proj ? proj.name : 'Lista';
    filteredTasks = state.tasks.filter(t => t.projectId === projId);
  }

  // Group tasks into sections like TickTick:
  // 1. Sem Data (No due date)
  // 2. Hoje / Atrasadas
  // 3. Próximas (Upcoming)
  // 4. Concluído e Não Farei
  const pendingTasks = filteredTasks.filter(t => !t.completed);
  const completedTasks = filteredTasks.filter(t => t.completed);

  const noDateTasks = pendingTasks.filter(t => !t.dueDate);
  const todayTasks = pendingTasks.filter(t => t.dueDate === todayStr || (t.dueDate && t.dueDate < todayStr));
  const upcomingTasks = pendingTasks.filter(t => t.dueDate && t.dueDate > todayStr);

  const toggleSection = (key) => {
    setCollapsedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const selectedTask = state.tasks.find(t => t.id === selectedTaskId);

  const priorityColors = {
    0: 'text-neutral-500',
    1: 'text-blue-400',
    2: 'text-amber-400',
    3: 'text-rose-500'
  };

  return (
    <div className="flex-1 flex h-full overflow-hidden bg-[#000000]">
      {/* Main Task List Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* TickTick Top Bar */}
        <div className="px-4 py-3.5 flex items-center justify-between bg-[#000000] shrink-0 border-b border-[#1c1c1e]">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-white tracking-tight truncate max-w-[260px]">
              {viewTitle}
            </h1>
          </div>

          <div className="flex items-center gap-2">
            <button 
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg active:bg-neutral-800"
              title="Mais opções"
            >
              <MoreVertical className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Floating Cards Container (TickTick Android Style) */}
        <div className="flex-1 overflow-y-auto px-3.5 md:px-8 py-4 space-y-3 pb-32">
          {/* Section: Sem Data */}
          {noDateTasks.length > 0 && (
            <div className="bg-[#1c1c1e] rounded-2xl p-4 shadow-xl border border-[#262629]">
              <div 
                onClick={() => toggleSection('noDate')}
                className="flex items-center justify-between cursor-pointer select-none pb-2"
              >
                <span className="text-sm font-bold text-white">Sem Data</span>
                <div className="flex items-center gap-1 text-xs text-neutral-400">
                  <span className="font-mono">{noDateTasks.length}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${collapsedSections.noDate ? '-rotate-90' : ''}`} />
                </div>
              </div>

              {!collapsedSections.noDate && (
                <div className="space-y-3 pt-2">
                  {noDateTasks.map(task => (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTaskId(task.id)}
                      className="flex items-center justify-between gap-3 cursor-pointer group"
                    >
                      <div className="flex items-center gap-3.5 flex-1 min-w-0">
                        {/* TickTick rounded checkbox */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTaskCompleted(task.id);
                          }}
                          className="w-5 h-5 rounded-md border border-neutral-500 hover:border-neutral-300 flex items-center justify-center transition-colors shrink-0"
                        >
                          {task.completed && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                        </button>

                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-neutral-100 truncate block">
                            {task.title}
                          </span>
                        </div>
                      </div>

                      {task.priority > 0 && (
                        <Flag className={`w-3.5 h-3.5 ${priorityColors[task.priority]} shrink-0`} />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Section: Hoje / Atrasadas */}
          {todayTasks.length > 0 && (
            <div className="bg-[#1c1c1e] rounded-2xl p-4 shadow-xl border border-[#262629]">
              <div 
                onClick={() => toggleSection('today')}
                className="flex items-center justify-between cursor-pointer select-none pb-2"
              >
                <span className="text-sm font-bold text-white">Hoje</span>
                <div className="flex items-center gap-1 text-xs text-neutral-400">
                  <span className="font-mono">{todayTasks.length}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${collapsedSections.today ? '-rotate-90' : ''}`} />
                </div>
              </div>

              {!collapsedSections.today && (
                <div className="space-y-3 pt-2">
                  {todayTasks.map(task => (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTaskId(task.id)}
                      className="flex items-center justify-between gap-3 cursor-pointer group"
                    >
                      <div className="flex items-center gap-3.5 flex-1 min-w-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTaskCompleted(task.id);
                          }}
                          className="w-5 h-5 rounded-md border border-neutral-500 hover:border-neutral-300 flex items-center justify-center transition-colors shrink-0"
                        >
                          {task.completed && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                        </button>

                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-neutral-100 truncate block">
                            {task.title}
                          </span>
                          {task.startTime && (
                            <span className="text-xs text-[#4c82f7] flex items-center gap-1 mt-0.5 font-medium">
                              <Clock className="w-3 h-3" />
                              {task.startTime}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {task.priority > 0 && (
                          <Flag className={`w-3.5 h-3.5 ${priorityColors[task.priority]} shrink-0`} />
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onStartPomodoroForTask(task);
                          }}
                          className="p-1 text-neutral-400 hover:text-amber-400 rounded transition-colors"
                          title="Foco"
                        >
                          <Play className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Section: Próximas (Upcoming) */}
          {upcomingTasks.length > 0 && (
            <div className="bg-[#1c1c1e] rounded-2xl p-4 shadow-xl border border-[#262629]">
              <div 
                onClick={() => toggleSection('upcoming')}
                className="flex items-center justify-between cursor-pointer select-none pb-2"
              >
                <span className="text-sm font-bold text-white">Próximos Dias</span>
                <div className="flex items-center gap-1 text-xs text-neutral-400">
                  <span className="font-mono">{upcomingTasks.length}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${collapsedSections.upcoming ? '-rotate-90' : ''}`} />
                </div>
              </div>

              {!collapsedSections.upcoming && (
                <div className="space-y-3 pt-2">
                  {upcomingTasks.map(task => (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTaskId(task.id)}
                      className="flex items-center justify-between gap-3 cursor-pointer group"
                    >
                      <div className="flex items-center gap-3.5 flex-1 min-w-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTaskCompleted(task.id);
                          }}
                          className="w-5 h-5 rounded-md border border-neutral-500 hover:border-neutral-300 flex items-center justify-center transition-colors shrink-0"
                        >
                          {task.completed && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                        </button>

                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-medium text-neutral-100 truncate block">
                            {task.title}
                          </span>
                          <span className="text-xs text-neutral-400 mt-0.5 block">
                            {task.dueDate}
                          </span>
                        </div>
                      </div>

                      {task.priority > 0 && (
                        <Flag className={`w-3.5 h-3.5 ${priorityColors[task.priority]} shrink-0`} />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Section: Concluído e Não Farei (Matching photo_2026-10-28_00-42-45.jpg) */}
          {completedTasks.length > 0 && (
            <div className="bg-[#1c1c1e] rounded-2xl p-4 shadow-xl border border-[#262629]">
              <div 
                onClick={() => toggleSection('completed')}
                className="flex items-center justify-between cursor-pointer select-none pb-2"
              >
                <span className="text-sm font-bold text-neutral-300">Concluído e Não Farei.</span>
                <div className="flex items-center gap-1 text-xs text-neutral-400">
                  <span className="font-mono">{completedTasks.length}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${collapsedSections.completed ? '-rotate-90' : ''}`} />
                </div>
              </div>

              {!collapsedSections.completed && (
                <div className="space-y-3 pt-2">
                  {completedTasks.map(task => (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTaskId(task.id)}
                      className="flex items-start justify-between gap-3 cursor-pointer opacity-75 hover:opacity-100 transition-opacity"
                    >
                      <div className="flex items-start gap-3.5 flex-1 min-w-0">
                        {/* Checked tick or X icon */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTaskCompleted(task.id);
                          }}
                          className="mt-0.5 w-5 h-5 rounded-md bg-neutral-700/60 border border-neutral-600 flex items-center justify-center transition-colors shrink-0"
                        >
                          <Check className="w-3 h-3 text-neutral-300 stroke-[3]" />
                        </button>

                        <div className="flex-1 min-w-0">
                          <span className="text-xs font-medium text-neutral-300 uppercase tracking-wide block truncate line-through">
                            {task.title}
                          </span>
                          {task.description && (
                            <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                              {task.description}
                            </p>
                          )}
                          <span className="text-[11px] text-neutral-500 mt-1 block">
                            {task.dueDate ? `Concluído: ${task.dueDate}` : 'Concluído'}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteTask(task.id);
                        }}
                        className="text-neutral-500 hover:text-rose-400 p-1 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {pendingTasks.length === 0 && completedTasks.length === 0 && (
            <div className="py-20 text-center text-neutral-500">
              <Check className="w-10 h-10 mx-auto mb-3 text-neutral-600 stroke-[1.5]" />
              <p className="text-sm font-semibold text-neutral-300">Tudo limpo por aqui</p>
              <p className="text-xs text-neutral-500 mt-1">Toque no botão azul (+) para adicionar uma nova tarefa.</p>
            </div>
          )}
        </div>
      </div>

      {/* Task Detail Fullscreen Sheet / Drawer */}
      {selectedTask && (
        <div className="fixed inset-0 z-50 md:static md:w-96 md:z-auto bg-[#000000] border-l border-[#1c1c1e] flex flex-col h-full overflow-hidden shadow-2xl">
          <div className="p-4 border-b border-[#1c1c1e] flex items-center justify-between bg-[#141416]">
            <button
              onClick={() => setSelectedTaskId(null)}
              className="flex items-center gap-1.5 text-xs text-neutral-300 hover:text-white px-2.5 py-1.5 rounded-xl bg-[#1c1c1e] border border-[#2c2c2e]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar</span>
            </button>
            <span className="text-xs font-bold text-neutral-400">
              Detalhes da Tarefa
            </span>
            <button
              onClick={() => deleteTask(selectedTask.id)}
              className="text-neutral-400 hover:text-rose-400 p-1.5 rounded-lg"
              title="Excluir"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 pb-28 md:pb-8">
            {/* Title & Checkbox */}
            <div className="bg-[#1c1c1e] p-4 rounded-2xl border border-[#2c2c2e] flex items-start gap-3">
              <button
                type="button"
                onClick={() => toggleTaskCompleted(selectedTask.id)}
                className={`mt-1 w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                  selectedTask.completed ? 'bg-[#4c82f7] border-[#4c82f7] text-white' : 'border-neutral-500'
                }`}
              >
                {selectedTask.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </button>
              <input
                type="text"
                value={selectedTask.title}
                onChange={(e) => updateTask(selectedTask.id, { title: e.target.value })}
                className="flex-1 bg-transparent text-sm font-semibold text-white focus:outline-none"
              />
            </div>

            {/* Description Notes */}
            <div className="bg-[#1c1c1e] p-4 rounded-2xl border border-[#2c2c2e] space-y-1.5">
              <label className="text-xs text-neutral-400 font-medium">Notas / Descrição</label>
              <textarea
                rows={3}
                placeholder="Adicione anotações, links ou detalhes..."
                value={selectedTask.description || ''}
                onChange={(e) => updateTask(selectedTask.id, { description: e.target.value })}
                className="w-full bg-[#141416] border border-[#2c2c2e] rounded-xl p-3 text-xs text-white placeholder-neutral-500 focus:outline-none"
              />
            </div>

            {/* Date & Time */}
            <div className="bg-[#1c1c1e] p-4 rounded-2xl border border-[#2c2c2e] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-400 font-medium flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-blue-400" />
                  Data de Vencimento
                </span>
                <input
                  type="date"
                  value={selectedTask.dueDate || ''}
                  onChange={(e) => updateTask(selectedTask.id, { dueDate: e.target.value })}
                  className="bg-[#141416] border border-[#2c2c2e] rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#262629]">
                <span className="text-xs text-neutral-400 font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4 text-yellow-400" />
                  Horário (Time-Block)
                </span>
                <input
                  type="time"
                  value={selectedTask.startTime || ''}
                  onChange={(e) => updateTask(selectedTask.id, { startTime: e.target.value })}
                  className="bg-[#141416] border border-[#2c2c2e] rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            {/* Priority */}
            <div className="bg-[#1c1c1e] p-4 rounded-2xl border border-[#2c2c2e] space-y-2">
              <label className="text-xs text-neutral-400 font-medium">Prioridade</label>
              <div className="grid grid-cols-4 gap-1.5">
                {[0, 1, 2, 3].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => updateTask(selectedTask.id, { priority: p })}
                    className={`py-2 text-xs rounded-xl border flex items-center justify-center gap-1.5 transition-colors ${
                      selectedTask.priority === p
                        ? 'bg-[#28282e] border-neutral-400 text-white font-bold'
                        : 'border-[#262629] bg-[#141416] text-neutral-400'
                    }`}
                  >
                    <Flag className={`w-3.5 h-3.5 ${priorityColors[p]}`} />
                    <span>{p === 0 ? 'Sem' : p === 1 ? 'Baixa' : p === 2 ? 'Média' : 'Alta'}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Subtasks */}
            <div className="bg-[#1c1c1e] p-4 rounded-2xl border border-[#2c2c2e] space-y-2">
              <label className="text-xs text-neutral-400 font-medium flex items-center gap-1.5">
                <ListTree className="w-4 h-4 text-neutral-400" />
                Subtarefas
              </label>

              <div className="space-y-2">
                {(selectedTask.subtasks || []).map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between gap-2 p-2 bg-[#141416] rounded-xl border border-[#262629]">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <button
                        onClick={() => toggleSubtask(selectedTask.id, sub.id)}
                        className={`w-4 h-4 rounded border flex items-center justify-center ${
                          sub.completed ? 'bg-[#4c82f7] border-[#4c82f7] text-white' : 'border-neutral-500'
                        }`}
                      >
                        {sub.completed && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </button>
                      <span className={`text-xs truncate ${sub.completed ? 'line-through text-neutral-500' : 'text-neutral-200'}`}>
                        {sub.title}
                      </span>
                    </div>
                    <button
                      onClick={() => deleteSubtask(selectedTask.id, sub.id)}
                      className="text-neutral-500 hover:text-rose-400 p-1"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                <button
                  onClick={() => {
                    const title = prompt('Título da subtarefa:');
                    if (title && title.trim()) addSubtask(selectedTask.id, title.trim());
                  }}
                  className="w-full py-2 bg-[#141416] hover:bg-[#222226] text-neutral-300 rounded-xl text-xs flex items-center justify-center gap-1.5 border border-[#262629]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar subtarefa</span>
                </button>
              </div>
            </div>

            {/* Pomodoro Focus Action */}
            <button
              type="button"
              onClick={() => {
                setSelectedTaskId(null);
                onStartPomodoroForTask(selectedTask);
              }}
              className="w-full py-3 bg-[#4c82f7] text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-xl active:scale-98"
            >
              <Play className="w-4 h-4 fill-current" />
              Iniciar Pomodoro Nesta Tarefa
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
