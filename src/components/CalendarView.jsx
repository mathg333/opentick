import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Calendar as CalendarIcon, 
  Plus, 
  Check, 
  Flag 
} from 'lucide-react';

export default function CalendarView({ store }) {
  const { state, addTask, toggleTaskCompleted, setSelectedTaskId } = store;
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('week'); // 'month', 'week', 'day'
  const [quickTitle, setQuickTitle] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevPeriod = () => {
    const d = new Date(currentDate);
    if (viewMode === 'month') d.setMonth(d.getMonth() - 1);
    else if (viewMode === 'week') d.setDate(d.getDate() - 7);
    else d.setDate(d.getDate() - 1);
    setCurrentDate(d);
  };

  const nextPeriod = () => {
    const d = new Date(currentDate);
    if (viewMode === 'month') d.setMonth(d.getMonth() + 1);
    else if (viewMode === 'week') d.setDate(d.getDate() + 7);
    else d.setDate(d.getDate() + 1);
    setCurrentDate(d);
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const formatDate = (d) => {
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const dy = String(d.getDate()).padStart(2, '0');
    return `${yr}-${mo}-${dy}`;
  };

  const getWeekDays = () => {
    const curr = new Date(currentDate);
    const first = curr.getDate() - curr.getDay();
    const days = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(curr);
      d.setDate(first + i);
      days.push(d);
    }
    return days;
  };

  const getMonthDays = () => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const hours = Array.from({ length: 15 }, (_, i) => i + 8);

  const handleAddAtSlot = (dateStr, hour) => {
    if (!quickTitle.trim()) return;
    const startTime = `${String(hour).padStart(2, '0')}:00`;
    const endTime = `${String(hour + 1).padStart(2, '0')}:00`;
    addTask({
      title: quickTitle.trim(),
      dueDate: dateStr,
      startTime,
      endTime,
      priority: 1
    });
    setQuickTitle('');
    setSelectedSlot(null);
  };

  const priorityColors = {
    0: 'border-[#27272a] bg-[#1a1a1e] text-neutral-300',
    1: 'border-blue-500/40 bg-[#131b2e] text-blue-200',
    2: 'border-amber-500/40 bg-[#251e13] text-amber-200',
    3: 'border-rose-500/40 bg-[#2b1418] text-rose-200'
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#121215]">
      {/* Calendar Header */}
      <div className="px-8 pt-6 pb-4 border-b border-[#222226] flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-neutral-300" />
            <h1 className="text-xl font-bold text-neutral-100">
              Calendário & Time-Blocking
            </h1>
          </div>
          <span className="text-[10px] bg-neutral-800 text-neutral-300 font-bold px-2 py-0.5 rounded border border-neutral-700">
            PRO GRATUITO
          </span>
        </div>

        {/* View Mode Switcher & Date Controls */}
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-[#09090b] border border-[#27272a] rounded-lg p-1">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                viewMode === 'month' ? 'bg-[#27272a] text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Mês
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                viewMode === 'week' ? 'bg-[#27272a] text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Semana (Time-Block)
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                viewMode === 'day' ? 'bg-[#27272a] text-white' : 'text-neutral-400 hover:text-white'
              }`}
            >
              Dia
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={prevPeriod}
              className="p-1.5 rounded-lg bg-[#09090b] border border-[#27272a] text-neutral-400 hover:text-white hover:bg-[#151518]"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-semibold text-neutral-200 min-w-36 text-center capitalize">
              {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </span>
            <button
              onClick={nextPeriod}
              className="p-1.5 rounded-lg bg-[#09090b] border border-[#27272a] text-neutral-400 hover:text-white hover:bg-[#151518]"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentDate(new Date())}
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-[#1f1f23] text-neutral-300 hover:text-white border border-[#27272a]"
            >
              Hoje
            </button>
          </div>
        </div>
      </div>

      {/* Main Calendar Body */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* MONTH VIEW */}
        {viewMode === 'month' && (
          <div className="h-full flex flex-col">
            <div className="grid grid-cols-7 gap-px mb-2 text-center text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                <div key={d} className="py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2 flex-1 auto-rows-fr">
              {getMonthDays().map((day, idx) => {
                if (!day) return <div key={idx} className="bg-[#09090b]/30 rounded-xl p-2 border border-dashed border-[#1e1e24]" />;
                const dStr = formatDate(day);
                const isToday = dStr === todayStr;
                const tasksForDay = state.tasks.filter(t => t.dueDate === dStr);

                return (
                  <div
                    key={dStr}
                    className={`min-h-28 rounded-xl p-2 flex flex-col justify-between border transition-all ${
                      isToday
                        ? 'bg-[#18181c] border-neutral-500 shadow-sm'
                        : 'bg-[#0e0e11] border-[#222226] hover:border-[#2f2f36]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                        isToday ? 'bg-white text-black' : 'text-neutral-400'
                      }`}>
                        {day.getDate()}
                      </span>
                      {tasksForDay.length > 0 && (
                        <span className="text-[10px] text-neutral-500 font-mono">
                          {tasksForDay.length}
                        </span>
                      )}
                    </div>

                    <div className="space-y-1 overflow-y-auto max-h-24">
                      {tasksForDay.slice(0, 3).map(task => (
                        <div
                          key={task.id}
                          onClick={() => setSelectedTaskId(task.id)}
                          className={`text-[11px] px-2 py-0.5 rounded truncate border cursor-pointer ${
                            task.completed
                              ? 'line-through text-neutral-600 border-[#222226] bg-[#0c0c0e]'
                              : priorityColors[task.priority] || 'border-[#27272a] bg-[#1a1a1e] text-neutral-200'
                          }`}
                        >
                          {task.startTime && `${task.startTime} `}{task.title}
                        </div>
                      ))}
                      {tasksForDay.length > 3 && (
                        <span className="text-[10px] text-neutral-500 pl-1">
                          +{tasksForDay.length - 3} mais...
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* WEEK VIEW (TIME-BLOCKING) */}
        {viewMode === 'week' && (
          <div className="flex flex-col min-w-[750px]">
            {/* Day Header Row */}
            <div className="grid grid-cols-8 gap-2 border-b border-[#222226] pb-3 mb-3">
              <div className="text-center text-xs text-neutral-500 font-semibold pt-1">Hora</div>
              {getWeekDays().map(day => {
                const dStr = formatDate(day);
                const isToday = dStr === todayStr;
                return (
                  <div key={dStr} className="text-center">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase">
                      {day.toLocaleDateString('pt-BR', { weekday: 'short' })}
                    </span>
                    <div className={`mt-0.5 mx-auto text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                      isToday ? 'bg-white text-black' : 'text-neutral-200'
                    }`}>
                      {day.getDate()}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Hourly Grid */}
            <div className="space-y-1">
              {hours.map(hour => {
                const hourFormatted = `${String(hour).padStart(2, '0')}:00`;
                return (
                  <div key={hour} className="grid grid-cols-8 gap-2 min-h-12 border-t border-[#1e1e24] py-1">
                    <div className="text-[11px] text-neutral-500 font-mono text-center pt-1">
                      {hourFormatted}
                    </div>

                    {getWeekDays().map(day => {
                      const dStr = formatDate(day);
                      const tasksInSlot = state.tasks.filter(t => {
                        if (t.dueDate !== dStr) return false;
                        if (!t.startTime) return false;
                        const taskHour = parseInt(t.startTime.split(':')[0], 10);
                        return taskHour === hour;
                      });

                      const isSelected = selectedSlot?.dateStr === dStr && selectedSlot?.hour === hour;

                      return (
                        <div
                          key={dStr}
                          onClick={() => setSelectedSlot({ dateStr: dStr, hour })}
                          className={`rounded-lg p-1 min-h-10 border transition-all cursor-pointer relative group ${
                            isSelected
                              ? 'bg-[#1b1b20] border-neutral-500'
                              : 'bg-[#0a0a0c]/60 border-transparent hover:border-[#27272a] hover:bg-[#121215]'
                          }`}
                        >
                          {tasksInSlot.map(task => (
                            <div
                              key={task.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTaskId(task.id);
                              }}
                              className={`p-1.5 rounded text-xs font-medium border mb-1 shadow-sm ${
                                priorityColors[task.priority]
                              }`}
                            >
                              <div className="flex items-center justify-between text-[9px] opacity-75">
                                <span>{task.startTime} - {task.endTime || 'fim'}</span>
                              </div>
                              <div className="font-semibold truncate text-[11px]">{task.title}</div>
                            </div>
                          ))}

                          {isSelected && (
                            <div 
                              onClick={e => e.stopPropagation()} 
                              className="absolute top-0 left-0 right-0 z-20 bg-[#09090b] border border-neutral-500 rounded-lg p-2 shadow-2xl"
                            >
                              <input
                                type="text"
                                placeholder="Bloco de tempo..."
                                value={quickTitle}
                                onChange={(e) => setQuickTitle(e.target.value)}
                                autoFocus
                                className="w-full bg-[#151518] border border-[#27272a] text-xs text-white rounded p-1.5 mb-2 focus:outline-none"
                              />
                              <div className="flex justify-between items-center">
                                <span className="text-[10px] text-neutral-400">{hourFormatted}</span>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => setSelectedSlot(null)}
                                    className="text-[10px] px-2 py-0.5 text-neutral-400 hover:text-white"
                                  >
                                    Cancelar
                                  </button>
                                  <button
                                    onClick={() => handleAddAtSlot(dStr, hour)}
                                    className="text-[10px] px-2.5 py-0.5 bg-white text-black rounded font-bold"
                                  >
                                    Salvar
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* DAY VIEW */}
        {viewMode === 'day' && (
          <div className="max-w-2xl mx-auto space-y-3">
            <h2 className="text-sm font-bold text-neutral-200">
              Agenda do Dia: {currentDate.toLocaleDateString('pt-BR', { dateStyle: 'full' })}
            </h2>
            <div className="space-y-2">
              {hours.map(hour => {
                const hourFormatted = `${String(hour).padStart(2, '0')}:00`;
                const dStr = formatDate(currentDate);
                const tasksInSlot = state.tasks.filter(t => {
                  if (t.dueDate !== dStr) return false;
                  if (!t.startTime) return false;
                  return parseInt(t.startTime.split(':')[0], 10) === hour;
                });

                return (
                  <div key={hour} className="flex gap-4 p-3 bg-[#0e0e11] rounded-xl border border-[#222226]">
                    <span className="text-xs font-mono text-neutral-500 w-16 pt-1 font-bold">
                      {hourFormatted}
                    </span>
                    <div className="flex-1 space-y-2">
                      {tasksInSlot.map(t => (
                        <div
                          key={t.id}
                          onClick={() => setSelectedTaskId(t.id)}
                          className={`p-2.5 rounded-lg border cursor-pointer ${priorityColors[t.priority]}`}
                        >
                          <div className="flex justify-between items-center text-xs">
                            <span className="font-bold">{t.title}</span>
                            <span>{t.startTime} às {t.endTime}</span>
                          </div>
                          {t.description && <p className="text-xs opacity-75 mt-1">{t.description}</p>}
                        </div>
                      ))}
                      {tasksInSlot.length === 0 && (
                        <span className="text-xs text-neutral-600 italic">Livre para foco</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
