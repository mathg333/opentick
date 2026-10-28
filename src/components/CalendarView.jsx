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
  Grid3X3,
  List,
  CalendarDays,
  LayoutGrid
} from 'lucide-react';

export default function CalendarView({ store }) {
  const { state, addTask, toggleTaskCompleted, setSelectedTaskId } = store;
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayDate, setSelectedDayDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('list'); // 'list', 'month', 'week', '3days', 'day', 'year'
  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');
  const [selectedSlotHour, setSelectedSlotHour] = useState(null);

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

  // Build full 6-week month calendar grid with previous/next month overflow
  const getFullMonthGrid = () => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // Sunday=0
    const prevMonthDays = new Date(year, month, 0).getDate();
    const currentMonthDays = new Date(year, month + 1, 0).getDate();
    
    const cells = [];
    // Previous month filler days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      cells.push({
        date: new Date(year, month - 1, prevMonthDays - i),
        isCurrentMonth: false
      });
    }
    // Current month days
    for (let i = 1; i <= currentMonthDays; i++) {
      cells.push({
        date: new Date(year, month, i),
        isCurrentMonth: true
      });
    }
    // Next month filler days (fill up to 35 or 42 cells)
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

  const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];

  const selectedDayTasks = state.tasks.filter(t => t.dueDate === selectedDayStr);

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
      startTime,
      endTime,
      priority: 2
    });
    setQuickTitle('');
    setSelectedSlotHour(null);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#000000] relative select-none">
      {/* Top Header matching photo_2026-10-28_00-42-49.jpg & media_1793160069391_067f42d6.jpg */}
      <div className="px-4 py-3 flex items-center justify-between bg-[#000000] shrink-0 border-b border-[#141416]">
        {/* Month Name & Today Shortcut Tooltip */}
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
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button 
                onClick={nextPeriod}
                className="p-1 text-neutral-400 hover:text-white"
                title="Próximo"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Action icons on top right: View switcher dropdown, Hoje, options */}
        <div className="flex items-center gap-1 relative">
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
            className="p-2 text-neutral-300 hover:text-white rounded-lg active:bg-neutral-800 transition-colors"
            title="Alternar Modo de Visualização"
          >
            <Columns className="w-5 h-5" />
          </button>

          <button
            className="p-2 text-neutral-400 hover:text-white rounded-lg active:bg-neutral-800"
          >
            <MoreVertical className="w-5 h-5" />
          </button>

          {/* View Switcher Dropdown Modal matching photo_2026-10-28_00-42-34.jpg */}
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
                        <Icon className={`w-4 h-4 ${isChecked ? 'text-[#4c82f7]' : 'text-neutral-400'}`} />
                        <span className={isChecked ? 'text-[#4c82f7] font-bold' : ''}>{item.label}</span>
                      </div>
                      {isChecked && <Check className="w-4 h-4 text-[#4c82f7] stroke-[2.5]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* VIEW 1: LISTA (Standard TickTick Mobile View with Weekly Strip) */}
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
                const hasTasks = state.tasks.some(t => t.dueDate === dStr && !t.completed);

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
                        ? 'bg-[#4c82f7] text-white shadow-lg'
                        : 'text-neutral-200 hover:bg-[#1c1c1e]'
                    }`}>
                      {day.getDate()}
                    </div>
                    <div className="h-1.5 flex items-center justify-center mt-0.5">
                      {hasTasks && (
                        <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-[#4c82f7]'}`} />
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
                const leftBarColor = task.priority === 3 ? 'bg-rose-500' : task.priority === 2 ? 'bg-amber-500' : task.priority === 1 ? 'bg-[#4c82f7]' : 'bg-neutral-600';
                return (
                  <div
                    key={task.id}
                    onClick={() => setSelectedTaskId(task.id)}
                    className="bg-[#1c1c1e] rounded-xl overflow-hidden flex items-stretch border border-[#28282b] shadow-lg cursor-pointer hover:border-neutral-500 transition-all active:scale-[0.99]"
                  >
                    <div className={`w-1.5 shrink-0 ${leftBarColor}`} />
                    <div className="flex-1 p-3.5 flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-bold text-white tracking-wide truncate">
                          {task.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1 text-xs text-[#4c82f7] font-medium">
                          <span>{selectedDayStr === todayStr ? 'Hoje' : task.dueDate}</span>
                          {task.startTime && (
                            <span>• {task.startTime}{task.endTime ? ` - ${task.endTime}` : ''}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 text-neutral-400 shrink-0">
                        <Repeat className="w-4 h-4 text-neutral-500" />
                        <Bell className="w-4 h-4 text-neutral-500" />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleTaskCompleted(task.id);
                          }}
                          className={`w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                            task.completed ? 'bg-[#4c82f7] border-[#4c82f7] text-white' : 'border-neutral-500'
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
                    <CalendarIcon className="w-8 h-8 text-neutral-600" />
                  </div>
                  <p className="text-sm font-semibold text-neutral-300">Essa data está livre de tarefas</p>
                  <p className="text-xs text-neutral-500 mt-1">Relaxe um pouco</p>
                </div>
              )}
            </div>

            {/* Hourly Booking Slots */}
            <div className="pt-4 border-t border-[#18181c] space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block mb-2">
                Horários
              </span>
              {[8, 9, 10, 11, 14, 15, 16, 17, 18, 19, 20].map(hour => {
                const hourFormatted = `${String(hour).padStart(2, '0')}:00`;
                const isEditingThisSlot = selectedSlotHour === hour;

                return (
                  <div key={hour} className="flex items-center gap-3 py-1.5 border-b border-[#141416]">
                    <span className="w-14 text-xs font-mono font-semibold text-neutral-400">
                      {hourFormatted}
                    </span>
                    <div className="flex-1">
                      {isEditingThisSlot ? (
                        <div className="bg-[#1c1c1e] p-2 rounded-xl border border-[#4c82f7] flex items-center gap-2">
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
                            className="px-2.5 py-1 bg-[#4c82f7] text-white rounded-lg text-xs font-bold"
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
                        <div
                          onClick={() => setSelectedSlotHour(hour)}
                          className="py-1 px-2 rounded-lg text-xs text-neutral-600 hover:text-neutral-400 hover:bg-[#141416] cursor-pointer transition-colors"
                        >
                          + Reservar horário
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

      {/* VIEW 2: MÊS (Exact Reproduction of media_1793160069391_067f42d6.jpg) */}
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
              const hasTasks = state.tasks.some(t => t.dueDate === dStr && !t.completed);

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
                      ? 'bg-[#4c82f7] text-white font-bold shadow-lg scale-105'
                      : !item.isCurrentMonth
                      ? 'text-neutral-600'
                      : isToday
                      ? 'text-[#4c82f7] font-bold'
                      : 'text-neutral-200 hover:bg-[#1c1c1e]'
                  }`}>
                    {item.date.getDate()}
                  </div>
                  <div className="h-1.5 flex items-center justify-center mt-0.5">
                    {hasTasks && (
                      <span className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : 'bg-[#4c82f7]'}`} />
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
                {selectedDayTasks.map(t => (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTaskId(t.id)}
                    className="p-3 bg-[#1c1c1e] border border-[#2c2c2e] rounded-xl flex items-center justify-between cursor-pointer"
                  >
                    <div>
                      <span className={`text-xs font-semibold ${t.completed ? 'line-through text-neutral-500' : 'text-white'}`}>
                        {t.title}
                      </span>
                      {t.startTime && (
                        <div className="text-[11px] text-[#4c82f7] mt-0.5 font-medium">
                          {t.startTime} - {t.endTime || ''}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTaskCompleted(t.id);
                      }}
                      className={`w-5 h-5 rounded-md border flex items-center justify-center ${
                        t.completed ? 'bg-[#4c82f7] border-[#4c82f7] text-white' : 'border-neutral-500'
                      }`}
                    >
                      {t.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              /* Empty state from screenshot media_1793160069391_067f42d6.jpg */
              <div className="py-8 text-center text-neutral-500">
                <div className="w-16 h-16 rounded-2xl bg-[#141416] border border-[#262629] mx-auto mb-3 flex items-center justify-center">
                  <CalendarIcon className="w-8 h-8 text-neutral-600" />
                </div>
                <p className="text-sm font-semibold text-neutral-300">Essa data está livre de tarefas</p>
                <p className="text-xs text-neutral-500 mt-1">Relaxe um pouco</p>
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
                <div key={formatDate(d)} className={formatDate(d) === selectedDayStr ? 'text-[#4c82f7] font-bold' : ''}>
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
                  const tasks = state.tasks.filter(t => t.dueDate === dStr && parseInt(t.startTime?.split(':')[0], 10) === hour);
                  return (
                    <div
                      key={dStr}
                      onClick={() => handleAddQuickAtSlot(hour, dStr)}
                      className="bg-[#141416] hover:bg-[#1c1c1e] rounded-lg p-1 min-h-10 cursor-pointer border border-transparent hover:border-[#28282b]"
                    >
                      {tasks.map(t => (
                        <div
                          key={t.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTaskId(t.id);
                          }}
                          className="bg-[#4c82f7]/20 border border-[#4c82f7]/40 text-[#4c82f7] rounded p-1 text-[10px] font-bold truncate"
                        >
                          {t.title}
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

      {/* VIEW 4: 3 DIAS (Optimized for Mobile Multi-Day) */}
      {viewMode === '3days' && (
        <div className="flex-1 overflow-x-auto pb-32">
          <div className="min-w-[340px] p-3 space-y-2">
            <div className="grid grid-cols-4 gap-2 border-b border-[#222226] pb-2 text-center text-xs text-neutral-400 font-semibold sticky top-0 bg-[#000000] z-10">
              <div>Hora</div>
              {threeDays.map(d => (
                <div key={formatDate(d)} className={formatDate(d) === selectedDayStr ? 'text-[#4c82f7] font-bold' : ''}>
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
                  const tasks = state.tasks.filter(t => t.dueDate === dStr && parseInt(t.startTime?.split(':')[0], 10) === hour);
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
                            setSelectedTaskId(t.id);
                          }}
                          className="bg-[#4c82f7] text-white rounded p-1 text-[11px] font-semibold truncate shadow-sm mb-1"
                        >
                          {t.title}
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

      {/* VIEW 5: DIA (Single Day Detailed Timeline) */}
      {viewMode === 'day' && (
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 pb-32">
          <div className="text-sm font-bold text-white mb-2">
            {selectedDayDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
          {hours.map(hour => {
            const hourFormatted = `${String(hour).padStart(2, '0')}:00`;
            const tasksInSlot = selectedDayTasks.filter(t => parseInt(t.startTime?.split(':')[0], 10) === hour);
            return (
              <div key={hour} className="flex items-start gap-3 py-2 border-b border-[#18181c]">
                <span className="w-16 text-xs font-mono font-bold text-neutral-400 pt-1">
                  {hourFormatted}
                </span>
                <div className="flex-1 space-y-1.5">
                  {tasksInSlot.map(t => (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTaskId(t.id)}
                      className="bg-[#1c1c1e] border border-[#2c2c2e] p-3 rounded-xl flex items-center justify-between cursor-pointer"
                    >
                      <span className="text-xs font-bold text-white">{t.title}</span>
                      <span className="text-[11px] text-[#4c82f7] font-mono">{t.startTime} - {t.endTime || ''}</span>
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

      {/* VIEW 6: ANO (12 Months Overview) */}
      {viewMode === 'year' && (
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pb-32">
          {monthNamesLower.map((mName, mIdx) => (
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
                {Array.from({ length: new Date(year, mIdx + 1, 0).getDate() }).map((_, i) => (
                  <span key={i} className="py-0.5 text-neutral-300">{i + 1}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
