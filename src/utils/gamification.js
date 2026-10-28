/**
 * Gamification & RPG Ranking Engine for OpenTick
 * 3D Shields: Ferro, Bronze, Prata, Ouro, Safira, Diamante, Rubi
 */

export const RANKS_CONFIG = [
  {
    tier: 'ferro',
    name: 'Iniciado de Ferro',
    shortName: 'Ferro',
    color: '#94a3b8',
    bgBadge: 'bg-slate-800 text-slate-300 border-slate-700',
    minXp: 0,
    maxXp: 299,
    minLevel: 1,
    maxLevel: 3,
    description: 'Começando a jornada de foco e produtividade.'
  },
  {
    tier: 'bronze',
    name: 'Guerreiro de Bronze',
    shortName: 'Bronze',
    color: '#d97706',
    bgBadge: 'bg-amber-950 text-amber-400 border-amber-800',
    minXp: 300,
    maxXp: 899,
    minLevel: 4,
    maxLevel: 6,
    description: 'Vencendo as primeiras batalhas contra a procrastinação.'
  },
  {
    tier: 'prata',
    name: 'Cavaleiro de Prata',
    shortName: 'Prata',
    color: '#e2e8f0',
    bgBadge: 'bg-slate-700 text-slate-100 border-slate-500',
    minXp: 900,
    maxXp: 1799,
    minLevel: 7,
    maxLevel: 9,
    description: 'Armadura forjada em consistência e entrega de tarefas.'
  },
  {
    tier: 'ouro',
    name: 'Comandante de Ouro',
    shortName: 'Ouro',
    color: '#fbbf24',
    bgBadge: 'bg-amber-900/60 text-amber-300 border-amber-500',
    minXp: 1800,
    maxXp: 3499,
    minLevel: 10,
    maxLevel: 13,
    description: 'Liderança e domínio absoluto sobre o tempo diário.'
  },
  {
    tier: 'safira',
    name: 'Místico de Safira',
    shortName: 'Safira',
    color: '#3b82f6',
    bgBadge: 'bg-blue-950 text-blue-300 border-blue-600',
    minXp: 3500,
    maxXp: 5999,
    minLevel: 14,
    maxLevel: 17,
    description: 'Mente cristalina, clareza e hábitos inabaláveis.'
  },
  {
    tier: 'diamante',
    name: 'Titã de Diamante',
    shortName: 'Diamante',
    color: '#22d3ee',
    bgBadge: 'bg-cyan-950 text-cyan-300 border-cyan-500',
    minXp: 6000,
    maxXp: 9999,
    minLevel: 18,
    maxLevel: 21,
    description: 'Produtividade inquebrável, foco supremo e maestria.'
  },
  {
    tier: 'rubi',
    name: 'Soberano de Rubi',
    shortName: 'Rubi',
    color: '#ef4444',
    bgBadge: 'bg-red-950 text-red-400 border-red-600',
    minXp: 10000,
    maxXp: 99999,
    minLevel: 22,
    maxLevel: 99,
    description: 'O nível supremo. Mestre absoluto forjado no cristal místico de rubi.'
  }
];

export function calculateGamification(state) {
  const tasks = state.tasks || [];
  const habits = state.habits || [];
  const pomodoroSessions = state.pomodoroSessions || [];
  const bonusXp = state.bonusXp || 450;

  const completedTasks = tasks.filter(t => t.completed);
  const highPriorityCompleted = completedTasks.filter(t => t.priority === 3);

  const taskXp = completedTasks.length * 60;
  const highPriorityBonusXp = highPriorityCompleted.length * 40;
  const pomodoroXp = pomodoroSessions.length * 120;
  const habitStreakDays = habits.reduce((acc, h) => acc + (h.streak || 0), 0);
  const habitXp = habitStreakDays * 40;

  const totalXp = taskXp + highPriorityBonusXp + pomodoroXp + habitXp + bonusXp;

  // Determine current Rank Tier
  let currentRank = RANKS_CONFIG[0];
  let nextRank = RANKS_CONFIG[1];

  for (let i = 0; i < RANKS_CONFIG.length; i++) {
    if (totalXp >= RANKS_CONFIG[i].minXp) {
      currentRank = RANKS_CONFIG[i];
      nextRank = RANKS_CONFIG[i + 1] || null;
    }
  }

  // Calculate Level and Progress
  let tierProgressPct = 100;
  let xpToNextTier = 0;
  if (nextRank) {
    const range = nextRank.minXp - currentRank.minXp;
    const currentWithinRange = totalXp - currentRank.minXp;
    tierProgressPct = Math.min(100, Math.max(0, Math.round((currentWithinRange / range) * 100)));
    xpToNextTier = nextRank.minXp - totalXp;
  }

  const level = currentRank.minLevel + Math.floor((tierProgressPct / 100) * (currentRank.maxLevel - currentRank.minLevel));

  // Achievements
  const achievements = [
    {
      id: 'first_task',
      title: 'Primeira Vitória',
      desc: 'Completou a primeira tarefa no OpenTick',
      icon: '🎯',
      unlocked: completedTasks.length >= 1
    },
    {
      id: 'task_spree',
      title: 'Produtividade em Série',
      desc: 'Completou 5 ou mais tarefas',
      icon: '⚡',
      unlocked: completedTasks.length >= 5
    },
    {
      id: 'pomodoro_starter',
      title: 'Foco Profundo',
      desc: 'Realizou ao menos 1 sessão de Pomodoro',
      icon: '🍅',
      unlocked: pomodoroSessions.length >= 1
    },
    {
      id: 'habit_master',
      title: 'Hábito Inquebrável',
      desc: 'Manteve uma sequência de hábitos de 3+ dias',
      icon: '🔥',
      unlocked: habits.some(h => (h.streak || 0) >= 3 || (h.bestStreak || 0) >= 3)
    },
    {
      id: 'silver_rank',
      title: 'Cavaleiro Forjado',
      desc: 'Alcançou o ranking Cavaleiro de Prata (900+ XP)',
      icon: '🛡️',
      unlocked: totalXp >= 900
    },
    {
      id: 'gold_master',
      title: 'Comandante Supremo',
      desc: 'Alcançou o ranking Comandante de Ouro (1800+ XP)',
      icon: '👑',
      unlocked: totalXp >= 1800
    },
    {
      id: 'ruby_sovereign',
      title: 'Soberano de Rubi',
      desc: 'Alcançou o ranking lendário de Rubi (10000+ XP)',
      icon: '💎',
      unlocked: totalXp >= 10000
    }
  ];

  return {
    totalXp,
    level,
    currentRank,
    nextRank,
    tierProgressPct,
    xpToNextTier,
    achievements,
    unlockedAchievementsCount: achievements.filter(a => a.unlocked).length
  };
}
