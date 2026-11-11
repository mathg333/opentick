package com.opentick.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import org.json.JSONArray;
import org.json.JSONObject;

public class AlarmStateManager {
    private static final String PREF_NAME = "opentick_alarm_prefs";
    private static final String KEY_PREFIX_DISMISSED = "dismissed_occ_";
    private static final String KEY_SCHEDULED_LIST = "scheduled_alarms_v2";
    private static final String KEY_SETTINGS = "alarm_settings_v2";
    private static final String KEY_CUSTOM_AUDIO_PATH = "custom_audio_file_path";

    public static int requestCodeForKey(String key) {
        if (key == null || key.isEmpty()) return 1001;
        return (key.hashCode() & 0x0fffffff) + 2000;
    }

    public static void markDismissed(Context context, String key) {
        if (context == null || key == null || key.trim().isEmpty()) return;
        try {
            SharedPreferences prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
            long now = System.currentTimeMillis();
            String safeHash = String.valueOf(Math.abs(key.hashCode()));
            prefs.edit()
                .putLong(KEY_PREFIX_DISMISSED + safeHash, now)
                .putString("dismissed_key_raw_" + safeHash, key)
                .apply();
            cancelFromAlarmManager(context, key);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public static void clearDismissed(Context context, String key) {
        if (context == null || key == null || key.trim().isEmpty()) return;
        try {
            SharedPreferences prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
            String safeHash = String.valueOf(Math.abs(key.hashCode()));
            prefs.edit()
                .remove(KEY_PREFIX_DISMISSED + safeHash)
                .remove("dismissed_key_raw_" + safeHash)
                .apply();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public static boolean isDismissed(Context context, String key) {
        if (context == null || key == null || key.trim().isEmpty()) return false;
        try {
            SharedPreferences prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
            String safeHash = String.valueOf(Math.abs(key.hashCode()));
            long dismissedTime = prefs.getLong(KEY_PREFIX_DISMISSED + safeHash, 0);
            // Only treat an occurrence as dismissed within 10 minutes to block duplicate re-fires in the same window
            if (dismissedTime > 0 && (System.currentTimeMillis() - dismissedTime) < 10 * 60 * 1000L) {
                return true;
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return false;
    }

    public static void cancelFromAlarmManager(Context context, String key) {
        if (context == null || key == null) return;
        try {
            AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            if (am == null) return;

            int flags = PendingIntent.FLAG_NO_CREATE;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                flags |= PendingIntent.FLAG_IMMUTABLE;
            }

            int reqCode = requestCodeForKey(key);
            Intent intent = new Intent(context, AlarmReceiver.class);
            PendingIntent pi = PendingIntent.getBroadcast(context, reqCode, intent, flags);
            if (pi != null) {
                am.cancel(pi);
                pi.cancel();
            }

            int snoozeCode = requestCodeForKey(key + "_snooze");
            PendingIntent piSnooze = PendingIntent.getBroadcast(context, snoozeCode, intent, flags);
            if (piSnooze != null) {
                am.cancel(piSnooze);
                piSnooze.cancel();
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public static void saveScheduledAlarms(Context context, JSONArray alarms) {
        if (context == null) return;
        try {
            SharedPreferences prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
            prefs.edit().putString(KEY_SCHEDULED_LIST, alarms != null ? alarms.toString() : "[]").apply();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public static JSONArray loadScheduledAlarms(Context context) {
        if (context == null) return new JSONArray();
        try {
            SharedPreferences prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
            String raw = prefs.getString(KEY_SCHEDULED_LIST, "[]");
            return new JSONArray(raw);
        } catch (Exception e) {
            return new JSONArray();
        }
    }

    public static void saveSettings(Context context, JSONObject settings) {
        if (context == null || settings == null) return;
        try {
            SharedPreferences prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
            prefs.edit().putString(KEY_SETTINGS, settings.toString()).apply();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public static JSONObject loadSettings(Context context) {
        if (context == null) return new JSONObject();
        try {
            SharedPreferences prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
            String raw = prefs.getString(KEY_SETTINGS, "{}");
            return new JSONObject(raw);
        } catch (Exception e) {
            return new JSONObject();
        }
    }

    public static void saveCustomAudioPath(Context context, String path) {
        if (context == null) return;
        try {
            SharedPreferences prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
            if (path == null || path.isEmpty()) {
                prefs.edit().remove(KEY_CUSTOM_AUDIO_PATH).apply();
            } else {
                prefs.edit().putString(KEY_CUSTOM_AUDIO_PATH, path).apply();
            }
        } catch (Exception ignored) {}
    }

    public static String getCustomAudioPath(Context context) {
        if (context == null) return null;
        try {
            SharedPreferences prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
            return prefs.getString(KEY_CUSTOM_AUDIO_PATH, null);
        } catch (Exception ignored) {
            return null;
        }
    }

    public static void scheduleExact(
        Context context,
        String occurrenceId,
        String taskId,
        String title,
        long timeMillis,
        String timeLabel,
        String alarmMode,
        String sound
    ) {
        if (context == null || occurrenceId == null || timeMillis <= 0) return;
        try {
            AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            if (alarmManager == null) return;

            Intent intent = new Intent(context, AlarmReceiver.class);
            intent.setAction(AlarmReceiver.ACTION_FIRE_ALARM);
            intent.putExtra(AlarmReceiver.EXTRA_TASK_ID, taskId != null ? taskId : occurrenceId);
            intent.putExtra(AlarmReceiver.EXTRA_OCCURRENCE_ID, occurrenceId);
            intent.putExtra(AlarmReceiver.EXTRA_TASK_TITLE, title != null ? title : "Lembrete OpenTick");
            intent.putExtra(AlarmReceiver.EXTRA_TIME_LABEL, timeLabel != null ? timeLabel : "");
            intent.putExtra(AlarmReceiver.EXTRA_ALARM_MODE, alarmMode != null ? alarmMode : "");
            intent.putExtra(AlarmReceiver.EXTRA_ALARM_SOUND, sound != null ? sound : "");

            int requestCode = requestCodeForKey(occurrenceId);
            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                flags |= PendingIntent.FLAG_IMMUTABLE;
            }
            PendingIntent pendingIntent = PendingIntent.getBroadcast(context, requestCode, intent, flags);

            Intent showIntent = new Intent(context, AlarmActivity.class);
            showIntent.putExtra(AlarmService.EXTRA_TASK_ID, taskId != null ? taskId : occurrenceId);
            showIntent.putExtra(AlarmService.EXTRA_OCCURRENCE_ID, occurrenceId);
            showIntent.putExtra(AlarmService.EXTRA_TASK_TITLE, title != null ? title : "Lembrete OpenTick");
            showIntent.putExtra(AlarmService.EXTRA_TIME_LABEL, timeLabel != null ? timeLabel : "");
            showIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            PendingIntent showPendingIntent = PendingIntent.getActivity(context, requestCode + 50000, showIntent, flags);

            AlarmManager.AlarmClockInfo clockInfo = new AlarmManager.AlarmClockInfo(timeMillis, showPendingIntent);
            alarmManager.setAlarmClock(clockInfo, pendingIntent);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
