package com.opentick.app;

import android.app.ActivityOptions;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.PowerManager;
import androidx.core.app.NotificationCompat;
import org.json.JSONArray;
import org.json.JSONObject;

public class AlarmReceiver extends BroadcastReceiver {
    public static final String EXTRA_TASK_ID = "EXTRA_TASK_ID";
    public static final String EXTRA_OCCURRENCE_ID = "EXTRA_OCCURRENCE_ID";
    public static final String EXTRA_TASK_TITLE = "EXTRA_TASK_TITLE";
    public static final String EXTRA_TIME_LABEL = "EXTRA_TIME_LABEL";
    public static final String EXTRA_ALARM_MODE = "EXTRA_ALARM_MODE";
    public static final String EXTRA_ALARM_SOUND = "EXTRA_ALARM_SOUND";
    public static final String ACTION_FIRE_ALARM = "com.opentick.app.ACTION_FIRE_ALARM";
    public static final String ACTION_NATIVE_ALARM_TRIGGERED = "com.opentick.app.ACTION_NATIVE_ALARM_TRIGGERED";
    private static final String SHORT_CHANNEL_ID = "opentick_short_alert_v7";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (context == null || intent == null) return;
        String action = intent.getAction();

        // 1. Handle device boot / app update -> re-register saved alarms and exit (NEVER ring phantom alarm!)
        if (Intent.ACTION_BOOT_COMPLETED.equals(action) || Intent.ACTION_MY_PACKAGE_REPLACED.equals(action)) {
            rescheduleAfterBoot(context);
            return;
        }

        // 2. Handle notification action broadcasts safely from Android 12+ lock screen
        if (AlarmService.ACTION_STOP_ALARM.equals(action)) {
            String stopId = intent.getStringExtra(EXTRA_TASK_ID);
            String occId = intent.getStringExtra(EXTRA_OCCURRENCE_ID);
            if (occId != null && !occId.isEmpty()) {
                AlarmStateManager.markDismissed(context, occId);
            } else if (stopId != null && !stopId.isEmpty()) {
                AlarmStateManager.markDismissed(context, stopId);
            }
            AlarmService.stop(context, stopId);
            return;
        }

        if (AlarmService.ACTION_SNOOZE_ALARM.equals(action)) {
            String taskId = intent.getStringExtra(EXTRA_TASK_ID);
            String occId = intent.getStringExtra(EXTRA_OCCURRENCE_ID);
            String title = intent.getStringExtra(EXTRA_TASK_TITLE);
            int mins = intent.getIntExtra(AlarmService.EXTRA_SNOOZE_MINUTES, 5);
            AlarmService.snooze(context, taskId, occId, title, mins);
            return;
        }

        String taskId = intent.getStringExtra(EXTRA_TASK_ID);
        String occurrenceId = intent.getStringExtra(EXTRA_OCCURRENCE_ID);
        if (occurrenceId == null || occurrenceId.trim().isEmpty()) {
            occurrenceId = taskId;
        }
        String taskTitle = intent.getStringExtra(EXTRA_TASK_TITLE);
        String timeLabel = intent.getStringExtra(EXTRA_TIME_LABEL);
        String modeOverride = intent.getStringExtra(EXTRA_ALARM_MODE);
        String soundOverride = intent.getStringExtra(EXTRA_ALARM_SOUND);

        if (taskId == null || taskId.trim().isEmpty()) {
            return;
        }
        if (taskTitle == null || taskTitle.trim().isEmpty()) {
            taskTitle = "Lembrete OpenTick";
        }

        // Check if this specific occurrence was already dismissed recently
        if (AlarmStateManager.isDismissed(context, occurrenceId)) {
            return;
        }

        JSONObject settings = AlarmStateManager.loadSettings(context);
        String effectiveMode = (modeOverride != null && !modeOverride.isEmpty())
            ? modeOverride
            : settings.optString("alarmMode", "continuous");
        String effectiveSound = (soundOverride != null && !soundOverride.isEmpty())
            ? soundOverride
            : settings.optString("sound", "radar");

        // Handle short single-chime notification mode cleanly without full-screen alarm clock
        if ("short".equalsIgnoreCase(effectiveMode)) {
            showShortNotification(context, taskId, taskTitle, timeLabel, effectiveSound);
            broadcastToMainActivity(context, taskId, occurrenceId, taskTitle, timeLabel, "short");
            return;
        }

        // Continuous full-screen alarm mode
        try {
            PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
            if (pm != null) {
                PowerManager.WakeLock wakeLock = pm.newWakeLock(
                    PowerManager.FULL_WAKE_LOCK |
                    PowerManager.ACQUIRE_CAUSES_WAKEUP |
                    PowerManager.ON_AFTER_RELEASE,
                    "OpenTick:AlarmWakeLock"
                );
                wakeLock.acquire(30000);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        try {
            AlarmService.start(context, taskId, occurrenceId, taskTitle, timeLabel, effectiveSound);
        } catch (Exception e) {
            e.printStackTrace();
        }

        try {
            Intent launchIntent = new Intent(context, AlarmActivity.class);
            launchIntent.addFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK |
                Intent.FLAG_ACTIVITY_CLEAR_TOP |
                Intent.FLAG_ACTIVITY_REORDER_TO_FRONT |
                Intent.FLAG_ACTIVITY_SINGLE_TOP
            );
            launchIntent.putExtra(AlarmService.EXTRA_TASK_ID, taskId);
            launchIntent.putExtra(AlarmService.EXTRA_OCCURRENCE_ID, occurrenceId);
            launchIntent.putExtra(AlarmService.EXTRA_TASK_TITLE, taskTitle);
            launchIntent.putExtra(AlarmService.EXTRA_TIME_LABEL, timeLabel != null ? timeLabel : "");

            Bundle options = null;
            if (Build.VERSION.SDK_INT >= 34) {
                ActivityOptions activityOptions = ActivityOptions.makeBasic();
                activityOptions.setPendingIntentBackgroundActivityStartMode(
                    ActivityOptions.MODE_BACKGROUND_ACTIVITY_START_ALLOWED
                );
                options = activityOptions.toBundle();
            }

            if (options != null) {
                context.startActivity(launchIntent, options);
            } else {
                context.startActivity(launchIntent);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        broadcastToMainActivity(context, taskId, occurrenceId, taskTitle, timeLabel, "continuous");
    }

    private void rescheduleAfterBoot(Context context) {
        try {
            JSONArray saved = AlarmStateManager.loadScheduledAlarms(context);
            long now = System.currentTimeMillis();
            for (int i = 0; i < saved.length(); i++) {
                JSONObject item = saved.optJSONObject(i);
                if (item == null) continue;
                long ts = item.optLong("timeMillis", 0);
                if (ts <= now) continue;
                String occId = item.optString("occurrenceId", item.optString("id", ""));
                String taskId = item.optString("taskId", item.optString("id", occId));
                String title = item.optString("title", "Lembrete OpenTick");
                String timeLabel = item.optString("timeLabel", "");
                String alarmMode = item.optString("alarmMode", "");
                String sound = item.optString("sound", "");
                AlarmStateManager.scheduleExact(context, occId, taskId, title, ts, timeLabel, alarmMode, sound);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void showShortNotification(Context context, String taskId, String title, String timeLabel, String sound) {
        try {
            NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm == null) return;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                NotificationChannel channel = new NotificationChannel(
                    SHORT_CHANNEL_ID,
                    "Lembretes OpenTick",
                    NotificationManager.IMPORTANCE_HIGH
                );
                channel.enableVibration(true);
                channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
                if ("none".equalsIgnoreCase(sound)) {
                    channel.setSound(null, null);
                } else {
                    Uri chimeUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
                    channel.setSound(chimeUri, null);
                }
                nm.createNotificationChannel(channel);
            }

            Intent openIntent = new Intent(context, MainActivity.class);
            openIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                flags |= PendingIntent.FLAG_IMMUTABLE;
            }
            PendingIntent pi = PendingIntent.getActivity(context, AlarmStateManager.requestCodeForKey(taskId), openIntent, flags);

            String subtitle = (timeLabel != null && !timeLabel.isEmpty())
                ? "Programado para as " + timeLabel
                : "Hora de realizar esta tarefa";

            NotificationCompat.Builder builder = new NotificationCompat.Builder(context, SHORT_CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                .setContentTitle(title)
                .setContentText(subtitle)
                .setColor(Color.parseColor("#facc15"))
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setCategory(NotificationCompat.CATEGORY_REMINDER)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setAutoCancel(true)
                .setContentIntent(pi);

            nm.notify(AlarmStateManager.requestCodeForKey(taskId), builder.build());
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    private void broadcastToMainActivity(Context context, String taskId, String occId, String taskTitle, String timeLabel, String mode) {
        try {
            Intent mainBroadcast = new Intent(ACTION_NATIVE_ALARM_TRIGGERED);
            mainBroadcast.putExtra("ALARM_TASK_ID", taskId);
            mainBroadcast.putExtra("ALARM_OCCURRENCE_ID", occId);
            mainBroadcast.putExtra("ALARM_TASK_TITLE", taskTitle);
            mainBroadcast.putExtra("ALARM_TIME_LABEL", timeLabel != null ? timeLabel : "");
            mainBroadcast.putExtra("ALARM_MODE", mode != null ? mode : "continuous");
            mainBroadcast.setPackage(context.getPackageName());
            context.sendBroadcast(mainBroadcast);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
