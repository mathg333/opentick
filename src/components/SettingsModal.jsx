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
  X
} from 'lucide-react';

export default function SettingsModal({ isOpen, onClose, store, onOpenSyncModal }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#000000] flex flex-col h-full overflow-hidden select-none animate-in fade-in">
      {/* Settings Top Bar */}
      <div className="p-4 flex items-center gap-3 border-b border-[#1c1c1e] bg-[#000000] shrink-0">
        <button
          onClick={onClose}
          className="p-1.5 text-neutral-300 hover:text-white rounded-lg active:bg-neutral-800"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-white tracking-tight">
          Configurações
        </h1>
      </div>

      {/* Settings Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 max-w-lg mx-auto w-full pb-16">
        {/* Profile Card */}
        <div className="flex items-center justify-between p-3 rounded-2xl bg-[#1c1c1e] border border-[#28282b]">
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
          <ChevronRight className="w-5 h-5 text-neutral-500" />
        </div>

        {/* Premium Status Card */}
        <div className="p-4 rounded-2xl bg-[#1c1c1e] border border-[#28282b] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Conta Premium Desbloqueada</h3>
              <p className="text-xs text-neutral-400">Calendário, Matriz, Hábitos e Pomodoro 100% Free</p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded-xl border border-emerald-800">
            Ativo
          </span>
        </div>

        {/* Navigation / Tab Bar Card */}
        <div className="rounded-2xl bg-[#1c1c1e] border border-[#28282b] p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Layers className="w-5 h-5 text-blue-400" />
            <span className="text-sm font-semibold text-white">Barra de Abas</span>
          </div>
          <ChevronRight className="w-5 h-5 text-neutral-500" />
        </div>

        {/* Main Options Group Card */}
        <div className="rounded-2xl bg-[#1c1c1e] border border-[#28282b] overflow-hidden divide-y divide-[#262629]">
          <div className="p-3.5 flex items-center justify-between hover:bg-[#222226] cursor-pointer">
            <div className="flex items-center gap-3">
              <Palette className="w-5 h-5 text-blue-400" />
              <div>
                <span className="text-sm font-semibold text-white">Aparência</span>
                <p className="text-[11px] text-neutral-400">Tema Escuro AMOLED (#000000)</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-neutral-500" />
          </div>

          <div className="p-3.5 flex items-center justify-between hover:bg-[#222226] cursor-pointer">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-blue-400" />
              <div>
                <span className="text-sm font-semibold text-white">Data hora</span>
                <p className="text-[11px] text-neutral-400">Formato 24h, Início no Domingo</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-neutral-500" />
          </div>

          <div className="p-3.5 flex items-center justify-between hover:bg-[#222226] cursor-pointer">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-blue-400" />
              <span className="text-sm font-semibold text-white">Sons e Notificações</span>
            </div>
            <ChevronRight className="w-5 h-5 text-neutral-500" />
          </div>

          <div className="p-3.5 flex items-center justify-between hover:bg-[#222226] cursor-pointer">
            <div className="flex items-center gap-3">
              <Smartphone className="w-5 h-5 text-blue-400" />
              <span className="text-sm font-semibold text-white">Widgets</span>
            </div>
            <ChevronRight className="w-5 h-5 text-neutral-500" />
          </div>

          <div className="p-3.5 flex items-center justify-between hover:bg-[#222226] cursor-pointer">
            <div className="flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-blue-400" />
              <span className="text-sm font-semibold text-white">Funções de IA</span>
            </div>
            <ChevronRight className="w-5 h-5 text-neutral-500" />
          </div>

          <div className="p-3.5 flex items-center justify-between hover:bg-[#222226] cursor-pointer">
            <div className="flex items-center gap-3">
              <SettingsIcon className="w-5 h-5 text-blue-400" />
              <span className="text-sm font-semibold text-white">Geral</span>
            </div>
            <ChevronRight className="w-5 h-5 text-neutral-500" />
          </div>
        </div>

        {/* Integration and Sync Card */}
        <div 
          onClick={() => {
            onClose();
            if (onOpenSyncModal) onOpenSyncModal();
          }}
          className="rounded-2xl bg-[#1c1c1e] border border-[#28282b] p-3.5 flex items-center justify-between hover:bg-[#222226] cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <RefreshCw className="w-5 h-5 text-emerald-400" />
            <div>
              <span className="text-sm font-semibold text-white">Integrações e Importação</span>
              <p className="text-[11px] text-neutral-400">Sincronizar com TickTick API ou Backup JSON</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-neutral-500" />
        </div>
      </div>
    </div>
  );
}
