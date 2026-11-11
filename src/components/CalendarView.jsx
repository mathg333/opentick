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
  Columns, 
  List, 
  CalendarDays, 
  LayoutGrid,
  SlidersHorizontal
} from 'lucide-react';
import TimePickerModal from './TimePickerModal';
import CustomDatePickerModal from './CustomDatePickerModal';
import { getTaskTimes, getTaskDates, isTaskOnDate, parseYMD } from '../utils/taskSchedule';

export default function CalendarView({ store }) {
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
  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');
  const [selectedSlotHour, setSelectedSlotHour] = useState(null);
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);
  const [timePickerTargetDate, setTimePickerTargetDate] = useState('');
  const [isCustomModalOpen, setIsCustomModalOpen] = useState(false);
  const [customModalTask, setCustomModalTask] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevPeriod = () => {
    const d = new Date(currentDate);
    if (viewMode === 'year') {
      d.setFullYear(d.getFullYear() - 1);
    } else if (viewMode === 'month') {
      d.setMonth(d.getMonth() - 1);
    } else if (viewMode === 'week') {
      d.setDate(d.getDate() - 7);
    } else if (viewMode === '3days') {
      d.setDate(d.getDate() - 3);
    } else {
      d.setDate(d.getDate() - 1);
      setSelectedDayDate(d);
    }
    setCurrentDate(d);
  };

  const nextPeriod = () => {
    const d = new Date(currentDate);
    if (viewMode === 'year') {
      d.setFullYear(d.getFullYear() + 1);
    } else if (viewMode === 'month') {
      d.setMonth(d.getMonth() + 1);
    } else if (viewMode === 'week') {
      d.setDate(d.getDate() + 7);
    } else if (viewMode === '3days') {
      d.setDate(d.getDate() + 3);
    } else {
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

  // Match tasks that are scheduled for dStr directly OR via recurringDates!
  const getTasksForDate = (dStr) => {
    return state.tasks.filter(t => isTaskOnDate(t, dStr));
  };

  const getTaskTimesInHour = (task, hour) => {
    return getTaskTimes(task).filter(tm => parseInt(tm.split(':')[0], 10) === hour);
  };

  const handleOpenCustomModal = (taskObj = null) => {
    setCustomModalTask(taskObj);
    setIsCustomModalOpen(true);
  };

  const handleApplyCustomSchedule = ({ dates, times, pattern, taskAction, taskId, title, projectId }) => {
    if (customModalTask || (taskAction === 'existing' && taskId)) {
      const targetId = customModalTask?.id || taskId;
      if (targetId && updateTask) {
        updateTask(targetId, {
          recurringDates: dates,
          dueDate: dates[0] || '',
          recurringTimes: times,
          startTime: times[0] || '',
          recurrencePattern: pattern
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
          priority: 1
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

  const handleAddQuickAtSlot = (hour, targetDateStr = selectedDayStr) => {
    if (!quickTitle.trim()) return;
    const startTime = `${String(hour).padStart(2, '0')}:00`;
    const endTime = `${String(hour + 1).padStart(2, '0')}:00`;
    addTask({
      title: quickTitle.trim(),
      dueDate: targetDateStr,
      recurringDates: [targetDateStr],
      startTime,
      endTime,
      priority: 2
    });
    setQuickTitle('');
    setSelectedSlotHour(null);
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

        {/* Action icons on top right: Hoje, View switcher, options */}
        <div className="flex items-center gap-1.5 relative">
          <button
            onClick={() => {
              const now = new Date();
              setCurrentDate(now);
              setSelectedDayDate(now);
            }}
            className="text-xs px-2.5 py-1 text-neutral-300 bg-[#1c1c1e] hover:bg-[#2c2c2e] rounded-lg font-semibold border border-[#2c2c2e]"
            title="Ir para hoje"
          >
            Hoje
          </button>

          {/* View switcher dropdown icon */}
          <button
            onClick={() => setIsViewMenuOpen(!isViewMenuOpen)}
            className="p-2 text-neutral-300 hover:text-[#facc15] rounded-lg active:bg-neutral-800 transition-colors"
            title="Alternar Modo de Visualização"
          >
            <Columns className="w-5 h-5 text-[#facc15]" />
          </button>

          

          {/* View Switcher Dropdown Modal */}
          {isViewMenuOpen && (
            <div 
              onClick={() => setIsViewMenuOpen(false)}
              className="fixed inset-0 z-40 bg-transparent"
            >
              <div 
                onClick={(e) => e.stopPropagation()}
                className="absolute top-14 right-4 z-50 w-48 bg-[#1c1c1e] border border-[#2c2c2e] rounded-2xl shadow-2xl py-2 overflow-hidden animate-in fade-in"
              >
                {[
                  { id: 'list', label: 'Lista', icon: List },
                  { id: 'year', label: 'Ano', icon: LayoutGrid },
                  { id: 'month', label: 'Mês', icon: CalendarDays },
                  { id: 'week', label: 'Semana', icon: Columns },
                  { id: '3days', label: '3 Dias', icon: Columns },
                  { id: 'day', label: 'Dia', icon: CalendarIcon }
                ].map(item => {
                  const Icon = item.icon;
                  const isChecked = viewMode === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setViewMode(item.id);
                        setIsViewMenuOpen(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-xs font-medium flex items-center justify-between text-neutral-200 hover:bg-[#28282e] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className={`w-4 h-4 ${isChecked ? 'text-[#facc15]' : 'text-neutral-400'}`} />
                        <span className={isChecked ? 'text-[#facc15] font-bold' : ''}>{item.label}</span>
                      </div>
                      {isChecked && <Check className="w-4 h-4 text-[#facc15] stroke-[2.5]" />}
                    </button>
                  );
                })}
                <div className="my-1 border-t border-white/10" />
                <button
                  onClick={() => {
                    setIsViewMenuOpen(false);
                    handleOpenCustomModal(null);
                  }}
                  className="w-full px-4 py-2.5 text-left text-xs font-black flex items-center gap-3 text-[#facc15] hover:bg-[#28282e] transition-colors"
                >
                  <SlidersHorizontal className="w-4 h-4 text-[#facc15]" />
                  <span>Personalizado</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Persistent Mode Bar + Prominent 'Personalizado' Customization Button across ALL modes */}
      <div className="px-2.5 py-2 bg-[#070709] border-b border-[#18181c] flex items-center justify-between gap-1.5 shrink-0">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar flex-1 min-w-0">
          {[
            { id: 'day', label: 'Dia' },
            { id: '3days', label: '3D' },
            { id: 'week', label: 'Sem' },
            { id: 'month', label: 'Mês' },
            { id: 'year', label: 'Ano' },
            { id: 'list', label: 'Lista' }
          ].map(m => (
            <button
              key={m.id}
              onClick={() => setViewMode(m.id)}
              className={`px-2 py-1 rounded-lg text-[10px] font-bold shrink-0 transition-all border ${
                viewMode === m.id
                  ? 'bg-[#facc15]/20 text-[#facc15] border-[#facc15]/50'
                  : 'bg-[#141416] text-neutral-400 border-[#262629] hover:text-white'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => handleOpenCustomModal(null)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#facc15] hover:bg-[#eab308] text-black font-black text-[11px] shrink-0 shadow-md shadow-[#facc15]/20 active:scale-95 transition-all"
          title="Personalizar vários dias, datas e horários"
        >
          <SlidersHorizontal className="w-3.5 h-3.5 text-black" />
          <span>Personalizado</span>
        </button>
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
                const hasTasks = getTasksForDate(dStr).some(t => !t.completed);

                return (
                  <button
                    key={dStr}
                    onClick={() => {
                      setSelectedDayDate(day);
                      setCurrentDate(day);
                    }}
                    className="flex flex-col items-center justify-center py-1 rounded-xl transition-all"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                      isSelected
                        ? 'bg-[#facc15] text-black font-bold shadow-lg'
                        : 'text-neutral-200 hover:bg-[#1c1c1e]'
                    }`}>
                      {day.getDate()}
                    </div>
                    <div className="h-1.5 flex items-center justify-center mt-0.5">
                      {hasTasks && (
                        <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-[#facc15]'}`} />
                      )}
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
                    className="bg-[#1c1c1e] rounded-xl overflow-hidden flex items-stretch border border-[#28282b] shadow-lg cursor-pointer hover:border-neutral-500 transition-all active:scale-[0.99]"
                  >
                    <div className={`w-1.5 shrink-0 ${leftBarColor}`} />
                    <div className="flex-1 p-3.5 flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold text-white tracking-wide truncate">
                          {task.title}
                        </h3>
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
                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
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
                  <div className="w-16 h-16 rounded-2xl bg-[#141416] border border-[#262629] mx-auto mb-3 flex items-center justify-center">
                    <CalendarIcon className="w-8 h-8 text-[#facc15]/60" />
                  </div>
                  <p className="text-sm font-semibold text-neutral-300">Essa data está livre de tarefas</p>
                  <p className="text-xs text-neutral-500 mt-1">Toque em Personalizado acima para programar</p>
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
                const isEditingThisSlot = selectedSlotHour === hour;
                const slotTasks = selectedDayTasks.filter(t => getTaskTimesInHour(t, hour).length > 0);

                return (
                  <div key={hour} className="flex items-center gap-3 py-1.5 border-b border-[#141416]">
                    <span className="w-14 text-xs font-mono font-semibold text-neutral-400">
                      {hourFormatted}
                    </span>
                    <div className="flex-1">
                      {isEditingThisSlot ? (
                        <div className="bg-[#1c1c1e] p-2 rounded-xl border border-[#facc15] flex items-center gap-2">
                          <input
                            type="text"
                            placeholder={`Evento às ${hourFormatted}...`}
                            value={quickTitle}
                            onChange={(e) => setQuickTitle(e.target.value)}
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleAddQuickAtSlot(hour);
                              if (e.key === 'Escape') setSelectedSlotHour(null);
                            }}
                            className="flex-1 bg-transparent text-xs text-white placeholder-neutral-500 focus:outline-none"
                          />
                          <button
                            onClick={() => handleAddQuickAtSlot(hour)}
                            className="px-2.5 py-1 bg-[#facc15] text-black font-bold rounded-lg text-xs font-bold"
                          >
                            Salvar
                          </button>
                          <button
                            onClick={() => setSelectedSlotHour(null)}
                            className="text-xs text-neutral-400 hover:text-white px-1"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {slotTasks.map(st => (
                            <div
                              key={st.id}
                              onClick={() => openTaskDetail(st.id)}
                              className="px-2.5 py-1.5 bg-[#facc15]/15 border border-[#facc15]/35 rounded-lg text-xs text-[#facc15] font-bold flex items-center justify-between cursor-pointer"
                            >
                              <span className="truncate">{st.title}</span>
                              <span className="text-[10px] font-mono ml-2 shrink-0">{getTaskTimesInHour(st, hour).join(', ')}</span>
                            </div>
                          ))}
                          <div
                            onClick={() => setSelectedSlotHour(hour)}
                            className="py-1 px-2 rounded-lg text-xs text-neutral-600 hover:text-neutral-400 hover:bg-[#141416] cursor-pointer transition-colors"
                          >
                            + Reservar horário
                          </div>
                        </div>
                      )}
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
        <div className="flex-1 flex flex-col overflow-y-auto px-4 py-2 pb-32">
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
                  onClick={() => {
                    setSelectedDayDate(item.date);
                    if (!item.isCurrentMonth) {
                      setCurrentDate(item.date);
                    }
                  }}
                  className="flex flex-col items-center justify-center py-1 transition-all"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                    isSelected
                      ? 'bg-[#facc15] text-black font-bold font-bold shadow-lg scale-105'
                      : !item.isCurrentMonth
                      ? 'text-neutral-600'
                      : isToday
                      ? 'text-[#facc15] font-bold ring-1 ring-[#facc15]'
                      : 'text-neutral-200 hover:bg-[#1c1c1e]'
                  }`}>
                    {item.date.getDate()}
                  </div>
                  <div className="h-1.5 flex items-center justify-center mt-0.5">
                    {hasTasks && (
                      <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-[#facc15]'}`} />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Selected Day Agenda Cards or Empty State underneath */}
          <div className="mt-6 pt-4 border-t border-[#1c1c1e] space-y-3">
            <span className="text-sm font-bold text-white capitalize block">
              {selectedDayStr === todayStr ? 'Hoje' : selectedDayDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>

            {selectedDayTasks.length > 0 ? (
              <div className="space-y-2">
                {selectedDayTasks.map(t => {
                  const timesList = getTaskTimes(t);
                  const datesCount = getTaskDates(t).length;
                  return (
                  <div
                    key={t.id}
                    onClick={() => openTaskDetail(t.id)}
                    className="p-3 bg-[#1c1c1e] border border-[#2c2c2e] rounded-xl flex items-center justify-between gap-2 cursor-pointer"
                  >
                    <div className="min-w-0 flex-1">
                      <span className={`text-xs font-semibold block truncate ${t.completed ? 'line-through text-neutral-500' : 'text-white'}`}>
                        {t.title}
                      </span>
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
                      className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                        t.completed ? 'bg-[#facc15] border-[#facc15] text-black' : 'border-neutral-500'
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
                <div className="w-16 h-16 rounded-2xl bg-[#141416] border border-[#262629] mx-auto mb-3 flex items-center justify-center">
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
                      onClick={() => handleAddQuickAtSlot(hour, dStr)}
                      className="bg-[#141416] hover:bg-[#1c1c1e] rounded-lg p-1 min-h-10 cursor-pointer border border-transparent hover:border-[#28282b] space-y-0.5"
                    >
                      {tasks.map(t => (
                        <div
                          key={t.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            openTaskDetail(t.id);
                          }}
                          className="bg-[#facc15] text-black font-bold rounded p-1 text-[10px] truncate shadow-sm"
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
                      onClick={() => handleAddQuickAtSlot(hour, dStr)}
                      className="bg-[#141416] hover:bg-[#1c1c1e] rounded-lg p-1.5 min-h-12 cursor-pointer border border-[#222226]"
                    >
                      {tasks.map(t => (
                        <div
                          key={t.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            openTaskDetail(t.id);
                          }}
                          className="bg-[#facc15] text-black font-bold rounded p-1 text-[11px] truncate shadow-sm mb-1"
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
                  {tasksInSlot.map(t => (
                    <div
                      key={t.id}
                      onClick={() => openTaskDetail(t.id)}
                      className="bg-[#1c1c1e] border border-[#2c2c2e] p-3 rounded-xl flex items-center justify-between gap-2 cursor-pointer"
                    >
                      <span className="text-xs font-bold text-white truncate">{t.title}</span>
                      <span className="text-[11px] text-[#facc15] font-mono shrink-0">{getTaskTimesInHour(t, hour).join(', ')}</span>
                    </div>
                  ))}
                  {tasksInSlot.length === 0 && (
                    <div 
                      onClick={() => handleAddQuickAtSlot(hour)}
                      className="py-1 text-xs text-neutral-600 hover:text-neutral-400 cursor-pointer"
                    >
                      + Reservar este horário
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 6: ANO */}
      {viewMode === 'year' && (
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 pb-32">
          {monthNamesLower.map((mName, mIdx) => {
            const firstWeekday = new Date(year, mIdx, 1).getDay();
            const daysCount = new Date(year, mIdx + 1, 0).getDate();
            return (
              <div
                key={mIdx}
                onClick={() => {
                  const d = new Date(currentDate);
                  d.setMonth(mIdx);
                  setCurrentDate(d);
                  setViewMode('month');
                }}
                className="bg-[#1c1c1e] hover:bg-[#28282e] border border-[#28282b] rounded-2xl p-3 cursor-pointer transition-all hover:scale-102 shadow-lg"
              >
                <h3 className="text-xs font-bold text-white capitalize mb-2">{mName}</h3>
                <div className="grid grid-cols-7 gap-0.5 text-[8px] text-neutral-500 text-center">
                  {['D','S','T','Q','Q','S','S'].map((d, i) => <span key={i}>{d}</span>)}
                  {Array.from({ length: firstWeekday }).map((_, i) => <span key={`empty-${i}`} />)}
                  {Array.from({ length: daysCount }).map((_, i) => {
                    const dayNum = i + 1;
                    const dStr = `${year}-${String(mIdx + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                    const hasTask = getTasksForDate(dStr).length > 0;
                    const isTodayCell = dStr === todayStr;
                    return (
                      <span
                        key={dayNum}
                        className={`py-0.5 rounded-full leading-tight ${
                          hasTask
                            ? 'bg-[#facc15] text-black font-black'
                            : isTodayCell
                            ? 'border border-[#facc15] text-[#facc15] font-bold'
                            : 'text-neutral-300'
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
      )}

      {/* Personalizado Modal (Diário / Semanal / Mensal / Anual + Vários Horários) */}
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
        tasks={state.tasks}
        projects={state.projects}
        onApplyCustomSchedule={handleApplyCustomSchedule}
        onSelectDates={(dates, _firstTime, meta) => {
          if (customModalTask) {
            handleApplyCustomSchedule({
              dates,
              times: meta?.times || [],
              pattern: meta?.pattern || null,
              taskAction: 'existing',
              taskId: customModalTask.id
            });
          }
        }}
      />
    </div>
  );
}
