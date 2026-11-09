import React, { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle2, ChevronRight, Bell, Sparkles, X } from 'lucide-react';
import { 
  checkAlarmPermissions, 
  requestOverlayPermission, 
  requestExactAlarmPermission, 
  requestFullScreenIntentPermission,
  requestIgnoreBatteryOptimizations,
  isNativeAndroid
} from '../utils/nativeAlarm';

export default function AlarmPermissionModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [permissions, setPermissions] = useState({
    overlayGranted: true,
    exactAlarmGranted: true,
    fullScreenIntentGranted: true,
    batteryOptimizationIgnored: true
  });

  const check = async () => {
    if (!isNativeAndroid()) return;
    try {
      const perms = await checkAlarmPermissions();
      setPermissions(perms);
      // If overlay is missing, show modal prominently on startup
      if (!perms.overlayGranted || perms.fullScreenIntentGranted === false) {
        // Only show if user hasn't explicitly dismissed it in this session
        const dismissed = sessionStorage.getItem('opentick_perm_modal_dismissed');
        if (!dismissed) {
          setIsOpen(true);
        }
      }
    } catch (e) {
      console.warn('Error checking permissions:', e);
    }
  };

  useEffect(() => {
    check();
    // Re-check when app regains focus (e.g. after user returns from Android Settings)
    window.addEventListener('focus', check);
    return () => window.removeEventListener('focus', check);
  }, []);

  const handleGrantOverlay = () => {
    requestOverlayPermission();
  };

  const handleGrantExact = () => {
    requestExactAlarmPermission();
  };

  const handleGrantFullScreen = () => {
    requestFullScreenIntentPermission();
  };

  const handleClose = () => {
    sessionStorage.setItem('opentick_perm_modal_dismissed', 'true');
    setIsOpen(false);
  };

  if (!isOpen) return null;

  const isAllGranted = permissions.overlayGranted && 
                       permissions.exactAlarmGranted && 
                       (permissions.fullScreenIntentGranted !== false);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-[#141416] border border-[#facc15]/30 rounded-3xl w-full max-w-md p-6 text-neutral-100 shadow-2xl relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-20 bg-[#facc15]/20 blur-3xl pointer-events-none rounded-full" />

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-white rounded-full bg-neutral-800/60 hover:bg-neutral-800 transition-colors"
          title="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Icon & Title */}
        <div className="flex items-center gap-3.5 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#facc15] to-[#ff9e3b] p-0.5 shadow-lg shadow-[#facc15]/25 flex items-center justify-center">
            <div className="w-full h-full bg-[#121214] rounded-[14px] flex items-center justify-center text-[#facc15]">
              <Bell className="w-6 h-6 animate-pulse" />
            </div>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              Tela de Alarme & Bloqueio
            </h2>
            <p className="text-xs text-neutral-400">Configuração rápida do Android</p>
          </div>
        </div>

        {/* Explanation Message */}
        <p className="text-sm text-neutral-300 leading-relaxed mb-5">
          Para que o alarme toque e <strong className="text-white">abra a tela cheia com o relógio e os botões</strong> (mesmo na tela de bloqueio ou enquanto você usa outro app), o Android da Samsung precisa da sua autorização abaixo:
        </p>

        {/* Permission List */}
        <div className="space-y-3 mb-6">
          {/* Permission 1: Overlay (Aparecer sobre outros apps) */}
          <div className="p-3.5 rounded-2xl bg-[#1c1c20] border border-neutral-800 flex items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5">
                {permissions.overlayGranted ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <ShieldAlert className="w-5 h-5 text-[#facc15]" />
                )}
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Aparecer sobre outros apps</h4>
                <p className="text-xs text-neutral-400">Abre a tela do alarme por cima do bloqueio e outros apps</p>
              </div>
            </div>
            {!permissions.overlayGranted ? (
              <button
                onClick={handleGrantOverlay}
                className="px-3 py-1.5 bg-[#facc15] hover:bg-[#ff7d1a] text-black font-bold text-xs rounded-xl shadow-md active:scale-95 transition-all shrink-0 flex items-center gap-1"
              >
                Ativar <ChevronRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <span className="text-[11px] text-emerald-400 font-bold px-2 py-1 bg-emerald-500/10 rounded-lg shrink-0">
                ✓ Ativo
              </span>
            )}
          </div>

          {/* Permission 2: Full Screen Notifications (Android 14) */}
          {permissions.fullScreenIntentGranted === false && (
            <div className="p-3.5 rounded-2xl bg-[#1c1c20] border border-neutral-800 flex items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <ShieldAlert className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Avisos em Tela Cheia</h4>
                  <p className="text-xs text-neutral-400">Permissão do Android 14 para tela de alarme</p>
                </div>
              </div>
              <button
                onClick={handleGrantFullScreen}
                className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs rounded-xl shadow-md active:scale-95 transition-all shrink-0 flex items-center gap-1"
              >
                Ativar <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Permission 3: Exact Alarm */}
          {!permissions.exactAlarmGranted && (
            <div className="p-3.5 rounded-2xl bg-[#1c1c20] border border-neutral-800 flex items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <ShieldAlert className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Alarmes e Lembretes</h4>
                  <p className="text-xs text-neutral-400">Garante o horário exato ao minuto</p>
                </div>
              </div>
              <button
                onClick={handleGrantExact}
                className="px-3 py-1.5 bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-xs rounded-xl shadow-md active:scale-95 transition-all shrink-0 flex items-center gap-1"
              >
                Ativar <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Permission 4: Battery Optimization Whitelist (Samsung Doze Mode Protection) */}
          {!permissions.batteryOptimizationIgnored && (
            <div className="p-3.5 rounded-2xl bg-[#1c1c20] border border-neutral-800 flex items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  <ShieldAlert className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Bateria Sem Restrição</h4>
                  <p className="text-xs text-neutral-400">Impede a Samsung de suspender o despertador em segundo plano</p>
                </div>
              </div>
              <button
                onClick={requestIgnoreBatteryOptimizations}
                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-black font-bold text-xs rounded-xl shadow-md active:scale-95 transition-all shrink-0 flex items-center gap-1"
              >
                Ativar <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Bottom Done Button */}
        <button
          onClick={handleClose}
          className="w-full py-3.5 bg-gradient-to-r from-neutral-800 to-neutral-700 hover:from-neutral-700 hover:to-neutral-600 text-white font-bold text-sm rounded-2xl transition-all active:scale-[0.98]"
        >
          {isAllGranted ? 'Pronto! Tudo Configurado' : 'Entendi, fechar aviso'}
        </button>
      </div>
    </div>
  );
}
