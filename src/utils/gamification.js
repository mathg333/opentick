/**
 * Gamification & RPG Ranking Engine for OpenTask
 * 3D Shields: Ferro, Bronze, Prata, Ouro, Safira, Diamante, Rubi
 * Scaled for hard-earned, rewarding productivity progression.
 */

export const XP_REWARDS = {
  TASK_COMPLETED: 10,
  TASK_HIGH_PRIORITY_BONUS: 5,
  POMODORO_SESSION: 20,
  HABIT_STREAK_DAY: 5,
};

export const RANKS_CONFIG = [
  {
    tier: 'ferro',
    name: 'Iniciado de Ferro',
    shortName: 'Ferro',
    color: '#94a3b8',
    bgBadge: 'bg-slate-800 text-slate-300 border-slate-700',
    minXp: 0,
    maxXp: 999,
    minLevel: 1,
    maxLevel: 5,
    description: 'Começando a jornada de foco e disciplina diária.'
  },
  {
    tier: 'bronze',
    name: 'Guerreiro de Bronze',
    shortName: 'Bronze',
    color: '#d97706',
    bgBadge: 'bg-amber-950 text-amber-400 border-amber-800',
    minXp: 1000,
    maxXp: 2999,
    minLevel: 6,
    maxLevel: 10,
    description: 'Vencendo batalhas árduas contra a procrastinação com constância.'
  },
  {
    tier: 'prata',
    name: 'Cavaleiro de Prata',
    shortName: 'Prata',
    color: '#e2e8f0',
    bgBadge: 'bg-slate-700 text-slate-100 border-slate-500',
    minXp: 3000,
    maxXp: 6999,
    minLevel: 11,
    maxLevel: 15,
    description: 'Armadura forjada em consistência rígida e centenas de tarefas.'
  },
  {
    tier: 'ouro',
    name: 'Comandante de Ouro',
    shortName: 'Ouro',
    color: '#fbbf24',
    bgBadge: 'bg-amber-900/60 text-amber-300 border-amber-500',
    minXp: 7000,
    maxXp: 13999,
    minLevel: 16,
    maxLevel: 20,
    description: 'Liderança e domínio absoluto sobre o tempo e metas diárias.'
  },
  {
    tier: 'safira',
    name: 'Místico de Safira',
    shortName: 'Safira',
    color: '#3b82f6',
    bgBadge: 'bg-blue-950 text-blue-300 border-blue-600',
    minXp: 14000,
    maxXp: 24999,
    minLevel: 21,
    maxLevel: 25,
    description: 'Mente cristalina, hábitos inabaláveis e foco supremo.'
  },
  {
    tier: 'diamante',
    name: 'Titã de Diamante',
    shortName: 'Diamante',
    color: '#22d3ee',
    bgBadge: 'bg-cyan-950 text-cyan-300 border-cyan-500',
    minXp: 25000,
    maxXp: 44999,
    minLevel: 26,
    maxLevel: 30,
    description: 'Produtividade inquebrável, disciplina de aço e maestria comprovada.'
  },
  {
    tier: 'rubi',
    name: 'Soberano de Rubi',
    shortName: 'Rubi',
    color: '#ef4444',
    bgBadge: 'bg-red-950 text-red-400 border-red-600',
    minXp: 45000,
    maxXp: 99999,
    minLevel: 31,
    maxLevel: 50,
    description: 'O ápice supremo da produtividade. Mestre absoluto forjado no cristal místico de rubi.'
  }
];

export function calculateGamification(state) {
  const tasks = (state.tasks || []).filter(t => !t.deleted);
  const habits = state.habits || [];
  const pomodoroSessions = state.pomodoroSessions || [];
  const bonusXp = (state.bonusXp && state.bonusXp !== 450) ? state.bonusXp : 0;

  const completedTasks = tasks.filter(t => t.completed);
  const highPriorityCompleted = completedTasks.filter(t => t.priority === 3);

  const taskXp = completedTasks.length * XP_REWARDS.TASK_COMPLETED;
  const highPriorityBonusXp = highPriorityCompleted.length * XP_REWARDS.TASK_HIGH_PRIORITY_BONUS;
  const pomodoroXp = pomodoroSessions.length * XP_REWARDS.POMODORO_SESSION;
  const habitStreakDays = habits.reduce((acc, h) => acc + Math.max(h.currentStreak ?? h.streak ?? 0, 0), 0);
  const habitXp = habitStreakDays * XP_REWARDS.HABIT_STREAK_DAY;

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
  let level = currentRank.minLevel;

  if (nextRank) {
    const range = nextRank.minXp - currentRank.minXp;
    const currentWithinRange = totalXp - currentRank.minXp;
    tierProgressPct = Math.min(100, Math.max(0, Math.round((currentWithinRange / range) * 100)));
    xpToNextTier = nextRank.minXp - totalXp;
    const levelCount = currentRank.maxLevel - currentRank.minLevel + 1;
    level = currentRank.minLevel + Math.min(levelCount - 1, Math.floor((currentWithinRange / range) * levelCount));
  } else {
    // Top tier (Rubi)
    const rubiBase = currentRank.minXp;
    const rubiXp = Math.max(0, totalXp - rubiBase);
    level = Math.min(currentRank.maxLevel, currentRank.minLevel + Math.floor(rubiXp / 2500));
    tierProgressPct = Math.min(100, Math.round((rubiXp / 50000) * 100));
    xpToNextTier = 0;
  }

  // Achievements
  const achievements = [
    {
      id: 'first_task',
      title: 'Primeira Vitória',
      desc: 'Completou a primeira tarefa no OpenTask',
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
      unlocked: habits.some(h => (h.currentStreak ?? h.streak ?? 0) >= 3 || (h.bestStreak || 0) >= 3)
    },
    {
      id: 'silver_rank',
      title: 'Cavaleiro Forjado',
      desc: 'Alcançou o ranking Cavaleiro de Prata (3.000+ XP)',
      icon: '🛡️',
      unlocked: totalXp >= 3000
    },
    {
      id: 'gold_master',
      title: 'Comandante Supremo',
      desc: 'Alcançou o ranking Comandante de Ouro (7.000+ XP)',
      icon: '👑',
      unlocked: totalXp >= 7000
    },
    {
      id: 'ruby_sovereign',
      title: 'Soberano de Rubi',
      desc: 'Alcançou o ranking lendário de Rubi (45.000+ XP)',
      icon: '💎',
      unlocked: totalXp >= 45000
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
