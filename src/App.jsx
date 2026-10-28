import React, { useState, useEffect } from 'react';
import { useAppStore } from './store/useStore';
import Sidebar from './components/Sidebar';
import TaskView from './components/TaskView';
import CalendarView from './components/CalendarView';
import EisenhowerMatrix from './components/EisenhowerMatrix';
import HabitTracker from './components/HabitTracker';
import PomodoroTimer from './components/PomodoroTimer';
import ProductivityStats from './components/ProductivityStats';
import TickTickSyncModal from './components/TickTickSyncModal';
import GlobalQuickAddModal from './components/GlobalQuickAddModal';

export default function App() {
  const store = useAppStore();
  const { activeView, setActiveView, setSelectedTaskId } = store;

  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [activeTaskForPomodoro, setActiveTaskForPomodoro] = useState(null);

  // Request browser notification permissions on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't trigger shortcuts if user is typing in an input or textarea
      const tag = e.target.tagName.toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') {
        if (e.key === 'Escape') {
          e.target.blur();
          setIsQuickAddOpen(false);
          setIsSyncModalOpen(false);
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

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#0c0c0e] text-neutral-100 font-sans">
      {/* Navigation Sidebar */}
      <Sidebar
        store={store}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onOpenExportModal={() => setIsSyncModalOpen(true)}
      />

      {/* Main View Area */}
      <main className="flex-1 flex overflow-hidden bg-[#121215]">
        {isTaskView && (
          <TaskView
            store={store}
            onStartPomodoroForTask={handleStartPomodoroForTask}
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
      </main>

      {/* Global Quick Add Modal (Atalho Q) */}
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
    </div>
  );
}
