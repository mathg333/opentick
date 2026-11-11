import React, { useState, useEffect } from 'react';
import {
  Plus,
  Flag,
  Calendar as CalendarIcon,
  Clock,
  X,
  SlidersHorizontal,
  Zap,
  Target,
  Repeat
} from 'lucide-react';
import CustomDatePickerModal from './CustomDatePickerModal';
import TimePickerModal from './TimePickerModal';
import { getTodayYMD } from '../utils/taskSchedule';

export default function GlobalQuickAddModal({ store, isOpen, onClose }) {
  const { state, addTask, addTasksForMultipleDates } = store;

  const [title, setTitle] = useState('');
  const [projectId, setProjectId] = useState('inbox');
  const [priority, setPriority] = useState(0);
  const [dueDate, setDueDate] = useState(getTodayYMD);
  const [recurringDates, setRecurringDates] = useState(() => [getTodayYMD()]);
  const [recurringTimes, setRecurringTimes] = useState([]);
  const [recurrencePattern, setRecurrencePattern] = useState(null);
  const [endTime, setEndTime] = useState('');
  const [urgent, setUrgent] = useState(false);
  const [important, setImportant] = useState(false);

  const [isCustomPickerOpen, setIsCustomPickerOpen] = useState(false);
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const today = getTodayYMD();
      setDueDate(today);
      setRecurringDates([today]);
      setRecurringTimes([]);
      setRecurrencePattern(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const finalDates =
      recurringDates && recurringDates.length > 0
        ? recurringDates
        : dueDate
        ? [dueDate]
        : [getTodayYMD()];
    const finalTimes = [...new Set(recurringTimes)].filter(Boolean).sort();

    if (finalDates.length > 1 && addTasksForMultipleDates) {
      addTasksForMultipleDates(
        {
          title: title.trim(),
          projectId,
          priority,
          dueDate: finalDates[0],
          recurringTimes: finalTimes,
          startTime: finalTimes[0] || '',
          recurrencePattern,
          endTime,
          urgent: urgent || priority >= 2,
          important: important || priority >= 2
        },
        finalDates
      );
    } else {
      addTask({
        title: title.trim(),
        projectId,
        priority,
        dueDate: finalDates[0] || dueDate,
        recurringDates: finalDates,
        recurringTimes: finalTimes,
        startTime: finalTimes[0] || '',
        recurrencePattern,
        endTime,
        urgent: urgent || priority >= 2,
        important: important || priority >= 2
      });
    }

    setTitle('');
    setRecurringTimes([]);
    setRecurrencePattern(null);
    onClose();
  };

  const priorityColors = {
    0: 'text-[#facc15]/40',
    1: 'text-[#facc15]/60',
    2: 'text-[#facc15]',
    3: 'text-[#facc15] fill-[#facc15]'
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#0c0c0e] border border-[#27272a] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 max-h-[90vh] flex flex-col">
        <div className="p-4 border-b border-[#222226] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-[#facc15]" />
            <span className="text-xs font-bold text-neutral-200">Nova Tarefa Rápida</span>
            <span className="text-[10px] bg-[#1a1a1f] text-neutral-400 px-1.5 py-0.5 rounded font-mono border border-[#27272a]">
              Atalho: Q
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#facc15] hover:bg-white/10 p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5 overflow-y-auto">
          <input
            type="text"
            placeholder="O que você precisa fazer?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            className="w-full bg-[#151518] border border-[#27272a] rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#facc15]/60"
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-neutral-400 block mb-1">Lista / Projeto</label>
              <select
                value={projectId}
                onChange={(e) => setProjectId(e.target.value)}
                className="w-full bg-[#151518] border border-[#27272a] rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-none"
              >
                {state.projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-[11px] text-neutral-400 block mb-1">Vencimento</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => {
                  const val = e.target.value;
                  setDueDate(val);
                  setRecurringDates(val ? [val] : []);
                }}
                className="w-full bg-[#151518] border border-[#27272a] rounded-lg px-2.5 py-1.5 text-xs text-neutral-200 focus:outline-none"
              />
            </div>
          </div>

          {/* Schedule & Multi-Time Bar + 'Personalizado' Button */}
          <div className="bg-[#151518] border border-[#27272a] rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Repeat className="w-3.5 h-3.5 text-[#facc15] shrink-0" />
                <span className="text-[11px] font-bold text-neutral-200 truncate">
                  {recurringDates.length > 1
                    ? `${recurringDates.length} dias marcados`
                    : dueDate || 'Sem data'}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsTimePickerOpen(true)}
                  className="px-2 py-1 rounded-lg bg-[#0c0c0e] border border-[#facc15]/35 text-[#facc15] text-[10px] font-bold flex items-center gap-1 hover:bg-[#facc15]/10"
                >
                  <Clock className="w-3 h-3 text-[#facc15]" />
                  <span>+ Horário</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsCustomPickerOpen(true)}
                  className="px-2.5 py-1 rounded-lg bg-[#facc15] hover:bg-[#eab308] text-black text-[10px] font-black flex items-center gap-1 shadow-sm"
                >
                  <SlidersHorizontal className="w-3 h-3 text-black" />
                  <span>Personalizado</span>
                </button>
              </div>
            </div>

            {recurringTimes.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {recurringTimes.map(tm => (
                  <span
                    key={tm}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#facc15]/15 border border-[#facc15]/40 text-[#facc15] text-[11px] font-mono font-bold"
                  >
                    {tm}
                    <button
                      type="button"
                      onClick={() => setRecurringTimes(prev => prev.filter(x => x !== tm))}
                      className="text-[#facc15] hover:text-white"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div>
              <span className="text-[11px] text-neutral-400 block mb-1">Prioridade</span>
              <div className="flex gap-1 bg-[#151518] border border-[#27272a] rounded-lg p-1">
                {[0, 1, 2, 3].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`px-2 py-1 rounded text-[11px] flex items-center gap-1 ${priority === p ? 'bg-[#27272a] text-white font-bold' : 'text-neutral-500 hover:text-neutral-300'}`}
                  >
                    <Flag className={`w-3 h-3 ${priorityColors[p]}`} />
                    <span>{p === 0 ? 'Nenhuma' : p === 1 ? 'Baixa' : p === 2 ? 'Média' : 'Alta'}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-1.5 items-end">
              <button
                type="button"
                onClick={() => setUrgent(!urgent)}
                className={`text-[11px] px-2.5 py-1.5 rounded-lg border font-semibold flex items-center gap-1 ${
                  urgent ? 'bg-[#facc15]/20 border-[#facc15]/60 text-[#facc15]' : 'bg-[#151518] border-[#27272a] text-neutral-400'
                }`}
              >
                <Zap className="w-3 h-3 text-[#facc15]" />
                <span>Urgente</span>
              </button>
              <button
                type="button"
                onClick={() => setImportant(!important)}
                className={`text-[11px] px-2.5 py-1.5 rounded-lg border font-semibold flex items-center gap-1 ${
                  important ? 'bg-[#facc15]/20 border-[#facc15]/60 text-[#facc15]' : 'bg-[#151518] border-[#27272a] text-neutral-400'
                }`}
              >
                <Target className="w-3 h-3 text-[#facc15]" />
                <span>Importante</span>
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-[#222226] flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs text-neutral-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="bg-[#facc15] hover:bg-[#eab308] disabled:opacity-30 text-black text-xs font-black px-4 py-1.5 rounded-xl transition-colors"
            >
              Criar Tarefa
            </button>
          </div>
        </form>
      </div>

      {/* Personalizado Modal */}
      <CustomDatePickerModal
        isOpen={isCustomPickerOpen}
        onClose={() => setIsCustomPickerOpen(false)}
        initialDates={recurringDates}
        initialDate={dueDate}
        initialTimes={recurringTimes}
        initialMode={recurrencePattern?.mode || 'monthly'}
        onSelectDates={(dates, _firstTime, meta) => {
          if (dates && dates.length > 0) {
            setRecurringDates(dates);
            setDueDate(dates[0]);
          }
          if (Array.isArray(meta?.times)) {
            setRecurringTimes(meta.times);
          }
          if (meta?.pattern) {
            setRecurrencePattern(meta.pattern);
          }
        }}
      />

      {/* Quick Time Picker */}
      <TimePickerModal
        isOpen={isTimePickerOpen}
        onClose={() => setIsTimePickerOpen(false)}
        initialTime={recurringTimes[recurringTimes.length - 1] || '09:00'}
        onSelectTime={(picked) => {
          if (picked) {
            setRecurringTimes(prev => [...new Set([...prev, picked])].sort());
          }
        }}
      />
    </div>
  );
}
