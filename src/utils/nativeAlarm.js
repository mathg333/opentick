import { Capacitor } from '@capacitor/core';

// Check if running inside native Android Capacitor container
export const isNativeAndroid = () => {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
};

const getAlarmPlugin = () => {
  return Capacitor.Plugins?.OpenTickAlarm || null;
};

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
export async function stopNativeAlarm() {
  if (!isNativeAndroid()) return false;
  try {
    const plugin = getAlarmPlugin();
    if (plugin?.stopActiveAlarm) {
      await plugin.stopActiveAlarm();
      return true;
    }
  } catch (e) {
    console.warn('Error stopping native alarm:', e);
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
 * Synchronize all scheduled tasks to Android's native AlarmManager
 * @param {Array} tasks - List of tasks from store
 */
export async function syncTasksToNativeAlarmManager(tasks) {
  if (!isNativeAndroid()) return;
  const now = Date.now();

  for (const task of tasks) {
    if (task.completed || !task.startTime) {
      await cancelNativeAlarm(task.id);
      continue;
    }

    // Determine target dates
    let targetDates = [];
    if (task.recurringDates && task.recurringDates.length > 0) {
      targetDates = [...task.recurringDates];
    } else if (task.dueDate) {
      targetDates = [task.dueDate];
    }

    if (targetDates.length === 0) {
      await cancelNativeAlarm(task.id);
      continue;
    }

    // Find the nearest upcoming date/time
    let nextTimestamp = null;
    const [hours, minutes] = task.startTime.split(':').map(Number);

    for (const dStr of targetDates) {
      const [y, m, d] = dStr.split('-').map(Number);
      const targetDate = new Date(y, m - 1, d, hours, minutes, 0, 0);
      const millis = targetDate.getTime();

      if (millis > now) {
        if (nextTimestamp === null || millis < nextTimestamp) {
          nextTimestamp = millis;
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
