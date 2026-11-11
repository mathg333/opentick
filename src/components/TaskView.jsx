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
  SlidersHorizontal,
  Bell,
  BellOff,
  RotateCcw
} from 'lucide-react';
import CustomDatePickerModal from './CustomDatePickerModal';
import { getTaskTimes, getTaskDates, getTodayYMD } from '../utils/taskSchedule';
import EditListModal from './EditListModal';
import TimePickerModal from './TimePickerModal';
import SegmentedProgressCard from './SegmentedProgressCard';
import HomeHabitCard from './HomeHabitCard';
import { ObsidianSelect } from './ObsidianControls';

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
    moveTaskToTrash,
    restoreTask,
    emptyTrash,
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
  const [isCreatingListInline, setIsCreatingListInline] = useState(false);
  const [inlineListName, setInlineListName] = useState('');
  const [isAddingSubtaskInline, setIsAddingSubtaskInline] = useState(false);
  const [inlineSubtaskTitle, setInlineSubtaskTitle] = useState('');
  const [quickTitle, setQuickTitle] = useState('');
  const [quickDueDate, setQuickDueDate] = useState('');
  const [quickPriority, setQuickPriority] = useState(0);
  const [confirmEmptyTrash, setConfirmEmptyTrash] = useState(false);
  const [confirmPermanentDeleteId, setConfirmPermanentDeleteId] = useState(null);

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
  const activeTasks = (state.tasks || []).filter(t => !t.deleted);
  const trashedTasks = (state.tasks || []).filter(t => t.deleted);
  let filteredTasks = activeTasks;

  if (activeView === 'tasks-inbox') {
    viewTitle = 'Caixa de Entrada';
    filteredTasks = activeTasks.filter(t => t.projectId === 'inbox');
  } else if (activeView === 'tasks-today') {
    viewTitle = 'Hoje';
    filteredTasks = activeTasks.filter(t => {
      const matchDue = t.dueDate === todayStr;
      const matchRecur = t.recurringDates && t.recurringDates.includes(todayStr);
      const overdue = !t.completed && t.dueDate && t.dueDate < todayStr;
      return matchDue || matchRecur || overdue;
    });
  } else if (activeView === 'tasks-completed') {
    viewTitle = 'Concluído';
    filteredTasks = activeTasks.filter(t => t.completed);
  } else if (activeView === 'tasks-trash') {
    viewTitle = 'Lixeira';
    filteredTasks = trashedTasks;
  } else if (activeView.startsWith('project-')) {
    const projId = activeView.replace('project-', '');
    currentProject = state.projects.find(p => p.id === projId);
    viewTitle = currentProject ? currentProject.name : 'Lista';
    filteredTasks = activeTasks.filter(t => t.projectId === projId);
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

  const selectedTask = activeTasks.find(t => t.id === selectedTaskId);

  const priorityColors = {
    0: 'text-neutral-600',
    1: 'text-neutral-400',
    2: 'text-amber-400',
    3: 'text-rose-400 fill-rose-400'
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
    const hasExplicitTimes = Array.isArray(metaArg?.times);
    const times = hasExplicitTimes
      ? metaArg.times
      : (firstTimeArg ? [firstTimeArg] : (datesArg?.time ? [datesArg.time] : []));
    const pattern = metaArg?.pattern || null;
    const alarmPatch = metaArg?.alarmEnabled !== undefined ? { alarmEnabled: metaArg.alarmEnabled } : {};
    const offsetPatch = metaArg?.reminderOffset !== undefined ? { reminderOffset: metaArg.reminderOffset } : {};

    if (selectedTask) {
      const nextTimes = hasExplicitTimes
        ? metaArg.times
        : (times.length > 0 ? times : getTaskTimes(selectedTask));
      updateTask(selectedTask.id, {
        dueDate: dates[0] || '',
        recurringDates: dates,
        recurringTimes: nextTimes,
        startTime: nextTimes[0] || '',
        recurrencePattern: dates.length > 0 ? pattern : null,
        ...alarmPatch,
        ...offsetPatch
      });
    } else if (dates.length > 0) {
      let targetProj = 'inbox';
      if (activeView.startsWith('project-')) {
        targetProj = activeView.replace('project-', '');
      }
      addTasksForMultipleDates({
        title: quickTitle.trim() || 'Nova Tarefa Programada',
        projectId: targetProj,
        recurringTimes: times,
        startTime: times[0] || '',
        recurrencePattern: pattern,
        priority: 1,
        ...alarmPatch,
        ...offsetPatch
      }, dates);
      setQuickTitle('');
    }
  };

  const handleApplyCustomFromTaskView = ({ dates, times, pattern, taskAction, taskId, title, projectId, alarmEnabled, reminderOffset }) => {
    if (!dates || dates.length === 0) return;
    const alarmFields = {
      ...(alarmEnabled !== undefined ? { alarmEnabled } : {}),
      ...(reminderOffset !== undefined ? { reminderOffset } : {})
    };
    if (selectedTask) {
      updateTask(selectedTask.id, {
        dueDate: dates[0],
        recurringDates: dates,
        recurringTimes: times,
        startTime: times[0] || '',
        recurrencePattern: pattern,
        ...alarmFields
      });
      return;
    }
    if (taskAction === 'existing' && taskId) {
      updateTask(taskId, {
        dueDate: dates[0],
        recurringDates: dates,
        recurringTimes: times,
        startTime: times[0] || '',
        recurrencePattern: pattern,
        ...alarmFields
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
      priority: 1,
      ...alarmFields
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
        {/* Top Bar with Layout Switcher LEFT & Personalizado RIGHT */}
        {activeView !== 'tasks-trash' && (
          <div className="px-4 py-2 flex items-center justify-between gap-2 bg-[#000000] shrink-0 border-b border-[#1c1c1e]">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex items-center bg-[#111114] p-0.5 rounded-[5px] border border-white/10 shrink-0">
                <button
                  onClick={() => setViewLayout('list')}
                  className={`px-2.5 py-1 rounded-[4px] text-[11px] font-bold flex items-center gap-1.5 transition-all ${
                    viewLayout === 'list' ? 'bg-[#facc15]/15 text-[#facc15] border border-[#facc15]/45' : 'text-neutral-400 hover:text-white border border-transparent'
                  }`}
                  title="Visualização em Lista"
                >
                  <ListIcon className="w-3.5 h-3.5" />
                  <span>Lista</span>
                </button>
                <button
                  onClick={() => setViewLayout('kanban')}
                  className={`px-2.5 py-1 rounded-[4px] text-[11px] font-bold flex items-center gap-1.5 transition-all ${
                    viewLayout === 'kanban' ? 'bg-[#facc15]/15 text-[#facc15] border border-[#facc15]/45' : 'text-neutral-400 hover:text-white border border-transparent'
                  }`}
                  title="Visualização em Quadro Trello"
                >
                  <Kanban className="w-3.5 h-3.5" />
                  <span>Trello</span>
                </button>
              </div>

              {currentProject && (
                <button
                  onClick={() => setIsEditListModalOpen(true)}
                  className="p-1.5 text-neutral-300 hover:text-[#facc15] bg-[#141417] hover:bg-[#1e1e22] border border-white/10 rounded-[4px] active:scale-95 transition-all"
                  title="Renomear ou Editar Lista"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              onClick={() => setIsCustomDateModalOpen(true)}
              className="px-2.5 py-1.5 text-neutral-200 hover:text-[#facc15] bg-[#111114] hover:bg-[#1c1c20] border border-white/15 hover:border-[#facc15]/45 rounded-[4px] transition-all flex items-center gap-1.5 text-[11px] font-bold shrink-0 active:scale-95"
              title="Personalizado: Dias, Datas & Vários Horários"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#facc15]/80" />
              <span>Personalizado</span>
            </button>
          </div>
        )}

        {/* LAYOUT 1: LIST VIEW (Clean Minimalist Compact Layout) */}
        {(viewLayout === 'list' || activeView === 'tasks-trash') && (
          <div className="flex-1 overflow-y-auto px-5 md:px-6 pt-2 pb-32">
            <div className="max-w-lg mx-auto space-y-2.5">
              {activeView !== 'tasks-trash' && (
                <form
                  onSubmit={handleQuickAdd}
                  className="bg-[#141417] border border-[#26262a] rounded-[4px] px-2.5 py-1.5 flex items-center gap-2"
                >
                  <Plus className="w-3.5 h-3.5 text-neutral-400 shrink-0 ml-0.5" />
                  <input
                    type="text"
                    placeholder={`Adicionar em "${viewTitle}"...`}
                    value={quickTitle}
                    onChange={e => setQuickTitle(e.target.value)}
                    className="flex-1 min-w-0 bg-transparent text-xs text-white placeholder-neutral-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setIsCustomDateModalOpen(true)}
                    className="p-1 text-neutral-400 hover:text-[#facc15]"
                    title="Escolher datas múltiplas / horário"
                  >
                    <CalendarIcon className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="submit"
                    disabled={!quickTitle.trim()}
                    className="px-2.5 py-1 bg-[#facc15]/15 hover:bg-[#facc15]/25 disabled:opacity-30 text-[#facc15] border border-[#facc15]/40 text-[11px] font-bold rounded-[4px] shrink-0 transition-colors"
                  >
                    Salvar
                  </button>
                </form>
              )}

            {activeView === 'tasks-trash' ? (
              <div className="space-y-2.5">
                <div className="bg-[#141417] border border-[#26262a] rounded-[4px] px-3 py-2.5 flex items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xs font-bold text-white">Lixeira</h3>
                    <p className="text-[10px] text-neutral-400">{trashedTasks.length} item(ns) excluído(s)</p>
                  </div>
                  {trashedTasks.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        if (confirmEmptyTrash) {
                          emptyTrash();
                          setConfirmEmptyTrash(false);
                        } else {
                          setConfirmEmptyTrash(true);
                          setTimeout(() => setConfirmEmptyTrash(false), 3000);
                        }
                      }}
                      className={`px-2.5 py-1 rounded-[4px] border text-[11px] font-bold transition-colors ${
                        confirmEmptyTrash
                          ? 'bg-rose-500/20 border-rose-500/60 text-rose-300'
                          : 'bg-[#1c1c1e] border-white/10 text-neutral-300 hover:text-rose-400'
                      }`}
                    >
                      {confirmEmptyTrash ? 'Confirmar Esvaziar?' : 'Esvaziar Lixeira'}
                    </button>
                  )}
                </div>

                {trashedTasks.length === 0 ? (
                  <div className="py-8 bg-[#0f0f12] border border-[#222226] rounded-[4px] text-center text-xs text-neutral-500">
                    A lixeira está vazia.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {trashedTasks.map(task => (
                      <div
                        key={task.id}
                        className="bg-[#141417] border border-[#26262a] rounded-[4px] px-3 py-2 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-medium text-neutral-300 line-through truncate block">
                            {task.title}
                          </span>
                          {task.dueDate && (
                            <span className="text-[10px] text-neutral-500">{task.dueDate}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => restoreTask(task.id)}
                            className="px-2 py-1 rounded-[4px] bg-[#1c1c20] hover:bg-[#facc15]/15 border border-white/10 hover:border-[#facc15]/45 text-neutral-300 hover:text-[#facc15] text-[10px] font-bold flex items-center gap-1"
                            title="Restaurar tarefa"
                          >
                            <RotateCcw className="w-3 h-3" />
                            <span>Restaurar</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirmPermanentDeleteId === task.id) {
                                deleteTask(task.id);
                                setConfirmPermanentDeleteId(null);
                              } else {
                                setConfirmPermanentDeleteId(task.id);
                                setTimeout(() => setConfirmPermanentDeleteId(null), 3000);
                              }
                            }}
                            className={`px-2 py-1 rounded-[4px] border text-[10px] font-bold ${
                              confirmPermanentDeleteId === task.id
                                ? 'bg-rose-500/20 border-rose-500/60 text-rose-300'
                                : 'bg-[#1c1c20] border-white/10 text-neutral-400 hover:text-rose-400'
                            }`}
                          >
                            {confirmPermanentDeleteId === task.id ? 'Confirmar' : 'Apagar'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : activeView === 'tasks-today' ? (
              <div className="space-y-3">
                {/* 1. Extended Segmented Progress Meter Bar Card */}
                <SegmentedProgressCard store={store} />

                {/* 2. Tasks for Today */}
                {todayTasks.length === 0 ? (
                  <div className="py-5 bg-[#0f0f12] border border-[#222226] rounded-[4px] flex flex-col items-center justify-center text-center px-4">
                    <div className="w-9 h-9 rounded-[4px] bg-[#18181c] border border-[#282830] flex items-center justify-center mb-2 text-base">
                      ☀️
                    </div>
                    <h3 className="text-xs font-bold text-white mb-0.5">Nenhuma tarefa pendente para hoje</h3>
                    <p className="text-[11px] text-neutral-400 max-w-xs mb-2.5">
                      Adicione uma tarefa acima ou escolha datas no calendário.
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsCustomDateModalOpen(true)}
                      className="px-3 py-1.5 bg-[#18181c] hover:bg-[#facc15]/15 border border-[#facc15]/45 text-[#facc15] font-bold text-[11px] rounded-[4px] flex items-center gap-1.5"
                    >
                      <CalendarIcon className="w-3.5 h-3.5" />
                      <span>Agendar no Calendário</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {todayTasks.map(task => {
                      const recurCount = task.recurringDates ? task.recurringDates.length : 0;
                      const timesList = getTaskTimes(task);
                      return (
                        <div
                          key={task.id}
                          onClick={() => setSelectedTaskId(task.id)}
                          className="bg-[#141417] hover:bg-[#1a1a1e] border border-[#26262a] rounded-[4px] px-3 py-2 flex items-center justify-between gap-2.5 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2.5 flex-1 min-w-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleTaskCompleted(task.id);
                              }}
                              className={`w-4 h-4 rounded-[3px] border flex items-center justify-center transition-colors shrink-0 ${
                                task.completed ? 'bg-[#facc15]/20 border-[#facc15] text-[#facc15]' : 'border-neutral-500 hover:border-neutral-300'
                              }`}
                            >
                              {task.completed && <Check className="w-3 h-3 stroke-[3]" />}
                            </button>
                            <div className="flex-1 min-w-0">
                              <span className="text-[13px] font-medium text-neutral-100 truncate block">
                                {task.title}
                              </span>
                              {(timesList.length > 0 || recurCount > 1) && (
                                <div className="flex items-center flex-wrap gap-1.5 mt-0.5">
                                  {timesList.length > 0 && (
                                    <span className="text-[11px] text-neutral-300 flex items-center gap-1 font-medium">
                                      <Clock className="w-3 h-3 text-[#facc15]/80" />
                                      {timesList.join(', ')}
                                    </span>
                                  )}
                                  {recurCount > 1 && (
                                    <span className="text-[10px] bg-white/5 text-neutral-400 font-medium px-1.5 py-0.5 rounded-[3px] border border-white/10 flex items-center gap-1">
                                      <Repeat className="w-2.5 h-2.5 text-neutral-400" />
                                      {recurCount} datas
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            {task.priority > 0 && (
                              <Flag className={`w-3.5 h-3.5 ${priorityColors[task.priority]} shrink-0`} />
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onStartPomodoroForTask(task);
                              }}
                              className="p-1 text-neutral-500 hover:text-[#facc15] rounded-[3px] transition-colors"
                              title="Iniciar Foco"
                            >
                              <Play className="w-3.5 h-3.5" />
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
                            className="bg-[#131316] border border-[#242429] rounded-[4px] px-3 py-2 flex items-center justify-between gap-3 cursor-pointer"
                          >
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleTaskCompleted(task.id);
                                }}
                                className="w-4 h-4 rounded-[3px] bg-[#facc15]/20 border border-[#facc15] flex items-center justify-center shrink-0"
                              >
                                <Check className="w-2.5 h-2.5 text-[#facc15] stroke-[3]" />
                              </button>
                              <span className="text-xs text-neutral-400 line-through truncate">
                                {task.title}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                moveTaskToTrash(task.id);
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
                  <div className="bg-[#141417] rounded-[6px] p-3 border border-[#26262a]">
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
                                className="w-4 h-4 rounded-[3px] border border-neutral-500 hover:border-neutral-300 flex items-center justify-center transition-colors shrink-0"
                              >
                                {task.completed && <Check className="w-3 h-3 text-[#facc15] stroke-[3]" />}
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
                {/* Section: Hoje & Atrasadas (Inbox & Listas Personalizadas) */}
                {todayTasks.length > 0 && (
                  <div className="bg-[#141417] rounded-[6px] p-3 border border-[#26262a]">
                    <div
                      onClick={() => toggleSection('today')}
                      className="flex items-center justify-between cursor-pointer select-none pb-1.5"
                    >
                      <span className="text-xs font-bold text-white uppercase tracking-wider">Hoje & Atrasadas</span>
                      <div className="flex items-center gap-1 text-xs text-neutral-400">
                        <span className="font-mono">{todayTasks.length}</span>
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${collapsedSections.today ? '-rotate-90' : ''}`} />
                      </div>
                    </div>

                    {!collapsedSections.today && (
                      <div className="space-y-1.5 pt-1.5">
                        {todayTasks.map(task => {
                          const recurCount = task.recurringDates ? task.recurringDates.length : 0;
                          const timesList = getTaskTimes(task);
                          return (
                            <div
                              key={task.id}
                              onClick={() => setSelectedTaskId(task.id)}
                              className="bg-[#101013] hover:bg-[#19191d] border border-[#242429] rounded-[4px] px-2.5 py-2 flex items-center justify-between gap-2 cursor-pointer"
                            >
                              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleTaskCompleted(task.id);
                                  }}
                                  className="w-4 h-4 rounded-[3px] border border-neutral-500 hover:border-neutral-300 flex items-center justify-center transition-colors shrink-0"
                                >
                                  {task.completed && <Check className="w-3 h-3 text-[#facc15] stroke-[3]" />}
                                </button>
                                <div className="flex-1 min-w-0">
                                  <span className="text-xs font-medium text-neutral-100 truncate block">
                                    {task.title}
                                  </span>
                                  {(task.dueDate || timesList.length > 0 || recurCount > 1) && (
                                    <div className="flex items-center flex-wrap gap-1.5 mt-0.5">
                                      {(task.dueDate || timesList.length > 0) && (
                                        <span className={`text-[10px] ${task.dueDate && task.dueDate < todayStr ? 'text-rose-400' : 'text-neutral-400'}`}>
                                          {task.dueDate || 'Hoje'}{timesList.length > 0 ? ` às ${timesList.join(', ')}` : ''}
                                        </span>
                                      )}
                                      {recurCount > 1 && (
                                        <span className="text-[10px] bg-white/5 text-neutral-400 px-1.5 py-0.5 rounded-[3px] border border-white/10 flex items-center gap-1">
                                          <Repeat className="w-2.5 h-2.5" />
                                          {recurCount} datas
                                        </span>
                                      )}
                                    </div>
                                  )}
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

                {upcomingTasks.length > 0 && (
                  <div className="bg-[#141417] rounded-[6px] p-3 border border-[#26262a]">
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
                                  className="w-4 h-4 rounded-[3px] border border-neutral-500 hover:border-neutral-300 flex items-center justify-center transition-colors shrink-0"
                                >
                                  {task.completed && <Check className="w-3 h-3 text-[#facc15] stroke-[3]" />}
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
                  <div className="bg-[#141417] rounded-[6px] p-3 border border-[#26262a]">
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
                                className="mt-0.5 w-4 h-4 rounded-[3px] bg-[#facc15]/20 border border-[#facc15] flex items-center justify-center transition-colors shrink-0"
                              >
                                <Check className="w-2.5 h-2.5 text-[#facc15] stroke-[3]" />
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
                                moveTaskToTrash(task.id);
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
          </div>
        )}

        {/* LAYOUT 2: KANBAN / TRELLO VIEW */}
        {viewLayout === 'kanban' && activeView !== 'tasks-trash' && (
          <div className="flex-1 overflow-x-auto p-4 flex gap-4 pb-32">
            {[
              { id: 'todo', label: 'A Fazer', color: 'border-[#facc15]/30', badge: 'bg-[#facc15]/15 text-[#facc15] border border-[#facc15]/30', tasks: kanbanTodo },
              { id: 'in_progress', label: 'Em Andamento', color: 'border-[#facc15]/30', badge: 'bg-[#facc15]/15 text-[#facc15] border border-[#facc15]/30', tasks: kanbanInProgress },
              { id: 'done', label: 'Concluído', color: 'border-[#facc15]/30', badge: 'bg-[#facc15]/15 text-[#facc15] border border-[#facc15]/30', tasks: kanbanDone }
            ].map(col => (
              <div 
                key={col.id} 
                className="w-72 shrink-0 bg-[#1c1c1e] rounded-[6px] border border-[#2c2c2e] flex flex-col overflow-hidden "
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
                      className="bg-[#141416] hover:bg-[#202024] border border-[#28282b] rounded-[4px] p-3 cursor-pointer space-y-2 shadow-sm transition-all"
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
                        <div className="min-w-[112px]">
                          <ObsidianSelect
                            compact
                            title="Status no Quadro"
                            value={task.kanbanStatus || 'todo'}
                            onChange={(val) => updateTask(task.id, { kanbanStatus: val })}
                            options={[
                              { value: 'todo', label: 'A Fazer' },
                              { value: 'in_progress', label: 'Em Andamento' },
                              { value: 'done', label: 'Concluído' }
                            ]}
                          />
                        </div>
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
              className="flex items-center gap-1.5 text-xs text-neutral-300 hover:text-white px-2.5 py-1.5 rounded-[4px] bg-[#1c1c1e] border border-[#2c2c2e]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar</span>
            </button>
            <span className="text-xs font-bold text-neutral-400">
              Detalhes da Tarefa
            </span>
            <button
              onClick={() => moveTaskToTrash(selectedTask.id)}
              className="text-neutral-400 hover:text-rose-400 p-1.5 rounded-lg"
              title="Excluir"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-5 pb-28 md:pb-8">
            {/* Title & Checkbox */}
            <div className="bg-[#161619] p-3.5 rounded-[4px] border border-[#26262a] flex items-start gap-3">
              <button
                type="button"
                onClick={() => toggleTaskCompleted(selectedTask.id)}
                className={`mt-1 w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                  selectedTask.completed ? 'bg-[#facc15]/20 border-[#facc15] text-[#facc15]' : 'border-neutral-500'
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

            {/* List / Category Selector - Custom Obsidian Select + Inline List Creation */}
            <div className="bg-[#161619] p-3.5 rounded-[4px] border border-[#26262a] space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs text-neutral-400 font-medium">Lista / Categoria</label>
                <button
                  type="button"
                  onClick={() => {
                    setInlineListName('');
                    setIsCreatingListInline((p) => !p);
                  }}
                  className="text-xs text-[#facc15] hover:text-[#eab308] font-bold flex items-center gap-1 active:scale-95 transition-transform"
                >
                  + Nova Lista
                </button>
              </div>

              {isCreatingListInline && (
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    autoFocus
                    placeholder="Nome da nova lista..."
                    value={inlineListName}
                    onChange={(e) => setInlineListName(e.target.value)}
                    className="flex-1 bg-[#0A0A0C] border border-[#facc15]/40 rounded-[4px] px-3 py-2 text-xs text-white placeholder-neutral-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (inlineListName.trim()) {
                        const newProj = addProject({ name: inlineListName.trim(), color: '#facc15' });
                        updateTask(selectedTask.id, { projectId: newProj.id });
                      }
                      setInlineListName('');
                      setIsCreatingListInline(false);
                    }}
                    className="px-3 py-2 rounded-[4px] bg-[#facc15]/15 border border-[#facc15]/45 text-[#facc15] text-xs font-bold shrink-0"
                  >
                    Criar
                  </button>
                </div>
              )}

              <ObsidianSelect
                title="Escolher Lista / Categoria"
                value={selectedTask.projectId || 'inbox'}
                onChange={(val) => updateTask(selectedTask.id, { projectId: val })}
                options={state.projects.map(p => ({ value: p.id, label: p.name }))}
              />
            </div>

            {/* Description Notes */}
            <div className="bg-[#161619] p-3.5 rounded-[4px] border border-[#26262a] space-y-1.5">
              <label className="text-xs text-neutral-400 font-medium">Notas / Descrição</label>
              <textarea
                rows={3}
                placeholder="Adicione anotações, links ou detalhes..."
                value={selectedTask.description || ''}
                onChange={(e) => updateTask(selectedTask.id, { description: e.target.value })}
                className="w-full bg-[#141416] border border-[#2c2c2e] rounded-[4px] p-3 text-xs text-white placeholder-neutral-500 focus:outline-none"
              />
            </div>

            {/* Date & Multiple Times Picker + Personalizado Button */}
            <div className="bg-[#161619] p-3.5 rounded-[4px] border border-[#26262a] space-y-3">
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
                    className="px-2.5 py-1 rounded-[4px] bg-[#18181c] hover:bg-[#facc15]/15 border border-[#facc15]/45 text-[#facc15] text-[11px] font-bold flex items-center gap-1 shadow-sm"
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
                    className="bg-[#facc15]/15 hover:bg-[#facc15]/25 border border-[#facc15]/40 rounded-[4px] px-2.5 py-1 text-[11px] text-[#facc15] font-bold flex items-center gap-1"
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
            <div className="bg-[#161619] p-3.5 rounded-[4px] border border-[#26262a] space-y-2">
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
                            ? 'bg-[#facc15] text-black font-bold  scale-105'
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
            <div className="bg-[#161619] p-3.5 rounded-[4px] border border-[#26262a] space-y-2">
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
                  className="flex-1 bg-[#141416] border border-[#2c2c2e] rounded-[4px] px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none"
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
                  className="px-3 py-1.5 bg-[#facc15]/15 hover:bg-[#facc15]/25 border border-[#facc15]/45 text-[#facc15] rounded-[4px] text-xs font-bold"
                >
                  +
                </button>
              </div>
            </div>

            {/* Alarme & Lembrete por Tarefa */}
            <div className="bg-[#161619] p-3.5 rounded-[4px] border border-[#26262a] space-y-2">
              <div className="flex items-center justify-between gap-2">
                <label className="text-xs text-neutral-400 font-medium flex items-center gap-1.5">
                  {selectedTask.alarmEnabled !== false ? (
                    <Bell className="w-3.5 h-3.5 text-[#facc15]" />
                  ) : (
                    <BellOff className="w-3.5 h-3.5 text-neutral-500" />
                  )}
                  Alarme &amp; Lembrete
                </label>
                <button
                  type="button"
                  onClick={() => updateTask(selectedTask.id, { alarmEnabled: selectedTask.alarmEnabled === false })}
                  className={`px-2.5 py-1 rounded-[4px] border text-[11px] font-bold transition-colors ${
                    selectedTask.alarmEnabled !== false
                      ? 'bg-[#facc15]/15 border-[#facc15]/50 text-[#facc15]'
                      : 'bg-[#111114] border-white/10 text-neutral-400'
                  }`}
                >
                  {selectedTask.alarmEnabled !== false ? 'Ativado' : 'Desativado'}
                </button>
              </div>
              {selectedTask.alarmEnabled !== false && (
                <div className="flex items-center gap-1 flex-wrap pt-1">
                  {[
                    { val: 0, label: 'Na hora' },
                    { val: 5, label: '5m antes' },
                    { val: 10, label: '10m antes' },
                    { val: 15, label: '15m antes' },
                    { val: 30, label: '30m antes' }
                  ].map(opt => {
                    const isActive = (selectedTask.reminderOffset ?? 0) === opt.val;
                    return (
                      <button
                        key={opt.val}
                        type="button"
                        onClick={() => updateTask(selectedTask.id, { reminderOffset: opt.val })}
                        className={`px-2 py-1 rounded-[4px] border text-[10px] font-bold transition-colors ${
                          isActive
                            ? 'bg-[#facc15]/15 border-[#facc15]/50 text-[#facc15]'
                            : 'bg-[#111114] border-white/10 text-neutral-400 hover:text-white'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Priority */}
            <div className="bg-[#161619] p-3.5 rounded-[4px] border border-[#26262a] space-y-2">
              <label className="text-xs text-neutral-400 font-medium">Prioridade</label>
              <div className="grid grid-cols-4 gap-1.5">
                {[0, 1, 2, 3].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => updateTask(selectedTask.id, { priority: p })}
                    className={`py-2 text-xs rounded-[4px] border flex items-center justify-center gap-1 transition-colors min-w-0 ${
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
            <div className="bg-[#161619] p-3.5 rounded-[4px] border border-[#26262a] space-y-2">
              <label className="text-xs text-neutral-400 font-medium flex items-center gap-1.5">
                <ListTree className="w-4 h-4 text-neutral-400" />
                Subtarefas
              </label>

              <div className="space-y-2">
                {(selectedTask.subtasks || []).map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between gap-2 p-2 bg-[#141416] rounded-[4px] border border-[#262629]">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <button
                        onClick={() => toggleSubtask(selectedTask.id, sub.id)}
                        className={`w-4 h-4 rounded border flex items-center justify-center ${
                          sub.completed ? 'bg-[#facc15]/20 border-[#facc15] text-[#facc15]' : 'border-neutral-500'
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

                {isAddingSubtaskInline ? (
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      autoFocus
                      placeholder="Título da subtarefa..."
                      value={inlineSubtaskTitle}
                      onChange={(e) => setInlineSubtaskTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && inlineSubtaskTitle.trim()) {
                          e.preventDefault();
                          addSubtask(selectedTask.id, inlineSubtaskTitle.trim());
                          setInlineSubtaskTitle('');
                          setIsAddingSubtaskInline(false);
                        }
                      }}
                      className="flex-1 bg-[#0A0A0C] border border-[#facc15]/45 rounded-[4px] px-3 py-2 text-xs text-white placeholder-neutral-500 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (inlineSubtaskTitle.trim()) {
                          addSubtask(selectedTask.id, inlineSubtaskTitle.trim());
                        }
                        setInlineSubtaskTitle('');
                        setIsAddingSubtaskInline(false);
                      }}
                      className="px-3 py-2 rounded-[4px] bg-[#facc15]/15 border border-[#facc15]/45 text-[#facc15] text-xs font-bold shrink-0"
                    >
                      Salvar
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setInlineSubtaskTitle('');
                      setIsAddingSubtaskInline(true);
                    }}
                    className="w-full py-2 bg-[#141416] hover:bg-[#222226] text-neutral-300 rounded-[4px] text-xs flex items-center justify-center gap-1.5 border border-[#262629]"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#facc15]" />
                    <span>Adicionar subtarefa</span>
                  </button>
                )}
              </div>
            </div>

            {/* Pomodoro Focus Action */}
            <button
              type="button"
              onClick={() => {
                setSelectedTaskId(null);
                onStartPomodoroForTask(selectedTask);
              }}
              className="w-full py-2.5 bg-[#facc15]/15 hover:bg-[#facc15]/25 border border-[#facc15]/50 text-[#facc15] font-bold rounded-[4px] text-xs font-bold flex items-center justify-center gap-2  active:scale-98 transition-colors"
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
        initialAlarmEnabled={selectedTask?.alarmEnabled !== false}
        initialReminderOffset={selectedTask?.reminderOffset ?? 0}
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
