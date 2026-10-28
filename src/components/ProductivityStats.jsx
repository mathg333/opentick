import React from 'react';
import { 
  BarChart3, 
  CheckCircle2, 
  Clock, 
  Flame, 
  Target, 
  TrendingUp 
} from 'lucide-react';

export default function ProductivityStats({ store }) {
  const { state } = store;

  const totalTasks = state.tasks.length;
  const completedTasks = state.tasks.filter(t => t.completed).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const totalFocusMinutes = state.pomodoroSessions.reduce((acc, s) => acc + (s.durationMinutes || 25), 0);
  const totalFocusHours = (totalFocusMinutes / 60).toFixed(1);

  const bestHabitStreak = state.habits.reduce((max, h) => Math.max(max, h.bestStreak || 0), 0);
  const activeHabitsCount = state.habits.length;

  const priorityBreakdown = {
    high: state.tasks.filter(t => t.priority === 3).length,
    medium: state.tasks.filter(t => t.priority === 2).length,
    low: state.tasks.filter(t => t.priority === 1).length,
    none: state.tasks.filter(t => t.priority === 0).length,
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#121215]">
      {/* Header */}
      <div className="px-4 py-3 md:px-8 md:pt-6 md:pb-4 border-b border-[#222226] bg-[#0c0c0e] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#18181c] border border-[#27272a] flex items-center justify-center shrink-0">
            <BarChart3 className="w-4 h-4 text-neutral-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base md:text-xl font-bold text-neutral-100">
                Estatísticas & Produtividade
              </h1>
              <span className="text-[9px] md:text-[10px] bg-neutral-800 text-neutral-300 font-bold px-2 py-0.5 rounded border border-neutral-700">
                PRO GRATUITO
              </span>
            </div>
            <p className="text-xs text-neutral-500 hidden sm:block">
              Desempenho, tempo de foco e consistência de hábitos
            </p>
          </div>
        </div>
      </div>

      {/* Main Stats Body */}
      <div className="flex-1 overflow-y-auto p-3 md:p-8 space-y-4 md:space-y-6 max-w-5xl pb-28 md:pb-12">
        {/* KPI Cards - 2 cols on mobile, 4 on desktop */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="bg-[#0a0a0c] border border-[#222226] rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
              <span>Tarefas Concluídas</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl md:text-3xl font-black text-white">{completedTasks}</div>
            <span className="text-[11px] text-neutral-500 mt-1 block">
              {completionRate}% de taxa de entrega
            </span>
          </div>

          <div className="bg-[#0a0a0c] border border-[#222226] rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
              <span>Tempo de Foco</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl md:text-3xl font-black text-white">{totalFocusHours}h</div>
            <span className="text-[11px] text-neutral-500 mt-1 block">
              {state.pomodoroSessions.length} sessões Pomodoro
            </span>
          </div>

          <div className="bg-[#0a0a0c] border border-[#222226] rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
              <span>Maior Sequência</span>
              <Flame className="w-4 h-4 text-orange-400" />
            </div>
            <div className="text-2xl md:text-3xl font-black text-white">{bestHabitStreak} dias</div>
            <span className="text-[11px] text-neutral-500 mt-1 block">
              {activeHabitsCount} hábitos ativos
            </span>
          </div>

          <div className="bg-[#0a0a0c] border border-[#222226] rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
              <span>Eficiência Geral</span>
              <TrendingUp className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl md:text-3xl font-black text-white">{completionRate}%</div>
            <span className="text-[11px] text-neutral-500 mt-1 block">
              {totalTasks} tarefas no sistema
            </span>
          </div>
        </div>

        {/* Priority Breakdown & Focus Sessions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#0a0a0c] border border-[#222226] rounded-2xl p-4 md:p-5 shadow-xl">
            <h3 className="text-sm font-bold text-neutral-200 mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 text-neutral-400" />
              Distribuição por Prioridade
            </h3>
            <div className="space-y-3">
              {[
                { label: 'Alta (Crítico / Q1)', count: priorityBreakdown.high, color: 'bg-rose-500' },
                { label: 'Média (Importante / Q2)', count: priorityBreakdown.medium, color: 'bg-amber-500' },
                { label: 'Baixa (Rotina / Q3)', count: priorityBreakdown.low, color: 'bg-blue-500' },
                { label: 'Sem Prioridade (Geral)', count: priorityBreakdown.none, color: 'bg-neutral-600' }
              ].map(item => {
                const pct = totalTasks > 0 ? Math.round((item.count / totalTasks) * 100) : 0;
                return (
                  <div key={item.label} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-neutral-400">{item.label}</span>
                      <span className="font-bold text-neutral-200">{item.count} ({pct}%)</span>
                    </div>
                    <div className="w-full bg-[#18181c] h-2 rounded-full overflow-hidden">
                      <div className={`h-full ${item.color} rounded-full`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-[#0a0a0c] border border-[#222226] rounded-2xl p-4 md:p-5 shadow-xl flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-neutral-200 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-neutral-400" />
                Últimas Sessões de Foco
              </h3>
              <div className="space-y-2 max-h-56 overflow-y-auto">
                {state.pomodoroSessions.slice(-5).reverse().map((session, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 bg-[#121215] border border-[#1f1f24] rounded-xl text-xs"
                  >
                    <span className="font-semibold text-neutral-300 truncate max-w-[200px]">
                      {session.taskTitle}
                    </span>
                    <span className="text-neutral-500 font-mono text-[11px]">
                      +{session.durationMinutes || 25} min
                    </span>
                  </div>
                ))}
                {state.pomodoroSessions.length === 0 && (
                  <p className="text-xs text-neutral-600 italic py-6 text-center">
                    Nenhuma sessão pomodoro realizada ainda.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
