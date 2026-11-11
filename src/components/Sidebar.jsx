import React, { useState } from 'react';
import {
  Inbox,
  Laptop,
  Calendar as CalendarIcon,
  CheckSquare,
  Grid,
  Flame,
  Clock,
  BarChart3,
  Plus,
  Trash2,
  X,
  Search,
  Tag,
  ChevronRight,
  BookOpen,
  Rocket,
  Zap,
  SlidersHorizontal,
  Folder,
  Camera,
  MoreHorizontal
} from 'lucide-react';
import RankShield2D from './RankShield2D';
import { calculateGamification } from '../utils/gamification';
import { getTodayYMD, getTaskDates } from '../utils/taskSchedule';

export default function Sidebar({
  store,
  onCloseMobileDrawer,
  onOpenSyncModal,
  onOpenSettingsModal,
  onOpenSearchModal,
  onOpenProfileModal
}) {
  const { state, activeView, setActiveView, addProject, deleteProject } = store;
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectColor, setNewProjectColor] = useState('#facc15');
  const [confirmDeleteProjId, setConfirmDeleteProjId] = useState(null);

  const today = new Date();
  const dayOfMonth = today.getDate();
  const todayStr = getTodayYMD();

  const activeTasks = (state.tasks || []).filter(t => !t.deleted);
  const trashedTasksCount = (state.tasks || []).filter(t => t.deleted).length;

  const todayTasksCount = activeTasks.filter(t => {
    if (t.completed) return false;
    const dates = getTaskDates(t);
    return dates.includes(todayStr);
  }).length;

  const inboxTasksCount = activeTasks.filter(t => !t.completed && (t.projectId === 'inbox' || !t.projectId)).length;
  const completedTasksCount = activeTasks.filter(t => t.completed).length;

  const profile = state.userProfile || {
    name: 'Mathx',
    title: 'Mestre da Produtividade',
    avatar: '🐺',
    avatarType: 'emoji',
    coverPreset: 'rain_glass',
    coverImage: null
  };

  const gamificationStats = calculateGamification(state);

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

  const handleSelectView = (viewId) => {
    setActiveView(viewId);
    if (onCloseMobileDrawer) onCloseMobileDrawer();
  };

  const handleCreateProject = (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    addProject({
      name: newProjectName.trim(),
      color: newProjectColor,
      icon: '📁'
    });
    setNewProjectName('');
    setIsAddingProject(false);
  };

  return (
    <aside className="w-[310px] max-w-[85vw] md:w-68 bg-[#121214] border-r border-[#242428] flex flex-col h-full select-none shadow-2xl md:shadow-none text-neutral-100">
      {/* Profile Header */}
      <div className="relative border-b border-[#242428] shrink-0 bg-[#0e0e10] overflow-hidden">
        <div className="h-16 w-full bg-cover bg-center relative" style={getCoverBg()}>
          <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-[#0e0e10]" />

          <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
            <button
              onClick={() => {
                if (onOpenSearchModal) onOpenSearchModal();
                if (onCloseMobileDrawer) onCloseMobileDrawer();
              }}
              className="p-1.5 text-neutral-300 hover:text-white rounded-md bg-black/50 hover:bg-black/70 backdrop-blur-md transition-colors"
              title="Pesquisar"
            >
              <Search className="w-3.5 h-3.5 text-neutral-200" />
            </button>
            <button
              onClick={() => {
                if (onOpenProfileModal) {
                  onOpenProfileModal();
                } else if (onOpenSettingsModal) {
                  onOpenSettingsModal();
                }
                if (onCloseMobileDrawer) onCloseMobileDrawer();
              }}
              className="p-1.5 text-neutral-300 hover:text-white rounded-md bg-black/50 hover:bg-black/70 backdrop-blur-md transition-colors"
              title="Personalizar Perfil"
            >
              <Camera className="w-3.5 h-3.5 text-neutral-200" />
            </button>
          </div>
        </div>

        <div
          onClick={() => {
            handleSelectView('stats');
            if (onCloseMobileDrawer) onCloseMobileDrawer();
          }}
          className="p-3 pt-0 pb-3 flex items-center gap-3 cursor-pointer hover:bg-white/[0.02] transition-colors relative"
        >
          <div className="relative shrink-0 -mt-6">
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-zinc-600 via-amber-500 to-[#facc15] p-0.5 shadow-xl ring-2 ring-[#0e0e10]">
              <div className="w-full h-full rounded-full bg-[#1c1c1e] overflow-hidden flex items-center justify-center font-black text-white text-2xl select-none">
                {profile.avatarType === 'image' && profile.avatar ? (
                  <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  profile.avatar || '🐺'
                )}
              </div>
            </div>
            <span className="absolute -top-0.5 -right-0.5 bg-[#18181c] border border-[#facc15]/50 text-[#facc15] text-[9px] font-black rounded-full p-0.5 shadow-md flex items-center justify-center w-5 h-5">
              👑
            </span>
          </div>

          <div className="min-w-0 flex-1 pt-1">
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-white tracking-tight truncate">
                {profile.name || 'Mathx'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 mt-0.5">
              <div className="flex items-center gap-1">
                <RankShield2D tier={gamificationStats.currentRank.tier} size={16} />
                <span className="font-semibold text-neutral-300 text-[10px]">
                  {gamificationStats.currentRank.shortName}
                </span>
              </div>
              <span className="bg-[#1c1c22] border border-[#2c2c34] text-neutral-300 font-semibold px-1.5 py-0.2 rounded font-mono text-[9px]">
                Nv.{gamificationStats.level}
              </span>
              <span className="text-[#facc15] text-[10px] font-mono truncate">
                {gamificationStats.totalXp} XP
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Navigation Area */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3 space-y-3.5">
        <div className="space-y-1">
          {/* Hoje */}
          <button
            onClick={() => handleSelectView('tasks-today')}
            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md text-xs font-semibold transition-all border ${
              activeView === 'tasks-today'
                ? 'bg-[#facc15]/12 text-[#facc15] border-[#facc15]/45'
                : 'text-neutral-300 hover:bg-[#1a1a1e] border-transparent'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`w-7 h-7 rounded-md flex items-center justify-center font-bold text-xs shrink-0 border ${
                  activeView === 'tasks-today'
                    ? 'bg-[#facc15]/20 border-[#facc15]/55 text-[#facc15]'
                    : 'bg-[#18181c] border-white/10 text-neutral-200'
                }`}
              >
                {dayOfMonth}
              </div>
              <span className="text-[13px] font-semibold">Hoje</span>
            </div>
            {todayTasksCount > 0 && (
              <span
                className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border ${
                  activeView === 'tasks-today'
                    ? 'bg-[#facc15]/15 text-[#facc15] border-[#facc15]/35'
                    : 'bg-[#18181c] text-neutral-400 border-white/10'
                }`}
              >
                {todayTasksCount}
              </span>
            )}
          </button>

          {/* Caixa de Entrada */}
          <button
            onClick={() => handleSelectView('tasks-inbox')}
            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md text-xs font-semibold transition-all border ${
              activeView === 'tasks-inbox'
                ? 'bg-[#facc15]/12 text-[#facc15] border-[#facc15]/45'
                : 'text-neutral-300 hover:bg-[#1a1a1e] border-transparent'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`w-7 h-7 rounded-md border flex items-center justify-center shrink-0 ${
                  activeView === 'tasks-inbox'
                    ? 'bg-[#facc15]/20 border-[#facc15]/50 text-[#facc15]'
                    : 'bg-[#18181c] border-white/10 text-neutral-300'
                }`}
              >
                <Inbox className="w-3.5 h-3.5" />
              </div>
              <span className="text-[13px]">Caixa de Entrada</span>
            </div>
            {inboxTasksCount > 0 && (
              <span className="text-[11px] text-neutral-400 font-mono font-semibold px-1.5 py-0.5">
                {inboxTasksCount}
              </span>
            )}
          </button>

          {/* Ranking & XP (Escudos 3D) */}
          <button
            onClick={() => handleSelectView('stats')}
            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md text-xs font-semibold transition-all border ${
              activeView === 'stats'
                ? 'bg-[#facc15]/12 text-[#facc15] border-[#facc15]/50'
                : 'text-neutral-200 hover:bg-[#1a1a20] border-transparent'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              <div
                className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 p-1 border ${
                  activeView === 'stats'
                    ? 'bg-[#facc15]/20 border-[#facc15]/50'
                    : 'bg-[#18181c] border-white/10'
                }`}
              >
                <RankShield2D tier={gamificationStats.currentRank.tier} size={20} showGlow={false} />
              </div>
              <div className="text-left min-w-0 flex-1">
                <span className={`text-[13px] font-semibold block truncate ${activeView === 'stats' ? 'text-[#facc15]' : 'text-white'}`}>
                  Ranking & XP
                </span>
                <span className="text-[10px] text-neutral-400 font-medium block truncate whitespace-nowrap">
                  {gamificationStats.currentRank.shortName} · Nv.{gamificationStats.level}
                </span>
              </div>
            </div>
            <span className="text-[10px] text-neutral-300 font-mono font-semibold px-2 py-0.5 rounded bg-[#18181c] border border-white/10 shrink-0 whitespace-nowrap ml-2">
              {gamificationStats.totalXp} XP
            </span>
          </button>

          {/* Etiquetas -> opens quick search */}
          <button
            type="button"
            onClick={() => {
              if (onOpenSearchModal) onOpenSearchModal();
              if (onCloseMobileDrawer) onCloseMobileDrawer();
            }}
            className="w-full flex items-center justify-between px-2.5 py-2 rounded-md text-xs font-semibold text-neutral-300 hover:bg-[#1a1a1e] border border-transparent transition-colors"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-[#18181c] border border-white/10 flex items-center justify-center text-neutral-300 shrink-0">
                <Tag className="w-3.5 h-3.5" />
              </div>
              <span className="text-[13px]">Etiquetas</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-neutral-500" />
          </button>
        </div>

        <div className="border-t border-[#242428] my-1.5" />

        {/* Listas & Projetos */}
        <div className="space-y-1">
          <div className="px-2 pb-1 text-[10px] font-bold text-neutral-400 uppercase tracking-widest flex items-center justify-between">
            <span>Listas & Projetos</span>
            <button
              onClick={() => setIsAddingProject(!isAddingProject)}
              className="p-1 rounded-md bg-[#18181c] text-neutral-300 hover:text-white border border-white/10 transition-colors"
              title="Nova Lista"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {isAddingProject && (
            <form onSubmit={handleCreateProject} className="p-2.5 bg-[#18181c] rounded-md border border-[#2e2e34] space-y-2 mb-2 shadow-xl">
              <input
                type="text"
                placeholder="Nome da lista..."
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                autoFocus
                className="w-full bg-[#0d0d0f] border border-[#2e2e34] rounded-md px-2.5 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none"
              />
              <div className="flex items-center justify-between pt-0.5">
                <div className="flex items-center gap-1.5">
                  {['#facc15', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#f59e0b'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewProjectColor(c)}
                      className={`w-4 h-4 rounded-full transition-transform ${newProjectColor === c ? 'scale-125 ring-2 ring-white shadow-sm' : 'opacity-70'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsAddingProject(false)}
                    className="text-xs px-2 py-1 text-neutral-400 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="text-xs px-2.5 py-1 bg-[#facc15]/15 border border-[#facc15]/50 text-[#facc15] font-bold rounded-md"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            </form>
          )}

          {state.projects.map((proj) => {
            const count = activeTasks.filter(t => !t.completed && t.projectId === proj.id).length;
            const isActive = activeView === `project-${proj.id}`;

            let ListIconComponent = Folder;
            const nameLower = proj.name.toLowerCase();
            if (nameLower.includes('tecnologia')) ListIconComponent = Laptop;
            else if (nameLower.includes('sprint')) ListIconComponent = Rocket;
            else if (nameLower.includes('alta') || nameLower.includes('urgente')) ListIconComponent = Flame;
            else if (nameLower.includes('média') || nameLower.includes('media')) ListIconComponent = Zap;
            else if (nameLower.includes('leitura') || nameLower.includes('livro')) ListIconComponent = BookOpen;
            else if (nameLower.includes('fazer')) ListIconComponent = CheckSquare;
            else if (proj.id === 'inbox') ListIconComponent = Inbox;

            const isConfirming = confirmDeleteProjId === proj.id;

            return (
              <div
                key={proj.id}
                onClick={() => handleSelectView(`project-${proj.id}`)}
                className={`group flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-all cursor-pointer border ${
                  isActive
                    ? 'bg-[#facc15]/12 text-[#facc15] font-semibold border-[#facc15]/45'
                    : 'text-neutral-300 hover:bg-[#1a1a1e] border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 truncate min-w-0">
                  <div
                    className={`w-6 h-6 rounded-md border flex items-center justify-center shrink-0 ${
                      isActive
                        ? 'bg-[#facc15]/20 border-[#facc15]/45 text-[#facc15]'
                        : 'bg-[#18181c] border-white/10 text-neutral-300'
                    }`}
                  >
                    <ListIconComponent className="w-3.5 h-3.5" />
                  </div>
                  <span className="truncate text-[13px]">{proj.name}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {count > 0 && (
                    <span className="text-[10px] text-neutral-400 font-mono font-semibold bg-[#18181c] px-1.5 py-0.5 rounded border border-white/10">
                      {count}
                    </span>
                  )}
                  {proj.id !== 'inbox' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!isConfirming) {
                          setConfirmDeleteProjId(proj.id);
                        } else {
                          deleteProject(proj.id);
                          setConfirmDeleteProjId(null);
                        }
                      }}
                      className={`p-1 rounded transition-all ${
                        isConfirming
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold px-1.5'
                          : 'opacity-70 md:opacity-0 md:group-hover:opacity-100 text-neutral-500 hover:text-rose-400'
                      }`}
                    >
                      {isConfirming ? 'Excluir?' : <Trash2 className="w-3 h-3" />}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-[#242428] my-1.5" />

        {/* Ferramentas e Recursos */}
        <div className="space-y-1">
          <div className="px-2 pb-1 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
            <span>Recursos & Ferramentas</span>
          </div>

          {[
            { id: 'calendar', label: 'Calendário & Horários', icon: CalendarIcon },
            { id: 'eisenhower', label: 'Matriz de Eisenhower', icon: Grid },
            { id: 'habits', label: 'Rastreador de Hábitos', icon: Flame },
            { id: 'pomodoro', label: 'Pomodoro & Ruídos', icon: Clock },
            { id: 'stats', label: 'Progresso Nível XP', icon: BarChart3 }
          ].map(tool => {
            const Icon = tool.icon;
            const isActive = activeView === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => handleSelectView(tool.id)}
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md text-xs transition-all border ${
                  isActive
                    ? 'bg-[#facc15]/12 text-[#facc15] font-semibold border-[#facc15]/45'
                    : 'text-neutral-300 hover:bg-[#1a1a1e] border-transparent'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-md border flex items-center justify-center shrink-0 ${
                      isActive
                        ? 'bg-[#facc15]/20 border-[#facc15]/50 text-[#facc15]'
                        : 'bg-[#18181c] border-white/10 text-neutral-300'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="truncate text-[13px]">{tool.label}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="border-t border-[#242428] my-1.5" />

        {/* Completed, Trash & Mais/Configurações */}
        <div className="space-y-1">
          <button
            onClick={() => handleSelectView('tasks-completed')}
            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md text-xs transition-all border ${
              activeView === 'tasks-completed'
                ? 'bg-[#facc15]/12 text-[#facc15] font-semibold border-[#facc15]/45'
                : 'text-neutral-300 hover:bg-[#1a1a1e] border-transparent'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`w-7 h-7 rounded-md border flex items-center justify-center shrink-0 ${
                  activeView === 'tasks-completed'
                    ? 'bg-[#facc15]/20 border-[#facc15]/50 text-[#facc15]'
                    : 'bg-[#18181c] border-white/10 text-neutral-300'
                }`}
              >
                <CheckSquare className="w-3.5 h-3.5" />
              </div>
              <span className="text-[13px]">Concluído</span>
            </div>
            {completedTasksCount > 0 && (
              <span className="text-[11px] text-neutral-400 font-mono font-semibold">{completedTasksCount}</span>
            )}
          </button>

          <button
            onClick={() => handleSelectView('tasks-trash')}
            className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md text-xs transition-all border ${
              activeView === 'tasks-trash'
                ? 'bg-[#facc15]/12 text-[#facc15] font-semibold border-[#facc15]/45'
                : 'text-neutral-400 hover:bg-[#1a1a1e] border-transparent'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`w-7 h-7 rounded-md border flex items-center justify-center shrink-0 ${
                  activeView === 'tasks-trash'
                    ? 'bg-[#facc15]/20 border-[#facc15]/50 text-[#facc15]'
                    : 'bg-[#18181c] border-white/10 text-neutral-400'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </div>
              <span className="text-[13px]">Lixeira</span>
            </div>
            {trashedTasksCount > 0 && (
              <span className="text-[11px] text-neutral-500 font-mono font-semibold">{trashedTasksCount}</span>
            )}
          </button>

          <button
            onClick={() => {
              if (onOpenSettingsModal) onOpenSettingsModal();
              if (onCloseMobileDrawer) onCloseMobileDrawer();
            }}
            className="w-full flex items-center justify-between px-2.5 py-2 rounded-md text-xs text-neutral-300 hover:bg-[#1a1a1e] border border-transparent transition-all"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-md bg-[#18181c] border border-white/10 flex items-center justify-center text-neutral-300 shrink-0">
                <MoreHorizontal className="w-3.5 h-3.5" />
              </div>
              <span className="text-[13px]">Mais & Configurações</span>
            </div>
          </button>
        </div>
      </div>

      {/* Drawer Footer */}
      <div className="p-2.5 border-t border-[#242428] bg-[#0e0e10] flex items-center justify-between shrink-0">
        <button
          onClick={() => setIsAddingProject(true)}
          className="flex items-center gap-1.5 text-xs font-semibold text-neutral-200 hover:text-white px-3 py-1.5 rounded-md bg-[#18181c] border border-white/10 active:scale-95 transition-transform"
        >
          <Plus className="w-3.5 h-3.5 text-[#facc15]" />
          <span>Criar Lista</span>
        </button>

        <button
          onClick={() => {
            if (onOpenSettingsModal) onOpenSettingsModal();
            if (onCloseMobileDrawer) onCloseMobileDrawer();
          }}
          className="p-2 text-neutral-400 hover:text-white rounded-md bg-[#18181c] border border-white/10 active:scale-95 transition-transform"
          title="Configurações Gerais"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
