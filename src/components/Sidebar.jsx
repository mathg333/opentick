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
  Sparkles
} from 'lucide-react';

export default function Sidebar({ 
  store, 
  onOpenSyncModal, 
  onOpenExportModal 
}) {
  const { state, activeView, setActiveView, addProject, deleteProject } = store;
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectColor, setNewProjectColor] = useState('#3b82f6');

  const todayStr = new Date().toISOString().split('T')[0];
  const todayTasksCount = state.tasks.filter(t => !t.completed && t.dueDate === todayStr).length;
  const inboxTasksCount = state.tasks.filter(t => !t.completed && t.projectId === 'inbox').length;

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

  const navItems = [
    { id: 'tasks-inbox', label: 'Caixa de Entrada', icon: Inbox, count: inboxTasksCount, color: 'text-neutral-400' },
    { id: 'tasks-today', label: 'Hoje', icon: CheckSquare, count: todayTasksCount, color: 'text-amber-500' },
    { id: 'tasks-next7', label: 'Próximos 7 Dias', icon: CalendarDays, color: 'text-neutral-300' },
  ];

  const premiumFeatures = [
    { id: 'calendar', label: 'Calendário & Time-Blocking', icon: CalendarIcon, color: 'text-neutral-200' },
    { id: 'eisenhower', label: 'Matriz de Eisenhower', icon: Grid, color: 'text-rose-400' },
    { id: 'habits', label: 'Rastreador de Hábitos', icon: Flame, color: 'text-orange-400' },
    { id: 'pomodoro', label: 'Pomodoro & Ruído Branco', icon: Clock, color: 'text-yellow-400' },
    { id: 'stats', label: 'Estatísticas & Resumo', icon: BarChart3, color: 'text-neutral-300' },
  ];

  return (
    <aside className="w-64 bg-[#09090b] border-r border-[#222226] flex flex-col h-screen select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-[#222226] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-neutral-700 to-neutral-900 border border-neutral-700 flex items-center justify-center shadow-md">
            <CheckSquare className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-neutral-100 tracking-tight">OpenTick</span>
              <span className="text-[9px] uppercase font-bold tracking-wider bg-neutral-800 text-neutral-300 px-1.5 py-0.5 rounded border border-neutral-700">
                PRO FREE
              </span>
            </div>
            <p className="text-[11px] text-neutral-500">Dark AMOLED Edition</p>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-6">
        {/* Core Views */}
        <div className="space-y-1">
          <div className="px-2 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
            Tarefas
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#1e1e24] text-white border border-[#323238] font-semibold'
                    : 'text-neutral-400 hover:bg-[#151518] hover:text-neutral-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${item.color}`} />
                  <span>{item.label}</span>
                </div>
                {item.count !== undefined && item.count > 0 && (
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                    isActive ? 'bg-neutral-800 text-neutral-200' : 'bg-[#18181b] text-neutral-500'
                  }`}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Premium Unlocked Features */}
        <div className="space-y-1">
          <div className="px-2 text-[10px] font-bold text-neutral-500 uppercase tracking-wider flex items-center justify-between">
            <span>Recursos Premium</span>
            <span className="text-[9px] bg-neutral-800 text-neutral-400 px-1.5 py-0.2 rounded font-bold">
              Desbloqueado
            </span>
          </div>
          {premiumFeatures.map((item) => {
            const Icon = item.icon;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#1e1e24] text-white border border-[#323238] font-semibold'
                    : 'text-neutral-400 hover:bg-[#151518] hover:text-neutral-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${item.color}`} />
                  <span className="truncate">{item.label}</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/20">
                  GRÁTIS
                </span>
              </button>
            );
          })}
        </div>

        {/* Projects / Lists */}
        <div className="space-y-1">
          <div className="px-2 text-[10px] font-bold text-neutral-500 uppercase tracking-wider flex items-center justify-between">
            <span>Listas & Projetos</span>
            <button
              onClick={() => setIsAddingProject(!isAddingProject)}
              className="text-neutral-500 hover:text-white transition-colors p-0.5 rounded"
              title="Criar Lista"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {isAddingProject && (
            <form onSubmit={handleCreateProject} className="p-2.5 bg-[#141417] rounded-lg border border-[#27272a] space-y-2 mt-1">
              <input
                type="text"
                placeholder="Nome da lista..."
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                autoFocus
                className="w-full bg-[#09090b] border border-[#27272a] rounded px-2.5 py-1 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-500"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  {['#ef4444', '#f59e0b', '#10b981', '#06b6d4', '#8b5cf6', '#ec4899', '#d4d4d8'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewProjectColor(c)}
                      className={`w-3.5 h-3.5 rounded-full transition-transform ${newProjectColor === c ? 'scale-125 ring-2 ring-white' : 'opacity-70 hover:opacity-100'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingProject(false)}
                    className="text-[11px] px-2 py-0.5 text-neutral-400 hover:text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="text-[11px] px-2.5 py-0.5 bg-neutral-200 hover:bg-white text-black rounded font-semibold"
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
            return (
              <div
                key={proj.id}
                className={`group flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#1e1e24] text-white font-medium border border-[#323238]'
                    : 'text-neutral-400 hover:bg-[#151518] hover:text-neutral-200'
                }`}
                onClick={() => setActiveView(`project-${proj.id}`)}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: proj.color }}
                  />
                  <span className="truncate">{proj.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {count > 0 && (
                    <span className="text-[11px] text-neutral-500 font-mono">{count}</span>
                  )}
                  {proj.id !== 'inbox' && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteProject(proj.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 text-neutral-600 hover:text-rose-400 transition-opacity p-0.5"
                      title="Excluir lista"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-3 border-t border-[#222226] space-y-1.5 bg-[#09090b]">
        <button
          onClick={onOpenSyncModal}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-neutral-300 hover:text-white bg-[#141417] hover:bg-[#1d1d21] border border-[#27272a] transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 text-neutral-400" />
          <span>Sincronizar TickTick API</span>
        </button>

        <button
          onClick={onOpenExportModal}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-neutral-400 hover:text-neutral-200 hover:bg-[#141417] transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-neutral-500" />
          <span>Backup & Exportação JSON</span>
        </button>
      </div>
    </aside>
  );
}
