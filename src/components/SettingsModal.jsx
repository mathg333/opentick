import React, { useState } from 'react';
import { 
  ArrowLeft, 
  ChevronRight, 
  Crown, 
  Palette, 
  Clock, 
  Bell, 
  Smartphone, 
  Sparkles, 
  Settings as SettingsIcon, 
  Share2, 
  Layers, 
  RefreshCw,
  Check,
  X,
  Volume2,
  Play,
  Download,
  Upload,
  RotateCcw
} from 'lucide-react';
import { soundManager } from '../utils/audio';

export default function SettingsModal({ isOpen, onClose, store, onOpenSyncModal }) {
  const { state, updateSettings, exportData, importData } = store;
  const settings = state.settings || {};

  const [activeScreen, setActiveScreen] = useState('main'); // 'main', 'appearance', 'datetime', 'sound', 'tabs', 'ai', 'general', 'sync'
  const [testPlaying, setTestPlaying] = useState(false);

  if (!isOpen) return null;

  const handleTestSound = (soundName) => {
    setTestPlaying(true);
    soundManager.playSound(soundName, settings.volume || 0.8);
    setTimeout(() => setTestPlaying(false), 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#000000] flex flex-col h-full overflow-hidden select-none animate-in fade-in">
      {/* Settings Top Bar */}
      <div className="p-4 flex items-center justify-between border-b border-[#1c1c1e] bg-[#000000] shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (activeScreen === 'main') {
                onClose();
              } else {
                setActiveScreen('main');
              }
            }}
            className="p-1.5 text-neutral-300 hover:text-white rounded-lg active:bg-neutral-800"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-bold text-white tracking-tight">
            {activeScreen === 'main' && 'Configurações'}
            {activeScreen === 'appearance' && 'Aparência'}
            {activeScreen === 'datetime' && 'Data hora'}
            {activeScreen === 'sound' && 'Sons e Notificações'}
            {activeScreen === 'tabs' && 'Barra de Abas'}
            {activeScreen === 'ai' && 'Funções de IA'}
            {activeScreen === 'general' && 'Geral'}
            {activeScreen === 'sync' && 'Integrações e Importação'}
          </h1>
        </div>

        <button onClick={onClose} className="p-1.5 text-neutral-400 hover:text-white">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Settings Screen Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-lg mx-auto w-full pb-20">
        {/* ================= MAIN SCREEN ================= */}
        {activeScreen === 'main' && (
          <>
            {/* Profile Card */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-[#1c1c1e] border border-[#28282b]">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-600 via-amber-600 to-indigo-600 p-0.5">
                  <div className="w-full h-full rounded-full bg-[#1c1c1e] flex items-center justify-center font-bold text-white text-base">
                    🐸
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-white">Mathx</span>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.2 rounded border border-amber-500/30">
                      👑 PRO
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-neutral-400 mt-1">
                    <span className="bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded text-[10px] font-bold">
                      Lv.5
                    </span>
                    <span className="bg-neutral-800 text-neutral-300 px-1.5 py-0.5 rounded text-[10px]">
                      ⭐ 12 crachás
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Premium Status Banner */}
            <div className="p-4 rounded-2xl bg-[#1c1c1e] border border-[#28282b] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Conta Premium</h3>
                  <p className="text-xs text-neutral-400">100% Gratuito e Ilimitado para Sempre</p>
                </div>
              </div>
              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-xl border border-emerald-800">
                Ativo
              </span>
            </div>

            {/* Option: Barra de Abas */}
            <div 
              onClick={() => setActiveScreen('tabs')}
              className="rounded-2xl bg-[#1c1c1e] border border-[#28282b] p-3.5 flex items-center justify-between hover:bg-[#222226] cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <Layers className="w-5 h-5 text-blue-400" />
                <span className="text-sm font-semibold text-white">Barra de Abas</span>
              </div>
              <ChevronRight className="w-5 h-5 text-neutral-500" />
            </div>

            {/* Main Options Group Card */}
            <div className="rounded-2xl bg-[#1c1c1e] border border-[#28282b] overflow-hidden divide-y divide-[#262629]">
              <div 
                onClick={() => setActiveScreen('appearance')}
                className="p-3.5 flex items-center justify-between hover:bg-[#222226] cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Palette className="w-5 h-5 text-blue-400" />
                  <div>
                    <span className="text-sm font-semibold text-white">Aparência</span>
                    <p className="text-[11px] text-neutral-400">Tema AMOLED, Cores e Estilo</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-neutral-500" />
              </div>

              <div 
                onClick={() => setActiveScreen('datetime')}
                className="p-3.5 flex items-center justify-between hover:bg-[#222226] cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-blue-400" />
                  <div>
                    <span className="text-sm font-semibold text-white">Data hora</span>
                    <p className="text-[11px] text-neutral-400">Formato {settings.timeFormat || '24h'}, Início no {settings.startOfWeek || 'Domingo'}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-neutral-500" />
              </div>

              <div 
                onClick={() => setActiveScreen('sound')}
                className="p-3.5 flex items-center justify-between hover:bg-[#222226] cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Bell className="w-5 h-5 text-blue-400" />
                  <div>
                    <span className="text-sm font-semibold text-white">Sons e Notificações</span>
                    <p className="text-[11px] text-neutral-400">Toque: {settings.sound || 'Chime'}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-neutral-500" />
              </div>

              <div 
                onClick={() => setActiveScreen('ai')}
                className="p-3.5 flex items-center justify-between hover:bg-[#222226] cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-blue-400" />
                  <div>
                    <span className="text-sm font-semibold text-white">Funções de IA</span>
                    <p className="text-[11px] text-neutral-400">Assistente Gemini & Time-blocking</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-neutral-500" />
              </div>

              <div 
                onClick={() => setActiveScreen('general')}
                className="p-3.5 flex items-center justify-between hover:bg-[#222226] cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <SettingsIcon className="w-5 h-5 text-blue-400" />
                  <div>
                    <span className="text-sm font-semibold text-white">Geral</span>
                    <p className="text-[11px] text-neutral-400">Avisar antes de sair, Padrões</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-neutral-500" />
              </div>
            </div>

            {/* Integration and Sync Card */}
            <div 
              onClick={() => setActiveScreen('sync')}
              className="rounded-2xl bg-[#1c1c1e] border border-[#28282b] p-3.5 flex items-center justify-between hover:bg-[#222226] cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <RefreshCw className="w-5 h-5 text-emerald-400" />
                <div>
                  <span className="text-sm font-semibold text-white">Integrações e Importação</span>
                  <p className="text-[11px] text-neutral-400">Sincronização TickTick API e Backups</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-neutral-500" />
            </div>
          </>
        )}

        {/* ================= SUB-SCREEN: SONS E NOTIFICAÇÕES ================= */}
        {activeScreen === 'sound' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="bg-[#1c1c1e] rounded-2xl border border-[#28282b] p-4 space-y-4">
              <h3 className="text-sm font-bold text-white">Toque de Notificação</h3>
              <div className="space-y-2">
                {[
                  { id: 'chime', label: 'Chime Melódico Clássico' },
                  { id: 'bell', label: 'Sino Suave (Tibetano)' },
                  { id: 'marimba', label: 'Marimba Vibrante' },
                  { id: 'digital', label: 'Digital Beep-Beep' },
                  { id: 'none', label: 'Silencioso / Mudo' }
                ].map(item => {
                  const isSelected = (settings.sound || 'chime') === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        updateSettings({ sound: item.id });
                        if (item.id !== 'none') handleTestSound(item.id);
                      }}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-[#28282e] border-[#4c82f7] text-white' 
                          : 'bg-[#141416] border-[#262629] text-neutral-300 hover:bg-[#1a1a1e]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Volume2 className={`w-4 h-4 ${isSelected ? 'text-[#4c82f7]' : 'text-neutral-500'}`} />
                        <span className="text-xs font-semibold">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.id !== 'none' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTestSound(item.id);
                            }}
                            className="p-1 rounded-lg bg-[#1e1e22] text-xs text-neutral-300 hover:text-white flex items-center gap-1 px-2 border border-[#323236]"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>Testar</span>
                          </button>
                        )}
                        {isSelected && <Check className="w-4 h-4 text-[#4c82f7] stroke-[2.5]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="bg-[#1c1c1e] rounded-2xl border border-[#28282b] p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-semibold text-white block">Volume dos Sons</span>
                  <span className="text-xs text-neutral-400">Intensidade dos alertas e sons de foco</span>
                </div>
                <span className="text-xs font-mono text-neutral-300">
                  {Math.round((settings.volume ?? 0.8) * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.05"
                value={settings.volume ?? 0.8}
                onChange={e => updateSettings({ volume: parseFloat(e.target.value) })}
                className="w-full accent-[#4c82f7]"
              />
            </div>

            <div className="bg-[#1c1c1e] rounded-2xl border border-[#28282b] p-4 flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-white block">Vibração</span>
                <span className="text-xs text-neutral-400">Vibrar ao completar tarefa ou pomodoro</span>
              </div>
              <button
                type="button"
                onClick={() => updateSettings({ vibration: !settings.vibration })}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                  settings.vibration ? 'bg-[#4c82f7]' : 'bg-neutral-700'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.vibration ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </button>
            </div>
          </div>
        )}

        {/* ================= SUB-SCREEN: APARÊNCIA ================= */}
        {activeScreen === 'appearance' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="bg-[#1c1c1e] rounded-2xl border border-[#28282b] p-4 space-y-3">
              <h3 className="text-sm font-bold text-white">Tema de Fundo</h3>
              {[
                { id: 'amoled', label: 'Preto AMOLED Puro (#000000)', desc: 'Recomendado para tela OLED / economia de bateria' },
                { id: 'charcoal', label: 'Cinza Carvão Escuro (#121215)', desc: 'Contraste suave' },
                { id: 'graphite', label: 'Grafite Noturno (#1a1a1f)', desc: 'Tom moderno e elegante' }
              ].map(t => (
                <div
                  key={t.id}
                  onClick={() => updateSettings({ theme: t.id })}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer ${
                    (settings.theme || 'amoled') === t.id 
                      ? 'bg-[#28282e] border-[#4c82f7] text-white' 
                      : 'bg-[#141416] border-[#262629] text-neutral-300'
                  }`}
                >
                  <div>
                    <span className="text-xs font-bold block">{t.label}</span>
                    <span className="text-[11px] text-neutral-400">{t.desc}</span>
                  </div>
                  {(settings.theme || 'amoled') === t.id && <Check className="w-4 h-4 text-[#4c82f7]" />}
                </div>
              ))}
            </div>

            <div className="bg-[#1c1c1e] rounded-2xl border border-[#28282b] p-4 space-y-3">
              <h3 className="text-sm font-bold text-white">Cor de Destaque</h3>
              <div className="flex gap-3">
                {[
                  { color: '#4c82f7', label: 'Azul TickTick' },
                  { color: '#10b981', label: 'Esmeralda' },
                  { color: '#f97316', label: 'Laranja' },
                  { color: '#8b5cf6', label: 'Roxo' },
                  { color: '#ec4899', label: 'Rosa' }
                ].map(c => (
                  <button
                    key={c.color}
                    onClick={() => updateSettings({ accentColor: c.color })}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-transform ${
                      (settings.accentColor || '#4c82f7') === c.color ? 'scale-115 ring-2 ring-white' : ''
                    }`}
                    style={{ backgroundColor: c.color }}
                  >
                    {(settings.accentColor || '#4c82f7') === c.color && <Check className="w-4 h-4 text-white stroke-[3]" />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= SUB-SCREEN: DATA HORA ================= */}
        {activeScreen === 'datetime' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="bg-[#1c1c1e] rounded-2xl border border-[#28282b] p-4 space-y-3">
              <h3 className="text-sm font-bold text-white">Formato de Horário</h3>
              <div className="grid grid-cols-2 gap-2">
                {['24h', '12h'].map(fmt => (
                  <button
                    key={fmt}
                    onClick={() => updateSettings({ timeFormat: fmt })}
                    className={`p-3 rounded-xl border text-xs font-bold transition-colors ${
                      (settings.timeFormat || '24h') === fmt
                        ? 'bg-[#4c82f7] text-white border-[#4c82f7]'
                        : 'bg-[#141416] text-neutral-300 border-[#262629]'
                    }`}
                  >
                    {fmt === '24h' ? '24 Horas (ex: 16:20)' : '12 Horas (ex: 4:20 PM)'}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-[#1c1c1e] rounded-2xl border border-[#28282b] p-4 space-y-3">
              <h3 className="text-sm font-bold text-white">Dia de Início da Semana</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'domingo', label: 'Domingo (Padrão)' },
                  { id: 'segunda', label: 'Segunda-feira' }
                ].map(d => (
                  <button
                    key={d.id}
                    onClick={() => updateSettings({ startOfWeek: d.id })}
                    className={`p-3 rounded-xl border text-xs font-bold transition-colors ${
                      (settings.startOfWeek || 'domingo') === d.id
                        ? 'bg-[#4c82f7] text-white border-[#4c82f7]'
                        : 'bg-[#141416] text-neutral-300 border-[#262629]'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-[#1c1c1e] rounded-2xl border border-[#28282b] p-4 flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-white block">Mostrar números da semana (W)</span>
                <span className="text-xs text-neutral-400">Exibir indicador de semana do ano no calendário</span>
              </div>
              <button
                type="button"
                onClick={() => updateSettings({ showWeekNumbers: !settings.showWeekNumbers })}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                  settings.showWeekNumbers ? 'bg-[#4c82f7]' : 'bg-neutral-700'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.showWeekNumbers ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </button>
            </div>
          </div>
        )}

        {/* ================= SUB-SCREEN: GERAL ================= */}
        {activeScreen === 'general' && (
          <div className="space-y-4 animate-in fade-in">
            {/* Matching screenshot photo_2026-10-28_00-42-39.jpg: Avisar antes de sair */}
            <div className="bg-[#1c1c1e] rounded-2xl border border-[#28282b] p-4 flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-white block">Avisar antes de sair</span>
                <span className="text-xs text-neutral-400">Clique duas vezes no botão voltar para sair</span>
              </div>
              <button
                type="button"
                onClick={() => updateSettings({ confirmExit: !settings.confirmExit })}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                  settings.confirmExit !== false ? 'bg-[#4c82f7]' : 'bg-neutral-700'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.confirmExit !== false ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </button>
            </div>

            <div className="bg-[#1c1c1e] rounded-2xl border border-[#28282b] p-4 space-y-2">
              <span className="text-sm font-semibold text-white block">Posição da Seção Atrasada</span>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'top', label: 'Topo da Lista' },
                  { id: 'bottom', label: 'Final da Lista' }
                ].map(pos => (
                  <button
                    key={pos.id}
                    onClick={() => updateSettings({ delayedSection: pos.id })}
                    className={`p-2.5 rounded-xl border text-xs font-semibold ${
                      (settings.delayedSection || 'top') === pos.id 
                        ? 'bg-[#4c82f7] text-white border-[#4c82f7]' 
                        : 'bg-[#141416] text-neutral-400 border-[#262629]'
                    }`}
                  >
                    {pos.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= SUB-SCREEN: INTEGRAÇÕES & IMPORTAÇÃO ================= */}
        {activeScreen === 'sync' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="bg-[#1c1c1e] rounded-2xl border border-[#28282b] p-4 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-emerald-400" />
                Sincronização TickTick Open API
              </h3>
              <p className="text-xs text-neutral-400">
                Conecte seu token da API oficial do TickTick para importar e sincronizar suas tarefas e listas.
              </p>
              <button
                onClick={() => {
                  onClose();
                  if (onOpenSyncModal) onOpenSyncModal();
                }}
                className="w-full py-2.5 bg-[#4c82f7] hover:bg-[#3b72e7] text-white text-xs font-bold rounded-xl shadow-md"
              >
                Abrir Assistente de Sincronização API
              </button>
            </div>

            <div className="bg-[#1c1c1e] rounded-2xl border border-[#28282b] p-4 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Download className="w-4 h-4 text-blue-400" />
                Backup Completo (Exportar / Importar)
              </h3>
              <p className="text-xs text-neutral-400">
                Salve um arquivo JSON seguro com todas as suas tarefas, hábitos, sessões e configurações.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => {
                    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(exportData());
                    const dlAnchor = document.createElement('a');
                    dlAnchor.setAttribute("href", dataStr);
                    dlAnchor.setAttribute("download", `opentick-backup-${new Date().toISOString().split('T')[0]}.json`);
                    dlAnchor.click();
                  }}
                  className="py-2.5 bg-[#2c2c2e] hover:bg-[#38383c] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 border border-[#3a3a3e]"
                >
                  <Download className="w-4 h-4" />
                  <span>Baixar Backup</span>
                </button>

                <button
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.json';
                    input.onchange = (e) => {
                      const file = e.target.files[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        const success = importData(event.target.result);
                        if (success) alert('Dados restaurados com sucesso!');
                        else alert('Arquivo JSON inválido.');
                      };
                      reader.readAsText(file);
                    };
                    input.click();
                  }}
                  className="py-2.5 bg-[#2c2c2e] hover:bg-[#38383c] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 border border-[#3a3a3e]"
                >
                  <Upload className="w-4 h-4" />
                  <span>Restaurar Backup</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= SUB-SCREEN: FUNÇÕES DE IA ================= */}
        {activeScreen === 'ai' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="bg-[#1c1c1e] rounded-2xl border border-[#28282b] p-4 space-y-3">
              <div className="flex items-center gap-2 text-blue-400">
                <Sparkles className="w-5 h-5" />
                <h3 className="text-sm font-bold text-white">Assistente de Produtividade Gemini</h3>
              </div>
              <p className="text-xs text-neutral-400">
                O OpenTick integra modelos de IA para decomposição automática de tarefas e sugestão de blocos de tempo livres.
              </p>
              <div className="p-3 bg-[#141416] rounded-xl border border-[#262629] text-xs text-neutral-300">
                Status: <span className="text-emerald-400 font-bold">Pronto e Ativo (Local First)</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
