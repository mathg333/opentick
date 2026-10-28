package com.opentick.app;

import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.view.WindowManager;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(OpenTickAlarmPlugin.class);
        super.onCreate(savedInstanceState);

        // Configure activity to turn screen on and show on lock screen
        configureLockScreenFlags();

        // Check if opened directly by an active alarm
        handleAlarmIntent(getIntent());
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        configureLockScreenFlags();
        handleAlarmIntent(intent);
    }

    private void configureLockScreenFlags() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
        } else {
            getWindow().addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON |
                WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD
            );
        }
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    }

    private void handleAlarmIntent(Intent intent) {
        if (intent != null && intent.getBooleanExtra("TRIGGERED_BY_ALARM", false)) {
            String taskId = intent.getStringExtra("ALARM_TASK_ID");
            String taskTitle = intent.getStringExtra("ALARM_TASK_TITLE");
            if (taskId == null) taskId = "";
            if (taskTitle == null) taskTitle = "Lembrete OpenTick";

            final String fTaskId = taskId;
            final String fTaskTitle = taskTitle.replace("'", "\\'");

            if (getBridge() != null && getBridge().getWebView() != null) {
                getBridge().getWebView().post(() -> {
                    String js = "window.dispatchEvent(new CustomEvent('nativeAlarmTriggered', { detail: { taskId: '" + fTaskId + "', taskTitle: '" + fTaskTitle + "' } }));";
                    getBridge().eval(js, null);
                });
            }
        }
    }
}
