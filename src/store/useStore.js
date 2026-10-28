import { useState, useEffect } from 'react';
import { INITIAL_PROJECTS, INITIAL_TASKS, INITIAL_HABITS, INITIAL_POMODORO_SESSIONS } from './initialData';

const STORAGE_KEY = 'opentick_app_state_v2';

export function useAppStore() {
  const [state, setState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.projects && parsed.tasks) {
          return {
            ...parsed,
            settings: {
              theme: 'amoled',
              accentColor: '#4c82f7',
              sound: 'chime',
              volume: 0.8,
              vibration: true,
              timeFormat: '24h',
              startOfWeek: 'domingo',
              showWeekNumbers: false,
              confirmExit: true,
              defaultDueDate: 'today',
              delayedSection: 'top',
              ...parsed.settings
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
      settings: {
        theme: 'amoled',
        accentColor: '#4c82f7',
        sound: 'chime',
        volume: 0.8,
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

  const [activeView, setActiveView] = useState('tasks-today'); // 'tasks-inbox', 'tasks-today', 'tasks-completed', 'calendar', 'eisenhower', 'habits', 'pomodoro', 'stats', 'project-[id]'
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
  }, [state]);

  // Tasks actions
  const addTask = (taskData) => {
    const newTask = {
      id: 'task-' + Date.now(),
      title: taskData.title,
      description: taskData.description || '',
      projectId: taskData.projectId || 'inbox',
      priority: taskData.priority !== undefined ? taskData.priority : 0,
      urgent: taskData.urgent ?? false,
      important: taskData.important ?? false,
      dueDate: taskData.dueDate || '',
      startTime: taskData.startTime || '',
      endTime: taskData.endTime || '',
      completed: false,
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

  // Add identical task across multiple specific dates (User request: e.g. days 21, 23, 27, 28, 29)
  const addTasksForMultipleDates = (taskData, datesList) => {
    if (!datesList || datesList.length === 0) {
      return [addTask(taskData)];
    }
    const newTasks = datesList.map((dStr, idx) => ({
      id: 'task-' + Date.now() + '-' + idx,
      title: taskData.title,
      description: taskData.description || '',
      projectId: taskData.projectId || 'inbox',
      priority: taskData.priority !== undefined ? taskData.priority : 0,
      urgent: taskData.urgent ?? false,
      important: taskData.important ?? false,
      dueDate: dStr,
      startTime: taskData.startTime || '',
      endTime: taskData.endTime || '',
      completed: false,
      kanbanStatus: 'todo',
      tags: taskData.tags || [],
      subtasks: taskData.subtasks ? JSON.parse(JSON.stringify(taskData.subtasks)) : [],
      createdAt: new Date().toISOString()
    }));

    setState(prev => ({
      ...prev,
      tasks: [...newTasks, ...prev.tasks]
    }));
    return newTasks;
  };

  const updateTask = (id, updates) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => {
        if (t.id === id) {
          const updated = { ...t, ...updates };
          // Keep kanbanStatus and completed in sync
          if (updates.completed !== undefined) {
            updated.kanbanStatus = updates.completed ? 'done' : 'todo';
          } else if (updates.kanbanStatus !== undefined) {
            updated.completed = updates.kanbanStatus === 'done';
          }
          return updated;
        }
        return t;
      })
    }));
  };

  const toggleTaskCompleted = (id) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => {
        if (t.id === id) {
          const nextCompleted = !t.completed;
          return {
            ...t,
            completed: nextCompleted,
            kanbanStatus: nextCompleted ? 'done' : 'todo'
          };
        }
        return t;
      })
    }));
  };

  const deleteTask = (id) => {
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
      color: habitData.color || '#3b82f6',
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
        if (h.id === habitId) {
          const current = !!h.checkIns[dateStr];
          const updatedCheckIns = { ...h.checkIns, [dateStr]: !current };
          
          let streak = 0;
          const today = new Date();
          for (let i = 0; i < 365; i++) {
            const d = new Date(today.getTime() - i * 86400000);
            const str = d.toISOString().split('T')[0];
            if (updatedCheckIns[str]) {
              streak++;
            } else if (i > 0) {
              break;
            }
          }

          const best = Math.max(h.bestStreak, streak);
          return {
            ...h,
            checkIns: updatedCheckIns,
            currentStreak: streak,
            bestStreak: best
          };
        }
        return h;
      })
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
      color: projectData.color || '#3b82f6',
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
    if (id === 'inbox') return; // Cannot delete default inbox
    setState(prev => ({
      ...prev,
      projects: prev.projects.filter(p => p.id !== id),
      tasks: prev.tasks.map(t => t.projectId === id ? { ...t, projectId: 'inbox' } : t)
    }));
  };

  // Settings Updater
  const updateSettings = (updates) => {
    setState(prev => ({
      ...prev,
      settings: { ...prev.settings, ...updates }
    }));
  };

  // TickTick API Sync / Import
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
        color: p.color || '#3b82f6',
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
                completed: t.status === 2,
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
      setState(parsed);
      return true;
    } catch (e) {
      return false;
    }
  };

  return {
    state,
    activeView,
    setActiveView,
    selectedTaskId,
    setSelectedTaskId,
    addTask,
    addTasksForMultipleDates,
    updateTask,
    toggleTaskCompleted,
    deleteTask,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    addHabit,
    toggleHabitCheckIn,
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
