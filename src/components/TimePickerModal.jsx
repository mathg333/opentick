import React, { useState, useRef, useEffect } from 'react';
import { X, Clock, Check, ArrowRight } from 'lucide-react';

export default function TimePickerModal({ isOpen, onClose, initialTime, onSelectTime }) {
  const [activeMode, setActiveMode] = useState('hour'); // 'hour' or 'minute'
  const [hour, setHour] = useState(() => {
    if (initialTime && initialTime.includes(':')) {
      return parseInt(initialTime.split(':')[0], 10) || 9;
    }
    return 9;
  });

  const [minute, setMinute] = useState(() => {
    if (initialTime && initialTime.includes(':')) {
      return parseInt(initialTime.split(':')[1], 10) || 0;
    }
    return 0;
  });

  const dialRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialTime && initialTime.includes(':')) {
        const parts = initialTime.split(':');
        setHour(parseInt(parts[0], 10) || 9);
        setMinute(parseInt(parts[1], 10) || 0);
      }
      setActiveMode('hour');
    }
  }, [isOpen, initialTime]);

  if (!isOpen) return null;

  const quickPresets = [
    { label: 'Manhã', time: '08:00' },
    { label: 'Almoço', time: '12:00' },
    { label: 'Tarde', time: '14:00' },
    { label: 'Foco', time: '16:20' },
    { label: 'Noite', time: '19:00' },
    { label: 'Dormir', time: '22:00' }
  ];

  const handleConfirm = () => {
    const formatted = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    onSelectTime(formatted);
    onClose();
  };

  const handlePreset = (presetTime) => {
    const [h, m] = presetTime.split(':');
    setHour(parseInt(h, 10));
    setMinute(parseInt(m, 10));
  };

  // Dial Center & Radius geometry
  const dialSize = 230; // 230px diameter
  const center = dialSize / 2;
  const outerRadius = 86;
  const innerRadius = 54;

  // Process pointer position to calculate hour or minute
  const handlePointerPosition = (clientX, clientY, isFinal = false) => {
    if (!dialRef.current) return;
    const rect = dialRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Angle in degrees (0 at 12 o'clock, clockwise)
    const rad = Math.atan2(dy, dx);
    const deg = (rad * (180 / Math.PI) + 90 + 360) % 360;

    if (activeMode === 'hour') {
      const step = 360 / 12; // 30 deg per hour
      const index = Math.round(deg / step) % 12;
      const isOuter = dist > 70;

      let selectedH;
      if (isOuter) {
        // Outer ring: 00, 13, 14, 15, ..., 23
        selectedH = index === 0 ? 0 : index + 12;
      } else {
        // Inner ring: 12, 1, 2, ..., 11
        selectedH = index === 0 ? 12 : index;
      }
      setHour(selectedH);

      if (isFinal) {
        // Auto-advance to minute mode after picking hour
        setTimeout(() => setActiveMode('minute'), 220);
      }
    } else {
      // Minute mode: 60 minutes (every 6 degrees)
      const step = 360 / 60;
      let selectedM = Math.round(deg / step) % 60;
      // Snap to nearest minute
      setMinute(selectedM);
    }
  };

  const handlePointerDown = (e) => {
    setIsDragging(true);
    handlePointerPosition(e.clientX, e.clientY);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    handlePointerPosition(e.clientX, e.clientY);
  };

  const handlePointerUp = (e) => {
    if (isDragging) {
      handlePointerPosition(e.clientX, e.clientY, true);
      setIsDragging(false);
    }
  };

  // Outer and Inner Hour Numbers for 24h dial
  const outerHours = [0, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23];
  const innerHours = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const minuteNumbers = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  // Calculate hand angle and length
  let handAngle = 0;
  let handLength = outerRadius;

  if (activeMode === 'hour') {
    const isOuter = hour === 0 || hour >= 13;
    handLength = isOuter ? outerRadius : innerRadius;
    const baseHour = hour % 12;
    handAngle = baseHour * 30;
  } else {
    handLength = outerRadius;
    handAngle = minute * 6;
  }

  const handRad = (handAngle - 90) * (Math.PI / 180);
  const handEndX = center + handLength * Math.cos(handRad);
  const handEndY = center + handLength * Math.sin(handRad);

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-xs select-none animate-in fade-in">
      <div 
        onClick={e => e.stopPropagation()} 
        className="w-full max-w-sm bg-[#1c1c1e] border border-[#2c2c2e] rounded-3xl p-5 shadow-2xl space-y-4 text-white"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[#28282b]">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#ff6b00]" />
            <h2 className="text-base font-bold text-white">Selecionar Horário</h2>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-1 text-neutral-400 hover:text-white rounded-lg active:bg-neutral-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Digital Time Highlight Boxes */}
        <div className="flex items-center justify-center gap-2 py-2">
          {/* Hour Box */}
          <button
            type="button"
            onClick={() => setActiveMode('hour')}
            className={`px-4 py-2 rounded-2xl text-4xl font-mono font-black transition-all ${
              activeMode === 'hour'
                ? 'bg-[#ff6b00]/20 text-[#ff6b00] border-2 border-[#ff6b00] shadow-[0_0_20px_rgba(255,107,0,0.3)] scale-105'
                : 'bg-[#141416] text-white border border-[#2c2c2e] hover:border-neutral-500'
            }`}
          >
            {String(hour).padStart(2, '0')}
          </button>

          <span className="text-3xl font-black text-[#ff6b00] animate-pulse">:</span>

          {/* Minute Box */}
          <button
            type="button"
            onClick={() => setActiveMode('minute')}
            className={`px-4 py-2 rounded-2xl text-4xl font-mono font-black transition-all ${
              activeMode === 'minute'
                ? 'bg-[#ff6b00]/20 text-[#ff6b00] border-2 border-[#ff6b00] shadow-[0_0_20px_rgba(255,107,0,0.3)] scale-105'
                : 'bg-[#141416] text-white border border-[#2c2c2e] hover:border-neutral-500'
            }`}
          >
            {String(minute).padStart(2, '0')}
          </button>
        </div>

        {/* Mode Selector Tabs (Horas vs Minutos) */}
        <div className="flex bg-[#141416] p-1 rounded-xl border border-[#262629] text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveMode('hour')}
            className={`flex-1 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeMode === 'hour' ? 'bg-[#ff6b00] text-white shadow-md' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <span>Horas (24h)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMode('minute')}
            className={`flex-1 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
              activeMode === 'minute' ? 'bg-[#ff6b00] text-white shadow-md' : 'text-neutral-400 hover:text-white'
            }`}
          >
            <span>Minutos (00-59)</span>
          </button>
        </div>

        {/* CUSTOM ANALOG RADIAL CLOCK FACE (TickTick AMOLED Luxury Watch Dial) */}
        <div className="flex justify-center py-1">
          <div
            ref={dialRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="relative rounded-full bg-[#141416] border-2 border-[#262629] shadow-inner select-none cursor-pointer touch-none"
            style={{ width: dialSize, height: dialSize }}
          >
            {/* Center Pivot Point */}
            <div 
              className="absolute w-3 h-3 rounded-full bg-[#ff6b00] z-20 shadow-md"
              style={{
                left: center - 6,
                top: center - 6
              }}
            />

            {/* Glowing Hand Line */}
            <svg 
              className="absolute inset-0 pointer-events-none z-10" 
              width={dialSize} 
              height={dialSize}
            >
              <line
                x1={center}
                y1={center}
                x2={handEndX}
                y2={handEndY}
                stroke="#ff6b00"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle
                cx={handEndX}
                cy={handEndY}
                r="16"
                fill="#ff6b00"
                className="drop-shadow-[0_0_8px_rgba(255,107,0,0.8)]"
              />
            </svg>

            {/* DIAL NUMBERS RENDERING */}
            {activeMode === 'hour' ? (
              <>
                {/* Outer Ring: 00, 13, 14, ..., 23 */}
                {outerHours.map((h, i) => {
                  const deg = i * 30;
                  const rad = (deg - 90) * (Math.PI / 180);
                  const x = center + outerRadius * Math.cos(rad);
                  const y = center + outerRadius * Math.sin(rad);
                  const isSelected = hour === h;

                  return (
                    <div
                      key={`outer-${h}`}
                      className={`absolute w-7 h-7 -ml-3.5 -mt-3.5 rounded-full flex items-center justify-center text-[11px] font-mono font-bold transition-transform z-15 ${
                        isSelected ? 'text-white font-black scale-110' : 'text-neutral-400 hover:text-white'
                      }`}
                      style={{ left: x, top: y }}
                    >
                      {String(h).padStart(2, '0')}
                    </div>
                  );
                })}

                {/* Inner Ring: 12, 1, 2, ..., 11 */}
                {innerHours.map((h, i) => {
                  const deg = i * 30;
                  const rad = (deg - 90) * (Math.PI / 180);
                  const x = center + innerRadius * Math.cos(rad);
                  const y = center + innerRadius * Math.sin(rad);
                  const isSelected = hour === h;

                  return (
                    <div
                      key={`inner-${h}`}
                      className={`absolute w-6 h-6 -ml-3 -mt-3 rounded-full flex items-center justify-center text-[10px] font-mono font-bold transition-transform z-15 ${
                        isSelected ? 'text-white font-black scale-110' : 'text-neutral-500 hover:text-neutral-200'
                      }`}
                      style={{ left: x, top: y }}
                    >
                      {h}
                    </div>
                  );
                })}
              </>
            ) : (
              /* Minute Dial (00, 05, 10, 15, ..., 55) */
              minuteNumbers.map((m, i) => {
                const deg = i * 30;
                const rad = (deg - 90) * (Math.PI / 180);
                const x = center + outerRadius * Math.cos(rad);
                const y = center + outerRadius * Math.sin(rad);
                const isSelected = minute === m;

                return (
                  <div
                    key={`min-${m}`}
                    className={`absolute w-7 h-7 -ml-3.5 -mt-3.5 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-transform z-15 ${
                      isSelected ? 'text-white font-black scale-110' : 'text-neutral-300 hover:text-white'
                    }`}
                    style={{ left: x, top: y }}
                  >
                    {String(m).padStart(2, '0')}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Quick Presets Pills */}
        <div>
          <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider block mb-1">
            Atalhos de Horário
          </span>
          <div className="grid grid-cols-3 gap-1.5">
            {quickPresets.map(p => (
              <button
                key={p.time}
                type="button"
                onClick={() => handlePreset(p.time)}
                className={`px-2 py-1 rounded-xl text-xs font-semibold flex items-center justify-between border transition-colors ${
                  `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}` === p.time
                    ? 'bg-[#ff6b00] text-white border-[#ff6b00] shadow-md'
                    : 'bg-[#141416] hover:bg-[#28282e] text-neutral-300 border-[#28282b]'
                }`}
              >
                <span className="text-[11px] text-neutral-400">{p.label}</span>
                <span className="font-mono font-bold">{p.time}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Confirm / Cancel Buttons */}
        <div className="pt-2 border-t border-[#28282b] flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white bg-[#141416] hover:bg-[#28282e] border border-[#28282b]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-6 py-2 rounded-xl text-xs font-bold bg-[#ff6b00] hover:bg-[#ea580c] active:scale-98 text-white shadow-lg flex items-center gap-1.5"
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>Confirmar {String(hour).padStart(2, '0')}:{String(minute).padStart(2, '0')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
