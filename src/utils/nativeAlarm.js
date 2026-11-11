import { Capacitor, registerPlugin } from '@capacitor/core';
import { getTaskTimes, getTaskDates } from './taskSchedule';

export const isNativeAndroid = () => {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
};

const OpenTickAlarm = isNativeAndroid()
  ? registerPlugin('OpenTickAlarm')
  : null;

const DISMISSED_MAP_KEY = 'opentick_alarm_dismissed_map_v2';

function loadDismissedMap() {
  try {
    const raw = localStorage.getItem(DISMISSED_MAP_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    const now = Date.now();
    const cleaned = {};
    for (const [k, ts] of Object.entries(parsed || {})) {
      if (typeof ts === 'number' && (now - ts) < 48 * 3600 * 1000) {
        cleaned[k] = ts;
      }
    }
    return cleaned;
  } catch (e) {
    return {};
  }
}

function saveDismissedMap(map) {
  try {
    localStorage.setItem(DISMISSED_MAP_KEY, JSON.stringify(map));
  } catch (e) {}
}

export function markAlarmDismissed(key) {
  if (!key) return;
  const map = loadDismissedMap();
  map[key] = Date.now();
  saveDismissedMap(map);
}

export function isAlarmDismissed(key) {
  if (!key) return false;
  const map = loadDismissedMap();
  const ts = map[key];
  if (!ts) return false;
  // Specific occurrence keys (`task-xxx_YYYY-MM-DD_HH:mm`) stay suppressed 24h; bare IDs stay suppressed 10m
  const ttlMs = String(key).includes('_') ? 24 * 3600 * 1000 : 10 * 60 * 1000;
  return (Date.now() - ts) < ttlMs;
}

export function clearAlarmDismissed(taskId) {
  if (!taskId) return;
  const map = loadDismissedMap();
  let changed = false;
  for (const k of Object.keys(map)) {
    if (k === taskId || k.startsWith(`${taskId}_`)) {
      delete map[k];
      changed = true;
    }
  }
  if (changed) saveDismissedMap(map);
}

export async function checkNativeAlarmPermissions() {
  if (!isNativeAndroid() || !OpenTickAlarm) {
    return {
      exactAlarm: true,
      overlay: true,
      fullScreenIntent: true,
      notifications: true,
      batteryOptimized: false,
      isFullyGranted: true
    };
  }
  try {
    return await OpenTickAlarm.checkPermissions();
  } catch (err) {
    console.warn('Erro ao checar permissoes nativas:', err);
    return {
      exactAlarm: false,
      overlay: false,
      fullScreenIntent: true,
      notifications: false,
      batteryOptimized: true,
      isFullyGranted: false
    };
  }
}

export async function requestNotificationPermission() {
  if (!isNativeAndroid() || !OpenTickAlarm) return { granted: true };
  try {
    return await OpenTickAlarm.requestNotificationPermission();
  } catch (err) {
    console.warn('Erro ao pedir permissao de notificacao:', err);
    return { granted: false };
  }
}

export async function requestExactAlarmPermission() {
  if (!isNativeAndroid() || !OpenTickAlarm) return;
  try {
    await OpenTickAlarm.requestExactAlarmPermission();
  } catch (err) {
    console.warn('Erro ao pedir permissao de alarme exato:', err);
  }
}

export async function requestOverlayPermission() {
  if (!isNativeAndroid() || !OpenTickAlarm) return;
  try {
    await OpenTickAlarm.requestOverlayPermission();
  } catch (err) {
    console.warn('Erro ao pedir permissao de overlay:', err);
  }
}

export async function requestFullScreenIntentPermission() {
  if (!isNativeAndroid() || !OpenTickAlarm) return;
  try {
    await OpenTickAlarm.requestFullScreenIntentPermission();
  } catch (err) {
    console.warn('Erro ao pedir permissao fullScreenIntent:', err);
  }
}

export async function requestIgnoreBatteryOptimization() {
  if (!isNativeAndroid() || !OpenTickAlarm) return;
  try {
    await OpenTickAlarm.requestIgnoreBatteryOptimization();
  } catch (err) {
    console.warn('Erro ao pedir exclusao de otimizacao de bateria:', err);
  }
}

export async function syncNativeAlarmSettings(settings = {}) {
  if (!isNativeAndroid() || !OpenTickAlarm) return;
  try {
    await OpenTickAlarm.updateAlarmSettings({
      settings: {
        sound: settings.sound || 'radar',
        volume: settings.volume ?? 0.9,
        durationMinutes: settings.durationMinutes ?? settings.alarmDuration ?? 5,
        vibration: settings.vibration ?? true,
        alarmMode: settings.alarmMode || 'continuous',
        reminderOffset: settings.reminderOffset ?? 0
      }
    });
  } catch (err) {
    console.warn('Erro ao sincronizar configuracoes de alarme:', err);
  }
}

export async function syncCustomAudioToNative(dataUrl = '', filename = 'audio.mp3') {
  if (!isNativeAndroid() || !OpenTickAlarm) return;
  try {
    const ext = (filename && filename.includes('.'))
      ? filename.split('.').pop().toLowerCase()
      : 'mp3';
    await OpenTickAlarm.saveCustomAudioBase64({ base64: dataUrl || '', ext });
  } catch (err) {
    console.warn('Erro ao salvar audio customizado no Android:', err);
  }
}

export async function consumePendingNativeAlarm() {
  if (!isNativeAndroid() || !OpenTickAlarm) return null;
  try {
    const res = await OpenTickAlarm.consumePendingAlarm();
    return res && res.taskId ? res : null;
  } catch (err) {
    return null;
  }
}

export async function scheduleNativeAlarm({
  id,
  occurrenceId,
  title,
  timeInMillis,
  timeLabel = '',
  alarmMode = '',
  sound = ''
}) {
  if (!isNativeAndroid() || !OpenTickAlarm || !id || !timeInMillis) return false;
  try {
    const res = await OpenTickAlarm.scheduleAlarm({
      id,
      occurrenceId: occurrenceId || id,
      title,
      timeInMillis,
      timeLabel,
      alarmMode,
      sound
    });
    return res?.scheduled || false;
  } catch (err) {
    console.warn('Erro ao agendar alarme nativo:', err);
    return false;
  }
}

export async function cancelNativeAlarm(taskId) {
  if (!isNativeAndroid() || !OpenTickAlarm || !taskId) return;
  try {
    await OpenTickAlarm.cancelAlarm({ id: taskId });
  } catch (err) {
    console.warn('Erro ao cancelar alarme nativo:', err);
  }
}

export async function stopNativeAlarm(taskId, occurrenceId = '') {
  if (!isNativeAndroid() || !OpenTickAlarm) return;
  try {
    await OpenTickAlarm.stopAlarm({
      id: taskId || 'manual',
      occurrenceId: occurrenceId || taskId || ''
    });
  } catch (err) {
    console.warn('Erro ao parar alarme nativo:', err);
  }
}

export async function snoozeNativeAlarm(taskId, title, minutes = 5, occurrenceId = '') {
  if (!isNativeAndroid() || !OpenTickAlarm) return;
  try {
    await OpenTickAlarm.snoozeAlarm({
      id: taskId || 'snooze',
      occurrenceId: occurrenceId || taskId || 'snooze',
      title,
      minutes
    });
  } catch (err) {
    console.warn('Erro ao adiar alarme nativo:', err);
  }
}

/**
 * Sync up to 64 upcoming task alarm occurrences in a rolling 30-day window to native AlarmManager.
 * Handles multi-date tasks, multi-time slots, reminderOffset (minutes before), alarmEnabled toggle, and diff-cancelling.
 */
export async function syncTasksToNativeAlarmManager(tasks, settings = {}) {
  if (!isNativeAndroid() || !OpenTickAlarm || !Array.isArray(tasks)) return;

  const now = Date.now();
  const maxHorizonMs = now + (30 * 24 * 3600 * 1000);
  const candidates = [];

  for (const t of tasks) {
    if (!t || t.completed || t.deleted || t.alarmEnabled === false) continue;

    const taskDates = getTaskDates(t);
    const taskTimes = getTaskTimes(t);
    if (taskDates.length === 0 || taskTimes.length === 0) continue;

    const offsetMins = Number(t.reminderOffset !== undefined ? t.reminderOffset : (settings.reminderOffset || 0)) || 0;
    const taskMode = t.alarmMode || settings.alarmMode || 'continuous';
    const taskSound = t.alarmSound || settings.sound || 'radar';

    for (const dStr of taskDates) {
      const [y, m, d] = dStr.split('-').map(Number);
      if (!y || !m || !d) continue;

      for (const tStr of taskTimes) {
        const [hh, mm] = tStr.split(':').map(Number);
        if (Number.isNaN(hh) || Number.isNaN(mm)) continue;

        const targetDt = new Date(y, m - 1, d, hh, mm, 0, 0);
        const fireMillis = targetDt.getTime() - (offsetMins * 60 * 1000);
        if (Number.isNaN(fireMillis) || fireMillis <= (now - 5000) || fireMillis > maxHorizonMs) {
          continue;
        }

        const occurrenceId = `${t.id}_${dStr}_${tStr}`;
        if (isAlarmDismissed(occurrenceId)) continue;

        candidates.push({
          occurrenceId,
          taskId: t.id,
          title: t.title || 'Lembrete OpenTick',
          timeMillis: fireMillis,
          timeLabel: tStr,
          alarmMode: taskMode,
          sound: taskSound
        });
      }
    }
  }

  candidates.sort((a, b) => a.timeMillis - b.timeMillis);
  const capped = candidates.slice(0, 64);

  try {
    await OpenTickAlarm.syncSchedule({
      alarms: capped,
      settings: {
        sound: settings.sound || 'radar',
        volume: settings.volume ?? 0.9,
        durationMinutes: settings.durationMinutes ?? settings.alarmDuration ?? 5,
        vibration: settings.vibration ?? true,
        alarmMode: settings.alarmMode || 'continuous',
        reminderOffset: settings.reminderOffset ?? 0
      }
    });
  } catch (err) {
    console.warn('Falha ao sincronizar agenda nativa de alarmes:', err);
  }
}
