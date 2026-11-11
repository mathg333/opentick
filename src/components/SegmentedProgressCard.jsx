import React, { useMemo } from 'react';
import { TrendingUp, CheckCircle2 } from 'lucide-react';
import { getTodayYMD } from '../utils/taskSchedule';

export default function SegmentedProgressCard({ store, onOpenStats }) {
  const { state, setActiveView } = store;
  const todayStr = getTodayYMD();

  // Compute today's tasks & completion
  const { todayTotal, todayDone, percentage, tags, trendPercent } = useMemo(() => {
    // 1. Tasks scheduled or created for today
    const tasksToday = (state.tasks || []).filter(t => {
      if (t.deleted) return false;
      if (t.dueDate === todayStr) return true;
      if (t.recurringDates && t.recurringDates.includes(todayStr)) return true;
      if (t.completedAt && t.completedAt.startsWith(todayStr)) return true;
      return false;
    });

    // 2. Habits checkins for today
    const habitsCount = state.habits.length;
    const habitsDoneToday = state.habits.filter(h => !!h.checkIns[todayStr]).length;

    const totalItems = tasksToday.length + habitsCount;
    const doneTasks = tasksToday.filter(t => t.completed).length;
    const doneItems = doneTasks + habitsDoneToday;

    const pct = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 100;

    // Gather unique tags from tasks today
    const collectedTags = new Set();
    tasksToday.forEach(t => {
      if (Array.isArray(t.tags)) {
        t.tags.forEach(tag => collectedTags.add(tag));
      }
    });

    const displayTags = collectedTags.size > 0 
      ? Array.from(collectedTags).slice(0, 3) 
      : ['dev', 'foco', 'produtividade'];

    // Trend simulation / delta
    const trend = pct >= 50 ? 14 : Math.max(5, Math.round(pct * 0.4));

    return {
      todayTotal: totalItems,
      todayDone: doneItems,
      percentage: pct,
      tags: displayTags,
      trendPercent: trend
    };
  }, [state.tasks, state.habits, todayStr]);

  // Total tick bars (28 bars to match the visual rhythm in the reference)
  const TOTAL_BARS = 28;
  const filledBarsCount = Math.round((percentage / 100) * TOTAL_BARS);

  // Subtitle matching image 2
  const subtitle = useMemo(() => {
    if (percentage === 100) return 'Meta diária totalmente alcançada! Parabéns pela consistência.';
    if (percentage >= 70) return 'You are on track to reach the goal today.';
    if (percentage >= 30) return 'Ritmo produtivo constante. Continue avançando nas pendências.';
    return 'Dê o pontapé inicial nas suas tarefas e hábitos de hoje.';
  }, [percentage]);

  return (
    <div className="bg-[#0a0a0c] border border-[#222226] rounded-[6px] p-4 md:p-5 shadow-2xl relative overflow-hidden transition-all hover:border-[#2f2f36]">
      {/* Top Row: Tags (3 dots menu removed per user request) */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {tags.map((tag, idx) => (
            <span
              key={idx}
              className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-medium text-neutral-300 bg-[#141418] border border-[#222228] lowercase tracking-tight shadow-sm"
            >
              {tag}
            </span>
          ))}
        </div>

        <span className="text-[10px] font-mono font-semibold text-neutral-400 bg-[#141418] border border-[#222228] px-2 py-0.5 rounded-md">
          {todayDone}/{todayTotal} feitas
        </span>
      </div>

      {/* Title */}
      <div className="mt-3">
        <h2 className="text-xl md:text-2xl font-bold text-white tracking-tight leading-none">
          Extended
        </h2>
      </div>

      {/* Fine Horizontal Divider */}
      <div className="border-t border-[#1a1a20] my-3" />

      {/* Motivational Subtitle */}
      <p className="text-xs text-neutral-400 font-normal leading-relaxed">
        {subtitle}
      </p>

      {/* Percentage & Trend Row: Clear Daily Performance Display */}
      <div className="flex items-baseline gap-3 mt-2.5">
        <span className="text-3xl md:text-4xl font-extrabold text-white tracking-tight font-sans">
          {percentage}%
        </span>

        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-bold text-neutral-200 bg-[#15151a] border border-[#26262e] shadow-sm">
            <span className="text-emerald-400 font-bold">↗</span>
            <span>{trendPercent}%</span>
          </span>
          <span className="text-xs text-neutral-400 font-normal">
            desempenho diário ({todayDone} de {todayTotal} metas)
          </span>
        </div>
      </div>

      {/* Segmented Equalizer Progress Meter Bar */}
      <div 
        className="flex items-center gap-1 sm:gap-1.5 w-full mt-4 select-none cursor-pointer"
        onClick={() => {
          if (setActiveView) setActiveView('stats');
        }}
        title={`${todayDone} de ${todayTotal} metas concluídas hoje (${percentage}%)`}
      >
        {Array.from({ length: TOTAL_BARS }).map((_, i) => {
          const isFilled = i < filledBarsCount;
          return (
            <div
              key={i}
              className={`flex-1 h-9 md:h-11 rounded-full transition-all duration-300 ${
                isFilled
                  ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.4)]'
                  : 'bg-[#18181e] border border-[#222228]'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
