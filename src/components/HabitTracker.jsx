import React, { useState } from 'react';
import {
  Flame,
  Plus,
  Check,
  Trash2,
  Trophy,
  Target
} from 'lucide-react';
import { getTodayYMD, addDaysYMD } from '../utils/taskSchedule';

export default function HabitTracker({ store }) {
  const { state, addHabit, toggleHabitCheckIn, deleteHabit } = store;
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#facc15');
  const [frequency, setFrequency] = useState('daily');
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const todayStr = getTodayYMD();

  const recentDays = [];
  for (let i = 13; i >= 0; i--) {
    recentDays.push(addDaysYMD(todayStr, -i));
  }

  const handleCreateHabit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    addHabit({
      name: name.trim(),
      color,
      frequency
    });
    setName('');
    setIsAdding(false);
  };

  const colors = ['#facc15', '#eab308', '#fde047', '#f59e0b', '#ca8a04', '#d97706'];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#121215]">
      {/* Header */}
      <div className="px-4 py-3 md:px-8 md:pt-5 md:pb-4 border-b border-[#222226] bg-[#0c0c0e] flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <div className="w-8 h-8 rounded-md bg-[#16161a] border border-white/10 flex items-center justify-center shrink-0">
            <Flame className="w-4 h-4 text-[#facc15]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-white truncate whitespace-nowrap">
                Rastreador de Hábitos
              </h1>
              <span className="hidden sm:inline-flex text-[10px] bg-white/5 text-neutral-300 font-semibold px-2 py-0.5 rounded border border-white/10 shrink-0">
                ILIMITADO
              </span>
            </div>
            <p className="text-[11px] text-[#8E8E93] truncate">
              Consistência diária e sequências ativas
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className={`text-xs font-semibold px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all active:scale-95 border shrink-0 whitespace-nowrap ${
            isAdding
              ? 'bg-[#facc15]/15 border-[#facc15]/55 text-[#facc15]'
              : 'bg-[#141417] hover:bg-[#1c1c22] border-white/15 text-neutral-200'
          }`}
        >
          <Plus className="w-3.5 h-3.5 text-[#facc15]" />
          <span>Novo Hábito</span>
        </button>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-3 md:p-6 space-y-3 pb-28 md:pb-12">
        {/* New Habit Form */}
        {isAdding && (
          <div className="bg-[#09090b] border border-[#27272a] rounded-lg p-3.5 md:p-4 max-w-xl shadow-2xl">
            <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-200 mb-2.5">
              Criar Novo Hábito
            </h2>
            <form onSubmit={handleCreateHabit} className="space-y-3">
              <div>
                <label className="text-[11px] text-neutral-400 block mb-1">Nome do Hábito</label>
                <input
                  type="text"
                  placeholder="Ex: Treino diário, Estudar 30 min, Meditar..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  className="w-full bg-[#141417] border border-[#27272a] focus:border-[#facc15]/50 text-xs text-white rounded-md px-3 py-2 focus:outline-none"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <label className="text-[11px] text-neutral-400 block mb-1">Cor de Destaque</label>
                  <div className="flex gap-2">
                    {colors.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={`w-5 h-5 rounded-full transition-all ${color === c ? 'scale-125 ring-2 ring-white' : 'opacity-70 hover:opacity-100'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-[#facc15]/15 hover:bg-[#facc15]/25 border border-[#facc15]/55 text-[#facc15] rounded-md text-xs font-bold"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Habits Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {state.habits.map(habit => {
            const isDoneToday = !!habit.checkIns?.[todayStr];
            const isConfirming = confirmDeleteId === habit.id;

            return (
              <div
                key={habit.id}
                className="bg-[#0a0a0c] border border-[#222226] rounded-lg p-3.5 flex flex-col justify-between hover:border-[#2f2f36] transition-all"
              >
                <div className="flex items-start justify-between gap-2.5 mb-3">
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-md bg-[#16161a] border border-white/10 flex items-center justify-center shrink-0">
                      <Target className="w-4 h-4 text-[#facc15]" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-white text-sm leading-tight truncate">
                        {habit.name}
                      </h3>
                      <div className="flex items-center flex-wrap gap-x-2.5 gap-y-0.5 mt-0.5 text-[11px] text-neutral-400">
                        <span className="flex items-center gap-1 text-[#facc15] font-medium whitespace-nowrap">
                          <Flame className="w-3 h-3 fill-current shrink-0" />
                          {habit.currentStreak ?? habit.streak ?? 0} dias
                        </span>
                        <span className="flex items-center gap-1 text-[#8E8E93] whitespace-nowrap">
                          <Trophy className="w-3 h-3 text-neutral-400 shrink-0" />
                          Recorde: {habit.bestStreak || 0}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => toggleHabitCheckIn(habit.id, todayStr)}
                      className={`px-2.5 py-1 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 whitespace-nowrap border ${
                        isDoneToday
                          ? 'bg-[#facc15]/15 border-[#facc15]/55 text-[#facc15]'
                          : 'bg-[#141418] hover:bg-[#1f1f24] text-neutral-200 border-white/10'
                      }`}
                    >
                      <Check className={`w-3.5 h-3.5 ${isDoneToday ? 'stroke-[2.5] text-[#facc15]' : 'text-neutral-400'}`} />
                      <span>{isDoneToday ? 'Feito Hoje' : 'Marcar'}</span>
                    </button>
                    <button
                      onClick={() => {
                        if (!isConfirming) setConfirmDeleteId(habit.id);
                        else {
                          deleteHabit(habit.id);
                          setConfirmDeleteId(null);
                        }
                      }}
                      className={`p-1.5 rounded-md transition-colors ${
                        isConfirming
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold px-2'
                          : 'text-neutral-500 hover:text-rose-400'
                      }`}
                    >
                      {isConfirming ? 'Excluir?' : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Mini Heatmap Strip */}
                <div className="pt-2.5 border-t border-[#18181c]">
                  <span className="text-[10px] text-neutral-500 font-semibold uppercase tracking-wider block mb-1.5">
                    Histórico Recente
                  </span>
                  <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
                    {recentDays.map(dStr => {
                      const checked = !!habit.checkIns?.[dStr];
                      const isToday = dStr === todayStr;
                      const dayNum = parseInt(dStr.split('-')[2], 10);

                      return (
                        <div
                          key={dStr}
                          onClick={() => toggleHabitCheckIn(habit.id, dStr)}
                          title={`${dStr}: ${checked ? 'Concluído' : 'Não feito'}`}
                          className={`flex-1 min-w-5 h-6 rounded-[3px] flex items-center justify-center cursor-pointer transition-transform active:scale-90 border ${
                            checked
                              ? 'bg-[#facc15]/25 border-[#facc15]/60 text-[#facc15] font-bold'
                              : 'bg-[#121215] border-[#222226] text-neutral-500 hover:border-white/25'
                          } ${isToday ? 'ring-1 ring-white/50' : ''}`}
                        >
                          <span className="text-[9px] leading-none">{dayNum}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}

          {state.habits.length === 0 && (
            <div className="col-span-1 md:col-span-2 text-center py-12 text-neutral-600">
              <Flame className="w-10 h-10 mx-auto mb-2 text-neutral-700" />
              <p className="text-sm font-semibold text-neutral-400">Nenhum hábito cadastrado ainda</p>
              <p className="text-xs text-neutral-600 mt-1">Crie seu primeiro hábito e acompanhe suas sequências diárias!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
