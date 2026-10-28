/**
 * Gamification & RPG Ranking Engine for OpenTick
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
    color: '#cd7f32',
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
    tier: 'lenda',
    name: 'Lenda Imortal',
    shortName: 'Mestre Lenda',
    color: '#ff6b00',
    bgBadge: 'bg-orange-950 text-orange-400 border-orange-500',
    minXp: 10000,
    maxXp: 99999,
    minLevel: 22,
    maxLevel: 99,
    description: 'O ápice da produtividade humana. Zero procrastinação.'
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
    const r = RANKS_CONFIG[i];
    if (totalXp >= r.minXp) {
      currentRank = r;
      nextRank = RANKS_CONFIG[i + 1] || null;
    }
  }

  // Calculate Level and Progress
  const xpIntoCurrentTier = totalXp - currentRank.minXp;
  const tierXpRange = nextRank ? (nextRank.minXp - currentRank.minXp) : 5000;
  const tierProgressPct = nextRank 
    ? Math.min(100, Math.max(0, Math.round((xpIntoCurrentTier / tierXpRange) * 100)))
    : 100;

  const level = Math.min(
    currentRank.maxLevel,
    currentRank.minLevel + Math.floor((tierProgressPct / 100) * (currentRank.maxLevel - currentRank.minLevel))
  );

  // Achievements
  const achievements = [
    {
      id: 'first_blood',
      title: 'Primeira Vitória',
      desc: 'Conclua sua primeira tarefa no OpenTick',
      icon: '⚔️',
      unlocked: completedTasks.length >= 1
    },
    {
      id: 'focus_spark',
      title: 'Chama do Foco',
      desc: 'Complete uma sessão Pomodoro de 25 minutos',
      icon: '🍅',
      unlocked: pomodoroSessions.length >= 1
    },
    {
      id: 'task_slayer',
      title: 'Matador de Tarefas',
      desc: 'Conclua pelo menos 5 tarefas',
      icon: '🎯',
      unlocked: completedTasks.length >= 5
    },
    {
      id: 'habit_builder',
      title: 'Forjador de Hábitos',
      desc: 'Mantenha um hábito ativo por 3 dias seguidos',
      icon: '🔥',
      unlocked: habitStreakDays >= 3
    },
    {
      id: 'silver_knight',
      title: 'Cavaleiro de Prata',
      desc: 'Atinja 900 XP no ranking geral',
      icon: '🥈',
      unlocked: totalXp >= 900
    },
    {
      id: 'sapphire_mind',
      title: 'Mente de Safira',
      desc: 'Atinja 3.500 XP e desbloqueie o Escudo de Safira',
      icon: '🔷',
      unlocked: totalXp >= 3500
    },
    {
      id: 'legendary_focus',
      title: 'Lenda Suprema',
      desc: 'Atinja o ranking Lenda Imortal (+10.000 XP)',
      icon: '👑',
      unlocked: totalXp >= 10000
    }
  ];

  return {
    totalXp,
    taskXp,
    pomodoroXp,
    habitXp,
    bonusXp,
    currentRank,
    nextRank,
    level,
    tierProgressPct,
    xpToNextTier: nextRank ? Math.max(0, nextRank.minXp - totalXp) : 0,
    achievements,
    unlockedAchievementsCount: achievements.filter(a => a.unlocked).length
  };
}
