import React, { useState } from 'react';
import { 
  Flame, 
  Plus, 
  Check, 
  Trash2, 
  Trophy, 
  Target 
} from 'lucide-react';

export default function HabitTracker({ store }) {
  const { state, addHabit, toggleHabitCheckIn, deleteHabit } = store;
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#ef4444');
  const [frequency, setFrequency] = useState('daily');

  const todayStr = new Date().toISOString().split('T')[0];

  const getRecentDays = (count = 21) => {
    const days = [];
    for (let i = count - 1; i >= 0; i--) {
      const d = new Date(Date.now() - 86400000 * i);
      days.push(d.toISOString().split('T')[0]);
    }
    return days;
  };

  const recentDays = getRecentDays(21);

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

  const colors = ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#06b6d4', '#8b5cf6', '#ec4899', '#ffffff'];

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#121215]">
      {/* Header */}
      <div className="px-8 pt-6 pb-4 border-b border-[#222226] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#18181c] border border-[#27272a] flex items-center justify-center">
            <Flame className="w-4 h-4 text-orange-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-neutral-100">
                Rastreador de Hábitos
              </h1>
              <span className="text-[10px] bg-neutral-800 text-neutral-300 font-bold px-2 py-0.5 rounded border border-neutral-700">
                ILIMITADO
              </span>
            </div>
            <p className="text-xs text-neutral-500">
              Consistência diária com acompanhamento de sequências (*streaks*)
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="bg-neutral-200 hover:bg-white text-black text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-2 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Novo Hábito
        </button>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-8 space-y-6">
        {/* New Habit Form */}
        {isAdding && (
          <div className="bg-[#09090b] border border-[#27272a] rounded-2xl p-5 max-w-xl shadow-2xl">
            <h2 className="text-sm font-bold text-neutral-100 mb-3">
              Criar Novo Hábito
            </h2>
            <form onSubmit={handleCreateHabit} className="space-y-4">
              <div>
                <label className="text-xs text-neutral-400 block mb-1">Nome do Hábito</label>
                <input
                  type="text"
                  placeholder="Ex: Treino diário, Estudar 30 min, Meditar..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoFocus
                  className="w-full bg-[#151518] border border-[#27272a] text-xs text-white rounded-lg px-3 py-2 focus:outline-none focus:border-neutral-500"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs text-neutral-400 block mb-1">Cor</label>
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

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAdding(false)}
                    className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-neutral-200 hover:bg-white text-black rounded-lg text-xs font-bold"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Habits Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {state.habits.map(habit => {
            const isDoneToday = !!habit.checkIns[todayStr];

            return (
              <div
                key={habit.id}
                className="bg-[#0a0a0c] border border-[#222226] rounded-2xl p-5 flex flex-col justify-between shadow-xl hover:border-[#2f2f36] transition-all"
              >
                {/* Top Row */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white shadow-md"
                      style={{ backgroundColor: habit.color }}
                    >
                      <Target className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-neutral-200 text-sm leading-tight">
                        {habit.name}
                      </h3>
                      <div className="flex items-center gap-3 mt-1 text-xs text-neutral-400">
                        <span className="flex items-center gap-1 text-orange-400 font-semibold">
                          <Flame className="w-3.5 h-3.5 fill-current" />
                          {habit.currentStreak} dias seguidos
                        </span>
                        <span className="flex items-center gap-1 text-neutral-500">
                          <Trophy className="w-3 h-3 text-neutral-400" />
                          Recorde: {habit.bestStreak}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleHabitCheckIn(habit.id, todayStr)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-md ${
                        isDoneToday
                          ? 'bg-neutral-200 text-black'
                          : 'bg-[#151518] hover:bg-[#1f1f24] text-neutral-300 border border-[#27272a]'
                      }`}
                    >
                      <Check className={`w-3.5 h-3.5 ${isDoneToday ? 'stroke-[3]' : 'text-neutral-500'}`} />
                      {isDoneToday ? 'Concluído' : 'Marcar'}
                    </button>

                    <button
                      onClick={() => deleteHabit(habit.id)}
                      className="text-neutral-600 hover:text-rose-400 p-1.5 rounded-lg transition-colors"
                      title="Excluir hábito"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Heatmap / Consistency Matrix */}
                <div className="pt-3 border-t border-[#18181c]">
                  <div className="flex justify-between items-center mb-1.5 text-[10px] text-neutral-500">
                    <span>Últimos 21 dias:</span>
                    <span>Hoje</span>
                  </div>
                  <div className="flex gap-1.5 justify-between">
                    {recentDays.map((dateStr) => {
                      const checked = !!habit.checkIns[dateStr];
                      const isToday = dateStr === todayStr;
                      const dayNumber = new Date(dateStr + 'T00:00:00').getDate();

                      return (
                        <button
                          key={dateStr}
                          onClick={() => toggleHabitCheckIn(habit.id, dateStr)}
                          title={`${dateStr}: ${checked ? 'Concluído' : 'Não concluído'}`}
                          className={`w-6 h-7 rounded-md flex flex-col items-center justify-center text-[9px] font-semibold transition-all ${
                            checked
                              ? 'text-white'
                              : 'bg-[#141417] border border-[#222226] text-neutral-600 hover:border-neutral-500'
                          } ${isToday ? 'ring-1 ring-white/60' : ''}`}
                          style={{
                            backgroundColor: checked ? habit.color : undefined
                          }}
                        >
                          <span>{dayNumber}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
