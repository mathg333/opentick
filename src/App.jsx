import React, { useState, useEffect, useRef } from 'react';
import { App as CapApp } from '@capacitor/app';
import { useAppStore } from './store/useStore';
import Sidebar from './components/Sidebar';
import TaskView from './components/TaskView';
import CalendarView from './components/CalendarView';
import EisenhowerMatrix from './components/EisenhowerMatrix';
import HabitTracker from './components/HabitTracker';
import PomodoroTimer from './components/PomodoroTimer';
import ProductivityStats from './components/ProductivityStats';
import ProfileCustomizeModal from './components/ProfileCustomizeModal';
import TickTickSyncModal from './components/TickTickSyncModal';
import GlobalQuickAddModal from './components/GlobalQuickAddModal';
import SettingsModal from './components/SettingsModal';
import SearchModal from './components/SearchModal';
import AlarmOverlayModal from './components/AlarmOverlayModal';
import AlarmPermissionModal from './components/AlarmPermissionModal';
import GamificationCelebration from './components/GamificationCelebration';
import RankShield2D from './components/RankShield2D';
import ViewFormatSelectorModal from './components/ViewFormatSelectorModal';
import { calculateGamification } from './utils/gamification';
import { soundManager } from './utils/audio';
import { getCustomAudioFile } from './utils/audioStorage';
import { 
  syncTasksToNativeAlarmManager, 
  stopNativeAlarm, 
  cancelNativeAlarm, 
  markAlarmDismissed, 
  isAlarmDismissed, 
  isNativeAndroid,
  checkAlarmPermissions,
  requestOverlayPermission,
  requestExactAlarmPermission,
  requestFullScreenIntentPermission
} from './utils/nativeAlarm';
import { 
  Menu, 
  CheckSquare, 
  Calendar as CalendarIcon, 
  CalendarDays,
  Grid, 
  Flame, 
  Clock, 
  Plus, 
  BarChart3,
  Search,
  MoreHorizontal,
  Settings,
  MoreVertical
} from 'lucide-react';

export default function App() {
  const store = useAppStore();
  const { activeView, setActiveView, selectedTaskId, setSelectedTaskId, state } = store;

  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isViewSelectorOpen, setIsViewSelectorOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeTaskForPomodoro, setActiveTaskForPomodoro] = useState(null);

  // Active Continuous Alarm State
  const [alarmActiveTask, setAlarmActiveTask] = useState(null);
  const [isAlarmModalOpen, setIsAlarmModalOpen] = useState(false);
  const [customAudioInfo, setCustomAudioInfo] = useState(null);
  const [missingPermissions, setMissingPermissions] = useState(false);
  const triggeredAlarmsRef = useRef(new Set());

  const today = new Date();
  const currentDayNumber = today.getDate();

  // Request browser notification permissions on mount & check Android permissions
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    // Pre-load custom audio info
    getCustomAudioFile().then(record => {
      if (record) setCustomAudioInfo(record);
    });

    if (isNativeAndroid()) {
      checkAlarmPermissions().then(perms => {
        if (!perms?.overlayGranted || !perms?.exactAlarmGranted || perms?.fullScreenIntentGranted === false) {
          setMissingPermissions(true);
        }
      });
    }
  }, []);

  // Synchronize scheduled alarms to Android native AlarmManager (Exact, Doze-proof, Lock-screen ready)
  useEffect(() => {
    syncTasksToNativeAlarmManager(state.tasks);
  }, [state.tasks]);

  // Listen for native Android alarm wake-up events (triggered on lock screen or over other apps)
  useEffect(() => {
    const handleNativeAlarm = (e) => {
      const { taskId, taskTitle } = e.detail || {};
      const foundTask = state.tasks.find(t => t.id === taskId) || {
        id: taskId || 'alarm-lockscreen',
        title: taskTitle || 'Lembrete OpenTick'
      };
      setAlarmActiveTask(foundTask);
      setIsAlarmModalOpen(true);
    };

    // Listen for alarm stop event broadcasted from native AlarmActivity or notification
    const handleNativeAlarmStopped = (e) => {
      const stoppedId = e?.detail?.taskId;
      if (stoppedId) {
        const now = new Date();
        const yr = now.getFullYear();
        const mo = String(now.getMonth() + 1).padStart(2, '0');
        const dy = String(now.getDate()).padStart(2, '0');
        const todayStr = `${yr}-${mo}-${dy}`;
        markAlarmDismissed(stoppedId, todayStr, alarmActiveTask?.startTime);
      }
      soundManager.stopContinuousAlarm();
      // Note: Do NOT call stopNativeAlarm here, as native AlarmService has already stopped!
      setIsAlarmModalOpen(false);
      setAlarmActiveTask(null);
    };

    window.addEventListener('nativeAlarmTriggered', handleNativeAlarm);
    window.addEventListener('nativeAlarmStopped', handleNativeAlarmStopped);

    return () => {
      window.removeEventListener('nativeAlarmTriggered', handleNativeAlarm);
      window.removeEventListener('nativeAlarmStopped', handleNativeAlarmStopped);
    };
  }, [state.tasks]);

  // Alarm Ticker: Checks every 5 seconds if a scheduled task has reached its time
  useEffect(() => {
    const checkScheduledAlarms = async () => {
      const now = new Date();
      const yr = now.getFullYear();
      const mo = String(now.getMonth() + 1).padStart(2, '0');
      const dy = String(now.getDate()).padStart(2, '0');
      const todayStr = `${yr}-${mo}-${dy}`;

      const hr = String(now.getHours()).padStart(2, '0');
      const mn = String(now.getMinutes()).padStart(2, '0');
      const currentHHMM = `${hr}:${mn}`;

      const settings = state.settings || {};

      for (const t of state.tasks) {
        if (t.completed) continue;
        if (!t.startTime) continue;

        // Verify if this alarm was already stopped/dismissed today
        if (isAlarmDismissed(t.id, todayStr, currentHHMM)) {
          continue;
        }

        const isToday = t.dueDate === todayStr || (t.recurringDates && t.recurringDates.includes(todayStr));
        const isTimeMatch = t.startTime === currentHHMM;

        if (isToday && isTimeMatch) {
          const alarmKey = `${t.id}_${todayStr}_${currentHHMM}`;
          if (!triggeredAlarmsRef.current.has(alarmKey)) {
            triggeredAlarmsRef.current.add(alarmKey);

            // On Native Android, native AlarmService handles ringtone and AlarmActivity handles the UI.
            // Do NOT start web soundManager audio on Native Android to prevent audio duplicate looping!
            if (!isNativeAndroid()) {
              let customAudioUrl = null;
              if (settings.sound === 'custom') {
                const record = await getCustomAudioFile();
                customAudioUrl = record?.dataUrl || null;
                if (record) setCustomAudioInfo(record);
              }

              // Start continuous long alarm (up to 5 min by default)
              soundManager.startContinuousAlarm({
                sound: settings.sound || 'radar',
                customAudioUrl,
                volume: settings.volume ?? 0.8,
                durationMinutes: settings.alarmDuration || 5,
                vibration: settings.vibration !== false,
                onStop: () => {
                  setIsAlarmModalOpen(false);
                  setAlarmActiveTask(null);
                }
              });
            }

            setAlarmActiveTask(t);
            setIsAlarmModalOpen(true);

            // Web notification
            if (!isNativeAndroid() && 'Notification' in window && Notification.permission === 'granted') {
              try {
                new Notification(`⏰ ${t.title}`, {
                  body: `OpenTick: Alarme agendado para às ${currentHHMM}!`,
                  icon: '/favicon.ico'
                });
              } catch (e) {}
            }
            break;
          }
        }
      }
    };

    const interval = setInterval(checkScheduledAlarms, 5000);
    return () => clearInterval(interval);
  }, [state.tasks, state.settings]);

  const handleStopAlarm = () => {
    if (alarmActiveTask && alarmActiveTask.id) {
      const now = new Date();
      const yr = now.getFullYear();
      const mo = String(now.getMonth() + 1).padStart(2, '0');
      const dy = String(now.getDate()).padStart(2, '0');
      const todayStr = `${yr}-${mo}-${dy}`;

      // Persistently record dismissal in LocalStorage and Android SharedPreferences
      markAlarmDismissed(alarmActiveTask.id, todayStr, alarmActiveTask.startTime);
      cancelNativeAlarm(alarmActiveTask.id);
      stopNativeAlarm(alarmActiveTask.id);
    } else {
      stopNativeAlarm();
    }
    soundManager.stopContinuousAlarm();
    setIsAlarmModalOpen(false);
    setAlarmActiveTask(null);
  };

  const handleSnoozeAlarm = () => {
    soundManager.stopContinuousAlarm();
    if (alarmActiveTask && alarmActiveTask.id) {
      stopNativeAlarm(alarmActiveTask.id);
    } else {
      stopNativeAlarm();
    }
    setIsAlarmModalOpen(false);
    if (alarmActiveTask && alarmActiveTask.id !== 'test-alarm') {
      const now = new Date(Date.now() + 5 * 60 * 1000); // +5 minutes
      const hr = String(now.getHours()).padStart(2, '0');
      const mn = String(now.getMinutes()).padStart(2, '0');
      const newTime = `${hr}:${mn}`;
      store.updateTask(alarmActiveTask.id, { startTime: newTime });
    }
    setAlarmActiveTask(null);
  };

  const handleTriggerTestAlarm = async (soundId) => {
    if (isNativeAndroid()) {
      // On Native Android, trigger true native system alarm in 2.5 seconds
      await scheduleNativeAlarm('test-alarm', 'Disparo de Alarme de Teste', Date.now() + 2500);
      return;
    }

    let customAudioUrl = null;
    let customName = '';
    if (soundId === 'custom') {
      const record = await getCustomAudioFile();
      customAudioUrl = record?.dataUrl || null;
      customName = record?.name || 'Música do Celular';
      if (record) setCustomAudioInfo(record);
    }

    soundManager.startContinuousAlarm({
      sound: soundId,
      customAudioUrl,
      volume: state.settings?.volume ?? 0.8,
      durationMinutes: state.settings?.alarmDuration || 5,
      vibration: state.settings?.vibration !== false,
      onStop: () => {
        setIsAlarmModalOpen(false);
        setAlarmActiveTask(null);
      }
    });

    const now = new Date();
    setAlarmActiveTask({
      id: 'test-alarm',
      title: 'Disparo de Alarme de Teste',
      startTime: `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    });
    setIsAlarmModalOpen(true);
  };

  // Store dynamic states in a Ref to eliminate dependency churn and backButton listener leaks
  const backStateRef = useRef({});
  backStateRef.current = {
    isSearchOpen, 
    isSettingsOpen, 
    isSyncModalOpen, 
    isQuickAddOpen, 
    isMobileDrawerOpen, 
    selectedTaskId, 
    activeView
  };

  // Native Android Hardware / Virtual Back Button Handler (Fixes app closing instead of navigating back)
  useEffect(() => {
    let lastBackPress = 0;
    let backListenerHandle = null;

    const handleBackButton = async () => {
      const s = backStateRef.current;
      // 1. Close Search Modal
      if (s.isSearchOpen) {
        setIsSearchOpen(false);
        return;
      }
      // 2. Close Settings Modal
      if (s.isSettingsOpen) {
        setIsSettingsOpen(false);
        return;
      }
      // 3. Close Sync Modal
      if (s.isSyncModalOpen) {
        setIsSyncModalOpen(false);
        return;
      }
      // 4. Close Quick Add Modal
      if (s.isQuickAddOpen) {
        setIsQuickAddOpen(false);
        return;
      }
      // 5. Close Mobile Drawer
      if (s.isMobileDrawerOpen) {
        setIsMobileDrawerOpen(false);
        return;
      }
      // 6. Close Task Details Sheet
      if (s.selectedTaskId) {
        setSelectedTaskId(null);
        return;
      }
      // 7. If on another screen, navigate back to 'tasks-today'
      if (s.activeView !== 'tasks-today') {
        setActiveView('tasks-today');
        return;
      }

      // 8. If on 'tasks-today' and nothing is open, confirm exit with double tap
      const now = Date.now();
      if (now - lastBackPress < 2000) {
        CapApp.exitApp();
      } else {
        lastBackPress = now;
        const toast = document.createElement('div');
        toast.innerText = 'Pressione voltar novamente para sair';
        toast.className = 'fixed bottom-24 left-1/2 -translate-x-1/2 bg-[#1c1c1e] text-white px-4 py-2 rounded-full text-xs font-semibold shadow-2xl border border-[#2c2c2e] z-50 animate-in fade-in select-none pointer-events-none';
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 2000);
      }
    };

    try {
      CapApp.addListener('backButton', handleBackButton).then(handle => {
        backListenerHandle = handle;
      });
    } catch (e) {
      console.warn('Capacitor App backButton listener not available on web', e);
    }

    return () => {
      if (backListenerHandle) {
        backListenerHandle.remove();
      }
    };
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = e.target.tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') {
        if (e.key === 'Escape') {
          e.target.blur();
          setIsQuickAddOpen(false);
          setIsSyncModalOpen(false);
          setIsSettingsOpen(false);
          setIsSearchOpen(false);
          setSelectedTaskId(null);
        }
        return;
      }

      if (e.key === 'q' || e.key === 'Q' || e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        setIsQuickAddOpen(true);
      } else if (e.key === '1') {
        setActiveView('tasks-today');
      } else if (e.key === '2') {
        setActiveView('calendar');
      } else if (e.key === '3') {
        setActiveView('eisenhower');
      } else if (e.key === '4') {
        setActiveView('habits');
      } else if (e.key === '5') {
        setActiveView('pomodoro');
      } else if (e.key === '6') {
        setActiveView('stats');
      } else if (e.key === 'Escape') {
        setIsQuickAddOpen(false);
        setIsSyncModalOpen(false);
        setIsSettingsOpen(false);
        setIsSearchOpen(false);
        setIsMobileDrawerOpen(false);
        setSelectedTaskId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActiveView, setSelectedTaskId]);

  const handleStartPomodoroForTask = (task) => {
    setActiveTaskForPomodoro(task);
    setActiveView('pomodoro');
  };

  const isTaskView = activeView.startsWith('tasks-') || activeView.startsWith('project-');

  // Title for Mobile Top Bar
  const getHeaderTitle = () => {
    if (activeView === 'tasks-today') return 'Hoje';
    if (activeView === 'tasks-inbox') return 'Caixa de Entrada';
    if (activeView === 'tasks-completed') return 'Concluído';
    if (activeView === 'calendar') return 'Calendário';
    if (activeView === 'eisenhower') return 'Matriz';
    if (activeView === 'habits') return 'Hábitos';
    if (activeView === 'pomodoro') return 'Foco';
    if (activeView === 'stats') return 'Progresso Nível XP';
    if (activeView.startsWith('project-')) {
      const projId = activeView.replace('project-', '');
      const proj = state.projects.find(p => p.id === projId);
      return proj ? proj.name : 'Lista';
    }
    return 'OpenTick';
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen overflow-hidden bg-[#000000] text-neutral-100 font-sans select-none">
      {/* MOBILE TOP BAR (Exact TickTick Android Bar with Hamburger, Title, and Action icons) */}
      <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[#000000] border-b border-[#141416] z-30 shrink-0">
        <div className="flex items-center gap-3.5">
          <button
            onClick={() => setIsMobileDrawerOpen(true)}
            className="p-1 -ml-1 text-white hover:text-neutral-300 active:scale-95 transition-transform"
            title="Abrir Menu de Listas"
          >
            <Menu className="w-6 h-6 stroke-[2] text-[#facc15]" />
          </button>
          <h1 className="text-lg font-bold text-white tracking-tight truncate max-w-[270px]">
            {getHeaderTitle()}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Rank Shield & Level Shortcut */}
          <button
            onClick={() => {
              setActiveView('stats');
              setSelectedTaskId(null);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#16161c] hover:bg-[#202028] border border-[#2c2c36] active:scale-95 transition-all shadow-sm"
            title="Ver Seus Rankings, Escudos e XP"
          >
            <RankShield2D tier={calculateGamification(state).currentRank.tier} size={20} showGlow={false} />
            <span className="text-[11px] font-black text-amber-300 font-mono">
              Nv.{calculateGamification(state).level}
            </span>
          </button>

          <button
            onClick={() => setIsSearchOpen(true)}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg active:bg-neutral-800"
            title="Pesquisar"
          >
            <Search className="w-5 h-5 text-[#facc15]" />
          </button>
          
        </div>
      </header>

      {/* MOBILE DRAWER BACKDROP (Fundo escuro suave para fechar o menu) */}
      {isMobileDrawerOpen && (
        <div 
          onClick={() => setIsMobileDrawerOpen(false)}
          className="md:hidden fixed inset-0 bg-black/75 z-40 backdrop-blur-xs transition-opacity duration-200"
        />
      )}

      {/* SIDEBAR DRAWER (Desliza suavemente no celular, fica fixo no desktop) */}
      <div className={`
        fixed inset-y-0 left-0 z-50 transform md:relative md:translate-x-0 transition-transform duration-250 ease-in-out
        ${isMobileDrawerOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <Sidebar
          store={store}
          onCloseMobileDrawer={() => setIsMobileDrawerOpen(false)}
          onOpenSyncModal={() => {
            setIsMobileDrawerOpen(false);
            setIsSyncModalOpen(true);
          }}
          onOpenSettingsModal={() => {
            setIsMobileDrawerOpen(false);
            setIsSettingsOpen(true);
          }}
          onOpenSearchModal={() => {
            setIsMobileDrawerOpen(false);
            setIsSearchOpen(true);
          }}
          onOpenProfileModal={() => {
            setIsMobileDrawerOpen(false);
            setIsProfileModalOpen(true);
          }}
        />
      </div>

      {/* MAIN VIEW CONTENT AREA */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#000000] relative">
        {missingPermissions && (
          <div className="bg-[#facc15]/15 border-b border-[#facc15]/30 px-4 py-2.5 flex items-center justify-between text-xs text-neutral-200 z-30">
            <div className="flex items-center gap-2">
              <span className="text-[#facc15] text-sm">⏰</span>
              <span>Para o alarme abrir na tela de bloqueio, ative as permissões.</span>
            </div>
            <button
              onClick={() => {
                requestOverlayPermission();
                setTimeout(requestExactAlarmPermission, 800);
                setTimeout(requestFullScreenIntentPermission, 1600);
                setMissingPermissions(false);
              }}
              className="px-2.5 py-1 bg-[#facc15] hover:bg-[#ff7d1a] text-black font-bold rounded-lg text-[11px] shrink-0 active:scale-95 transition-transform"
            >
              Ativar
            </button>
          </div>
        )}
        <div className="flex-1 overflow-hidden flex">
          {isTaskView && (
            <TaskView
              store={store}
              onStartPomodoroForTask={handleStartPomodoroForTask}
              onOpenMobileMenu={() => setIsMobileDrawerOpen(true)}
            />
          )}

          {activeView === 'calendar' && (
            <CalendarView store={store} />
          )}

          {activeView === 'eisenhower' && (
            <EisenhowerMatrix store={store} />
          )}

          {activeView === 'habits' && (
            <HabitTracker store={store} />
          )}

          {activeView === 'pomodoro' && (
            <PomodoroTimer
              store={store}
              activeTask={activeTaskForPomodoro}
            />
          )}

          {activeView === 'stats' && (
            <ProductivityStats store={store} />
          )}
        </div>

        {/* MOBILE FLOATING ACTION BUTTON (FAB: Botão Amarelo Vibrante com +) */}
        {/* Floating Quick Add Button (Bottom Right) */}
        <button
          onClick={() => setIsQuickAddOpen(true)}
          className="md:hidden fixed bottom-28 right-5 w-14 h-14 bg-[#facc15] hover:bg-[#eab308] active:scale-90 text-black rounded-full shadow-[0_8px_25px_rgba(250,204,21,0.55)] flex items-center justify-center z-30 transition-all duration-150"
          title="Nova Tarefa (Rápida)"
        >
          <Plus className="w-7 h-7 stroke-[3] text-black" />
        </button>

        {/* MOBILE BOTTOM NAVIGATION BAR (Touch-First & Safe-Area Optimized) */}
        <nav className="md:hidden flex items-center justify-around bg-[#000000] border-t border-[#18181c] pt-2 pb-[max(0.6rem,env(safe-area-inset-bottom))] px-1 z-30 shrink-0">
          {/* Tab 1: Tarefas (Hoje) */}
          <button
            onClick={() => {
              store.setTaskViewLayout('list');
              setActiveView('tasks-today');
              setSelectedTaskId(null);
            }}
            className="flex flex-col items-center justify-center min-w-[54px] min-h-[48px] p-1.5 rounded-xl active:scale-90 transition-transform"
            title="Tarefas de Hoje"
          >
            {isTaskView && store.taskViewLayout !== 'kanban' ? (
              <div className="w-8 h-8 rounded-xl bg-[#facc15] flex items-center justify-center shadow-lg shadow-[#facc15]/30">
                <CheckSquare className="w-5 h-5 text-black stroke-[2.5]" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-xl border border-[#facc15]/30 bg-[#121215] flex items-center justify-center text-[#facc15]">
                <CheckSquare className="w-4 h-4 text-[#facc15]" />
              </div>
            )}
            <span className={`text-[10px] font-bold mt-1 ${isTaskView && store.taskViewLayout !== 'kanban' ? 'text-[#facc15]' : 'text-neutral-500'}`}>
              Tarefas
            </span>
          </button>

          {/* Tab 2: Segundo Ícone do Lado Esquerdo -> Formatos de Visualização (Diário, Semanal, Mensal, Anual, Kanban, Matriz, Listas) */}
          <button
            onClick={() => {
              setIsViewSelectorOpen(true);
            }}
            className="flex flex-col items-center justify-center min-w-[54px] min-h-[48px] p-1.5 rounded-xl active:scale-90 transition-transform"
            title="Escolher Formato de Visualização"
          >
            {activeView === 'calendar' || activeView === 'eisenhower' || activeView === 'habits' || store.taskViewLayout === 'kanban' ? (
              <div className="w-8 h-8 rounded-xl bg-[#facc15] flex items-center justify-center shadow-lg shadow-[#facc15]/30">
                <CalendarDays className="w-5 h-5 text-black stroke-[2.5]" />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-xl border border-[#facc15]/30 bg-[#121215] flex items-center justify-center text-[#facc15] hover:border-[#facc15]/50">
                <CalendarDays className="w-4 h-4 text-[#facc15]" />
              </div>
            )}
            <span className={`text-[10px] font-bold mt-1 ${activeView === 'calendar' || activeView === 'eisenhower' || activeView === 'habits' || store.taskViewLayout === 'kanban' ? 'text-[#facc15]' : 'text-neutral-500'}`}>
              Visualizações
            </span>
          </button>

          {/* Tab 3: Ranking & Escudos */}
          <button
            onClick={() => {
              setActiveView('stats');
              setSelectedTaskId(null);
            }}
            className="flex flex-col items-center justify-center min-w-[54px] min-h-[48px] p-1.5 rounded-xl active:scale-90 transition-transform"
            title="Seus Rankings & Escudos"
          >
            {activeView === 'stats' ? (
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-yellow-300 to-[#facc15] flex items-center justify-center shadow-lg shadow-[#facc15]/40 p-0.5">
                <RankShield2D tier={calculateGamification(state).currentRank.tier} size={24} showGlow={false} />
              </div>
            ) : (
              <div className="w-8 h-8 rounded-xl bg-[#121215] border border-[#facc15]/30 flex items-center justify-center p-0.5 hover:border-[#facc15]/50">
                <RankShield2D tier={calculateGamification(state).currentRank.tier} size={22} showGlow={false} />
              </div>
            )}
            <span className={`text-[10px] font-bold mt-1 ${activeView === 'stats' ? 'text-[#facc15]' : 'text-neutral-500'}`}>
              Escudo
            </span>
          </button>

          {/* Tab 4: Mais / Configurações */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex flex-col items-center justify-center min-w-[54px] min-h-[48px] p-1.5 rounded-xl text-neutral-400 hover:text-white active:scale-90 transition-transform"
            title="Mais Opções & Configurações"
          >
            <div className="w-8 h-8 rounded-xl border border-[#facc15]/30 bg-[#121215] flex items-center justify-center text-[#facc15] hover:border-[#facc15]/50">
              <MoreHorizontal className="w-5 h-5 stroke-[2] text-[#facc15]" />
            </div>
            <span className="text-[10px] font-bold mt-1 text-neutral-500">
              Mais
            </span>
          </button>
        </nav>
      </main>

      {/* Global Quick Add Modal */}
      <GlobalQuickAddModal
        store={store}
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
      />

      {/* Sincronização / Backup Modal */}
      <TickTickSyncModal
        store={store}
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
      />

      {/* Settings Modal with real interactive sub-screens */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        store={store}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onOpenProfileModal={() => setIsProfileModalOpen(true)}
        onTriggerTestAlarm={handleTriggerTestAlarm}
        onOpenStats={() => {
          setIsSettingsOpen(false);
          setActiveView('stats');
          setSelectedTaskId(null);
        }}
      />

      {/* Profile & Cover Customization Modal */}
      <ProfileCustomizeModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        store={store}
      />

      {/* Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        store={store}
      />

      {/* Continuous 5-Minute Long Alarm Screen Overlay */}
      <AlarmOverlayModal
        isOpen={isAlarmModalOpen}
        task={alarmActiveTask}
        soundName={state.settings?.sound || 'radar'}
        customAudioName={customAudioInfo?.name || ''}
        onStopAlarm={handleStopAlarm}
        onSnoozeAlarm={handleSnoozeAlarm}
      />

      {/* Android Alarm & Lockscreen Permission Onboarding Modal */}
      <AlarmPermissionModal />

      {/* View Format Selector Modal (Diário, Semanal, Mensal, Anual, Kanban, Matriz Eisenhower, Listas) */}
      <ViewFormatSelectorModal
        isOpen={isViewSelectorOpen}
        onClose={() => setIsViewSelectorOpen(false)}
        store={store}
      />

      {/* Gamification Floating XP & 3D Shield Rank Up Celebration */}
      <GamificationCelebration />
    </div>
  );
}
