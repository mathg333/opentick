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
  CalendarDays
} from 'lucide-react';

export default function CalendarView({ store }) {
  const { state, addTask, toggleTaskCompleted, setSelectedTaskId } = store;
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayDate, setSelectedDayDate] = useState(new Date());
  const [viewMode, setViewMode] = useState('list'); // 'list' (Agenda/Lista as in screenshot), 'month', 'week', 'day'
  const [isViewMenuOpen, setIsViewMenuOpen] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');
  const [selectedSlotHour, setSelectedSlotHour] = useState(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevPeriod = () => {
    const d = new Date(currentDate);
    if (viewMode === 'month') {
      d.setMonth(d.getMonth() - 1);
    } else if (viewMode === 'week') {
      d.setDate(d.getDate() - 7);
    } else {
      d.setDate(d.getDate() - 7);
      setSelectedDayDate(d);
    }
    setCurrentDate(d);
  };

  const nextPeriod = () => {
    const d = new Date(currentDate);
    if (viewMode === 'month') {
      d.setMonth(d.getMonth() + 1);
    } else if (viewMode === 'week') {
      d.setDate(d.getDate() + 7);
    } else {
      d.setDate(d.getDate() + 7);
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

  // Return the 7 days of the currently focused week starting on Sunday
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

  const weekDays = getWeekDays();

  // Tasks for selected day
  const selectedDayTasks = state.tasks.filter(t => t.dueDate === selectedDayStr);

  const monthNamesLower = [
    'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
    'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'
  ];
  const currentMonthName = monthNamesLower[currentDate.getMonth()];

  const handleAddQuickAtSlot = (hour) => {
    if (!quickTitle.trim()) return;
    const startTime = `${String(hour).padStart(2, '0')}:00`;
    const endTime = `${String(hour + 1).padStart(2, '0')}:00`;
    addTask({
      title: quickTitle.trim(),
      dueDate: selectedDayStr,
      startTime,
      endTime,
      priority: 2
    });
    setQuickTitle('');
    setSelectedSlotHour(null);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#000000] relative">
      {/* TickTick Top Bar matching photo_2026-10-28_00-42-49.jpg */}
      <div className="px-4 py-3 flex items-center justify-between bg-[#000000] shrink-0 border-b border-[#141416]">
        {/* Month Name: e.g. "outubro" in lowercase bold white */}
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-white tracking-tight capitalize">
            {currentMonthName}
          </h1>
          <div className="flex items-center gap-1">
            <button 
              onClick={prevPeriod}
              className="p-1 text-neutral-400 hover:text-white"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={nextPeriod}
              className="p-1 text-neutral-400 hover:text-white"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Action icons on top right: View switcher popup, options, more dots */}
        <div className="flex items-center gap-1 relative">
          <button
            onClick={() => setIsViewMenuOpen(!isViewMenuOpen)}
            className="p-2 text-neutral-300 hover:text-white rounded-lg active:bg-neutral-800 transition-colors"
            title="Alternar Modo de Visualização"
          >
            <Columns className="w-5 h-5" />
          </button>

          <button
            onClick={() => {
              const now = new Date();
              setCurrentDate(now);
              setSelectedDayDate(now);
            }}
            className="text-xs px-2.5 py-1 text-neutral-300 bg-[#1c1c1e] hover:bg-[#2c2c2e] rounded-lg font-semibold border border-[#2c2c2e]"
          >
            Hoje
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
                className="absolute top-14 right-4 z-50 w-44 bg-[#1c1c1e] border border-[#2c2c2e] rounded-2xl shadow-2xl py-2 overflow-hidden animate-in fade-in"
              >
                {[
                  { id: 'list', label: 'Lista', icon: List },
                  { id: 'month', label: 'Mês', icon: CalendarDays },
                  { id: 'week', label: 'Semana', icon: Columns },
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

      {/* WEEKLY STRIP matching photo_2026-10-28_00-42-49.jpg */}
      <div className="bg-[#000000] border-b border-[#18181c] px-3 py-2.5 shrink-0">
        <div className="grid grid-cols-7 gap-1 text-center">
          {/* Day Names Row (dom. seg. ter. qua. qui. sex. sáb.) */}
          {['dom.', 'seg.', 'ter.', 'qua.', 'qui.', 'sex.', 'sáb.'].map(d => (
            <span key={d} className="text-[11px] text-neutral-400 font-medium">
              {d}
            </span>
          ))}

          {/* Day Numbers & Dots Row */}
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
                {/* Indicator dot underneath */}
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

      {/* TIMELINE / EVENT LISTING AREA */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-32">
        {/* Day Group Heading matching screenshot: "Hoje" or date title */}
        <div className="flex items-center justify-between pb-1">
          <span className="text-base font-bold text-white capitalize">
            {selectedDayStr === todayStr ? 'Hoje' : selectedDayDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </span>
          <span className="text-xs text-neutral-500 font-mono">
            {selectedDayTasks.length} {selectedDayTasks.length === 1 ? 'evento' : 'eventos'}
          </span>
        </div>

        {/* Selected Day Event Cards matching photo_2026-10-28_00-42-49.jpg */}
        <div className="space-y-2.5">
          {selectedDayTasks.map(task => {
            // Priority border color (e.g. pink/red for high, blue for medium)
            const leftBarColor = task.priority === 3 ? 'bg-rose-500' : task.priority === 2 ? 'bg-amber-500' : task.priority === 1 ? 'bg-[#4c82f7]' : 'bg-neutral-600';

            return (
              <div
                key={task.id}
                onClick={() => setSelectedTaskId(task.id)}
                className="bg-[#1c1c1e] rounded-xl overflow-hidden flex items-stretch border border-[#28282b] shadow-lg cursor-pointer hover:border-neutral-500 transition-all active:scale-[0.99]"
              >
                {/* Left vertical colored accent line */}
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
              <CalendarIcon className="w-10 h-10 mx-auto mb-2 text-neutral-600 stroke-[1.5]" />
              <p className="text-sm font-semibold text-neutral-300">Nenhum evento neste dia</p>
              <p className="text-xs text-neutral-500 mt-1">Toque em qualquer horário abaixo ou no botão (+) para agendar.</p>
            </div>
          )}
        </div>

        {/* Hourly Time-blocking Slots (Tap to schedule) */}
        <div className="pt-4 border-t border-[#18181c] space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400 block mb-2">
            Grade de Horários
          </span>
          {[8, 9, 10, 11, 14, 15, 16, 17, 18, 19, 20].map(hour => {
            const hourFormatted = `${String(hour).padStart(2, '0')}:00`;
            const isEditingThisSlot = selectedSlotHour === hour;

            return (
              <div 
                key={hour}
                className="flex items-center gap-3 py-1.5 border-b border-[#141416]"
              >
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
  );
}
