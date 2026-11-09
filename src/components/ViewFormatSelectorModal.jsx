import React from 'react';
import { 
  X, 
  CalendarDays, 
  CalendarRange, 
  Calendar, 
  Columns3, 
  ListTodo, 
  Kanban, 
  Grid2X2, 
  Flame, 
  Timer, 
  Check,
  Sun
} from 'lucide-react';

export default function ViewFormatSelectorModal({ isOpen, onClose, store }) {
  if (!isOpen) return null;

  const { 
    activeView, 
    setActiveView, 
    calendarViewMode, 
    setCalendarViewMode, 
    taskViewLayout, 
    setTaskViewLayout 
  } = store;

  // Handler for calendar temporal views
  const handleSelectCalendar = (mode) => {
    if (setCalendarViewMode) setCalendarViewMode(mode);
    if (setActiveView) setActiveView('calendar');
    onClose();
  };

  // Handler for task format views
  const handleSelectTaskFormat = (view, layout = 'list') => {
    if (setTaskViewLayout) setTaskViewLayout(layout);
    if (setActiveView) setActiveView(view);
    onClose();
  };

  const isDailyActive = (activeView === 'calendar' && calendarViewMode === 'day') || (activeView === 'tasks-today' && taskViewLayout === 'list');
  const isWeeklyActive = activeView === 'calendar' && calendarViewMode === 'week';
  const isMonthlyActive = activeView === 'calendar' && (calendarViewMode === 'month' || !calendarViewMode);
  const isYearlyActive = activeView === 'calendar' && calendarViewMode === 'year';

  const isListActive = (activeView.startsWith('tasks') || activeView.startsWith('project-')) && taskViewLayout === 'list';
  const isKanbanActive = (activeView.startsWith('tasks') || activeView.startsWith('project-')) && taskViewLayout === 'kanban';
  const isEisenhowerActive = activeView === 'eisenhower';
  const isHabitsActive = activeView === 'habits';
  const isPomodoroActive = activeView === 'pomodoro';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full sm:max-w-md bg-[#0c0c0e] border border-[#222228] rounded-t-3xl sm:rounded-2xl p-5 shadow-2xl max-h-[85vh] overflow-y-auto space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#1c1c22]">
          <div>
            <h2 className="text-base font-bold text-white tracking-tight">
              Formatos de Visualização
            </h2>
            <p className="text-xs text-neutral-400">
              Escolha como deseja visualizar suas tarefas e rotina
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg bg-[#16161a] border border-[#24242a] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Section 1: Formatos de Calendário / Tempo */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block px-1">
            Visões de Tempo & Calendário
          </span>

          <div className="grid grid-cols-2 gap-2">
            {/* Diário */}
            <button
              type="button"
              onClick={() => handleSelectCalendar('day')}
              className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all active:scale-95 ${
                isDailyActive
                  ? 'bg-[#18181e] border-amber-400/80 shadow-md shadow-amber-400/10'
                  : 'bg-[#121215] border-[#222228] hover:border-[#33333d]'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1.5">
                <div className="w-7 h-7 rounded-lg bg-amber-400/10 border border-amber-400/30 flex items-center justify-center text-amber-400">
                  <Sun className="w-4 h-4" />
                </div>
                {isDailyActive && <Check className="w-4 h-4 text-amber-400" />}
              </div>
              <div>
                <div className="text-xs font-bold text-white">Diário</div>
                <div className="text-[10px] text-neutral-400">Hora a hora hoje</div>
              </div>
            </button>

            {/* Semanal */}
            <button
              type="button"
              onClick={() => handleSelectCalendar('week')}
              className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all active:scale-95 ${
                isWeeklyActive
                  ? 'bg-[#18181e] border-amber-400/80 shadow-md shadow-amber-400/10'
                  : 'bg-[#121215] border-[#222228] hover:border-[#33333d]'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1.5">
                <div className="w-7 h-7 rounded-lg bg-sky-400/10 border border-sky-400/30 flex items-center justify-center text-sky-400">
                  <CalendarRange className="w-4 h-4" />
                </div>
                {isWeeklyActive && <Check className="w-4 h-4 text-amber-400" />}
              </div>
              <div>
                <div className="text-xs font-bold text-white">Semanal</div>
                <div className="text-[10px] text-neutral-400">Agenda da semana</div>
              </div>
            </button>

            {/* Mensal */}
            <button
              type="button"
              onClick={() => handleSelectCalendar('month')}
              className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all active:scale-95 ${
                isMonthlyActive
                  ? 'bg-[#18181e] border-amber-400/80 shadow-md shadow-amber-400/10'
                  : 'bg-[#121215] border-[#222228] hover:border-[#33333d]'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-400/10 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                  <Calendar className="w-4 h-4" />
                </div>
                {isMonthlyActive && <Check className="w-4 h-4 text-amber-400" />}
              </div>
              <div>
                <div className="text-xs font-bold text-white">Mensal</div>
                <div className="text-[10px] text-neutral-400">Grade do mês</div>
              </div>
            </button>

            {/* Anual */}
            <button
              type="button"
              onClick={() => handleSelectCalendar('year')}
              className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all active:scale-95 ${
                isYearlyActive
                  ? 'bg-[#18181e] border-amber-400/80 shadow-md shadow-amber-400/10'
                  : 'bg-[#121215] border-[#222228] hover:border-[#33333d]'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1.5">
                <div className="w-7 h-7 rounded-lg bg-purple-400/10 border border-purple-400/30 flex items-center justify-center text-purple-400">
                  <CalendarDays className="w-4 h-4" />
                </div>
                {isYearlyActive && <Check className="w-4 h-4 text-amber-400" />}
              </div>
              <div>
                <div className="text-xs font-bold text-white">Anual</div>
                <div className="text-[10px] text-neutral-400">Visão dos 12 meses</div>
              </div>
            </button>
          </div>
        </div>

        {/* Section 2: Metodologias & Formatos de Tarefas */}
        <div className="space-y-2 pt-2 border-t border-[#1c1c22]">
          <span className="text-[11px] font-bold text-neutral-400 uppercase tracking-wider block px-1">
            Formatos de Tarefas & Metodologias
          </span>

          <div className="space-y-1.5">
            {/* Listas */}
            <button
              type="button"
              onClick={() => handleSelectTaskFormat('tasks-today', 'list')}
              className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-all active:scale-98 ${
                isListActive
                  ? 'bg-[#18181e] border-amber-400/80'
                  : 'bg-[#121215] border-[#222228] hover:border-[#33333d]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#18181c] border border-[#26262e] flex items-center justify-center text-neutral-300">
                  <ListTodo className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-white">Ver em Lista</div>
                  <div className="text-[10px] text-neutral-400">Visualização clássica e filtros</div>
                </div>
              </div>
              {isListActive && <Check className="w-4 h-4 text-amber-400" />}
            </button>

            {/* Kanban */}
            <button
              type="button"
              onClick={() => handleSelectTaskFormat('tasks-today', 'kanban')}
              className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-all active:scale-98 ${
                isKanbanActive
                  ? 'bg-[#18181e] border-amber-400/80'
                  : 'bg-[#121215] border-[#222228] hover:border-[#33333d]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400">
                  <Kanban className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-white">Quadro Kanban</div>
                  <div className="text-[10px] text-neutral-400">A Fazer, Em Progresso e Concluído</div>
                </div>
              </div>
              {isKanbanActive && <Check className="w-4 h-4 text-amber-400" />}
            </button>

            {/* Matriz Eisenhower */}
            <button
              type="button"
              onClick={() => handleSelectTaskFormat('eisenhower')}
              className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-all active:scale-98 ${
                isEisenhowerActive
                  ? 'bg-[#18181e] border-amber-400/80'
                  : 'bg-[#121215] border-[#222228] hover:border-[#33333d]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <Grid2X2 className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-white">Matriz de Eisenhower</div>
                  <div className="text-[10px] text-neutral-400">4 quadrantes: Urgente vs Importante</div>
                </div>
              </div>
              {isEisenhowerActive && <Check className="w-4 h-4 text-amber-400" />}
            </button>

            {/* Rastreador de Hábitos */}
            <button
              type="button"
              onClick={() => handleSelectTaskFormat('habits')}
              className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-all active:scale-98 ${
                isHabitsActive
                  ? 'bg-[#18181e] border-amber-400/80'
                  : 'bg-[#121215] border-[#222228] hover:border-[#33333d]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Flame className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-white">Rastreador de Hábitos</div>
                  <div className="text-[10px] text-neutral-400">Sequências, metas e heatmap</div>
                </div>
              </div>
              {isHabitsActive && <Check className="w-4 h-4 text-amber-400" />}
            </button>

            {/* Pomodoro Timer */}
            <button
              type="button"
              onClick={() => handleSelectTaskFormat('pomodoro')}
              className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-all active:scale-98 ${
                isPomodoroActive
                  ? 'bg-[#18181e] border-amber-400/80'
                  : 'bg-[#121215] border-[#222228] hover:border-[#33333d]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-400">
                  <Timer className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-white">Foco Pomodoro</div>
                  <div className="text-[10px] text-neutral-400">Timer integrado de foco e pausas</div>
                </div>
              </div>
              {isPomodoroActive && <Check className="w-4 h-4 text-amber-400" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
