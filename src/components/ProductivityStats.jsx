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
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#121215]">
      {/* Header */}
      <div className="px-8 pt-6 pb-4 border-b border-[#222226] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#18181c] border border-[#27272a] flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-neutral-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-neutral-100">
                Estatísticas & Produtividade
              </h1>
              <span className="text-[10px] bg-neutral-800 text-neutral-300 font-bold px-2 py-0.5 rounded border border-neutral-700">
                PRO GRATUITO
              </span>
            </div>
            <p className="text-xs text-neutral-500">
              Desempenho, tempo de foco e consistência de hábitos
            </p>
          </div>
        </div>
      </div>

      {/* Main Stats Body */}
      <div className="flex-1 overflow-y-auto p-8 space-y-6 max-w-5xl">
        {/* KPI Cards */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-[#0a0a0c] border border-[#222226] rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
              <span>Taxa de Conclusão</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-neutral-100">
              {completionRate}%
            </div>
            <p className="text-[11px] text-neutral-500 mt-1">
              {completedTasks} de {totalTasks} tarefas concluídas
            </p>
          </div>

          <div className="bg-[#0a0a0c] border border-[#222226] rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
              <span>Tempo Focado</span>
              <Clock className="w-4 h-4 text-yellow-400" />
            </div>
            <div className="text-2xl font-black text-neutral-100">
              {totalFocusHours}h
            </div>
            <p className="text-[11px] text-neutral-500 mt-1">
              {state.pomodoroSessions.length} sessões de Pomodoro
            </p>
          </div>

          <div className="bg-[#0a0a0c] border border-[#222226] rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
              <span>Maior Sequência (Streak)</span>
              <Flame className="w-4 h-4 text-orange-400" />
            </div>
            <div className="text-2xl font-black text-neutral-100">
              {bestHabitStreak} dias
            </div>
            <p className="text-[11px] text-neutral-500 mt-1">
              Recorde entre seus hábitos
            </p>
          </div>

          <div className="bg-[#0a0a0c] border border-[#222226] rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
              <span>Hábitos Ativos</span>
              <Target className="w-4 h-4 text-neutral-300" />
            </div>
            <div className="text-2xl font-black text-neutral-100">
              {activeHabitsCount}
            </div>
            <p className="text-[11px] text-neutral-500 mt-1">
              Sem limites de quantidade
            </p>
          </div>
        </div>

        {/* Priority & Habit breakdown */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-[#0a0a0c] border border-[#222226] rounded-2xl p-5 shadow-xl">
            <h2 className="text-xs font-bold text-neutral-200 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-neutral-400" />
              Distribuição por Prioridade
            </h2>
            <div className="space-y-3">
              {[
                { label: 'Alta Prioridade', count: priorityBreakdown.high, color: 'bg-rose-500' },
                { label: 'Média Prioridade', count: priorityBreakdown.medium, color: 'bg-amber-500' },
                { label: 'Baixa Prioridade', count: priorityBreakdown.low, color: 'bg-blue-500' },
                { label: 'Sem Prioridade', count: priorityBreakdown.none, color: 'bg-neutral-700' },
              ].map(p => {
                const pct = totalTasks > 0 ? Math.round((p.count / totalTasks) * 100) : 0;
                return (
                  <div key={p.label} className="space-y-1">
                    <div className="flex justify-between text-xs text-neutral-300">
                      <span>{p.label}</span>
                      <span className="font-semibold">{p.count} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 w-full bg-[#18181c] rounded-full overflow-hidden">
                      <div className={`h-full ${p.color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-[#0a0a0c] border border-[#222226] rounded-2xl p-5 shadow-xl flex flex-col justify-between">
            <h2 className="text-xs font-bold text-neutral-200 mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-neutral-400" />
              Últimas Sessões de Foco
            </h2>
            <div className="space-y-2 flex-1 overflow-y-auto max-h-56">
              {state.pomodoroSessions.slice(0, 5).map(s => (
                <div key={s.id} className="flex justify-between items-center p-2 rounded-xl bg-[#141417] border border-[#222226] text-xs">
                  <span className="text-neutral-200 truncate font-medium">{s.taskTitle}</span>
                  <span className="text-neutral-400 font-bold ml-2 shrink-0 font-mono">{s.durationMinutes} min</span>
                </div>
              ))}
              {state.pomodoroSessions.length === 0 && (
                <p className="text-xs text-neutral-600 text-center py-6">Nenhuma sessão registrada ainda.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
