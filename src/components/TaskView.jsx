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
  Plus,
  Kanban,
  List as ListIcon,
  Edit2,
  Tag as TagIcon
} from 'lucide-react';
import CustomDatePickerModal from './CustomDatePickerModal';
import EditListModal from './EditListModal';

export default function TaskView({ store, onStartPomodoroForTask, onOpenMobileMenu }) {
  const { 
    state, 
    activeView, 
    selectedTaskId, 
    setSelectedTaskId, 
    addTask, 
    addTasksForMultipleDates,
    updateTask, 
    toggleTaskCompleted, 
    deleteTask,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    addProject
  } = store;

  const [viewLayout, setViewLayout] = useState('list'); // 'list' or 'kanban'
  const [isCustomDateModalOpen, setIsCustomDateModalOpen] = useState(false);
  const [isEditListModalOpen, setIsEditListModalOpen] = useState(false);
  const [newTagInput, setNewTagInput] = useState('');
  const [quickTitle, setQuickTitle] = useState('');
  const [quickDueDate, setQuickDueDate] = useState('');
  const [quickPriority, setQuickPriority] = useState(0);

  const [collapsedSections, setCollapsedSections] = useState({
    noDate: false,
    today: false,
    upcoming: false,
    completed: false
  });

  const todayStr = new Date().toISOString().split('T')[0];

  // Determine current view title and active project
  let viewTitle = 'Caixa de Entrada';
  let currentProject = null;
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
    currentProject = state.projects.find(p => p.id === projId);
    viewTitle = currentProject ? currentProject.name : 'Lista';
    filteredTasks = state.tasks.filter(t => t.projectId === projId);
  }

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

  const handleQuickAdd = (e) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;

    let targetProj = 'inbox';
    if (activeView.startsWith('project-')) {
      targetProj = activeView.replace('project-', '');
    }

    addTask({
      title: quickTitle.trim(),
      projectId: targetProj,
      priority: quickPriority,
      dueDate: quickDueDate || (activeView === 'tasks-today' ? todayStr : ''),
      kanbanStatus: 'todo'
    });

    setQuickTitle('');
    setQuickDueDate('');
    setQuickPriority(0);
  };

  const handleMultipleDatesSelected = ({ dates, time }) => {
    if (!dates || dates.length === 0) return;
    let targetProj = 'inbox';
    if (activeView.startsWith('project-')) {
      targetProj = activeView.replace('project-', '');
    }

    if (selectedTask) {
      // Apply to currently open task
      updateTask(selectedTask.id, {
        dueDate: dates[0],
        startTime: time || selectedTask.startTime
      });
      // If user selected multiple dates, clone to the other dates as requested!
      if (dates.length > 1) {
        addTasksForMultipleDates(selectedTask, dates.slice(1));
      }
    } else {
      // Pre-fill quick add or create tasks
      addTasksForMultipleDates({
        title: quickTitle.trim() || 'Nova Tarefa Recorrente',
        projectId: targetProj,
        startTime: time,
        priority: 1
      }, dates);
      setQuickTitle('');
    }
  };

  // Kanban Columns Data
  const kanbanTodo = filteredTasks.filter(t => !t.completed && (t.kanbanStatus === 'todo' || !t.kanbanStatus));
  const kanbanInProgress = filteredTasks.filter(t => !t.completed && t.kanbanStatus === 'in_progress');
  const kanbanDone = filteredTasks.filter(t => t.completed || t.kanbanStatus === 'done');

  return (
    <div className="flex-1 flex h-full overflow-hidden bg-[#000000]">
      {/* Main Task List Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Bar with Layout Switcher (Lista / Kanban) and Edit List */}
        <div className="px-4 py-3 flex items-center justify-between bg-[#000000] shrink-0 border-b border-[#1c1c1e]">
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-white tracking-tight truncate max-w-[180px] sm:max-w-[260px]">
              {viewTitle}
            </h1>
            {currentProject && (
              <button
                onClick={() => setIsEditListModalOpen(true)}
                className="p-1 text-neutral-400 hover:text-white rounded-lg active:bg-neutral-800"
                title="Renomear ou Editar Lista"
              >
                <Edit2 className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* View Layout Switcher (Lista vs Kanban) */}
            <div className="flex items-center bg-[#1c1c1e] p-0.5 rounded-xl border border-[#2c2c2e]">
              <button
                onClick={() => setViewLayout('list')}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                  viewLayout === 'list' ? 'bg-[#2c2c2e] text-white shadow-xs' : 'text-neutral-400 hover:text-white'
                }`}
                title="Visualização em Lista"
              >
                <ListIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Lista</span>
              </button>
              <button
                onClick={() => setViewLayout('kanban')}
                className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
                  viewLayout === 'kanban' ? 'bg-[#2c2c2e] text-white shadow-xs' : 'text-neutral-400 hover:text-white'
                }`}
                title="Visualização em Quadro Kanban"
              >
                <Kanban className="w-4 h-4" />
                <span className="hidden sm:inline">Kanban</span>
              </button>
            </div>

            <button 
              onClick={() => setIsCustomDateModalOpen(true)}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg"
              title="Agendamento Múltiplo"
            >
              <CalendarIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* LAYOUT 1: LIST VIEW (Exact TickTick Floating Cards) */}
        {viewLayout === 'list' && (
          <div className="flex-1 overflow-y-auto px-3.5 md:px-8 py-3 space-y-3 pb-32">
            {/* Quick Add Bar */}
            <form 
              onSubmit={handleQuickAdd}
              className="bg-[#1c1c1e] border border-[#2c2c2e] rounded-2xl p-2.5 flex items-center gap-2 shadow-md"
            >
              <Plus className="w-4 h-4 text-neutral-400 shrink-0 ml-1" />
              <input
                type="text"
                placeholder={`Adicionar em "${viewTitle}"... (Enter para salvar)`}
                value={quickTitle}
                onChange={e => setQuickTitle(e.target.value)}
                className="flex-1 bg-transparent text-xs text-white placeholder-neutral-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setIsCustomDateModalOpen(true)}
                className="p-1 text-neutral-400 hover:text-white"
                title="Escolher datas múltiplas / horário"
              >
                <CalendarIcon className="w-4 h-4" />
              </button>
              <button
                type="submit"
                disabled={!quickTitle.trim()}
                className="px-3 py-1 bg-[#4c82f7] hover:bg-[#3b72e7] disabled:opacity-30 text-white text-xs font-bold rounded-xl shrink-0"
              >
                Salvar
              </button>
            </form>

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
                          <span className="text-sm font-medium text-neutral-100 truncate block">
                            {task.title}
                          </span>
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

            {/* Section: Hoje */}
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

            {/* Section: Próximas */}
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
                              {task.dueDate} {task.startTime ? ` às ${task.startTime}` : ''}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Section: Concluído */}
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
                        className="flex items-start justify-between gap-3 cursor-pointer opacity-75 hover:opacity-100"
                      >
                        <div className="flex items-start gap-3.5 flex-1 min-w-0">
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
                          className="text-neutral-500 hover:text-rose-400 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* LAYOUT 2: KANBAN / TRELLO VIEW (Requested by User) */}
        {viewLayout === 'kanban' && (
          <div className="flex-1 overflow-x-auto p-4 flex gap-4 pb-32">
            {[
              { id: 'todo', label: 'A Fazer', color: 'border-blue-500/40', badge: 'bg-blue-950 text-blue-300', tasks: kanbanTodo },
              { id: 'in_progress', label: 'Em Andamento', color: 'border-amber-500/40', badge: 'bg-amber-950 text-amber-300', tasks: kanbanInProgress },
              { id: 'done', label: 'Concluído', color: 'border-emerald-500/40', badge: 'bg-emerald-950 text-emerald-300', tasks: kanbanDone }
            ].map(col => (
              <div 
                key={col.id} 
                className="w-72 shrink-0 bg-[#1c1c1e] rounded-2xl border border-[#2c2c2e] flex flex-col overflow-hidden shadow-xl"
              >
                {/* Column Header */}
                <div className="p-3 border-b border-[#28282b] flex items-center justify-between bg-[#141416]">
                  <h3 className="text-xs font-bold text-white">{col.label}</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${col.badge}`}>
                    {col.tasks.length}
                  </span>
                </div>

                {/* Task Cards in Column */}
                <div className="flex-1 p-3 overflow-y-auto space-y-2">
                  {col.tasks.map(task => (
                    <div
                      key={task.id}
                      onClick={() => setSelectedTaskId(task.id)}
                      className="bg-[#141416] hover:bg-[#202024] border border-[#28282b] rounded-xl p-3 cursor-pointer space-y-2 shadow-sm transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className={`text-xs font-semibold text-white ${task.completed ? 'line-through text-neutral-500' : ''}`}>
                          {task.title}
                        </span>
                        {task.priority > 0 && (
                          <Flag className={`w-3 h-3 ${priorityColors[task.priority]} shrink-0`} />
                        )}
                      </div>

                      {task.dueDate && (
                        <div className="flex items-center gap-1 text-[10px] text-neutral-400">
                          <CalendarIcon className="w-3 h-3" />
                          <span>{task.dueDate}</span>
                        </div>
                      )}

                      {/* Move to next column quick button */}
                      <div className="pt-2 border-t border-[#222226] flex items-center justify-between text-[10px]">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTaskCompleted(task.id);
                          }}
                          className="text-neutral-400 hover:text-white"
                        >
                          {task.completed ? 'Reabrir' : 'Concluir'}
                        </button>
                        <select
                          onClick={e => e.stopPropagation()}
                          value={task.kanbanStatus || 'todo'}
                          onChange={e => {
                            e.stopPropagation();
                            updateTask(task.id, { kanbanStatus: e.target.value });
                          }}
                          className="bg-[#1c1c1e] text-neutral-300 rounded px-1.5 py-0.5 border border-[#2c2c2e] text-[10px] focus:outline-none"
                        >
                          <option value="todo">A Fazer</option>
                          <option value="in_progress">Em Andamento</option>
                          <option value="done">Concluído</option>
                        </select>
                      </div>
                    </div>
                  ))}

                  {col.tasks.length === 0 && (
                    <div className="text-center py-8 text-neutral-600 text-xs italic">
                      Nenhuma tarefa nesta coluna
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
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

            {/* List / Category Selector (Allows picking ANY list or creating a new one) */}
            <div className="bg-[#1c1c1e] p-4 rounded-2xl border border-[#2c2c2e] space-y-2">
              <label className="text-xs text-neutral-400 font-medium">Lista / Categoria</label>
              <div className="flex gap-2">
                <select
                  value={selectedTask.projectId || 'inbox'}
                  onChange={e => updateTask(selectedTask.id, { projectId: e.target.value })}
                  className="flex-1 bg-[#141416] border border-[#2c2c2e] text-xs text-white rounded-xl px-3 py-2 focus:outline-none"
                >
                  {state.projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    const customCategory = prompt('Nome da nova categoria / lista:');
                    if (customCategory && customCategory.trim()) {
                      const newProj = addProject({ name: customCategory.trim(), color: '#4c82f7' });
                      updateTask(selectedTask.id, { projectId: newProj.id });
                    }
                  }}
                  className="px-3 py-2 bg-[#141416] hover:bg-[#28282e] border border-[#2c2c2e] rounded-xl text-xs text-neutral-300 font-bold shrink-0"
                  title="Criar nova categoria livre"
                >
                  + Nova Lista
                </button>
              </div>
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

            {/* Date & Time with Custom Multi-Date Picker */}
            <div className="bg-[#1c1c1e] p-4 rounded-2xl border border-[#2c2c2e] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-400 font-medium flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-blue-400" />
                  Data de Vencimento
                </span>
                <button
                  type="button"
                  onClick={() => setIsCustomDateModalOpen(true)}
                  className="text-xs text-[#4c82f7] hover:underline font-medium"
                >
                  {selectedTask.dueDate || 'Escolher data'}
                </button>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#262629]">
                <span className="text-xs text-neutral-400 font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4 text-yellow-400" />
                  Horário
                </span>
                <input
                  type="time"
                  value={selectedTask.startTime || ''}
                  onChange={(e) => updateTask(selectedTask.id, { startTime: e.target.value })}
                  className="bg-[#141416] border border-[#2c2c2e] rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            {/* Custom Tags / Etiquetas */}
            <div className="bg-[#1c1c1e] p-4 rounded-2xl border border-[#2c2c2e] space-y-2">
              <label className="text-xs text-neutral-400 font-medium flex items-center gap-1.5">
                <TagIcon className="w-4 h-4 text-neutral-400" />
                Etiquetas Personalizadas
              </label>
              <div className="flex flex-wrap gap-1.5">
                {(selectedTask.tags || []).map(tg => (
                  <span key={tg} className="text-xs bg-[#141416] text-[#4c82f7] px-2.5 py-1 rounded-lg border border-[#2c2c2e] flex items-center gap-1">
                    #{tg}
                    <button
                      type="button"
                      onClick={() => updateTask(selectedTask.id, { tags: selectedTask.tags.filter(t => t !== tg) })}
                      className="text-neutral-500 hover:text-rose-400 ml-1"
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Nova tag (ex: urgente, estudo)..."
                  value={newTagInput}
                  onChange={e => setNewTagInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && newTagInput.trim()) {
                      e.preventDefault();
                      const clean = newTagInput.trim().replace(/^#/, '');
                      updateTask(selectedTask.id, { tags: [...(selectedTask.tags || []), clean] });
                      setNewTagInput('');
                    }
                  }}
                  className="flex-1 bg-[#141416] border border-[#2c2c2e] rounded-xl px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (newTagInput.trim()) {
                      const clean = newTagInput.trim().replace(/^#/, '');
                      updateTask(selectedTask.id, { tags: [...(selectedTask.tags || []), clean] });
                      setNewTagInput('');
                    }
                  }}
                  className="px-3 py-1.5 bg-[#2c2c2e] hover:bg-[#38383c] text-white rounded-xl text-xs font-bold"
                >
                  +
                </button>
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

      {/* Custom Multi-Date & Recurring Picker Modal */}
      <CustomDatePickerModal
        isOpen={isCustomDateModalOpen}
        onClose={() => setIsCustomDateModalOpen(false)}
        initialDate={selectedTask?.dueDate || quickDueDate}
        onSelectDates={handleMultipleDatesSelected}
      />

      {/* Edit List Modal */}
      {currentProject && (
        <EditListModal
          isOpen={isEditListModalOpen}
          onClose={() => setIsEditListModalOpen(false)}
          project={currentProject}
          store={store}
        />
      )}
    </div>
  );
}
