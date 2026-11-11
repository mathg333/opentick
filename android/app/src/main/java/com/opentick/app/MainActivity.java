package com.opentick.app;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Build;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.JSObject;
import org.json.JSONObject;

public class MainActivity extends BridgeActivity {

    private static volatile JSObject sPendingColdAlarm = null;

    private final BroadcastReceiver nativeAlarmEventReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (intent == null || getBridge() == null) return;
            String action = intent.getAction();

            if (AlarmService.ACTION_ALARM_STOPPED_BY_USER.equals(action)) {
                String stoppedTaskId = intent.getStringExtra(AlarmService.EXTRA_TASK_ID);
                if (stoppedTaskId == null) stoppedTaskId = "";
                try {
                    JSONObject payload = new JSONObject();
                    payload.put("taskId", stoppedTaskId);
                    dispatchWindowEvent("nativeAlarmStopped", payload);
                } catch (Exception ignored) {}
            } else if (AlarmService.ACTION_ALARM_SNOOZED.equals(action)) {
                try {
                    JSONObject payload = new JSONObject();
                    payload.put("taskId", safeStr(intent.getStringExtra("ALARM_TASK_ID")));
                    payload.put("occurrenceId", safeStr(intent.getStringExtra("ALARM_OCCURRENCE_ID")));
                    payload.put("taskTitle", safeStr(intent.getStringExtra("ALARM_TASK_TITLE")));
                    payload.put("minutes", intent.getIntExtra("SNOOZE_MINUTES", 5));
                    payload.put("timeLabel", safeStr(intent.getStringExtra("SNOOZE_TIME_LABEL")));
                    payload.put("triggerMillis", intent.getLongExtra("SNOOZE_TRIGGER_MILLIS", 0L));
                    dispatchWindowEvent("nativeAlarmSnoozed", payload);
                } catch (Exception ignored) {}
            } else if (AlarmReceiver.ACTION_NATIVE_ALARM_TRIGGERED.equals(action)) {
                try {
                    JSONObject payload = new JSONObject();
                    payload.put("taskId", safeStr(intent.getStringExtra("ALARM_TASK_ID")));
                    payload.put("occurrenceId", safeStr(intent.getStringExtra("ALARM_OCCURRENCE_ID")));
                    payload.put("taskTitle", safeStr(intent.getStringExtra("ALARM_TASK_TITLE")));
                    payload.put("timeLabel", safeStr(intent.getStringExtra("ALARM_TIME_LABEL")));
                    payload.put("alarmMode", safeStr(intent.getStringExtra("ALARM_MODE")));
                    dispatchWindowEvent("nativeAlarmTriggered", payload);
                } catch (Exception ignored) {}
            }
        }
    };

    public static synchronized JSObject consumePendingColdAlarm() {
        JSObject copy = sPendingColdAlarm;
        sPendingColdAlarm = null;
        return copy;
    }

    private static String safeStr(String s) {
        return s != null ? s : "";
    }

    private void dispatchWindowEvent(String eventName, JSONObject detail) {
        if (getBridge() == null) return;
        final String js = "window.dispatchEvent(new CustomEvent("
            + JSONObject.quote(eventName)
            + ", { detail: " + detail.toString() + " }));";
        runOnUiThread(() -> {
            if (getBridge() != null && getBridge().getWebView() != null) {
                getBridge().getWebView().evaluateJavascript(js, null);
            }
        });
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(OpenTickAlarmPlugin.class);
        super.onCreate(savedInstanceState);

        IntentFilter filter = new IntentFilter();
        filter.addAction(AlarmService.ACTION_ALARM_STOPPED_BY_USER);
        filter.addAction(AlarmService.ACTION_ALARM_SNOOZED);
        filter.addAction(AlarmReceiver.ACTION_NATIVE_ALARM_TRIGGERED);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(nativeAlarmEventReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            registerReceiver(nativeAlarmEventReceiver, filter);
        }

        handleAlarmLaunchIntent(getIntent(), true);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleAlarmLaunchIntent(intent, false);
    }

    private void handleAlarmLaunchIntent(Intent intent, boolean isColdStart) {
        if (intent == null) return;
        if (intent.getBooleanExtra("TRIGGERED_BY_ALARM", false)) {
            String taskId = safeStr(intent.getStringExtra("ALARM_TASK_ID"));
            String occId = safeStr(intent.getStringExtra("ALARM_OCCURRENCE_ID"));
            String taskTitle = safeStr(intent.getStringExtra("ALARM_TASK_TITLE"));
            if (taskTitle.isEmpty()) taskTitle = "Tarefa Agendada";
            String timeLabel = safeStr(intent.getStringExtra("ALARM_TIME_LABEL"));

            JSObject pending = new JSObject();
            pending.put("taskId", taskId);
            pending.put("occurrenceId", occId);
            pending.put("taskTitle", taskTitle);
            pending.put("timeLabel", timeLabel);
            pending.put("alarmMode", "continuous");
            sPendingColdAlarm = pending;

            if (!isColdStart) {
                try {
                    JSONObject detail = new JSONObject();
                    detail.put("taskId", taskId);
                    detail.put("occurrenceId", occId);
                    detail.put("taskTitle", taskTitle);
                    detail.put("timeLabel", timeLabel);
                    detail.put("alarmMode", "continuous");
                    dispatchWindowEvent("nativeAlarmTriggered", detail);
                } catch (Exception ignored) {}
            }

            intent.removeExtra("TRIGGERED_BY_ALARM");
        }
    }

    @Override
    public void onDestroy() {
        try {
            unregisterReceiver(nativeAlarmEventReceiver);
        } catch (Exception ignored) {}
        super.onDestroy();
    }
}
