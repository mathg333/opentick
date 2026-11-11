import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Clock,
  Bell,
  Calendar as CalendarIcon,
  AlignLeft,
  Flag,
  Check,
  Plus,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import TimePickerModal from './TimePickerModal';
import { ObsidianDateButton } from './ObsidianControls';
import {
  getTodayYMD,
  parseYMD,
  formatDateYMD,
  generateDailyDates,
  generateWeeklyDates,
  generateMonthlyRepeatedDates,
  generateAnnualDates
} from '../utils/taskSchedule';

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTH_SHORT = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export default function TimeSlotModal({
  isOpen,
  onClose,
  initialDate = '',
  initialStartTime = '09:00',
  initialRepeatMode = 'single', // 'single' | 'weekly' | 'monthly' | 'annual'
  projects = [],
  onConfirm
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [repeatMode, setRepeatMode] = useState('single'); // 'single' | 'weekly' | 'monthly' | 'annual'

  // Single-day state
  const [singleDate, setSingleDate] = useState('');
  const [extraSingleDates, setExtraSingleDates] = useState([]);

  // Weekly inline state
  const [weeklyDays, setWeeklyDays] = useState([1, 3, 5]);
  const [weeklyStartDate, setWeeklyStartDate] = useState('');
  const [weeklyWeeksCount, setWeeklyWeeksCount] = useState(12);

  // Monthly inline state
  const [monthCursor, setMonthCursor] = useState(() => new Date());
  const [monthlyPickedDates, setMonthlyPickedDates] = useState([]);
  const [monthlyHorizon, setMonthlyHorizon] = useState(1);

  // Annual inline state
  const [annualYear, setAnnualYear] = useState(() => new Date().getFullYear());
  const [annualMonths, setAnnualMonths] = useState([]);
  const [annualDays, setAnnualDays] = useState([]);

  // Time state
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('');
  const [extraTimes, setExtraTimes] = useState([]);
  const [timePickerTarget, setTimePickerTarget] = useState(null); // 'start' | 'end' | 'extra' | null

  // Daily repeat duration
  const [dailyDurationDays, setDailyDurationDays] = useState(30);

  // Category, priority & alarm
  const [projectId, setProjectId] = useState('inbox');
  const [priority, setPriority] = useState(1);
  const [alarmEnabled, setAlarmEnabled] = useState(true);
  const [reminderOffset, setReminderOffset] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    const baseDate = initialDate || getTodayYMD();
    const anchor = parseYMD(baseDate) || new Date();
    const baseStart = initialStartTime || '09:00';
    const [hh, mm] = baseStart.split(':').map(Number);
    const defaultEndHour = Number.isNaN(hh) ? 10 : Math.min(23, hh + 1);
    const defaultEnd = `${String(defaultEndHour).padStart(2, '0')}:${String(Number.isNaN(mm) ? 0 : mm).padStart(2, '0')}`;

    const normRepeat =
      initialRepeatMode === 'week' || initialRepeatMode === 'weekly' ? 'weekly' :
      initialRepeatMode === 'month' || initialRepeatMode === 'monthly' ? 'monthly' :
      initialRepeatMode === 'year' || initialRepeatMode === 'annual' ? 'annual' :
      'single';

    setTitle('');
    setDescription('');
    setRepeatMode(normRepeat);

    setSingleDate(baseDate);
    setExtraSingleDates([]);

    setWeeklyDays([anchor.getDay()]);
    setWeeklyStartDate(baseDate);
    setWeeklyWeeksCount(12);

    setMonthCursor(new Date(anchor.getFullYear(), anchor.getMonth(), 1));
    setMonthlyPickedDates([baseDate]);
    setMonthlyHorizon(1);

    setAnnualYear(anchor.getFullYear());
    setAnnualMonths([anchor.getMonth()]);
    setAnnualDays([anchor.getDate()]);

    setStartTime(baseStart);
    setEndTime(defaultEnd !== baseStart ? defaultEnd : '');
    setExtraTimes([]);
    setTimePickerTarget(null);
    setProjectId(projects?.[0]?.id || 'inbox');
    setDailyDurationDays(30);
    setPriority(1);
    setAlarmEnabled(true);
    setReminderOffset(0);
  }, [isOpen, initialDate, initialStartTime, initialRepeatMode]);

  // Live resolved dates based on selected inline mode
  const resolvedDates = useMemo(() => {
    if (repeatMode === 'daily') {
      const gen = generateDailyDates(singleDate || getTodayYMD(), 1, dailyDurationDays);
      return gen.length > 0 ? gen : [singleDate || getTodayYMD()];
    }
    if (repeatMode === 'weekly') {
      const gen = generateWeeklyDates({
        startDateStr: weeklyStartDate || getTodayYMD(),
        weekdays: weeklyDays.length > 0 ? weeklyDays : [new Date().getDay()],
        intervalWeeks: 1,
        durationWeeks: weeklyWeeksCount
      });
      return gen.length > 0 ? gen : [weeklyStartDate || getTodayYMD()];
    }
    if (repeatMode === 'monthly') {
      const seeds = monthlyPickedDates.length > 0 ? monthlyPickedDates : [singleDate || getTodayYMD()];
      if (monthlyHorizon <= 1) return [...new Set(seeds)].sort();
      const gen = generateMonthlyRepeatedDates({
        seedDates: seeds,
        repeatMonthsCount: monthlyHorizon
      });
      return gen.length > 0 ? gen : [...new Set(seeds)].sort();
    }
    if (repeatMode === 'annual') {
      const gen = generateAnnualDates({
        year: annualYear,
        months: annualMonths.length > 0 ? annualMonths : [new Date().getMonth()],
        daysOfMonth: annualDays.length > 0 ? annualDays : [new Date().getDate()]
      });
      return gen.length > 0 ? gen : [singleDate || getTodayYMD()];
    }
    // Single / Dia mode (+ any toggled extra dates)
    return [...new Set([singleDate || getTodayYMD(), ...extraSingleDates])].filter(Boolean).sort();
  }, [
    repeatMode,
    singleDate,
    extraSingleDates,
    weeklyStartDate,
    weeklyDays,
    weeklyWeeksCount,
    monthlyPickedDates,
    dailyDurationDays,
    monthlyHorizon,
    annualYear,
    annualMonths,
    annualDays
  ]);

  // Month calendar matrix for 'monthly' tab
  const monthCalendarCells = useMemo(() => {
    const y = monthCursor.getFullYear();
    const m = monthCursor.getMonth();
    const firstWeekday = new Date(y, m, 1).getDay();
    const daysCount = new Date(y, m + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysCount; d++) {
      cells.push(formatDateYMD(new Date(y, m, d)));
    }
    return cells;
  }, [monthCursor]);

  if (!isOpen) return null;

  const primaryDate = resolvedDates[0] || singleDate || getTodayYMD();
  const parsedPrimary = parseYMD(primaryDate);
  const formattedDateLabel = parsedPrimary
    ? parsedPrimary.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      })
    : primaryDate;

  const allTimes = [...new Set([startTime, ...extraTimes])].filter(Boolean).sort();

  const toggleItem = (setter, item) => {
    setter((prev) => (prev.includes(item) ? prev.filter((x) => x !== item) : [...prev, item]));
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!title.trim()) return;

    onConfirm({
      title: title.trim(),
      description: description.trim(),
      dates: resolvedDates,
      dueDate: resolvedDates[0] || primaryDate,
      recurringTimes: allTimes,
      startTime: allTimes[0] || startTime,
      endTime: endTime || '',
      projectId,
      priority,
      alarmEnabled,
      reminderOffset,
      recurrencePattern:
        repeatMode === 'single'
          ? (resolvedDates.length > 1 ? { mode: 'custom', customDates: resolvedDates } : null)
          : repeatMode === 'daily'
          ? { mode: 'daily', intervalDays: 1, durationDays: dailyDurationDays, startDate: singleDate }
          : {
              mode: repeatMode,
              weekdays: weeklyDays,
              months: annualMonths,
              daysOfMonth: annualDays,
              year: annualYear,
              monthlyHorizon
            }
    });
    onClose();
  };

  const priorityOptions = [
    { value: 0, label: 'Nenhuma' },
    { value: 1, label: 'Baixa' },
    { value: 2, label: 'Média' },
    { value: 3, label: 'Alta' }
  ];

  const repeatTabs = [
    { id: 'single', label: 'Dia' },
    { id: 'daily', label: 'Diário' },
    { id: 'weekly', label: 'Semanal' },
    { id: 'monthly', label: 'Mensal' },
    { id: 'annual', label: 'Anual' }
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2.5 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-[#0A0A0C] border border-white/15 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-white/10 flex items-center justify-between bg-[#111114] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#facc15]/15 border border-[#facc15]/30 flex items-center justify-center text-[#facc15] shrink-0">
              <Clock size={18} />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-black text-white tracking-tight truncate">
                Reservar Horário
              </h3>
              <p className="text-[11px] text-[#facc15]/85 font-medium capitalize truncate">
                {formattedDateLabel} · {startTime}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-[#facc15] hover:bg-white/10 rounded-xl transition-colors shrink-0"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto px-4 py-3.5 space-y-3.5">
          {/* Title */}
          <div>
            <label className="text-[11px] font-bold text-[#A1A1AA] uppercase tracking-wider block mb-1.5">
              Título / Tarefa
            </label>
            <input
              type="text"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={`O que você vai fazer às ${startTime}?`}
              className="w-full bg-[#141417] border border-white/10 focus:border-[#facc15]/60 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-[#555558] outline-none font-medium"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-[11px] font-bold text-[#A1A1AA] uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
              <AlignLeft size={13} className="text-[#facc15]" />
              <span>Descrição</span>
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Adicione observações, link, local ou detalhes deste horário..."
              className="w-full bg-[#141417] border border-white/10 focus:border-[#facc15]/60 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#555558] outline-none resize-none leading-relaxed"
            />
          </div>

          {/* Time Configuration */}
          <div className="bg-[#141417] border border-white/10 rounded-lg p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Clock size={15} className="text-[#facc15]" />
                <span>Horário(s) Aplicados</span>
              </span>
              <button
                type="button"
                onClick={() => setTimePickerTarget('extra')}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0A0A0C] border border-[#facc15]/35 text-[#facc15] text-[10px] font-bold hover:bg-[#facc15]/10"
              >
                <Plus size={12} className="text-[#facc15]" />
                <span>+ Horário</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[10px] text-[#8E8E93] font-bold block mb-1">Início</span>
                <button
                  type="button"
                  onClick={() => setTimePickerTarget('start')}
                  className="w-full bg-[#0A0A0C] border border-[#facc15]/45 hover:bg-[#facc15]/10 rounded-xl px-3 py-2 text-xs font-mono font-black text-[#facc15] flex items-center justify-between"
                >
                  <span>{startTime}</span>
                  <Clock size={13} className="text-[#facc15]" />
                </button>
              </div>
              <div>
                <span className="text-[10px] text-[#8E8E93] font-bold block mb-1">Término (opcional)</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setTimePickerTarget('end')}
                    className="flex-1 bg-[#0A0A0C] border border-white/10 hover:border-[#facc15]/40 rounded-xl px-3 py-2 text-xs font-mono font-bold text-white flex items-center justify-between"
                  >
                    <span>{endTime || '--:--'}</span>
                    <Clock size={13} className="text-[#facc15]" />
                  </button>
                  {endTime && (
                    <button
                      type="button"
                      onClick={() => setEndTime('')}
                      className="p-2 rounded-xl bg-[#0A0A0C] border border-white/10 text-[#facc15] hover:bg-white/5"
                      title="Limpar horário de término"
                    >
                      <X size={13} />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {extraTimes.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {extraTimes.map((tm) => (
                  <span
                    key={tm}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#facc15]/15 border border-[#facc15]/40 text-[#facc15] text-[11px] font-mono font-bold"
                  >
                    {tm}
                    <button
                      type="button"
                      onClick={() => setExtraTimes((prev) => prev.filter((x) => x !== tm))}
                      className="text-[#facc15] hover:text-white"
                    >
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Direct Inline Repeat & Day Customization (Dia | Semanal | Mensal | Anual) */}
          <div className="bg-[#141417] border border-white/10 rounded-lg p-3 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <CalendarIcon size={15} className="text-[#facc15]" />
                <span>Dia e Repetição dos Horários</span>
              </span>
              <span className="text-[10px] font-mono font-black text-[#facc15] bg-[#facc15]/15 px-2 py-0.5 rounded-full border border-[#facc15]/30">
                {resolvedDates.length} {resolvedDates.length === 1 ? 'dia' : 'dias'}
              </span>
            </div>

            {/* Direct Mode Switcher Pills - zero hidden "Repita" button */}
            <div className="grid grid-cols-5 gap-1 bg-[#0A0A0C] p-1 rounded-md border border-white/10">
              {repeatTabs.map((tab) => {
                const active = repeatMode === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setRepeatMode(tab.id)}
                    className={`py-1.5 rounded-lg text-[11px] font-extrabold transition-all ${
                      active
                        ? 'bg-[#facc15]/15 text-[#facc15] border border-[#facc15]/50'
                        : 'text-[#A1A1AA] hover:text-white border border-transparent'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* MODE: DIA */}
            {repeatMode === 'single' && (
              <div className="space-y-2">
                <label className="text-[10px] text-[#8E8E93] font-bold block">
                  Selecionar Dia do Compromisso
                </label>
                <ObsidianDateButton
                  value={singleDate}
                  onChange={(dStr) => {
                    setSingleDate(dStr);
                    const parsed = parseYMD(dStr);
                    if (parsed) {
                      setWeeklyStartDate(dStr);
                      setMonthCursor(new Date(parsed.getFullYear(), parsed.getMonth(), 1));
                    }
                  }}
                />
              </div>
            )}

            {/* MODE: DIARIO */}
            {repeatMode === 'daily' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] text-[#8E8E93] font-bold">Início</span>
                  <ObsidianDateButton compact value={singleDate} onChange={setSingleDate} />
                </div>
                <div>
                  <span className="text-[10px] text-[#8E8E93] font-bold block mb-1">Duração (dias consecutivos)</span>
                  <div className="grid grid-cols-4 gap-1">
                    {[7, 15, 30, 90].map((dCount) => (
                      <button
                        key={dCount}
                        type="button"
                        onClick={() => setDailyDurationDays(dCount)}
                        className={`py-1.5 rounded-md text-[10px] font-bold border ${
                          dailyDurationDays === dCount
                            ? 'bg-[#facc15]/15 text-[#facc15] border-[#facc15]/50'
                            : 'bg-[#0A0A0C] text-[#A1A1AA] border-white/10'
                        }`}
                      >
                        {dCount}d
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* MODE: SEMANAL (shown immediately!) */}
            {repeatMode === 'weekly' && (
              <div className="space-y-2.5">
                <div>
                  <span className="text-[10px] text-[#8E8E93] font-bold block mb-1.5">
                    Quais dias da semana repetir os mesmos horários?
                  </span>
                  <div className="grid grid-cols-7 gap-1">
                    {WEEKDAY_LABELS.map((lbl, idx) => {
                      const active = weeklyDays.includes(idx);
                      return (
                        <button
                          key={lbl}
                          type="button"
                          onClick={() => toggleItem(setWeeklyDays, idx)}
                          className={`py-2 rounded-lg text-[10px] font-black border transition-all ${
                            active
                              ? 'bg-[#facc15] text-black border-[#facc15]'
                              : 'bg-[#0A0A0C] text-[#8E8E93] border-white/10 hover:text-white'
                          }`}
                        >
                          {lbl}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 items-end">
                  <div>
                    <span className="text-[10px] text-[#8E8E93] font-bold block mb-1">A partir de</span>
                    <ObsidianDateButton compact value={weeklyStartDate} onChange={setWeeklyStartDate} />
                  </div>
                  <div>
                    <span className="text-[10px] text-[#8E8E93] font-bold block mb-1">Por quantas semanas?</span>
                    <div className="grid grid-cols-4 gap-1">
                      {[4, 8, 12, 26].map((w) => (
                        <button
                          key={w}
                          type="button"
                          onClick={() => setWeeklyWeeksCount(w)}
                          className={`py-1.5 rounded-lg text-[10px] font-bold border ${
                            weeklyWeeksCount === w
                              ? 'bg-[#facc15]/20 text-[#facc15] border-[#facc15]/50'
                              : 'bg-[#0A0A0C] text-[#A1A1AA] border-white/10'
                          }`}
                        >
                          {w}s
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* MODE: MENSAL (shown immediately!) */}
            {repeatMode === 'monthly' && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1))}
                    className="p-1.5 rounded-lg bg-[#0A0A0C] border border-white/10 text-[#facc15]"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="text-xs font-black text-white">
                    {MONTH_NAMES[monthCursor.getMonth()]} {monthCursor.getFullYear()}
                  </span>
                  <button
                    type="button"
                    onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1))}
                    className="p-1.5 rounded-lg bg-[#0A0A0C] border border-white/10 text-[#facc15]"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>

                <div className="grid grid-cols-7 gap-1 text-center text-[9px] text-[#8E8E93] font-bold">
                  {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => <span key={i}>{d}</span>)}
                  {monthCalendarCells.map((dStr, idx) => {
                    if (!dStr) return <div key={`m-e-${idx}`} />;
                    const dayNum = parseInt(dStr.split('-')[2], 10);
                    const picked = monthlyPickedDates.includes(dStr);
                    return (
                      <button
                        key={dStr}
                        type="button"
                        onClick={() => toggleItem(setMonthlyPickedDates, dStr)}
                        className={`h-7 rounded-lg text-[10px] font-bold transition-all ${
                          picked
                            ? 'bg-[#facc15] text-black font-black shadow-sm shadow-[#facc15]/25'
                            : 'bg-[#0A0A0C] text-neutral-300 border border-white/5 hover:border-white/20'
                        }`}
                      >
                        {dayNum}
                      </button>
                    );
                  })}
                </div>

                <div>
                  <span className="text-[10px] text-[#8E8E93] font-bold block mb-1">
                    Repetir estes dias marcados por quantos meses?
                  </span>
                  <div className="grid grid-cols-4 gap-1">
                    {[1, 3, 6, 12].map((h) => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => setMonthlyHorizon(h)}
                        className={`py-1.5 rounded-lg text-[10px] font-bold border ${
                          monthlyHorizon === h
                            ? 'bg-[#facc15]/20 text-[#facc15] border-[#facc15]/50'
                            : 'bg-[#0A0A0C] text-[#A1A1AA] border-white/10'
                        }`}
                      >
                        {h === 1 ? 'Este mês' : `${h} meses`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* MODE: ANUAL (shown immediately!) */}
            {repeatMode === 'annual' && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-[#8E8E93] font-bold">Ano Alvo:</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setAnnualYear((y) => y - 1)}
                      className="p-1 rounded-lg bg-[#0A0A0C] border border-white/10 text-[#facc15]"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <span className="text-xs font-black font-mono text-[#facc15] px-2">{annualYear}</span>
                    <button
                      type="button"
                      onClick={() => setAnnualYear((y) => y + 1)}
                      className="p-1 rounded-lg bg-[#0A0A0C] border border-white/10 text-[#facc15]"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-[#8E8E93] font-bold block mb-1">
                    Meses para repetir os mesmos horários:
                  </span>
                  <div className="grid grid-cols-4 gap-1">
                    {MONTH_SHORT.map((mLbl, idx) => {
                      const active = annualMonths.includes(idx);
                      return (
                        <button
                          key={mLbl}
                          type="button"
                          onClick={() => toggleItem(setAnnualMonths, idx)}
                          className={`py-1.5 rounded-lg text-[10px] font-black border ${
                            active
                              ? 'bg-[#facc15] text-black border-[#facc15]'
                              : 'bg-[#0A0A0C] text-[#8E8E93] border-white/10'
                          }`}
                        >
                          {mLbl}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] text-[#8E8E93] font-bold block mb-1">
                    Dia(s) do mês:
                  </span>
                  <div className="grid grid-cols-7 gap-1">
                    {Array.from({ length: 31 }, (_, i) => i + 1).map((dayNum) => {
                      const active = annualDays.includes(dayNum);
                      return (
                        <button
                          key={dayNum}
                          type="button"
                          onClick={() => toggleItem(setAnnualDays, dayNum)}
                          className={`h-7 rounded-lg text-[10px] font-bold border ${
                            active
                              ? 'bg-[#facc15] text-black border-[#facc15] font-black'
                              : 'bg-[#0A0A0C] text-[#A1A1AA] border-white/5'
                          }`}
                        >
                          {dayNum}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* List & Priority */}
          <div className="grid grid-cols-1 gap-2.5">
            {projects && projects.length > 0 && (
              <div>
                <label className="text-[11px] font-bold text-[#A1A1AA] uppercase tracking-wider block mb-1.5">
                  Lista / Categoria
                </label>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
                  {projects.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setProjectId(p.id)}
                      className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold shrink-0 border transition-all ${
                        projectId === p.id
                          ? 'bg-[#facc15]/20 text-[#facc15] border-[#facc15]/50'
                          : 'bg-[#141417] text-[#8E8E93] border-white/10 hover:text-white'
                      }`}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Alarm & Reminder Controls */}
            <div className="bg-[#141417] border border-white/10 rounded-md p-2.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-neutral-200 flex items-center gap-1.5">
                  <Bell size={13} className="text-[#facc15]" />
                  <span>Alarme despertador</span>
                </span>
                <button
                  type="button"
                  onClick={() => setAlarmEnabled((p) => !p)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                    alarmEnabled
                      ? 'bg-[#facc15]/15 border-[#facc15]/50 text-[#facc15]'
                      : 'bg-[#0A0A0C] border-white/10 text-neutral-500'
                  }`}
                >
                  {alarmEnabled ? 'Ativo' : 'Silencioso'}
                </button>
              </div>
              {alarmEnabled && (
                <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
                  {[
                    { value: 0, label: 'No horário' },
                    { value: 5, label: '5m antes' },
                    { value: 10, label: '10m antes' },
                    { value: 15, label: '15m antes' },
                    { value: 30, label: '30m antes' }
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setReminderOffset(opt.value)}
                      className={`px-2 py-0.5 rounded text-[10px] shrink-0 border ${
                        reminderOffset === opt.value
                          ? 'bg-[#facc15]/15 border-[#facc15]/50 text-[#facc15] font-semibold'
                          : 'bg-[#0A0A0C] border-white/10 text-neutral-400'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="text-[11px] font-bold text-[#A1A1AA] uppercase tracking-wider block mb-1.5">
                Prioridade
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {priorityOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPriority(opt.value)}
                    className={`py-1.5 px-2 rounded-xl text-[11px] font-bold border flex items-center justify-center gap-1 transition-all ${
                      priority === opt.value
                        ? 'bg-[#facc15]/20 text-[#facc15] border-[#facc15]/50'
                        : 'bg-[#141417] text-[#8E8E93] border-white/10 hover:text-white'
                    }`}
                  >
                    <Flag size={11} className="text-[#facc15]" />
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="pt-1">
            <button
              type="submit"
              disabled={!title.trim()}
              className={`w-full py-3 rounded-lg text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${
                title.trim()
                  ? 'bg-[#facc15] hover:bg-[#eab308] text-black font-bold'
                  : 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
              }`}
            >
              <Check size={15} className="stroke-[3]" />
              <span>
                Confirmar Reserva ({resolvedDates.length} {resolvedDates.length === 1 ? 'dia' : 'dias'} · {allTimes.length} {allTimes.length === 1 ? 'horário' : 'horários'})
              </span>
            </button>
          </div>
        </form>
      </div>

      {/* Time Picker Sub-Modal */}
      <TimePickerModal
        isOpen={Boolean(timePickerTarget)}
        onClose={() => setTimePickerTarget(null)}
        initialTime={
          timePickerTarget === 'end'
            ? endTime || startTime
            : startTime || '09:00'
        }
        onSelectTime={(picked) => {
          if (!picked) return;
          if (timePickerTarget === 'start') {
            setStartTime(picked);
          } else if (timePickerTarget === 'end') {
            setEndTime(picked);
          } else if (timePickerTarget === 'extra') {
            setExtraTimes((prev) =>
              prev.includes(picked) || picked === startTime
                ? prev
                : [...prev, picked].sort()
            );
          }
          setTimePickerTarget(null);
        }}
      />
    </div>
  );
}
