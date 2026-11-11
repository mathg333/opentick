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
import CustomDatePickerModal from './components/CustomDatePickerModal';
import { getTaskTimes, isTaskOnDate, getTodayYMD, addDaysYMD } from './utils/taskSchedule';
import { calculateGamification } from './utils/gamification';
import { soundManager } from './utils/audio';
import { getCustomAudioFile } from './utils/audioStorage';
import { 
  syncTasksToNativeAlarmManager, 
  syncNativeAlarmSettings,
  syncCustomAudioToNative,
  consumePendingNativeAlarm,
  scheduleNativeAlarm,
  stopNativeAlarm, 
  snoozeNativeAlarm,
  cancelNativeAlarm, 
  markAlarmDismissed, 
  isAlarmDismissed, 
  isNativeAndroid,
  checkNativeAlarmPermissions,
  requestNotificationPermission,
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
  const {
    activeView,
    setActiveView,
    selectedTaskId,
    setSelectedTaskId,
    state,
    addTasksForMultipleDates,
    updateTask,
    toggleTaskCompleted,
    calendarViewMode
  } = store;

  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [quickAddPrefill, setQuickAddPrefill] = useState(null);
  const [isViewSelectorOpen, setIsViewSelectorOpen] = useState(false);
  const [isGlobalCustomModalOpen, setIsGlobalCustomModalOpen] = useState(false);
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
  const webSnoozesRef = useRef([]); // { task, occKey, triggerAtMs, timeLabel }

  // Load custom audio, sync native settings & consume cold-start pending native alarm
  useEffect(() => {
    getCustomAudioFile().then(record => {
      if (record) {
        setCustomAudioInfo(record);
        syncCustomAudioToNative(record.dataUrl, record.name);
      }
    });

    if (isNativeAndroid()) {
      checkNativeAlarmPermissions().then(perms => {
        if (!perms.exactAlarm || !perms.overlay || perms.notifications === false) {
          setMissingPermissions(true);
        }
      });

      consumePendingNativeAlarm().then(pending => {
        if (pending && pending.taskId) {
          const foundTask = (state.tasks || []).find(task => task.id === pending.taskId) || {
            id: pending.taskId,
            title: pending.taskTitle || 'Lembrete OpenTick'
          };
          setAlarmActiveTask({
            ...foundTask,
            triggeredTime: pending.timeLabel || foundTask.startTime || '',
            occurrenceId: pending.occurrenceId || pending.taskId
          });
          setIsAlarmModalOpen(true);
        }
      });
    }
  }, []);

  // Sync tasks & global alarm settings to native Android AlarmManager whenever changed
  useEffect(() => {
    syncNativeAlarmSettings(state.settings || {});
    syncTasksToNativeAlarmManager(state.tasks, state.settings || {});
  }, [state.tasks, state.settings]);

  // Listen to Android Broadcast Events (triggered / stopped / snoozed)
  useEffect(() => {
    const handleNativeAlarm = (e) => {
      const { taskId, taskTitle, occurrenceId, timeLabel } = e.detail || {};
      if (!taskId) return;
      const foundTask = (state.tasks || []).find(task => task.id === taskId) || {
        id: taskId,
        title: taskTitle || 'Lembrete OpenTick'
      };
      setAlarmActiveTask({
        ...foundTask,
        triggeredTime: timeLabel || foundTask.startTime || '',
        occurrenceId: occurrenceId || taskId
      });
      setIsAlarmModalOpen(true);
    };

    const handleNativeAlarmStopped = (e) => {
      const { occurrenceId } = e.detail || {};
      soundManager.stopContinuousAlarm();
      if (occurrenceId) markAlarmDismissed(occurrenceId);
      setIsAlarmModalOpen(false);
      setAlarmActiveTask(null);
      syncTasksToNativeAlarmManager(state.tasks, state.settings || {});
    };

    const handleNativeAlarmSnoozed = () => {
      soundManager.stopContinuousAlarm();
      setIsAlarmModalOpen(false);
      setAlarmActiveTask(null);
    };

    window.addEventListener('nativeAlarmTriggered', handleNativeAlarm);
    window.addEventListener('nativeAlarmStopped', handleNativeAlarmStopped);
    window.addEventListener('nativeAlarmSnoozed', handleNativeAlarmSnoozed);
    return () => {
      window.removeEventListener('nativeAlarmTriggered', handleNativeAlarm);
      window.removeEventListener('nativeAlarmStopped', handleNativeAlarmStopped);
      window.removeEventListener('nativeAlarmSnoozed', handleNativeAlarmSnoozed);
    };
  }, [state.tasks, state.settings]);

  // Background Ticker checking upcoming task alarms & Web Snoozes
  useEffect(() => {
    const fireWebOrForegroundAlarm = async (taskObj, occKey, timeLabel) => {
      triggeredAlarmsRef.current.add(occKey);
      const settings = state.settings || {};
      const alarmMode = taskObj.alarmMode || settings.alarmMode || 'continuous';
      const sound = taskObj.alarmSound || settings.sound || 'radar';
      const durationMinutes = settings.durationMinutes ?? settings.alarmDuration ?? 5;

      if (!isNativeAndroid()) {
        if (sound !== 'none') {
          let customUrl = null;
          if (sound === 'custom') {
            const record = await getCustomAudioFile();
            if (record) customUrl = record.dataUrl;
          }
          if (alarmMode === 'short') {
            soundManager.playSound(sound, settings.volume ?? 0.8);
          } else {
            soundManager.startContinuousAlarm({
              sound,
              customAudioUrl: customUrl,
              volume: settings.volume ?? 0.8,
              durationMinutes,
              vibration: settings.vibration !== false,
              onStop: () => {
                setIsAlarmModalOpen(false);
                setAlarmActiveTask(null);
              }
            });
          }
        }
        setAlarmActiveTask({ ...taskObj, triggeredTime: timeLabel, occurrenceId: occKey });
        setIsAlarmModalOpen(true);

        try {
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(taskObj.title || 'Lembrete OpenTick', {
              body: `OpenTick: Alarme agendado para às ${timeLabel}`,
              icon: '/vite.svg',
              requireInteraction: alarmMode !== 'short'
            });
          }
        } catch (err) {
          console.warn('Web Notification error:', err);
        }
      } else {
        if (alarmMode !== 'short') {
          setAlarmActiveTask({ ...taskObj, triggeredTime: timeLabel, occurrenceId: occKey });
          setIsAlarmModalOpen(true);
        }
      }
    };

    const checkScheduledAlarms = async () => {
      const now = new Date();
      const nowMs = now.getTime();
      const todayStr = getTodayYMD();
      const tomorrowStr = addDaysYMD(todayStr, 1);
      const hr = String(now.getHours()).padStart(2, '0');
      const mn = String(now.getMinutes()).padStart(2, '0');
      const currentHHMM = `${hr}:${mn}`;
      const settings = state.settings || {};

      // 1. Check ephemeral Web Snoozes first (works across midnight without mutating task templates)
      if (!isNativeAndroid() && webSnoozesRef.current.length > 0) {
        const remaining = [];
        for (const sn of webSnoozesRef.current) {
          if (nowMs >= sn.triggerAtMs) {
            await fireWebOrForegroundAlarm(sn.task, sn.occKey, sn.timeLabel);
          } else {
            remaining.push(sn);
          }
        }
        webSnoozesRef.current = remaining;
      }

      // 2. Check scheduled task dates + reminderOffset across today & tomorrow (handles midnight boundary offsets)
      for (const t of state.tasks || []) {
        if (!t || t.deleted || t.completed || t.alarmEnabled === false) continue;
        const taskTimes = getTaskTimes(t);
        if (taskTimes.length === 0) continue;

        const offsetMins = Number(t.reminderOffset !== undefined ? t.reminderOffset : (settings.reminderOffset || 0)) || 0;

        for (const dStr of [todayStr, tomorrowStr]) {
          if (!isTaskOnDate(t, dStr)) continue;
          const [y, m, d] = dStr.split('-').map(Number);
          if (!y || !m || !d) continue;

          for (const tm of taskTimes) {
            const [hh, mm] = tm.split(':').map(Number);
            if (Number.isNaN(hh) || Number.isNaN(mm)) continue;

            const occId = `${t.id}_${dStr}_${tm}`;
            if (isAlarmDismissed(occId) || triggeredAlarmsRef.current.has(occId)) continue;

            const targetDt = new Date(y, m - 1, d, hh, mm, 0, 0);
            const effDt = new Date(targetDt.getTime() - offsetMins * 60 * 1000);
            const effYMD = `${effDt.getFullYear()}-${String(effDt.getMonth() + 1).padStart(2, '0')}-${String(effDt.getDate()).padStart(2, '0')}`;
            const effHHMM = `${String(effDt.getHours()).padStart(2, '0')}:${String(effDt.getMinutes()).padStart(2, '0')}`;

            if (effYMD === todayStr && effHHMM === currentHHMM) {
              await fireWebOrForegroundAlarm(t, occId, tm);
            }
          }
        }
      }
    };

    checkScheduledAlarms();
    const interval = setInterval(checkScheduledAlarms, 5000);
    return () => clearInterval(interval);
  }, [state.tasks, state.settings]);

  const handleStopAlarm = () => {
    const settings = state.settings || {};
    if (alarmActiveTask) {
      const occId = alarmActiveTask.occurrenceId || '';
      if (occId) {
        markAlarmDismissed(occId);
      } else {
        const now = new Date();
        const todayStr = getTodayYMD();
        const hhmm = alarmActiveTask.triggeredTime || `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        markAlarmDismissed(`${alarmActiveTask.id}_${todayStr}_${hhmm}`);
      }
      if (isNativeAndroid()) {
        stopNativeAlarm(alarmActiveTask.id, occId);
      }
      syncTasksToNativeAlarmManager(state.tasks, settings);
    }
    soundManager.stopContinuousAlarm();
    setIsAlarmModalOpen(false);
    setAlarmActiveTask(null);
  };

  const handleCompleteAlarmTask = () => {
    if (alarmActiveTask?.id && alarmActiveTask.id !== 'test-alarm' && !alarmActiveTask.completed) {
      toggleTaskCompleted(alarmActiveTask.id);
    }
    handleStopAlarm();
  };

  const handleSnoozeAlarm = (minutes = 10) => {
    soundManager.stopContinuousAlarm();
    const snoozeMins = (typeof minutes === 'number' && !Number.isNaN(minutes) && minutes > 0) ? minutes : 10;
    const settings = state.settings || {};

    if (alarmActiveTask) {
      const occId = alarmActiveTask.occurrenceId || `${alarmActiveTask.id}_snooze`;
      const fireAtMs = Date.now() + snoozeMins * 60 * 1000;
      const fireDt = new Date(fireAtMs);
      const snoozeTimeStr = `${String(fireDt.getHours()).padStart(2, '0')}:${String(fireDt.getMinutes()).padStart(2, '0')}`;

      markAlarmDismissed(occId);

      if (isNativeAndroid()) {
        snoozeNativeAlarm(alarmActiveTask.id, alarmActiveTask.title || 'Lembrete OpenTick', snoozeMins, occId);
      } else {
        webSnoozesRef.current.push({
          task: alarmActiveTask,
          occKey: `${occId}_snz_${fireAtMs}`,
          triggerAtMs: fireAtMs,
          timeLabel: snoozeTimeStr
        });
      }
      syncTasksToNativeAlarmManager(state.tasks, settings);
    }
    setIsAlarmModalOpen(false);
    setAlarmActiveTask(null);
  };

  const handleTriggerTestAlarm = async (soundId) => {
    const settings = state.settings || {};
    const targetSound = soundId || settings.sound || 'radar';
    const durationMinutes = settings.durationMinutes ?? settings.alarmDuration ?? 5;

    if (isNativeAndroid()) {
      await scheduleNativeAlarm({
        id: 'test-alarm',
        occurrenceId: `test-alarm_${Date.now()}`,
        title: 'Disparo de Alarme de Teste',
        timeInMillis: Date.now() + 2500,
        timeLabel: 'TESTE',
        alarmMode: 'continuous',
        sound: targetSound
      });
      return;
    }

    if (targetSound !== 'none') {
      let customUrl = null;
      if (targetSound === 'custom') {
        const record = await getCustomAudioFile();
        if (record) customUrl = record.dataUrl;
      }
      soundManager.startContinuousAlarm({
        sound: targetSound,
        customAudioUrl: customUrl,
        volume: settings.volume ?? 0.8,
        durationMinutes,
        vibration: settings.vibration !== false,
        onStop: () => {
          setIsAlarmModalOpen(false);
          setAlarmActiveTask(null);
        }
      });
    }

    setAlarmActiveTask({
      id: 'test-alarm',
      title: 'Disparo de Alarme de Teste',
      triggeredTime: 'AGORA',
      description: 'Se você está ouvindo isto, seu alarme funciona!'
    });
    setIsAlarmModalOpen(true);
  };
  const backStateRef = useRef({});
  backStateRef.current = {
    isAlarmModalOpen,
    isGlobalCustomModalOpen,
    isProfileModalOpen,
    isViewSelectorOpen,
    isSearchOpen,
    isSettingsOpen,
    isSyncModalOpen,
    isQuickAddOpen,
    isMobileDrawerOpen,
    selectedTaskId,
    activeView,
    confirmExit: state.settings?.confirmExit !== false
  };

  // Native Android Hardware / Virtual Back Button Handler (Fixes app closing instead of navigating back)
  useEffect(() => {
    let lastBackPress = 0;
    let backListenerHandle = null;

    const handleBackButton = async () => {
      const s = backStateRef.current;
      if (s.isAlarmModalOpen) {
        setIsAlarmModalOpen(false);
        return;
      }
      if (s.isGlobalCustomModalOpen) {
        setIsGlobalCustomModalOpen(false);
        return;
      }
      if (s.isProfileModalOpen) {
        setIsProfileModalOpen(false);
        return;
      }
      if (s.isViewSelectorOpen) {
        setIsViewSelectorOpen(false);
        return;
      }
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
    if (activeView === 'tasks-trash') return 'Lixeira';
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
            <Menu className="w-6 h-6 stroke-[2] text-neutral-200 hover:text-[#facc15] transition-colors" />
          </button>
          <h1 className="text-lg font-bold text-white tracking-tight truncate max-w-[270px]">
            {getHeaderTitle()}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Rank Shield & Level Shortcut (oculto na própria tela Escudo/Stats) */}
          {activeView !== 'stats' && (
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
          )}

          <button
            onClick={() => setIsSearchOpen(true)}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg active:bg-neutral-800"
            title="Pesquisar"
          >
            <Search className="w-5 h-5 text-neutral-300 hover:text-[#facc15] transition-colors" />
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
                setTimeout(requestNotificationPermission, 400);
                setTimeout(requestExactAlarmPermission, 900);
                setTimeout(requestFullScreenIntentPermission, 1500);
                setMissingPermissions(false);
              }}
              className="px-2.5 py-1 bg-[#facc15]/15 hover:bg-[#facc15]/25 border border-[#facc15]/50 text-[#facc15] font-bold rounded-[4px] text-[11px] shrink-0 transition-colors"
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
            <CalendarView
              store={store}
              onQuickCreateAt={(dateStr, startTime = '') => {
                setQuickAddPrefill({ date: dateStr, startTime });
                setIsQuickAddOpen(true);
              }}
            />
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

        {/* MOBILE BOTTOM NAVIGATION BAR (Aligned 5-col grid, flush minimalist '+' button, yellow only when active) */}
        <nav className="md:hidden grid grid-cols-5 items-center bg-[#000000] border-t border-[#18181c] py-1.5 pb-[max(0.55rem,env(safe-area-inset-bottom))] px-1 z-30 shrink-0">
          {/* Tab 1: Tarefas */}
          <button
            onClick={() => {
              store.setTaskViewLayout('list');
              setActiveView('tasks-today');
              setSelectedTaskId(null);
            }}
            className="w-full min-w-0 flex flex-col items-center justify-center py-0.5 active:scale-95 transition-transform"
            title="Tarefas de Hoje"
          >
            <div className={`w-7 h-7 rounded-[4px] flex items-center justify-center transition-colors border ${
              isTaskView && store.taskViewLayout !== 'kanban'
                ? 'bg-[#facc15]/15 border-[#facc15]/55 text-[#facc15]'
                : 'bg-transparent border-transparent text-neutral-400 hover:text-neutral-200'
            }`}>
              <CheckSquare className="w-4 h-4" />
            </div>
            <span className={`text-[10px] font-semibold mt-0.5 truncate max-w-full ${
              isTaskView && store.taskViewLayout !== 'kanban' ? 'text-[#facc15]' : 'text-neutral-500'
            }`}>
              Tarefas
            </span>
          </button>

          {/* Tab 2: Visualizar */}
          <button
            onClick={() => setIsViewSelectorOpen(true)}
            className="w-full min-w-0 flex flex-col items-center justify-center py-0.5 active:scale-95 transition-transform"
            title="Escolher Formato de Visualização"
          >
            <div className={`w-7 h-7 rounded-[4px] flex items-center justify-center transition-colors border ${
              activeView === 'calendar' || activeView === 'eisenhower' || activeView === 'habits' || store.taskViewLayout === 'kanban'
                ? 'bg-[#facc15]/15 border-[#facc15]/55 text-[#facc15]'
                : 'bg-transparent border-transparent text-neutral-400 hover:text-neutral-200'
            }`}>
              <CalendarDays className="w-4 h-4" />
            </div>
            <span className={`text-[10px] font-semibold mt-0.5 truncate max-w-full ${
              activeView === 'calendar' || activeView === 'eisenhower' || activeView === 'habits' || store.taskViewLayout === 'kanban'
                ? 'text-[#facc15]'
                : 'text-neutral-500'
            }`}>
              Visualizar
            </span>
          </button>

          {/* Center Primary CTA: minimalist flush centered '+' */}
          <div className="w-full min-w-0 flex items-center justify-center">
            <button
              onClick={() => {
                setQuickAddPrefill(null);
                setIsQuickAddOpen(true);
              }}
              className="w-9 h-9 rounded-full bg-[#16161a] hover:bg-[#1f1f24] active:scale-90 border border-white/25 hover:border-[#facc15]/60 text-neutral-100 flex items-center justify-center transition-all"
              title="Nova Tarefa"
            >
              <Plus className="w-4 h-4 stroke-[2.2]" />
            </button>
          </div>

          {/* Tab 4: Escudo */}
          <button
            onClick={() => {
              setActiveView('stats');
              setSelectedTaskId(null);
            }}
            className="w-full min-w-0 flex flex-col items-center justify-center py-0.5 active:scale-95 transition-transform"
            title="Seus Rankings & Escudos"
          >
            <div className={`w-7 h-7 rounded-[4px] flex items-center justify-center p-1 transition-colors border ${
              activeView === 'stats'
                ? 'bg-[#facc15]/15 border-[#facc15]/55'
                : 'bg-transparent border-transparent opacity-80'
            }`}>
              <RankShield2D tier={calculateGamification(state).currentRank.tier} size={18} showGlow={false} />
            </div>
            <span className={`text-[10px] font-semibold mt-0.5 truncate max-w-full ${activeView === 'stats' ? 'text-[#facc15]' : 'text-neutral-500'}`}>
              Escudo
            </span>
          </button>

          {/* Tab 5: Foco */}
          <button
            onClick={() => {
              setActiveView('pomodoro');
              setSelectedTaskId(null);
            }}
            className="w-full min-w-0 flex flex-col items-center justify-center py-0.5 active:scale-95 transition-transform"
            title="Foco Pomodoro"
          >
            <div className={`w-7 h-7 rounded-[4px] flex items-center justify-center transition-colors border ${
              activeView === 'pomodoro'
                ? 'bg-[#facc15]/15 border-[#facc15]/55 text-[#facc15]'
                : 'bg-transparent border-transparent text-neutral-400 hover:text-neutral-200'
            }`}>
              <Clock className="w-4 h-4" />
            </div>
            <span className={`text-[10px] font-semibold mt-0.5 truncate max-w-full ${activeView === 'pomodoro' ? 'text-[#facc15]' : 'text-neutral-500'}`}>
              Foco
            </span>
          </button>
        </nav>
      </main>

      {/* Global Quick Add Modal */}
      <GlobalQuickAddModal
        store={store}
        isOpen={isQuickAddOpen}
        onClose={() => {
          setIsQuickAddOpen(false);
          setQuickAddPrefill(null);
        }}
        initialDate={quickAddPrefill?.date || ''}
        initialStartTime={quickAddPrefill?.startTime || ''}
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
        triggeredTime={alarmActiveTask?.triggeredTime || ''}
        durationMinutes={state.settings?.durationMinutes ?? state.settings?.alarmDuration ?? 5}
        soundName={state.settings?.sound || 'radar'}
        customAudioName={customAudioInfo?.name || ''}
        onStopAlarm={handleStopAlarm}
        onSnoozeAlarm={handleSnoozeAlarm}
        onCompleteTask={handleCompleteAlarmTask}
      />

      {/* Android Alarm & Lockscreen Permission Onboarding Modal */}
      <AlarmPermissionModal />

      {/* View Format Selector Modal (Diário, Semanal, Mensal, Anual, Kanban, Matriz Eisenhower, Listas) */}
      <ViewFormatSelectorModal
        isOpen={isViewSelectorOpen}
        onClose={() => setIsViewSelectorOpen(false)}
        store={store}
        onOpenCustomRecurrence={() => setIsGlobalCustomModalOpen(true)}
      />

      {/* Global Personalizado Recurrence Modal (launched from ViewFormatSelectorModal) */}
      <CustomDatePickerModal
        isOpen={isGlobalCustomModalOpen}
        onClose={() => setIsGlobalCustomModalOpen(false)}
        initialMode={calendarViewMode || 'monthly'}
        initialDates={[getTodayYMD()]}
        allowTaskSelection={true}
        tasks={(state.tasks || []).filter(task => !task.deleted)}
        projects={state.projects}
        onApplyCustomSchedule={({ dates, times, pattern, taskAction, taskId, title, projectId, alarmEnabled, reminderOffset }) => {
          const alarmFields = {
            ...(alarmEnabled !== undefined ? { alarmEnabled } : {}),
            ...(reminderOffset !== undefined ? { reminderOffset } : {})
          };
          if (taskAction === 'existing' && taskId && updateTask) {
            updateTask(taskId, {
              recurringDates: dates,
              dueDate: dates[0] || '',
              recurringTimes: times,
              startTime: times[0] || '',
              recurrencePattern: pattern,
              ...alarmFields
            });
          } else if (title && addTasksForMultipleDates) {
            addTasksForMultipleDates(
              {
                title,
                projectId: projectId || 'inbox',
                dueDate: dates[0] || '',
                recurringTimes: times,
                startTime: times[0] || '',
                recurrencePattern: pattern,
                priority: 1,
                ...alarmFields
              },
              dates
            );
          }
          setActiveView('calendar');
        }}
      />

      {/* Gamification Floating XP & 3D Shield Rank Up Celebration */}
      <GamificationCelebration />
    </div>
  );
}
