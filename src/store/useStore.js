import { useState, useEffect } from 'react';
import { INITIAL_PROJECTS, INITIAL_TASKS, INITIAL_HABITS, INITIAL_POMODORO_SESSIONS } from './initialData';
import { calculateGamification } from '../utils/gamification';
import { clearAlarmDismissed, cancelNativeAlarm } from '../utils/nativeAlarm';
import { getTodayYMD, formatDateYMD } from '../utils/taskSchedule';

const STORAGE_KEY = 'opentick_app_state_v3';

export function useAppStore() {
  const [state, setState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.projects && parsed.tasks) {
          // Deduplicate strictly by unique task id so distinct recurring/same-named tasks are preserved
          const uniqueTasks = [];
          const seen = new Set();
          for (const t of parsed.tasks) {
            if (!t || !t.id) continue;
            if (!seen.has(t.id)) {
              seen.add(t.id);
              uniqueTasks.push(t);
            }
          }

          return {
            ...parsed,
            tasks: uniqueTasks,
            userProfile: {
              name: 'Mathx',
              title: 'Mestre da Produtividade',
              avatar: '🐺',
              avatarType: 'emoji',
              coverPreset: 'rain_glass',
              coverImage: null,
              ...(parsed.userProfile || {})
            },
            bonusXp: parsed.bonusXp ?? 450,
            settings: {
              theme: 'amoled',
              accentColor: '#facc15',
              sound: 'radar',
              volume: 0.9,
              durationMinutes: 5,
              alarmMode: 'continuous',
              reminderOffset: 0,
              vibration: true,
              timeFormat: '24h',
              startOfWeek: 'domingo',
              showWeekNumbers: false,
              confirmExit: true,
              defaultDueDate: 'today',
              delayedSection: 'top',
              ...(parsed.settings || {})
            }
          };
        }
      }
    } catch (e) {
      console.warn('Failed to load local storage', e);
    }
    return {
      projects: INITIAL_PROJECTS,
      tasks: INITIAL_TASKS,
      habits: INITIAL_HABITS,
      pomodoroSessions: INITIAL_POMODORO_SESSIONS,
      userProfile: {
        name: 'Mathx',
        title: 'Mestre da Produtividade',
        avatar: '🐺',
        avatarType: 'emoji',
        coverPreset: 'rain_glass',
        coverImage: null
      },
      bonusXp: 450,
      settings: {
        theme: 'amoled',
        accentColor: '#facc15',
        sound: 'radar',
        volume: 0.9,
        durationMinutes: 5,
        alarmMode: 'continuous',
        reminderOffset: 0,
        vibration: true,
        timeFormat: '24h',
        startOfWeek: 'domingo',
        showWeekNumbers: false,
        confirmExit: true,
        defaultDueDate: 'today',
        delayedSection: 'top'
      },
      ticktickConfig: {
        clientId: '1VnPwbqL2WaCGV713q',
        accessToken: ''
      }
    };
  });

  const [activeView, setActiveView] = useState('tasks-today'); // 'tasks-inbox', 'tasks-today', 'tasks-completed', 'tasks-trash', 'calendar', 'eisenhower', 'habits', 'pomodoro', 'stats', 'project-[id]'
  const [selectedTaskId, setSelectedTaskId] = useState(null);
  const [calendarViewMode, setCalendarViewMode] = useState('month'); // 'day', '3days', 'week', 'month', 'year', 'list'
  const [taskViewLayout, setTaskViewLayout] = useState('list'); // 'list' or 'kanban'

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }, [state]);

  // Tasks actions
  const addTask = (taskData) => {
    const recurringDates = [...new Set(
      taskData.recurringDates && taskData.recurringDates.length > 0
        ? taskData.recurringDates
        : (taskData.dueDate ? [taskData.dueDate] : [])
    )].filter(Boolean).sort();
    const recurringTimes = [...new Set(
      taskData.recurringTimes && taskData.recurringTimes.length > 0
        ? taskData.recurringTimes
        : (taskData.startTime ? [taskData.startTime] : [])
    )].filter(Boolean).sort();

    const newTask = {
      id: 'task-' + Date.now(),
      title: taskData.title,
      description: taskData.description || '',
      projectId: taskData.projectId || 'inbox',
      priority: taskData.priority !== undefined ? taskData.priority : 0,
      urgent: taskData.urgent ?? false,
      important: taskData.important ?? false,
      dueDate: taskData.dueDate || recurringDates[0] || '',
      recurringDates,
      startTime: recurringTimes[0] || '',
      recurringTimes,
      recurrencePattern: taskData.recurrencePattern || null,
      endTime: taskData.endTime || '',
      alarmEnabled: taskData.alarmEnabled !== false,
      reminderOffset: taskData.reminderOffset ?? 0,
      alarmMode: taskData.alarmMode || '',
      alarmSound: taskData.alarmSound || '',
      completed: false,
      deleted: false,
      deletedAt: null,
      kanbanStatus: taskData.kanbanStatus || 'todo', // 'todo', 'in_progress', 'done'
      tags: taskData.tags || [],
      subtasks: taskData.subtasks || [],
      createdAt: new Date().toISOString()
    };

    setState(prev => ({
      ...prev,
      tasks: [newTask, ...prev.tasks]
    }));
    return newTask;
  };

  // Create ONE single task with multiple scheduled dates
  const addTasksForMultipleDates = (taskData, datesList) => {
    const dates = [...new Set(
      datesList && datesList.length > 0 ? datesList : (taskData.dueDate ? [taskData.dueDate] : [])
    )].filter(Boolean).sort();
    const times = [...new Set(
      taskData.recurringTimes && taskData.recurringTimes.length > 0
        ? taskData.recurringTimes
        : (taskData.startTime ? [taskData.startTime] : [])
    )].filter(Boolean).sort();

    const newTask = {
      id: 'task-' + Date.now(),
      title: taskData.title,
      description: taskData.description || '',
      projectId: taskData.projectId || 'inbox',
      priority: taskData.priority !== undefined ? taskData.priority : 0,
      urgent: taskData.urgent ?? false,
      important: taskData.important ?? false,
      dueDate: dates[0] || '',
      recurringDates: dates,
      startTime: times[0] || '',
      recurringTimes: times,
      recurrencePattern: taskData.recurrencePattern || null,
      endTime: taskData.endTime || '',
      alarmEnabled: taskData.alarmEnabled !== false,
      reminderOffset: taskData.reminderOffset ?? 0,
      alarmMode: taskData.alarmMode || '',
      alarmSound: taskData.alarmSound || '',
      completed: false,
      deleted: false,
      deletedAt: null,
      kanbanStatus: 'todo',
      tags: taskData.tags || [],
      subtasks: taskData.subtasks ? JSON.parse(JSON.stringify(taskData.subtasks)) : [],
      createdAt: new Date().toISOString()
    };

    setState(prev => ({
      ...prev,
      tasks: [newTask, ...prev.tasks]
    }));
    return newTask;
  };

  const updateTask = (id, updates) => {
    if (
      updates.startTime !== undefined ||
      updates.dueDate !== undefined ||
      updates.recurringDates !== undefined ||
      updates.recurringTimes !== undefined ||
      updates.reminderOffset !== undefined ||
      updates.alarmEnabled === true
    ) {
      clearAlarmDismissed(id);
    }
    if (updates.alarmEnabled === false || updates.completed === true || updates.deleted === true) {
      cancelNativeAlarm(id);
    }

    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => {
        if (t.id !== id) return t;
        const updated = { ...t, ...updates };
        if (updates.completed !== undefined) {
          updated.kanbanStatus = updates.completed ? 'done' : 'todo';
        } else if (updates.kanbanStatus !== undefined) {
          updated.completed = updates.kanbanStatus === 'done';
        }

        // Sync recurringDates <-> dueDate
        if (updates.recurringDates !== undefined) {
          const cleanDates = [...new Set(updates.recurringDates)].filter(Boolean).sort();
          updated.recurringDates = cleanDates;
          if (updates.dueDate === undefined) {
            updated.dueDate = cleanDates[0] || '';
          }
        } else if (updates.dueDate !== undefined) {
          if (!updated.recurringDates || updated.recurringDates.length <= 1) {
            updated.recurringDates = updates.dueDate ? [updates.dueDate] : [];
          }
        }

        // Sync recurringTimes <-> startTime
        if (updates.recurringTimes !== undefined) {
          const cleanTimes = [...new Set(updates.recurringTimes)].filter(Boolean).sort();
          updated.recurringTimes = cleanTimes;
          if (updates.startTime === undefined) {
            updated.startTime = cleanTimes[0] || '';
          }
        } else if (updates.startTime !== undefined) {
          const prevTimes = Array.isArray(t.recurringTimes) ? t.recurringTimes.filter(Boolean) : [];
          if (prevTimes.length <= 1) {
            updated.recurringTimes = updates.startTime ? [updates.startTime] : [];
          } else if (updates.startTime) {
            updated.recurringTimes = [...new Set([updates.startTime, ...prevTimes.slice(1)])].filter(Boolean).sort();
          } else {
            updated.recurringTimes = prevTimes.slice(1);
            updated.startTime = updated.recurringTimes[0] || '';
          }
        }

        return updated;
      })
    }));
  };

  const toggleTaskCompleted = (id) => {
    const targetTask = state.tasks.find(t => t.id === id);
    if (!targetTask) return;

    const nextCompleted = !targetTask.completed;
    const todayStr = getTodayYMD();

    const prevGamification = calculateGamification(state);
    const prevTier = prevGamification.currentRank.tier;

    const nextTasks = state.tasks.map(t => {
      if (t.id !== id) return t;
      return {
        ...t,
        completed: nextCompleted,
        kanbanStatus: nextCompleted ? 'done' : 'todo',
        checkIns: {
          ...(t.checkIns || {}),
          [todayStr]: nextCompleted
        }
      };
    });

    if (nextCompleted) {
      cancelNativeAlarm(id);
    } else {
      clearAlarmDismissed(id);
    }

    const nextState = { ...state, tasks: nextTasks };
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => {
        if (t.id !== id) return t;
        return {
          ...t,
          completed: nextCompleted,
          kanbanStatus: nextCompleted ? 'done' : 'todo',
          checkIns: {
            ...(t.checkIns || {}),
            [todayStr]: nextCompleted
          }
        };
      })
    }));

    if (nextCompleted) {
      const nextGamification = calculateGamification(nextState);
      const nextTier = nextGamification.currentRank.tier;
      const gainedXp = targetTask.priority === 3 ? 100 : 60;
      const isRankUp = prevTier !== nextTier;

      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('opentickTaskCompleted', {
          detail: {
            taskId: id,
            taskTitle: targetTask.title || 'Tarefa Concluída',
            xpGained: gainedXp,
            isRankUp,
            oldRank: prevGamification.currentRank,
            newRank: nextGamification.currentRank,
            level: nextGamification.level,
            totalXp: nextGamification.totalXp
          }
        }));
      }, 0);
    }
  };

  const moveTaskToTrash = (id) => {
    cancelNativeAlarm(id);
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t =>
        t.id === id ? { ...t, deleted: true, deletedAt: new Date().toISOString() } : t
      )
    }));
    if (selectedTaskId === id) setSelectedTaskId(null);
  };

  const restoreTask = (id) => {
    clearAlarmDismissed(id);
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t =>
        t.id === id ? { ...t, deleted: false, deletedAt: null } : t
      )
    }));
  };

  const emptyTrash = () => {
    const trashed = state.tasks.filter(t => t.deleted);
    trashed.forEach(t => cancelNativeAlarm(t.id));
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.filter(t => !t.deleted)
    }));
    if (trashed.some(t => t.id === selectedTaskId)) {
      setSelectedTaskId(null);
    }
  };

  const deleteTask = (id) => {
    cancelNativeAlarm(id);
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.filter(t => t.id !== id)
    }));
    if (selectedTaskId === id) setSelectedTaskId(null);
  };

  const addSubtask = (taskId, title) => {
    const newSub = { id: 'st-' + Date.now(), title, completed: false };
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => {
        if (t.id === taskId) {
          return { ...t, subtasks: [...(t.subtasks || []), newSub] };
        }
        return t;
      })
    }));
  };

  const toggleSubtask = (taskId, subtaskId) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => {
        if (t.id === taskId) {
          return {
            ...t,
            subtasks: t.subtasks.map(s => s.id === subtaskId ? { ...s, completed: !s.completed } : s)
          };
        }
        return t;
      })
    }));
  };

  const deleteSubtask = (taskId, subtaskId) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => {
        if (t.id === taskId) {
          return {
            ...t,
            subtasks: t.subtasks.filter(s => s.id !== subtaskId)
          };
        }
        return t;
      })
    }));
  };

  // Habit Actions
  const addHabit = (habitData) => {
    const newHabit = {
      id: 'habit-' + Date.now(),
      name: habitData.name,
      icon: habitData.icon || 'Flame',
      color: habitData.color || '#facc15',
      frequency: habitData.frequency || 'daily',
      targetDays: habitData.targetDays || [0, 1, 2, 3, 4, 5, 6],
      currentStreak: 0,
      bestStreak: 0,
      checkIns: {}
    };
    setState(prev => ({ ...prev, habits: [...prev.habits, newHabit] }));
  };

  const toggleHabitCheckIn = (habitId, dateStr) => {
    setState(prev => ({
      ...prev,
      habits: prev.habits.map(h => {
        if (h.id !== habitId) return h;
        const current = !!h.checkIns?.[dateStr];
        const updatedCheckIns = { ...(h.checkIns || {}), [dateStr]: !current };

        let streak = 0;
        const today = new Date();
        for (let i = 0; i < 365; i++) {
          const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
          const str = formatDateYMD(d);
          if (updatedCheckIns[str]) {
            streak++;
          } else if (i > 0) {
            break;
          }
        }

        const best = Math.max(h.bestStreak || 0, streak);
        return {
          ...h,
          checkIns: updatedCheckIns,
          currentStreak: streak,
          bestStreak: best
        };
      })
    }));
  };

  const toggleTaskCheckIn = (taskId, dateStr) => {
    const todayStr = getTodayYMD();
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => {
        if (t.id !== taskId) return t;
        const current = !!t.checkIns?.[dateStr];
        const nextVal = !current;
        const nextCheckIns = { ...(t.checkIns || {}), [dateStr]: nextVal };
        return {
          ...t,
          checkIns: nextCheckIns,
          ...(dateStr === todayStr ? {
            completed: nextVal,
            kanbanStatus: nextVal ? 'done' : 'todo'
          } : {})
        };
      })
    }));
  };

  const updateHabit = (habitId, updates) => {
    setState(prev => ({
      ...prev,
      habits: prev.habits.map(h => h.id === habitId ? { ...h, ...updates } : h)
    }));
  };

  const deleteHabit = (habitId) => {
    setState(prev => ({ ...prev, habits: prev.habits.filter(h => h.id !== habitId) }));
  };

  // Pomodoro Sessions
  const addPomodoroSession = (session) => {
    const newSession = {
      id: 'pomo-' + Date.now(),
      taskId: session.taskId || null,
      taskTitle: session.taskTitle || 'Foco Geral',
      durationMinutes: session.durationMinutes || 25,
      completedAt: new Date().toISOString()
    };
    setState(prev => ({
      ...prev,
      pomodoroSessions: [newSession, ...prev.pomodoroSessions]
    }));
  };

  // Projects CRUD
  const addProject = (projectData) => {
    const newProj = {
      id: 'proj-' + Date.now(),
      name: projectData.name,
      color: projectData.color || '#facc15',
      icon: projectData.icon || 'Folder'
    };
    setState(prev => ({ ...prev, projects: [...prev.projects, newProj] }));
    return newProj;
  };

  const updateProject = (id, updates) => {
    setState(prev => ({
      ...prev,
      projects: prev.projects.map(p => p.id === id ? { ...p, ...updates } : p)
    }));
  };

  const deleteProject = (id) => {
    if (id === 'inbox') return;
    setState(prev => ({
      ...prev,
      projects: prev.projects.filter(p => p.id !== id),
      tasks: prev.tasks.map(t => t.projectId === id ? { ...t, projectId: 'inbox' } : t)
    }));
  };

  const updateSettings = (updates) => {
    setState(prev => ({
      ...prev,
      settings: { ...prev.settings, ...updates }
    }));
  };

  const setTickTickConfig = (cfg) => {
    setState(prev => ({ ...prev, ticktickConfig: { ...prev.ticktickConfig, ...cfg } }));
  };

  const importFromTickTick = async (token) => {
    try {
      const res = await fetch('https://api.ticktick.com/open/v1/project', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Falha na autenticação da API do TickTick (Código ' + res.status + ')');
      const projects = await res.json();

      const newProjects = projects.map(p => ({
        id: 'tt-proj-' + p.id,
        name: p.name,
        color: p.color || '#facc15',
        icon: 'Folder'
      }));

      let allTasks = [];
      for (const p of projects) {
        try {
          const taskRes = await fetch(`https://api.ticktick.com/open/v1/project/${p.id}/data`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (taskRes.ok) {
            const data = await taskRes.json();
            if (data.tasks) {
              const mapped = data.tasks.map(t => ({
                id: 'tt-task-' + t.id,
                title: t.title,
                description: t.content || '',
                projectId: 'tt-proj-' + p.id,
                priority: t.priority || 0,
                urgent: t.priority === 3 || t.priority === 5,
                important: t.priority >= 2,
                dueDate: t.dueDate ? t.dueDate.split('T')[0] : '',
                recurringDates: t.dueDate ? [t.dueDate.split('T')[0]] : [],
                alarmEnabled: true,
                reminderOffset: 0,
                completed: t.status === 2,
                deleted: false,
                deletedAt: null,
                kanbanStatus: t.status === 2 ? 'done' : 'todo',
                tags: t.tags || [],
                subtasks: (t.items || []).map(i => ({ id: 'tt-sub-' + i.id, title: i.title, completed: i.status === 1 })),
                createdAt: t.createdTime || new Date().toISOString()
              }));
              allTasks = [...allTasks, ...mapped];
            }
          }
        } catch (err) {
          console.warn('Erro ao importar projeto ' + p.name, err);
        }
      }

      setState(prev => ({
        ...prev,
        projects: [...prev.projects, ...newProjects],
        tasks: [...prev.tasks, ...allTasks]
      }));

      return { success: true, projectsCount: newProjects.length, tasksCount: allTasks.length };
    } catch (e) {
      return { success: false, error: e.message };
    }
  };

  const exportData = () => JSON.stringify(state, null, 2);

  const importData = (jsonString) => {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed || typeof parsed !== 'object' || !Array.isArray(parsed.tasks) || !Array.isArray(parsed.projects)) {
        return false;
      }
      setState(parsed);
      return true;
    } catch (e) {
      return false;
    }
  };

  const updateUserProfile = (updates) => {
    setState(prev => ({
      ...prev,
      userProfile: {
        ...(prev.userProfile || {
          name: 'Mathx',
          title: 'Mestre da Produtividade',
          avatar: '🐺',
          avatarType: 'emoji',
          coverPreset: 'rain_glass',
          coverImage: null
        }),
        ...updates
      }
    }));
  };

  const addBonusXp = (amount = 50) => {
    setState(prev => ({
      ...prev,
      bonusXp: (prev.bonusXp || 0) + amount
    }));
  };

  return {
    state,
    activeView,
    setActiveView,
    selectedTaskId,
    setSelectedTaskId,
    calendarViewMode,
    setCalendarViewMode,
    taskViewLayout,
    setTaskViewLayout,
    updateUserProfile,
    addBonusXp,
    addTask,
    addTasksForMultipleDates,
    updateTask,
    toggleTaskCompleted,
    toggleTaskCheckIn,
    moveTaskToTrash,
    restoreTask,
    emptyTrash,
    deleteTask,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    addHabit,
    toggleHabitCheckIn,
    updateHabit,
    deleteHabit,
    addPomodoroSession,
    addProject,
    updateProject,
    deleteProject,
    updateSettings,
    setTickTickConfig,
    importFromTickTick,
    exportData,
    importData
  };
}
