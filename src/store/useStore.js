import { useState, useEffect } from 'react';
import { INITIAL_PROJECTS, INITIAL_TASKS, INITIAL_HABITS, INITIAL_POMODORO_SESSIONS } from './initialData';

const STORAGE_KEY = 'opentick_app_state_v1';

export function useAppStore() {
  const [state, setState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load local storage', e);
    }
    return {
      projects: INITIAL_PROJECTS,
      tasks: INITIAL_TASKS,
      habits: INITIAL_HABITS,
      pomodoroSessions: INITIAL_POMODORO_SESSIONS,
      ticktickConfig: {
        clientId: '1VnPwbqL2WaCGV713q',
        accessToken: ''
      }
    };
  });

  const [activeView, setActiveView] = useState('tasks-today'); // 'tasks-inbox', 'tasks-today', 'tasks-next7', 'calendar', 'eisenhower', 'habits', 'pomodoro', 'stats', 'project-[id]'
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
      dueDate: taskData.dueDate || new Date().toISOString().split('T')[0],
      startTime: taskData.startTime || '',
      endTime: taskData.endTime || '',
      completed: false,
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

  const updateTask = (id, updates) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === id ? { ...t, ...updates } : t)
    }));
  };

  const toggleTaskCompleted = (id) => {
    setState(prev => ({
      ...prev,
      tasks: prev.tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t)
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

  // Eisenhower Quadrant Setter
  const setTaskQuadrant = (taskId, urgent, important) => {
    updateTask(taskId, { urgent, important });
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
          
          // Recompute current streak
          let streak = 0;
          let d = new Date();
          while (true) {
            const ds = d.toISOString().split('T')[0];
            if (updatedCheckIns[ds]) {
              streak++;
              d.setDate(d.getDate() - 1);
            } else if (ds === new Date().toISOString().split('T')[0]) {
              // check if yesterday was done
              d.setDate(d.getDate() - 1);
              const yesterdayStr = d.toISOString().split('T')[0];
              if (updatedCheckIns[yesterdayStr]) {
                continue;
              } else {
                break;
              }
            } else {
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
  };

  const deleteProject = (id) => {
    if (id === 'inbox') return; // Cannot delete default inbox
    setState(prev => ({
      ...prev,
      projects: prev.projects.filter(p => p.id !== id),
      tasks: prev.tasks.map(t => t.projectId === id ? { ...t, projectId: 'inbox' } : t)
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

      // Fetch tasks for each project
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

  // Export / Import JSON
  const exportData = () => {
    return JSON.stringify(state, null, 2);
  };

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
    updateTask,
    toggleTaskCompleted,
    deleteTask,
    addSubtask,
    toggleSubtask,
    deleteSubtask,
    setTaskQuadrant,
    addHabit,
    toggleHabitCheckIn,
    deleteHabit,
    addPomodoroSession,
    addProject,
    deleteProject,
    setTickTickConfig,
    importFromTickTick,
    exportData,
    importData
  };
}
