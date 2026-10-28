import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Clock, Check, Calendar as CalendarIcon, Repeat } from 'lucide-react';

export default function CustomDatePickerModal({ isOpen, onClose, onSelectDates, initialDate }) {
  const [currentMonthDate, setCurrentMonthDate] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState(initialDate ? [initialDate] : []);
  const [selectedTime, setSelectedTime] = useState('');
  const [mode, setMode] = useState('custom'); // 'single', 'custom' (multiple dates), 'daily', 'weekdays'

  if (!isOpen) return null;

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();

  const prevMonth = () => {
    const d = new Date(currentMonthDate);
    d.setMonth(d.getMonth() - 1);
    setCurrentMonthDate(d);
  };

  const nextMonth = () => {
    const d = new Date(currentMonthDate);
    d.setMonth(d.getMonth() + 1);
    setCurrentMonthDate(d);
  };

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 is Sunday

  const formatDateStr = (dayNum) => {
    const mo = String(month + 1).padStart(2, '0');
    const dy = String(dayNum).padStart(2, '0');
    return `${year}-${mo}-${dy}`;
  };

  const toggleDate = (dStr) => {
    if (selectedDates.includes(dStr)) {
      setSelectedDates(selectedDates.filter(d => d !== dStr));
    } else {
      setSelectedDates([...selectedDates, dStr]);
    }
  };

  const handleSelectAllDaysInMonth = () => {
    const all = [];
    for (let i = 1; i <= daysInMonth; i++) {
      all.push(formatDateStr(i));
    }
    setSelectedDates(all);
  };

  const handleSelectWeekdays = () => {
    const weekdays = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      const day = d.getDay();
      if (day >= 1 && day <= 5) { // Mon-Fri
        weekdays.push(formatDateStr(i));
      }
    }
    setSelectedDates(weekdays);
  };

  const handleConfirm = () => {
    onSelectDates({
      dates: selectedDates.sort(),
      time: selectedTime
    });
    onClose();
  };

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs select-none animate-in fade-in">
      <div 
        onClick={e => e.stopPropagation()} 
        className="w-full max-w-sm bg-[#1c1c1e] border border-[#2c2c2e] rounded-3xl p-5 shadow-2xl space-y-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#28282b]">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-[#4c82f7]" />
            <h2 className="text-base font-bold text-white">Datas e Horários</h2>
          </div>
          <button onClick={onClose} className="p-1 text-neutral-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Presets matching TickTick */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          <button
            type="button"
            onClick={() => {
              const todayStr = new Date().toISOString().split('T')[0];
              setSelectedDates([todayStr]);
            }}
            className="px-2.5 py-1 bg-[#141416] hover:bg-[#28282e] border border-[#2c2c2e] rounded-lg text-neutral-300 font-medium shrink-0"
          >
            Hoje
          </button>
          <button
            type="button"
            onClick={handleSelectWeekdays}
            className="px-2.5 py-1 bg-[#141416] hover:bg-[#28282e] border border-[#2c2c2e] rounded-lg text-neutral-300 font-medium shrink-0"
          >
            Dias Úteis (Seg-Sex)
          </button>
          <button
            type="button"
            onClick={handleSelectAllDaysInMonth}
            className="px-2.5 py-1 bg-[#141416] hover:bg-[#28282e] border border-[#2c2c2e] rounded-lg text-neutral-300 font-medium shrink-0"
          >
            Todo Dia do Mês
          </button>
          <button
            type="button"
            onClick={() => setSelectedDates([])}
            className="px-2.5 py-1 bg-[#141416] hover:bg-[#28282e] border border-[#2c2c2e] rounded-lg text-neutral-400 font-medium shrink-0"
          >
            Limpar
          </button>
        </div>

        {/* Month Selector */}
        <div className="flex items-center justify-between px-1">
          <span className="text-sm font-bold text-white">
            {monthNames[month]} {year}
          </span>
          <div className="flex items-center gap-1">
            <button onClick={prevMonth} className="p-1 text-neutral-400 hover:text-white rounded-lg">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button onClick={nextMonth} className="p-1 text-neutral-400 hover:text-white rounded-lg">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Calendar Grid (Multiple Dates Selection) */}
        <div>
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-neutral-500 font-bold uppercase mb-1">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
              <span key={d}>{d}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="h-8" />
            ))}

            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dStr = formatDateStr(dayNum);
              const isSelected = selectedDates.includes(dStr);

              return (
                <button
                  key={dStr}
                  type="button"
                  onClick={() => toggleDate(dStr)}
                  className={`h-8 w-8 mx-auto rounded-full text-xs font-semibold flex items-center justify-center transition-all ${
                    isSelected
                      ? 'bg-[#4c82f7] text-white font-bold shadow-md scale-105'
                      : 'text-neutral-200 hover:bg-[#28282e]'
                  }`}
                >
                  {dayNum}
                </button>
              );
            })}
          </div>
        </div>

        {/* Time Picker */}
        <div className="pt-2 border-t border-[#28282b] flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-neutral-300 font-medium">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Horário Repetido:</span>
          </div>
          <input
            type="time"
            value={selectedTime}
            onChange={e => setSelectedTime(e.target.value)}
            className="bg-[#141416] border border-[#2c2c2e] text-white text-xs rounded-lg px-2 py-1 focus:outline-none"
          />
        </div>

        {/* Selected Summary and Confirm Button */}
        <div className="pt-2 border-t border-[#28282b] flex items-center justify-between gap-2">
          <span className="text-xs text-neutral-400 truncate">
            {selectedDates.length === 0 
              ? 'Nenhuma data' 
              : selectedDates.length === 1 
              ? `1 data (${selectedDates[0]})` 
              : `${selectedDates.length} datas selecionadas`}
            {selectedTime ? ` às ${selectedTime}` : ''}
          </span>

          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-[#4c82f7] hover:bg-[#3b72e7] text-white shadow-md shrink-0"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}
