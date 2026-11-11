import React, { useState } from 'react';
import { 
  Check, 
  Trash2, 
  Clock, 
  Play, 
  ListTree, 
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Calendar as CalendarIcon,
  Flag,
  ArrowLeft,
  Plus,
  Kanban,
  List as ListIcon,
  Edit2,
  Tag as TagIcon,
  Repeat,
  SlidersHorizontal
} from 'lucide-react';
import CustomDatePickerModal from './CustomDatePickerModal';
import { getTaskTimes, getTaskDates, getTodayYMD } from '../utils/taskSchedule';
import EditListModal from './EditListModal';
import TimePickerModal from './TimePickerModal';
import SegmentedProgressCard from './SegmentedProgressCard';
import HomeHabitCard from './HomeHabitCard';

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
    addProject,
    taskViewLayout,
    setTaskViewLayout
  } = store;

  const viewLayout = taskViewLayout || 'list';
  const setViewLayout = (l) => {
    if (setTaskViewLayout) setTaskViewLayout(l);
  };
  const [isCustomDateModalOpen, setIsCustomDateModalOpen] = useState(false);
  const [isEditListModalOpen, setIsEditListModalOpen] = useState(false);
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [editingTimeSlot, setEditingTimeSlot] = useState(null);
  const [detailCalMonth, setDetailCalMonth] = useState(() => new Date());
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

  const todayStr = getTodayYMD();

  // Current view title and active project
  let viewTitle = 'Caixa de Entrada';
  let currentProject = null;
  let filteredTasks = state.tasks;

  if (activeView === 'tasks-inbox') {
    viewTitle = 'Caixa de Entrada';
    filteredTasks = state.tasks.filter(t => t.projectId === 'inbox');
  } else if (activeView === 'tasks-today') {
    viewTitle = 'Hoje';
    filteredTasks = state.tasks.filter(t => {
      const matchDue = t.dueDate === todayStr;
      const matchRecur = t.recurringDates && t.recurringDates.includes(todayStr);
      const overdue = !t.completed && t.dueDate && t.dueDate < todayStr;
      return matchDue || matchRecur || overdue;
    });
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

  const noDateTasks = pendingTasks.filter(t => !t.dueDate && (!t.recurringDates || t.recurringDates.length === 0));
  const todayTasks = pendingTasks.filter(t => {
    const isToday = t.dueDate === todayStr || (t.recurringDates && t.recurringDates.includes(todayStr));
    const isOverdue = t.dueDate && t.dueDate < todayStr;
    return isToday || isOverdue;
  });
  const upcomingTasks = pendingTasks.filter(t => {
    if (noDateTasks.includes(t) || todayTasks.includes(t)) return false;
    return true;
  });

  const toggleSection = (key) => {
    setCollapsedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const selectedTask = state.tasks.find(t => t.id === selectedTaskId);

  const priorityColors = {
    0: 'text-neutral-500',
    1: 'text-[#facc15]/60',
    2: 'text-[#facc15]',
    3: 'text-[#facc15] fill-[#facc15]'
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

  // Multiple Dates & Multiple Times Confirmation Handler
  const handleMultipleDatesSelected = (datesArg, firstTimeArg = '', metaArg = {}) => {
    const dates = Array.isArray(datesArg) ? datesArg : (datesArg?.dates || []);
    const times = Array.isArray(metaArg?.times)
      ? metaArg.times
      : (firstTimeArg ? [firstTimeArg] : (datesArg?.time ? [datesArg.time] : []));
    const pattern = metaArg?.pattern || null;

    if (!dates || dates.length === 0) return;
    let targetProj = 'inbox';
    if (activeView.startsWith('project-')) {
      targetProj = activeView.replace('project-', '');
    }

    if (selectedTask) {
      const nextTimes = times.length > 0 ? times : getTaskTimes(selectedTask);
      updateTask(selectedTask.id, {
        dueDate: dates[0],
        recurringDates: dates,
        recurringTimes: nextTimes,
        startTime: nextTimes[0] || '',
        recurrencePattern: pattern || selectedTask.recurrencePattern || null
      });
    } else {
      addTasksForMultipleDates({
        title: quickTitle.trim() || 'Nova Tarefa Programada',
        projectId: targetProj,
        recurringTimes: times,
        startTime: times[0] || '',
        recurrencePattern: pattern,
        priority: 1
      }, dates);
      setQuickTitle('');
    }
  };

  const handleApplyCustomFromTaskView = ({ dates, times, pattern, taskAction, taskId, title, projectId }) => {
    if (!dates || dates.length === 0) return;
    if (selectedTask) {
      updateTask(selectedTask.id, {
        dueDate: dates[0],
        recurringDates: dates,
        recurringTimes: times,
        startTime: times[0] || '',
        recurrencePattern: pattern
      });
      return;
    }
    if (taskAction === 'existing' && taskId) {
      updateTask(taskId, {
        dueDate: dates[0],
        recurringDates: dates,
        recurringTimes: times,
        startTime: times[0] || '',
        recurrencePattern: pattern
      });
      return;
    }
    let fallbackProj = 'inbox';
    if (activeView.startsWith('project-')) {
      fallbackProj = activeView.replace('project-', '');
    }
    addTasksForMultipleDates({
      title: title || quickTitle.trim() || 'Nova Tarefa Programada',
      projectId: projectId || fallbackProj,
      recurringTimes: times,
      startTime: times[0] || '',
      recurrencePattern: pattern,
      priority: 1
    }, dates);
    setQuickTitle('');
  };

  // Toggle single date inside task detail calendar
  const handleToggleDateInTask = (dStr) => {
    if (!selectedTask) return;
    const current = selectedTask.recurringDates ? [...selectedTask.recurringDates] : (selectedTask.dueDate ? [selectedTask.dueDate] : []);
    let updated;
    if (current.includes(dStr)) {
      updated = current.filter(d => d !== dStr);
    } else {
      updated = [...current, dStr].sort();
    }
    updateTask(selectedTask.id, {
      recurringDates: updated,
      dueDate: updated[0] || ''
    });
  };

  // Kanban Columns Data
  const kanbanTodo = filteredTasks.filter(t => !t.completed && (t.kanbanStatus === 'todo' || !t.kanbanStatus));
  const kanbanInProgress = filteredTasks.filter(t => !t.completed && t.kanbanStatus === 'in_progress');
  const kanbanDone = filteredTasks.filter(t => t.completed || t.kanbanStatus === 'done');

  // Month days for detail sheet interactive calendar
  const year = detailCalMonth.getFullYear();
  const month = detailCalMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const detailMonthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  return (
    <div className="flex-1 flex h-full overflow-hidden bg-[#000000]">
      {/* Main Task List Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Bar with Layout Switcher (Lista / Trello) and Edit List */}
        <div className="px-4 py-3 flex items-center justify-between bg-[#000000] shrink-0 border-b border-[#1c1c1e]">
          <div className="flex items-center gap-2">
            <h1 className="hidden md:block text-lg font-bold text-white tracking-tight truncate max-w-[180px] sm:max-w-[260px]">
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

          <div className="flex items-center gap-2 ml-auto">
            {/* View Layout Switcher (Lista vs Trello) */}
            <div className="flex items-center bg-[#1c1c1e] p-0.5 rounded-xl border border-[#2c2c2e]">
              <button
                onClick={() => setViewLayout('list')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  viewLayout === 'list' ? 'bg-[#facc15] text-black font-bold shadow-xs' : 'text-neutral-400 hover:text-white'
                }`}
                title="Visualização em Lista"
              >
                <ListIcon className="w-4 h-4" />
                <span>Lista</span>
              </button>
              <button
                onClick={() => setViewLayout('kanban')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  viewLayout === 'kanban' ? 'bg-[#facc15] text-black font-bold shadow-xs' : 'text-neutral-400 hover:text-white'
                }`}
                title="Visualização em Quadro Trello"
              >
                <Kanban className="w-4 h-4" />
                <span>Trello</span>
              </button>
            </div>

            <button 
              onClick={() => setIsCustomDateModalOpen(true)}
              className="px-2.5 py-1.5 text-[#facc15] bg-[#1c1c1e] hover:bg-[#28282e] border border-[#facc15]/35 rounded-xl transition-colors flex items-center gap-1.5 text-[11px] font-bold"
              title="Personalizado: Dias, Datas & Vários Horários"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#facc15]" />
              <span className="hidden sm:inline">Personalizado</span>
            </button>
          </div>
        </div>

        {/* LAYOUT 1: LIST VIEW (Clean Mobile First Layout) */}
        {viewLayout === 'list' && (
          <div className="flex-1 overflow-y-auto px-3.5 md:px-6 pt-1.5 pb-32 space-y-2.5">
            {/* Quick Add Bar - Compact & High-Positioned */}
            <form 
              onSubmit={handleQuickAdd}
              className="bg-[#1c1c1e] border border-[#2c2c2e] rounded-xl px-3 py-2 flex items-center gap-2 shadow-md"
            >
              <Plus className="w-4 h-4 text-[#facc15] shrink-0 ml-0.5" />
              <input
                type="text"
                placeholder={`Adicionar em "${viewTitle}"...`}
                value={quickTitle}
                onChange={e => setQuickTitle(e.target.value)}
                className="flex-1 bg-transparent text-xs text-white placeholder-neutral-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setIsCustomDateModalOpen(true)}
                className="p-1 text-neutral-400 hover:text-[#facc15]"
                title="Escolher datas múltiplas / horário"
              >
                <CalendarIcon className="w-4 h-4 text-[#facc15]" />
              </button>
              <button
                type="submit"
                disabled={!quickTitle.trim()}
                className="px-3 py-1 bg-[#facc15] hover:bg-[#eab308] disabled:opacity-30 text-black text-xs font-bold rounded-lg shrink-0 transition-colors shadow-sm"
              >
                Salvar
              </button>
            </form>

            {/* In "Hoje" View: Show Extended Segmented Progress Card, Today's Tasks, and Rich Habit Tracker Card! */}
            {activeView === 'tasks-today' ? (
              <div className="space-y-4">
                {/* 1. Extended Segmented Progress Meter Bar Card (Image 2) */}
                <SegmentedProgressCard store={store} />

                {/* 2. Tasks for Today */}
                {todayTasks.length === 0 ? (
                  <div className="py-6 bg-[#0f0f12] border border-[#222226] rounded-2xl flex flex-col items-center justify-center text-center px-4 shadow-lg">
                    <div className="w-11 h-11 rounded-full bg-[#18181c] border border-[#282830] flex items-center justify-center mb-2 text-xl shadow-inner">
                      ☀️
                    </div>
                    <h3 className="text-sm font-bold text-white mb-0.5">Nenhuma tarefa pendente para hoje!</h3>
                    <p className="text-[11px] text-neutral-400 max-w-xs mb-3">
                      Adicione uma nova tarefa no campo acima ou selecione datas específicas no calendário.
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsCustomDateModalOpen(true)}
                      className="px-3.5 py-1.5 bg-[#facc15] hover:bg-[#eab308] text-black font-bold text-xs font-bold rounded-xl shadow-md flex items-center gap-2"
                    >
                      <CalendarIcon className="w-3.5 h-3.5" />
                      <span>Agendar no Calendário</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {todayTasks.map(task => {
                      const recurCount = task.recurringDates ? task.recurringDates.length : 0;
                      return (
                        <div
                          key={task.id}
                          onClick={() => setSelectedTaskId(task.id)}
                          className="bg-[#1c1c1e] hover:bg-[#222226] border border-[#262629] rounded-2xl p-4 flex items-center justify-between gap-3 cursor-pointer shadow-lg active:scale-99 transition-all"
                        >
                          <div className="flex items-center gap-3.5 flex-1 min-w-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleTaskCompleted(task.id);
                              }}
                              className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0 ${
                                task.completed ? 'bg-[#facc15] border-[#facc15]' : 'border-neutral-500 hover:border-neutral-300'
                              }`}
                            >
                              {task.completed && <Check className="w-3.5 h-3.5 text-black stroke-[3]" />}
                            </button>
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-semibold text-neutral-100 truncate block">
                                {task.title}
                              </span>
                              <div className="flex items-center flex-wrap gap-2 mt-1">
                                {getTaskTimes(task).length > 0 && (
                                  <span className="text-xs text-[#facc15] flex items-center gap-1 font-bold">
                                    <Clock className="w-3.5 h-3.5 text-[#facc15]" />
                                    {getTaskTimes(task).join(', ')}
                                  </span>
                                )}
                                {recurCount > 1 && (
                                  <span className="text-[10px] bg-[#facc15]/20 text-[#facc15] font-bold px-2 py-0.5 rounded-full border border-[#facc15]/30 flex items-center gap-1">
                                    <Repeat className="w-3 h-3 text-[#facc15]" />
                                    {recurCount} datas agendadas
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {task.priority > 0 && (
                              <Flag className={`w-4 h-4 ${priorityColors[task.priority]} shrink-0`} />
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onStartPomodoroForTask(task);
                              }}
                              className="p-1.5 text-neutral-400 hover:text-[#facc15] rounded-lg transition-colors"
                              title="Iniciar Foco"
                            >
                              <Play className="w-4 h-4 text-[#facc15]" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Collapsed completed tasks for today */}
                {completedTasks.length > 0 && (
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => toggleSection('completed')}
                      className="w-full flex items-center justify-between text-xs text-neutral-400 py-2 px-1 hover:text-neutral-300"
                    >
                      <span>Concluídas Hoje ({completedTasks.length})</span>
                      <ChevronDown className={`w-4 h-4 transition-transform ${collapsedSections.completed ? '-rotate-90' : ''}`} />
                    </button>

                    {!collapsedSections.completed && (
                      <div className="space-y-2 pt-1 opacity-70">
                        {completedTasks.map(task => (
                          <div
                            key={task.id}
                            onClick={() => setSelectedTaskId(task.id)}
                            className="bg-[#141416] border border-[#222226] rounded-xl p-3 flex items-center justify-between gap-3 cursor-pointer"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleTaskCompleted(task.id);
                                }}
                                className="w-5 h-5 rounded-md bg-[#facc15] border border-[#facc15] flex items-center justify-center shrink-0"
                              >
                                <Check className="w-3 h-3 text-black stroke-[3]" />
                              </button>
                              <span className="text-xs text-neutral-400 line-through truncate">
                                {task.title}
                              </span>
                            </div>
                            <button
                              type="button"
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

                {/* 3. Rich Home Habit Tracking Card with Yellow 7-Row Heatmap Matrix & Done Button (Image 1) */}
                <HomeHabitCard store={store} />
              </div>
            ) : (
              /* In other views: render sections as usual */
              <>
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
                                {task.completed && <Check className="w-3.5 h-3.5 text-black stroke-[3]" />}
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
                        {upcomingTasks.map(task => {
                          const recurCount = task.recurringDates ? task.recurringDates.length : 0;
                          return (
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
                                  {task.completed && <Check className="w-3.5 h-3.5 text-black stroke-[3]" />}
                                </button>
                                <div className="flex-1 min-w-0">
                                  <span className="text-sm font-medium text-neutral-100 truncate block">
                                    {task.title}
                                  </span>
                                  <div className="flex items-center flex-wrap gap-2 mt-0.5">
                                    <span className="text-xs text-neutral-400">
                                      {task.dueDate} {getTaskTimes(task).length > 0 ? ` às ${getTaskTimes(task).join(', ')}` : ''}
                                    </span>
                                    {recurCount > 1 && (
                                      <span className="text-[10px] bg-[#facc15]/20 text-[#facc15] font-bold px-1.5 py-0.2 rounded border border-[#facc15]/30 flex items-center gap-1">
                                        <Repeat className="w-2.5 h-2.5" />
                                        {recurCount} datas
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {task.priority > 0 && (
                                <Flag className={`w-3.5 h-3.5 ${priorityColors[task.priority]} shrink-0`} />
                              )}
                            </div>
                          );
                        })}
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
                                className="mt-0.5 w-5 h-5 rounded-md bg-[#facc15] border border-[#facc15] flex items-center justify-center transition-colors shrink-0"
                              >
                                <Check className="w-3 h-3 text-black stroke-[3]" />
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
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* LAYOUT 2: KANBAN / TRELLO VIEW */}
        {viewLayout === 'kanban' && (
          <div className="flex-1 overflow-x-auto p-4 flex gap-4 pb-32">
            {[
              { id: 'todo', label: 'A Fazer', color: 'border-[#facc15]/30', badge: 'bg-[#facc15]/15 text-[#facc15] border border-[#facc15]/30', tasks: kanbanTodo },
              { id: 'in_progress', label: 'Em Andamento', color: 'border-[#facc15]/30', badge: 'bg-[#facc15]/15 text-[#facc15] border border-[#facc15]/30', tasks: kanbanInProgress },
              { id: 'done', label: 'Concluído', color: 'border-[#facc15]/30', badge: 'bg-[#facc15]/15 text-[#facc15] border border-[#facc15]/30', tasks: kanbanDone }
            ].map(col => (
              <div 
                key={col.id} 
                className="w-72 shrink-0 bg-[#1c1c1e] rounded-2xl border border-[#2c2c2e] flex flex-col overflow-hidden shadow-xl"
              >
                <div className="p-3 border-b border-[#28282b] flex items-center justify-between bg-[#141416]">
                  <h3 className="text-xs font-bold text-white">{col.label}</h3>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${col.badge}`}>
                    {col.tasks.length}
                  </span>
                </div>

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
                          <CalendarIcon className="w-3 h-3 text-[#facc15]" />
                          <span className="truncate">{task.dueDate} {getTaskTimes(task).length > 0 ? ` às ${getTaskTimes(task).join(', ')}` : ''}</span>
                        </div>
                      )}

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
                  selectedTask.completed ? 'bg-[#facc15] border-[#facc15] text-black' : 'border-neutral-500'
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

            {/* List / Category Selector - 100% Contained in Card */}
            <div className="bg-[#1c1c1e] p-4 rounded-2xl border border-[#2c2c2e] space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs text-neutral-400 font-medium">Lista / Categoria</label>
                <button
                  type="button"
                  onClick={() => {
                    const customCategory = prompt('Nome da nova categoria / lista:');
                    if (customCategory && customCategory.trim()) {
                      const newProj = addProject({ name: customCategory.trim(), color: '#facc15' });
                      updateTask(selectedTask.id, { projectId: newProj.id });
                    }
                  }}
                  className="text-xs text-[#facc15] hover:text-[#eab308] font-bold flex items-center gap-1 active:scale-95 transition-transform"
                >
                  + Nova Lista
                </button>
              </div>
              <select
                value={selectedTask.projectId || 'inbox'}
                onChange={e => updateTask(selectedTask.id, { projectId: e.target.value })}
                className="w-full bg-[#141416] border border-[#2c2c2e] text-xs text-white rounded-xl px-3 py-2.5 focus:outline-none truncate"
              >
                {state.projects.map(p => (
                  <option key={p.id} value={p.id}>{p.icon || '📁'} {p.name}</option>
                ))}
              </select>
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

            {/* Date & Multiple Times Picker + Personalizado Button */}
            <div className="bg-[#1c1c1e] p-4 rounded-2xl border border-[#2c2c2e] space-y-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-neutral-400 font-medium flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-[#facc15]" />
                  Data Principal
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white font-bold">
                    {selectedTask.dueDate || 'Sem data'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsCustomDateModalOpen(true)}
                    className="px-2.5 py-1 rounded-lg bg-[#facc15] hover:bg-[#eab308] text-black text-[11px] font-black flex items-center gap-1 shadow-sm"
                  >
                    <SlidersHorizontal className="w-3 h-3 text-black" />
                    <span>Personalizado</span>
                  </button>
                </div>
              </div>

              {/* Multi-Time Chips Section */}
              <div className="pt-2.5 border-t border-[#262629] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-400 font-medium flex items-center gap-2">
                    <Clock className="w-4 h-4 text-[#facc15]" />
                    Horários ({getTaskTimes(selectedTask).length})
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTimeSlot(null);
                      setIsTimePickerOpen(true);
                    }}
                    className="bg-[#facc15]/15 hover:bg-[#facc15]/25 border border-[#facc15]/40 rounded-xl px-2.5 py-1 text-[11px] text-[#facc15] font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#facc15]" />
                    <span>Adicionar Horário</span>
                  </button>
                </div>

                {getTaskTimes(selectedTask).length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {getTaskTimes(selectedTask).map(tm => (
                      <div
                        key={tm}
                        className="flex items-center gap-1 bg-[#141416] border border-[#facc15]/40 text-[#facc15] rounded-lg px-2.5 py-1 text-xs font-mono font-bold"
                      >
                        <button
                          type="button"
                          onClick={() => {
                            setEditingTimeSlot(tm);
                            setIsTimePickerOpen(true);
                          }}
                          className="hover:underline"
                        >
                          {tm}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const remaining = getTaskTimes(selectedTask).filter(x => x !== tm);
                            updateTask(selectedTask.id, {
                              recurringTimes: remaining,
                              startTime: remaining[0] || ''
                            });
                          }}
                          className="p-0.5 hover:bg-[#facc15]/20 rounded text-[#facc15]"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-neutral-500">
                    Nenhum horário definido — toque em + Adicionar Horário.
                  </p>
                )}
              </div>
            </div>

            {/* FULL MONTH CALENDAR VIEW OF RECURRING DATES WITH MONTH NAVIGATION */}
            <div className="bg-[#1c1c1e] p-4 rounded-2xl border border-[#2c2c2e] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-white font-bold flex items-center gap-1.5">
                  <CalendarIcon className="w-4 h-4 text-[#facc15]" />
                  Calendário de Repetições
                </span>
                <span className="text-[10px] text-[#facc15] font-mono font-bold">
                  {getTaskDates(selectedTask).length} datas marcadas
                </span>
              </div>
              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={() => setDetailCalMonth(new Date(year, month - 1, 1))}
                  className="p-1 rounded-lg bg-[#141416] border border-[#2c2c2e] text-[#facc15]"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold text-white">
                  {detailMonthNames[month]} {year}
                </span>
                <button
                  type="button"
                  onClick={() => setDetailCalMonth(new Date(year, month + 1, 1))}
                  className="p-1 rounded-lg bg-[#141416] border border-[#2c2c2e] text-[#facc15]"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[11px] text-neutral-400">
                Toque nos dias para marcar ou use <strong className="text-[#facc15]">Personalizado</strong> acima:
              </p>

              {/* Mini Month Grid */}
              <div className="pt-1">
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-neutral-500 font-bold uppercase mb-1">
                  {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => <span key={i}>{d}</span>)}
                </div>
                <div className="grid grid-cols-7 gap-1 text-center">
                  {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                    <div key={`empty-${i}`} className="h-7" />
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const dayNum = i + 1;
                    const mo = String(month + 1).padStart(2, '0');
                    const dy = String(dayNum).padStart(2, '0');
                    const dStr = `${year}-${mo}-${dy}`;
                    const isMarked = selectedTask.recurringDates && selectedTask.recurringDates.includes(dStr);

                    return (
                      <button
                        key={dStr}
                        type="button"
                        onClick={() => handleToggleDateInTask(dStr)}
                        className={`h-7 w-7 mx-auto rounded-full text-[11px] font-bold flex items-center justify-center transition-all ${
                          isMarked
                            ? 'bg-[#facc15] text-black font-bold shadow-md scale-105'
                            : 'text-neutral-300 hover:bg-[#28282e]'
                        }`}
                      >
                        {dayNum}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Custom Tags */}
            <div className="bg-[#1c1c1e] p-4 rounded-2xl border border-[#2c2c2e] space-y-2">
              <label className="text-xs text-neutral-400 font-medium flex items-center gap-1.5">
                <TagIcon className="w-4 h-4 text-neutral-400" />
                Etiquetas Personalizadas
              </label>
              <div className="flex flex-wrap gap-1.5">
                {(selectedTask.tags || []).map(tg => (
                  <span key={tg} className="text-xs bg-[#141416] text-[#facc15] px-2.5 py-1 rounded-lg border border-[#2c2c2e] flex items-center gap-1 font-semibold">
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
                  className="px-3 py-1.5 bg-[#facc15] hover:bg-[#eab308] text-black font-bold rounded-xl text-xs font-bold"
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
                    className={`py-2 text-xs rounded-xl border flex items-center justify-center gap-1 transition-colors min-w-0 ${
                      selectedTask.priority === p
                        ? 'bg-[#28282e] border-[#facc15] text-white font-bold shadow-sm'
                        : 'border-[#262629] bg-[#141416] text-neutral-400'
                    }`}
                  >
                    <Flag className={`w-3.5 h-3.5 ${priorityColors[p]} shrink-0`} />
                    <span className="truncate text-[11px]">{p === 0 ? 'Sem' : p === 1 ? 'Baixa' : p === 2 ? 'Média' : 'Alta'}</span>
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
                          sub.completed ? 'bg-[#facc15] border-[#facc15] text-black' : 'border-neutral-500'
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
              className="w-full py-3 bg-[#facc15] hover:bg-[#eab308] text-black font-bold rounded-2xl text-xs font-bold flex items-center justify-center gap-2 shadow-xl active:scale-98 transition-colors"
            >
              <Play className="w-4 h-4 fill-current" />
              Iniciar Pomodoro Nesta Tarefa
            </button>
          </div>
        </div>
      )}

      {/* Custom Multi-Date & Multi-Time Picker Modal */}
      <CustomDatePickerModal
        isOpen={isCustomDateModalOpen}
        onClose={() => setIsCustomDateModalOpen(false)}
        initialDates={selectedTask ? getTaskDates(selectedTask) : (quickDueDate ? [quickDueDate] : [todayStr])}
        initialDate={selectedTask?.dueDate || quickDueDate || todayStr}
        initialTimes={selectedTask ? getTaskTimes(selectedTask) : []}
        initialTime={selectedTask?.startTime || ''}
        initialMode={selectedTask?.recurrencePattern?.mode || 'monthly'}
        allowTaskSelection={!selectedTask && !quickTitle.trim()}
        initialTitle={quickTitle.trim()}
        tasks={state.tasks}
        projects={state.projects}
        onApplyCustomSchedule={handleApplyCustomFromTaskView}
        onSelectDates={handleMultipleDatesSelected}
      />

      {/* Touch-Friendly Time Picker Modal */}
      <TimePickerModal
        isOpen={isTimePickerOpen}
        onClose={() => {
          setIsTimePickerOpen(false);
          setEditingTimeSlot(null);
        }}
        initialTime={editingTimeSlot || selectedTask?.startTime || '09:00'}
        onSelectTime={(picked) => {
          if (selectedTask && picked) {
            const existing = getTaskTimes(selectedTask);
            const base = editingTimeSlot ? existing.filter(x => x !== editingTimeSlot) : existing;
            const nextTimes = [...new Set([...base, picked])].sort();
            updateTask(selectedTask.id, {
              recurringTimes: nextTimes,
              startTime: nextTimes[0] || ''
            });
          }
          setEditingTimeSlot(null);
        }}
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
