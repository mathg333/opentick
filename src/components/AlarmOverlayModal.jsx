import React, { useState, useEffect } from 'react';
import { Bell, Clock, Check, Moon, Volume2, X, CheckCircle2 } from 'lucide-react';

export default function AlarmOverlayModal({
  isOpen,
  task,
  triggeredTime = '',
  soundName = 'radar',
  customAudioName = '',
  durationMinutes = 5,
  onStopAlarm,
  onSnoozeAlarm,
  onCompleteTask
}) {
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setSecondsElapsed(0);
      return;
    }
    setSecondsElapsed(0);
    const timer = setInterval(() => {
      setSecondsElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, task?.id, triggeredTime]);

  if (!isOpen) return null;

  const totalSec = Math.max(60, (Number(durationMinutes) || 5) * 60);
  const remainingTotal = Math.max(0, totalSec - secondsElapsed);
  const remainingMins = Math.floor(remainingTotal / 60);
  const remainingSeconds = remainingTotal % 60;

  const displayTime = triggeredTime || task?.startTime || '';

  return (
    <div className="fixed inset-0 z-[999] bg-[#06060a]/92 backdrop-blur-2xl flex flex-col items-center justify-between p-6 sm:p-10 select-none animate-in fade-in duration-200">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-35 mix-blend-luminosity pointer-events-none"
        style={{ backgroundImage: "url('/images/bg_rain_glass_dark.png')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-transparent to-black/95 pointer-events-none" />

      {/* Header */}
      <div className="w-full max-w-md flex items-center justify-between text-neutral-300 z-10">
        <div className="flex items-center gap-2 bg-[#141418]/90 border border-[#facc15]/30 px-3 py-1.5 rounded-md">
          <Volume2 className="w-3.5 h-3.5 text-[#facc15] animate-pulse" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-200 truncate max-w-[190px]">
            {soundName === 'custom' && customAudioName
              ? `Música: ${customAudioName}`
              : soundName === 'none'
              ? 'Modo Silencioso'
              : `Alarme: ${soundName}`}
          </span>
        </div>
        <button
          onClick={onStopAlarm}
          className="p-2 rounded-md bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white border border-white/10 transition-all"
          title="Fechar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Center Pulsing Clock & Task Info */}
      <div className="flex flex-col items-center justify-center text-center max-w-md w-full space-y-6 my-auto z-10">
        <div className="relative flex items-center justify-center">
          <div className="absolute w-40 h-40 rounded-full border border-[#facc15]/25 animate-ping" />
          <div className="relative w-28 h-28 rounded-full bg-[#121216] border border-[#facc15]/60 shadow-[0_0_30px_rgba(250,204,21,0.18)] flex flex-col items-center justify-center">
            <Bell className="w-10 h-10 text-[#facc15]" />
          </div>
        </div>

        <div className="space-y-2.5">
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#facc15] block">
            Compromisso OpenTick
          </span>

          <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight break-words px-3">
            {task?.title || 'Hora de concluir suas metas'}
          </h2>

          {displayTime && (
            <div className="inline-flex items-center gap-1.5 text-xs text-neutral-200 bg-[#141418] border border-white/12 px-3 py-1 rounded-md font-mono">
              <Clock className="w-3.5 h-3.5 text-[#facc15]" />
              <span>Programado para as {displayTime}</span>
            </div>
          )}

          {task?.description && (
            <p className="text-xs text-neutral-400 max-w-xs mx-auto line-clamp-2 pt-1">
              {task.description}
            </p>
          )}
        </div>
      </div>

      {/* Controls Footer */}
      <div className="w-full max-w-sm space-y-2.5 pb-2 z-10">
        <button
          onClick={onStopAlarm}
          className="w-full py-3.5 rounded-lg bg-[#facc15] hover:bg-[#eab308] active:scale-[0.99] text-black font-black text-sm uppercase tracking-wider shadow-lg transition-all flex items-center justify-center gap-2"
        >
          <Check className="w-5 h-5 stroke-[3]" />
          <span>Parar Alarme</span>
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={onSnoozeAlarm}
            className="py-3 rounded-lg bg-[#141418] hover:bg-[#1c1c22] active:scale-[0.99] text-neutral-100 font-semibold text-xs border border-white/15 transition-all flex items-center justify-center gap-1.5"
          >
            <Moon className="w-3.5 h-3.5 text-[#facc15]" />
            <span>Adiar +5 min</span>
          </button>

          {task && onCompleteTask ? (
            <button
              onClick={onCompleteTask}
              className="py-3 rounded-lg bg-[#facc15]/15 hover:bg-[#facc15]/25 active:scale-[0.99] text-[#facc15] font-semibold text-xs border border-[#facc15]/45 transition-all flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Concluir Tarefa</span>
            </button>
          ) : (
            <button
              onClick={onStopAlarm}
              className="py-3 rounded-lg bg-[#141418] hover:bg-[#1c1c22] text-neutral-300 font-semibold text-xs border border-white/10"
            >
              Fechar
            </button>
          )}
        </div>

        <p className="text-[10px] text-center text-neutral-500 pt-1">
          Silenciamento automático em{' '}
          <span className="text-neutral-300 font-mono">
            {String(remainingMins).padStart(2, '0')}:{String(remainingSeconds).padStart(2, '0')}
          </span>
        </p>
      </div>
    </div>
  );
}
