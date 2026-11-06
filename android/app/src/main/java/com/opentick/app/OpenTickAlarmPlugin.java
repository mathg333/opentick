package com.opentick.app;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import androidx.core.app.NotificationManagerCompat;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "OpenTickAlarm")
public class OpenTickAlarmPlugin extends Plugin {

    @PluginMethod
    public void scheduleAlarm(PluginCall call) {
        String id = call.getString("id");
        String title = call.getString("title", "Lembrete OpenTick");
        Long timeMillis = call.getLong("timeMillis");

        if (id == null || timeMillis == null) {
            call.reject("Missing required parameters: id, timeMillis");
            return;
        }

        try {
            Context context = getContext();
            AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);

            Intent intent = new Intent(context, AlarmReceiver.class);
            intent.putExtra(AlarmReceiver.EXTRA_TASK_ID, id);
            intent.putExtra(AlarmReceiver.EXTRA_TASK_TITLE, title);

            int requestCode = Math.abs(id.hashCode());
            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                flags |= PendingIntent.FLAG_IMMUTABLE;
            }

            PendingIntent pendingIntent = PendingIntent.getBroadcast(context, requestCode, intent, flags);

            // Intent that opens if user taps alarm clock status icon / banner
            Intent showIntent = new Intent(context, AlarmActivity.class);
            showIntent.putExtra(AlarmService.EXTRA_TASK_ID, id);
            showIntent.putExtra(AlarmService.EXTRA_TASK_TITLE, title);
            showIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
            PendingIntent showPendingIntent = PendingIntent.getActivity(context, requestCode + 1000, showIntent, flags);

            // setAlarmClock grants system Alarm Clock exemption and background activity launch permissions!
            AlarmManager.AlarmClockInfo clockInfo = new AlarmManager.AlarmClockInfo(timeMillis, showPendingIntent);
            alarmManager.setAlarmClock(clockInfo, pendingIntent);

            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("id", id);
            ret.put("timeMillis", timeMillis);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Error scheduling alarm: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void cancelAlarm(PluginCall call) {
        String id = call.getString("id");
        if (id == null) {
            call.reject("Missing parameter: id");
            return;
        }

        try {
            Context context = getContext();
            AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);

            Intent intent = new Intent(context, AlarmReceiver.class);
            int requestCode = Math.abs(id.hashCode());
            int flags = PendingIntent.FLAG_NO_CREATE;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                flags |= PendingIntent.FLAG_IMMUTABLE;
            }

            PendingIntent pendingIntent = PendingIntent.getBroadcast(context, requestCode, intent, flags);
            if (pendingIntent != null) {
                alarmManager.cancel(pendingIntent);
                pendingIntent.cancel();
            }

            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("id", id);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Error cancelling alarm: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void stopActiveAlarm(PluginCall call) {
        String id = call.getString("id");
        try {
            if (id != null && !id.isEmpty()) {
                AlarmStateManager.markDismissed(getContext(), id);
                AlarmService.stop(getContext(), id);
            } else {
                AlarmService.stop(getContext());
            }
            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Error stopping alarm: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void markAlarmDismissed(PluginCall call) {
        String id = call.getString("id");
        try {
            if (id != null && !id.isEmpty()) {
                AlarmStateManager.markDismissed(getContext(), id);
            }
            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Error marking alarm dismissed: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void snoozeActiveAlarm(PluginCall call) {
        String id = call.getString("id", "");
        String title = call.getString("title", "Lembrete OpenTick");
        int minutes = call.getInt("minutes", 5);
        try {
            AlarmService.snooze(getContext(), id, title, minutes);
            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Error snoozing alarm: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void checkPermissions(PluginCall call) {
        Context context = getContext();
        boolean overlayGranted = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            overlayGranted = Settings.canDrawOverlays(context);
        }

        boolean notifGranted = NotificationManagerCompat.from(context).areNotificationsEnabled();

        boolean exactAlarmGranted = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            exactAlarmGranted = am.canScheduleExactAlarms();
        }

        boolean fullScreenIntentGranted = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            android.app.NotificationManager nm = (android.app.NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) {
                fullScreenIntentGranted = nm.canUseFullScreenIntent();
            }
        }

        boolean batteryOptimizationIgnored = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            android.os.PowerManager pm = (android.os.PowerManager) context.getSystemService(Context.POWER_SERVICE);
            if (pm != null) {
                batteryOptimizationIgnored = pm.isIgnoringBatteryOptimizations(context.getPackageName());
            }
        }

        JSObject ret = new JSObject();
        ret.put("overlayGranted", overlayGranted);
        ret.put("notificationsGranted", notifGranted);
        ret.put("exactAlarmGranted", exactAlarmGranted);
        ret.put("fullScreenIntentGranted", fullScreenIntentGranted);
        ret.put("batteryOptimizationIgnored", batteryOptimizationIgnored);
        call.resolve(ret);
    }

    @PluginMethod
    public void requestIgnoreBatteryOptimizations(PluginCall call) {
        Context context = getContext();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            android.os.PowerManager pm = (android.os.PowerManager) context.getSystemService(Context.POWER_SERVICE);
            if (pm != null && !pm.isIgnoringBatteryOptimizations(context.getPackageName())) {
                Intent intent = new Intent(
                    Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS,
                    Uri.parse("package:" + context.getPackageName())
                );
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(intent);
            }
        }
        JSObject ret = new JSObject();
        ret.put("opened", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void requestOverlayPermission(PluginCall call) {
        Context context = getContext();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(context)) {
            Intent intent = new Intent(
                Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                Uri.parse("package:" + context.getPackageName())
            );
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(intent);
        }
        JSObject ret = new JSObject();
        ret.put("opened", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void requestFullScreenIntentPermission(PluginCall call) {
        Context context = getContext();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            android.app.NotificationManager nm = (android.app.NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null && !nm.canUseFullScreenIntent()) {
                Intent intent = new Intent(
                    Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT,
                    Uri.parse("package:" + context.getPackageName())
                );
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(intent);
            }
        }
        JSObject ret = new JSObject();
        ret.put("opened", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void requestExactAlarmPermission(PluginCall call) {
        Context context = getContext();
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            if (!am.canScheduleExactAlarms()) {
                Intent intent = new Intent(
                    Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM,
                    Uri.parse("package:" + context.getPackageName())
                );
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(intent);
            }
        }
        JSObject ret = new JSObject();
        ret.put("opened", true);
        call.resolve(ret);
    }
}
