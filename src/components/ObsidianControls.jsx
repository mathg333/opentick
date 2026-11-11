import React, { useState, useMemo, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  Search,
  Calendar as CalendarIcon,
  SlidersHorizontal
} from 'lucide-react';
import { formatDateYMD, getTodayYMD, parseYMD } from '../utils/taskSchedule';

const WEEKDAYS_MINI = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const MONTHS_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

/**
 * Custom Obsidian Select control replacing native Android/browser <select> dialogs.
 * Renders via Portal on document.body so parent CSS transforms never clip the overlay.
 */
export function ObsidianSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Selecionar...',
  title = 'Selecionar Opção',
  subtitle = '',
  compact = false,
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selected = options.find((opt) => String(opt.value) === String(value));
  const filteredOptions = useMemo(() => {
    if (!query.trim()) return options;
    const q = query.trim().toLowerCase();
    return options.filter((o) => (o.label || '').toLowerCase().includes(q));
  }, [options, query]);

  const modalContent = isOpen && typeof document !== 'undefined'
    ? createPortal(
        <div
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(false);
          }}
          className="fixed inset-0 z-[220] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-md bg-[#0A0A0C] border-t sm:border border-white/12 rounded-t-xl sm:rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[82vh] animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
          >
            <div className="px-4 py-3 border-b border-white/10 bg-[#111114] flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-7 h-7 rounded-md bg-white/5 border border-white/10 flex items-center justify-center text-[#facc15] shrink-0">
                  <SlidersHorizontal size={14} />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-white tracking-tight truncate">
                    {title}
                  </h4>
                  {subtitle && (
                    <p className="text-[11px] text-[#8E8E93] truncate">{subtitle}</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-md text-neutral-400 hover:text-white hover:bg-white/10 transition-colors shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            {options.length > 5 && (
              <div className="px-3 pt-2.5 pb-1 shrink-0">
                <div className="flex items-center gap-2 bg-[#141417] border border-white/10 focus-within:border-[#facc15]/50 rounded-md px-2.5 py-1.5">
                  <Search size={13} className="text-neutral-400 shrink-0" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar opção..."
                    className="w-full bg-transparent text-xs text-white placeholder-[#6b6b73] outline-none min-w-0"
                  />
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-3 space-y-1.5 pb-6 sm:pb-3">
              {filteredOptions.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#8E8E93]">
                  Nenhuma opção encontrada.
                </div>
              ) : (
                filteredOptions.map((opt) => {
                  const isSelected = String(opt.value) === String(value);
                  return (
                    <button
                      key={String(opt.value)}
                      type="button"
                      onClick={() => {
                        onChange(opt.value);
                        setIsOpen(false);
                      }}
                      className={`w-full px-3 py-2 rounded-md border flex items-center justify-between gap-2.5 text-left transition-all ${
                        isSelected
                          ? 'bg-[#facc15]/12 border-[#facc15]/55'
                          : 'bg-[#121215] border-white/[0.08] hover:border-white/20'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {opt.completed && (
                            <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-white/10 text-[#facc15] shrink-0">
                              <Check size={10} className="stroke-[3]" />
                            </span>
                          )}
                          <span
                            className={`text-xs font-semibold leading-snug truncate ${
                              isSelected ? 'text-[#facc15]' : 'text-neutral-200'
                            }`}
                          >
                            {opt.label}
                          </span>
                        </div>
                        {opt.meta && (
                          <span className="inline-block mt-0.5 text-[10px] font-mono text-[#8E8E93]">
                            {opt.meta}
                          </span>
                        )}
                      </div>

                      <div
                        className={`w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 transition-all ${
                          isSelected
                            ? 'bg-[#facc15] border-[#facc15] text-black'
                            : 'border-[#4a4a52] bg-[#0A0A0C]'
                        }`}
                      >
                        {isSelected && <Check size={10} className="stroke-[3]" />}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setQuery('');
          setIsOpen(true);
        }}
        className={`w-full flex items-center justify-between gap-2 text-left transition-all outline-none ${
          compact
            ? 'bg-[#141417] hover:bg-[#1a1a1f] border border-white/10 hover:border-white/25 rounded-md px-2 py-1 text-[10px] font-semibold text-neutral-200'
            : 'bg-[#0A0A0C] hover:bg-[#141417] border border-white/10 hover:border-white/25 rounded-md px-3 py-2 text-xs font-semibold text-white'
        } ${className}`}
      >
        <span className="truncate flex-1 flex items-center gap-1.5 min-w-0">
          {selected?.completed && <Check size={compact ? 10 : 12} className="text-[#facc15] shrink-0" />}
          <span className="truncate">{selected ? selected.label : placeholder}</span>
          {!compact && selected?.meta && (
            <span className="text-[10px] font-mono text-neutral-400 shrink-0">
              {selected.meta}
            </span>
          )}
        </span>
        <ChevronDown size={compact ? 12 : 14} className="text-neutral-400 shrink-0" />
      </button>

      {modalContent}
    </>
  );
}

/**
 * Custom Obsidian Date Button & Calendar Popover replacing native <input type="date">.
 * Renders via Portal on document.body so modal transforms never clip the calendar.
 */
export function ObsidianDateButton({
  value = '',
  onChange,
  placeholder = 'Escolher dia',
  compact = false,
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(() => {
    const parsed = value ? parseYMD(value) : null;
    const base = parsed || new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  useEffect(() => {
    if (!isOpen) return;
    const parsed = value ? parseYMD(value) : null;
    const base = parsed || new Date();
    setViewMonth(new Date(base.getFullYear(), base.getMonth(), 1));
  }, [isOpen, value]);

  const parsedValue = value ? parseYMD(value) : null;
  const formattedLabel = parsedValue
    ? parsedValue.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: compact ? '2-digit' : 'short',
        year: 'numeric'
      })
    : placeholder;

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayStr = getTodayYMD();

  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(formatDateYMD(new Date(year, month, d)));
  }

  const calendarOverlay = isOpen && typeof document !== 'undefined'
    ? createPortal(
        <div
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(false);
          }}
          className="fixed inset-0 z-[230] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-xs bg-[#0A0A0C] border border-white/15 rounded-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
          >
            <div className="px-3.5 py-2.5 border-b border-white/10 bg-[#111114] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarIcon size={14} className="text-[#facc15]" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Selecionar Dia
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-md text-neutral-400 hover:text-white hover:bg-white/10"
              >
                <X size={15} />
              </button>
            </div>

            <div className="px-3.5 pt-2.5 pb-2 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setViewMonth(new Date(year, month - 1, 1))}
                className="p-1.5 rounded-md bg-[#141417] border border-white/10 text-neutral-300 hover:text-white"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-xs font-bold text-white">
                {MONTHS_PT[month]} {year}
              </span>
              <button
                type="button"
                onClick={() => setViewMonth(new Date(year, month + 1, 1))}
                className="p-1.5 rounded-md bg-[#141417] border border-white/10 text-neutral-300 hover:text-white"
              >
                <ChevronRight size={14} />
              </button>
            </div>

            <div className="px-3.5 pb-3">
              <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-[#8E8E93] mb-1">
                {WEEKDAYS_MINI.map((w, i) => (
                  <span key={i}>{w}</span>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {cells.map((dStr, idx) => {
                  if (!dStr) return <div key={`e-${idx}`} />;
                  const dayNum = parseInt(dStr.split('-')[2], 10);
                  const isSel = dStr === value;
                  const isToday = dStr === todayStr;
                  return (
                    <button
                      key={dStr}
                      type="button"
                      onClick={() => {
                        onChange(dStr);
                        setIsOpen(false);
                      }}
                      className={`h-8 rounded-md text-xs font-semibold flex items-center justify-center transition-all ${
                        isSel
                          ? 'bg-[#facc15]/20 text-[#facc15] border border-[#facc15]/70 font-bold'
                          : isToday
                          ? 'bg-white/10 text-white border border-white/25'
                          : 'bg-[#141417] text-neutral-300 hover:bg-white/10 border border-white/5'
                      }`}
                    >
                      {dayNum}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="px-3.5 py-2.5 border-t border-white/10 bg-[#111114] flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  onChange(todayStr);
                  setIsOpen(false);
                }}
                className="px-3 py-1 rounded-md bg-[#141417] border border-white/12 hover:border-[#facc15]/40 text-neutral-200 text-[11px] font-semibold"
              >
                Hoje
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3 py-1 rounded-md bg-[#141417] border border-white/10 text-neutral-400 text-[11px] font-semibold"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}
        className={`flex items-center justify-between gap-2 transition-all outline-none ${
          compact
            ? 'bg-[#141417] border border-white/12 hover:border-white/25 rounded-md px-2.5 py-1.5 text-[11px] font-semibold text-neutral-200'
            : 'w-full bg-[#0A0A0C] border border-white/10 hover:border-white/25 rounded-md px-3 py-2 text-xs font-semibold text-white'
        } ${className}`}
      >
        <span className="truncate capitalize">{formattedLabel}</span>
        <CalendarIcon size={compact ? 12 : 14} className="text-neutral-400 shrink-0" />
      </button>

      {calendarOverlay}
    </>
  );
}
