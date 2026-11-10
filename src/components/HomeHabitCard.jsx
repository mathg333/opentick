import React, { useState, useMemo } from 'react';
import { 
  Check, 
  ChevronDown, 
  FileText, 
  Image as ImageIcon, 
  Flame, 
  Plus,
  Footprints,
  Briefcase,
  BookOpen,
  Dumbbell,
  Target
} from 'lucide-react';

export default function HomeHabitCard({ store }) {
  const { state, toggleHabitCheckIn, setActiveView } = store;
  const [selectedHabitIndex, setSelectedHabitIndex] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [noteText, setNoteText] = useState('');

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Ensure default habits if none
  const habits = useMemo(() => {
    if (state.habits && state.habits.length > 0) {
      return state.habits;
    }
    return [
      {
        id: 'h-walk',
        name: 'Walk',
        color: '#facc15',
        goalText: 'Goal : 4.000 steps | 3 days a week',
        targetMetric: '450',
        metricUnit: 'Steps',
        checkIns: { [todayStr]: true },
        currentStreak: 4,
        bestStreak: 12
      }
    ];
  }, [state.habits, todayStr]);

  const activeHabit = habits[selectedHabitIndex] || habits[0];
  const isDoneToday = !!activeHabit?.checkIns?.[todayStr];

  // Derive icon according to habit name - unified in minimalist yellow #FACC15
  const habitIcon = useMemo(() => {
    const n = (activeHabit?.name || '').toLowerCase();
    if (n.includes('walk') || n.includes('passos') || n.includes('caminh')) {
      return <Footprints className="w-5 h-5 text-[#facc15]" />;
    }
    if (n.includes('work') || n.includes('trabalho') || n.includes('cop') || n.includes('dev')) {
      return <Briefcase className="w-5 h-5 text-[#facc15]" />;
    }
    if (n.includes('leitura') || n.includes('livro') || n.includes('estud')) {
      return <BookOpen className="w-5 h-5 text-[#facc15]" />;
    }
    if (n.includes('treino') || n.includes('academia') || n.includes('força')) {
      return <Dumbbell className="w-5 h-5 text-[#facc15]" />;
    }
    return <Target className="w-5 h-5 text-[#facc15]" />;
  }, [activeHabit]);

  // Derive goal text if missing
  const goalText = activeHabit.goalText || (
    activeHabit.name.toLowerCase().includes('walk')
      ? 'Goal : 4.000 steps | 3 days a week'
      : 'Goal : Diária | 5 dias na semana'
  );

  // Derive metric text
  const metricDisplay = useMemo(() => {
    if (activeHabit.targetMetric && activeHabit.metricUnit) {
      return { val: activeHabit.targetMetric, label: activeHabit.metricUnit };
    }
    const n = activeHabit.name.toLowerCase();
    if (n.includes('walk') || n.includes('passos') || n.includes('caminh')) {
      return { val: isDoneToday ? '4.200' : '450', label: 'Steps' };
    }
    if (n.includes('work') || n.includes('trabalho')) {
      return { val: isDoneToday ? '8' : '4', label: 'hours' };
    }
    return { val: `${activeHabit.currentStreak || 0}`, label: 'Sequência' };
  }, [activeHabit, isDoneToday]);

  // Compute stats: total finished days, completion %, metric
  const { totalFinishedDays, completionRate } = useMemo(() => {
    const checkIns = activeHabit.checkIns || {};
    const totalDays = Object.values(checkIns).filter(Boolean).length;
    // Calculate rate over the last 30 days
    let last30Count = 0;
    for (let i = 0; i < 30; i++) {
      const d = new Date(Date.now() - 86400000 * i).toISOString().split('T')[0];
      if (checkIns[d]) last30Count++;
    }
    const rate = Math.round((last30Count / 30) * 100);
    return {
      totalFinishedDays: totalDays,
      completionRate: Math.max(15, rate)
    };
  }, [activeHabit]);

  // Generate 7-row Heatmap matrix (Sunday to Saturday, past 14 weeks)
  const heatmapData = useMemo(() => {
    const WEEKS_COUNT = 14;
    const now = new Date();
    const currentDayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday

    // End date is upcoming Saturday of current week (or today if aligned)
    const endOfWeek = new Date(now);
    endOfWeek.setDate(now.getDate() + (6 - currentDayOfWeek));

    // Matrix: 7 rows (days 0..6), each row contains WEEKS_COUNT cells
    const rows = [
      { label: 'S', dayIndex: 0 },
      { label: 'M', dayIndex: 1 },
      { label: 'T', dayIndex: 2 },
      { label: 'W', dayIndex: 3 },
      { label: 'T', dayIndex: 4 },
      { label: 'F', dayIndex: 5 },
      { label: 'S', dayIndex: 6 }
    ];

    return rows.map(r => {
      const cells = [];
      for (let w = WEEKS_COUNT - 1; w >= 0; w--) {
        const cellDate = new Date(endOfWeek);
        // Move back w weeks, and select day r.dayIndex
        cellDate.setDate(endOfWeek.getDate() - (w * 7) - (6 - r.dayIndex));
        const dateStr = cellDate.toISOString().split('T')[0];
        const isFuture = cellDate > now;
        const isToday = dateStr === todayStr;
        const isDone = !!activeHabit?.checkIns?.[dateStr];

        cells.push({
          dateStr,
          isFuture,
          isToday,
          isDone
        });
      }
      return { ...r, cells };
    });
  }, [activeHabit, todayStr]);

  const secondHabit = habits.length > 1 
    ? habits[(selectedHabitIndex + 1) % habits.length] 
    : null;

  return (
    <div className="space-y-3 pt-2">
      {/* Section Header */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-sm md:text-base font-bold text-white tracking-tight">
          Your Habit ({habits.length})
        </h2>

        <div className="relative">
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-1.5 px-3 py-1 bg-[#facc15] hover:bg-[#eab308] text-black text-xs font-black rounded-xl shadow-md transition-all active:scale-95"
          >
            <span>View All</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Habit Picker Dropdown */}
          {isDropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-[#121215] border border-[#27272a] rounded-xl shadow-2xl p-2 z-50 space-y-1">
              <span className="text-[10px] uppercase font-bold text-neutral-400 px-2 py-1 block">
                Selecionar Hábito
              </span>
              {habits.map((h, i) => (
                <button
                  key={h.id || i}
                  type="button"
                  onClick={() => {
                    setSelectedHabitIndex(i);
                    setIsDropdownOpen(false);
                  }}
                  className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-colors ${
                    i === selectedHabitIndex
                      ? 'bg-[#222228] text-amber-400'
                      : 'text-neutral-300 hover:bg-[#1a1a20]'
                  }`}
                >
                  <span className="truncate">{h.name}</span>
                  {i === selectedHabitIndex && <Check className="w-3.5 h-3.5 text-[#facc15] shrink-0" />}
                </button>
              ))}

              <div className="border-t border-[#222228] pt-1 mt-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    if (setActiveView) setActiveView('habits');
                  }}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] font-bold text-neutral-400 hover:text-white flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 text-[#facc15]" />
                  <span>Gerenciar / Criar Hábito</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Habit Card */}
      <div className="bg-[#0a0a0c] border border-[#222226] rounded-2xl p-4 md:p-5 shadow-2xl space-y-4 relative overflow-hidden transition-all hover:border-[#2f2f36]">
        {/* Habit Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#16161a] border border-[#26262e] flex items-center justify-center shrink-0 shadow-md">
              {habitIcon}
            </div>
            <div className="min-w-0">
              <h3 className="text-base font-bold text-white truncate leading-tight">
                {activeHabit.name}
              </h3>
              <p className="text-[11px] text-neutral-400 truncate mt-0.5 font-medium">
                {goalText}
              </p>
            </div>
          </div>

          {habits.length > 1 && (
            <button
              type="button"
              onClick={() => setSelectedHabitIndex((selectedHabitIndex + 1) % habits.length)}
              className="text-[10px] font-bold text-neutral-400 bg-[#16161a] hover:bg-[#202026] border border-[#26262e] px-2 py-1 rounded-lg shrink-0 transition-colors"
              title="Próximo Hábito"
            >
              {selectedHabitIndex + 1}/{habits.length} ↻
            </button>
          )}
        </div>

        {/* 3 Metric Stat Boxes */}
        <div className="grid grid-cols-3 gap-2.5">
          <div className="bg-[#141418] border border-[#202026] rounded-xl p-2.5 text-center shadow-sm">
            <div className="text-sm font-extrabold text-white">
              {totalFinishedDays} days
            </div>
            <div className="text-[10px] text-neutral-400 font-medium mt-0.5">
              Finished
            </div>
          </div>

          <div className="bg-[#141418] border border-[#202026] rounded-xl p-2.5 text-center shadow-sm">
            <div className="text-sm font-extrabold text-white">
              {completionRate}%
            </div>
            <div className="text-[10px] text-neutral-400 font-medium mt-0.5">
              Completed
            </div>
          </div>

          <div className="bg-[#141418] border border-[#202026] rounded-xl p-2.5 text-center shadow-sm">
            <div className="text-sm font-extrabold text-white">
              {metricDisplay.val}
            </div>
            <div className="text-[10px] text-neutral-400 font-medium mt-0.5">
              {metricDisplay.label}
            </div>
          </div>
        </div>

        {/* 7-Row Contribution Heatmap Matrix */}
        <div className="bg-[#0e0e11] border border-[#1e1e24] rounded-xl p-3 shadow-inner">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {/* Day Labels Column */}
            <div className="flex flex-col gap-1.5 shrink-0 select-none pr-1">
              {heatmapData.map((row, idx) => (
                <span
                  key={idx}
                  className="w-3 h-3.5 sm:w-4 sm:h-4 text-[9px] font-bold text-neutral-500 flex items-center justify-center leading-none"
                >
                  {row.label}
                </span>
              ))}
            </div>

            {/* Matrix Columns */}
            <div className="flex-1 flex flex-col gap-1.5">
              {heatmapData.map((row, rIdx) => (
                <div key={rIdx} className="flex items-center gap-1 sm:gap-1.5 justify-between">
                  {row.cells.map((cell, cIdx) => (
                    <div
                      key={cIdx}
                      onClick={() => {
                        if (!cell.isFuture && toggleHabitCheckIn) {
                          toggleHabitCheckIn(activeHabit.id, cell.dateStr);
                        }
                      }}
                      title={`${cell.dateStr}: ${cell.isDone ? 'Concluído' : cell.isFuture ? 'Futuro' : 'Pendente'}`}
                      className={`flex-1 aspect-square max-w-4 max-h-4 rounded-[4px] transition-all cursor-pointer ${
                        cell.isDone
                          ? 'bg-[#facc15] shadow-[0_0_6px_rgba(250,204,21,0.65)] hover:scale-110'
                          : cell.isFuture
                          ? 'bg-[#141418] opacity-30 cursor-not-allowed'
                          : 'bg-[#191920] border border-[#22222a] hover:border-neutral-500'
                      } ${cell.isToday ? 'ring-1 ring-white/60' : ''}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center gap-2 pt-1">
          {/* Primary Done Button */}
          <button
            type="button"
            onClick={() => {
              if (toggleHabitCheckIn) {
                toggleHabitCheckIn(activeHabit.id, todayStr);
              }
            }}
            className={`flex-1 py-3 px-4 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg ${
              isDoneToday
                ? 'bg-[#facc15] text-black shadow-[0_0_12px_rgba(250,204,21,0.4)]'
                : 'bg-[#facc15]/90 hover:bg-[#facc15] text-black'
            }`}
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>{isDoneToday ? 'Done' : 'Done'}</span>
          </button>

          {/* Add Note Button */}
          <button
            type="button"
            onClick={() => setNoteModalOpen(!noteModalOpen)}
            className="flex-1 py-3 px-4 rounded-xl bg-[#16161a] hover:bg-[#202026] text-neutral-200 border border-[#26262e] font-bold text-xs flex items-center justify-center gap-2 transition-colors"
          >
            <FileText className="w-4 h-4 text-[#facc15]" />
            <span>Add Note</span>
          </button>

          {/* Quick Stats / Image Button */}
          <button
            type="button"
            onClick={() => {
              if (setActiveView) setActiveView('habits');
            }}
            className="p-3 rounded-xl bg-[#16161a] hover:bg-[#202026] text-neutral-400 hover:text-white border border-[#26262e] flex items-center justify-center transition-colors"
            title="Abrir Rastreador Completo"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Mini Inline Note Editor */}
        {noteModalOpen && (
          <div className="pt-2 border-t border-[#1e1e24] space-y-2">
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder={`Escrever nota rápida para "${activeHabit.name}"...`}
              className="w-full bg-[#141418] border border-[#27272a] rounded-xl p-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-400 resize-none h-16"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setNoteModalOpen(false)}
                className="px-3 py-1 text-xs text-neutral-400 hover:text-white"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => {
                  setNoteModalOpen(false);
                }}
                className="px-3 py-1 bg-[#facc15] text-black text-xs font-bold rounded-lg"
              >
                Salvar Nota
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Peek of Second Habit (matching Image 1 where Working Time peeks below) */}
      {secondHabit && (
        <div
          onClick={() => setSelectedHabitIndex((selectedHabitIndex + 1) % habits.length)}
          className="bg-[#0a0a0c]/80 border border-[#1e1e24] rounded-2xl p-3.5 shadow-lg flex items-center justify-between cursor-pointer hover:border-[#2f2f36] transition-all opacity-85"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#facc15]/10 border border-[#facc15]/30 flex items-center justify-center text-xs">
              <Briefcase className="w-4 h-4 text-[#facc15]" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-neutral-200">
                {secondHabit.name}
              </h4>
              <p className="text-[10px] text-neutral-500">
                {secondHabit.goalText || 'Goal : 5 days a week'}
              </p>
            </div>
          </div>

          <span className="text-[10px] font-bold text-[#facc15] bg-[#facc15]/10 border border-[#facc15]/20 px-2 py-0.5 rounded-lg">
            Ver Hábito ➔
          </span>
        </div>
      )}
    </div>
  );
}
