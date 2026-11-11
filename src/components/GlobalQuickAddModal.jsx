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
            <Plus className="w-4 h-4 text-[#facc15]" />
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

        <form onSubmit={handleSubmit} className="p-4 space-y-3 overflow-y-auto">
          <input
            type="text"
            placeholder="O que você precisa fazer?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            className="w-full bg-[#151518] border border-[#27272a] rounded-md px-3 py-2 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-[#facc15]/55"
          />

          <textarea
            rows={2}
            placeholder="Descrição, local, anotações (opcional)..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-[#151518] border border-[#27272a] rounded-md px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#facc15]/55 resize-none"
          />

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="text-[11px] text-neutral-400 block mb-1">Lista / Projeto</label>
              <ObsidianSelect
                compact
                title="Selecionar Lista / Projeto"
                value={projectId}
                onChange={(val) => setProjectId(val)}
                options={state.projects.map(p => ({ value: p.id, label: p.name }))}
                className="py-2 px-2.5 text-xs"
              />
            </div>

            <div>
              <label className="text-[11px] text-neutral-400 block mb-1">Dia / Vencimento</label>
              <ObsidianDateButton
                compact
                value={dueDate}
                onChange={(val) => {
                  setDueDate(val);
                  setRecurringDates(val ? [val] : []);
                  setRecurrencePattern(null);
                }}
                className="w-full py-2 px-2.5"
              />
            </div>
          </div>

          {/* Schedule & Multi-Time Bar */}
          <div className="bg-[#151518] border border-[#27272a] rounded-md p-2.5 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Repeat className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <span className="text-[11px] font-semibold text-neutral-200 truncate">
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
                    className="text-[10px] text-neutral-500 hover:text-neutral-300"
                    title="Limpar data"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsTimePickerOpen(true)}
                  className="px-2 py-1 rounded-md bg-[#0c0c0e] border border-white/12 hover:border-[#facc15]/45 text-neutral-200 text-[10px] font-semibold flex items-center gap-1"
                >
                  <Clock className="w-3 h-3 text-[#facc15]" />
                  <span>+ Horário</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsCustomPickerOpen(true)}
                  className={`px-2 py-1 rounded-md border text-[10px] font-semibold flex items-center gap-1 transition-all ${
                    hasCustomActive
                      ? 'bg-[#facc15]/15 border-[#facc15]/55 text-[#facc15]'
                      : 'bg-[#0c0c0e] border-white/12 text-neutral-200 hover:border-white/25'
                  }`}
                >
                  <SlidersHorizontal className="w-3 h-3" />
                  <span>Personalizado</span>
                </button>
              </div>
            </div>

            {recurringTimes.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="flex flex-wrap gap-1.5">
                  {recurringTimes.map(tm => (
                    <span
                      key={tm}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#facc15]/12 border border-[#facc15]/40 text-[#facc15] text-[11px] font-mono font-bold"
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

                {/* Alarm Toggle + Reminder Offset when task has time(s) */}
                <div className="pt-1.5 border-t border-white/[0.06] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-neutral-400 font-semibold flex items-center gap-1.5">
                      <Bell className="w-3 h-3 text-[#facc15]" />
                      Alarme despertador neste horário
                    </span>
                    <button
                      type="button"
                      onClick={() => setAlarmEnabled(p => !p)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        alarmEnabled
                          ? 'bg-[#facc15]/15 border-[#facc15]/50 text-[#facc15]'
                          : 'bg-[#0c0c0e] border-white/10 text-neutral-500'
                      }`}
                    >
                      {alarmEnabled ? 'Ativo' : 'Desativado'}
                    </button>
                  </div>
                  {alarmEnabled && (
                    <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
                      {REMINDER_OFFSETS.map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => setReminderOffset(opt.value)}
                          className={`px-2 py-0.5 rounded text-[10px] shrink-0 border ${
                            reminderOffset === opt.value
                              ? 'bg-[#facc15]/15 border-[#facc15]/50 text-[#facc15] font-semibold'
                              : 'bg-[#0c0c0e] border-white/10 text-neutral-400'
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

          <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
            <div>
              <span className="text-[11px] text-neutral-400 block mb-1">Prioridade</span>
              <div className="flex gap-1 bg-[#151518] border border-[#27272a] rounded-md p-0.5">
                {[0, 1, 2, 3].map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`px-2 py-1 rounded-[4px] text-[11px] flex items-center gap-1 border ${
                      priority === p
                        ? 'bg-[#facc15]/15 border-[#facc15]/45 text-[#facc15] font-semibold'
                        : 'text-neutral-500 hover:text-neutral-300 border-transparent'
                    }`}
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
                className={`text-[11px] px-2.5 py-1.5 rounded-md border font-semibold flex items-center gap-1 ${
                  urgent
                    ? 'bg-[#facc15]/15 border-[#facc15]/50 text-[#facc15]'
                    : 'bg-[#151518] border-[#27272a] text-neutral-400'
                }`}
              >
                <Zap className="w-3 h-3" />
                <span>Urgente</span>
              </button>
              <button
                type="button"
                onClick={() => setImportant(!important)}
                className={`text-[11px] px-2.5 py-1.5 rounded-md border font-semibold flex items-center gap-1 ${
                  important
                    ? 'bg-[#facc15]/15 border-[#facc15]/50 text-[#facc15]'
                    : 'bg-[#151518] border-[#27272a] text-neutral-400'
                }`}
              >
                <Target className="w-3 h-3" />
                <span>Importante</span>
              </button>
            </div>
          </div>

          <div className="pt-2.5 border-t border-[#222226] flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="bg-[#facc15] hover:bg-[#eab308] disabled:opacity-30 text-black text-xs font-bold px-4 py-1.5 rounded-md transition-colors"
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
