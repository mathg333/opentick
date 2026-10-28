import React, { useState } from 'react';
import { 
  X, 
  RefreshCw, 
  Download, 
  Upload, 
  ExternalLink, 
  CheckCircle, 
  AlertCircle 
} from 'lucide-react';

export default function TickTickSyncModal({ store, isOpen, onClose }) {
  if (!isOpen) return null;

  const { state, setTickTickConfig, importFromTickTick, exportData, importData } = store;

  const [accessToken, setAccessToken] = useState(state.ticktickConfig.accessToken || '');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [activeTab, setActiveTab] = useState('ticktick');
  const [importJsonText, setImportJsonText] = useState('');

  const clientId = state.ticktickConfig.clientId || '1VnPwbqL2WaCGV713q';

  const handleImportTickTick = async () => {
    if (!accessToken.trim()) {
      setStatusMessage({ type: 'error', text: 'Por favor, insira um Access Token do TickTick.' });
      return;
    }

    setLoading(true);
    setStatusMessage(null);
    setTickTickConfig({ accessToken });

    const result = await importFromTickTick(accessToken.trim());
    setLoading(false);

    if (result.success) {
      setStatusMessage({
        type: 'success',
        text: `Sucesso! Foram importados ${result.projectsCount} projetos e ${result.tasksCount} tarefas do TickTick.`
      });
    } else {
      setStatusMessage({
        type: 'error',
        text: `Erro ao conectar com a API do TickTick: ${result.error}. Verifique se o token é recente.`
      });
    }
  };

  const handleDownloadBackup = () => {
    const dataStr = exportData();
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `opentick-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleApplyJsonImport = () => {
    if (!importJsonText.trim()) return;
    const ok = importData(importJsonText.trim());
    if (ok) {
      setStatusMessage({ type: 'success', text: 'Dados restaurados com sucesso!' });
      setImportJsonText('');
    } else {
      setStatusMessage({ type: 'error', text: 'JSON inválido. Verifique o formato do arquivo de backup.' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0c0c0e] border border-[#27272a] rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-5 border-b border-[#222226] flex items-center justify-between bg-[#08080a]">
          <div className="flex items-center gap-2.5">
            <RefreshCw className="w-4 h-4 text-neutral-300" />
            <h2 className="text-sm font-bold text-white">
              Sincronização & Migração TickTick
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-[#222226] bg-[#0c0c0e]">
          <button
            onClick={() => setActiveTab('ticktick')}
            className={`flex-1 py-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'ticktick'
                ? 'border-white text-white bg-[#151518]'
                : 'border-transparent text-neutral-500 hover:text-white'
            }`}
          >
            API do TickTick (Importar Tarefas)
          </button>
          <button
            onClick={() => setActiveTab('backup')}
            className={`flex-1 py-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'backup'
                ? 'border-white text-white bg-[#151518]'
                : 'border-transparent text-neutral-500 hover:text-white'
            }`}
          >
            Backup & Restauração JSON
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {activeTab === 'ticktick' && (
            <div className="space-y-4">
              <div className="p-3 bg-[#151518] border border-[#27272a] rounded-xl text-xs text-neutral-300 space-y-1">
                <p className="font-semibold text-neutral-200">Credenciais Detectadas nas Conversas Anteriores:</p>
                <p className="text-[11px] font-mono text-neutral-400">CLIENT_ID: {clientId}</p>
              </div>

              <div>
                <label className="text-xs text-neutral-300 font-medium block mb-1">
                  Access Token do TickTick
                </label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    placeholder="Cole seu Bearer Access Token aqui..."
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    className="flex-1 bg-[#151518] border border-[#27272a] rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-500 font-mono"
                  />
                  <button
                    onClick={handleImportTickTick}
                    disabled={loading || !accessToken.trim()}
                    className="bg-neutral-200 hover:bg-white disabled:opacity-30 text-black text-xs font-bold px-4 py-2 rounded-xl flex items-center gap-2 transition-colors"
                  >
                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                    Importar
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-neutral-500 space-y-1 pt-1">
                <p>
                  Para gerar um novo Access Token via OAuth do TickTick:
                </p>
                <a
                  href="https://ticktick.com/oauth/authorize"
                  target="_blank"
                  rel="noreferrer"
                  className="text-neutral-300 hover:underline flex items-center gap-1"
                >
                  Abrir Portal de Autorização TickTick OAuth <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="space-y-4">
              <div className="p-4 bg-[#141417] rounded-2xl border border-[#27272a] flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-neutral-200">Exportar Dados Completos</h3>
                  <p className="text-[11px] text-neutral-500">Baixe todas as suas tarefas, hábitos, sessões e calendários em JSON.</p>
                </div>
                <button
                  onClick={handleDownloadBackup}
                  className="bg-[#222226] hover:bg-[#2a2a30] text-white text-xs font-semibold px-3 py-2 rounded-xl flex items-center gap-1.5 transition-colors border border-[#2c2c32]"
                >
                  <Download className="w-3.5 h-3.5" /> Baixar Backup
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-neutral-300 font-medium block">
                  Restaurar Backup JSON
                </label>
                <textarea
                  rows={4}
                  placeholder="Cole aqui o conteúdo do backup JSON..."
                  value={importJsonText}
                  onChange={(e) => setImportJsonText(e.target.value)}
                  className="w-full bg-[#151518] border border-[#27272a] rounded-xl p-3 text-xs text-white placeholder-neutral-600 font-mono focus:outline-none focus:border-neutral-500"
                />
                <button
                  onClick={handleApplyJsonImport}
                  disabled={!importJsonText.trim()}
                  className="w-full bg-white hover:bg-neutral-200 disabled:opacity-20 text-black text-xs font-bold py-2 rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  <Upload className="w-4 h-4" /> Restaurar Todos os Dados
                </button>
              </div>
            </div>
          )}

          {/* Status Alert */}
          {statusMessage && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30'
                : 'bg-rose-950/40 text-rose-300 border border-rose-500/30'
            }`}>
              {statusMessage.type === 'success' ? (
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
