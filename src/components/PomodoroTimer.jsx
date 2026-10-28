import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipForward, 
  Volume2, 
  VolumeX, 
  Clock, 
  Flame, 
  CloudRain, 
  Waves, 
  Radio 
} from 'lucide-react';
import { soundManager } from '../utils/audio';

export default function PomodoroTimer({ store, activeTask }) {
  const { state, addPomodoroSession } = store;

  const [mode, setMode] = useState('pomodoro');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [noiseType, setNoiseType] = useState('none');
  const [volume, setVolume] = useState(0.2);
  const [selectedTaskId, setSelectedTaskId] = useState(activeTask?.id || '');

  const durations = {
    pomodoro: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60
  };

  useEffect(() => {
    if (activeTask?.id) {
      setSelectedTaskId(activeTask.id);
    }
  }, [activeTask]);

  useEffect(() => {
    let interval = null;
    if (isRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      soundManager.playChime();
      soundManager.stopNoise();

      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(mode === 'pomodoro' ? '🍅 Pomodoro Concluído!' : '⏰ Pausa Concluída!', {
          body: mode === 'pomodoro' ? 'Excelente foco! Hora de descansar um pouco.' : 'Pausa finalizada! Pronto para o próximo bloco de foco?',
          icon: '/icon.svg'
        });
      }

      if (mode === 'pomodoro') {
        const linkedTask = state.tasks.find(t => t.id === selectedTaskId);
        addPomodoroSession({
          taskId: selectedTaskId || null,
          taskTitle: linkedTask ? linkedTask.title : 'Sessão Livre de Foco',
          durationMinutes: 25
        });
        setMode('shortBreak');
        setTimeLeft(durations.shortBreak);
      } else {
        setMode('pomodoro');
        setTimeLeft(durations.pomodoro);
      }
    }
    return () => clearInterval(interval);
  }, [isRunning, timeLeft, mode, selectedTaskId]);

  const handleToggleNoise = (type) => {
    if (noiseType === type) {
      setNoiseType('none');
      soundManager.stopNoise();
    } else {
      setNoiseType(type);
      soundManager.startNoise(type, volume);
    }
  };

  const handleVolumeChange = (e) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    soundManager.setVolume(v);
  };

  const switchMode = (newMode) => {
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(durations[newMode]);
  };

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const totalDuration = durations[mode];
  const progressPercent = ((totalDuration - timeLeft) / totalDuration) * 100;

  const todayStart = new Date().toISOString().split('T')[0];
  const todaySessions = state.pomodoroSessions.filter(s => s.completedAt.startsWith(todayStart));
  const totalMinutesToday = todaySessions.reduce((acc, curr) => acc + (curr.durationMinutes || 25), 0);

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#121215]">
      {/* Header */}
      <div className="px-4 py-3 md:px-8 md:pt-6 md:pb-4 border-b border-[#222226] bg-[#0c0c0e] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#18181c] border border-[#27272a] flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4 text-yellow-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base md:text-xl font-bold text-neutral-100">
                Pomodoro & Modo Foco
              </h1>
            </div>
            <p className="text-xs text-neutral-500 hidden sm:block">
              Timer de alta precisão com sons ambientes sintetizados
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className="bg-[#09090b] px-2.5 py-1 rounded-xl border border-[#222226] flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-orange-400 fill-current" />
            <span className="font-bold text-neutral-100">{totalMinutesToday} min</span>
            <span className="text-neutral-500 hidden sm:inline">({todaySessions.length} sessões)</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 flex flex-col items-center justify-center max-w-2xl mx-auto w-full pb-28 md:pb-12">
        {/* Mode Selector */}
        <div className="flex items-center gap-1 md:gap-2 bg-[#09090b] p-1 md:p-1.5 rounded-2xl border border-[#222226] mb-6 shadow-inner w-full sm:w-auto justify-center">
          <button
            onClick={() => switchMode('pomodoro')}
            className={`px-3 md:px-5 py-2 rounded-xl text-xs font-bold transition-all flex-1 sm:flex-none text-center ${
              mode === 'pomodoro' ? 'bg-neutral-200 text-black shadow-md' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Foco (25m)
          </button>
          <button
            onClick={() => switchMode('shortBreak')}
            className={`px-3 md:px-5 py-2 rounded-xl text-xs font-bold transition-all flex-1 sm:flex-none text-center ${
              mode === 'shortBreak' ? 'bg-[#27272a] text-white shadow-md' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Pausa (5m)
          </button>
          <button
            onClick={() => switchMode('longBreak')}
            className={`px-3 md:px-5 py-2 rounded-xl text-xs font-bold transition-all flex-1 sm:flex-none text-center ${
              mode === 'longBreak' ? 'bg-[#27272a] text-white shadow-md' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Longa (15m)
          </button>
        </div>

        {/* Circular Progress & Big Timer Display */}
        <div className="relative w-64 h-64 md:w-72 md:h-72 flex items-center justify-center mb-6">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="44"
              className="text-[#1a1a1f] stroke-current"
              strokeWidth="4"
              fill="transparent"
            />
            <circle
              cx="50"
              cy="50"
              r="44"
              className={`${
                mode === 'pomodoro' ? 'text-white' : 'text-neutral-400'
              } stroke-current transition-all duration-500 ease-linear`}
              strokeWidth="5"
              strokeDasharray="276.46"
              strokeDashoffset={276.46 - (276.46 * progressPercent) / 100}
              strokeLinecap="round"
              fill="transparent"
            />
          </svg>

          <div className="absolute flex flex-col items-center">
            <span className="text-5xl md:text-6xl font-black font-mono tracking-tight text-white drop-shadow-md">
              {formattedTime}
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-500 mt-2">
              {mode === 'pomodoro' ? 'Em Foco Total' : 'Momento de Descanso'}
            </span>
          </div>
        </div>

        {/* Primary Controls */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`px-6 md:px-8 py-3 rounded-2xl font-bold text-sm flex items-center gap-2.5 shadow-xl transition-all active:scale-95 ${
              isRunning
                ? 'bg-[#27272a] text-white border border-[#3f3f46]'
                : 'bg-white text-black hover:bg-neutral-200'
            }`}
          >
            {isRunning ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
            <span>{isRunning ? 'Pausar' : 'Iniciar Foco'}</span>
          </button>

          <button
            onClick={() => {
              setIsRunning(false);
              setTimeLeft(durations[mode]);
            }}
            className="p-3 rounded-2xl bg-[#18181c] border border-[#27272a] text-neutral-400 hover:text-white transition-colors"
            title="Reiniciar Timer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              setIsRunning(false);
              if (mode === 'pomodoro') {
                switchMode('shortBreak');
              } else {
                switchMode('pomodoro');
              }
            }}
            className="p-3 rounded-2xl bg-[#18181c] border border-[#27272a] text-neutral-400 hover:text-white transition-colors"
            title="Pular Etapa"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>

        {/* Ambient Sounds Synthesizer (White Noise, Rain, Ocean) */}
        <div className="bg-[#0a0a0c] border border-[#222226] rounded-2xl p-4 w-full shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
              <Volume2 className="w-4 h-4 text-neutral-400" />
              Sons Ambientes (Ruído Branco Sintético)
            </span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={handleVolumeChange}
              className="w-20 accent-white"
            />
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[
              { id: 'white', label: 'Estático', icon: Radio },
              { id: 'pink', label: 'Chuva', icon: CloudRain },
              { id: 'brown', label: 'Oceano', icon: Waves },
              { id: 'none', label: 'Mudo', icon: VolumeX }
            ].map((snd) => {
              const Icon = snd.icon;
              const isActive = (snd.id === 'none' && noiseType === 'none') || (snd.id !== 'none' && noiseType === snd.id);
              return (
                <button
                  key={snd.id}
                  onClick={() => handleToggleNoise(snd.id === 'none' ? noiseType : snd.id)}
                  className={`p-2.5 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                    isActive
                      ? 'bg-neutral-200 text-black border-white shadow-sm'
                      : 'bg-[#151518] text-neutral-400 border-[#222226] hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-[10px]">{snd.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
