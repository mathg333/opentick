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
  FolderPlus
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
  const [newProjectColor, setNewProjectColor] = useState('#3b82f6');

  const today = new Date();
  const dayOfMonth = today.getDate();
  const todayStr = today.toISOString().split('T')[0];

  const todayTasksCount = state.tasks.filter(t => !t.completed && t.dueDate === todayStr).length;
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
      icon: 'Folder'
    });
    setNewProjectName('');
    setIsAddingProject(false);
  };

  return (
    <aside className="w-[300px] max-w-[85vw] md:w-64 bg-[#18181b] border-r border-[#262629] flex flex-col h-full select-none shadow-2xl md:shadow-none text-neutral-100">
      {/* Profile Header (Exact TickTick layout: Avatar, Name "Mathx", Search, Bell, Settings) */}
      <div className="p-4 pt-5 border-b border-[#262629] flex items-center justify-between shrink-0 bg-[#141416]">
        <div 
          onClick={() => {
            if (onOpenSettingsModal) onOpenSettingsModal();
            if (onCloseMobileDrawer) onCloseMobileDrawer();
          }}
          className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity"
        >
          {/* Avatar with Frog/Knight aesthetic from screenshot */}
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-600 via-amber-600 to-indigo-600 p-0.5 shadow-md">
              <div className="w-full h-full rounded-full bg-[#1c1c1e] flex items-center justify-center font-bold text-white text-xs">
                🐸
              </div>
            </div>
            {/* Level/Crown Badge */}
            <span className="absolute -top-1 -right-1 bg-neutral-200 text-black text-[9px] font-black rounded-full px-1 shadow">
              👑
            </span>
          </div>

          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-white tracking-tight">Mathx</span>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-400 font-bold px-1.5 py-0.2 rounded border border-emerald-500/30">
                PRO FREE
              </span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-neutral-400 mt-0.5">
              <span className="bg-[#242428] px-1 rounded text-emerald-300 font-mono">Lv.5</span>
              <span>• 12 crachás</span>
            </div>
          </div>
        </div>

        {/* Top Action Icons: Search, Bell, Settings / Close on Mobile */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              if (onOpenSearchModal) onOpenSearchModal();
              if (onCloseMobileDrawer) onCloseMobileDrawer();
            }}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg active:bg-neutral-800 transition-colors"
            title="Pesquisar"
          >
            <Search className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              if (onOpenSettingsModal) onOpenSettingsModal();
              if (onCloseMobileDrawer) onCloseMobileDrawer();
            }}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg active:bg-neutral-800 transition-colors"
            title="Configurações"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={onCloseMobileDrawer}
            className="md:hidden p-1.5 text-neutral-400 hover:text-white rounded-lg active:bg-neutral-800 ml-1"
            title="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Scrollable Navigation Area */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {/* Smart Views: Hoje (blue box icon with date) & Etiquetas */}
        <div className="space-y-1">
          <button
            onClick={() => handleSelectView('tasks-today')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              activeView === 'tasks-today'
                ? 'bg-[#28282e] text-white font-semibold'
                : 'text-neutral-300 hover:bg-[#222226]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-md bg-[#4c82f7] flex items-center justify-center text-white font-black text-[11px] shadow-sm">
                {dayOfMonth}
              </div>
              <span className="font-semibold">Hoje</span>
            </div>
            {todayTasksCount > 0 && (
              <span className="text-xs text-neutral-400 font-mono font-medium">
                {todayTasksCount}
              </span>
            )}
          </button>

          <button
            onClick={() => handleSelectView('tasks-inbox')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              activeView === 'tasks-inbox'
                ? 'bg-[#28282e] text-white font-semibold'
                : 'text-neutral-300 hover:bg-[#222226]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-md bg-[#3b82f6]/20 flex items-center justify-center text-[#4c82f7]">
                <Inbox className="w-3.5 h-3.5" />
              </div>
              <span>Caixa de Entrada</span>
            </div>
          </button>

          <div className="flex items-center justify-between px-3 py-2 text-xs text-neutral-400 hover:text-neutral-200 cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-md bg-[#2563eb]/20 flex items-center justify-center text-blue-400">
                <Tag className="w-3.5 h-3.5" />
              </div>
              <span>Etiquetas</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-neutral-600" />
          </div>
        </div>

        <div className="border-t border-[#262629] my-2" />

        {/* User Lists (Populated with user's real categories from screenshot) */}
        <div className="space-y-1">
          <div className="px-2 pb-1 text-[10px] font-bold text-neutral-500 uppercase tracking-wider flex items-center justify-between">
            <span>Listas</span>
            <button
              onClick={() => setIsAddingProject(!isAddingProject)}
              className="text-neutral-400 hover:text-white transition-colors p-0.5"
              title="Nova Lista"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {isAddingProject && (
            <form onSubmit={handleCreateProject} className="p-2.5 bg-[#141417] rounded-xl border border-[#27272a] space-y-2 mb-2">
              <input
                type="text"
                placeholder="Nome da lista..."
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                autoFocus
                className="w-full bg-[#09090b] border border-[#27272a] rounded px-2.5 py-1 text-xs text-white placeholder-neutral-600 focus:outline-none"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {['#ef4444', '#f59e0b', '#10b981', '#06b6d4', '#8b5cf6', '#ec4899'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewProjectColor(c)}
                      className={`w-3.5 h-3.5 rounded-full ${newProjectColor === c ? 'scale-125 ring-2 ring-white' : 'opacity-70'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingProject(false)}
                    className="text-[10px] px-2 py-0.5 text-neutral-400"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="text-[10px] px-2.5 py-0.5 bg-white text-black font-bold rounded"
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
            if (proj.name.toLowerCase().includes('tecnologia')) listEmoji = '📚';
            else if (proj.name.toLowerCase().includes('sprint')) listEmoji = '🚀';
            else if (proj.name.toLowerCase().includes('alta')) listEmoji = '🔥';
            else if (proj.name.toLowerCase().includes('média') || proj.name.toLowerCase().includes('media')) listEmoji = '⚡';
            else if (proj.name.toLowerCase().includes('leitura')) listEmoji = '📚';
            else if (proj.name.toLowerCase().includes('fazer')) listEmoji = '☰';

            return (
              <div
                key={proj.id}
                onClick={() => handleSelectView(`project-${proj.id}`)}
                className={`group flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#28282e] text-white font-medium'
                    : 'text-neutral-300 hover:bg-[#222226]'
                }`}
              >
                <div className="flex items-center gap-3 truncate">
                  <span className="text-sm shrink-0">{listEmoji}</span>
                  <span className="truncate">{proj.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {count > 0 && (
                    <span className="text-xs text-neutral-400 font-mono">{count}</span>
                  )}
                  {proj.id !== 'inbox' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteProject(proj.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-[#262629] my-2" />

        {/* System Completed & Trash Views */}
        <div className="space-y-1">
          <button
            onClick={() => handleSelectView('tasks-completed')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${
              activeView === 'tasks-completed' ? 'bg-[#28282e] text-white' : 'text-neutral-300 hover:bg-[#222226]'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-md bg-[#2563eb]/20 flex items-center justify-center text-blue-400">
                <CheckSquare className="w-3.5 h-3.5" />
              </div>
              <span>Concluído</span>
            </div>
            {completedTasksCount > 0 && (
              <span className="text-xs text-neutral-400 font-mono">{completedTasksCount}</span>
            )}
          </button>

          <button
            onClick={() => handleSelectView('tasks-wontdo')}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-neutral-300 hover:bg-[#222226]"
          >
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-md bg-rose-500/20 flex items-center justify-center text-rose-400">
                <X className="w-3.5 h-3.5" />
              </div>
              <span>Não será feito</span>
            </div>
          </button>

          <button
            onClick={() => handleSelectView('tasks-trash')}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-neutral-400 hover:bg-[#222226]"
          >
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-md bg-neutral-800 flex items-center justify-center text-neutral-500">
                <Trash2 className="w-3.5 h-3.5" />
              </div>
              <span>Lixeira</span>
            </div>
          </button>
        </div>

        <div className="border-t border-[#262629] my-2" />

        {/* PRO Premium Unlocked Section */}
        <div className="space-y-1">
          <div className="px-2 pb-1 text-[10px] font-bold text-neutral-500 uppercase tracking-wider flex items-center justify-between">
            <span>Recursos PRO Grátis</span>
            <span className="text-[9px] bg-emerald-500/20 text-emerald-400 font-bold px-1 rounded">
              DESBLOQUEADO
            </span>
          </div>

          {[
            { id: 'calendar', label: 'Calendário & Time-Blocking', icon: CalendarIcon, color: 'text-blue-400' },
            { id: 'eisenhower', label: 'Matriz de Eisenhower', icon: Grid, color: 'text-rose-400' },
            { id: 'habits', label: 'Rastreador de Hábitos', icon: Flame, color: 'text-orange-400' },
            { id: 'pomodoro', label: 'Pomodoro & Ruído Branco', icon: Clock, color: 'text-yellow-400' },
            { id: 'stats', label: 'Estatísticas & Produtividade', icon: BarChart3, color: 'text-indigo-400' }
          ].map(tool => {
            const Icon = tool.icon;
            const isActive = activeView === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => handleSelectView(tool.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-all ${
                  isActive ? 'bg-[#28282e] text-white font-bold' : 'text-neutral-300 hover:bg-[#222226]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${tool.color}`} />
                  <span className="truncate">{tool.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Drawer Footer (Matching screenshot bottom: + Adicionar, and reorder icon) */}
      <div className="p-3 border-t border-[#262629] bg-[#141416] flex items-center justify-between shrink-0">
        <button
          onClick={() => setIsAddingProject(true)}
          className="flex items-center gap-2 text-xs font-semibold text-neutral-300 hover:text-white px-2 py-1 rounded-lg"
        >
          <Plus className="w-4 h-4" />
          <span>Adicionar</span>
        </button>

        <button
          onClick={() => {
            if (onOpenSettingsModal) onOpenSettingsModal();
            if (onCloseMobileDrawer) onCloseMobileDrawer();
          }}
          className="p-1.5 text-neutral-400 hover:text-white rounded-lg"
          title="Gerenciar e Configurar"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
