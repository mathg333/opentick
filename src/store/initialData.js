const today = new Date().toISOString().split('T')[0];
const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
const inTwoDays = new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0];

export const INITIAL_PROJECTS = [
  { id: 'inbox', name: 'Caixa de Entrada', color: '#3b82f6', isDefault: true, icon: 'Inbox' },
  { id: 'proj-tech', name: 'Trilha Tecnologia — Aprender...', color: '#ef4444', icon: 'BookOpen' },
  { id: 'proj-sprint', name: 'Sprint de dias — Limpeza e Neg...', color: '#f59e0b', icon: 'Rocket' },
  { id: 'proj-alta', name: 'Alta Prioridade', color: '#ef4444', icon: 'Flame' },
  { id: 'proj-media', name: 'Média Prioridade', color: '#f59e0b', icon: 'Zap' },
  { id: 'proj-leitura', name: 'Leitura', color: '#10b981', icon: 'BookOpen' },
  { id: 'proj-nao-fazer', name: 'O QUE NÃO FAZER', color: '#6b7280', icon: 'Slash' }
];

export const INITIAL_TASKS = [
  {
    id: 't-1',
    title: 'organize as que ja estao criadas',
    description: 'Revisar tarefas da Caixa de Entrada e categorizar nas listas correspondentes.',
    projectId: 'inbox',
    priority: 0,
    urgent: false,
    important: false,
    dueDate: '',
    completed: false,
    tags: [],
    subtasks: [],
    createdAt: new Date().toISOString()
  },
  {
    id: 't-2',
    title: 'semana 3',
    description: 'Acompanhamento do cronograma e entregas da semana 3.',
    projectId: 'inbox',
    priority: 0,
    urgent: false,
    important: false,
    dueDate: '',
    completed: false,
    tags: [],
    subtasks: [],
    createdAt: new Date().toISOString()
  },
  {
    id: 't-3',
    title: 'TRABALHO COP',
    description: 'Sessão diária de trabalho operacional com foco total.',
    projectId: 'proj-alta',
    priority: 3,
    urgent: true,
    important: true,
    dueDate: today,
    startTime: '16:20',
    endTime: '18:00',
    completed: false,
    tags: ['foco', 'trabalho'],
    subtasks: [],
    createdAt: new Date().toISOString()
  },
  {
    id: 't-4',
    title: 'ORGANIZAR LISTA DE POSSÍVEIS CLIENTES GOOGLE MAPS - SAÚDE',
    description: '- [] Live Estética Recife Centro de saúde e bem-estar',
    projectId: 'inbox',
    priority: 2,
    urgent: true,
    important: false,
    dueDate: yesterday,
    startTime: '23:30',
    completed: true,
    tags: ['prospeccao'],
    subtasks: [],
    createdAt: new Date().toISOString()
  },
  {
    id: 't-5',
    title: 'CONCLUIR ORGANIZAÇÃO AUDIO BOOTCAMP/ ESTUDAR',
    description: 'Finalizar anotações dos áudios e revisar os tópicos principais.',
    projectId: 'proj-tech',
    priority: 2,
    urgent: false,
    important: true,
    dueDate: yesterday,
    startTime: '16:30',
    completed: true,
    tags: ['estudos'],
    subtasks: [],
    createdAt: new Date().toISOString()
  }
];

export const INITIAL_HABITS = [
  {
    id: 'h-1',
    name: 'Estudo Diário (1h)',
    color: '#3b82f6',
    frequency: 'daily',
    checkIns: {
      [today]: true,
      [yesterday]: true
    },
    currentStreak: 5,
    bestStreak: 14
  },
  {
    id: 'h-2',
    name: 'Treino de Força',
    color: '#10b981',
    frequency: 'daily',
    checkIns: {
      [yesterday]: true
    },
    currentStreak: 3,
    bestStreak: 12
  },
  {
    id: 'h-3',
    name: 'Leitura 20 Páginas',
    color: '#f59e0b',
    frequency: 'daily',
    checkIns: {},
    currentStreak: 2,
    bestStreak: 8
  }
];

export const INITIAL_POMODORO_SESSIONS = [
  {
    id: 'p-1',
    taskId: 't-3',
    taskTitle: 'TRABALHO COP',
    durationMinutes: 25,
    completedAt: new Date().toISOString()
  }
];
