import React, { useState, useEffect } from 'react';
import { Bell, Clock, Check, Volume2, X, Moon, Flame } from 'lucide-react';

export default function AlarmOverlayModal({
  isOpen,
  task,
  soundName = 'radar',
  customAudioName = '',
  onStopAlarm,
  onSnoozeAlarm
}) {
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setSecondsElapsed(0);
      return;
    }

    const timer = setInterval(() => {
      setSecondsElapsed(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const now = new Date();
  const timeFormatted = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const dateFormatted = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).format(now);

  const remainingMinutes = Math.max(0, 4 - Math.floor(secondsElapsed / 60));
  const remainingSeconds = Math.max(0, 59 - (secondsElapsed % 60));

  return (
    <div className="fixed inset-0 z-50 bg-[#06060a]/85 backdrop-blur-3xl flex flex-col items-center justify-between p-6 sm:p-10 select-none animate-in fade-in duration-300">
      {/* User-selected Moody Rain Drops on Blurred Glass Background */}
      <div 
        className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-luminosity pointer-events-none"
        style={{ backgroundImage: `url('/images/bg_rain_glass_dark.png')` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-[#06060a]/90 via-[#06060a]/70 to-[#06060a]/95 pointer-events-none" />

      {/* Background Ambient Glowing Orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-[#ff6b00]/15 blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 translate-y-1/2 w-72 h-72 rounded-full bg-[#ff3d00]/10 blur-3xl pointer-events-none" />

      {/* Top Header Status Pill */}
      <div className="w-full flex items-center justify-between pt-2 z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-lg">
          <span className="w-2.5 h-2.5 rounded-full bg-[#ff7a00] animate-ping" />
          <span className="text-[11px] font-black uppercase tracking-widest text-[#ff7a00]">
            Alarme Ativo • OpenTick
          </span>
        </div>
        <button
          onClick={onStopAlarm}
          className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white border border-white/10 backdrop-blur-md transition-all"
          title="Fechar"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Center Alarm Focus */}
      <div className="flex flex-col items-center text-center space-y-6 max-w-sm w-full z-10">
        {/* Multi-layer Concentric Glass Soundwaves */}
        <div className="relative flex items-center justify-center my-2">
          {/* Outer Ripple */}
          <div className="absolute w-44 h-44 rounded-full border border-[#ff7a00]/30 bg-[#ff6b00]/5 animate-ping opacity-60 duration-1000" />
          {/* Mid Ripple */}
          <div className="absolute w-36 h-36 rounded-full border border-[#ff7a00]/40 bg-[#ff6b00]/10 animate-pulse duration-700" />
          {/* Center Glowing Sphere */}
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-tr from-[#ff6b00] via-[#ff5500] to-[#e63900] flex items-center justify-center shadow-[0_0_50px_rgba(255,107,0,0.55)] border border-white/20">
            <Bell className="w-12 h-12 text-white animate-bounce stroke-[2.2]" />
          </div>
        </div>

        {/* Digital Time & Date */}
        <div className="space-y-1.5">
          <div className="text-6xl sm:text-7xl font-black tracking-tight text-white font-mono drop-shadow-[0_4px_20px_rgba(255,107,0,0.3)]">
            {timeFormatted}
          </div>
          <div className="inline-block px-3.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-neutral-300 font-medium capitalize backdrop-blur-md">
            {dateFormatted}
          </div>
        </div>

        {/* Frosted Glass Task Details Card */}
        <div className="w-full bg-[#18181e]/60 border border-white/10 rounded-3xl p-5 shadow-[0_8px_32px_0_rgba(0,0,0,0.5)] backdrop-blur-xl space-y-2.5 text-left">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#ff7a00] uppercase tracking-wider flex items-center gap-1">
              <Flame className="w-3.5 h-3.5" />
              Lembrete da Tarefa
            </span>
            <div className="flex items-center gap-1 text-[11px] text-neutral-400">
              <Volume2 className="w-3 h-3 text-[#ff7a00]" />
              <span>{soundName === 'custom' && customAudioName ? customAudioName : 'Contínuo'}</span>
            </div>
          </div>
          
          <h2 className="text-xl font-black text-white leading-snug line-clamp-2">
            {task ? task.title : 'Hora de concluir suas metas!'}
          </h2>

          {task?.startTime && (
            <div className="inline-flex items-center gap-1.5 text-xs text-neutral-200 bg-white/10 border border-white/10 px-3 py-1 rounded-full font-mono">
              <Clock className="w-3.5 h-3.5 text-[#ff7a00]" />
              <span>Programado para as {task.startTime}</span>
            </div>
          )}

          <p className="text-[11px] text-neutral-400 pt-1 border-t border-white/5">
            Tocando continuamente • Auto-desligar em {remainingMinutes}:{String(remainingSeconds).padStart(2, '0')}
          </p>
        </div>
      </div>

      {/* Bottom Action Controls */}
      <div className="w-full max-w-sm space-y-3 pb-2 z-10">
        {/* Liquid Neon Orange Stop Button */}
        <button
          onClick={onStopAlarm}
          className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#ff7a00] via-[#ff5500] to-[#e63900] hover:brightness-110 active:scale-98 text-white font-black text-base uppercase tracking-wider shadow-[0_0_35px_rgba(255,107,0,0.45)] border border-white/20 transition-all flex items-center justify-center gap-2"
        >
          <Check className="w-6 h-6 stroke-[3]" />
          <span>Parar Alarme</span>
        </button>

        {/* Frosted Glass Snooze (+5 min) */}
        <button
          onClick={onSnoozeAlarm}
          className="w-full py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 active:scale-98 text-white font-bold text-xs border border-white/15 backdrop-blur-xl transition-all flex items-center justify-center gap-2 shadow-lg"
        >
          <Moon className="w-4 h-4 text-amber-300" />
          <span>Adiar por 5 minutos (Snooze)</span>
        </button>
      </div>
    </div>
  );
}
