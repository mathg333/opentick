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
    <div className="flex-1 flex flex-col h-screen overflow-hidden bg-[#121215]">
      {/* Header */}
      <div className="px-8 pt-6 pb-4 border-b border-[#222226] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#18181c] border border-[#27272a] flex items-center justify-center">
            <Clock className="w-4 h-4 text-yellow-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-neutral-100">
                Pomodoro & Modo Foco
              </h1>
              <span className="text-[10px] bg-neutral-800 text-neutral-300 font-bold px-2 py-0.5 rounded border border-neutral-700">
                PRO GRATUITO
              </span>
            </div>
            <p className="text-xs text-neutral-500">
              Timer de alta precisão com sons ambientes sintetizados
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="bg-[#09090b] px-3 py-1.5 rounded-xl border border-[#222226] flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-400 fill-current" />
            <span className="text-neutral-400">Hoje:</span>
            <span className="font-bold text-neutral-100">{totalMinutesToday} min focados</span>
            <span className="text-neutral-500">({todaySessions.length} sessões)</span>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-8 flex flex-col items-center justify-center max-w-4xl mx-auto w-full">
        {/* Mode Selector */}
        <div className="flex items-center gap-2 bg-[#09090b] p-1.5 rounded-2xl border border-[#222226] mb-8 shadow-inner">
          <button
            onClick={() => switchMode('pomodoro')}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
              mode === 'pomodoro' ? 'bg-neutral-200 text-black shadow-md' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Foco (25 min)
          </button>
          <button
            onClick={() => switchMode('shortBreak')}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
              mode === 'shortBreak' ? 'bg-[#27272a] text-white shadow-md' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Pausa Curta (5 min)
          </button>
          <button
            onClick={() => switchMode('longBreak')}
            className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${
              mode === 'longBreak' ? 'bg-[#27272a] text-white shadow-md' : 'text-neutral-400 hover:text-white'
            }`}
          >
            Pausa Longa (15 min)
          </button>
        </div>

        {/* Circular Progress & Big Timer Display */}
        <div className="relative w-72 h-72 flex items-center justify-center mb-8">
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
            <span className="text-6xl font-black font-mono tracking-tight text-white drop-shadow-md">
              {formattedTime}
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-neutral-500 mt-2">
              {mode === 'pomodoro' ? 'Modo Foco' : 'Descanso'}
            </span>
          </div>
        </div>

        {/* Task Linker */}
        <div className="w-full max-w-md mb-8">
          <label className="text-xs text-neutral-400 block mb-1.5 font-medium text-center">
            Vincular Pomodoro à Tarefa:
          </label>
          <select
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(e.target.value)}
            className="w-full bg-[#09090b] border border-[#27272a] rounded-xl px-3 py-2 text-xs text-neutral-200 focus:outline-none focus:border-neutral-500"
          >
            <option value="">Nenhuma tarefa específica (Foco Geral)</option>
            {state.tasks.filter(t => !t.completed).map(t => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 mb-10">
          <button
            onClick={() => {
              setIsRunning(false);
              setTimeLeft(durations[mode]);
            }}
            className="p-3.5 bg-[#09090b] hover:bg-[#1a1a1f] text-neutral-400 hover:text-white rounded-2xl border border-[#27272a] transition-colors"
            title="Reiniciar Timer"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`px-8 py-3.5 rounded-2xl font-bold text-sm flex items-center gap-3 transition-all shadow-xl ${
              isRunning
                ? 'bg-rose-600 hover:bg-rose-500 text-white'
                : 'bg-white hover:bg-neutral-200 text-black'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5 fill-current" /> Pausar
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" /> Iniciar Foco
              </>
            )}
          </button>

          <button
            onClick={() => {
              setTimeLeft(0);
            }}
            className="p-3.5 bg-[#09090b] hover:bg-[#1a1a1f] text-neutral-400 hover:text-white rounded-2xl border border-[#27272a] transition-colors"
            title="Concluir / Próximo"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>

        {/* Ambient Sounds / Ruído Branco Generator */}
        <div className="w-full max-w-lg bg-[#0a0a0c] border border-[#222226] rounded-2xl p-5 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Waves className="w-4 h-4 text-neutral-400" />
              <span className="text-xs font-bold text-neutral-200">Sons Ambientes de Foco</span>
            </div>
            <span className="text-[10px] text-neutral-400 font-bold bg-[#18181c] px-2 py-0.5 rounded border border-[#27272a]">
              Sintetizador Puro
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 mb-3">
            {[
              { id: 'none', label: 'Silencioso', icon: VolumeX },
              { id: 'rain', label: 'Chuva Suave', icon: CloudRain },
              { id: 'pink', label: 'Pink Noise', icon: Waves },
              { id: 'white', label: 'Ruído Branco', icon: Radio },
            ].map(item => {
              const Icon = item.icon;
              const isActive = noiseType === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleToggleNoise(item.id)}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold flex flex-col items-center gap-1.5 border transition-all ${
                    isActive
                      ? 'bg-neutral-200 text-black border-white'
                      : 'bg-[#121215] border-[#222226] text-neutral-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-[10px]">{item.label}</span>
                </button>
              );
            })}
          </div>

          {noiseType !== 'none' && (
            <div className="flex items-center gap-3 pt-2 border-t border-[#18181c]">
              <Volume2 className="w-4 h-4 text-neutral-400" />
              <input
                type="range"
                min="0.01"
                max="0.4"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className="w-full h-1 bg-[#222226] rounded-lg appearance-none cursor-pointer accent-white"
              />
              <span className="text-[10px] text-neutral-400 font-mono w-8">
                {Math.round(volume * 250)}%
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
