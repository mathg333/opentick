package com.opentick.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.PowerManager;

public class AlarmReceiver extends BroadcastReceiver {
    public static final String EXTRA_TASK_ID = "EXTRA_TASK_ID";
    public static final String EXTRA_TASK_TITLE = "EXTRA_TASK_TITLE";

    @Override
    public void onReceive(Context context, Intent intent) {
        String taskId = intent.getStringExtra(EXTRA_TASK_ID);
        String taskTitle = intent.getStringExtra(EXTRA_TASK_TITLE);
        if (taskTitle == null || taskTitle.trim().isEmpty()) {
            taskTitle = "Lembrete OpenTick";
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
                wakeLock.acquire(15000); // Hold wake lock for 15 seconds to display UI
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        // 2. Start continuous audio and vibration via AlarmService
        try {
            AlarmService.start(context, taskId, taskTitle);
        } catch (Exception e) {
            e.printStackTrace();
        }

        // 3. Immediately launch MainActivity on top of the lock screen and over other apps
        try {
            Intent launchIntent = new Intent(context, MainActivity.class);
            launchIntent.addFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK |
                Intent.FLAG_ACTIVITY_CLEAR_TOP |
                Intent.FLAG_ACTIVITY_REORDER_TO_FRONT
            );
            launchIntent.putExtra("TRIGGERED_BY_ALARM", true);
            launchIntent.putExtra("ALARM_TASK_ID", taskId);
            launchIntent.putExtra("ALARM_TASK_TITLE", taskTitle);
            context.startActivity(launchIntent);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }
}
