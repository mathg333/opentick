package com.opentick.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class AlarmStateManager {
    private static final String PREF_NAME = "opentick_alarm_prefs";
    private static final String KEY_PREFIX_DISMISSED = "dismissed_";

    /**
     * Mark a task's alarm as permanently dismissed for today and recently
     */
    public static void markDismissed(Context context, String taskId) {
        if (context == null || taskId == null || taskId.trim().isEmpty()) return;
        try {
            SharedPreferences prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
            String todayStr = getTodayString();
            long now = System.currentTimeMillis();

            prefs.edit()
                .putBoolean(KEY_PREFIX_DISMISSED + taskId + "_" + todayStr, true)
                .putLong("dismissed_time_" + taskId, now)
                .putString("last_dismissed_task_id", taskId)
                .apply();

            // Cancel any pending intents in AlarmManager for this task
            cancelFromAlarmManager(context, taskId);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    /**
     * Clear dismissed status when a task is newly scheduled or rescheduled
     */
    public static void clearDismissed(Context context, String taskId) {
        if (context == null || taskId == null || taskId.trim().isEmpty()) return;
        try {
            SharedPreferences prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
            String todayStr = getTodayString();
            prefs.edit()
                .remove(KEY_PREFIX_DISMISSED + taskId + "_" + todayStr)
                .remove("dismissed_time_" + taskId)
                .apply();
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    /**
     * Check if a task's alarm has already been stopped / dismissed
     */
    public static boolean isDismissed(Context context, String taskId) {
        if (context == null || taskId == null || taskId.trim().isEmpty()) return false;
        try {
            SharedPreferences prefs = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
            String todayStr = getTodayString();

            // Check if user pressed STOP in the last 60 seconds (anti-duplicate debounce)
            long dismissedTime = prefs.getLong("dismissed_time_" + taskId, 0);
            if (dismissedTime > 0 && (System.currentTimeMillis() - dismissedTime) < 60 * 1000) {
                return true;
            }

            // Check if dismissed today
            if (prefs.getBoolean(KEY_PREFIX_DISMISSED + taskId + "_" + todayStr, false)) {
                return true;
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return false;
    }

    /**
     * Cancel all pending alarms for this task in the system AlarmManager
     */
    public static void cancelFromAlarmManager(Context context, String taskId) {
        if (context == null || taskId == null) return;
        try {
            AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            if (am != null) {
                Intent intent = new Intent(context, AlarmReceiver.class);
                int requestCode = Math.abs(taskId.hashCode());
                int flags = PendingIntent.FLAG_NO_CREATE;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    flags |= PendingIntent.FLAG_IMMUTABLE;
                }
                PendingIntent pi = PendingIntent.getBroadcast(context, requestCode, intent, flags);
                if (pi != null) {
                    am.cancel(pi);
                    pi.cancel();
                }

                // Also cancel snooze requestCode
                int snoozeCode = (taskId.hashCode()) + 999;
                PendingIntent piSnooze = PendingIntent.getBroadcast(context, snoozeCode, intent, flags);
                if (piSnooze != null) {
                    am.cancel(piSnooze);
                    piSnooze.cancel();
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private static String getTodayString() {
        return new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(new Date());
    }
}
