import React, { useState } from 'react';
import { 
  BarChart3, 
  CheckCircle2, 
  Clock, 
  Flame, 
  Target, 
  TrendingUp, 
  Trophy, 
  Zap, 
  Shield, 
  Sparkles, 
  Lock, 
  Check, 
  ChevronRight,
  Camera,
  Award
} from 'lucide-react';
import RankShield2D from './RankShield2D';
import { calculateGamification, RANKS_CONFIG } from '../utils/gamification';
import ProfileCustomizeModal from './ProfileCustomizeModal';

export default function ProductivityStats({ store }) {
  const { state } = store;
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const profile = state.userProfile || {
    name: 'Mathx',
    title: 'Mestre da Produtividade',
    avatar: '🐺',
    avatarType: 'emoji',
    coverPreset: 'rain_glass',
    coverImage: null
  };

  const stats = calculateGamification(state);

  const totalTasks = state.tasks.length;
  const completedTasks = state.tasks.filter(t => t.completed).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const totalFocusMinutes = state.pomodoroSessions.reduce((acc, s) => acc + (s.durationMinutes || 25), 0);
  const totalFocusHours = (totalFocusMinutes / 60).toFixed(1);

  const bestHabitStreak = state.habits.reduce((max, h) => Math.max(max, h.bestStreak || h.streak || 0), 0);
  const activeHabitsCount = state.habits.length;

  const getCoverBg = () => {
    if (profile.coverImage) {
      return { backgroundImage: `url(${profile.coverImage})` };
    }
    if (profile.coverPreset === 'rain_glass') {
      return { backgroundImage: "url('/images/bg_rain_glass_dark.png')" };
    }
    if (profile.coverPreset === 'sunset_lava') {
      return { background: 'linear-gradient(135deg, #ff7a00, #ff3d00, #991b1b)' };
    }
    if (profile.coverPreset === 'cyber_neon') {
      return { background: 'linear-gradient(135deg, #1e1b4b, #4338ca, #3b82f6)' };
    }
    if (profile.coverPreset === 'sapphire_deep') {
      return { background: 'linear-gradient(135deg, #0f172a, #1e3a8a, #2563eb)' };
    }
    return { background: 'linear-gradient(135deg, #18181b, #27272a, #3f3f46)' };
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#0c0c0e]">
      {/* Header */}
      <div className="px-4 py-3 md:px-8 md:pt-6 md:pb-4 border-b border-[#222226] bg-[#0c0c0e] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 to-[#ff6b00] p-0.5 shadow-md shadow-[#ff6b00]/20 flex items-center justify-center shrink-0">
            <div className="w-full h-full rounded-[10px] bg-[#121215] flex items-center justify-center">
              <Trophy className="w-4 h-4 text-[#ff6b00]" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base md:text-xl font-black text-white tracking-tight">
                Estatísticas & Gamificação RPG
              </h1>
              <span className="text-[9px] md:text-[10px] bg-[#ff6b00]/20 text-[#ff6b00] font-black px-2 py-0.5 rounded border border-[#ff6b00]/30">
                PRO GRATUITO
              </span>
            </div>
            <p className="text-xs text-neutral-400 hidden sm:block">
              Evolua de ranking, conquiste escudos 2D e suba de nível com suas tarefas
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsProfileModalOpen(true)}
          className="text-xs font-bold text-white bg-[#1c1c22] hover:bg-[#25252d] border border-[#2c2c34] px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all shadow"
        >
          <Camera className="w-3.5 h-3.5 text-[#ff6b00]" />
          <span>Editar Perfil & Capa</span>
        </button>
      </div>

      {/* Main Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-3 md:p-8 space-y-6 max-w-5xl pb-28 md:pb-12">
        
        {/* 1. HERO PLAYER RPG CARD */}
        <div className="rounded-3xl border border-[#27272a] overflow-hidden bg-[#121215] shadow-2xl relative">
          {/* Banner Capa */}
          <div 
            className="h-32 sm:h-40 w-full relative bg-cover bg-center flex items-end p-4"
            style={getCoverBg()}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/45 to-[#121215]" />
            
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className="relative z-10 text-xs font-bold text-white bg-black/60 hover:bg-black/80 px-3 py-1.5 rounded-full border border-white/20 backdrop-blur-md flex items-center gap-1.5 shadow transition-all ml-auto"
            >
              <Camera className="w-3.5 h-3.5 text-[#ff6b00]" />
              Trocar Foto / Capa
            </button>
          </div>

          {/* Profile Details & Big Shield Row */}
          <div className="px-4 sm:px-6 pb-6 relative -mt-12 sm:-mt-16 flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
            
            <div className="flex items-end gap-4">
              {/* Avatar with Ring */}
              <div className="relative group shrink-0">
                <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-tr from-emerald-500 via-amber-500 to-[#ff6b00] p-1.5 shadow-2xl ring-4 ring-[#121215]">
                  <div className="w-full h-full rounded-full bg-[#1c1c1e] overflow-hidden flex items-center justify-center font-black text-white text-3xl sm:text-4xl select-none">
                    {profile.avatarType === 'image' && profile.avatar ? (
                      <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      profile.avatar || '🐺'
                    )}
                  </div>
                </div>
                <span className="absolute -top-1 -right-1 bg-amber-400 text-black text-xs font-black rounded-full p-0.5 shadow-md flex items-center justify-center w-6 h-6">
                  👑
                </span>
              </div>

              {/* Name & Title */}
              <div className="space-y-1 mb-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {profile.name || 'Mathx'}
                  </h2>
                  <span className="bg-amber-400/20 text-amber-300 font-extrabold text-[10px] px-2 py-0.5 rounded-full border border-amber-400/40 font-mono">
                    Nv. {stats.level}
                  </span>
                </div>
                <p className="text-xs text-neutral-400 font-medium">
                  {profile.title || 'Mestre da Produtividade'}
                </p>
              </div>
            </div>

            {/* Current Active Shield & Elo Badge */}
            <div className="flex items-center gap-3 bg-[#18181c] border border-[#2a2a32] rounded-2xl p-3 shadow-xl w-full sm:w-auto">
              <div className="shrink-0 relative">
                <div className="absolute inset-0 rounded-full bg-[#ff6b00]/20 blur-md" />
                <RankShield2D tier={stats.currentRank.tier} size={48} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest block">
                  Ranking Atual
                </span>
                <span className="text-base font-black text-white tracking-tight block" style={{ color: stats.currentRank.color }}>
                  {stats.currentRank.name}
                </span>
                <span className="text-[11px] text-neutral-400 font-mono">
                  {stats.totalXp} XP acumulados
                </span>
              </div>
            </div>

          </div>

          {/* XP Progress Bar to Next Tier */}
          <div className="px-4 sm:px-6 pb-6 pt-2 border-t border-[#1c1c20]">
            <div className="flex items-center justify-between text-xs font-bold mb-2">
              <span className="text-neutral-300 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                Progresso para o próximo Ranking
              </span>
              <span className="text-neutral-400 font-mono text-[11px]">
                {stats.nextRank 
                  ? `${stats.totalXp} / ${stats.nextRank.minXp} XP (${stats.tierProgressPct}%)` 
                  : 'Ranking Máximo Atingido!'}
              </span>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full h-3.5 rounded-full bg-[#1c1c22] border border-[#27272a] overflow-hidden p-0.5">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-amber-500 via-[#ff6b00] to-[#ff3d00] transition-all duration-500 shadow-[0_0_12px_rgba(255,107,0,0.5)]"
                style={{ width: `${stats.tierProgressPct}%` }}
              />
            </div>

            <div className="flex items-center justify-between mt-2 text-[11px] text-neutral-400">
              <span>{stats.currentRank.name}</span>
              {stats.nextRank ? (
                <span className="text-amber-400 font-bold">
                  Faltam apenas {stats.xpToNextTier} XP para {stats.nextRank.shortName}!
                </span>
              ) : (
                <span className="text-emerald-400 font-bold">Lenda Suprema Imortal 👑</span>
              )}
            </div>
          </div>
        </div>

        {/* 2. TRILHA DE ESCUDOS 2D DOS RANKINGS (ROADMAP) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#ff6b00]" />
              Trilha de Escudos dos Rankings
            </h3>
            <span className="text-xs text-neutral-400">
              {stats.currentRank.name}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {RANKS_CONFIG.map((rank) => {
              const isUnlocked = stats.totalXp >= rank.minXp;
              const isCurrent = stats.currentRank.tier === rank.tier;

              return (
                <div
                  key={rank.tier}
                  className={`rounded-2xl border p-3 flex flex-col items-center text-center relative transition-all ${
                    isCurrent
                      ? 'bg-gradient-to-b from-[#1c1c24] to-[#121216] border-[#ff6b00] ring-2 ring-[#ff6b00]/30 shadow-xl shadow-[#ff6b00]/15 scale-102'
                      : isUnlocked
                      ? 'bg-[#121215] border-[#2c2c34] hover:border-neutral-500'
                      : 'bg-[#0a0a0c] border-[#1c1c20] opacity-50'
                  }`}
                >
                  {isCurrent && (
                    <span className="absolute -top-2.5 bg-[#ff6b00] text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow tracking-wider uppercase">
                      Seu Elo
                    </span>
                  )}

                  {/* 2D Vector Shield */}
                  <div className="my-2 relative flex items-center justify-center">
                    <RankShield2D tier={rank.tier} size={54} />
                    {!isUnlocked && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full">
                        <Lock className="w-4 h-4 text-neutral-400" />
                      </div>
                    )}
                  </div>

                  <span className="text-xs font-black text-white mt-1" style={{ color: rank.color }}>
                    {rank.shortName}
                  </span>

                  <span className="text-[10px] text-neutral-400 font-mono mt-0.5">
                    {rank.minXp} XP
                  </span>

                  <div className="mt-2 w-full pt-2 border-t border-white/5 flex items-center justify-center">
                    {isUnlocked ? (
                      <span className="inline-flex items-center gap-1 text-[10px] text-emerald-400 font-bold">
                        <Check className="w-3 h-3 stroke-[3]" />
                        Liberado
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] text-neutral-400 font-medium">
                        <Lock className="w-3 h-3" />
                        Bloqueado
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. PAINEL DE BATALHA & ESTATÍSTICAS (KPIS) */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="bg-[#121215] border border-[#27272a] rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
              <span className="font-bold">Tarefas Entregues</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl md:text-3xl font-black text-white">{completedTasks}</div>
            <span className="text-[11px] text-neutral-400 mt-1 block">
              +{completedTasks * 60} XP gerados
            </span>
          </div>

          <div className="bg-[#121215] border border-[#27272a] rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
              <span className="font-bold">Tempo de Foco</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl md:text-3xl font-black text-white">{totalFocusHours}h</div>
            <span className="text-[11px] text-neutral-400 mt-1 block">
              {state.pomodoroSessions.length} sessões (+{state.pomodoroSessions.length * 120} XP)
            </span>
          </div>

          <div className="bg-[#121215] border border-[#27272a] rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
              <span className="font-bold">Maior Sequência</span>
              <Flame className="w-4 h-4 text-orange-400" />
            </div>
            <div className="text-2xl md:text-3xl font-black text-white">{bestHabitStreak} dias</div>
            <span className="text-[11px] text-neutral-400 mt-1 block">
              {activeHabitsCount} hábitos diários
            </span>
          </div>

          <div className="bg-[#121215] border border-[#27272a] rounded-2xl p-4 shadow-xl">
            <div className="flex items-center justify-between text-neutral-400 text-xs mb-2">
              <span className="font-bold">Taxa de Vitória</span>
              <TrendingUp className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl md:text-3xl font-black text-white">{completionRate}%</div>
            <span className="text-[11px] text-neutral-400 mt-1 block">
              {totalTasks} tarefas registradas
            </span>
          </div>
        </div>

        {/* 4. SALA DE CONQUISTAS & BADGES */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-neutral-200 uppercase tracking-wider flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-400" />
              Sala de Conquistas & Insígnias ({stats.unlockedAchievementsCount}/{stats.achievements.length})
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {stats.achievements.map((ach) => (
              <div
                key={ach.id}
                className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-all ${
                  ach.unlocked
                    ? 'bg-[#141418] border-[#2c2c34] shadow-lg'
                    : 'bg-[#0a0a0c] border-[#1c1c20] opacity-45'
                }`}
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-2xl shrink-0 ${
                  ach.unlocked ? 'bg-white/5 border border-white/10' : 'bg-neutral-900 border border-neutral-800'
                }`}>
                  {ach.icon}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-white truncate">{ach.title}</h4>
                    {ach.unlocked ? (
                      <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-0.5">
                        <Check className="w-2.5 h-2.5" />
                        Conquistado
                      </span>
                    ) : (
                      <span className="text-[10px] text-neutral-400 flex items-center gap-0.5">
                        <Lock className="w-2.5 h-2.5" />
                        Bloqueado
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-neutral-400 line-clamp-1 mt-0.5">{ach.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Modal de Personalização do Perfil */}
      <ProfileCustomizeModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        store={store}
      />
    </div>
  );
}
