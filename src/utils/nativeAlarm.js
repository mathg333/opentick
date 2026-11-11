import { Capacitor } from '@capacitor/core';
import { getTaskTimes, getTaskDates, getTodayYMD } from './taskSchedule';

// Check if running inside native Android Capacitor container
export const isNativeAndroid = () => {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
};

const getAlarmPlugin = () => {
  return Capacitor.Plugins?.OpenTickAlarm || null;
};

/**
 * Mark an alarm as dismissed / stopped by user (persisted in localStorage)
 */
export function markAlarmDismissed(taskId, dateStr, timeStr) {
  if (!taskId) return;
  try {
    const now = new Date();
    const dStr = dateStr || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const tStr = timeStr || `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    // Key for this specific date and time
    const key = `opentick_dismissed_${taskId}_${dStr}_${tStr}`;
    localStorage.setItem(key, String(Date.now()));

    // Inform native plugin
    if (isNativeAndroid()) {
      const plugin = getAlarmPlugin();
      plugin?.markAlarmDismissed?.({ id: taskId }).catch(() => {});
    }
  } catch (e) {
    console.warn('Error marking alarm dismissed:', e);
  }
}

/**
 * Clear any dismissed state for this task when newly scheduled or edited
 */
export function clearAlarmDismissed(taskId) {
  if (!taskId) return;
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith(`opentick_dismissed_${taskId}_`)) {
        localStorage.removeItem(k);
      }
    }
    // Also clean legacy daily blacklist
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith('opentick_dismissed_today_')) {
        localStorage.removeItem(k);
      }
    }
  } catch (e) {}
}

/**
 * Check if an alarm has already been stopped/dismissed by user
 */
export function isAlarmDismissed(taskId, dateStr, timeStr) {
  if (!taskId) return false;
  try {
    const now = new Date();
    const dStr = dateStr || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    
    if (timeStr) {
      const specificKey = `opentick_dismissed_${taskId}_${dStr}_${timeStr}`;
      const dismissedAt = localStorage.getItem(specificKey);
      if (dismissedAt) {
        // Debounce: if user tapped STOP within the last 120 seconds, treat as dismissed
        if (Date.now() - Number(dismissedAt) < 120 * 1000) {
          return true;
        } else {
          localStorage.removeItem(specificKey);
        }
      }
    }
    return false;
  } catch (e) {
    return false;
  }
}

/**
 * Schedule a native exact alarm in Android's AlarmManager
 * @param {string} id - Task ID
 * @param {string} title - Task Title
 * @param {number} timeMillis - Target epoch timestamp in milliseconds
 */
export async function scheduleNativeAlarm(id, title, timeMillis) {
  if (!isNativeAndroid()) return false;
  try {
    const plugin = getAlarmPlugin();
    if (plugin?.scheduleAlarm) {
      await plugin.scheduleAlarm({
        id,
        title: title || 'Lembrete OpenTick',
        timeMillis
      });
      return true;
    }
  } catch (e) {
    console.warn('Error scheduling native alarm:', e);
  }
  return false;
}

/**
 * Cancel a native alarm
 * @param {string} id - Task ID
 */
export async function cancelNativeAlarm(id) {
  if (!isNativeAndroid()) return false;
  try {
    const plugin = getAlarmPlugin();
    if (plugin?.cancelAlarm) {
      await plugin.cancelAlarm({ id });
      return true;
    }
  } catch (e) {
    console.warn('Error cancelling native alarm:', e);
  }
  return false;
}

/**
 * Stop any currently ringing native alarm and dismiss notification
 */
export async function stopNativeAlarm(taskId) {
  if (!isNativeAndroid()) return false;
  try {
    const plugin = getAlarmPlugin();
    if (plugin?.stopActiveAlarm) {
      await plugin.stopActiveAlarm(taskId ? { id: taskId } : {});
      return true;
    }
  } catch (e) {
    console.warn('Error stopping native alarm:', e);
  }
  return false;
}

/**
 * Snooze currently ringing native alarm for a given number of minutes
 * @param {string} id - Task ID
 * @param {string} title - Task Title
 * @param {number} minutes - Minutes to snooze (default 5)
 */
export async function snoozeNativeAlarm(id, title, minutes = 5) {
  if (!isNativeAndroid()) return false;
  try {
    const plugin = getAlarmPlugin();
    if (plugin?.snoozeActiveAlarm) {
      await plugin.snoozeActiveAlarm({ id, title, minutes });
      return true;
    }
  } catch (e) {
    console.warn('Error snoozing native alarm:', e);
  }
  return false;
}

/**
 * Check overlay, notification and exact alarm permissions
 */
export async function checkAlarmPermissions() {
  if (!isNativeAndroid()) {
    return { overlayGranted: true, notificationsGranted: true, exactAlarmGranted: true };
  }
  try {
    const plugin = getAlarmPlugin();
    if (plugin?.checkPermissions) {
      return await plugin.checkPermissions();
    }
  } catch (e) {
    console.warn('Error checking alarm permissions:', e);
  }
  return { overlayGranted: true, notificationsGranted: true, exactAlarmGranted: true };
}

/**
 * Request Overlay ("Aparecer sobre outros apps") permission
 */
export async function requestOverlayPermission() {
  if (!isNativeAndroid()) return;
  try {
    const plugin = getAlarmPlugin();
    if (plugin?.requestOverlayPermission) {
      await plugin.requestOverlayPermission();
    }
  } catch (e) {
    console.warn('Error requesting overlay permission:', e);
  }
}

/**
 * Request Exact Alarm permission (Android 12+)
 */
export async function requestExactAlarmPermission() {
  if (!isNativeAndroid()) return;
  try {
    const plugin = getAlarmPlugin();
    if (plugin?.requestExactAlarmPermission) {
      await plugin.requestExactAlarmPermission();
    }
  } catch (e) {
    console.warn('Error requesting exact alarm permission:', e);
  }
}

/**
 * Request Full Screen Intent permission (Android 14+)
 */
export async function requestFullScreenIntentPermission() {
  if (!isNativeAndroid()) return;
  try {
    const plugin = getAlarmPlugin();
    if (plugin?.requestFullScreenIntentPermission) {
      await plugin.requestFullScreenIntentPermission();
    }
  } catch (e) {
    console.warn('Error requesting full screen intent permission:', e);
  }
}

/**
 * Request Whitelist from Samsung / Android Battery Optimization (Doze Mode)
 */
export async function requestIgnoreBatteryOptimizations() {
  if (!isNativeAndroid()) return;
  try {
    const plugin = getAlarmPlugin();
    if (plugin?.requestIgnoreBatteryOptimizations) {
      await plugin.requestIgnoreBatteryOptimizations();
    }
  } catch (e) {
    console.warn('Error requesting battery optimization exemption:', e);
  }
}

/**
 * Synchronize all scheduled tasks to Android's native AlarmManager
 * @param {Array} tasks - List of tasks from store
 */
export async function syncTasksToNativeAlarmManager(tasks) {
  if (!isNativeAndroid()) return;
  const now = Date.now();
  const nowDate = new Date();
  const todayStr = getTodayYMD();

  for (const task of tasks) {
    const taskTimes = getTaskTimes(task);
    const targetDates = getTaskDates(task);

    if (task.completed || taskTimes.length === 0 || targetDates.length === 0) {
      await cancelNativeAlarm(task.id);
      continue;
    }

    // Find the nearest upcoming (date, time) slot across all scheduled dates & times
    let nextTimestamp = null;

    for (const dStr of targetDates) {
      const [y, m, d] = dStr.split('-').map(Number);
      if (!y || !m || !d) continue;

      for (const timeStr of taskTimes) {
        // If this alarm was already dismissed for this specific date and time, skip it
        if (isAlarmDismissed(task.id, dStr, timeStr)) {
          continue;
        }

        const [hours, minutes] = timeStr.split(':').map(Number);
        if (Number.isNaN(hours) || Number.isNaN(minutes)) continue;

        const targetDate = new Date(y, m - 1, d, hours, minutes, 0, 0);
        const millis = targetDate.getTime();

        // If scheduled for today and matches the current minute, fire in 1.5s
        if (dStr === todayStr && nowDate.getHours() === hours && nowDate.getMinutes() === minutes) {
          const immediateMs = now + 1500;
          if (nextTimestamp === null || immediateMs < nextTimestamp) {
            nextTimestamp = immediateMs;
          }
          continue;
        }

        if (millis > now) {
          if (nextTimestamp === null || millis < nextTimestamp) {
            nextTimestamp = millis;
          }
        }
      }
    }

    if (nextTimestamp !== null) {
      await scheduleNativeAlarm(task.id, task.title, nextTimestamp);
    } else {
      await cancelNativeAlarm(task.id);
    }
  }
}
