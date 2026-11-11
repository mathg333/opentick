package com.opentick.app;

import android.Manifest;
import android.app.AlarmManager;
import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;
import android.util.Base64;
import androidx.core.app.NotificationManagerCompat;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import org.json.JSONArray;
import org.json.JSONObject;
import java.io.File;
import java.io.FileOutputStream;
import java.util.HashSet;
import java.util.Set;

@CapacitorPlugin(
    name = "OpenTickAlarm",
    permissions = {
        @Permission(
            strings = { Manifest.permission.POST_NOTIFICATIONS },
            alias = "notifications"
        )
    }
)
public class OpenTickAlarmPlugin extends Plugin {

    @PluginMethod
    public void checkPermissions(PluginCall call) {
        Context context = getContext();
        JSObject ret = new JSObject();

        boolean exactAlarmGranted = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            exactAlarmGranted = (am != null && am.canScheduleExactAlarms());
        }

        boolean overlayGranted = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            overlayGranted = Settings.canDrawOverlays(context);
        }

        boolean fullScreenIntentGranted = true;
        if (Build.VERSION.SDK_INT >= 34) {
            NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            fullScreenIntentGranted = (nm != null && nm.canUseFullScreenIntent());
        }

        boolean notificationsGranted = true;
        if (Build.VERSION.SDK_INT >= 33) {
            notificationsGranted = getPermissionState("notifications") == PermissionState.GRANTED
                || NotificationManagerCompat.from(context).areNotificationsEnabled();
        } else {
            notificationsGranted = NotificationManagerCompat.from(context).areNotificationsEnabled();
        }

        boolean batteryOptimized = false;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
            if (pm != null) {
                batteryOptimized = !pm.isIgnoringBatteryOptimizations(context.getPackageName());
            }
        }

        ret.put("exactAlarm", exactAlarmGranted);
        ret.put("overlay", overlayGranted);
        ret.put("fullScreenIntent", fullScreenIntentGranted);
        ret.put("notifications", notificationsGranted);
        ret.put("batteryOptimized", batteryOptimized);
        ret.put("isFullyGranted", exactAlarmGranted && overlayGranted && fullScreenIntentGranted && notificationsGranted);

        call.resolve(ret);
    }

    @PluginMethod
    public void requestNotificationPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT < 33 || getPermissionState("notifications") == PermissionState.GRANTED) {
            JSObject ret = new JSObject();
            ret.put("granted", NotificationManagerCompat.from(getContext()).areNotificationsEnabled());
            call.resolve(ret);
            return;
        }
        requestPermissionForAlias("notifications", call, "notificationPermCallback");
    }

    @PermissionCallback
    private void notificationPermCallback(PluginCall call) {
        JSObject ret = new JSObject();
        boolean granted = getPermissionState("notifications") == PermissionState.GRANTED
            || NotificationManagerCompat.from(getContext()).areNotificationsEnabled();
        ret.put("granted", granted);
        call.resolve(ret);
    }

    @PluginMethod
    public void requestExactAlarmPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            try {
                Intent intent = new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM);
                intent.setData(Uri.parse("package:" + getContext().getPackageName()));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(intent);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
        call.resolve();
    }

    @PluginMethod
    public void requestOverlayPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            try {
                Intent intent = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION);
                intent.setData(Uri.parse("package:" + getContext().getPackageName()));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(intent);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
        call.resolve();
    }

    @PluginMethod
    public void requestFullScreenIntentPermission(PluginCall call) {
        if (Build.VERSION.SDK_INT >= 34) {
            try {
                Intent intent = new Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT);
                intent.setData(Uri.parse("package:" + getContext().getPackageName()));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(intent);
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
        call.resolve();
    }

    @PluginMethod
    public void requestIgnoreBatteryOptimization(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            try {
                Intent intent = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                intent.setData(Uri.parse("package:" + getContext().getPackageName()));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(intent);
            } catch (Exception e) {
                try {
                    Intent fallback = new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS);
                    fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    getContext().startActivity(fallback);
                } catch (Exception ignored) {}
            }
        }
        call.resolve();
    }

    @PluginMethod
    public void updateAlarmSettings(PluginCall call) {
        JSObject settingsObj = call.getObject("settings");
        if (settingsObj != null) {
            AlarmStateManager.saveSettings(getContext(), settingsObj);
        }
        call.resolve();
    }

    @PluginMethod
    public void saveCustomAudioBase64(PluginCall call) {
        Context context = getContext();
        String base64Data = call.getString("base64", "");
        String ext = call.getString("ext", "mp3");
        if (ext == null || ext.trim().isEmpty()) ext = "mp3";
        ext = ext.replaceAll("[^a-zA-Z0-9]", "");
        if (ext.isEmpty()) ext = "mp3";

        try {
            // Clean previous custom audio files
            String prevPath = AlarmStateManager.getCustomAudioPath(context);
            if (prevPath != null && !prevPath.isEmpty()) {
                File oldFile = new File(prevPath);
                if (oldFile.exists()) oldFile.delete();
            }

            if (base64Data == null || base64Data.trim().isEmpty()) {
                AlarmStateManager.saveCustomAudioPath(context, "");
                JSObject ret = new JSObject();
                ret.put("cleared", true);
                call.resolve(ret);
                return;
            }

            String pureBase64 = base64Data;
            int commaIdx = pureBase64.indexOf(',');
            if (commaIdx != -1) {
                pureBase64 = pureBase64.substring(commaIdx + 1);
            }

            byte[] decoded = Base64.decode(pureBase64, Base64.DEFAULT);
            File outFile = new File(context.getFilesDir(), "opentick_custom_alarm." + ext);
            try (FileOutputStream fos = new FileOutputStream(outFile)) {
                fos.write(decoded);
            }
            AlarmStateManager.saveCustomAudioPath(context, outFile.getAbsolutePath());

            JSObject ret = new JSObject();
            ret.put("saved", true);
            ret.put("path", outFile.getAbsolutePath());
            call.resolve(ret);
        } catch (Exception e) {
            e.printStackTrace();
            call.reject("Erro ao salvar áudio personalizado: " + e.getMessage());
        }
    }

    @PluginMethod
    public void syncSchedule(PluginCall call) {
        Context context = getContext();
        JSArray alarms = call.getArray("alarms");
        JSObject settingsObj = call.getObject("settings");
        if (settingsObj != null) {
            AlarmStateManager.saveSettings(context, settingsObj);
        }

        try {
            JSONArray prevSaved = AlarmStateManager.loadScheduledAlarms(context);
            Set<String> nextOccKeys = new HashSet<>();
            JSONArray nextList = new JSONArray();

            if (alarms != null) {
                for (int i = 0; i < alarms.length(); i++) {
                    JSONObject item = alarms.optJSONObject(i);
                    if (item == null) continue;
                    String occId = item.optString("occurrenceId", "");
                    String taskId = item.optString("taskId", occId);
                    if (occId.isEmpty()) occId = taskId;
                    if (occId.isEmpty()) continue;

                    nextOccKeys.add(occId);
                    nextList.put(item);

                    long timeMillis = item.optLong("timeMillis", 0);
                    if (timeMillis > System.currentTimeMillis() - 10_000L) {
                        String title = item.optString("title", "Lembrete OpenTick");
                        String timeLabel = item.optString("timeLabel", "");
                        String alarmMode = item.optString("alarmMode", "");
                        String sound = item.optString("sound", "");
                        AlarmStateManager.scheduleExact(
                            context, occId, taskId, title, timeMillis, timeLabel, alarmMode, sound
                        );
                    }
                }
            }

            // Cancel removed/outdated AlarmManager alarms
            for (int i = 0; i < prevSaved.length(); i++) {
                JSONObject oldItem = prevSaved.optJSONObject(i);
                if (oldItem == null) continue;
                String oldOcc = oldItem.optString("occurrenceId", oldItem.optString("id", ""));
                if (!oldOcc.isEmpty() && !nextOccKeys.contains(oldOcc)) {
                    AlarmStateManager.cancelFromAlarmManager(context, oldOcc);
                }
            }

            AlarmStateManager.saveScheduledAlarms(context, nextList);

            JSObject ret = new JSObject();
            ret.put("syncedCount", nextList.length());
            call.resolve(ret);
        } catch (Exception e) {
            e.printStackTrace();
            call.reject("Erro ao sincronizar alarmes: " + e.getMessage());
        }
    }

    @PluginMethod
    public void scheduleAlarm(PluginCall call) {
        String id = call.getString("id");
        String occId = call.getString("occurrenceId", id);
        String title = call.getString("title", "Lembrete OpenTick");
        String timeLabel = call.getString("timeLabel", "");
        String alarmMode = call.getString("alarmMode", "");
        String sound = call.getString("sound", "");
        Long timeInMillis = call.getLong("timeInMillis");

        if (id == null || timeInMillis == null) {
            call.reject("ID ou horário inválido");
            return;
        }

        if (occId == null || occId.isEmpty()) occId = id;
        AlarmStateManager.clearDismissed(getContext(), occId);
        AlarmStateManager.scheduleExact(
            getContext(), occId, id, title, timeInMillis, timeLabel, alarmMode, sound
        );

        JSObject ret = new JSObject();
        ret.put("scheduled", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void cancelAlarm(PluginCall call) {
        String id = call.getString("id");
        if (id == null || id.isEmpty()) {
            call.resolve();
            return;
        }

        AlarmStateManager.markDismissed(getContext(), id);
        AlarmStateManager.cancelFromAlarmManager(getContext(), id);
        AlarmService.stop(getContext(), id);

        // Also cancel any matching task occurrences in saved schedule
        JSONArray saved = AlarmStateManager.loadScheduledAlarms(getContext());
        JSONArray kept = new JSONArray();
        for (int i = 0; i < saved.length(); i++) {
            JSONObject item = saved.optJSONObject(i);
            if (item == null) continue;
            String itemTaskId = item.optString("taskId", "");
            String itemOccId = item.optString("occurrenceId", "");
            if (id.equals(itemTaskId) || id.equals(itemOccId)) {
                AlarmStateManager.markDismissed(getContext(), itemOccId);
                AlarmStateManager.cancelFromAlarmManager(getContext(), itemOccId);
            } else {
                kept.put(item);
            }
        }
        AlarmStateManager.saveScheduledAlarms(getContext(), kept);
        call.resolve();
    }

    @PluginMethod
    public void stopAlarm(PluginCall call) {
        String id = call.getString("id");
        String occId = call.getString("occurrenceId", "");
        if (occId != null && !occId.isEmpty()) {
            AlarmStateManager.markDismissed(getContext(), occId);
        }
        if (id != null && !id.isEmpty()) {
            AlarmStateManager.markDismissed(getContext(), id);
        }
        AlarmService.stop(getContext(), id);
        call.resolve();
    }

    @PluginMethod
    public void snoozeAlarm(PluginCall call) {
        String id = call.getString("id");
        String occId = call.getString("occurrenceId", id);
        String title = call.getString("title", "Lembrete OpenTick");
        Integer minutesObj = call.getInt("minutes", 5);
        int minutes = minutesObj != null ? minutesObj : 5;

        AlarmService.snooze(getContext(), id, occId, title, minutes);
        call.resolve();
    }

    @PluginMethod
    public void consumePendingAlarm(PluginCall call) {
        JSObject ret = MainActivity.consumePendingColdAlarm();
        call.resolve(ret != null ? ret : new JSObject());
    }
}
