package com.opentick.app;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.VibrationEffect;
import android.os.Vibrator;
import androidx.core.app.NotificationCompat;

public class AlarmService extends Service {
    public static final String CHANNEL_ID = "opentick_alarm_channel";
    public static final int NOTIFICATION_ID = 9001;

    private static MediaPlayer sMediaPlayer;
    private static Vibrator sVibrator;
    private static Handler sHandler;
    private static Runnable sAutoStopRunnable;

    public static final String ACTION_START_ALARM = "com.opentick.app.ACTION_START_ALARM";
    public static final String ACTION_STOP_ALARM = "com.opentick.app.ACTION_STOP_ALARM";
    public static final String EXTRA_TASK_ID = "EXTRA_TASK_ID";
    public static final String EXTRA_TASK_TITLE = "EXTRA_TASK_TITLE";

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        createNotificationChannel();
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null) return START_NOT_STICKY;

        String action = intent.getAction();
        if (ACTION_STOP_ALARM.equals(action)) {
            stopAlarmInternal();
            stopSelf();
            return START_NOT_STICKY;
        }

        if (ACTION_START_ALARM.equals(action)) {
            String taskId = intent.getStringExtra(EXTRA_TASK_ID);
            String taskTitle = intent.getStringExtra(EXTRA_TASK_TITLE);
            if (taskTitle == null || taskTitle.trim().isEmpty()) {
                taskTitle = "Lembrete OpenTick";
            }

            startAlarmInternal(taskId, taskTitle);
        }

        return START_NOT_STICKY;
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "Alarmes e Despertadores OpenTick",
                NotificationManager.IMPORTANCE_HIGH
            );
            channel.setDescription("Alarmes contínuos em tela cheia e tela de bloqueio");
            channel.enableLights(true);
            channel.enableVibration(true);
            channel.setBypassDnd(true);
            channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);

            AudioAttributes audioAttributes = new AudioAttributes.Builder()
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .setUsage(AudioAttributes.USAGE_ALARM)
                .build();
            Uri alertUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
            if (alertUri == null) alertUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);
            channel.setSound(alertUri, audioAttributes);

            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm != null) {
                nm.createNotificationChannel(channel);
            }
        }
    }

    private void startAlarmInternal(String taskId, String taskTitle) {
        // Stop any previous instance
        stopAlarmInternal();

        // 1. PendingIntent to open MainActivity
        Intent openIntent = new Intent(this, MainActivity.class);
        openIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        openIntent.putExtra("TRIGGERED_BY_ALARM", true);
        openIntent.putExtra("ALARM_TASK_ID", taskId);
        openIntent.putExtra("ALARM_TASK_TITLE", taskTitle);

        int flag = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flag |= PendingIntent.FLAG_IMMUTABLE;
        }
        PendingIntent fullScreenPendingIntent = PendingIntent.getActivity(this, 100, openIntent, flag);

        // 2. PendingIntent for Dismiss/Stop Action Button directly on Notification
        Intent stopIntent = new Intent(this, AlarmService.class);
        stopIntent.setAction(ACTION_STOP_ALARM);
        PendingIntent stopPendingIntent = PendingIntent.getService(this, 101, stopIntent, flag);

        // 3. Build High Priority Notification with FullScreenIntent
        NotificationCompat.Builder builder = new NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(R.mipmap.ic_launcher)
            .setContentTitle("⏰ " + taskTitle)
            .setContentText("Alarme disparando! Toque para desligar.")
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setFullScreenIntent(fullScreenPendingIntent, true)
            .setContentIntent(fullScreenPendingIntent)
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "PARAR ALARME", stopPendingIntent)
            .setOngoing(true)
            .setAutoCancel(false);

        Notification notification = builder.build();

        try {
            startForeground(NOTIFICATION_ID, notification);
        } catch (Exception e) {
            e.printStackTrace();
        }

        // 4. Play Continuous Alarm Sound
        try {
            Uri alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
            if (alarmUri == null) alarmUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_RINGTONE);

            sMediaPlayer = new MediaPlayer();
            sMediaPlayer.setDataSource(this, alarmUri);

            AudioAttributes attrs = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_ALARM)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                .build();
            sMediaPlayer.setAudioAttributes(attrs);
            sMediaPlayer.setLooping(true);
            sMediaPlayer.prepare();
            sMediaPlayer.start();
        } catch (Exception e) {
            e.printStackTrace();
        }

        // 5. Continuous Vibration
        try {
            sVibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
            if (sVibrator != null && sVibrator.hasVibrator()) {
                long[] pattern = {0, 600, 300, 600, 300, 800};
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    sVibrator.vibrate(VibrationEffect.createWaveform(pattern, 0));
                } else {
                    sVibrator.vibrate(pattern, 0);
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
        }

        // 6. 5-Minute Auto-Stop Safety Timeout
        sHandler = new Handler(Looper.getMainLooper());
        sAutoStopRunnable = () -> {
            stopAlarmInternal();
            stopSelf();
        };
        sHandler.postDelayed(sAutoStopRunnable, 5 * 60 * 1000);
    }

    private void stopAlarmInternal() {
        if (sHandler != null && sAutoStopRunnable != null) {
            sHandler.removeCallbacks(sAutoStopRunnable);
            sAutoStopRunnable = null;
        }

        if (sMediaPlayer != null) {
            try {
                if (sMediaPlayer.isPlaying()) {
                    sMediaPlayer.stop();
                }
                sMediaPlayer.release();
            } catch (Exception e) {}
            sMediaPlayer = null;
        }

        if (sVibrator != null) {
            try {
                sVibrator.cancel();
            } catch (Exception e) {}
            sVibrator = null;
        }

        try {
            stopForeground(true);
            NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) {
                nm.cancel(NOTIFICATION_ID);
            }
        } catch (Exception e) {}
    }

    public static void start(Context context, String taskId, String taskTitle) {
        Intent intent = new Intent(context, AlarmService.class);
        intent.setAction(ACTION_START_ALARM);
        intent.putExtra(EXTRA_TASK_ID, taskId);
        intent.putExtra(EXTRA_TASK_TITLE, taskTitle);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            context.startForegroundService(intent);
        } else {
            context.startService(intent);
        }
    }

    public static void stop(Context context) {
        Intent intent = new Intent(context, AlarmService.class);
        intent.setAction(ACTION_STOP_ALARM);
        context.startService(intent);
    }

    @Override
    public void onDestroy() {
        stopAlarmInternal();
        super.onDestroy();
    }
}
