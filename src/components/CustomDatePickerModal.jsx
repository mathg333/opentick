import React, { useState, useEffect, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Check,
  X,
  Bell,
  BellOff,
  Plus,
  Repeat,
  SlidersHorizontal,
  Layers,
  Maximize2
} from 'lucide-react';
import TimePickerModal from './TimePickerModal';
import { ObsidianDateButton } from './ObsidianControls';
import ScheduledTasksOverviewModal, { inferTaskFrequency } from './ScheduledTasksOverviewModal';
import {
  formatDateYMD,
  getTodayYMD,
  parseYMD,
  getTaskTimes,
  getTaskDates,
  generateDailyDates,
  generateWeeklyDates,
  generateMonthlyRepeatedDates,
  generateAnnualDates
} from '../utils/taskSchedule';

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTH_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function CustomDatePickerModal({
  isOpen,
  onClose,
  onSelectDates,
  onApplyCustomSchedule,
  initialDates = [],
  initialDate = '',
  initialTimes = [],
  initialAlarmEnabled = true,
  initialReminderOffset = 0,
  initialTime = '',
  initialMode = 'monthly',
  allowTaskSelection = false,
  tasks = [],
  projects = [],
  initialTitle = ''
}) {
  const [mode, setMode] = useState('monthly'); // 'daily' | 'weekly' | 'monthly' | 'annual'
  const [selectedDates, setSelectedDates] = useState([]);
  const [selectedTimes, setSelectedTimes] = useState([]);

  // Multi-time picker modal & Scheduled Super Overview states
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [editingTimeTarget, setEditingTimeTarget] = useState(null);
  const [isOverviewOpen, setIsOverviewOpen] = useState(false);
  const [existingFreqFilter, setExistingFreqFilter] = useState('all'); // string HH:MM if editing existing, null if adding

  // Task create / select state (when allowTaskSelection = true)
  const [taskAction, setTaskAction] = useState('new'); // 'new' | 'existing'
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskProjectId, setNewTaskProjectId] = useState('inbox');
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [alarmEnabled, setAlarmEnabled] = useState(true);
  const [reminderOffset, setReminderOffset] = useState(0);
  const activeTasks = useMemo(() => (tasks || []).filter(t => !t.deleted), [tasks]);

  // Monthly calendar navigation & multi-month repeat
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [monthlyHorizon, setMonthlyHorizon] = useState(1); // 1, 3, 6, 12 months
  const [additiveMode, setAdditiveMode] = useState(false);

  // Daily mode config
  const [dailyInterval, setDailyInterval] = useState(1);
  const [dailyDuration, setDailyDuration] = useState(30);
  const [dailyStartDate, setDailyStartDate] = useState(getTodayYMD());

  // Weekly mode config
  const [weeklyDays, setWeeklyDays] = useState([1, 3, 5]); // default Seg, Qua, Sex
  const [weeklyInterval, setWeeklyInterval] = useState(1);
  const [weeklyDurationWeeks, setWeeklyDurationWeeks] = useState(12);

  // Annual mode config
  const [annualYear, setAnnualYear] = useState(() => new Date().getFullYear());
  const [annualMonths, setAnnualMonths] = useState(() => [new Date().getMonth()]);
  const [annualDaysOfMonth, setAnnualDaysOfMonth] = useState(() => [new Date().getDate()]);

  useEffect(() => {
    if (!isOpen) return;

    const todayStr = getTodayYMD();
    let baseDates = [];
    if (Array.isArray(initialDates) && initialDates.length > 0) {
      baseDates = [...new Set(initialDates)].filter(Boolean).sort();
    } else if (initialDate) {
      baseDates = [initialDate];
    } else {
      baseDates = [todayStr];
    }

    let baseTimes = [];
    if (Array.isArray(initialTimes) && initialTimes.length > 0) {
      baseTimes = [...new Set(initialTimes)].filter(Boolean).sort();
    } else if (initialTime) {
      baseTimes = [initialTime];
    }

    const mappedMode =
      initialMode === 'day' || initialMode === 'daily' ? 'daily' :
      initialMode === 'week' || initialMode === '3days' || initialMode === 'weekly' ? 'weekly' :
      initialMode === 'year' || initialMode === 'annual' ? 'annual' :
      'monthly';

    setMode(mappedMode);
    setSelectedDates(baseDates);
    setSelectedTimes(baseTimes);
    setDailyStartDate(baseDates[0] || todayStr);

    const anchor = parseYMD(baseDates[0] || todayStr) || new Date();
    setCurrentMonth(new Date(anchor.getFullYear(), anchor.getMonth(), 1));
    setAnnualYear(anchor.getFullYear());
    setAnnualMonths([anchor.getMonth()]);
    setAnnualDaysOfMonth([anchor.getDate()]);
    setWeeklyDays([anchor.getDay()]);
    setMonthlyHorizon(1);
    setAdditiveMode(false);
    setAlarmEnabled(initialAlarmEnabled !== false);
    setReminderOffset(initialReminderOffset ?? 0);

    setTaskAction('new');
    setNewTaskTitle(initialTitle || '');
    setNewTaskProjectId(projects?.[0]?.id || 'inbox');
    const nonDeleted = (tasks || []).filter(t => !t.deleted);
    const availableTasks = nonDeleted.filter(t => !t.completed);
    setSelectedTaskId(availableTasks[0]?.id || nonDeleted[0]?.id || '');
  }, [isOpen]);

  const handleSelectExistingTask = (taskId) => {
    setSelectedTaskId(taskId);
    const found = activeTasks.find(t => t.id === taskId);
    if (!found) return;
    const d = getTaskDates(found);
    const tm = getTaskTimes(found);
    setSelectedDates(d);
    setSelectedTimes(tm);
    const rp = found.recurrencePattern;
    if (rp) {
      if (rp.mode) setMode(rp.mode);
      if (rp.dailyInterval != null) setDailyInterval(rp.dailyInterval);
      if (rp.dailyDuration != null) setDailyDuration(rp.dailyDuration);
      setDailyStartDate(d[0] || getTodayYMD());
      if (Array.isArray(rp.weeklyDays) && rp.weeklyDays.length > 0) setWeeklyDays(rp.weeklyDays);
      if (rp.weeklyInterval != null) setWeeklyInterval(rp.weeklyInterval);
      if (rp.weeklyDurationWeeks != null) setWeeklyDurationWeeks(rp.weeklyDurationWeeks);
      if (rp.monthlyHorizon != null) setMonthlyHorizon(rp.monthlyHorizon);
      if (rp.annualYear != null) setAnnualYear(rp.annualYear);
      if (Array.isArray(rp.annualMonths) && rp.annualMonths.length > 0) setAnnualMonths(rp.annualMonths);
      if (Array.isArray(rp.annualDaysOfMonth) && rp.annualDaysOfMonth.length > 0) setAnnualDaysOfMonth(rp.annualDaysOfMonth);
    }
    setAlarmEnabled(found.alarmEnabled !== false);
    setReminderOffset(found.reminderOffset ?? 0);
  };

  const applyGeneratedDates = (generated) => {
    const clean = [...new Set(generated)].filter(Boolean).sort();
    if (additiveMode) {
      setSelectedDates(prev => [...new Set([...prev, ...clean])].sort());
    } else {
      setSelectedDates(clean);
    }
  };

  // Monthly calendar matrix
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const calendarDays = useMemo(() => {
    const cells = [];
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevMonthObj = new Date(year, month - 1, d);
      cells.push({
        day: d,
        dateStr: formatDateYMD(prevMonthObj),
        isCurrentMonth: false
      });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const currObj = new Date(year, month, d);
      cells.push({
        day: d,
        dateStr: formatDateYMD(currObj),
        isCurrentMonth: true
      });
    }
    const remainingCells = 42 - cells.length;
    for (let d = 1; d <= remainingCells; d++) {
      const nextMonthObj = new Date(year, month + 1, d);
      cells.push({
        day: d,
        dateStr: formatDateYMD(nextMonthObj),
        isCurrentMonth: false
      });
    }
    return cells;
  }, [year, month, firstDayOfMonth, daysInMonth, daysInPrevMonth]);

  if (!isOpen) return null;

  const todayStr = getTodayYMD();

  const toggleDate = (dateStr) => {
    setSelectedDates(prev => {
      if (prev.includes(dateStr)) {
        return prev.filter(d => d !== dateStr);
      }
      return [...prev, dateStr].sort();
    });
  };

  const handleTimePicked = (pickedTime) => {
    if (!pickedTime) return;
    setSelectedTimes(prev => {
      const filtered = editingTimeTarget ? prev.filter(t => t !== editingTimeTarget) : prev;
      return [...new Set([...filtered, pickedTime])].sort();
    });
    setEditingTimeTarget(null);
  };

  // Mode generators
  const triggerDailyApply = (interval = dailyInterval, duration = dailyDuration, start = dailyStartDate) => {
    const generated = generateDailyDates(start || todayStr, interval, duration);
    applyGeneratedDates(generated);
  };

  const triggerWeeklyApply = (
    days = weeklyDays,
    interval = weeklyInterval,
    weeks = weeklyDurationWeeks
  ) => {
    if (!days || days.length === 0) return;
    const generated = generateWeeklyDates(dailyStartDate || todayStr, days, interval, weeks);
    applyGeneratedDates(generated);
  };

  const toggleWeeklyDay = (dayIdx) => {
    const next = weeklyDays.includes(dayIdx)
      ? weeklyDays.filter(d => d !== dayIdx)
      : [...weeklyDays, dayIdx].sort((a, b) => a - b);
    setWeeklyDays(next);
    if (next.length > 0) {
      triggerWeeklyApply(next, weeklyInterval, weeklyDurationWeeks);
    }
  };

  const applyMonthlyHorizonToSelected = (horizon) => {
    setMonthlyHorizon(horizon);
    // Extract unique day-of-month numbers from currently viewed month (or all selected dates)
    const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}-`;
    const inViewDays = selectedDates
      .filter(d => d.startsWith(monthPrefix))
      .map(d => parseInt(d.split('-')[2], 10));
    const fallbackDays = selectedDates.map(d => parseInt(d.split('-')[2], 10));
    const dayNumbers = [...new Set(inViewDays.length > 0 ? inViewDays : fallbackDays)].filter(Boolean);
    if (dayNumbers.length === 0) return;
    const generated = generateMonthlyRepeatedDates(dayNumbers, year, month, horizon);
    applyGeneratedDates(generated);
  };

  const toggleAnnualMonth = (mIdx) => {
    const nextMonths = annualMonths.includes(mIdx)
      ? annualMonths.filter(m => m !== mIdx)
      : [...annualMonths, mIdx].sort((a, b) => a - b);
    setAnnualMonths(nextMonths);
    if (nextMonths.length > 0 && annualDaysOfMonth.length > 0) {
      applyGeneratedDates(generateAnnualDates(annualYear, nextMonths, annualDaysOfMonth));
    }
  };

  const toggleAnnualDay = (dayNum) => {
    const nextDays = annualDaysOfMonth.includes(dayNum)
      ? annualDaysOfMonth.filter(d => d !== dayNum)
      : [...annualDaysOfMonth, dayNum].sort((a, b) => a - b);
    setAnnualDaysOfMonth(nextDays);
    if (annualMonths.length > 0 && nextDays.length > 0) {
      applyGeneratedDates(generateAnnualDates(annualYear, annualMonths, nextDays));
    }
  };

  const handleConfirm = () => {
    const datesToApply = [...selectedDates].sort();
    const timesToApply = [...new Set(selectedTimes)].filter(Boolean).sort();
    const pattern = {
      mode,
      dailyInterval,
      dailyDuration,
      weeklyDays,
      weeklyInterval,
      weeklyDurationWeeks,
      monthlyHorizon,
      annualYear,
      annualMonths,
      annualDaysOfMonth
    };

    if (allowTaskSelection && onApplyCustomSchedule) {
      if (taskAction === 'new' && !newTaskTitle.trim()) return;
      if (taskAction === 'existing' && !selectedTaskId) return;
      onApplyCustomSchedule({
        dates: datesToApply.length > 0 ? datesToApply : [todayStr],
        times: timesToApply,
        pattern,
        taskAction,
        taskId: selectedTaskId,
        title: newTaskTitle.trim(),
        projectId: newTaskProjectId,
        alarmEnabled,
        reminderOffset
      });
      onClose();
      return;
    }

    if (onSelectDates) {
      onSelectDates(datesToApply, timesToApply[0] || '', {
        times: timesToApply,
        pattern,
        alarmEnabled,
        reminderOffset
      });
    }
    onClose();
  };

  const isConfirmDisabled =
    allowTaskSelection &&
    ((taskAction === 'new' && !newTaskTitle.trim()) ||
      (taskAction === 'existing' && !selectedTaskId));

  return (
    <div className="fixed inset-0 z-[105] flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-[#0A0A0C] border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="px-4 py-3.5 border-b border-white/10 flex items-center justify-between bg-[#111114] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-md bg-[#facc15]/15 border border-[#facc15]/30 flex items-center justify-center text-[#facc15] shrink-0">
              <SlidersHorizontal size={18} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-black text-white tracking-tight truncate">Personalizado</h3>
              <p className="text-[11px] text-[#facc15]/80 font-medium truncate">
                Marque vários dias, datas e horários em qualquer modo
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-[#facc15] hover:bg-white/10 rounded-md transition-colors shrink-0"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3.5 custom-scrollbar">

          {/* Optional Task Selection / Creation when invoked from Calendar or Visualizations */}
          {allowTaskSelection && (
            <div className="bg-[#141417] border border-white/10 rounded-lg p-3 space-y-2.5">
              <div className="grid grid-cols-2 gap-1.5 bg-[#0A0A0C] p-1 rounded-md border border-white/5">
                <button
                  type="button"
                  onClick={() => setTaskAction('new')}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    taskAction === 'new'
                      ? 'bg-[#facc15]/15 text-[#facc15] border border-[#facc15]/50'
                      : 'text-[#8E8E93] hover:text-white'
                  }`}
                >
                  <Plus size={13} className={taskAction === 'new' ? 'text-[#facc15]' : 'text-[#8E8E93]'} />
                  Nova Tarefa
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTaskAction('existing');
                    if (selectedTaskId) handleSelectExistingTask(selectedTaskId);
                  }}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    taskAction === 'existing'
                      ? 'bg-[#facc15]/15 text-[#facc15] border border-[#facc15]/50'
                      : 'text-[#8E8E93] hover:text-white'
                  }`}
                >
                  <Layers size={13} className={taskAction === 'existing' ? 'text-[#facc15]' : 'text-[#8E8E93]'} />
                  Agendadas ({activeTasks.length})
                </button>
              </div>

              {taskAction === 'new' ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Nome da tarefa ou rotina (ex: Tomar água, Treinar)..."
                    className="w-full bg-[#0A0A0C] border border-white/10 focus:border-[#facc15]/60 rounded-md px-3 py-2 text-xs text-white placeholder-[#555558] outline-none font-medium"
                  />
                  {projects && projects.length > 0 && (
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
                      <span className="text-[10px] font-bold text-[#8E8E93] shrink-0">Lista:</span>
                      {projects.map(p => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setNewTaskProjectId(p.id)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold shrink-0 border transition-all ${
                            newTaskProjectId === p.id
                              ? 'bg-[#facc15]/20 text-[#facc15] border-[#facc15]/50'
                              : 'bg-[#0A0A0C] text-[#8E8E93] border-white/5 hover:text-white'
                          }`}
                        >
                          {p.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar flex-1 min-w-0">
                      {[
                        { id: 'all', label: 'Todas' },
                        { id: 'daily', label: 'Diárias' },
                        { id: 'weekly', label: 'Semanais' },
                        { id: 'monthly', label: 'Mensais' },
                        { id: 'annual', label: 'Anuais' }
                      ].map(f => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setExistingFreqFilter(f.id)}
                          className={`px-2 py-1 rounded-lg text-[10px] font-bold shrink-0 border transition-all ${
                            existingFreqFilter === f.id
                              ? 'bg-[#facc15]/15 text-[#facc15] border-[#facc15]/55'
                              : 'bg-[#0A0A0C] text-[#A1A1AA] border-white/10 hover:text-white'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsOverviewOpen(true)}
                      className="px-2.5 py-1 rounded-lg bg-[#facc15]/15 border border-[#facc15]/45 text-[#facc15] text-[10px] font-black flex items-center gap-1 shrink-0"
                      title="Abrir Super Janela com todas as tarefas e detalhes"
                    >
                      <Maximize2 size={11} />
                      <span>Super Painel</span>
                    </button>
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-1.5 pr-0.5 custom-scrollbar">
                    {activeTasks
                      .filter(t => existingFreqFilter === 'all' || inferTaskFrequency(t) === existingFreqFilter)
                      .map(t => {
                        const isSel = selectedTaskId === t.id;
                        const tDates = getTaskDates(t);
                        const tTimes = getTaskTimes(t);
                        const freq = inferTaskFrequency(t);
                        const freqName = freq === 'daily' ? 'Diária' : freq === 'weekly' ? 'Semanal' : freq === 'monthly' ? 'Mensal' : freq === 'annual' ? 'Anual' : 'Única';
                        return (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => handleSelectExistingTask(t.id)}
                            className={`w-full px-2.5 py-1.5 rounded-[4px] border text-left transition-all flex items-center justify-between gap-2 ${
                              isSel
                                ? 'bg-[#facc15]/12 border-[#facc15]/55'
                                : 'bg-[#0A0A0C] border-white/10 hover:border-white/25'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="px-1.5 py-0.5 rounded bg-[#facc15]/15 text-[#facc15] text-[9px] font-black uppercase">
                                  {freqName}
                                </span>
                                <span className="text-[10px] font-mono text-[#A1A1AA]">
                                  {tDates.length}d · {tTimes.length}h
                                </span>
                              </div>
                              <div className={`text-xs font-bold truncate ${isSel ? 'text-[#facc15]' : 'text-white'}`}>
                                {t.title}
                              </div>
                              {t.description && (
                                <div className="text-[10px] text-[#8E8E93] truncate">{t.description}</div>
                              )}
                            </div>
                            <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                              isSel ? 'bg-[#facc15]/20 border-[#facc15]/70 text-[#facc15]' : 'border-[#3f3f46]'
                            }`}>
                              {isSel && <Check size={10} strokeWidth={3} />}
                            </div>
                          </button>
                        );
                      })}
                    {activeTasks.filter(t => existingFreqFilter === 'all' || inferTaskFrequency(t) === existingFreqFilter).length === 0 && (
                      <div className="py-5 text-center text-[11px] text-[#8E8E93]">
                        Nenhuma tarefa encontrada nesse filtro.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 4-Mode Selector Tabs (Diário, Semanal, Mensal, Anual) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#8E8E93]">
                Modo de Repetição
              </span>
              <button
                type="button"
                onClick={() => setAdditiveMode(prev => !prev)}
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all ${
                  additiveMode
                    ? 'bg-[#facc15]/20 text-[#facc15] border-[#facc15]/40'
                    : 'bg-white/5 text-[#8E8E93] border-white/10 hover:text-white'
                }`}
              >
                {additiveMode ? '+ Somando às datas' : 'Substituir ao gerar'}
              </button>
            </div>
            <div className="grid grid-cols-4 gap-1 bg-[#141417] p-1 rounded-md border border-white/10">
              {[
                { id: 'daily', label: 'Diário' },
                { id: 'weekly', label: 'Semanal' },
                { id: 'monthly', label: 'Mensal' },
                { id: 'annual', label: 'Anual' }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setMode(tab.id)}
                  className={`py-2 rounded-lg text-[11px] font-black transition-all ${
                    mode === tab.id
                      ? 'bg-[#facc15] text-black'
                      : 'text-[#A1A1AA] hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* MODE 1: DIÁRIO */}
          {mode === 'daily' && (
            <div className="bg-[#141417] border border-white/10 rounded-lg p-3 space-y-3">
              <div>
                <div className="text-[11px] font-bold text-white mb-1.5">Repetir a cada quantos dias?</div>
                <div className="grid grid-cols-5 gap-1.5">
                  {[
                    { v: 1, label: 'Todo dia' },
                    { v: 2, label: '2 dias' },
                    { v: 3, label: '3 dias' },
                    { v: 5, label: '5 dias' },
                    { v: 7, label: '7 dias' }
                  ].map(opt => (
                    <button
                      key={opt.v}
                      type="button"
                      onClick={() => {
                        setDailyInterval(opt.v);
                        triggerDailyApply(opt.v, dailyDuration, dailyStartDate);
                      }}
                      className={`py-1.5 px-1 rounded-lg text-[10px] font-bold border transition-all ${
                        dailyInterval === opt.v
                          ? 'bg-[#facc15]/15 text-[#facc15] border-[#facc15]/55'
                          : 'bg-[#0A0A0C] text-[#A1A1AA] border-white/10 hover:text-white'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-[11px] font-bold text-white mb-1.5">Horizonte de dias a gerar:</div>
                <div className="grid grid-cols-5 gap-1.5">
                  {[7, 14, 30, 60, 90].map(dur => (
                    <button
                      key={dur}
                      type="button"
                      onClick={() => {
                        setDailyDuration(dur);
                        triggerDailyApply(dailyInterval, dur, dailyStartDate);
                      }}
                      className={`py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                        dailyDuration === dur
                          ? 'bg-[#facc15]/20 text-[#facc15] border-[#facc15]/60'
                          : 'bg-[#0A0A0C] text-[#A1A1AA] border-white/10 hover:text-white'
                      }`}
                    >
                      {dur}d
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-[#8E8E93] font-bold">Início:</span>
                  <ObsidianDateButton
                    compact
                    value={dailyStartDate}
                    onChange={(val) => {
                      const clean = val || todayStr;
                      setDailyStartDate(clean);
                      triggerDailyApply(dailyInterval, dailyDuration, clean);
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => triggerDailyApply()}
                  className="px-3 py-1.5 rounded-lg bg-[#facc15]/15 hover:bg-[#facc15]/25 border border-[#facc15]/40 text-[#facc15] text-[10px] font-black transition-all"
                >
                  Gerar Datas Diárias
                </button>
              </div>
            </div>
          )}

          {/* MODE 2: SEMANAL */}
          {mode === 'weekly' && (
            <div className="bg-[#141417] border border-white/10 rounded-lg p-3 space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-white">Marque os dias da semana:</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        const weekdays = [1, 2, 3, 4, 5];
                        setWeeklyDays(weekdays);
                        triggerWeeklyApply(weekdays, weeklyInterval, weeklyDurationWeeks);
                      }}
                      className="text-[10px] px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-[#facc15] font-bold"
                    >
                      Seg-Sex
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const weekend = [0, 6];
                        setWeeklyDays(weekend);
                        triggerWeeklyApply(weekend, weeklyInterval, weeklyDurationWeeks);
                      }}
                      className="text-[10px] px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-[#facc15] font-bold"
                    >
                      FDS
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {WEEKDAY_LABELS.map((lbl, idx) => {
                    const active = weeklyDays.includes(idx);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => toggleWeeklyDay(idx)}
                        className={`py-2 rounded-md text-[11px] font-black border transition-all ${
                          active
                            ? 'bg-[#facc15]/15 text-[#facc15] border-[#facc15]/55'
                            : 'bg-[#0A0A0C] text-[#8E8E93] border-white/10 hover:text-white'
                        }`}
                      >
                        {lbl}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-[10px] font-bold text-[#8E8E93] mb-1">Frequência</div>
                  <div className="grid grid-cols-2 gap-1">
                    {[
                      { v: 1, label: 'Toda sem.' },
                      { v: 2, label: 'A cada 2' }
                    ].map(opt => (
                      <button
                        key={opt.v}
                        type="button"
                        onClick={() => {
                          setWeeklyInterval(opt.v);
                          triggerWeeklyApply(weeklyDays, opt.v, weeklyDurationWeeks);
                        }}
                        className={`py-1.5 rounded-lg text-[10px] font-bold border ${
                          weeklyInterval === opt.v
                            ? 'bg-[#facc15]/20 text-[#facc15] border-[#facc15]/50'
                            : 'bg-[#0A0A0C] text-[#A1A1AA] border-white/10'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-bold text-[#8E8E93] mb-1">Duração</div>
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      { v: 4, label: '1m' },
                      { v: 12, label: '3m' },
                      { v: 24, label: '6m' },
                      { v: 52, label: '1a' }
                    ].map(dur => (
                      <button
                        key={dur.v}
                        type="button"
                        onClick={() => {
                          setWeeklyDurationWeeks(dur.v);
                          triggerWeeklyApply(weeklyDays, weeklyInterval, dur.v);
                        }}
                        className={`py-1.5 rounded-lg text-[10px] font-bold border ${
                          weeklyDurationWeeks === dur.v
                            ? 'bg-[#facc15]/20 text-[#facc15] border-[#facc15]/50'
                            : 'bg-[#0A0A0C] text-[#A1A1AA] border-white/10'
                        }`}
                      >
                        {dur.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MODE 4: ANUAL */}
          {mode === 'annual' && (
            <div className="bg-[#141417] border border-white/10 rounded-lg p-3 space-y-3">
              {/* Year Nav */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    const y = annualYear - 1;
                    setAnnualYear(y);
                    if (annualMonths.length > 0 && annualDaysOfMonth.length > 0) {
                      applyGeneratedDates(generateAnnualDates(y, annualMonths, annualDaysOfMonth));
                    }
                  }}
                  className="p-1.5 rounded-lg bg-[#0A0A0C] border border-white/10 text-[#facc15] hover:bg-white/5"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm font-black text-white tracking-wider">Ano {annualYear}</span>
                <button
                  type="button"
                  onClick={() => {
                    const y = annualYear + 1;
                    setAnnualYear(y);
                    if (annualMonths.length > 0 && annualDaysOfMonth.length > 0) {
                      applyGeneratedDates(generateAnnualDates(y, annualMonths, annualDaysOfMonth));
                    }
                  }}
                  className="p-1.5 rounded-lg bg-[#0A0A0C] border border-white/10 text-[#facc15] hover:bg-white/5"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Months multi-select */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-white">1. Meses do ano:</span>
                  <button
                    type="button"
                    onClick={() => {
                      const allM = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
                      setAnnualMonths(allM);
                      if (annualDaysOfMonth.length > 0) {
                        applyGeneratedDates(generateAnnualDates(annualYear, allM, annualDaysOfMonth));
                      }
                    }}
                    className="text-[10px] font-bold text-[#facc15] hover:underline"
                  >
                    Todos os 12 meses
                  </button>
                </div>
                <div className="grid grid-cols-6 gap-1">
                  {MONTH_SHORT.map((mName, idx) => {
                    const active = annualMonths.includes(idx);
                    return (
                      <button
                        key={mName}
                        type="button"
                        onClick={() => toggleAnnualMonth(idx)}
                        className={`py-1.5 rounded-lg text-[10px] font-black border transition-all ${
                          active
                            ? 'bg-[#facc15]/15 text-[#facc15] border-[#facc15]/55'
                            : 'bg-[#0A0A0C] text-[#A1A1AA] border-white/10 hover:text-white'
                        }`}
                      >
                        {mName}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Day of month multi-select */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-white">2. Dias do mês ({annualDaysOfMonth.length}):</span>
                  <div className="flex gap-1">
                    {[
                      { label: '1, 15', days: [1, 15] },
                      { label: '1, 10, 20', days: [1, 10, 20] }
                    ].map(preset => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          setAnnualDaysOfMonth(preset.days);
                          if (annualMonths.length > 0) {
                            applyGeneratedDates(generateAnnualDates(annualYear, annualMonths, preset.days));
                          }
                        }}
                        className="text-[9px] px-1.5 py-0.5 rounded bg-white/5 text-[#facc15] font-bold"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-8 gap-1">
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(dayNum => {
                    const active = annualDaysOfMonth.includes(dayNum);
                    return (
                      <button
                        key={dayNum}
                        type="button"
                        onClick={() => toggleAnnualDay(dayNum)}
                        className={`h-7 rounded-lg text-[10px] font-bold border transition-all ${
                          active
                            ? 'bg-[#facc15]/15 text-[#facc15] border-[#facc15]/55'
                            : 'bg-[#0A0A0C] text-[#A1A1AA] border-white/10 hover:text-white'
                        }`}
                      >
                        {dayNum}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* MODE 3 (MENSAL) OR INTERACTIVE CALENDAR FINE-TUNER (always visible in Mensal, or helpful quick view in Daily/Weekly) */}
          {(mode === 'monthly' || mode === 'daily' || mode === 'weekly') && (
            <div className="bg-[#141417] border border-white/10 rounded-lg p-3">
              {/* Month Navigation Header */}
              <div className="flex items-center justify-between mb-2">
                <button
                  type="button"
                  onClick={() => setCurrentMonth(new Date(year, month - 1, 1))}
                  className="p-1.5 text-[#facc15] hover:bg-white/10 rounded-lg transition-colors"
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="flex items-center gap-1.5 text-xs font-black text-white">
                  <CalendarIcon size={13} className="text-[#facc15]" />
                  <span>{MONTH_NAMES[month]} {year}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setCurrentMonth(new Date(year, month + 1, 1))}
                  className="p-1.5 text-[#facc15] hover:bg-white/10 rounded-lg transition-colors"
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Weekdays */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {WEEKDAY_LABELS.map((w, i) => (
                  <div key={i} className="text-center text-[10px] font-bold text-[#8E8E93] py-0.5">
                    {w[0]}
                  </div>
                ))}
              </div>

              {/* Interactive Multi-Day Grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((cell, idx) => {
                  const isSelected = selectedDates.includes(cell.dateStr);
                  const isToday = cell.dateStr === todayStr;
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => toggleDate(cell.dateStr)}
                      className={`h-8 rounded-lg flex flex-col items-center justify-center relative text-[11px] transition-all ${
                        isSelected
                          ? 'bg-[#facc15] text-black font-black'
                          : isToday
                          ? 'bg-[#facc15]/15 text-[#facc15] font-bold border border-[#facc15]/40'
                          : cell.isCurrentMonth
                          ? 'text-white/90 hover:bg-white/10 font-medium'
                          : 'text-[#555558] hover:bg-white/5'
                      }`}
                    >
                      <span>{cell.day}</span>
                    </button>
                  );
                })}
              </div>

              {/* Monthly Quick Multi-Month Repetition Bar */}
              {mode === 'monthly' && (
                <div className="mt-3 pt-2.5 border-t border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#A1A1AA]">
                      Repetir os dias marcados pelos próximos:
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { h: 1, label: 'Só este mês' },
                      { h: 3, label: '3 meses' },
                      { h: 6, label: '6 meses' },
                      { h: 12, label: '12 meses' }
                    ].map(opt => (
                      <button
                        key={opt.h}
                        type="button"
                        onClick={() => applyMonthlyHorizonToSelected(opt.h)}
                        className={`py-1.5 px-1 rounded-lg text-[10px] font-bold border transition-all ${
                          monthlyHorizon === opt.h
                            ? 'bg-[#facc15]/20 text-[#facc15] border-[#facc15]/50'
                            : 'bg-[#0A0A0C] text-[#A1A1AA] border-white/10 hover:text-white'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SHARED ACROSS ALL MODES: MULTIPLE TIMES PER DAY */}
          <div className="bg-[#141417] border border-[#facc15]/25 rounded-lg p-3 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Clock size={15} className="text-[#facc15]" />
                <span className="text-xs font-black text-white">
                  Horários ({selectedTimes.length})
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingTimeTarget(null);
                  setShowTimePicker(true);
                }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#18181c] hover:bg-[#facc15]/15 border border-[#facc15]/40 text-[#facc15] text-[11px] font-bold transition-all"
              >
                <Plus size={13} strokeWidth={3} />
                Adicionar Horário
              </button>
            </div>

            {/* Active Selected Times Chips */}
            {selectedTimes.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {selectedTimes.map(timeStr => (
                  <div
                    key={timeStr}
                    className="flex items-center gap-1 bg-[#facc15]/15 border border-[#facc15]/45 text-[#facc15] rounded-md px-2.5 py-1 text-xs font-black"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setEditingTimeTarget(timeStr);
                        setShowTimePicker(true);
                      }}
                      className="hover:underline"
                      title="Editar horário"
                    >
                      {timeStr}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedTimes(prev => prev.filter(t => t !== timeStr))}
                      className="p-0.5 hover:bg-[#facc15]/20 rounded text-[#facc15]"
                      aria-label={`Remover ${timeStr}`}
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setEditingTimeTarget(null);
                  setShowTimePicker(true);
                }}
                className="w-full text-left text-[11px] text-[#8E8E93] hover:text-neutral-200 py-1 transition-colors"
              >
                Sem horário fixo — toque em <span className="text-[#facc15] font-semibold">+ Adicionar Horário</span> para escolher no relógio analógico.
              </button>
            )}
          </div>

          {/* Selected Summary Bar */}
          <div className="bg-[#141417] border border-white/10 rounded-md px-2.5 py-2 flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setAlarmEnabled(prev => !prev)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] border text-[11px] font-bold transition-all ${
                alarmEnabled
                  ? 'bg-[#facc15]/15 border-[#facc15]/50 text-[#facc15]'
                  : 'bg-[#0A0A0C] border-white/10 text-[#8e8e93]'
              }`}
            >
              {alarmEnabled ? <Bell className="w-3.5 h-3.5" /> : <BellOff className="w-3.5 h-3.5" />}
              {alarmEnabled ? 'Alarme Ativo' : 'Sem Alarme'}
            </button>
            {alarmEnabled && (
              <div className="flex items-center gap-1 flex-wrap">
                {[
                  { val: 0, label: 'Na hora' },
                  { val: 5, label: '-5m' },
                  { val: 10, label: '-10m' },
                  { val: 15, label: '-15m' },
                  { val: 30, label: '-30m' }
                ].map(opt => (
                  <button
                    key={opt.val}
                    type="button"
                    onClick={() => setReminderOffset(opt.val)}
                    className={`px-2 py-0.5 rounded-[4px] border text-[10px] font-bold transition-all ${
                      reminderOffset === opt.val
                        ? 'bg-[#facc15]/15 border-[#facc15]/50 text-[#facc15]'
                        : 'bg-[#0A0A0C] border-white/10 text-[#8e8e93] hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="bg-[#111114] border border-white/10 rounded-md px-3 py-2 flex items-center justify-between gap-2">
            <div className="text-[11px] text-[#E4E4E7] font-semibold truncate">
              <span className="text-[#facc15] font-black">{selectedDates.length}</span>{' '}
              {selectedDates.length === 1 ? 'dia marcado' : 'dias marcados'}
              {selectedTimes.length > 0 && (
                <>
                  {' · '}
                  <span className="text-[#facc15] font-black">{selectedTimes.length}</span>{' '}
                  {selectedTimes.length === 1 ? 'horário' : 'horários'}
                </>
              )}
            </div>
            {selectedDates.length > 0 && (
              <div className="flex items-center gap-1.5">
                {selectedDates.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedDates([])}
                    className="text-[10px] font-bold text-[#8e8e93] hover:text-red-400 px-2 py-1 rounded-[4px] bg-white/5 border border-white/5"
                  >
                    Limpar
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedDates([todayStr])}
                  className="text-[10px] font-bold text-[#8e8e93] hover:text-[#facc15] px-2 py-1 rounded-[4px] bg-white/5 border border-white/5"
                >
                  Resetar p/ Hoje
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer Confirm Action */}
        <div className="px-4 py-3 border-t border-white/10 bg-[#111114] shrink-0">
          <button
            type="button"
            disabled={isConfirmDisabled}
            onClick={handleConfirm}
            className="w-full py-2.5 rounded-md bg-[#facc15]/90 hover:bg-[#facc15] disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold text-xs uppercase tracking-wide transition-all flex items-center justify-center gap-2"
          >
            <Check size={16} strokeWidth={3} />
            Confirmar ({selectedDates.length} {selectedDates.length === 1 ? 'dia' : 'dias'} · {selectedTimes.length || 0} {selectedTimes.length === 1 ? 'horário' : 'horários'})
          </button>
        </div>
      </div>

      {/* Analog Time Picker Modal for Adding/Editing Individual Times */}
      <TimePickerModal
        isOpen={showTimePicker}
        onClose={() => {
          setShowTimePicker(false);
          setEditingTimeTarget(null);
        }}
        initialTime={editingTimeTarget || selectedTimes[selectedTimes.length - 1] || '09:00'}
        onSelectTime={handleTimePicked}
      />

      {/* Super Panel Overview for ALL Scheduled Tasks */}
      <ScheduledTasksOverviewModal
        isOpen={isOverviewOpen}
        onClose={() => setIsOverviewOpen(false)}
        tasks={activeTasks}
        projects={projects}
        initialFilter={existingFreqFilter}
        onSelectTask={(taskObj) => {
          setTaskAction('existing');
          handleSelectExistingTask(taskObj.id);
        }}
      />
    </div>
  );
}
