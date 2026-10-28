import React, { useState } from 'react';
import { 
  Inbox, 
  Calendar as CalendarIcon, 
  CalendarDays, 
  CheckSquare, 
  Grid, 
  Flame, 
  Clock, 
  BarChart3, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Download, 
  X,
  Search,
  Bell,
  Settings,
  Tag,
  ChevronRight,
  BookOpen,
  Rocket,
  Zap,
  Slash,
  SlidersHorizontal,
  FolderPlus,
  Crown,
  Sparkles,
  CheckCircle2,
  Folder
} from 'lucide-react';

export default function Sidebar({ 
  store, 
  onCloseMobileDrawer,
  onOpenSyncModal, 
  onOpenSettingsModal,
  onOpenSearchModal
}) {
  const { state, activeView, setActiveView, addProject, deleteProject } = store;
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectColor, setNewProjectColor] = useState('#ff6b00');

  const today = new Date();
  const dayOfMonth = today.getDate();
  const todayStr = today.toISOString().split('T')[0];

  const todayTasksCount = state.tasks.filter(t => !t.completed && (t.dueDate === todayStr || (t.recurringDates && t.recurringDates.includes(todayStr)))).length;
  const inboxTasksCount = state.tasks.filter(t => !t.completed && (t.projectId === 'inbox' || !t.projectId)).length;
  const completedTasksCount = state.tasks.filter(t => t.completed).length;

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
      {/* Profile Header (Larger, prominent avatar requested by user, with PRO status) */}
      <div className="p-4 pt-5 pb-4 border-b border-[#242428] flex items-center justify-between shrink-0 bg-[#0e0e10]">
        <div 
          onClick={() => {
            if (onOpenSettingsModal) onOpenSettingsModal();
            if (onCloseMobileDrawer) onCloseMobileDrawer();
          }}
          className="flex items-center gap-3 cursor-pointer hover:opacity-90 transition-opacity"
        >
          {/* Much Larger Avatar with Iridescent Glowing Gradient Ring */}
          <div className="relative shrink-0">
            <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-500 via-amber-500 to-[#ff6b00] p-1 shadow-lg shadow-[#ff6b00]/25">
              <div className="w-full h-full rounded-full bg-[#1c1c1e] flex items-center justify-center font-black text-white text-2xl select-none">
                🐸
              </div>
            </div>
            {/* Gold Crown Badge */}
            <span className="absolute -top-1 -right-1 bg-amber-400 text-black text-[10px] font-black rounded-full p-0.5 shadow-md flex items-center justify-center w-5 h-5">
              👑
            </span>
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base text-white tracking-tight truncate">Mathx</span>
              <span className="text-[9px] bg-[#ff6b00]/20 text-[#ff6b00] font-black px-1.5 py-0.5 rounded border border-[#ff6b00]/30 shrink-0">
                PRO FREE
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 mt-1">
              <span className="bg-emerald-950 text-emerald-300 font-bold px-1.5 py-0.2 rounded font-mono text-[10px]">
                Lv.5
              </span>
              <span className="truncate">⭐ 12 crachás</span>
            </div>
          </div>
        </div>

        {/* Top Header Actions: Search, Settings, Close */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              if (onOpenSearchModal) onOpenSearchModal();
              if (onCloseMobileDrawer) onCloseMobileDrawer();
            }}
            className="p-2 text-neutral-400 hover:text-white rounded-xl active:bg-neutral-800 transition-colors"
            title="Pesquisar"
          >
            <Search className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (onOpenSettingsModal) onOpenSettingsModal();
              if (onCloseMobileDrawer) onCloseMobileDrawer();
            }}
            className="p-2 text-neutral-400 hover:text-white rounded-xl active:bg-neutral-800 transition-colors"
            title="Configurações"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={onCloseMobileDrawer}
            className="md:hidden p-2 text-neutral-400 hover:text-white rounded-xl active:bg-neutral-800"
            title="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Scrollable Navigation Area */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {/* Core Views with Rich Colored Icon Badges */}
        <div className="space-y-1">
          {/* Hoje */}
          <button
            onClick={() => handleSelectView('tasks-today')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
              activeView === 'tasks-today'
                ? 'bg-[#222226] text-white shadow-sm border border-[#303036]'
                : 'text-neutral-300 hover:bg-[#1a1a1e]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#ff6b00] to-[#ea580c] flex items-center justify-center text-white font-black text-xs shadow-md shadow-[#ff6b00]/30 shrink-0">
                {dayOfMonth}
              </div>
              <span className="text-sm font-bold">Hoje</span>
            </div>
            {todayTasksCount > 0 && (
              <span className="text-xs bg-[#ff6b00]/20 text-[#ff6b00] font-mono font-bold px-2 py-0.5 rounded-full border border-[#ff6b00]/30">
                {todayTasksCount}
              </span>
            )}
          </button>

          {/* Caixa de Entrada */}
          <button
            onClick={() => handleSelectView('tasks-inbox')}
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-semibold transition-all ${
              activeView === 'tasks-inbox'
                ? 'bg-[#222226] text-white shadow-sm border border-[#303036]'
                : 'text-neutral-300 hover:bg-[#1a1a1e]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 shrink-0">
                <Inbox className="w-4 h-4 stroke-[2.5]" />
              </div>
              <span className="text-sm">Caixa de Entrada</span>
            </div>
            {inboxTasksCount > 0 && (
              <span className="text-xs text-neutral-400 font-mono font-bold px-1.5 py-0.5">
                {inboxTasksCount}
              </span>
            )}
          </button>

          {/* Etiquetas */}
          <div className="flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-semibold text-neutral-300 hover:bg-[#1a1a1e] cursor-pointer transition-colors">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-500 to-rose-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20 shrink-0">
                <Tag className="w-4 h-4" />
              </div>
              <span className="text-sm">Etiquetas</span>
            </div>
            <ChevronRight className="w-4 h-4 text-neutral-500" />
          </div>
        </div>

        <div className="border-t border-[#242428] my-2" />

        {/* User Custom Lists with Rich Styled Badges */}
        <div className="space-y-1">
          <div className="px-2 pb-1.5 text-[10px] font-black text-neutral-400 uppercase tracking-widest flex items-center justify-between">
            <span>Listas & Projetos</span>
            <button
              onClick={() => setIsAddingProject(!isAddingProject)}
              className="p-1 rounded-lg bg-[#1c1c1e] text-neutral-300 hover:text-white border border-[#2c2c2e] transition-colors"
              title="Nova Lista"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {isAddingProject && (
            <form onSubmit={handleCreateProject} className="p-3 bg-[#18181c] rounded-2xl border border-[#2e2e34] space-y-2.5 mb-2 shadow-xl animate-in fade-in">
              <input
                type="text"
                placeholder="Nome da lista..."
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                autoFocus
                className="w-full bg-[#0d0d0f] border border-[#2e2e34] rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none"
              />
              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-1.5">
                  {['#ff6b00', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#f59e0b'].map((c) => (
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
                    className="text-xs px-2.5 py-1 text-neutral-400 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="text-xs px-3 py-1 bg-[#ff6b00] hover:bg-[#ea580c] text-white font-bold rounded-xl shadow-md"
                  >
                    Salvar
                  </button>
                </div>
              </div>
            </form>
          )}

          {state.projects.map((proj) => {
            const count = state.tasks.filter(t => !t.completed && t.projectId === proj.id).length;
            const isActive = activeView === `project-${proj.id}`;

            // Map custom emoji per list
            let listEmoji = '📁';
            let bgGradient = 'from-blue-500 to-indigo-600';
            const nameLower = proj.name.toLowerCase();

            if (nameLower.includes('tecnologia')) {
              listEmoji = '💻';
              bgGradient = 'from-cyan-500 to-blue-600';
            } else if (nameLower.includes('sprint')) {
              listEmoji = '🚀';
              bgGradient = 'from-violet-500 to-purple-600';
            } else if (nameLower.includes('alta') || nameLower.includes('urgente')) {
              listEmoji = '🔥';
              bgGradient = 'from-rose-500 to-red-600';
            } else if (nameLower.includes('média') || nameLower.includes('media')) {
              listEmoji = '⚡';
              bgGradient = 'from-amber-500 to-orange-600';
            } else if (nameLower.includes('leitura') || nameLower.includes('livro')) {
              listEmoji = '📚';
              bgGradient = 'from-emerald-500 to-teal-600';
            } else if (nameLower.includes('fazer')) {
              listEmoji = '📝';
              bgGradient = 'from-blue-500 to-indigo-600';
            }

            return (
              <div
                key={proj.id}
                onClick={() => handleSelectView(`project-${proj.id}`)}
                className={`group flex items-center justify-between px-3 py-2 rounded-2xl text-xs transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#222226] text-white font-bold border border-[#303036] shadow-sm'
                    : 'text-neutral-300 hover:bg-[#1a1a1e]'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <div className={`w-7 h-7 rounded-xl bg-gradient-to-br ${bgGradient} flex items-center justify-center text-sm shadow-sm shrink-0`}>
                    {listEmoji}
                  </div>
                  <span className="truncate text-sm font-medium">{proj.name}</span>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {count > 0 && (
                    <span className="text-xs text-neutral-400 font-mono font-bold bg-[#18181c] px-2 py-0.5 rounded-full border border-[#28282c]">
                      {count}
                    </span>
                  )}
                  {proj.id !== 'inbox' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Excluir a lista "${proj.name}"?`)) {
                          deleteProject(proj.id);
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-rose-400 p-1 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-[#242428] my-2" />

        {/* PRO Premium Unlocked Section with Rich Glowing Badges */}
        <div className="space-y-1">
          <div className="px-2 pb-1.5 text-[10px] font-black text-neutral-400 uppercase tracking-widest flex items-center justify-between">
            <span>Ferramentas PRO</span>
            <span className="text-[9px] bg-emerald-500/20 text-emerald-400 font-black px-1.5 py-0.5 rounded border border-emerald-500/30">
              100% GRÁTIS
            </span>
          </div>

          {[
            { id: 'calendar', label: 'Calendário & Horários', icon: CalendarIcon, gradient: 'from-blue-500 to-cyan-500' },
            { id: 'eisenhower', label: 'Matriz de Eisenhower', icon: Grid, gradient: 'from-emerald-500 to-teal-600' },
            { id: 'habits', label: 'Rastreador de Hábitos', icon: Flame, gradient: 'from-amber-500 to-orange-600' },
            { id: 'pomodoro', label: 'Pomodoro & Ruídos', icon: Clock, gradient: 'from-rose-500 to-red-600' },
            { id: 'stats', label: 'Estatísticas & Insights', icon: BarChart3, gradient: 'from-indigo-500 to-purple-600' }
          ].map(tool => {
            const Icon = tool.icon;
            const isActive = activeView === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => handleSelectView(tool.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-2xl text-xs transition-all ${
                  isActive 
                    ? 'bg-[#222226] text-white font-bold border border-[#303036] shadow-sm' 
                    : 'text-neutral-300 hover:bg-[#1a1a1e]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-xl bg-gradient-to-br ${tool.gradient} flex items-center justify-center text-white shadow-sm shrink-0`}>
                    <Icon className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <span className="truncate text-sm font-medium">{tool.label}</span>
                </div>
              </button>
            );
          })}
        </div>

        <div className="border-t border-[#242428] my-2" />

        {/* System Completed & Trash Views */}
        <div className="space-y-1">
          <button
            onClick={() => handleSelectView('tasks-completed')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-2xl text-xs transition-all ${
              activeView === 'tasks-completed' ? 'bg-[#222226] text-white font-bold' : 'text-neutral-300 hover:bg-[#1a1a1e]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 flex items-center justify-center text-white shadow-sm shrink-0">
                <CheckSquare className="w-4 h-4 stroke-[2.5]" />
              </div>
              <span className="text-sm font-medium">Concluído</span>
            </div>
            {completedTasksCount > 0 && (
              <span className="text-xs text-neutral-400 font-mono font-bold">{completedTasksCount}</span>
            )}
          </button>

          <button
            onClick={() => handleSelectView('tasks-trash')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-2xl text-xs transition-all ${
              activeView === 'tasks-trash' ? 'bg-[#222226] text-white font-bold' : 'text-neutral-400 hover:bg-[#1a1a1e]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-neutral-700 to-neutral-800 flex items-center justify-center text-neutral-400 shadow-sm shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <span className="text-sm font-medium">Lixeira</span>
            </div>
          </button>
        </div>
      </div>

      {/* Drawer Footer: + Adicionar Lista e Configurações */}
      <div className="p-3 border-t border-[#242428] bg-[#0e0e10] flex items-center justify-between shrink-0">
        <button
          onClick={() => setIsAddingProject(true)}
          className="flex items-center gap-2 text-xs font-bold text-neutral-200 hover:text-white px-3 py-2 rounded-xl bg-[#1c1c1e] border border-[#2a2a2e] shadow-sm active:scale-95 transition-transform"
        >
          <Plus className="w-4 h-4 text-[#ff6b00]" />
          <span>Criar Lista</span>
        </button>

        <button
          onClick={() => {
            if (onOpenSettingsModal) onOpenSettingsModal();
            if (onCloseMobileDrawer) onCloseMobileDrawer();
          }}
          className="p-2 text-neutral-400 hover:text-white rounded-xl bg-[#1c1c1e] border border-[#2a2a2e] active:scale-95 transition-transform"
          title="Configurações Gerais"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
