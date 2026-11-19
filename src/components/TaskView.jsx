import React, { useState, useEffect } from 'react';
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
  Edit3,
  Eye,
  Tag as TagIcon,
  Repeat,
  SlidersHorizontal,
  Bell,
  BellOff,
  RotateCcw,
  Folder,
  AlignLeft
} from 'lucide-react';
import CustomDatePickerModal from './CustomDatePickerModal';
import { getTaskTimes, getTaskDates, getTodayYMD } from '../utils/taskSchedule';
import EditListModal from './EditListModal';
import TimePickerModal from './TimePickerModal';
import SegmentedProgressCard from './SegmentedProgressCard';
import HomeHabitCard from './HomeHabitCard';
import { ObsidianSelect } from './ObsidianControls';

// WhatsApp-style inline formatter: *bold*, _italic_, ~strikethrough~, ```code```
function parseWhatsAppInline(text) {
  if (!text) return null;
  const tokenRegex = /(```[\s\S]*?```|\*[^*\n]+\*|_[^_\n]+_|~[^~\n]+~)/g;
  const parts = text.split(tokenRegex);
  return parts.map((part, idx) => {
    if (!part) return null;
    if (part.startsWith('```') && part.endsWith('```')) {
      return (
        <code key={idx} className="font-mono text-xs bg-white/10 px-1.5 py-0.5 rounded text-neutral-200">
          {part.slice(3, -3)}
        </code>
      );
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <strong key={idx} className="font-bold text-white">
          {parseWhatsAppInline(part.slice(1, -1))}
        </strong>
      );
    }
    if (part.startsWith('_') && part.endsWith('_') && part.length > 2) {
      return (
        <em key={idx} className="italic text-neutral-200">
          {parseWhatsAppInline(part.slice(1, -1))}
        </em>
      );
    }
    if (part.startsWith('~') && part.endsWith('~') && part.length > 2) {
      return (
        <del key={idx} className="line-through text-neutral-400">
          {parseWhatsAppInline(part.slice(1, -1))}
        </del>
      );
    }
    return <span key={idx}>{part}</span>;
  });
}

// WhatsApp-style line renderer: [ ] checklist, - / * bullets, 1. numbered lists
function renderWhatsAppFormatted(fullText, onToggleCheck) {
  if (!fullText) return null;
  const lines = fullText.split('\n');
  return lines.map((line, lIdx) => {
    // Checklist [ ] or [x]
    const checkMatch = line.match(/^(\s*)\[([ xX])\]\s*(.*)$/);
    if (checkMatch) {
      const isChecked = checkMatch[2].toLowerCase() === 'x';
      const content = checkMatch[3];
      return (
        <div
          key={lIdx}
          onClick={(e) => {
            if (onToggleCheck) {
              e.stopPropagation();
              onToggleCheck(lIdx, !isChecked);
            }
          }}
          className="flex items-start gap-2.5 my-1.5 cursor-pointer group"
        >
          <div className={`w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
            isChecked ? 'bg-white/20 border-white/40 text-white' : 'border-neutral-500 group-hover:border-neutral-300'
          }`}>
            {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
          </div>
          <span className={`text-sm sm:text-base leading-relaxed ${isChecked ? 'line-through text-neutral-400' : 'text-neutral-100'}`}>
            {parseWhatsAppInline(content)}
          </span>
        </div>
      );
    }

    // Bullet point: - item or * item
    const bulletMatch = line.match(/^(\s*)[-*]\s+(.*)$/);
    if (bulletMatch) {
      const content = bulletMatch[2];
      return (
        <div key={lIdx} className="flex items-start gap-2.5 my-1.5 pl-1">
          <span className="text-white text-base leading-none select-none shrink-0 mt-0.5">•</span>
          <span className="text-sm sm:text-base leading-relaxed text-neutral-100">
            {parseWhatsAppInline(content)}
          </span>
        </div>
      );
    }

    // Numbered list: 1. item
    const numMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/);
    if (numMatch) {
      const num = numMatch[2];
      const content = numMatch[3];
      return (
        <div key={lIdx} className="flex items-start gap-2.5 my-1.5 pl-1">
          <span className="text-neutral-400 font-mono text-xs select-none shrink-0 mt-1">{num}.</span>
          <span className="text-sm sm:text-base leading-relaxed text-neutral-100">
            {parseWhatsAppInline(content)}
          </span>
        </div>
      );
    }

    // Empty line
    if (!line.trim()) {
      return <div key={lIdx} className="h-3" />;
    }

    // Normal paragraph line
    return (
      <p key={lIdx} className="text-sm sm:text-base leading-relaxed text-neutral-100 my-0.5 min-h-[1.25rem]">
        {parseWhatsAppInline(line)}
      </p>
    );
  });
}

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
  const [isEditingNotes, setIsEditingNotes] = useState(false);

  useEffect(() => {
    if (selectedTaskId) {
      const task = (state.tasks || []).find(t => t.id === selectedTaskId);
      setIsEditingNotes(!task?.description?.trim());
    }
  }, [selectedTaskId]);

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
      const hasMultiDates = Array.isArray(t.recurringDates) && t.recurringDates.length > 1;
      const matchDue = t.dueDate === todayStr;
      const matchRecur = t.recurringDates && t.recurringDates.includes(todayStr);
      const overdue = !hasMultiDates && !t.completed && t.dueDate && t.dueDate < todayStr;
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
    const hasMultiDates = Array.isArray(t.recurringDates) && t.recurringDates.length > 1;
    const isToday = t.dueDate === todayStr || (t.recurringDates && t.recurringDates.includes(todayStr));
    const isOverdue = !hasMultiDates && t.dueDate && t.dueDate < todayStr;
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
    2: 'text-neutral-200',
    3: 'text-white'
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
                    viewLayout === 'list' ? 'bg-white/10 text-white border border-white/20' : 'text-neutral-400 hover:text-white border border-transparent'
                  }`}
                  title="Visualização em Lista"
                >
                  <ListIcon className="w-3.5 h-3.5" />
                  <span>Lista</span>
                </button>
                <button
                  onClick={() => setViewLayout('kanban')}
                  className={`px-2.5 py-1 rounded-[4px] text-[11px] font-bold flex items-center gap-1.5 transition-all ${
                    viewLayout === 'kanban' ? 'bg-white/10 text-white border border-white/20' : 'text-neutral-400 hover:text-white border border-transparent'
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
                  className="p-1.5 text-neutral-300 hover:text-white bg-[#141417] hover:bg-[#1e1e22] border border-white/10 rounded-[4px] active:scale-95 transition-all"
                  title="Renomear ou Editar Lista"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              onClick={() => setIsCustomDateModalOpen(true)}
              className="px-2.5 py-1.5 text-neutral-200 hover:text-white bg-[#141417] hover:bg-[#1c1c20] border border-white/15 hover:border-white/30 rounded-[4px] transition-all flex items-center gap-1.5 text-[11px] font-bold shrink-0 active:scale-95"
              title="Personalizado: Dias, Datas & Vários Horários"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-neutral-400" />
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
                  className="bg-[#141417] border border-[#2a2a30] hover:border-[#383842] focus-within:border-white/30 rounded-xl px-3.5 py-2.5 sm:py-3 flex items-center gap-3 shadow-sm transition-all"
                >
                  <Plus className="w-5 h-5 text-neutral-400 shrink-0 ml-0.5" />
                  <input
                    type="text"
                    placeholder={`Adicionar em "${viewTitle}"...`}
                    value={quickTitle}
                    onChange={e => setQuickTitle(e.target.value)}
                    className="flex-1 min-w-0 bg-transparent text-sm sm:text-base text-white placeholder-neutral-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setIsCustomDateModalOpen(true)}
                    className="p-1.5 text-neutral-400 hover:text-white rounded-lg transition-colors"
                    title="Escolher datas múltiplas / horário"
                  >
                    <CalendarIcon className="w-4 h-4" />
                  </button>
                  <button
                    type="submit"
                    disabled={!quickTitle.trim()}
                    className="px-3.5 py-1.5 bg-white hover:bg-neutral-200 disabled:opacity-30 text-black text-xs sm:text-sm font-semibold rounded-lg shrink-0 transition-colors shadow-xs"
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
                            className="px-2 py-1 rounded-[4px] bg-[#1c1c20] hover:bg-white/10 border border-white/10 hover:border-white/30 text-neutral-300 hover:text-white text-[10px] font-semibold flex items-center gap-1"
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
                      className="px-3 py-1.5 bg-[#18181c] hover:bg-white/10 border border-white/20 text-white font-semibold text-[11px] rounded-[4px] flex items-center gap-1.5"
                    >
                      <CalendarIcon className="w-3.5 h-3.5" />
                      <span>Agendar no Calendário</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {todayTasks.map(task => {
                      const recurCount = task.recurringDates ? task.recurringDates.length : 0;
                      const timesList = getTaskTimes(task);
                      return (
                        <div
                          key={task.id}
                          onClick={() => setSelectedTaskId(task.id)}
                          className="bg-[#141417] hover:bg-[#1a1a1e] border border-[#26262a] rounded-xl px-3.5 py-3 sm:px-4 sm:py-3.5 flex items-center justify-between gap-3 cursor-pointer transition-all shadow-xs"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleTaskCompleted(task.id);
                              }}
                              className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors shrink-0 ${
                                task.completed ? 'bg-white/15 border-white/40 text-white' : 'border-neutral-500 hover:border-neutral-300'
                              }`}
                            >
                              {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                            </button>
                            <div className="flex-1 min-w-0">
                              <span className="text-sm sm:text-base font-medium text-neutral-100 truncate block">
                                {task.title}
                              </span>
                              {(timesList.length > 0 || recurCount > 1) && (
                                <div className="flex items-center flex-wrap gap-2 mt-1">
                                  {timesList.length > 0 && (
                                    <span className="text-xs text-neutral-300 flex items-center gap-1.5 font-medium px-2 py-0.5 rounded-md bg-white/5 border border-white/10">
                                      <Clock className="w-3.5 h-3.5 text-neutral-400" />
                                      {timesList.join(', ')}
                                    </span>
                                  )}
                                  {recurCount > 1 && (
                                    <span className="text-xs bg-white/5 text-neutral-300 font-medium px-2 py-0.5 rounded-md border border-white/10 flex items-center gap-1.5">
                                      <Repeat className="w-3 h-3 text-neutral-400" />
                                      {recurCount} datas
                                    </span>
                                  )}
                                </div>
                              )}
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
                              className="p-1.5 text-neutral-400 hover:text-white rounded-md transition-colors"
                              title="Iniciar Foco"
                            >
                              <Play className="w-4 h-4" />
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
                                className="w-4 h-4 rounded-[3px] bg-white/20 border border-white flex items-center justify-center shrink-0"
                              >
                                <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
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
                                {task.completed && <Check className="w-3 h-3 text-white stroke-[3]" />}
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
                              className="bg-[#101013] hover:bg-[#19191d] border border-[#242429] rounded-xl px-3.5 py-3 flex items-center justify-between gap-3 cursor-pointer shadow-xs transition-colors"
                            >
                              <div className="flex items-center gap-3 flex-1 min-w-0">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleTaskCompleted(task.id);
                                  }}
                                  className="w-5 h-5 rounded-md border-2 border-neutral-500 hover:border-neutral-300 flex items-center justify-center transition-colors shrink-0"
                                >
                                  {task.completed && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                                </button>
                                <div className="flex-1 min-w-0">
                                  <span className="text-sm sm:text-base font-medium text-neutral-100 truncate block">
                                    {task.title}
                                  </span>
                                  {(task.dueDate || timesList.length > 0 || recurCount > 1) && (
                                    <div className="flex items-center flex-wrap gap-2 mt-1">
                                      {(task.dueDate || timesList.length > 0) && (
                                        <span className={`text-xs ${task.dueDate && task.dueDate < todayStr ? 'text-rose-400' : 'text-neutral-300'} font-medium`}>
                                          {task.dueDate || 'Hoje'}{timesList.length > 0 ? ` às ${timesList.join(', ')}` : ''}
                                        </span>
                                      )}
                                      {recurCount > 1 && (
                                        <span className="text-xs bg-white/5 text-neutral-300 px-2 py-0.5 rounded-md border border-white/10 flex items-center gap-1.5 font-medium">
                                          <Repeat className="w-3 h-3" />
                                          {recurCount} datas
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                              {task.priority > 0 && (
                                <Flag className={`w-4 h-4 ${priorityColors[task.priority]} shrink-0`} />
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
                                  className="w-5 h-5 rounded-md border-2 border-neutral-500 hover:border-neutral-300 flex items-center justify-center transition-colors shrink-0"
                                >
                                  {task.completed && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
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
                                      <span className="text-xs bg-white/5 text-neutral-300 font-medium px-2 py-0.5 rounded-md border border-white/10 flex items-center gap-1.5">
                                        <Repeat className="w-3 h-3 text-neutral-400" />
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
                  <div className="bg-[#141417] rounded-xl p-3.5 border border-[#26262a]">
                    <div 
                      onClick={() => toggleSection('completed')}
                      className="flex items-center justify-between cursor-pointer select-none pb-2"
                    >
                      <span className="text-sm font-bold text-neutral-300">Concluído e Não Farei</span>
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
                                className="mt-0.5 w-5 h-5 rounded-md bg-white/10 border border-white/30 flex items-center justify-center transition-colors shrink-0"
                              >
                                <Check className="w-3 h-3 text-white stroke-[3]" />
                              </button>
                              <div className="flex-1 min-w-0">
                                <span className="text-xs font-medium text-neutral-300 block truncate line-through">
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
              { id: 'todo', label: 'A Fazer', color: 'border-white/20', badge: 'bg-white/10 text-white border border-white/20', tasks: kanbanTodo },
              { id: 'in_progress', label: 'Em Andamento', color: 'border-white/20', badge: 'bg-white/10 text-white border border-white/20', tasks: kanbanInProgress },
              { id: 'done', label: 'Concluído', color: 'border-white/20', badge: 'bg-white/10 text-white border border-white/20', tasks: kanbanDone }
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
                          <CalendarIcon className="w-3 h-3 text-neutral-400" />
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
      {selectedTask && (() => {
        const selectedTaskProject = state.projects.find(p => p.id === selectedTask.projectId);
        const hasCategory = Boolean(selectedTaskProject && selectedTaskProject.id !== 'inbox' && selectedTaskProject.id !== 'none' && selectedTaskProject.id !== '');
        const taskTimes = getTaskTimes(selectedTask);
        const timeDisplay = taskTimes.length > 0 ? taskTimes.join(', ') : 'Sem horário';

        const formatTaskDateInfo = () => {
          if (Array.isArray(selectedTask.recurringDates) && selectedTask.recurringDates.length > 1) {
            const sorted = [...selectedTask.recurringDates].sort();
            const first = sorted[0];
            const [y, m, d] = first.split('-');
            return `${d}/${m}/${y} (+${selectedTask.recurringDates.length - 1} datas)`;
          }
          const dateStr = selectedTask.dueDate;
          if (!dateStr) return 'Sem data definida';
          const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
          const [y, m, d] = dateStr.split('-');
          const monthName = months[parseInt(m, 10) - 1] || m;
          if (dateStr === todayStr) {
            return `Hoje, ${parseInt(d, 10)} de ${monthName}`;
          }
          return `${parseInt(d, 10)} de ${monthName} de ${y}`;
        };

        return (
          <div className="fixed inset-0 z-50 md:static md:w-96 md:z-auto bg-[#000000] border-l border-[#1c1c1e] flex flex-col h-full overflow-hidden shadow-2xl">
            <div className="p-3.5 border-b border-[#1c1c1e] flex items-center justify-between bg-[#111114] gap-2">
              <button
                onClick={() => setSelectedTaskId(null)}
                className="flex items-center gap-1.5 text-xs text-neutral-300 hover:text-white px-2.5 py-1.5 rounded-lg bg-[#1a1a1f] border border-[#2a2a32] active:scale-95 transition-all shrink-0"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Voltar</span>
              </button>
              <div className="flex-1 flex items-center justify-center min-w-0 px-1">
                {hasCategory ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-xs font-semibold max-w-[190px] truncate shadow-xs">
                    <Folder className="w-3.5 h-3.5 shrink-0 text-neutral-300" />
                    <span className="truncate">{selectedTaskProject.name}</span>
                  </div>
                ) : null}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const nextP = (selectedTask.priority + 1) % 4;
                    updateTask(selectedTask.id, { priority: nextP });
                  }}
                  className="p-2 rounded-lg bg-[#1a1a1f] border border-[#2a2a32] hover:text-white transition-colors"
                  title="Alterar Prioridade"
                >
                  <Flag className={`w-4 h-4 ${priorityColors[selectedTask.priority]}`} />
                </button>
                <button
                  onClick={() => moveTaskToTrash(selectedTask.id)}
                  className="p-2 rounded-lg bg-[#1a1a1f] border border-[#2a2a32] text-neutral-400 hover:text-rose-400 transition-colors"
                  title="Excluir Tarefa"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 pb-24 md:pb-6 flex flex-col">
            {/* Title & Complete Checkbox */}
            <div className="flex items-center gap-3 pt-1 pb-2 border-b border-white/[0.08] shrink-0">
              <button
                type="button"
                onClick={() => toggleTaskCompleted(selectedTask.id)}
                className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-colors shrink-0 ${
                  selectedTask.completed ? 'bg-white/20 border-white/40 text-white' : 'border-neutral-500 hover:border-neutral-300'
                }`}
              >
                {selectedTask.completed && <Check className="w-4 h-4 stroke-[3]" />}
              </button>
              <input
                type="text"
                value={selectedTask.title}
                placeholder="Título da tarefa..."
                onChange={(e) => updateTask(selectedTask.id, { title: e.target.value })}
                className="flex-1 bg-transparent text-xl font-bold text-white focus:outline-none placeholder-neutral-600"
              />
            </div>

            {/* Informações da Tarefa: Fita Minimalista de Metadados (Dia, Hora, Categoria, Alarme) */}
            <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none shrink-0">
              {/* Dia Chip */}
              <button
                type="button"
                onClick={() => setIsCustomDateModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141417] hover:bg-[#1c1c22] border border-white/10 hover:border-white/20 text-xs text-neutral-200 transition-all active:scale-95 shrink-0"
              >
                <CalendarIcon className="w-3.5 h-3.5 text-neutral-400" />
                <span className="font-medium">{formatTaskDateInfo()}</span>
              </button>

              {/* Hora Chip */}
              <button
                type="button"
                onClick={() => {
                  setEditingTimeSlot(taskTimes[0] || null);
                  setIsTimePickerOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141417] hover:bg-[#1c1c22] border border-white/10 hover:border-white/20 text-xs text-neutral-200 transition-all active:scale-95 shrink-0"
              >
                <Clock className="w-3.5 h-3.5 text-neutral-400" />
                <span className="font-medium">{timeDisplay}</span>
              </button>

              {/* Categoria Chip: estritamente exibido APENAS se a tarefa possuir categoria real (conforme requisito) */}
              {hasCategory && (
                <div className="shrink-0 min-w-[120px]">
                  <ObsidianSelect
                    title="Categoria"
                    compact={true}
                    value={selectedTask.projectId || 'inbox'}
                    onChange={(val) => updateTask(selectedTask.id, { projectId: val })}
                    options={[
                      { value: 'inbox', label: 'Remover da Categoria' },
                      ...state.projects.filter(p => p.id !== 'inbox').map(p => ({ value: p.id, label: p.name }))
                    ]}
                  />
                </div>
              )}

              {/* Alarme Chip */}
              <button
                type="button"
                onClick={() => updateTask(selectedTask.id, { alarmEnabled: selectedTask.alarmEnabled === false })}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all active:scale-95 shrink-0 ${
                  selectedTask.alarmEnabled !== false
                    ? 'bg-white/10 border-white/20 text-white'
                    : 'bg-[#141417] border-white/10 text-neutral-500'
                }`}
              >
                {selectedTask.alarmEnabled !== false ? (
                  <Bell className="w-3.5 h-3.5 text-white" />
                ) : (
                  <BellOff className="w-3.5 h-3.5 text-neutral-500" />
                )}
                <span>{selectedTask.alarmEnabled !== false ? 'Alarme' : 'Sem alarme'}</span>
              </button>
            </div>

            {/* Aproveitamento Total de Tela: Notas com Formatação WhatsApp */}
            <div className="flex-1 w-full bg-[#0d0d10] border border-white/10 rounded-2xl p-4 flex flex-col min-h-[440px] md:min-h-[560px] shadow-lg">
              <div className="flex items-center justify-between pb-2.5 mb-2 border-b border-white/[0.08] shrink-0">
                <div className="flex items-center gap-2">
                  <AlignLeft className="w-4 h-4 text-neutral-400" />
                  <span className="text-xs font-semibold text-neutral-300 uppercase tracking-wider">
                    Notas & Detalhes
                  </span>
                </div>
                
                {/* View/Edit Mode Pill (NO formatting buttons!) */}
                <button
                  type="button"
                  onPointerDown={(e) => e.preventDefault()}
                  onClick={() => setIsEditingNotes(prev => !prev)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/15 border border-white/20 text-xs text-white transition-all active:scale-95"
                >
                  {isEditingNotes ? (
                    <>
                      <Eye className="w-3.5 h-3.5 text-white" />
                      <span>Visualizar</span>
                    </>
                  ) : (
                    <>
                      <Edit3 className="w-3.5 h-3.5 text-white" />
                      <span>Editar</span>
                    </>
                  )}
                </button>
              </div>

              {isEditingNotes ? (
                <textarea
                  autoFocus
                  rows={14}
                  placeholder="Escreva livremente notas, tarefas ou textos longos...&#10;&#10;Formatação WhatsApp:&#10;*negrito*&#10;_itálico_&#10;~tachado~&#10;```código```&#10;- bullet point&#10;1. lista numerada&#10;[ ] checklist interativo"
                  value={selectedTask.description || ''}
                  onChange={(e) => updateTask(selectedTask.id, { description: e.target.value })}
                  className="w-full flex-1 bg-transparent text-sm sm:text-base text-neutral-100 placeholder-neutral-500 focus:outline-none leading-relaxed resize-none font-normal"
                />
              ) : (
                <div
                  onClick={() => setIsEditingNotes(true)}
                  className="w-full flex-1 cursor-text overflow-y-auto"
                >
                  {selectedTask.description && selectedTask.description.trim() ? (
                    renderWhatsAppFormatted(selectedTask.description, (lineIdx, checked) => {
                      const lines = (selectedTask.description || '').split('\n');
                      if (lineIdx >= 0 && lineIdx < lines.length) {
                        const sym = checked ? '[x]' : '[ ]';
                        lines[lineIdx] = lines[lineIdx].replace(/^(\s*)\[([ xX])\]/, `$1${sym}`);
                        updateTask(selectedTask.id, { description: lines.join('\n') });
                      }
                    })
                  ) : (
                    <div className="h-full min-h-[260px] flex flex-col items-center justify-center text-center text-neutral-500 py-10">
                      <AlignLeft className="w-8 h-8 text-neutral-600 mb-2 stroke-[1.5]" />
                      <p className="text-sm font-semibold text-neutral-400">Nenhuma anotação ainda</p>
                      <p className="text-xs text-neutral-500 mt-1 max-w-xs">
                        Toque aqui para digitar. Use formatação estilo WhatsApp: *negrito*, _itálico_, ~tachado~, - bullets e [ ] checklists.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Iniciar Pomodoro Nesta Tarefa */}
            <button
              type="button"
              onClick={() => {
                setSelectedTaskId(null);
                onStartPomodoroForTask(selectedTask);
              }}
              className="w-full py-3 px-4 bg-white/10 hover:bg-white/15 border border-white/20 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 active:scale-98 transition-all shrink-0"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Iniciar Pomodoro Nesta Tarefa</span>
            </button>
          </div>
        </div>
        );
      })()}

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
