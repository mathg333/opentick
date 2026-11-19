import React, { useState, useEffect } from 'react';
import {
  Plus,
  Flag,
  Clock,
  X,
  SlidersHorizontal,
  Zap,
  Target,
  Repeat,
  Bell
} from 'lucide-react';
import CustomDatePickerModal from './CustomDatePickerModal';
import TimePickerModal from './TimePickerModal';
import { ObsidianSelect, ObsidianDateButton } from './ObsidianControls';
import { getTodayYMD } from '../utils/taskSchedule';

const REMINDER_OFFSETS = [
  { value: 0, label: 'No horário' },
  { value: 5, label: '5m antes' },
  { value: 10, label: '10m antes' },
  { value: 15, label: '15m antes' },
  { value: 30, label: '30m antes' }
];

export default function GlobalQuickAddModal({
  store,
  isOpen,
  onClose,
  initialDate = '',
  initialStartTime = ''
}) {
  const { state, addTask, addTasksForMultipleDates } = store;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('inbox');
  const [priority, setPriority] = useState(0);
  const [dueDate, setDueDate] = useState(getTodayYMD);
  const [recurringDates, setRecurringDates] = useState(() => [getTodayYMD()]);
  const [recurringTimes, setRecurringTimes] = useState([]);
  const [recurrencePattern, setRecurrencePattern] = useState(null);
  const [endTime, setEndTime] = useState('');
  const [urgent, setUrgent] = useState(false);
  const [important, setImportant] = useState(false);
  const [alarmEnabled, setAlarmEnabled] = useState(true);
  const [reminderOffset, setReminderOffset] = useState(0);

  const [isCustomPickerOpen, setIsCustomPickerOpen] = useState(false);
  const [isTimePickerOpen, setIsTimePickerOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const targetDate = initialDate || getTodayYMD();
      setTitle('');
      setDescription('');
      setProjectId('inbox');
      setPriority(0);
      setUrgent(false);
      setImportant(false);
      setEndTime('');
      setDueDate(targetDate);
      setRecurringDates([targetDate]);
      setRecurringTimes(initialStartTime ? [initialStartTime] : []);
      setRecurrencePattern(null);
      setAlarmEnabled(true);
      setReminderOffset(state?.settings?.reminderOffset ?? 0);
    }
  }, [isOpen, initialDate, initialStartTime]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    const finalDates =
      recurringDates && recurringDates.length > 0
        ? recurringDates
        : dueDate
        ? [dueDate]
        : [];
    const finalTimes = [...new Set(recurringTimes)].filter(Boolean).sort();

    const payload = {
      title: title.trim(),
      description: description.trim(),
      projectId,
      priority,
      dueDate: finalDates[0] || '',
      recurringDates: finalDates,
      recurringTimes: finalTimes,
      startTime: finalTimes[0] || '',
      recurrencePattern,
      endTime,
      alarmEnabled,
      reminderOffset,
      urgent: urgent || priority >= 2,
      important: important || priority >= 2
    };

    if (finalDates.length > 1 && addTasksForMultipleDates) {
      addTasksForMultipleDates(payload, finalDates);
    } else {
      addTask(payload);
    }

    setTitle('');
    setDescription('');
    setPriority(0);
    setUrgent(false);
    setImportant(false);
    setEndTime('');
    setRecurringTimes([]);
    setRecurrencePattern(null);
    onClose();
  };

  const priorityColors = {
    0: 'text-neutral-500',
    1: 'text-[#facc15]/60',
    2: 'text-[#facc15]',
    3: 'text-[#facc15] fill-[#facc15]'
  };

  const hasCustomActive = recurringDates.length > 1 || Boolean(recurrencePattern);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#0c0c0e] border border-[#27272a] rounded-xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 max-h-[90vh] flex flex-col">
        <div className="px-4 py-3 border-b border-[#222226] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-neutral-400" />
            <span className="text-xs font-bold text-neutral-200">Nova Tarefa Rápida</span>
            <span className="text-[10px] bg-[#1a1a1f] text-neutral-400 px-1.5 py-0.5 rounded font-mono border border-[#27272a]">
              Atalho: Q
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-white hover:bg-white/10 p-1 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto">
          <input
            type="text"
            placeholder="O que você precisa fazer?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            className="w-full bg-[#151518] border border-[#27272a] focus:border-white/30 rounded-xl px-4 py-3 sm:py-3.5 text-base sm:text-lg text-white placeholder-neutral-500 focus:outline-none transition-colors"
          />

          <textarea
            rows={2}
            placeholder="Descrição, local, anotações (opcional)..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-[#151518] border border-[#27272a] focus:border-white/30 rounded-xl px-4 py-3 text-sm text-white placeholder-neutral-500 focus:outline-none resize-none leading-relaxed min-h-[75px] transition-colors"
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-neutral-300 font-semibold block mb-1.5">Lista / Projeto</label>
              <ObsidianSelect
                compact
                title="Selecionar Lista / Projeto"
                value={projectId}
                onChange={(val) => setProjectId(val)}
                options={state.projects.map(p => ({ value: p.id, label: p.name }))}
                className="w-full"
              />
            </div>

            <div>
              <label className="text-xs text-neutral-300 font-semibold block mb-1.5">Dia / Vencimento</label>
              <ObsidianDateButton
                compact
                value={dueDate}
                onChange={(val) => {
                  setDueDate(val);
                  setRecurringDates(val ? [val] : []);
                  setRecurrencePattern(null);
                }}
                className="w-full"
              />
            </div>
          </div>

          {/* Schedule & Multi-Time Bar */}
          <div className="bg-[#151518] border border-[#27272a] rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Repeat className="w-4 h-4 text-neutral-400 shrink-0" />
                <span className="text-xs font-semibold text-neutral-200 truncate">
                  {recurringDates.length > 1
                    ? `${recurringDates.length} dias marcados`
                    : dueDate || 'Sem data'}
                </span>
                {dueDate && (
                  <button
                    type="button"
                    onClick={() => {
                      setDueDate('');
                      setRecurringDates([]);
                      setRecurrencePattern(null);
                    }}
                    className="text-xs text-neutral-400 hover:text-white p-0.5"
                    title="Limpar data"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsTimePickerOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-[#0c0c0e] border border-white/12 hover:border-[#facc15]/45 text-neutral-200 text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all"
                >
                  <Clock className="w-3.5 h-3.5 text-[#facc15]" />
                  <span>+ Horário</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsCustomPickerOpen(true)}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all ${
                    hasCustomActive
                      ? 'bg-[#facc15]/15 border-[#facc15]/55 text-[#facc15]'
                      : 'bg-[#0c0c0e] border-white/12 text-neutral-200 hover:border-white/25'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Personalizado</span>
                </button>
              </div>
            </div>

            {recurringTimes.length > 0 && (
              <div className="space-y-2.5 pt-1">
                <div className="flex flex-wrap gap-2">
                  {recurringTimes.map(tm => (
                    <span
                      key={tm}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#facc15]/12 border border-[#facc15]/45 text-[#facc15] text-xs font-mono font-bold"
                    >
                      {tm}
                      <button
                        type="button"
                        onClick={() => setRecurringTimes(prev => prev.filter(x => x !== tm))}
                        className="text-[#facc15] hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  ))}
                </div>

                {/* Alarm Toggle + Reminder Offset when task has time(s) */}
                <div className="pt-2 border-t border-white/[0.06] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-neutral-300 font-semibold flex items-center gap-2">
                      <Bell className="w-3.5 h-3.5 text-[#facc15]" />
                      Alarme despertador neste horário
                    </span>
                    <button
                      type="button"
                      onClick={() => setAlarmEnabled(p => !p)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-colors ${
                        alarmEnabled
                          ? 'bg-[#facc15]/15 border-[#facc15]/50 text-[#facc15]'
                          : 'bg-[#0c0c0e] border-white/10 text-neutral-400'
                      }`}
                    >
                      {alarmEnabled ? 'Ativo' : 'Desativado'}
                    </button>
                  </div>
                  {alarmEnabled && (
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                      {REMINDER_OFFSETS.map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setReminderOffset(opt.value)}
                          className={`px-3 py-1.5 rounded-lg text-xs shrink-0 border transition-all ${
                            reminderOffset === opt.value
                              ? 'bg-[#facc15]/20 border-[#facc15]/60 text-[#facc15] font-bold'
                              : 'bg-[#0c0c0e] border-white/10 text-neutral-400 hover:text-white'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div>
              <span className="text-xs text-neutral-300 font-semibold block mb-1.5">Prioridade</span>
              <div className="flex gap-1 bg-[#151518] border border-[#27272a] rounded-xl p-1">
                {[0, 1, 2, 3].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition-all ${
                      priority === p
                        ? 'bg-[#facc15]/20 border-[#facc15]/50 text-[#facc15] font-bold'
                        : 'text-neutral-400 hover:text-neutral-200 border-transparent'
                    }`}
                  >
                    <Flag className={`w-3.5 h-3.5 ${priorityColors[p]}`} />
                    <span>{p === 0 ? 'Nenhuma' : p === 1 ? 'Baixa' : p === 2 ? 'Média' : 'Alta'}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 items-end">
              <button
                type="button"
                onClick={() => setUrgent(!urgent)}
                className={`text-xs px-3 py-2 rounded-xl border font-bold flex items-center gap-1.5 transition-all ${
                  urgent
                    ? 'bg-[#facc15]/20 border-[#facc15]/60 text-[#facc15]'
                    : 'bg-[#151518] border-[#27272a] text-neutral-400 hover:text-white'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Urgente</span>
              </button>
              <button
                type="button"
                onClick={() => setImportant(!important)}
                className={`text-xs px-3 py-2 rounded-xl border font-bold flex items-center gap-1.5 transition-all ${
                  important
                    ? 'bg-[#facc15]/20 border-[#facc15]/60 text-[#facc15]'
                    : 'bg-[#151518] border-[#27272a] text-neutral-400 hover:text-white'
                }`}
              >
                <Target className="w-3.5 h-3.5" />
                <span>Importante</span>
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-[#222226] flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm text-neutral-400 hover:text-white rounded-xl transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="bg-white hover:bg-neutral-200 disabled:opacity-30 text-black text-sm font-semibold px-5 py-2.5 rounded-xl transition-all shadow-md active:scale-95"
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
          if (Array.isArray(dates)) {
            setRecurringDates(dates);
            setDueDate(dates[0] || '');
          }
          if (Array.isArray(meta?.times)) {
            setRecurringTimes(meta.times);
          }
          if (meta?.pattern !== undefined) {
            setRecurrencePattern(meta.pattern);
          }
          if (meta?.alarmEnabled !== undefined) {
            setAlarmEnabled(meta.alarmEnabled);
          }
          if (meta?.reminderOffset !== undefined) {
            setReminderOffset(meta.reminderOffset);
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
