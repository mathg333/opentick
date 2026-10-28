const today = new Date().toISOString().split('T')[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
const inTwoDays = new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0];

export const INITIAL_PROJECTS = [
  { id: 'inbox', name: 'Caixa de Entrada', color: '#3b82f6', isDefault: true, icon: 'Inbox' },
  { id: 'work', name: 'Trabalho / Projetos', color: '#8b5cf6', icon: 'Briefcase' },
  { id: 'personal', name: 'Pessoal & Casa', color: '#10b981', icon: 'Home' },
  { id: 'study', name: 'Estudos & Tech', color: '#f59e0b', icon: 'BookOpen' }
];

export const INITIAL_TASKS = [
  {
    id: 't-1',
    title: 'Lançar versão gratuita ilimitada do TickTick (OpenTick)',
    description: 'Testar todos os recursos premium: Calendário, Matriz de Eisenhower, Hábitos e Pomodoro.',
    projectId: 'work',
    priority: 3, // 0: None, 1: Low, 2: Medium, 3: High
    urgent: true,
    important: true,
    dueDate: today,
    startTime: '09:00',
    endTime: '11:00',
    completed: false,
    tags: ['dev', 'produtividade'],
    subtasks: [
      { id: 'st-1', title: 'Verificar conexão com a API do TickTick', completed: true },
      { id: 'st-2', title: 'Implementar visualizador de Calendário e Time-Blocking', completed: true },
      { id: 'st-3', title: 'Configurar Matriz de Eisenhower com 4 quadrantes', completed: true },
      { id: 'st-4', title: 'Adicionar Habit Tracker com streaks infinitos', completed: false }
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: 't-2',
    title: 'Planejar arquitetura de sincronização Supabase / SQLite',
    description: 'Definir sincronização offline-first para acessar as tarefas do celular e do desktop.',
    projectId: 'study',
    priority: 2,
    urgent: false,
    important: true,
    dueDate: tomorrow,
    startTime: '14:00',
    endTime: '15:30',
    completed: false,
    tags: ['arquitetura', 'sync'],
    subtasks: [],
    createdAt: new Date().toISOString()
  },
  {
    id: 't-3',
    title: 'Responder mensagens pendentes no Telegram e emails',
    description: 'Delegar ou resolver pendências rápidas do dia.',
    projectId: 'work',
    priority: 1,
    urgent: true,
    important: false,
    dueDate: today,
    startTime: '16:00',
    endTime: '16:45',
    completed: false,
    tags: ['comms'],
    subtasks: [],
    createdAt: new Date().toISOString()
  },
  {
    id: 't-4',
    title: 'Organizar pastas e backups antigos',
    description: 'Limpeza periódica de arquivos e dados temporários.',
    projectId: 'personal',
    priority: 0,
    urgent: false,
    important: false,
    dueDate: inTwoDays,
    completed: false,
    tags: ['organizacao'],
    subtasks: [],
    createdAt: new Date().toISOString()
  },
  {
    id: 't-5',
    title: 'Treino de Força / Mobilidade',
    description: '30 minutos de exercício físico.',
    projectId: 'personal',
    priority: 2,
    urgent: true,
    important: true,
    dueDate: today,
    startTime: '18:00',
    endTime: '19:00',
    completed: true,
    tags: ['saude'],
    subtasks: [],
    createdAt: new Date().toISOString()
  }
];

export const INITIAL_HABITS = [
  {
    id: 'h-1',
    name: 'Treinar / Exercício Diário',
    icon: 'Activity',
    color: '#ef4444',
    frequency: 'daily',
    targetDays: [0, 1, 2, 3, 4, 5, 6],
    currentStreak: 12,
    bestStreak: 28,
    checkIns: {
      [today]: true,
      [yesterday]: true,
      [new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0]]: true,
      [new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0]]: true,
      [new Date(Date.now() - 86400000 * 4).toISOString().split('T')[0]]: true
    }
  },
  {
    id: 'h-2',
    name: 'Leitura de Livros Técnicos (20 min)',
    icon: 'BookOpen',
    color: '#3b82f6',
    frequency: 'daily',
    targetDays: [0, 1, 2, 3, 4, 5, 6],
    currentStreak: 5,
    bestStreak: 19,
    checkIns: {
      [today]: false,
      [yesterday]: true,
      [new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0]]: true
    }
  },
  {
    id: 'h-3',
    name: 'Beber 2.5L de Água',
    icon: 'Droplet',
    color: '#06b6d4',
    frequency: 'daily',
    targetDays: [0, 1, 2, 3, 4, 5, 6],
    currentStreak: 8,
    bestStreak: 15,
    checkIns: {
      [today]: true,
      [yesterday]: true
    }
  },
  {
    id: 'h-4',
    name: 'Sessão de Foco / Pomodoro (Deep Work)',
    icon: 'Flame',
    color: '#f97316',
    frequency: 'weekdays',
    targetDays: [1, 2, 3, 4, 5],
    currentStreak: 7,
    bestStreak: 21,
    checkIns: {
      [today]: true,
      [yesterday]: true
    }
  },
  {
    id: 'h-5',
    name: 'Planejamento Diário Matinal',
    icon: 'Compass',
    color: '#8b5cf6',
    frequency: 'daily',
    targetDays: [0, 1, 2, 3, 4, 5, 6],
    currentStreak: 14,
    bestStreak: 30,
    checkIns: {
      [today]: true,
      [yesterday]: true
    }
  },
  {
    id: 'h-6',
    name: 'Revisão Noturna e Desconexão Digital',
    icon: 'Moon',
    color: '#6366f1',
    frequency: 'daily',
    targetDays: [0, 1, 2, 3, 4, 5, 6],
    currentStreak: 3,
    bestStreak: 10,
    checkIns: {
      [today]: false,
      [yesterday]: true
    }
  }
];

export const INITIAL_POMODORO_SESSIONS = [
  {
    id: 'p-1',
    taskId: 't-1',
    taskTitle: 'Lançar versão gratuita ilimitada do TickTick (OpenTick)',
    durationMinutes: 25,
    completedAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    id: 'p-2',
    taskId: 't-1',
    taskTitle: 'Lançar versão gratuita ilimitada do TickTick (OpenTick)',
    durationMinutes: 25,
    completedAt: new Date(Date.now() - 3600000).toISOString()
  }
];
