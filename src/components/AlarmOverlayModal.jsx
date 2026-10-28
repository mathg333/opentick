import React, { useState, useEffect } from 'react';
import { Bell, Clock, Check, Volume2, X, AlertTriangle, Moon } from 'lucide-react';
import { soundManager } from '../utils/audio';

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

  const remainingMinutes = Math.max(0, 4 - Math.floor(secondsElapsed / 60));
  const remainingSeconds = Math.max(0, 59 - (secondsElapsed % 60));

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-between p-6 sm:p-10 select-none animate-in fade-in duration-300 backdrop-blur-md">
      {/* Top Header */}
      <div className="w-full flex items-center justify-between pt-4">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-[#ff6b00] animate-ping" />
          <span className="text-xs font-bold uppercase tracking-widest text-[#ff6b00]">
            Alarme em Execução
          </span>
        </div>
        <button
          onClick={onStopAlarm}
          className="p-2 rounded-full bg-[#1c1c1e] text-neutral-400 hover:text-white"
          title="Fechar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Center Alarm Focus Ring */}
      <div className="flex flex-col items-center text-center space-y-6 max-w-sm w-full">
        {/* Pulsing Visual Halo */}
        <div className="relative flex items-center justify-center">
          <div className="absolute w-44 h-44 rounded-full bg-[#ff6b00]/20 animate-ping opacity-75 duration-1000" />
          <div className="absolute w-36 h-36 rounded-full bg-[#ff6b00]/30 animate-pulse duration-700" />
          <div className="relative w-28 h-28 rounded-full bg-gradient-to-tr from-[#ff6b00] to-[#ea580c] flex items-center justify-center shadow-[0_0_50px_rgba(255,107,0,0.6)]">
            <Bell className="w-14 h-14 text-white animate-bounce" />
          </div>
        </div>

        {/* Big Digital Clock */}
        <div className="space-y-1">
          <div className="text-6xl font-black tracking-tight text-white font-mono drop-shadow-md">
            {timeFormatted}
          </div>
          <div className="text-xs text-neutral-400 flex items-center justify-center gap-1.5 font-medium">
            <Volume2 className="w-3.5 h-3.5 text-[#ff6b00]" />
            <span>
              {soundName === 'custom' && customAudioName 
                ? `Música do Celular: ${customAudioName}` 
                : 'Alarme Contínuo Ativo'}
            </span>
          </div>
        </div>

        {/* Task Details Card */}
        <div className="w-full bg-[#1c1c1e] border border-[#2c2c2e] rounded-3xl p-5 shadow-2xl space-y-2">
          <span className="text-[11px] font-bold text-[#ff6b00] uppercase tracking-wider block">
            {task ? 'Lembrete da Tarefa' : 'Alarme Agendado'}
          </span>
          <h2 className="text-xl font-bold text-white leading-snug line-clamp-2">
            {task ? task.title : 'Hora de concluir suas metas!'}
          </h2>
          {task?.startTime && (
            <div className="inline-flex items-center gap-1.5 text-xs text-neutral-300 bg-[#28282e] px-3 py-1 rounded-full font-mono mt-1">
              <Clock className="w-3.5 h-3.5 text-[#ff6b00]" />
              <span>Programado para as {task.startTime}</span>
            </div>
          )}
        </div>

        {/* Ringing Safety Timer */}
        <p className="text-[11px] text-neutral-400">
          Tocando sem parar • Auto-desligar em {remainingMinutes}:{String(remainingSeconds).padStart(2, '0')}
        </p>
      </div>

      {/* Bottom Action Controls */}
      <div className="w-full max-w-sm space-y-3 pb-6">
        {/* Big Tactile STOP Button */}
        <button
          onClick={onStopAlarm}
          className="w-full py-4 rounded-2xl bg-[#ff6b00] hover:bg-[#ea580c] active:scale-98 text-white font-black text-base uppercase tracking-wider shadow-[0_0_30px_rgba(255,107,0,0.4)] transition-all flex items-center justify-center gap-2"
        >
          <Check className="w-6 h-6 stroke-[3]" />
          <span>Parar Alarme</span>
        </button>

        {/* Snooze 5 Minutes */}
        <button
          onClick={onSnoozeAlarm}
          className="w-full py-3 rounded-2xl bg-[#1c1c1e] hover:bg-[#28282e] active:scale-98 text-neutral-300 font-semibold text-xs border border-[#2c2c2e] transition-all flex items-center justify-center gap-2"
        >
          <Moon className="w-4 h-4 text-amber-400" />
          <span>Adiar por 5 minutos (Snooze)</span>
        </button>
      </div>
    </div>
  );
}
