package com.opentick.app;

import android.app.ActivityOptions;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.os.PowerManager;

public class AlarmReceiver extends BroadcastReceiver {
    public static final String EXTRA_TASK_ID = "EXTRA_TASK_ID";
    public static final String EXTRA_TASK_TITLE = "EXTRA_TASK_TITLE";
    public static final String ACTION_NATIVE_ALARM_TRIGGERED = "com.opentick.app.ACTION_NATIVE_ALARM_TRIGGERED";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null) return;
        String taskId = intent.getStringExtra(EXTRA_TASK_ID);
        String taskTitle = intent.getStringExtra(EXTRA_TASK_TITLE);
        if (taskTitle == null || taskTitle.trim().isEmpty()) {
            taskTitle = "Lembrete OpenTick";
        }

        // Check if user already dismissed/stopped this alarm
        if (AlarmStateManager.isDismissed(context, taskId)) {
            return;
        }

        // 1. Wake up device screen from sleep / lock state
        try {
            PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
            if (pm != null) {
                PowerManager.WakeLock wakeLock = pm.newWakeLock(
                    PowerManager.FULL_WAKE_LOCK |
                    PowerManager.ACQUIRE_CAUSES_WAKEUP |
                    PowerManager.ON_AFTER_RELEASE,
                    "OpenTick:AlarmWakeLock"
                );
                wakeLock.acquire(30000); // Hold wake lock for 30s to keep screen lit
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        // 2. Start continuous audio, vibration and notification via AlarmService
        try {
            AlarmService.start(context, taskId, taskTitle);
        } catch (Exception e) {
            e.printStackTrace();
        }

        // 3. Immediately launch dedicated AlarmActivity on top of lock screen and other apps
        try {
            Intent launchIntent = new Intent(context, AlarmActivity.class);
            launchIntent.addFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK |
                Intent.FLAG_ACTIVITY_CLEAR_TOP |
                Intent.FLAG_ACTIVITY_REORDER_TO_FRONT |
                Intent.FLAG_ACTIVITY_SINGLE_TOP
            );
            launchIntent.putExtra(AlarmService.EXTRA_TASK_ID, taskId);
            launchIntent.putExtra(AlarmService.EXTRA_TASK_TITLE, taskTitle);

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
            // Fallback: try starting via PendingIntent
            try {
                Intent piIntent = new Intent(context, AlarmActivity.class);
                piIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
                piIntent.putExtra(AlarmService.EXTRA_TASK_ID, taskId);
                piIntent.putExtra(AlarmService.EXTRA_TASK_TITLE, taskTitle);
                int flag = PendingIntent.FLAG_UPDATE_CURRENT;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    flag |= PendingIntent.FLAG_IMMUTABLE;
                }
                PendingIntent pi = PendingIntent.getActivity(context, 9999, piIntent, flag);
                pi.send();
            } catch (Exception ignored) {}
        }

        // 4. Also broadcast to MainActivity so if the user is currently using the app, it pops up in-app immediately!
        try {
            Intent mainBroadcast = new Intent(ACTION_NATIVE_ALARM_TRIGGERED);
            mainBroadcast.putExtra("ALARM_TASK_ID", taskId);
            mainBroadcast.putExtra("ALARM_TASK_TITLE", taskTitle);
            mainBroadcast.setPackage(context.getPackageName());
            context.sendBroadcast(mainBroadcast);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
