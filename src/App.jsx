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
import { soundManager } from './utils/audio';
import { getCustomAudioFile } from './utils/audioStorage';
import { syncTasksToNativeAlarmManager, stopNativeAlarm } from './utils/nativeAlarm';
import { 
  Menu, 
  CheckSquare, 
  Calendar as CalendarIcon, 
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
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [activeTaskForPomodoro, setActiveTaskForPomodoro] = useState(null);

  // Active Continuous Alarm State
  const [alarmActiveTask, setAlarmActiveTask] = useState(null);
  const [isAlarmModalOpen, setIsAlarmModalOpen] = useState(false);
  const [customAudioInfo, setCustomAudioInfo] = useState(null);
  const triggeredAlarmsRef = useRef(new Set());

  const today = new Date();
  const currentDayNumber = today.getDate();

  // Request browser notification permissions on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
    // Pre-load custom audio info
    getCustomAudioFile().then(record => {
      if (record) setCustomAudioInfo(record);
    });
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

    window.addEventListener('nativeAlarmTriggered', handleNativeAlarm);
    return () => window.removeEventListener('nativeAlarmTriggered', handleNativeAlarm);
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

        const isToday = t.dueDate === todayStr || (t.recurringDates && t.recurringDates.includes(todayStr));
        const isTimeMatch = t.startTime === currentHHMM;

        if (isToday && isTimeMatch) {
          const alarmKey = `${t.id}_${todayStr}_${currentHHMM}`;
          if (!triggeredAlarmsRef.current.has(alarmKey)) {
            triggeredAlarmsRef.current.add(alarmKey);

            // Fetch custom audio if configured
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

            setAlarmActiveTask(t);
            setIsAlarmModalOpen(true);

            // Native / Browser notification
            if ('Notification' in window && Notification.permission === 'granted') {
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
    soundManager.stopContinuousAlarm();
    stopNativeAlarm();
    setIsAlarmModalOpen(false);
    setAlarmActiveTask(null);
  };

  const handleSnoozeAlarm = () => {
    soundManager.stopContinuousAlarm();
    stopNativeAlarm();
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

  // Native Android Hardware / Virtual Back Button Handler (Fixes app closing instead of navigating back)
  useEffect(() => {
    let lastBackPress = 0;

    const handleBackButton = async () => {
      // 1. Close Search Modal
      if (isSearchOpen) {
        setIsSearchOpen(false);
        return;
      }
      // 2. Close Settings Modal
      if (isSettingsOpen) {
        setIsSettingsOpen(false);
        return;
      }
      // 3. Close Sync Modal
      if (isSyncModalOpen) {
        setIsSyncModalOpen(false);
        return;
      }
      // 4. Close Quick Add Modal
      if (isQuickAddOpen) {
        setIsQuickAddOpen(false);
        return;
      }
      // 5. Close Mobile Drawer
      if (isMobileDrawerOpen) {
        setIsMobileDrawerOpen(false);
        return;
      }
      // 6. Close Task Details Sheet
      if (selectedTaskId) {
        setSelectedTaskId(null);
        return;
      }
      // 7. If on another screen, navigate back to 'tasks-today'
      if (activeView !== 'tasks-today') {
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

    let backListenerHandle = null;
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
  }, [
    isSearchOpen, 
    isSettingsOpen, 
    isSyncModalOpen, 
    isQuickAddOpen, 
    isMobileDrawerOpen, 
    selectedTaskId, 
    activeView, 
    setActiveView, 
    setSelectedTaskId
  ]);

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
            <Menu className="w-6 h-6 stroke-[2]" />
          </button>
          <h1 className="text-lg font-bold text-white tracking-tight truncate max-w-[270px]">
            {getHeaderTitle()}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg active:bg-neutral-800"
            title="Pesquisar"
          >
            <Search className="w-5 h-5" />
          </button>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg active:bg-neutral-800"
            title="Configurações"
          >
            <MoreVertical className="w-5 h-5" />
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

        {/* MOBILE FLOATING ACTION BUTTON (FAB: Botão Laranja Circular com +) */}
        <button
          onClick={() => setIsQuickAddOpen(true)}
          className="md:hidden fixed bottom-20 right-4 w-14 h-14 bg-[#ff6b00] hover:bg-[#ea580c] active:scale-95 text-white rounded-full shadow-[0_0_20px_rgba(255,107,0,0.5)] flex items-center justify-center z-30 transition-transform"
          title="Nova Tarefa (Rápida)"
        >
          <Plus className="w-7 h-7 stroke-[2.5]" />
        </button>

        {/* MOBILE BOTTOM NAVIGATION BAR (Exact TickTick Android Bottom Bar) */}
        <nav className="md:hidden flex items-center justify-around bg-[#000000] border-t border-[#18181c] py-2 px-1 z-30 shrink-0">
          {/* Tab 1: Checkbox / Tarefas */}
          <button
            onClick={() => {
              setActiveView('tasks-today');
              setSelectedTaskId(null);
            }}
            className="flex items-center justify-center p-2 rounded-xl"
            title="Tarefas"
          >
            {isTaskView ? (
              <div className="w-7 h-7 rounded-lg bg-[#ff6b00] flex items-center justify-center shadow-md">
                <CheckSquare className="w-5 h-5 text-white stroke-[2.5]" />
              </div>
            ) : (
              <div className="w-7 h-7 rounded-lg border border-neutral-600 flex items-center justify-center text-neutral-500">
                <CheckSquare className="w-4 h-4" />
              </div>
            )}
          </button>

          {/* Tab 2: Calendário with Current Day Number (e.g. 28) */}
          <button
            onClick={() => {
              setActiveView('calendar');
              setSelectedTaskId(null);
            }}
            className="flex items-center justify-center p-2 rounded-xl"
            title="Calendário"
          >
            {activeView === 'calendar' ? (
              <div className="w-7 h-7 rounded-lg bg-[#ff6b00] flex items-center justify-center text-white font-black text-xs shadow-md">
                {currentDayNumber}
              </div>
            ) : (
              <div className="w-7 h-7 rounded-lg border border-neutral-600 flex items-center justify-center text-neutral-400 font-bold text-xs">
                {currentDayNumber}
              </div>
            )}
          </button>

          {/* Tab 3: Matriz / Hábitos */}
          <button
            onClick={() => {
              if (activeView === 'eisenhower') {
                setActiveView('habits');
              } else {
                setActiveView('eisenhower');
              }
              setSelectedTaskId(null);
            }}
            className="flex items-center justify-center p-2 rounded-xl"
            title="Matriz & Hábitos"
          >
            {activeView === 'eisenhower' || activeView === 'habits' ? (
              <div className="w-7 h-7 rounded-lg bg-[#ff6b00] flex items-center justify-center shadow-md">
                <Grid className="w-4 h-4 text-white stroke-[2.5]" />
              </div>
            ) : (
              <div className="w-7 h-7 rounded-full bg-[#1c1c1e] flex items-center justify-center text-neutral-400 font-bold text-xs">
                L
              </div>
            )}
          </button>

          {/* Tab 4: Pesquisar */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center justify-center p-2 rounded-xl text-neutral-400 hover:text-white"
            title="Pesquisar"
          >
            <Search className="w-6 h-6 stroke-[1.8]" />
          </button>

          {/* Tab 5: Mais (•••) */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center justify-center p-2 rounded-xl text-neutral-400 hover:text-white"
            title="Mais Opções & Configurações"
          >
            <MoreHorizontal className="w-6 h-6 stroke-[1.8]" />
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
    </div>
  );
}
