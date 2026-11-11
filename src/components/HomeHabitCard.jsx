import React, { useState, useMemo, useEffect } from 'react';
import {
  Check,
  ChevronDown,
  FileText,
  Layers,
  Plus,
  Footprints,
  Briefcase,
  BookOpen,
  Dumbbell,
  Target,
  ListChecks,
  X,
  Search
} from 'lucide-react';
import { getTodayYMD, formatDateYMD, addDaysYMD, getTaskDates, getTaskTimes } from '../utils/taskSchedule';
import { inferTaskFrequency } from './ScheduledTasksOverviewModal';

const FREQ_PT = {
  daily: 'Diária',
  weekly: 'Semanal',
  monthly: 'Mensal',
  annual: 'Anual',
  single: 'Única'
};

export default function HomeHabitCard({ store }) {
  const {
    state,
    toggleHabitCheckIn,
    updateHabit,
    toggleTaskCheckIn,
    toggleTaskCompleted,
    updateTask,
    setActiveView
  } = store;

  const [viewScope, setViewScope] = useState('specific'); // 'overview' | 'specific'
  const [selectedItemKey, setSelectedItemKey] = useState(null);
  const [isPickerModalOpen, setIsPickerModalOpen] = useState(false);
  const [pickerQuery, setPickerQuery] = useState('');
  const [pickerTab, setPickerTab] = useState('all'); // 'all' | 'tasks' | 'habits'

  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [noteText, setNoteText] = useState('');

  const todayStr = getTodayYMD();

  const habits = state.habits || [];
  const tasks = useMemo(
    () => (state.tasks || []).filter((t) => !t.deleted),
    [state.tasks]
  );

  // Unified list of real habits + active tasks
  const trackables = useMemo(() => {
    const habitItems = habits.map((h) => ({
      key: `habit:${h.id}`,
      kind: 'habit',
      id: h.id,
      title: h.name,
      subtitle: h.goalText || 'Diária · Hábito contínuo',
      freqLabel: 'Hábito',
      checkIns: h.checkIns || {},
      currentStreak: h.currentStreak ?? h.streak ?? 0,
      note: h.note || '',
      completedToday: !!h.checkIns?.[todayStr],
      raw: h
    }));

    const taskItems = tasks.map((t) => {
      const freq = inferTaskFrequency(t);
      const dates = getTaskDates(t);
      const times = getTaskTimes(t);
      const combinedCheckIns = { ...(t.checkIns || {}) };
      if (t.completed && Object.keys(combinedCheckIns).length === 0) {
        const fallbackDate = t.dueDate || dates[0] || todayStr;
        combinedCheckIns[fallbackDate] = true;
      }

      let streak = 0;
      for (let i = 0; i < 60; i++) {
        const dStr = addDaysYMD(todayStr, -i);
        if (combinedCheckIns[dStr]) {
          streak++;
        } else if (i > 0) {
          break;
        }
      }

      const subParts = [FREQ_PT[freq] || 'Única'];
      if (dates.length > 1) subParts.push(`${dates.length} dias`);
      else if (t.dueDate) subParts.push(t.dueDate);
      if (times.length > 0) subParts.push(times[0]);

      const completedToday = dates.length > 1
        ? !!combinedCheckIns[todayStr]
        : (!!combinedCheckIns[todayStr] || !!t.completed);

      return {
        key: `task:${t.id}`,
        kind: 'task',
        id: t.id,
        title: t.title,
        subtitle: subParts.join(' · '),
        freqLabel: FREQ_PT[freq] || 'Única',
        checkIns: combinedCheckIns,
        currentStreak: streak,
        note: t.description || '',
        completedToday,
        scheduledCount: dates.length,
        raw: t
      };
    });

    return [...habitItems, ...taskItems];
  }, [habits, tasks, todayStr]);

  const activeIndex = useMemo(() => {
    if (!trackables.length) return 0;
    if (!selectedItemKey) return 0;
    const found = trackables.findIndex((x) => x.key === selectedItemKey);
    return found >= 0 ? found : 0;
  }, [trackables, selectedItemKey]);

  const activeItem = trackables[activeIndex] || null;

  // Reset open note editor whenever active item or scope changes
  useEffect(() => {
    setNoteModalOpen(false);
    setNoteText(activeItem?.note || '');
  }, [activeItem?.key, viewScope]);

  const overviewStats = useMemo(() => {
    const dailyActivityCounts = {};
    let totalChecks = 0;

    trackables.forEach((item) => {
      Object.entries(item.checkIns || {}).forEach(([dStr, val]) => {
        if (val) {
          dailyActivityCounts[dStr] = (dailyActivityCounts[dStr] || 0) + 1;
          totalChecks += 1;
        }
      });
    });

    const completedTasksCount = tasks.filter((t) => t.completed).length;
    const totalTasksCount = tasks.length;
    const completedHabitsToday = habits.filter((h) => h.checkIns?.[todayStr]).length;
    const totalItems = totalTasksCount + habits.length;
    const doneItems = completedTasksCount + completedHabitsToday;
    const overallPct = totalItems > 0 ? Math.round((doneItems / totalItems) * 100) : 0;

    let activeDayStreak = 0;
    for (let i = 0; i < 90; i++) {
      const dStr = addDaysYMD(todayStr, -i);
      if ((dailyActivityCounts[dStr] || 0) > 0) {
        activeDayStreak++;
      } else if (i > 0) {
        break;
      }
    }

    return {
      dailyActivityCounts,
      totalChecks,
      activeDayStreak,
      overallPct,
      doneItems,
      totalItems
    };
  }, [trackables, tasks, habits, todayStr]);

  const itemIcon = useMemo(() => {
    if (viewScope === 'overview') {
      return <Layers className="w-4 h-4 text-neutral-300" />;
    }
    if (activeItem?.kind === 'task') {
      return <ListChecks className="w-4 h-4 text-neutral-300" />;
    }
    const n = (activeItem?.title || '').toLowerCase();
    if (n.includes('walk') || n.includes('passos') || n.includes('caminh')) {
      return <Footprints className="w-4 h-4 text-neutral-300" />;
    }
    if (n.includes('work') || n.includes('trabalho') || n.includes('cop') || n.includes('dev')) {
      return <Briefcase className="w-4 h-4 text-neutral-300" />;
    }
    if (n.includes('leitura') || n.includes('livro') || n.includes('estud')) {
      return <BookOpen className="w-4 h-4 text-neutral-300" />;
    }
    if (n.includes('treino') || n.includes('academia') || n.includes('força')) {
      return <Dumbbell className="w-4 h-4 text-neutral-300" />;
    }
    return <Target className="w-4 h-4 text-neutral-300" />;
  }, [viewScope, activeItem]);

  const specificStats = useMemo(() => {
    if (!activeItem) return { finishedDays: 0, rate: 0, thirdVal: '0', thirdLabel: 'Sequência' };
    const checkIns = activeItem.checkIns || {};
    const totalDays = Object.values(checkIns).filter(Boolean).length;

    let rate = 0;
    if (activeItem.kind === 'task') {
      const targetDays = Math.max(1, activeItem.scheduledCount || 1);
      if (activeItem.completedToday && totalDays === 0) rate = 100;
      else rate = Math.min(100, Math.round((totalDays / targetDays) * 100));
    } else {
      let last30Count = 0;
      for (let i = 0; i < 30; i++) {
        const dStr = addDaysYMD(todayStr, -i);
        if (checkIns[dStr]) last30Count++;
      }
      rate = Math.round((last30Count / 30) * 100);
    }

    return {
      finishedDays: totalDays || (activeItem.completedToday ? 1 : 0),
      rate: totalDays > 0 ? rate : activeItem.completedToday ? 100 : 0,
      thirdVal: `${activeItem.currentStreak || 0}`,
      thirdLabel: 'Sequência'
    };
  }, [activeItem, todayStr]);

  // 7-row Contribution Heatmap Matrix using local dates (past 14 weeks)
  const heatmapData = useMemo(() => {
    const WEEKS_COUNT = 14;
    const now = new Date();
    const todayMid = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const currentDayOfWeek = todayMid.getDay();
    const endOfWeek = new Date(todayMid.getFullYear(), todayMid.getMonth(), todayMid.getDate() + (6 - currentDayOfWeek));

    const rows = [
      { label: 'D', dayIndex: 0 },
      { label: 'S', dayIndex: 1 },
      { label: 'T', dayIndex: 2 },
      { label: 'Q', dayIndex: 3 },
      { label: 'Q', dayIndex: 4 },
      { label: 'S', dayIndex: 5 },
      { label: 'S', dayIndex: 6 }
    ];

    return rows.map((r) => {
      const cells = [];
      for (let w = WEEKS_COUNT - 1; w >= 0; w--) {
        const cellDate = new Date(
          endOfWeek.getFullYear(),
          endOfWeek.getMonth(),
          endOfWeek.getDate() - w * 7 - (6 - r.dayIndex)
        );
        const dateStr = formatDateYMD(cellDate);
        const isFuture = dateStr > todayStr;
        const isToday = dateStr === todayStr;

        const count =
          viewScope === 'overview'
            ? overviewStats.dailyActivityCounts[dateStr] || 0
            : activeItem?.checkIns?.[dateStr]
            ? 1
            : 0;

        cells.push({
          dateStr,
          isFuture,
          isToday,
          count,
          isDone: count > 0
        });
      }
      return { ...r, cells };
    });
  }, [viewScope, overviewStats, activeItem, todayStr]);

  const handleToggleDate = (dateStr) => {
    if (viewScope === 'overview' || !activeItem) return;
    if (activeItem.kind === 'habit' && toggleHabitCheckIn) {
      toggleHabitCheckIn(activeItem.id, dateStr);
    } else if (activeItem.kind === 'task') {
      if (toggleTaskCheckIn) {
        toggleTaskCheckIn(activeItem.id, dateStr);
      } else if (dateStr === todayStr && toggleTaskCompleted) {
        toggleTaskCompleted(activeItem.id);
      }
    }
  };

  const handleOpenNote = () => {
    setNoteText(activeItem?.note || '');
    setNoteModalOpen((p) => !p);
  };

  const handleSaveNote = () => {
    if (!activeItem) return;
    if (activeItem.kind === 'habit' && updateHabit) {
      updateHabit(activeItem.id, { note: noteText.trim() });
    } else if (activeItem.kind === 'task' && updateTask) {
      updateTask(activeItem.id, { description: noteText.trim() });
    }
    setNoteModalOpen(false);
  };

  const filteredPickerItems = useMemo(() => {
    return trackables
      .filter((it) => (pickerTab === 'all' ? true : it.kind === (pickerTab === 'tasks' ? 'task' : 'habit')))
      .filter((it) => {
        if (!pickerQuery.trim()) return true;
        const q = pickerQuery.trim().toLowerCase();
        return (
          (it.title || '').toLowerCase().includes(q) ||
          (it.subtitle || '').toLowerCase().includes(q)
        );
      });
  }, [trackables, pickerTab, pickerQuery]);

  const isDoneToday = viewScope === 'specific' ? !!activeItem?.completedToday : false;

  return (
    <div className="space-y-2.5 pt-1">
      {/* Top Bar: Minimalist mode tabs (yellow outline/tint ONLY on selected tab) + neutral Listar Todas */}
      <div className="flex items-center justify-between gap-2">
        <div className="bg-[#0e0e11] p-0.5 rounded-md border border-white/10 grid grid-cols-2 gap-0.5 flex-1 max-w-[215px]">
          <button
            type="button"
            onClick={() => setViewScope('overview')}
            className={`py-1.5 px-2 rounded-[4px] text-[11px] font-semibold transition-all ${
              viewScope === 'overview'
                ? 'bg-[#facc15]/15 text-[#facc15] border border-[#facc15]/45'
                : 'text-neutral-400 hover:text-neutral-200 border border-transparent'
            }`}
          >
            Geral ({trackables.length})
          </button>
          <button
            type="button"
            onClick={() => setViewScope('specific')}
            className={`py-1.5 px-2 rounded-[4px] text-[11px] font-semibold transition-all ${
              viewScope === 'specific'
                ? 'bg-[#facc15]/15 text-[#facc15] border border-[#facc15]/45'
                : 'text-neutral-400 hover:text-neutral-200 border border-transparent'
            }`}
          >
            Por Tarefa
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            setPickerQuery('');
            setIsPickerModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#121215] hover:bg-[#1a1a1f] text-neutral-200 border border-white/12 hover:border-white/25 text-[11px] font-semibold rounded-md transition-all active:scale-95 shrink-0"
        >
          <span>Listar Todas</span>
          <ChevronDown className="w-3.5 h-3.5 text-neutral-400" />
        </button>
      </div>

      {/* Main Performance Card */}
      <div className="bg-[#0a0a0c] border border-white/10 rounded-[6px] p-3 space-y-2.5 relative overflow-hidden">
        {/* Card Header */}
        <div className="flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-8 h-8 rounded-md bg-[#141418] border border-white/10 flex items-center justify-center shrink-0">
              {itemIcon}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold text-white truncate leading-tight">
                {viewScope === 'overview'
                  ? 'Desempenho Geral'
                  : activeItem?.title || 'Sem tarefas ou hábitos'}
              </h3>
              <p className="text-[11px] text-[#8E8E93] truncate mt-0.5">
                {viewScope === 'overview'
                  ? `${overviewStats.doneItems} de ${overviewStats.totalItems} concluídos`
                  : activeItem?.subtitle || 'Crie uma tarefa ou hábito no botão +'}
              </p>
            </div>
          </div>

          {viewScope === 'specific' && trackables.length > 1 && (
            <button
              type="button"
              onClick={() => {
                const next = trackables[(activeIndex + 1) % trackables.length];
                setSelectedItemKey(next.key);
              }}
              className="text-[10px] font-mono font-semibold text-neutral-300 bg-[#141418] hover:bg-[#1c1c22] border border-white/10 px-2 py-1 rounded-md shrink-0 transition-colors"
              title="Próximo item"
            >
              {activeIndex + 1}/{trackables.length} ↻
            </button>
          )}
        </div>

        {/* 3 Compact Metric Stat Boxes */}
        {viewScope === 'overview' ? (
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-[#121215] border border-white/[0.07] rounded-md p-2 text-center">
              <div className="text-xs font-bold text-white">
                {overviewStats.doneItems}/{overviewStats.totalItems}
              </div>
              <div className="text-[10px] text-[#8E8E93] mt-0.5">Concluídos</div>
            </div>
            <div className="bg-[#121215] border border-white/[0.07] rounded-md p-2 text-center">
              <div className="text-xs font-bold text-[#facc15]">{overviewStats.overallPct}%</div>
              <div className="text-[10px] text-[#8E8E93] mt-0.5">Taxa Geral</div>
            </div>
            <div className="bg-[#121215] border border-white/[0.07] rounded-md p-2 text-center">
              <div className="text-xs font-bold text-white">{overviewStats.activeDayStreak}d</div>
              <div className="text-[10px] text-[#8E8E93] mt-0.5">Sequência</div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-[#121215] border border-white/[0.07] rounded-md p-2 text-center">
              <div className="text-xs font-bold text-white">
                {specificStats.finishedDays} {specificStats.finishedDays === 1 ? 'dia' : 'dias'}
              </div>
              <div className="text-[10px] text-[#8E8E93] mt-0.5">Concluídos</div>
            </div>
            <div className="bg-[#121215] border border-white/[0.07] rounded-md p-2 text-center">
              <div className="text-xs font-bold text-[#facc15]">{specificStats.rate}%</div>
              <div className="text-[10px] text-[#8E8E93] mt-0.5">Desempenho</div>
            </div>
            <div className="bg-[#121215] border border-white/[0.07] rounded-md p-2 text-center">
              <div className="text-xs font-bold text-white">{specificStats.thirdVal}</div>
              <div className="text-[10px] text-[#8E8E93] mt-0.5">{specificStats.thirdLabel}</div>
            </div>
          </div>
        )}

        {/* 7-Row Contribution Heatmap Matrix with CSS Grid alignment */}
        <div className="bg-[#0e0e11] border border-white/[0.08] rounded-md p-2.5">
          <div className="flex items-stretch gap-1.5">
            <div className="grid grid-rows-7 gap-1 shrink-0 select-none pr-1">
              {heatmapData.map((row, idx) => (
                <span
                  key={idx}
                  className="text-[9px] font-bold text-neutral-500 flex items-center justify-center leading-none"
                >
                  {row.label}
                </span>
              ))}
            </div>

            <div className="flex-1 grid grid-rows-7 gap-1 min-w-0">
              {heatmapData.map((row, rIdx) => (
                <div
                  key={rIdx}
                  className="grid gap-1"
                  style={{ gridTemplateColumns: 'repeat(14, minmax(0, 1fr))' }}
                >
                  {row.cells.map((cell, cIdx) => {
                    const high = cell.count >= 2;
                    return (
                      <div
                        key={cIdx}
                        onClick={() => {
                          if (!cell.isFuture && viewScope === 'specific' && activeItem) {
                            handleToggleDate(cell.dateStr);
                          }
                        }}
                        title={`${cell.dateStr}: ${cell.count > 0 ? `${cell.count} concluído(s)` : cell.isFuture ? 'Futuro' : 'Pendente'}`}
                        className={`aspect-square w-full rounded-[2px] transition-all ${
                          viewScope === 'specific' && !cell.isFuture && activeItem ? 'cursor-pointer' : ''
                        } ${
                          high
                            ? 'bg-[#facc15]'
                            : cell.isDone
                            ? 'bg-[#facc15]/80'
                            : cell.isFuture
                            ? 'bg-[#141418] opacity-30'
                            : 'bg-[#191920] border border-[#24242c] hover:border-neutral-500'
                        } ${cell.isToday ? 'ring-1 ring-white/60' : ''}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Actions - Minimalist Neutral until Active/Done */}
        {viewScope === 'overview' ? (
          <div className="flex items-center gap-2 pt-0.5">
            <button
              type="button"
              onClick={() => {
                setPickerQuery('');
                setIsPickerModalOpen(true);
              }}
              className="flex-1 py-2 px-3 rounded-md bg-[#121215] hover:bg-[#1a1a1f] text-neutral-200 border border-white/12 hover:border-white/25 font-semibold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <ListChecks className="w-3.5 h-3.5 text-neutral-400" />
              <span>Selecionar Tarefa / Hábito ({trackables.length})</span>
            </button>
          </div>
        ) : activeItem ? (
          <div className="flex items-center gap-2 pt-0.5">
            <button
              type="button"
              onClick={() => handleToggleDate(todayStr)}
              className={`flex-1 py-2 px-3 rounded-md font-semibold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 border ${
                isDoneToday
                  ? 'bg-[#facc15]/15 border-[#facc15]/55 text-[#facc15]'
                  : 'bg-[#121215] hover:bg-[#1a1a1f] border-white/12 text-neutral-200'
              }`}
            >
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{isDoneToday ? 'Concluído Hoje' : 'Concluir Hoje'}</span>
            </button>

            <button
              type="button"
              onClick={handleOpenNote}
              className={`flex-1 py-2 px-3 rounded-md font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors border ${
                noteModalOpen
                  ? 'bg-[#facc15]/15 border-[#facc15]/55 text-[#facc15]'
                  : 'bg-[#121215] hover:bg-[#1a1a1f] text-neutral-300 border-white/12'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Adicionar Nota</span>
            </button>
          </div>
        ) : null}

        {noteModalOpen && viewScope === 'specific' && activeItem && (
          <div className="pt-2 border-t border-white/10 space-y-2">
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder={`Escrever nota para "${activeItem.title}"...`}
              className="w-full bg-[#121215] border border-white/10 focus:border-[#facc15]/50 rounded-md p-2 text-xs text-white placeholder-neutral-500 outline-none resize-none h-16"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setNoteModalOpen(false)}
                className="px-2.5 py-1 text-xs text-neutral-400 hover:text-white"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={handleSaveNote}
                className="px-3 py-1 rounded-md bg-[#facc15]/15 border border-[#facc15]/55 text-[#facc15] text-xs font-bold"
              >
                Salvar Nota
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Picker Modal listing Tasks & Habits — Compact Square Cards */}
      {isPickerModalOpen && (
        <div
          onClick={() => setIsPickerModalOpen(false)}
          className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-lg bg-[#0A0A0C] border-t sm:border border-white/15 rounded-t-lg sm:rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
          >
            <div className="px-4 py-3 border-b border-white/10 bg-[#111114] flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-md bg-[#16161a] border border-white/10 flex items-center justify-center text-[#facc15]">
                  <ListChecks size={15} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Todas as Tarefas & Hábitos</h4>
                  <p className="text-[11px] text-[#8E8E93]">Escolha para acompanhar o histórico</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPickerModalOpen(false)}
                className="p-1.5 rounded-md text-neutral-400 hover:text-white hover:bg-white/10"
              >
                <X size={16} />
              </button>
            </div>

            <div className="px-3.5 pt-2.5 pb-2 space-y-2 border-b border-white/10 bg-[#0e0e11] shrink-0">
              <div className="flex items-center gap-2 bg-[#141417] border border-white/10 focus-within:border-[#facc15]/50 rounded-md px-2.5 py-1.5">
                <Search size={13} className="text-neutral-400 shrink-0" />
                <input
                  type="text"
                  value={pickerQuery}
                  onChange={(e) => setPickerQuery(e.target.value)}
                  placeholder="Filtrar tarefa ou hábito..."
                  className="w-full bg-transparent text-xs text-white placeholder-[#555558] outline-none min-w-0"
                />
              </div>

              <div className="grid grid-cols-3 gap-1 bg-[#141417] p-0.5 rounded-md border border-white/10">
                {[
                  { id: 'all', label: `Todas (${trackables.length})` },
                  { id: 'tasks', label: `Tarefas (${tasks.length})` },
                  { id: 'habits', label: `Hábitos (${habits.length})` }
                ].map((tb) => (
                  <button
                    key={tb.id}
                    type="button"
                    onClick={() => setPickerTab(tb.id)}
                    className={`py-1 rounded-[4px] text-[11px] font-semibold transition-all border ${
                      pickerTab === tb.id
                        ? 'bg-[#facc15]/15 text-[#facc15] border-[#facc15]/45'
                        : 'text-[#8E8E93] border-transparent'
                    }`}
                  >
                    {tb.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1.5 pb-6 sm:pb-3">
              <button
                type="button"
                onClick={() => {
                  setViewScope('overview');
                  setIsPickerModalOpen(false);
                }}
                className={`w-full px-2.5 py-1.5 rounded-[4px] border flex items-center justify-between gap-2 text-left transition-all ${
                  viewScope === 'overview'
                    ? 'bg-[#facc15]/12 border-[#facc15]/55'
                    : 'bg-[#121215] border-white/[0.08] hover:border-white/20'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded bg-white/5 border border-white/10 flex items-center justify-center text-neutral-300 shrink-0">
                    <Layers size={14} />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-white">Desempenho Geral</div>
                    <div className="text-[10px] text-[#8E8E93]">
                      Resumo combinado de {overviewStats.totalItems} itens ativos
                    </div>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-[#facc15] shrink-0">
                  {overviewStats.overallPct}%
                </span>
              </button>

              {filteredPickerItems.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#8E8E93]">
                  Nenhum item corresponde a "{pickerQuery}".
                </div>
              ) : (
                filteredPickerItems.map((it) => {
                  const isSelected = viewScope === 'specific' && activeItem?.key === it.key;
                  const doneCount = Object.values(it.checkIns || {}).filter(Boolean).length;
                  return (
                    <button
                      key={it.key}
                      type="button"
                      onClick={() => {
                        setSelectedItemKey(it.key);
                        setViewScope('specific');
                        setIsPickerModalOpen(false);
                      }}
                      className={`w-full px-2.5 py-1.5 rounded-[4px] border flex items-center justify-between gap-2 text-left transition-all ${
                        isSelected
                          ? 'bg-[#facc15]/12 border-[#facc15]/55'
                          : 'bg-[#121215] border-white/[0.08] hover:border-white/20'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="px-1.5 py-0.5 rounded-[3px] bg-white/[0.06] text-neutral-300 text-[9px] font-bold uppercase">
                            {it.freqLabel}
                          </span>
                          {it.completedToday && (
                            <span className="px-1.5 py-0.5 rounded-[3px] bg-[#facc15]/15 text-[#facc15] text-[9px] font-bold">
                              Concluído
                            </span>
                          )}
                        </div>
                        <div className={`text-xs font-semibold truncate ${isSelected ? 'text-[#facc15]' : 'text-white'}`}>
                          {it.title}
                        </div>
                        <div className="text-[10px] text-[#8E8E93] truncate mt-0.5">
                          {it.subtitle} · {doneCount} reg.
                        </div>
                      </div>

                      <div
                        className={`w-4 h-4 rounded-[3px] border flex items-center justify-center shrink-0 ${
                          isSelected
                            ? 'bg-[#facc15] border-[#facc15] text-black'
                            : 'border-[#3f3f46] bg-[#0A0A0C]'
                        }`}
                      >
                        {isSelected && <Check size={10} className="stroke-[3]" />}
                      </div>
                    </button>
                  );
                })
              )}

              <button
                type="button"
                onClick={() => {
                  setIsPickerModalOpen(false);
                  if (setActiveView) setActiveView('habits');
                }}
                className="w-full py-2 rounded-md border border-white/10 bg-[#141417] text-xs font-semibold text-neutral-200 hover:border-white/25 flex items-center justify-center gap-1.5"
              >
                <Plus size={13} />
                <span>Gerenciar / Criar Hábitos</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
