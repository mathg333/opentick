import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Search,
  Calendar as CalendarIcon,
  Clock,
  Check,
  Repeat,
  SlidersHorizontal,
  Layers,
  ChevronDown,
  ChevronUp,
  Flag
} from 'lucide-react';
import { getTaskDates, getTaskTimes, parseYMD, getTodayYMD } from '../utils/taskSchedule';

const MODE_LABELS = {
  daily: 'Diário',
  weekly: 'Semanal',
  monthly: 'Mensal',
  annual: 'Anual',
  single: 'Único'
};

export function inferTaskFrequency(task) {
  const patternMode = task?.recurrencePattern?.mode;
  if (patternMode === 'daily' || task?.repeat === 'daily') return 'daily';
  if (patternMode === 'weekly' || task?.repeat === 'weekly') return 'weekly';
  if (patternMode === 'monthly' || task?.repeat === 'monthly') return 'monthly';
  if (patternMode === 'annual' || task?.repeat === 'yearly' || task?.repeat === 'annual') return 'annual';
  if (patternMode === 'custom' || patternMode === 'single') return 'single';

  const dates = getTaskDates(task);
  if (dates.length <= 1) return 'single';
  if (dates.length >= 20) return 'daily';
  if (dates.length >= 4) return 'weekly';
  return 'monthly';
}

function formatShortDate(dStr) {
  const parsed = parseYMD(dStr);
  if (!parsed) return dStr;
  const currentYear = new Date().getFullYear();
  return parsed
    .toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      ...(parsed.getFullYear() !== currentYear ? { year: '2-digit' } : {})
    })
    .replace('.', '');
}

export default function ScheduledTasksOverviewModal({
  isOpen,
  onClose,
  tasks = [],
  projects = [],
  initialFilter = 'all',
  onSelectTask
}) {
  const [filterMode, setFilterMode] = useState(initialFilter);
  const [query, setQuery] = useState('');
  const [showCompleted, setShowCompleted] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setFilterMode(initialFilter || 'all');
      setExpandedTaskId(null);
    }
  }, [isOpen, initialFilter]);

  const activeTasks = useMemo(
    () => (tasks || []).filter((t) => !t.deleted),
    [tasks]
  );

  const enrichedTasks = useMemo(() => {
    const todayStr = getTodayYMD();
    return activeTasks.map((t) => {
      const freq = inferTaskFrequency(t);
      const dates = getTaskDates(t);
      const times = getTaskTimes(t);
      const nextDate = dates.find((d) => d >= todayStr) || dates[0] || t.dueDate || '';
      const proj = (projects || []).find((p) => p.id === t.projectId);
      return {
        ...t,
        _freq: freq,
        _dates: dates,
        _times: times,
        _nextDate: nextDate,
        _projectName: proj?.name || 'Caixa de Entrada'
      };
    });
  }, [activeTasks, projects]);

  const counts = useMemo(() => {
    const base = showCompleted ? enrichedTasks : enrichedTasks.filter((t) => !t.completed);
    return {
      all: base.length,
      daily: base.filter((t) => t._freq === 'daily').length,
      weekly: base.filter((t) => t._freq === 'weekly').length,
      monthly: base.filter((t) => t._freq === 'monthly').length,
      annual: base.filter((t) => t._freq === 'annual').length,
      single: base.filter((t) => t._freq === 'single').length
    };
  }, [enrichedTasks, showCompleted]);

  const visibleTasks = useMemo(() => {
    return enrichedTasks
      .filter((t) => (showCompleted ? true : !t.completed))
      .filter((t) => (filterMode === 'all' ? true : t._freq === filterMode))
      .filter((t) => {
        if (!query.trim()) return true;
        const q = query.trim().toLowerCase();
        return (
          (t.title || '').toLowerCase().includes(q) ||
          (t.description || '').toLowerCase().includes(q) ||
          (t._projectName || '').toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        if (a.completed !== b.completed) return a.completed ? 1 : -1;
        return (a._nextDate || '9999-99-99').localeCompare(b._nextDate || '9999-99-99');
      });
  }, [enrichedTasks, showCompleted, filterMode, query]);

  if (!isOpen) return null;

  const filterTabs = [
    { id: 'all', label: 'Todas', count: counts.all },
    { id: 'daily', label: 'Diárias', count: counts.daily },
    { id: 'weekly', label: 'Semanais', count: counts.weekly },
    { id: 'monthly', label: 'Mensais', count: counts.monthly },
    { id: 'annual', label: 'Anuais', count: counts.annual },
    { id: 'single', label: 'Únicas', count: counts.single }
  ];

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[125] flex items-center justify-center p-2.5 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-[#0A0A0C] border border-white/15 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="px-4 py-3 border-b border-white/10 bg-[#111114] flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-md bg-[#16161a] border border-white/10 flex items-center justify-center text-[#facc15] shrink-0">
              <Layers size={16} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-white tracking-tight truncate">
                Todas as Tarefas Agendadas
              </h3>
              <p className="text-[11px] text-[#8E8E93] truncate">
                Diárias, Semanais, Mensais, Anuais e Avulsas
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-white/10 rounded-md transition-colors shrink-0"
            aria-label="Fechar"
          >
            <X size={17} />
          </button>
        </div>

        {/* Search + Filter Controls */}
        <div className="px-3.5 pt-2.5 pb-2 bg-[#0e0e11] border-b border-white/10 space-y-2 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0 flex items-center gap-2 bg-[#141417] border border-white/10 focus-within:border-[#facc15]/50 rounded-md px-2.5 py-1.5">
              <Search size={13} className="text-neutral-400 shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por título, descrição ou lista..."
                className="w-full min-w-0 bg-transparent text-xs text-white placeholder-[#555558] outline-none"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowCompleted((p) => !p)}
              className={`px-2.5 py-1.5 rounded-md text-[10px] font-semibold border transition-all shrink-0 ${
                showCompleted
                  ? 'bg-[#facc15]/15 text-[#facc15] border-[#facc15]/50'
                  : 'bg-[#141417] text-[#8E8E93] border-white/10 hover:text-white'
              }`}
            >
              {showCompleted ? 'Com Concluídas' : 'Só Pendentes'}
            </button>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            {filterTabs.map((tab) => {
              const active = filterMode === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilterMode(tab.id)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-semibold shrink-0 border flex items-center gap-1.5 transition-all ${
                    active
                      ? 'bg-[#facc15]/15 text-[#facc15] border-[#facc15]/50'
                      : 'bg-[#141417] text-[#A1A1AA] border-white/10 hover:text-white'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded text-[9px] font-mono ${
                      active ? 'bg-[#facc15]/20 text-[#facc15]' : 'bg-white/5 text-neutral-400'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Scrollable Cards */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {visibleTasks.length === 0 ? (
            <div className="py-12 text-center space-y-2">
              <div className="w-12 h-12 rounded-md bg-[#141417] border border-white/10 mx-auto flex items-center justify-center text-neutral-500">
                <CalendarIcon size={22} />
              </div>
              <p className="text-sm font-semibold text-neutral-300">Nenhuma tarefa encontrada neste filtro</p>
              <p className="text-xs text-[#8E8E93]">Tente outro modo ou crie um novo agendamento.</p>
            </div>
          ) : (
            visibleTasks.map((t) => {
              const isExpanded = expandedTaskId === t.id;
              const previewDates = isExpanded ? t._dates : t._dates.slice(0, 5);
              return (
                <div
                  key={t.id}
                  className="bg-[#121215] border border-white/[0.08] hover:border-white/20 rounded-md p-2.5 space-y-2 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-1.5 py-0.5 rounded-[3px] bg-white/[0.06] border border-white/10 text-neutral-300 text-[9px] font-semibold uppercase tracking-wide inline-flex items-center gap-1">
                          <Repeat size={9} className="text-[#facc15]" />
                          {MODE_LABELS[t._freq] || 'Agendada'}
                        </span>
                        <span className="px-1.5 py-0.5 rounded-[3px] bg-white/5 border border-white/10 text-[9px] font-medium text-neutral-400">
                          {t._projectName}
                        </span>
                        {t.priority > 0 && (
                          <span className="px-1.5 py-0.5 rounded-[3px] bg-[#facc15]/10 text-[#facc15] text-[9px] font-bold inline-flex items-center gap-0.5">
                            <Flag size={8} />
                            P{t.priority}
                          </span>
                        )}
                        {t.completed && (
                          <span className="px-1.5 py-0.5 rounded-[3px] bg-[#facc15]/12 text-[#facc15] text-[9px] font-semibold inline-flex items-center gap-1">
                            <Check size={9} />
                            Concluída
                          </span>
                        )}
                      </div>

                      <h4 className={`text-xs font-bold tracking-tight min-w-0 break-words ${t.completed ? 'line-through text-neutral-500' : 'text-white'}`}>
                        {t.title}
                      </h4>

                      {t.description && (
                        <p className="text-[11px] text-[#8E8E93] line-clamp-2 leading-relaxed">
                          {t.description}
                        </p>
                      )}
                    </div>

                    {onSelectTask && (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectTask(t);
                          onClose();
                        }}
                        className="px-2.5 py-1 rounded-md bg-[#18181c] hover:bg-[#222228] border border-white/12 hover:border-[#facc15]/45 text-neutral-200 text-[10px] font-semibold flex items-center gap-1 shrink-0 active:scale-95 transition-all"
                      >
                        <SlidersHorizontal size={11} className="text-[#facc15]" />
                        <span>Personalizar</span>
                      </button>
                    )}
                  </div>

                  {/* Times & Dates Meta */}
                  <div className="pt-1.5 border-t border-white/[0.06] space-y-1">
                    {t._times.length > 0 && (
                      <div className="flex items-center flex-wrap gap-1">
                        <span className="text-[10px] text-[#8E8E93] flex items-center gap-1 mr-0.5">
                          <Clock size={10} className="text-[#facc15]" />
                          Horários:
                        </span>
                        {t._times.map((tm) => (
                          <span
                            key={tm}
                            className="px-1.5 py-0.5 rounded-[3px] bg-[#0A0A0C] border border-white/10 text-[#facc15] text-[10px] font-mono font-semibold"
                          >
                            {tm}{t.endTime && t._times.length === 1 ? ` - ${t.endTime}` : ''}
                          </span>
                        ))}
                      </div>
                    )}

                    {t._dates.length > 0 ? (
                      <div className="flex items-center flex-wrap gap-1">
                        <span className="text-[10px] text-[#8E8E93] flex items-center gap-1 mr-0.5">
                          <CalendarIcon size={10} className="text-neutral-400" />
                          {t._dates.length} {t._dates.length === 1 ? 'dia:' : 'dias:'}
                        </span>
                        {previewDates.map((dStr) => (
                          <span
                            key={dStr}
                            className="px-1.5 py-0.5 rounded-[3px] bg-[#0A0A0C] border border-white/10 text-[10px] font-mono text-neutral-300"
                          >
                            {formatShortDate(dStr)}
                          </span>
                        ))}
                        {t._dates.length > 5 && (
                          <button
                            type="button"
                            onClick={() => setExpandedTaskId(isExpanded ? null : t.id)}
                            className="px-1.5 py-0.5 rounded-[3px] bg-white/5 text-[#facc15] text-[10px] font-semibold inline-flex items-center gap-0.5"
                          >
                            {isExpanded ? (
                              <>
                                Menos <ChevronUp size={10} />
                              </>
                            ) : (
                              <>
                                +{t._dates.length - 5} datas <ChevronDown size={10} />
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] text-[#8E8E93] italic">
                        Sem data específica definida
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
