import React, { useState, useEffect, useRef } from 'react';
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
  Square,
  Download,
  Upload,
  RotateCcw,
  Music,
  Trash2,
  AlertTriangle
} from 'lucide-react';
import { soundManager } from '../utils/audio';
import { saveCustomAudioFile, getCustomAudioFile, removeCustomAudioFile } from '../utils/audioStorage';
import { requestOverlayPermission, requestExactAlarmPermission } from '../utils/nativeAlarm';

export default function SettingsModal({ 
  isOpen, 
  onClose, 
  store, 
  onOpenSyncModal,
  onTriggerTestAlarm
}) {
  const { state, updateSettings, exportData, importData } = store;
  const settings = state.settings || {};

  const [activeScreen, setActiveScreen] = useState('main'); // 'main', 'appearance', 'datetime', 'sound', 'tabs', 'ai', 'general', 'sync'
  const [testPlaying, setTestPlaying] = useState(false);
  const [customAudio, setCustomAudio] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Load custom audio from IndexedDB when modal opens
  useEffect(() => {
    if (isOpen) {
      getCustomAudioFile().then(record => {
        if (record) {
          setCustomAudio(record);
        }
      });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestSound = (soundId) => {
    if (testPlaying) {
      soundManager.stopContinuousAlarm();
      setTestPlaying(false);
      return;
    }

    setTestPlaying(true);
    if (soundId === 'custom' && customAudio?.dataUrl) {
      soundManager.startContinuousAlarm({
        sound: 'custom',
        customAudioUrl: customAudio.dataUrl,
        volume: settings.volume ?? 0.8,
        durationMinutes: 5,
        vibration: settings.vibration ?? true,
        onStop: () => setTestPlaying(false)
      });
    } else {
      soundManager.startContinuousAlarm({
        sound: soundId,
        volume: settings.volume ?? 0.8,
        durationMinutes: 5,
        vibration: settings.vibration ?? true,
        onStop: () => setTestPlaying(false)
      });
    }
  };

  const handleStopTest = () => {
    soundManager.stopContinuousAlarm();
    setTestPlaying(false);
  };

  const handleAudioFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const saved = await saveCustomAudioFile(file);
      setCustomAudio(saved);
      updateSettings({ sound: 'custom' });
      alert(`Áudio "${file.name}" carregado com sucesso!`);
    } catch (err) {
      console.error('Falha ao salvar áudio', err);
      alert('Erro ao carregar o áudio. Tente outro arquivo (.mp3, .wav, .m4a).');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveCustomAudio = async () => {
    if (confirm('Deseja remover seu áudio personalizado?')) {
      await removeCustomAudioFile();
      setCustomAudio(null);
      if (settings.sound === 'custom') {
        updateSettings({ sound: 'radar' });
      }
      handleStopTest();
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    if (mb >= 1) return `${mb.toFixed(1)} MB`;
    return `${Math.round(bytes / 1024)} KB`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#000000] flex flex-col h-full overflow-hidden select-none animate-in fade-in">
      {/* Settings Top Bar */}
      <div className="p-4 flex items-center justify-between border-b border-[#1c1c1e] bg-[#000000] shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              handleStopTest();
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

        <button 
          onClick={() => {
            handleStopTest();
            onClose();
          }} 
          className="p-1.5 text-neutral-400 hover:text-white"
        >
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
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-emerald-600 via-amber-600 to-[#ff6b00] p-0.5">
                  <div className="w-full h-full rounded-full bg-[#1c1c1e] flex items-center justify-center font-bold text-white text-base">
                    🐸
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-white">Mathx</span>
                    <span className="text-[10px] bg-[#ff6b00]/20 text-[#ff6b00] font-bold px-1.5 py-0.2 rounded border border-[#ff6b00]/30">
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
                <div className="w-9 h-9 rounded-full bg-[#ff6b00]/20 text-[#ff6b00] flex items-center justify-center font-bold">
                  <Crown className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Conta Premium Completa</h3>
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
                <Layers className="w-5 h-5 text-[#ff6b00]" />
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
                  <Palette className="w-5 h-5 text-[#ff6b00]" />
                  <div>
                    <span className="text-sm font-semibold text-white">Aparência</span>
                    <p className="text-[11px] text-neutral-400">Tema AMOLED, Laranja TickTick e Estilo</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-neutral-500" />
              </div>

              <div 
                onClick={() => setActiveScreen('datetime')}
                className="p-3.5 flex items-center justify-between hover:bg-[#222226] cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-[#ff6b00]" />
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
                  <Bell className="w-5 h-5 text-[#ff6b00]" />
                  <div>
                    <span className="text-sm font-semibold text-white">Sons e Notificações</span>
                    <p className="text-[11px] text-neutral-400">
                      {settings.alarmMode === 'short' ? 'Notificação Curta' : 'Alarme Contínuo 5 Minutos'} • {settings.sound === 'custom' ? 'Áudio do Celular' : settings.sound || 'Radar'}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-neutral-500" />
              </div>

              <div 
                onClick={() => setActiveScreen('ai')}
                className="p-3.5 flex items-center justify-between hover:bg-[#222226] cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-[#ff6b00]" />
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
                  <SettingsIcon className="w-5 h-5 text-[#ff6b00]" />
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

        {/* ================= SUB-SCREEN: SONS E NOTIFICAÇÕES (ALARMES LONGOS E ÁUDIO DO CELULAR) ================= */}
        {activeScreen === 'sound' && (
          <div className="space-y-4 animate-in fade-in">
            {/* LOCK SCREEN & OVERLAY PERMISSIONS CARD */}
            <div className="bg-[#1c1c1e] rounded-2xl border border-[#28282b] p-4 space-y-3 shadow-xl">
              <div className="flex items-center gap-2.5 text-white">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#ff6b00] to-[#ea580c] flex items-center justify-center text-white shadow-md shadow-[#ff6b00]/30 shrink-0">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Tela de Bloqueio & Sobre Outros Apps</h3>
                  <span className="text-[10px] text-emerald-400 font-bold block">
                    ✓ Despertador Nativo Android Ativado
                  </span>
                </div>
              </div>
              <p className="text-xs text-neutral-400">
                O alarme acorda a tela do celular mesmo bloqueado e sobrepõe qualquer aplicativo em uso (WhatsApp, YouTube, jogos, etc.).
              </p>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={requestOverlayPermission}
                  className="py-2.5 px-3 bg-[#141416] hover:bg-[#202024] border border-[#ff6b00]/50 text-[#ff6b00] rounded-xl text-xs font-bold text-center active:scale-95 transition-transform"
                >
                  Permitir Sobre Apps
                </button>
                <button
                  type="button"
                  onClick={requestExactAlarmPermission}
                  className="py-2.5 px-3 bg-[#141416] hover:bg-[#202024] border border-emerald-500/50 text-emerald-400 rounded-xl text-xs font-bold text-center active:scale-95 transition-transform"
                >
                  Permitir Alarme Exato
                </button>
              </div>
            </div>

            {/* Mode: Contínuo vs Curto */}
            <div className="bg-[#1c1c1e] rounded-2xl border border-[#28282b] p-4 space-y-3">
              <span className="text-sm font-bold text-white block">Estilo do Toque</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => updateSettings({ alarmMode: 'continuous' })}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    (settings.alarmMode !== 'short')
                      ? 'bg-[#28282e] border-[#ff6b00] text-white shadow-md'
                      : 'bg-[#141416] border-[#262629] text-neutral-400'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-xs font-bold text-white">Alarme Contínuo</span>
                    {settings.alarmMode !== 'short' && <Check className="w-4 h-4 text-[#ff6b00]" />}
                  </div>
                  <span className="text-[10px] text-neutral-400 leading-tight">
                    Toca por até 5 minutos como despertador até você parar
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => updateSettings({ alarmMode: 'short' })}
                  className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    (settings.alarmMode === 'short')
                      ? 'bg-[#28282e] border-[#ff6b00] text-white shadow-md'
                      : 'bg-[#141416] border-[#262629] text-neutral-400'
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-xs font-bold text-white">Notificação Curta</span>
                    {settings.alarmMode === 'short' && <Check className="w-4 h-4 text-[#ff6b00]" />}
                  </div>
                  <span className="text-[10px] text-neutral-400 leading-tight">
                    Apenas 1 toque rápido de alerta sonoro
                  </span>
                </button>
              </div>
            </div>

            {/* CUSTOM PHONE AUDIO UPLOAD */}
            <div className="bg-[#1c1c1e] rounded-2xl border border-[#28282b] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                    <Music className="w-4 h-4 text-[#ff6b00]" />
                    Áudio Personalizado do Celular
                  </h3>
                  <p className="text-xs text-neutral-400">
                    Use qualquer música ou som longo (ex: 5 min) do seu aparelho
                  </p>
                </div>
              </div>

              {/* Upload Input */}
              <input
                type="file"
                ref={fileInputRef}
                accept="audio/*"
                onChange={handleAudioFileUpload}
                className="hidden"
              />

              {customAudio ? (
                <div className={`p-3 rounded-xl border flex flex-col gap-2 transition-all ${
                  settings.sound === 'custom' 
                    ? 'bg-[#28282e] border-[#ff6b00]' 
                    : 'bg-[#141416] border-[#262629]'
                }`}>
                  <div className="flex items-center justify-between">
                    <div 
                      onClick={() => updateSettings({ sound: 'custom' })}
                      className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[#ff6b00]/20 text-[#ff6b00] flex items-center justify-center shrink-0">
                        <Music className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <span className="text-xs font-bold text-white block truncate">
                          {customAudio.name}
                        </span>
                        <span className="text-[10px] text-neutral-400">
                          {formatFileSize(customAudio.size)} • Áudio Ativo
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          if (testPlaying && settings.sound === 'custom') {
                            handleStopTest();
                          } else {
                            updateSettings({ sound: 'custom' });
                            handleTestSound('custom');
                          }
                        }}
                        className="px-2.5 py-1.5 bg-[#ff6b00] hover:bg-[#ea580c] text-white text-xs font-bold rounded-lg flex items-center gap-1 shadow-md"
                      >
                        {testPlaying && settings.sound === 'custom' ? (
                          <>
                            <Square className="w-3 h-3 fill-current" />
                            <span>Parar</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3 h-3 fill-current" />
                            <span>Ouvir</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={handleRemoveCustomAudio}
                        className="p-1.5 text-neutral-400 hover:text-rose-400 rounded-lg"
                        title="Remover"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#262629] flex items-center justify-between text-[11px]">
                    <span className="text-neutral-400">Definido como som principal do alarme</span>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-[#ff6b00] font-semibold hover:underline"
                    >
                      Trocar Arquivo
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3.5 px-4 bg-[#141416] hover:bg-[#202024] border border-dashed border-[#ff6b00]/60 rounded-xl flex items-center justify-center gap-2 text-xs font-bold text-[#ff6b00] transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <span>{isUploading ? 'Carregando áudio...' : 'Selecionar Áudio / MP3 do Celular'}</span>
                </button>
              )}
            </div>

            {/* PRE-INSTALLED CONTINUOUS ALARMS & RINGTONES */}
            <div className="bg-[#1c1c1e] rounded-2xl border border-[#28282b] p-4 space-y-3">
              <h3 className="text-sm font-bold text-white">Toques e Alarmes Pré-instalados</h3>
              <div className="space-y-2">
                {[
                  { id: 'radar', label: 'Alarme Radar Contínuo', desc: 'Pulsos de alarme potentes e energéticos' },
                  { id: 'digital', label: 'Despertador Digital Clássico', desc: 'Série de bips eletrônicos em loop' },
                  { id: 'siren', label: 'Sirene de Emergência', desc: 'Alerta contínuo oscilante de alta atenção' },
                  { id: 'bell', label: 'Sino Despertador', desc: 'Batidas rítmicas de sino' },
                  { id: 'chime', label: 'Chime Melódico', desc: 'Melodia relaxante suave' },
                  { id: 'none', label: 'Silencioso / Apenas Vibração', desc: 'Sem reprodução de áudio' }
                ].map(item => {
                  const isSelected = (settings.sound || 'radar') === item.id;
                  const isThisPlaying = testPlaying && (settings.sound || 'radar') === item.id;

                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        updateSettings({ sound: item.id });
                        if (item.id !== 'none') {
                          handleStopTest();
                        }
                      }}
                      className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-[#28282e] border-[#ff6b00] text-white shadow-md' 
                          : 'bg-[#141416] border-[#262629] text-neutral-300 hover:bg-[#1a1a1e]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Volume2 className={`w-4 h-4 ${isSelected ? 'text-[#ff6b00]' : 'text-neutral-500'}`} />
                        <div>
                          <span className="text-xs font-semibold block">{item.label}</span>
                          <span className="text-[10px] text-neutral-400">{item.desc}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {item.id !== 'none' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateSettings({ sound: item.id });
                              handleTestSound(item.id);
                            }}
                            className={`p-1 rounded-lg text-xs flex items-center gap-1 px-2.5 py-1 border transition-colors ${
                              isThisPlaying
                                ? 'bg-[#ff6b00] text-white border-[#ff6b00]'
                                : 'bg-[#1e1e22] text-neutral-300 hover:text-white border-[#323236]'
                            }`}
                          >
                            {isThisPlaying ? (
                              <>
                                <Square className="w-3 h-3 fill-current" />
                                <span>Parar</span>
                              </>
                            ) : (
                              <>
                                <Play className="w-3 h-3 fill-current" />
                                <span>Testar</span>
                              </>
                            )}
                          </button>
                        )}
                        {isSelected && <Check className="w-4 h-4 text-[#ff6b00] stroke-[2.5]" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* DURATION PRESET (5 MINUTES) */}
            <div className="bg-[#1c1c1e] rounded-2xl border border-[#28282b] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-semibold text-white block">Duração Máxima do Alarme</span>
                  <span className="text-xs text-neutral-400">Tempo que o som tocará até auto-desligar</span>
                </div>
                <span className="text-xs font-mono text-[#ff6b00] font-bold">
                  {settings.alarmDuration || 5} Minutos
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {[1, 3, 5, 10].map(mins => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => updateSettings({ alarmDuration: mins })}
                    className={`py-2 text-xs font-bold rounded-xl border transition-colors ${
                      (settings.alarmDuration || 5) === mins
                        ? 'bg-[#ff6b00] text-white border-[#ff6b00]'
                        : 'bg-[#141416] text-neutral-400 border-[#262629]'
                    }`}
                  >
                    {mins} min
                  </button>
                ))}
              </div>
            </div>

            {/* VOLUME SLIDER */}
            <div className="bg-[#1c1c1e] rounded-2xl border border-[#28282b] p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-semibold text-white block">Volume do Alarme</span>
                  <span className="text-xs text-neutral-400">Intensidade sonora dos alertas</span>
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
                className="w-full accent-[#ff6b00]"
              />
            </div>

            {/* VIBRATION TOGGLE */}
            <div className="bg-[#1c1c1e] rounded-2xl border border-[#28282b] p-4 flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-white block">Vibração Contínua do Celular</span>
                <span className="text-xs text-neutral-400">Vibrar vigorosamente junto com o som do alarme</span>
              </div>
              <button
                type="button"
                onClick={() => updateSettings({ vibration: !settings.vibration })}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                  settings.vibration !== false ? 'bg-[#ff6b00]' : 'bg-neutral-700'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.vibration !== false ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {/* FULL SCREEN ALARM TEST BUTTON */}
            <button
              type="button"
              onClick={() => {
                handleStopTest();
                if (onTriggerTestAlarm) {
                  onTriggerTestAlarm(settings.sound || (customAudio ? 'custom' : 'radar'));
                }
              }}
              className="w-full py-3.5 bg-gradient-to-r from-[#ff6b00] to-[#ea580c] hover:opacity-95 text-white font-bold text-xs uppercase tracking-wider rounded-2xl shadow-xl flex items-center justify-center gap-2 active:scale-98 transition-all"
            >
              <Bell className="w-4 h-4 animate-bounce" />
              <span>Disparar Alarme de Teste em Tela Cheia</span>
            </button>
          </div>
        )}

        {/* ================= SUB-SCREEN: APARÊNCIA ================= */}
        {activeScreen === 'appearance' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="bg-[#1c1c1e] rounded-2xl border border-[#28282b] p-4 space-y-3">
              <h3 className="text-sm font-bold text-white">Tema de Fundo</h3>
              {[
                { id: 'amoled', label: 'Preto AMOLED Puro (#000000)', desc: 'Recomendado para tela OLED / economia máxima de bateria' },
                { id: 'charcoal', label: 'Cinza Carvão Escuro (#121215)', desc: 'Contraste suave' },
                { id: 'graphite', label: 'Grafite Noturno (#1a1a1f)', desc: 'Tom moderno e elegante' }
              ].map(t => (
                <div
                  key={t.id}
                  onClick={() => updateSettings({ theme: t.id })}
                  className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer ${
                    (settings.theme || 'amoled') === t.id 
                      ? 'bg-[#28282e] border-[#ff6b00] text-white shadow-md' 
                      : 'bg-[#141416] border-[#262629] text-neutral-300'
                  }`}
                >
                  <div>
                    <span className="text-xs font-bold block">{t.label}</span>
                    <span className="text-[11px] text-neutral-400">{t.desc}</span>
                  </div>
                  {(settings.theme || 'amoled') === t.id && <Check className="w-4 h-4 text-[#ff6b00]" />}
                </div>
              ))}
            </div>

            <div className="bg-[#1c1c1e] rounded-2xl border border-[#28282b] p-4 space-y-3">
              <h3 className="text-sm font-bold text-white">Cor de Destaque</h3>
              <div className="flex gap-3">
                {[
                  { color: '#ff6b00', label: 'Laranja TickTick Pop' },
                  { color: '#4c82f7', label: 'Azul Clássico' },
                  { color: '#10b981', label: 'Esmeralda' },
                  { color: '#8b5cf6', label: 'Roxo' },
                  { color: '#ec4899', label: 'Rosa' }
                ].map(c => (
                  <button
                    key={c.color}
                    onClick={() => updateSettings({ accentColor: c.color })}
                    className={`w-9 h-9 rounded-full flex items-center justify-center transition-transform ${
                      (settings.accentColor || '#ff6b00') === c.color ? 'scale-115 ring-2 ring-white' : ''
                    }`}
                    style={{ backgroundColor: c.color }}
                  >
                    {(settings.accentColor || '#ff6b00') === c.color && <Check className="w-4 h-4 text-white stroke-[3]" />}
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
                        ? 'bg-[#ff6b00] text-white border-[#ff6b00]'
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
                        ? 'bg-[#ff6b00] text-white border-[#ff6b00]'
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
                  settings.showWeekNumbers ? 'bg-[#ff6b00]' : 'bg-neutral-700'
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
            <div className="bg-[#1c1c1e] rounded-2xl border border-[#28282b] p-4 flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-white block">Avisar antes de sair</span>
                <span className="text-xs text-neutral-400">Clique duas vezes no botão voltar para sair</span>
              </div>
              <button
                type="button"
                onClick={() => updateSettings({ confirmExit: !settings.confirmExit })}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                  settings.confirmExit !== false ? 'bg-[#ff6b00]' : 'bg-neutral-700'
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
                        ? 'bg-[#ff6b00] text-white border-[#ff6b00]' 
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
                className="w-full py-2.5 bg-[#ff6b00] hover:bg-[#ea580c] text-white text-xs font-bold rounded-xl shadow-md"
              >
                Abrir Assistente de Sincronização API
              </button>
            </div>

            <div className="bg-[#1c1c1e] rounded-2xl border border-[#28282b] p-4 space-y-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Download className="w-4 h-4 text-[#ff6b00]" />
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
              <div className="flex items-center gap-2 text-[#ff6b00]">
                <Sparkles className="w-5 h-5" />
                <h3 className="text-sm font-bold text-white">Assistente de Produtividade Gemini</h3>
              </div>
              <p className="text-xs text-neutral-400">
                O OpenTick integra inteligência local-first para decomposição automática de tarefas e sugestão de blocos de tempo livres.
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
