import React, { useState, useEffect } from 'react';
import { ShieldAlert, CheckCircle2, ChevronRight, X, AlarmClock, Layers, BatteryCharging, Bell } from 'lucide-react';
import {
  checkNativeAlarmPermissions,
  requestNotificationPermission,
  requestExactAlarmPermission,
  requestOverlayPermission,
  requestFullScreenIntentPermission,
  requestIgnoreBatteryOptimization,
  isNativeAndroid
} from '../utils/nativeAlarm';

export default function AlarmPermissionModal({ isOpen, onClose }) {
  const [permissions, setPermissions] = useState({
    exactAlarmGranted: true,
    overlayGranted: true,
    fullScreenIntentGranted: true,
    notificationsGranted: true,
    batteryOptimized: false
  });

  const refreshPermissions = async () => {
    const status = await checkNativeAlarmPermissions();
    if (status) {
      setPermissions({
        exactAlarmGranted: status.exactAlarm ?? status.exactAlarmGranted ?? true,
        overlayGranted: status.overlay ?? status.overlayGranted ?? true,
        fullScreenIntentGranted: status.fullScreenIntent ?? status.fullScreenIntentGranted ?? true,
        notificationsGranted: status.notifications ?? true,
        batteryOptimized: status.batteryOptimized ?? false
      });
    }
  };

  useEffect(() => {
    if (!isOpen || !isNativeAndroid()) return;
    refreshPermissions();

    const handleResume = () => {
      setTimeout(refreshPermissions, 500);
    };
    window.addEventListener('focus', handleResume);
    document.addEventListener('visibilitychange', handleResume);
    return () => {
      window.removeEventListener('focus', handleResume);
      document.removeEventListener('visibilitychange', handleResume);
    };
  }, [isOpen]);

  const handleGrantNotifications = async () => {
    await requestNotificationPermission();
    setTimeout(refreshPermissions, 500);
  };

  const handleGrantOverlay = async () => {
    await requestOverlayPermission();
    setTimeout(refreshPermissions, 800);
  };

  const handleGrantFullScreen = async () => {
    await requestFullScreenIntentPermission();
    setTimeout(refreshPermissions, 800);
  };

  const handleGrantExactAlarm = async () => {
    await requestExactAlarmPermission();
    setTimeout(refreshPermissions, 800);
  };

  const handleIgnoreBattery = async () => {
    await requestIgnoreBatteryOptimization();
    setTimeout(refreshPermissions, 800);
  };

  if (!isOpen) return null;

  const isAllGranted =
    permissions.notificationsGranted !== false &&
    permissions.overlayGranted &&
    permissions.exactAlarmGranted &&
    permissions.fullScreenIntentGranted !== false;

  return (
    <div className="fixed inset-0 z-[120] bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#121215] border border-white/15 rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#0e0e11]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-[#18181c] border border-[#facc15]/40 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4 text-[#facc15]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Permissões de Alarme</h3>
              <p className="text-[11px] text-neutral-400">Para despertar mesmo com o app fechado</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1.5 rounded-md bg-white/5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-2.5 max-h-[65vh] overflow-y-auto">
          <p className="text-xs text-neutral-300 leading-relaxed">
            Para o despertador tocar e abrir na tela bloqueada do Android:
          </p>

          {permissions.notificationsGranted === false && (
            <div className="p-3 rounded-md bg-[#18181c] border border-white/10 flex items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <Bell className="w-4 h-4 text-[#facc15] mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-white">Permitir Notificações</h4>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Obrigatório no Android 13+ para exibir alertas de alarme.
                  </p>
                </div>
              </div>
              <button
                onClick={handleGrantNotifications}
                className="px-2.5 py-1.5 bg-[#facc15]/15 border border-[#facc15]/55 text-[#facc15] font-bold text-xs rounded-md shrink-0 flex items-center gap-1"
              >
                Ativar <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {!permissions.overlayGranted && (
            <div className="p-3 rounded-md bg-[#18181c] border border-white/10 flex items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <Layers className="w-4 h-4 text-[#facc15] mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-white">Sobrepor Outros Apps</h4>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Exibe a tela de alarme acima de qualquer aplicativo aberto.
                  </p>
                </div>
              </div>
              <button
                onClick={handleGrantOverlay}
                className="px-2.5 py-1.5 bg-[#facc15]/15 border border-[#facc15]/55 text-[#facc15] font-bold text-xs rounded-md shrink-0 flex items-center gap-1"
              >
                Ativar <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {permissions.fullScreenIntentGranted === false && (
            <div className="p-3 rounded-md bg-[#18181c] border border-white/10 flex items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlarmClock className="w-4 h-4 text-[#facc15] mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-white">Alerta em Tela Cheia (Android 14+)</h4>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Acende a tela de bloqueio igual ao despertador do sistema.
                  </p>
                </div>
              </div>
              <button
                onClick={handleGrantFullScreen}
                className="px-2.5 py-1.5 bg-[#facc15]/15 border border-[#facc15]/55 text-[#facc15] font-bold text-xs rounded-md shrink-0 flex items-center gap-1"
              >
                Ativar <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {!permissions.exactAlarmGranted && (
            <div className="p-3 rounded-md bg-[#18181c] border border-white/10 flex items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlarmClock className="w-4 h-4 text-[#facc15] mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-white">Alarmes e Lembretes Exatos</h4>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Dispara o despertador exatamente no segundo marcado.
                  </p>
                </div>
              </div>
              <button
                onClick={handleGrantExactAlarm}
                className="px-2.5 py-1.5 bg-[#facc15]/15 border border-[#facc15]/55 text-[#facc15] font-bold text-xs rounded-md shrink-0 flex items-center gap-1"
              >
                Ativar <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {permissions.batteryOptimized && (
            <div className="p-3 rounded-md bg-[#18181c] border border-white/10 flex items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <BatteryCharging className="w-4 h-4 text-[#facc15] mt-0.5 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-white">Remover Restrição de Bateria</h4>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Evita que o Android suspenda alarmes em modo economia.
                  </p>
                </div>
              </div>
              <button
                onClick={handleIgnoreBattery}
                className="px-2.5 py-1.5 bg-[#141417] border border-white/15 text-neutral-200 font-semibold text-xs rounded-md shrink-0 flex items-center gap-1"
              >
                Liberar <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {isAllGranted && !permissions.batteryOptimized && (
            <div className="p-3 rounded-md bg-[#facc15]/10 border border-[#facc15]/35 flex items-center gap-2.5 text-[#facc15]">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span className="text-xs font-semibold">Todas as permissões de alarme estão ativas!</span>
            </div>
          )}
        </div>

        <div className="p-3.5 border-t border-white/10 bg-[#0e0e11] flex items-center justify-between gap-2">
          <button
            onClick={refreshPermissions}
            className="text-xs font-semibold text-neutral-400 hover:text-white px-2.5 py-1.5"
          >
            Verificar novamente
          </button>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#facc15]/15 hover:bg-[#facc15]/25 border border-[#facc15]/55 text-[#facc15] font-bold text-xs rounded-md"
          >
            {isAllGranted ? 'Concluir' : 'Entendi'}
          </button>
        </div>
      </div>
    </div>
  );
}
