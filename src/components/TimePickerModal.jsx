import React, { useState } from 'react';
import { X, Clock, Check } from 'lucide-react';

export default function TimePickerModal({ isOpen, onClose, initialTime, onSelectTime }) {
  const [hour, setHour] = useState(() => {
    if (initialTime && initialTime.includes(':')) {
      return initialTime.split(':')[0];
    }
    return '09';
  });

  const [minute, setMinute] = useState(() => {
    if (initialTime && initialTime.includes(':')) {
      return initialTime.split(':')[1];
    }
    return '00';
  });

  if (!isOpen) return null;

  const quickPresets = [
    '08:00', '09:00', '10:00', '11:00', 
    '14:00', '15:00', '16:20', '18:00', '20:00', '21:00'
  ];

  const hoursList = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minutesList = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

  const handleConfirm = () => {
    const formatted = `${hour}:${minute}`;
    onSelectTime(formatted);
    onClose();
  };

  const handlePreset = (preset) => {
    const [h, m] = preset.split(':');
    setHour(h);
    setMinute(m);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs select-none animate-in fade-in">
      <div 
        onClick={e => e.stopPropagation()} 
        className="w-full max-w-xs bg-[#1c1c1e] border border-[#2c2c2e] rounded-3xl p-5 shadow-2xl space-y-4 text-white"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#28282b]">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#ff6b00]" />
            <h2 className="text-base font-bold">Definir Horário</h2>
          </div>
          <button onClick={onClose} className="p-1 text-neutral-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Big Display Box */}
        <div className="flex items-center justify-center gap-2 py-3 bg-[#141416] rounded-2xl border border-[#2c2c2e]">
          <div className="text-4xl font-mono font-black text-white px-3 py-1 bg-[#1c1c1e] rounded-xl border border-[#3a3a3e]">
            {hour}
          </div>
          <span className="text-3xl font-black text-[#ff6b00]">:</span>
          <div className="text-4xl font-mono font-black text-white px-3 py-1 bg-[#1c1c1e] rounded-xl border border-[#3a3a3e]">
            {minute}
          </div>
        </div>

        {/* Quick Presets */}
        <div>
          <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block mb-1.5">
            Horários Rápidos
          </span>
          <div className="flex flex-wrap gap-1.5">
            {quickPresets.map(preset => (
              <button
                key={preset}
                type="button"
                onClick={() => handlePreset(preset)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-colors ${
                  `${hour}:${minute}` === preset
                    ? 'bg-[#ff6b00] text-white shadow-md'
                    : 'bg-[#141416] hover:bg-[#28282e] text-neutral-300 border border-[#28282b]'
                }`}
              >
                {preset}
              </button>
            ))}
          </div>
        </div>

        {/* Hours Grid */}
        <div>
          <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block mb-1">
            Hora ({hour}h)
          </span>
          <div className="grid grid-cols-6 gap-1 max-h-24 overflow-y-auto p-1 bg-[#141416] rounded-xl border border-[#28282b]">
            {hoursList.map(h => (
              <button
                key={h}
                type="button"
                onClick={() => setHour(h)}
                className={`py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                  hour === h
                    ? 'bg-[#ff6b00] text-white shadow-sm'
                    : 'text-neutral-300 hover:bg-[#242428]'
                }`}
              >
                {h}
              </button>
            ))}
          </div>
        </div>

        {/* Minutes Grid */}
        <div>
          <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block mb-1">
            Minuto ({minute}m)
          </span>
          <div className="grid grid-cols-6 gap-1 bg-[#141416] rounded-xl p-1 border border-[#28282b]">
            {minutesList.map(m => (
              <button
                key={m}
                type="button"
                onClick={() => setMinute(m)}
                className={`py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
                  minute === m
                    ? 'bg-[#ff6b00] text-white shadow-sm'
                    : 'text-neutral-300 hover:bg-[#242428]'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 border-t border-[#28282b] flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              onSelectTime('');
              onClose();
            }}
            className="px-3 py-2 text-xs text-neutral-400 hover:text-white"
          >
            Sem Horário
          </button>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs text-neutral-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-[#ff6b00] hover:bg-[#ea580c] text-white shadow-md flex items-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Confirmar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
