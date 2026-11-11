import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Check, 
  Flag, 
  MoreVertical, 
  Repeat, 
  Bell, 
  Calendar as CalendarIcon,
  SlidersHorizontal,
  Layers,
  Plus
} from 'lucide-react';
import TimePickerModal from './TimePickerModal';
import CustomDatePickerModal from './CustomDatePickerModal';
import TimeSlotModal from './TimeSlotModal';
import ScheduledTasksOverviewModal from './ScheduledTasksOverviewModal';
import { getTaskTimes, getTaskDates, isTaskOnDate, parseYMD } from '../utils/taskSchedule';

export default function CalendarView({ store, onQuickCreateAt }) {
  const { state, addTask, addTasksForMultipleDates, updateTask, toggleTaskCompleted, setSelectedTaskId, setActiveView, calendarViewMode, setCalendarViewMode } = store;
  const openTaskDetail = (taskId) => {
    setSelectedTaskId(taskId);
    if (setActiveView) setActiveView('tasks-inbox');
  };
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayDate, setSelectedDayDate] = useState(new Date());
  const viewMode = calendarViewMode || 'month';
  const setViewMode = (mode) => {
    if (setCalendarViewMode) setCalendarViewMode(mode);
  };
  const [bookingSlot, setBookingSlot] = useState(null); // { dateStr, startTime, repeatMode } | null
  const [focusedSlotKey, setFocusedSlotKey] = useState(null);
  const [isScheduleOverviewOpen, setIsScheduleOverviewOpen] = useState(false);
  const lastTapRef = React.useRef({ key: '', ts: 0 });
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [timePickerTargetDate, setTimePickerTargetDate] = useState('');
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customModalTask, setCustomModalTask] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const shiftMonthSafe = (baseDate, deltaMonths) => {
    const d = new Date(baseDate);
    const keepDay = d.getDate();
    d.setDate(1);
    d.setMonth(d.getMonth() + deltaMonths);
    const maxDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    d.setDate(Math.min(keepDay, maxDay));
    return d;
  };

  const shiftYearSafe = (baseDate, deltaYears) => {
    const d = new Date(baseDate);
    const keepDay = d.getDate();
    const keepMonth = d.getMonth();
    d.setDate(1);
    d.setFullYear(d.getFullYear() + deltaYears, keepMonth, 1);
    const maxDay = new Date(d.getFullYear(), keepMonth + 1, 0).getDate();
    d.setDate(Math.min(keepDay, maxDay));
    return d;
  };

  const prevPeriod = () => {
    let d;
    if (viewMode === 'year') {
      d = shiftYearSafe(currentDate, -1);
    } else if (viewMode === 'month') {
      d = shiftMonthSafe(currentDate, -1);
    } else if (viewMode === 'week') {
      d = new Date(currentDate);
      d.setDate(d.getDate() - 7);
    } else if (viewMode === 'list') {
      d = new Date(currentDate);
      d.setDate(d.getDate() - 7);
      setSelectedDayDate(d);
    } else if (viewMode === '3days') {
      d = new Date(selectedDayDate);
      d.setDate(d.getDate() - 3);
      setSelectedDayDate(d);
    } else {
      d = new Date(selectedDayDate);
      d.setDate(d.getDate() - 1);
      setSelectedDayDate(d);
    }
    setCurrentDate(d);
  };

  const nextPeriod = () => {
    let d;
    if (viewMode === 'year') {
      d = shiftYearSafe(currentDate, 1);
    } else if (viewMode === 'month') {
      d = shiftMonthSafe(currentDate, 1);
    } else if (viewMode === 'week') {
      d = new Date(currentDate);
      d.setDate(d.getDate() + 7);
    } else if (viewMode === 'list') {
      d = new Date(currentDate);
      d.setDate(d.getDate() + 7);
      setSelectedDayDate(d);
    } else if (viewMode === '3days') {
      d = new Date(selectedDayDate);
      d.setDate(d.getDate() + 3);
      setSelectedDayDate(d);
    } else {
      d = new Date(selectedDayDate);
      d.setDate(d.getDate() + 1);
      setSelectedDayDate(d);
    }
    setCurrentDate(d);
  };

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  const formatDate = (d) => {
    if (!d) return '';
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const dy = String(d.getDate()).padStart(2, '0');
    return `${yr}-${mo}-${dy}`;
  };

  const selectedDayStr = formatDate(selectedDayDate);

  // Return the 7 days of the current week (Sunday to Saturday)
  const getWeekDays = () => {
    const curr = new Date(currentDate);
    const dayOfWeek = curr.getDay(); // 0 is Sunday
    const first = curr.getDate() - dayOfWeek;
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(curr);
      d.setDate(first + i);
      days.push(d);
    }
    return days;
  };

  // Return 3 days (focused on selected day)
  const get3Days = () => {
    const days = [];
    for (let i = 0; i < 3; i++) {
      const d = new Date(selectedDayDate);
      d.setDate(selectedDayDate.getDate() + i);
      days.push(d);
    }
    return days;
  };

  // Build full 6-week month calendar grid
  const getFullMonthGrid = () => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const prevMonthDays = new Date(year, month, 0).getDate();
    const currentMonthDays = new Date(year, month + 1, 0).getDate();
    
    const cells = [];
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      cells.push({
        date: new Date(year, month - 1, prevMonthDays - i),
        isCurrentMonth: false
      });
    }
    for (let i = 1; i <= currentMonthDays; i++) {
      cells.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }
    const totalCells = cells.length > 35 ? 42 : 35;
    const remaining = totalCells - cells.length;
    for (let i = 1; i <= remaining; i++) {
      cells.push({
        date: new Date(year, month + 1, i),
        isCurrentMonth: false
      });
    }
    return cells;
  };

  const weekDays = getWeekDays();
  const threeDays = get3Days();
  const monthGrid = getFullMonthGrid();

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const activeTasks = (state.tasks || []).filter(t => !t.deleted);

  // Match tasks that are scheduled for dStr directly OR via recurringDates!
  const getTasksForDate = (dStr) => {
    return activeTasks.filter(t => isTaskOnDate(t, dStr));
  };

  const getTaskTimesInHour = (task, hour) => {
    return getTaskTimes(task).filter(tm => parseInt(tm.split(':')[0], 10) === hour);
  };

  const handleOpenCustomModal = (taskObj = null) => {
    setCustomModalTask(taskObj);
    setIsCustomModalOpen(true);
  };

  const handleApplyCustomSchedule = ({ dates, times, pattern, taskAction, taskId, title, projectId, alarmEnabled, reminderOffset }) => {
    const alarmFields = {
      ...(alarmEnabled !== undefined ? { alarmEnabled } : {}),
      ...(reminderOffset !== undefined ? { reminderOffset } : {})
    };
    if (customModalTask || (taskAction === 'existing' && taskId)) {
      const targetId = customModalTask?.id || taskId;
      if (targetId && updateTask) {
        updateTask(targetId, {
          recurringDates: dates,
          dueDate: dates[0] || '',
          recurringTimes: times,
          startTime: times[0] || '',
          recurrencePattern: dates.length > 0 ? pattern : null,
          ...alarmFields
        });
      }
    } else if (title && addTasksForMultipleDates) {
      addTasksForMultipleDates(
        {
          title,
          projectId: projectId || 'inbox',
          dueDate: dates[0] || '',
          recurringTimes: times,
          startTime: times[0] || '',
          recurrencePattern: pattern,
          priority: 1,
          ...alarmFields
        },
        dates
      );
    }
    if (dates && dates[0]) {
      const parsed = parseYMD(dates[0]);
      if (parsed) {
        setSelectedDayDate(parsed);
        setCurrentDate(parsed);
      }
    }
  };

  const selectedDayTasks = getTasksForDate(selectedDayStr);

  const monthNamesLower = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
  ];
  const currentMonthName = monthNamesLower[currentDate.getMonth()];

  const handleOpenBookingSlot = (hour, targetDateStr = selectedDayStr, repeatMode = 'single') => {
    const startTime = `${String(hour).padStart(2, '0')}:00`;
    setBookingSlot({
      dateStr: targetDateStr,
      startTime,
      repeatMode
    });
  };

  // Detects rapid 2-tap (double tap / double click) on any calendar date cell -> opens '+' creation modal pre-filled
  const handleDateCellPress = (dStr, dayObj) => {
    const nowMs = Date.now();
    const isDouble = lastTapRef.current.key === `date:${dStr}` && (nowMs - lastTapRef.current.ts) < 420;
    lastTapRef.current = { key: `date:${dStr}`, ts: isDouble ? 0 : nowMs };

    setSelectedDayDate(dayObj);
    if (viewMode !== 'month' && (dayObj.getMonth() !== currentDate.getMonth() || dayObj.getFullYear() !== currentDate.getFullYear())) {
      setCurrentDate(dayObj);
    }

    if (isDouble) {
      if (onQuickCreateAt) {
        onQuickCreateAt(dStr, '');
      } else {
        handleOpenBookingSlot(9, dStr, viewMode === 'year' ? 'annual' : viewMode === 'week' ? 'weekly' : 'monthly');
      }
    }
  };

  // Detects rapid 2-tap on any hour slot -> opens '+' creation modal pre-filled with that exact date + HH:00
  const handleHourCellPress = (hour, targetDateStr = selectedDayStr, repeatMode = 'single') => {
    const startTime = `${String(hour).padStart(2, '0')}:00`;
    const key = `hour:${targetDateStr}:${startTime}`;
    const nowMs = Date.now();
    const isDouble = lastTapRef.current.key === key && (nowMs - lastTapRef.current.ts) < 450;
    lastTapRef.current = { key, ts: isDouble ? 0 : nowMs };
    setFocusedSlotKey(`${targetDateStr}-${hour}`);

    if (isDouble) {
      if (onQuickCreateAt) {
        onQuickCreateAt(targetDateStr, startTime);
      } else {
        handleOpenBookingSlot(hour, targetDateStr, repeatMode);
      }
    }
  };

  const handleConfirmTimeSlot = ({
    title,
    description,
    dates,
    dueDate,
    recurringTimes,
    startTime,
    endTime,
    projectId,
    priority,
    recurrencePattern,
    alarmEnabled,
    reminderOffset
  }) => {
    const validDates = Array.isArray(dates) && dates.length > 0 ? dates : [dueDate || selectedDayStr];
    const alarmFields = {
      ...(alarmEnabled !== undefined ? { alarmEnabled } : {}),
      ...(reminderOffset !== undefined ? { reminderOffset } : {})
    };
    if (validDates.length > 1 && addTasksForMultipleDates) {
      addTasksForMultipleDates(
        {
          title,
          description,
          dueDate: validDates[0],
          recurringTimes,
          startTime,
          endTime,
          projectId: projectId || 'inbox',
          priority: priority ?? 1,
          recurrencePattern,
          ...alarmFields
        },
        validDates
      );
    } else if (addTask) {
      addTask({
        title,
        description,
        dueDate: validDates[0],
        recurringDates: validDates,
        recurringTimes,
        startTime,
        endTime,
        projectId: projectId || 'inbox',
        priority: priority ?? 1,
        recurrencePattern,
        ...alarmFields
      });
    }
    if (validDates[0]) {
      const parsed = parseYMD(validDates[0]);
      if (parsed) {
        setSelectedDayDate(parsed);
        setCurrentDate(parsed);
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#000000] relative select-none">
      {/* Top Header */}
      <div className="px-4 py-3 flex items-center justify-between bg-[#000000] shrink-0 border-b border-[#141416]">
        {/* Month Name & Today Shortcut */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center gap-2">
            <h1 className="text-xl font-bold text-white tracking-tight capitalize">
              {viewMode === 'year' ? year : currentMonthName}
            </h1>
            <div className="flex items-center gap-1">
              <button 
                onClick={prevPeriod}
                className="p-1 text-neutral-400 hover:text-white"
                title="Anterior"
              >
                <ChevronLeft className="w-4 h-4 text-[#facc15]" />
              </button>
              <button 
                onClick={nextPeriod}
                className="p-1 text-neutral-400 hover:text-white"
                title="Próximo"
              >
                <ChevronRight className="w-4 h-4 text-[#facc15]" />
              </button>
            </div>
          </div>
        </div>

        {/* Top Right Actions: Hoje + Personalizar (columns dropdown removed) */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => {
              const now = new Date();
              setCurrentDate(now);
              setSelectedDayDate(now);
            }}
            className="text-xs px-3 py-1.5 text-neutral-200 bg-[#141417] hover:bg-[#1e1e22] rounded-[4px] font-bold border border-white/10 transition-colors"
            title="Ir para hoje"
          >
            Hoje
          </button>

          <button
            onClick={() => handleOpenCustomModal(null)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[4px] bg-[#141417] hover:bg-[#1e1e22] border border-white/15 hover:border-[#facc15]/45 text-neutral-200 hover:text-[#facc15] font-bold text-[11px] shrink-0 active:scale-95 transition-all"
            title="Personalizar dias, repetição e vários horários"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#facc15]/80" />
            <span>Personalizar</span>
          </button>
        </div>
      </div>

      {/* Spacious Segmented Mode Bar (Dia | Semanal | Mês | Anual | Lista) */}
      <div className="px-3 py-2 bg-[#070709] border-b border-[#18181c] shrink-0">
        <div className="grid grid-cols-5 gap-1 bg-[#111114] p-1 rounded-[6px] border border-white/10">
          {[
            { id: 'day', label: 'Dia' },
            { id: 'week', label: 'Semanal' },
            { id: 'month', label: 'Mês' },
            { id: 'year', label: 'Anual' },
            { id: 'list', label: 'Lista' }
          ].map(m => (
            <button
              key={m.id}
              onClick={() => setViewMode(m.id)}
              className={`py-2 rounded-[4px] text-[11px] font-extrabold transition-all text-center ${
                viewMode === m.id
                  ? 'bg-[#facc15]/15 text-[#facc15] border border-[#facc15]/45'
                  : 'text-neutral-400 hover:text-white border border-transparent'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* VIEW 1: LISTA (Orange accents) */}
      {viewMode === 'list' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Weekly Strip */}
          <div className="bg-[#000000] border-b border-[#18181c] px-3 py-2.5 shrink-0">
            <div className="grid grid-cols-7 gap-1 text-center">
              {['dom.', 'seg.', 'ter.', 'qua.', 'qui.', 'sex.', 'sáb.'].map(d => (
                <span key={d} className="text-[11px] text-neutral-400 font-medium">
                  {d}
                </span>
              ))}

              {weekDays.map(day => {
                const dStr = formatDate(day);
                const isSelected = dStr === selectedDayStr;
                const isToday = dStr === todayStr;
                const hasTasks = getTasksForDate(dStr).some(t => !t.completed);

                return (
                  <button
                    key={dStr}
                    onClick={() => handleDateCellPress(dStr, day)}
                    className="flex flex-col items-center justify-center py-1.5 rounded-[4px] transition-all"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                      isSelected
                        ? 'bg-[#facc15] text-black font-black'
                        : hasTasks
                        ? `bg-[#facc15]/22 border border-[#facc15]/60 ${isToday ? 'text-[#facc15] ring-1 ring-[#facc15]' : 'text-white'}`
                        : isToday
                        ? 'border border-[#facc15]/80 text-[#facc15]'
                        : 'text-neutral-200 hover:bg-[#1c1c1e]'
                    }`}>
                      {day.getDate()}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Agenda Event Cards */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-32">
            <div className="flex items-center justify-between pb-1">
              <span className="text-base font-bold text-white capitalize">
                {selectedDayStr === todayStr ? 'Hoje' : selectedDayDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
              <span className="text-xs text-neutral-500 font-mono">
                {selectedDayTasks.length} {selectedDayTasks.length === 1 ? 'evento' : 'eventos'}
              </span>
            </div>

            <div className="space-y-2.5">
              {selectedDayTasks.map(task => {
                const leftBarColor = task.priority === 3 ? 'bg-[#facc15]' : task.priority === 2 ? 'bg-[#facc15]/80' : task.priority === 1 ? 'bg-[#facc15]/50' : 'bg-neutral-600';
                return (
                  <div
                    key={task.id}
                    onClick={() => openTaskDetail(task.id)}
                    className="bg-[#141417] rounded-[4px] overflow-hidden flex items-stretch border border-[#26262a] cursor-pointer hover:border-neutral-500 transition-all active:scale-[0.99]"
                  >
                    <div className={`w-1.5 shrink-0 ${leftBarColor}`} />
                    <div className="flex-1 p-3.5 flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold text-white tracking-wide truncate">
                          {task.title}
                        </h3>
                        {task.description && (
                          <p className="text-[11px] text-neutral-400 truncate mt-0.5">{task.description}</p>
                        )}
                        <div className="flex items-center flex-wrap gap-2 mt-1 text-xs text-[#facc15] font-semibold">
                          <span>{selectedDayStr === todayStr ? 'Hoje' : (task.dueDate || selectedDayStr)}</span>
                          {getTaskTimes(task).length > 0 && (
                            <span>• {getTaskTimes(task).join(', ')}{task.endTime && getTaskTimes(task).length === 1 ? ` - ${task.endTime}` : ''}</span>
                          )}
                          {getTaskDates(task).length > 1 && (
                            <span className="text-[10px] text-[#facc15]/80 font-medium flex items-center gap-0.5">
                              <Repeat className="w-2.5 h-2.5 text-[#facc15]" />
                              {getTaskDates(task).length} dias
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-[#facc15] shrink-0">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenCustomModal(task);
                          }}
                          className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                          title="Personalizar dias e horários"
                        >
                          <Repeat className="w-4 h-4 text-[#facc15]" />
                        </button>
                        <Bell className="w-4 h-4 text-[#facc15]/70" />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTaskCompleted(task.id);
                          }}
                          className={`w-4 h-4 rounded-[3px] border flex items-center justify-center transition-colors ${
                            task.completed ? 'bg-[#facc15] border-[#facc15] text-black' : 'border-neutral-500'
                          }`}
                        >
                          {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {selectedDayTasks.length === 0 && (
                <div className="py-14 text-center text-neutral-500">
                  <div className="w-16 h-16 rounded-[6px] bg-[#141416] border border-[#262629] mx-auto mb-3 flex items-center justify-center">
                    <CalendarIcon className="w-8 h-8 text-[#facc15]/60" />
                  </div>
                  <p className="text-sm font-semibold text-neutral-300">Essa data está livre de tarefas</p>
                  <p className="text-xs text-neutral-500 mt-1">Dê 2 toques em qualquer dia ou toque em Reservar Horário</p>
                </div>
              )}
            </div>

            {/* Hourly Booking Slots (24h) */}
            <div className="pt-4 border-t border-[#18181c] space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block mb-2">
                Horários (24h)
              </span>
              {hours.map(hour => {
                const hourFormatted = `${String(hour).padStart(2, '0')}:00`;
                const slotTasks = selectedDayTasks.filter(t => getTaskTimesInHour(t, hour).length > 0);
                const isFocused = focusedSlotKey === `${selectedDayStr}-${hour}`;

                return (
                  <div
                    key={hour}
                    onClick={() => handleHourCellPress(hour, selectedDayStr, 'single')}
                    className={`flex items-start gap-3 py-1.5 border-b border-[#141416] cursor-pointer rounded-[4px] px-1 transition-colors ${
                      isFocused ? 'bg-[#facc15]/5' : ''
                    }`}
                  >
                    <span className="w-14 text-xs font-mono font-semibold text-neutral-400 pt-1">
                      {hourFormatted}
                    </span>
                    <div className="flex-1 space-y-1">
                      {slotTasks.map(st => (
                        <div
                          key={st.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            openTaskDetail(st.id);
                          }}
                          className="px-2.5 py-2 bg-[#facc15]/15 border border-[#facc15]/35 rounded-[4px] text-xs text-[#facc15] font-bold flex items-center justify-between gap-2 cursor-pointer"
                        >
                          <div className="min-w-0 flex-1">
                            <span className="truncate block">{st.title}</span>
                            {st.description && (
                              <span className="text-[10px] text-neutral-300 font-normal truncate block">{st.description}</span>
                            )}
                          </div>
                          <span className="text-[10px] font-mono shrink-0">{getTaskTimesInHour(st, hour).join(', ')}</span>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenBookingSlot(hour, selectedDayStr, 'single');
                        }}
                        className="w-full text-left py-1.5 px-2.5 rounded-[4px] text-xs text-neutral-500 hover:text-[#facc15] hover:bg-[#141417] cursor-pointer transition-colors"
                      >
                        + Reservar horário
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: MÊS (Exact Reproduction of media_1793160069391_067f42d6.jpg in Orange) */}
      {viewMode === 'month' && (
        <div className="flex-1 overflow-y-auto px-4 py-2 pb-32">
          {/* Day of week header row */}
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-neutral-400 font-medium py-2">
            {['dom.', 'seg.', 'ter.', 'qua.', 'qui.', 'sex.', 'sáb.'].map(d => (
              <span key={d}>{d}</span>
            ))}
          </div>

          {/* Full Month Grid */}
          <div className="grid grid-cols-7 gap-y-2 text-center">
            {monthGrid.map((item, idx) => {
              const dStr = formatDate(item.date);
              const isSelected = dStr === selectedDayStr;
              const isToday = dStr === todayStr;
              const hasTasks = getTasksForDate(dStr).some(t => !t.completed);

              return (
                <button
                  key={idx}
                  onClick={() => handleDateCellPress(dStr, item.date)}
                  className="flex flex-col items-center justify-center py-1.5 transition-all"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all ${
                    isSelected
                      ? 'bg-[#facc15] text-black font-black'
                      : hasTasks
                      ? `bg-[#facc15]/22 border border-[#facc15]/60 font-bold ${
                          !item.isCurrentMonth
                            ? 'text-neutral-300 opacity-75'
                            : isToday
                            ? 'text-[#facc15] ring-1 ring-[#facc15]'
                            : 'text-white'
                        }`
                      : !item.isCurrentMonth
                      ? 'text-neutral-600 font-semibold'
                      : isToday
                      ? 'text-[#facc15] font-bold ring-1 ring-[#facc15]'
                      : 'text-neutral-200 font-semibold hover:bg-[#1c1c1e]'
                  }`}>
                    {item.date.getDate()}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Day Agenda Cards or Empty State underneath */}
          <div className="mt-6 pt-4 border-t border-[#1c1c1e] space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-bold text-white capitalize truncate">
                {selectedDayStr === todayStr ? 'Hoje' : selectedDayDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
              </span>
              <button
                type="button"
                onClick={() => handleOpenBookingSlot(9, selectedDayStr, 'monthly')}
                className="px-2.5 py-1 rounded-[4px] bg-[#facc15]/15 hover:bg-[#facc15]/25 border border-[#facc15]/40 text-[#facc15] text-[11px] font-black flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Reservar Horário</span>
              </button>
            </div>

            {selectedDayTasks.length > 0 ? (
              <div className="space-y-2">
                {selectedDayTasks.map(t => {
                  const timesList = getTaskTimes(t);
                  const datesCount = getTaskDates(t).length;
                  return (
                  <div
                    key={t.id}
                    onClick={() => openTaskDetail(t.id)}
                    className="p-3 bg-[#1c1c1e] border border-[#2c2c2e] rounded-[4px] flex items-center justify-between gap-2 cursor-pointer"
                  >
                    <div className="min-w-0 flex-1">
                      <span className={`text-xs font-semibold block truncate ${t.completed ? 'line-through text-neutral-500' : 'text-white'}`}>
                        {t.title}
                      </span>
                      {t.description && (
                        <span className="text-[11px] text-neutral-400 block truncate mt-0.5">
                          {t.description}
                        </span>
                      )}
                      {(timesList.length > 0 || datesCount > 1) && (
                        <div className="text-[11px] text-[#facc15] mt-0.5 font-medium flex items-center flex-wrap gap-2">
                          {timesList.length > 0 && <span>{timesList.join(' • ')}</span>}
                          {datesCount > 1 && (
                            <span className="text-[10px] text-[#facc15]/80 flex items-center gap-0.5">
                              <Repeat className="w-3 h-3 text-[#facc15]" /> {datesCount}d
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenCustomModal(t);
                      }}
                      className="p-1.5 rounded-lg hover:bg-white/10 text-[#facc15]"
                      title="Personalizar repetição e horários"
                    >
                      <Repeat className="w-3.5 h-3.5 text-[#facc15]" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTaskCompleted(t.id);
                      }}
                      className={`w-4 h-4 rounded-[3px] border flex items-center justify-center ${
                        t.completed ? 'bg-[#facc15]/20 border-[#facc15] text-[#facc15]' : 'border-neutral-500'
                      }`}
                    >
                      {t.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>
                    </div>
                  </div>
                  );
                })}
              </div>
            ) : (
              /* Empty state */
              <div className="py-8 text-center text-neutral-500">
                <div className="w-16 h-16 rounded-[6px] bg-[#141416] border border-[#262629] mx-auto mb-3 flex items-center justify-center">
                  <CalendarIcon className="w-8 h-8 text-[#facc15]/60" />
                </div>
                <p className="text-sm font-semibold text-neutral-300">Essa data está livre de tarefas</p>
                <p className="text-xs text-neutral-500 mt-1">Toque em Personalizado acima para programar</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 3: SEMANA (7-Day Column Timeline) */}
      {viewMode === 'week' && (
        <div className="flex-1 overflow-x-auto pb-32">
          <div className="min-w-[700px] p-3 space-y-2">
            <div className="grid grid-cols-8 gap-1 border-b border-[#222226] pb-2 text-center text-xs text-neutral-400 font-semibold sticky top-0 bg-[#000000] z-10">
              <div>Hora</div>
              {weekDays.map(d => (
                <div key={formatDate(d)} className={formatDate(d) === selectedDayStr ? 'text-[#facc15] font-bold' : ''}>
                  <div>{d.toLocaleDateString('pt-BR', { weekday: 'short' })}</div>
                  <div>{d.getDate()}</div>
                </div>
              ))}
            </div>

            {hours.map(hour => (
              <div key={hour} className="grid grid-cols-8 gap-1 min-h-12 border-t border-[#18181c] py-1 text-xs">
                <div className="text-neutral-500 font-mono text-center pt-1">
                  {String(hour).padStart(2, '0')}:00
                </div>
                {weekDays.map(d => {
                  const dStr = formatDate(d);
                  const tasks = getTasksForDate(dStr).filter(t => getTaskTimesInHour(t, hour).length > 0);
                  return (
                    <div
                      key={dStr}
                      onClick={() => handleHourCellPress(hour, dStr, 'weekly')}
                      className={`bg-[#141416] hover:bg-[#1c1c1e] rounded-lg p-1 min-h-10 cursor-pointer border space-y-0.5 transition-colors relative group ${
                        focusedSlotKey === `${dStr}-${hour}` ? 'border-[#facc15]/50' : 'border-transparent hover:border-[#facc15]/30'
                      }`}
                    >
                      {focusedSlotKey === `${dStr}-${hour}` && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenBookingSlot(hour, dStr, 'weekly');
                          }}
                          className="absolute top-0.5 right-0.5 z-10 px-1 py-0.5 rounded-[3px] bg-[#18181c] border border-[#facc15]/60 text-[#facc15] text-[8px] font-bold"
                          title="Reservar com repetição"
                        >
                          +
                        </button>
                      )}
                      {tasks.map(t => (
                        <div
                          key={t.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            openTaskDetail(t.id);
                          }}
                          className="bg-[#facc15]/15 border border-[#facc15]/40 text-[#facc15] font-semibold rounded-[3px] p-1 text-[10px] truncate shadow-sm"
                        >
                          {getTaskTimesInHour(t, hour)[0]} {t.title}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 4: 3 DIAS */}
      {viewMode === '3days' && (
        <div className="flex-1 overflow-x-auto pb-32">
          <div className="min-w-[340px] p-3 space-y-2">
            <div className="grid grid-cols-4 gap-2 border-b border-[#222226] pb-2 text-center text-xs text-neutral-400 font-semibold sticky top-0 bg-[#000000] z-10">
              <div>Hora</div>
              {threeDays.map(d => (
                <div key={formatDate(d)} className={formatDate(d) === selectedDayStr ? 'text-[#facc15] font-bold' : ''}>
                  <div>{d.toLocaleDateString('pt-BR', { weekday: 'short' })}</div>
                  <div>{d.getDate()}</div>
                </div>
              ))}
            </div>

            {hours.map(hour => (
              <div key={hour} className="grid grid-cols-4 gap-2 min-h-14 border-t border-[#18181c] py-1 text-xs">
                <div className="text-neutral-500 font-mono text-center pt-1">
                  {String(hour).padStart(2, '0')}:00
                </div>
                {threeDays.map(d => {
                  const dStr = formatDate(d);
                  const tasks = getTasksForDate(dStr).filter(t => getTaskTimesInHour(t, hour).length > 0);
                  return (
                    <div
                      key={dStr}
                      onClick={() => handleHourCellPress(hour, dStr, 'weekly')}
                      className={`relative bg-[#141416] hover:bg-[#1c1c1e] rounded-[4px] p-1.5 min-h-12 cursor-pointer border transition-colors ${
                        focusedSlotKey === `${dStr}-${hour}` ? 'border-[#facc15]/50' : 'border-[#222226] hover:border-[#facc15]/30'
                      }`}
                    >
                      {focusedSlotKey === `${dStr}-${hour}` && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenBookingSlot(hour, dStr, 'weekly');
                          }}
                          className="absolute top-0.5 right-0.5 z-10 px-1.5 py-0.5 rounded-[3px] bg-[#18181c] border border-[#facc15]/60 text-[#facc15] text-[9px] font-bold"
                        >
                          + Reservar
                        </button>
                      )}
                      {tasks.map(t => (
                        <div
                          key={t.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            openTaskDetail(t.id);
                          }}
                          className="bg-[#facc15]/15 border border-[#facc15]/40 text-[#facc15] font-semibold rounded-[3px] p-1 text-[11px] truncate mb-1"
                        >
                          {getTaskTimesInHour(t, hour)[0]} {t.title}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 5: DIA */}
      {viewMode === 'day' && (
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 pb-32">
          <div className="text-sm font-bold text-white mb-2">
            {selectedDayDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
          {hours.map(hour => {
            const hourFormatted = `${String(hour).padStart(2, '0')}:00`;
            const tasksInSlot = selectedDayTasks.filter(t => getTaskTimesInHour(t, hour).length > 0);
            return (
              <div key={hour} className="flex items-start gap-3 py-2 border-b border-[#18181c]">
                <span className="w-16 text-xs font-mono font-bold text-neutral-400 pt-1">
                  {hourFormatted}
                </span>
                <div className="flex-1 space-y-1.5">
                  <div
                    onClick={() => handleHourCellPress(hour, selectedDayStr, 'single')}
                    className={`space-y-1.5 min-h-[28px] rounded-[4px] cursor-pointer transition-colors ${
                      focusedSlotKey === `${selectedDayStr}-${hour}` ? 'bg-[#facc15]/5 p-1' : ''
                    }`}
                  >
                    {tasksInSlot.map(t => (
                      <div
                        key={t.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          openTaskDetail(t.id);
                        }}
                        className="bg-[#1c1c1e] border border-[#2c2c2e] hover:border-[#facc15]/40 p-3 rounded-[4px] flex items-center justify-between gap-2 cursor-pointer transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <span className="text-xs font-bold text-white truncate block">{t.title}</span>
                          {t.description && (
                            <span className="text-[11px] text-neutral-400 truncate block mt-0.5">{t.description}</span>
                          )}
                        </div>
                        <span className="text-[11px] text-[#facc15] font-mono shrink-0">{getTaskTimesInHour(t, hour).join(', ')}</span>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenBookingSlot(hour, selectedDayStr, 'single');
                      }}
                      className={`w-full text-left py-1.5 px-2 rounded-[4px] text-xs cursor-pointer transition-colors ${
                        tasksInSlot.length === 0
                          ? 'text-neutral-500 hover:text-[#facc15] hover:bg-[#141417]'
                          : 'text-[11px] text-neutral-600 hover:text-[#facc15]'
                      }`}
                    >
                      + Reservar este horário
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 6: ANO */}
      {viewMode === 'year' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 pb-32">
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => handleOpenCustomModal(null)}
              className="flex-1 py-2.5 px-3 rounded-[6px] bg-[#facc15]/15 hover:bg-[#facc15]/25 border border-[#facc15]/40 text-[#facc15] text-xs font-black flex items-center justify-center gap-1.5 transition-all"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Personalizar Anual</span>
            </button>
            <button
              type="button"
              onClick={() => setIsScheduleOverviewOpen(true)}
              className="flex-1 py-2.5 px-3 rounded-[6px] bg-[#141417] hover:bg-[#1c1c20] border border-white/10 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
            >
              <Layers className="w-3.5 h-3.5 text-[#facc15]" />
              <span>Todas Agendadas</span>
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
          {monthNamesLower.map((mName, mIdx) => {
            const firstWeekday = new Date(year, mIdx, 1).getDay();
            const daysCount = new Date(year, mIdx + 1, 0).getDate();
            return (
              <div
                key={mIdx}
                onClick={() => {
                  const d = new Date(currentDate);
                  d.setDate(1);
                  d.setMonth(mIdx);
                  setCurrentDate(d);
                  setViewMode('month');
                }}
                className="bg-[#1c1c1e] hover:bg-[#28282e] border border-[#28282b] rounded-[6px] p-3 cursor-pointer transition-all hover:scale-102"
              >
                <h3 className="text-xs font-bold text-white capitalize mb-2">{mName}</h3>
                <div className="grid grid-cols-7 gap-0.5 text-[8px] text-neutral-500 text-center">
                  {['D','S','T','Q','Q','S','S'].map((d, i) => <span key={i}>{d}</span>)}
                  {Array.from({ length: firstWeekday }).map((_, i) => <span key={`empty-${i}`} />)}
                  {Array.from({ length: daysCount }).map((_, i) => {
                    const dayNum = i + 1;
                    const dStr = `${year}-${String(mIdx + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                    const hasTask = getTasksForDate(dStr).some(t => !t.completed);
                    const isTodayCell = dStr === todayStr;
                    return (
                      <span
                        key={dayNum}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDateCellPress(dStr, new Date(year, mIdx, dayNum));
                        }}
                        className={`w-[18px] h-[18px] mx-auto rounded-full flex items-center justify-center leading-none cursor-pointer transition-colors ${
                          hasTask
                            ? `bg-[#facc15]/25 border border-[#facc15]/60 font-bold ${isTodayCell ? 'text-[#facc15] ring-1 ring-[#facc15]' : 'text-white'}`
                            : isTodayCell
                            ? 'border border-[#facc15] text-[#facc15] font-bold'
                            : 'text-neutral-300 hover:bg-white/10'
                        }`}
                      >
                        {dayNum}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
          </div>
        </div>
      )}

      {/* Personalizado Modal (Diário / Semanal / Mensal / Anual + Vários Horários) */}
      {/* Interactive Booking Modal for Time Slots */}
      <TimeSlotModal
        isOpen={Boolean(bookingSlot)}
        onClose={() => setBookingSlot(null)}
        initialDate={bookingSlot?.dateStr || selectedDayStr}
        initialStartTime={bookingSlot?.startTime || '09:00'}
        initialRepeatMode={bookingSlot?.repeatMode || 'single'}
        projects={state.projects}
        onConfirm={handleConfirmTimeSlot}
      />

      {/* Full Super Overview Modal of ALL Scheduled Tasks */}
      <ScheduledTasksOverviewModal
        isOpen={isScheduleOverviewOpen}
        onClose={() => setIsScheduleOverviewOpen(false)}
        tasks={activeTasks}
        projects={state.projects}
        initialFilter={viewMode === 'year' ? 'annual' : 'all'}
        onSelectTask={(taskObj) => handleOpenCustomModal(taskObj)}
      />

      <CustomDatePickerModal
        isOpen={isCustomModalOpen}
        onClose={() => {
          setIsCustomModalOpen(false);
          setCustomModalTask(null);
        }}
        initialMode={viewMode}
        initialDates={customModalTask ? getTaskDates(customModalTask) : [selectedDayStr]}
        initialTimes={customModalTask ? getTaskTimes(customModalTask) : []}
        allowTaskSelection={!customModalTask}
        tasks={activeTasks}
        projects={state.projects}
        initialAlarmEnabled={customModalTask ? customModalTask.alarmEnabled !== false : true}
        initialReminderOffset={customModalTask?.reminderOffset ?? 0}
        onApplyCustomSchedule={handleApplyCustomSchedule}
        onSelectDates={(dates, _firstTime, meta) => {
          if (customModalTask) {
            handleApplyCustomSchedule({
              dates,
              times: meta?.times || [],
              pattern: meta?.pattern || null,
              alarmEnabled: meta?.alarmEnabled,
              reminderOffset: meta?.reminderOffset,
              taskAction: 'existing',
              taskId: customModalTask.id
            });
          }
        }}
      />
    </div>
  );
}
