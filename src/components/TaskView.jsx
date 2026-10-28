import React, { useState } from 'react';
import { 
  Plus, 
  Calendar as CalendarIcon, 
  Flag, 
  Tag as TagIcon, 
  Check, 
  Trash2, 
  Clock, 
  Play, 
  ListTree, 
  X,
  ChevronRight
} from 'lucide-react';

export default function TaskView({ store, onStartPomodoroForTask }) {
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

  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState(0);
  const [newDueDate, setNewDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  // Filter tasks based on activeView
  let viewTitle = 'Minhas Tarefas';
  let filteredTasks = state.tasks;

  if (activeView === 'tasks-inbox') {
    viewTitle = 'Caixa de Entrada';
    filteredTasks = state.tasks.filter(t => t.projectId === 'inbox');
  } else if (activeView === 'tasks-today') {
    viewTitle = 'Tarefas de Hoje';
    filteredTasks = state.tasks.filter(t => t.dueDate === todayStr || (!t.completed && t.dueDate && t.dueDate < todayStr));
  } else if (activeView === 'tasks-next7') {
    viewTitle = 'Próximos 7 Dias';
    const nextWeek = new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0];
    filteredTasks = state.tasks.filter(t => t.dueDate >= todayStr && t.dueDate <= nextWeek);
  } else if (activeView.startsWith('project-')) {
    const projId = activeView.replace('project-', '');
    const proj = state.projects.find(p => p.id === projId);
    viewTitle = proj ? proj.name : 'Lista';
    filteredTasks = state.tasks.filter(t => t.projectId === projId);
  }

  const pendingTasks = filteredTasks.filter(t => !t.completed);
  const completedTasks = filteredTasks.filter(t => t.completed);

  const handleQuickAdd = (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    let targetProj = 'inbox';
    if (activeView.startsWith('project-')) {
      targetProj = activeView.replace('project-', '');
    }

    addTask({
      title: newTitle.trim(),
      projectId: targetProj,
      priority: newPriority,
      dueDate: newDueDate,
      urgent: newPriority >= 2,
      important: newPriority >= 2
    });

    setNewTitle('');
    setNewPriority(0);
  };

  const selectedTask = state.tasks.find(t => t.id === selectedTaskId);

  const priorityColors = {
    0: 'text-neutral-500',
    1: 'text-blue-400',
    2: 'text-amber-400',
    3: 'text-rose-500'
  };

  const priorityLabels = {
    0: 'Sem prioridade',
    1: 'Baixa',
    2: 'Média',
    3: 'Alta'
  };

  return (
    <div className="flex-1 flex h-screen overflow-hidden bg-[#121215]">
      {/* Main Task List Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="px-8 pt-7 pb-4 flex items-center justify-between border-b border-[#222226]">
          <div>
            <h1 className="text-xl font-bold text-neutral-100 flex items-center gap-3">
              {viewTitle}
              <span className="text-[11px] bg-[#1d1d21] text-neutral-400 font-medium px-2.5 py-0.5 rounded-full border border-[#27272a]">
                {pendingTasks.length} pendentes
              </span>
            </h1>
          </div>
        </div>

        {/* Quick Add Bar */}
        <div className="px-8 py-4">
          <form 
            onSubmit={handleQuickAdd}
            className="flex items-center gap-3 bg-[#09090b] border border-[#27272a] rounded-xl px-4 py-2.5 shadow-sm focus-within:border-neutral-500 transition-colors"
          >
            <Plus className="w-4 h-4 text-neutral-400 shrink-0" />
            <input
              type="text"
              placeholder='Adicionar tarefa rápida... (Pressione Enter para salvar)'
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="flex-1 bg-transparent text-xs text-neutral-100 placeholder-neutral-500 focus:outline-none"
            />
            
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="bg-[#151518] border border-[#27272a] text-neutral-300 rounded px-2 py-1 text-xs focus:outline-none"
              />

              <div className="flex items-center gap-1 bg-[#151518] border border-[#27272a] rounded p-0.5">
                {[0, 1, 2, 3].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setNewPriority(p)}
                    className={`p-1 rounded transition-colors ${newPriority === p ? 'bg-[#27272a] text-white' : 'text-neutral-500 hover:text-neutral-300'}`}
                    title={priorityLabels[p]}
                  >
                    <Flag className={`w-3 h-3 ${priorityColors[p]}`} />
                  </button>
                ))}
              </div>

              <button
                type="submit"
                disabled={!newTitle.trim()}
                className="bg-neutral-200 hover:bg-white disabled:opacity-30 text-black text-xs font-bold px-3.5 py-1.5 rounded-lg transition-colors"
              >
                Adicionar
              </button>
            </div>
          </form>
        </div>

        {/* Scrollable Tasks List */}
        <div className="flex-1 overflow-y-auto px-8 pb-12 space-y-4">
          {/* Pending Tasks */}
          <div className="space-y-1.5">
            {pendingTasks.map((task) => {
              const isSelected = selectedTaskId === task.id;
              const subtasksDone = (task.subtasks || []).filter(s => s.completed).length;
              const totalSubtasks = (task.subtasks || []).length;

              return (
                <div
                  key={task.id}
                  onClick={() => setSelectedTaskId(task.id)}
                  className={`group flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#1b1b20] border-neutral-600 shadow-sm'
                      : 'bg-[#151518] border-[#222226] hover:bg-[#1a1a1f] hover:border-[#2f2f36]'
                  }`}
                >
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTaskCompleted(task.id);
                      }}
                      className="w-4 h-4 rounded border border-neutral-600 hover:border-neutral-400 flex items-center justify-center transition-colors shrink-0"
                    >
                      {task.completed && <Check className="w-3 h-3 text-neutral-200 stroke-[3]" />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-neutral-200 truncate">
                          {task.title}
                        </span>
                        {task.priority > 0 && (
                          <Flag className={`w-3 h-3 ${priorityColors[task.priority]} shrink-0`} />
                        )}
                      </div>

                      {/* Meta badges: DueDate, Subtasks, Time */}
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-neutral-500">
                        {task.dueDate && (
                          <span className={`flex items-center gap-1 ${task.dueDate < todayStr ? 'text-rose-400 font-semibold' : ''}`}>
                            <CalendarIcon className="w-3 h-3" />
                            {task.dueDate === todayStr ? 'Hoje' : task.dueDate}
                          </span>
                        )}
                        {task.startTime && (
                          <span className="flex items-center gap-1 text-neutral-400">
                            <Clock className="w-3 h-3" />
                            {task.startTime} - {task.endTime || 'fim'}
                          </span>
                        )}
                        {totalSubtasks > 0 && (
                          <span className="flex items-center gap-1 text-neutral-400">
                            <ListTree className="w-3 h-3" />
                            {subtasksDone}/{totalSubtasks}
                          </span>
                        )}
                        {(task.tags || []).map(tg => (
                          <span key={tg} className="text-[10px] bg-[#1d1d21] text-neutral-400 px-1.5 py-0.2 rounded border border-[#27272a]">
                            #{tg}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onStartPomodoroForTask(task);
                      }}
                      className="p-1.5 text-neutral-400 hover:text-amber-400 hover:bg-[#222226] rounded-lg transition-colors"
                      title="Focar com Pomodoro"
                    >
                      <Play className="w-3.5 h-3.5" />
                    </button>
                    <ChevronRight className="w-4 h-4 text-neutral-600" />
                  </div>
                </div>
              );
            })}

            {pendingTasks.length === 0 && (
              <div className="py-12 text-center text-neutral-600">
                <Check className="w-8 h-8 mx-auto mb-2 text-neutral-700" />
                <p className="text-xs font-medium">Tudo limpo por aqui!</p>
                <p className="text-[11px] text-neutral-600 mt-0.5">Nenhuma tarefa pendente neste filtro.</p>
              </div>
            )}
          </div>

          {/* Completed Tasks section */}
          {completedTasks.length > 0 && (
            <div className="pt-6">
              <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider mb-2">
                Concluídas ({completedTasks.length})
              </h3>
              <div className="space-y-1.5 opacity-60">
                {completedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-2.5 rounded-xl border border-[#222226] bg-[#121215]"
                  >
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleTaskCompleted(task.id)}
                        className="w-4 h-4 rounded bg-emerald-600/30 border border-emerald-500/50 flex items-center justify-center"
                      >
                        <Check className="w-3 h-3 text-emerald-400" />
                      </button>
                      <span className="text-xs text-neutral-500 line-through">
                        {task.title}
                      </span>
                    </div>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="text-neutral-600 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Task Detail Drawer */}
      {selectedTask && (
        <div className="w-96 bg-[#0c0c0e] border-l border-[#222226] flex flex-col h-full overflow-hidden shadow-2xl">
          <div className="p-4 border-b border-[#222226] flex items-center justify-between">
            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
              Detalhes da Tarefa
            </span>
            <button
              onClick={() => setSelectedTaskId(null)}
              className="text-neutral-400 hover:text-white p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-6">
            {/* Title & Checkbox */}
            <div className="flex items-start gap-3">
              <button
                type="button"
                onClick={() => toggleTaskCompleted(selectedTask.id)}
                className={`mt-1 w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                  selectedTask.completed ? 'bg-neutral-200 border-white text-black' : 'border-neutral-600'
                }`}
              >
                {selectedTask.completed && <Check className="w-3 h-3 stroke-[3]" />}
              </button>
              <input
                type="text"
                value={selectedTask.title}
                onChange={(e) => updateTask(selectedTask.id, { title: e.target.value })}
                className="flex-1 bg-transparent text-sm font-semibold text-neutral-100 focus:outline-none border-b border-transparent focus:border-neutral-500"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs text-neutral-400 font-medium">Descrição / Notas</label>
              <textarea
                rows={3}
                placeholder="Adicione notas, links ou detalhes aqui..."
                value={selectedTask.description || ''}
                onChange={(e) => updateTask(selectedTask.id, { description: e.target.value })}
                className="w-full bg-[#151518] border border-[#27272a] rounded-lg p-3 text-xs text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-neutral-500"
              />
            </div>

            {/* Date and Time Blocking */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs text-neutral-400 font-medium flex items-center gap-1.5">
                  <CalendarIcon className="w-3.5 h-3.5 text-neutral-400" />
                  Vencimento
                </label>
                <input
                  type="date"
                  value={selectedTask.dueDate || ''}
                  onChange={(e) => updateTask(selectedTask.id, { dueDate: e.target.value })}
                  className="w-full bg-[#151518] border border-[#27272a] rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs text-neutral-400 font-medium flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-neutral-400" />
                  Time-Blocking
                </label>
                <div className="flex gap-1 items-center">
                  <input
                    type="time"
                    value={selectedTask.startTime || ''}
                    onChange={(e) => updateTask(selectedTask.id, { startTime: e.target.value })}
                    className="w-1/2 bg-[#151518] border border-[#27272a] rounded-lg px-1.5 py-1.5 text-xs text-neutral-200 focus:outline-none"
                  />
                  <span className="text-neutral-600">-</span>
                  <input
                    type="time"
                    value={selectedTask.endTime || ''}
                    onChange={(e) => updateTask(selectedTask.id, { endTime: e.target.value })}
                    className="w-1/2 bg-[#151518] border border-[#27272a] rounded-lg px-1.5 py-1.5 text-xs text-neutral-200 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Matriz de Eisenhower Quadrants Toggle */}
            <div className="p-3 bg-[#151518] rounded-xl border border-[#27272a] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-300">
                  Matriz de Eisenhower
                </span>
                <span className="text-[9px] bg-neutral-800 text-neutral-400 px-1.5 py-0.2 rounded font-bold">
                  PRO FREE
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => updateTask(selectedTask.id, { urgent: !selectedTask.urgent })}
                  className={`p-2 rounded-lg border text-left font-medium transition-colors ${
                    selectedTask.urgent
                      ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                      : 'bg-[#09090b] border-[#27272a] text-neutral-400 hover:text-white'
                  }`}
                >
                  ⚡ {selectedTask.urgent ? 'É Urgente' : 'Não é Urgente'}
                </button>
                <button
                  type="button"
                  onClick={() => updateTask(selectedTask.id, { important: !selectedTask.important })}
                  className={`p-2 rounded-lg border text-left font-medium transition-colors ${
                    selectedTask.important
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                      : 'bg-[#09090b] border-[#27272a] text-neutral-400 hover:text-white'
                  }`}
                >
                  🎯 {selectedTask.important ? 'É Importante' : 'Não é Importante'}
                </button>
              </div>
            </div>

            {/* Subtasks (Ilimitadas) */}
            <div className="space-y-2">
              <label className="text-xs text-neutral-400 font-medium flex items-center gap-1.5">
                <ListTree className="w-3.5 h-3.5 text-neutral-400" />
                Subtarefas
              </label>

              <div className="space-y-1.5">
                {(selectedTask.subtasks || []).map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between gap-2 p-1.5 bg-[#151518] rounded-lg border border-[#222226]">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <button
                        onClick={() => toggleSubtask(selectedTask.id, sub.id)}
                        className={`w-3.5 h-3.5 rounded border flex items-center justify-center ${
                          sub.completed ? 'bg-neutral-200 border-white text-black' : 'border-neutral-600'
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
                      className="text-neutral-600 hover:text-rose-400"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!newSubtaskTitle.trim()) return;
                    addSubtask(selectedTask.id, newSubtaskTitle.trim());
                    setNewSubtaskTitle('');
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    placeholder="Adicionar subtarefa..."
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    className="flex-1 bg-[#151518] border border-[#27272a] rounded-lg px-2.5 py-1 text-xs text-neutral-200 placeholder-neutral-600 focus:outline-none focus:border-neutral-500"
                  />
                  <button
                    type="submit"
                    className="bg-[#27272a] hover:bg-[#323238] text-white px-2.5 py-1 rounded-lg text-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </div>

            {/* Actions: Start Pomodoro & Delete */}
            <div className="pt-4 border-t border-[#222226] space-y-2">
              <button
                type="button"
                onClick={() => onStartPomodoroForTask(selectedTask)}
                className="w-full py-2.5 bg-neutral-200 hover:bg-white text-black rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Iniciar Pomodoro Nesta Tarefa
              </button>

              <button
                type="button"
                onClick={() => deleteTask(selectedTask.id)}
                className="w-full py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-xl text-xs font-medium flex items-center justify-center gap-2 transition-colors border border-rose-500/20"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Excluir Tarefa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
