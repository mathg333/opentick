package com.opentick.app;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.graphics.Color;
import android.media.AudioAttributes;
import android.media.MediaPlayer;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.os.VibratorManager;
import androidx.core.app.NotificationCompat;
import org.json.JSONObject;
import java.io.File;
import java.io.FileOutputStream;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class AlarmService extends Service {
    public static final String ACTION_START_ALARM = "com.opentick.app.ACTION_START_ALARM";
    public static final String ACTION_STOP_ALARM = "com.opentick.app.ACTION_STOP_ALARM";
    public static final String ACTION_SNOOZE_ALARM = "com.opentick.app.ACTION_SNOOZE_ALARM";
    public static final String ACTION_ALARM_STOPPED_BY_USER = "com.opentick.app.ACTION_ALARM_STOPPED_BY_USER";
    public static final String ACTION_ALARM_SNOOZED = "com.opentick.app.ACTION_ALARM_SNOOZED";

    public static final String EXTRA_TASK_ID = "EXTRA_TASK_ID";
    public static final String EXTRA_OCCURRENCE_ID = "EXTRA_OCCURRENCE_ID";
    public static final String EXTRA_TASK_TITLE = "EXTRA_TASK_TITLE";
    public static final String EXTRA_TIME_LABEL = "EXTRA_TIME_LABEL";
    public static final String EXTRA_ALARM_SOUND = "EXTRA_ALARM_SOUND";
    public static final String EXTRA_SNOOZE_MINUTES = "EXTRA_SNOOZE_MINUTES";

    private static final String CHANNEL_ID = "opentick_alarm_channel_v7";
    private static final int NOTIFICATION_ID = 77777;

    private MediaPlayer mediaPlayer;
    private Vibrator vibrator;
    private Handler timeoutHandler;
    private String currentTaskId = "";
    private String currentOccurrenceId = "";
    private String currentTaskTitle = "Lembrete OpenTick";
    private String currentTimeLabel = "";
    private String currentSound = "";

    public static void start(Context context, String taskId, String occurrenceId, String title, String timeLabel, String sound) {
        if (context == null || taskId == null) return;
        Intent serviceIntent = new Intent(context, AlarmService.class);
        serviceIntent.setAction(ACTION_START_ALARM);
        serviceIntent.putExtra(EXTRA_TASK_ID, taskId);
        serviceIntent.putExtra(EXTRA_OCCURRENCE_ID, occurrenceId != null ? occurrenceId : taskId);
        serviceIntent.putExtra(EXTRA_TASK_TITLE, title != null ? title : "Lembrete OpenTick");
        serviceIntent.putExtra(EXTRA_TIME_LABEL, timeLabel != null ? timeLabel : "");
        serviceIntent.putExtra(EXTRA_ALARM_SOUND, sound != null ? sound : "");
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(serviceIntent);
            } else {
                context.startService(serviceIntent);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public static void stop(Context context, String taskId) {
        if (context == null) return;
        try {
            NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) nm.cancel(NOTIFICATION_ID);
        } catch (Exception ignored) {}

        try {
            Intent closeIntent = new Intent(AlarmActivity.ACTION_CLOSE_ALARM_ACTIVITY);
            if (taskId != null && !taskId.isEmpty()) {
                closeIntent.putExtra(EXTRA_TASK_ID, taskId);
            }
            closeIntent.setPackage(context.getPackageName());
            context.sendBroadcast(closeIntent);
        } catch (Exception ignored) {}

        try {
            Intent stoppedBroadcast = new Intent(ACTION_ALARM_STOPPED_BY_USER);
            if (taskId != null) stoppedBroadcast.putExtra(EXTRA_TASK_ID, taskId);
            stoppedBroadcast.setPackage(context.getPackageName());
            context.sendBroadcast(stoppedBroadcast);
        } catch (Exception ignored) {}

        try {
            context.stopService(new Intent(context, AlarmService.class));
        } catch (Exception ignored) {}
    }

    public static void snooze(Context context, String taskId, String occurrenceId, String title, int minutes) {
        if (context == null) return;
        int safeMins = Math.max(1, minutes);
        try {
            NotificationManager nm = (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) nm.cancel(NOTIFICATION_ID);
        } catch (Exception ignored) {}

        try {
            Intent closeIntent = new Intent(AlarmActivity.ACTION_CLOSE_ALARM_ACTIVITY);
            if (taskId != null && !taskId.isEmpty()) {
                closeIntent.putExtra(EXTRA_TASK_ID, taskId);
            }
            closeIntent.setPackage(context.getPackageName());
            context.sendBroadcast(closeIntent);
        } catch (Exception ignored) {}

        try {
            context.stopService(new Intent(context, AlarmService.class));
        } catch (Exception ignored) {}

        long triggerAt = System.currentTimeMillis() + (safeMins * 60_000L);
        String snoozeLabel = new SimpleDateFormat("HH:mm", Locale.getDefault()).format(new Date(triggerAt));
        String snoozeOccId = (occurrenceId != null && !occurrenceId.isEmpty())
            ? occurrenceId + "_snooze"
            : ((taskId != null ? taskId : "alarm") + "_snooze");

        AlarmStateManager.clearDismissed(context, snoozeOccId);
        AlarmStateManager.scheduleExact(
            context,
            snoozeOccId,
            taskId != null ? taskId : snoozeOccId,
            title != null && !title.isEmpty() ? title : "Lembrete OpenTick",
            triggerAt,
            snoozeLabel,
            "continuous",
            ""
        );

        try {
            Intent snoozeBroadcast = new Intent(ACTION_ALARM_SNOOZED);
            snoozeBroadcast.putExtra("ALARM_TASK_ID", taskId != null ? taskId : "");
            snoozeBroadcast.putExtra("ALARM_OCCURRENCE_ID", occurrenceId != null ? occurrenceId : "");
            snoozeBroadcast.putExtra("ALARM_TASK_TITLE", title != null ? title : "");
            snoozeBroadcast.putExtra("SNOOZE_MINUTES", safeMins);
            snoozeBroadcast.putExtra("SNOOZE_TIME_LABEL", snoozeLabel);
            snoozeBroadcast.putExtra("SNOOZE_TRIGGER_MILLIS", triggerAt);
            snoozeBroadcast.setPackage(context.getPackageName());
            context.sendBroadcast(snoozeBroadcast);
        } catch (Exception ignored) {}
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null) {
            stopSelf();
            return START_NOT_STICKY;
        }

        String action = intent.getAction();
        if (ACTION_STOP_ALARM.equals(action)) {
            String stopId = intent.getStringExtra(EXTRA_TASK_ID);
            if (stopId != null) currentTaskId = stopId;
            String occ = intent.getStringExtra(EXTRA_OCCURRENCE_ID);
            if (occ != null && !occ.isEmpty()) AlarmStateManager.markDismissed(this, occ);
            else if (!currentTaskId.isEmpty()) AlarmStateManager.markDismissed(this, currentTaskId);
            stopAlarmInternal(true, true);
            return START_NOT_STICKY;
        }

        if (ACTION_SNOOZE_ALARM.equals(action)) {
            String taskId = intent.getStringExtra(EXTRA_TASK_ID);
            String occ = intent.getStringExtra(EXTRA_OCCURRENCE_ID);
            String title = intent.getStringExtra(EXTRA_TASK_TITLE);
            int mins = intent.getIntExtra(EXTRA_SNOOZE_MINUTES, 5);
            snooze(this, taskId != null ? taskId : currentTaskId, occ != null ? occ : currentOccurrenceId, title != null ? title : currentTaskTitle, mins);
            return START_NOT_STICKY;
        }

        currentTaskId = intent.getStringExtra(EXTRA_TASK_ID);
        if (currentTaskId == null) currentTaskId = "";
        currentOccurrenceId = intent.getStringExtra(EXTRA_OCCURRENCE_ID);
        if (currentOccurrenceId == null || currentOccurrenceId.isEmpty()) currentOccurrenceId = currentTaskId;
        currentTaskTitle = intent.getStringExtra(EXTRA_TASK_TITLE);
        if (currentTaskTitle == null || currentTaskTitle.trim().isEmpty()) {
            currentTaskTitle = "Lembrete OpenTick";
        }
        currentTimeLabel = intent.getStringExtra(EXTRA_TIME_LABEL);
        if (currentTimeLabel == null) currentTimeLabel = "";
        currentSound = intent.getStringExtra(EXTRA_ALARM_SOUND);
        if (currentSound == null) currentSound = "";

        JSONObject settings = AlarmStateManager.loadSettings(this);
        String effectiveSound = !currentSound.isEmpty() ? currentSound : settings.optString("sound", "radar");
        float volume = (float) Math.max(0.05, Math.min(1.0, settings.optDouble("volume", 0.9)));
        int durationMinutes = Math.max(1, Math.min(60, settings.optInt("durationMinutes", 5)));
        boolean vibrationEnabled = settings.optBoolean("vibration", true);

        createNotificationChannel();
        Notification notification = buildAlarmNotification(currentTaskId, currentOccurrenceId, currentTaskTitle, currentTimeLabel);

        try {
            if (Build.VERSION.SDK_INT >= 34) {
                startForeground(NOTIFICATION_ID, notification, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
            } else {
                startForeground(NOTIFICATION_ID, notification);
            }
        } catch (Exception e) {
            e.printStackTrace();
            startForeground(NOTIFICATION_ID, notification);
        }

        startSoundAndVibration(effectiveSound, volume, vibrationEnabled);
        scheduleAutoTimeout(durationMinutes);

        return START_NOT_STICKY;
    }

    private Notification buildAlarmNotification(String taskId, String occId, String title, String timeLabel) {
        Intent fullScreenIntent = new Intent(this, AlarmActivity.class);
        fullScreenIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        fullScreenIntent.putExtra(EXTRA_TASK_ID, taskId);
        fullScreenIntent.putExtra(EXTRA_OCCURRENCE_ID, occId);
        fullScreenIntent.putExtra(EXTRA_TASK_TITLE, title);
        fullScreenIntent.putExtra(EXTRA_TIME_LABEL, timeLabel);

        int piFlags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            piFlags |= PendingIntent.FLAG_IMMUTABLE;
        }
        PendingIntent fullScreenPendingIntent = PendingIntent.getActivity(this, 7001, fullScreenIntent, piFlags);

        Intent stopIntent = new Intent(this, AlarmReceiver.class);
        stopIntent.setAction(ACTION_STOP_ALARM);
        stopIntent.putExtra(EXTRA_TASK_ID, taskId);
        stopIntent.putExtra(EXTRA_OCCURRENCE_ID, occId);
        PendingIntent stopPendingIntent = PendingIntent.getBroadcast(this, 7002, stopIntent, piFlags);

        Intent snoozeIntent = new Intent(this, AlarmReceiver.class);
        snoozeIntent.setAction(ACTION_SNOOZE_ALARM);
        snoozeIntent.putExtra(EXTRA_TASK_ID, taskId);
        snoozeIntent.putExtra(EXTRA_OCCURRENCE_ID, occId);
        snoozeIntent.putExtra(EXTRA_TASK_TITLE, title);
        snoozeIntent.putExtra(EXTRA_SNOOZE_MINUTES, 5);
        PendingIntent snoozePendingIntent = PendingIntent.getBroadcast(this, 7003, snoozeIntent, piFlags);

        String subtitle = (timeLabel != null && !timeLabel.isEmpty())
            ? "Programado para as " + timeLabel + " — Toque para abrir"
            : "Alarme ativo — Toque para silenciar ou concluir";

        return new NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
            .setContentTitle(title)
            .setContentText(subtitle)
            .setColor(Color.parseColor("#facc15"))
            .setPriority(NotificationCompat.PRIORITY_MAX)
            .setCategory(NotificationCompat.CATEGORY_ALARM)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setOngoing(true)
            .setAutoCancel(false)
            .setFullScreenIntent(fullScreenPendingIntent, true)
            .setContentIntent(fullScreenPendingIntent)
            .addAction(android.R.drawable.ic_media_pause, "PARAR ALARME", stopPendingIntent)
            .addAction(android.R.drawable.ic_popup_sync, "ADIAR 5 MIN", snoozePendingIntent)
            .build();
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager manager = getSystemService(NotificationManager.class);
            if (manager == null) return;

            NotificationChannel existing = manager.getNotificationChannel(CHANNEL_ID);
            if (existing == null) {
                NotificationChannel channel = new NotificationChannel(
                    CHANNEL_ID,
                    "Despertador OpenTick",
                    NotificationManager.IMPORTANCE_HIGH
                );
                channel.setDescription("Canal crítico para alarmes e despertadores de tarefas no OpenTick");
                channel.setSound(null, null);
                channel.enableVibration(false);
                channel.enableLights(true);
                channel.setLightColor(Color.parseColor("#facc15"));
                channel.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
                channel.setBypassDnd(true);
                manager.createNotificationChannel(channel);
            }
        }
    }

    private void startSoundAndVibration(String soundType, float volume, boolean vibrationEnabled) {
        stopPlaybackOnly();

        if (!"none".equalsIgnoreCase(soundType)) {
            try {
                Uri sourceUri = resolveAudioSourceUri(soundType);
                if (sourceUri != null) {
                    mediaPlayer = new MediaPlayer();
                    mediaPlayer.setAudioAttributes(
                        new AudioAttributes.Builder()
                            .setUsage(AudioAttributes.USAGE_ALARM)
                            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                            .build()
                    );
                    mediaPlayer.setDataSource(this, sourceUri);
                    mediaPlayer.setLooping(true);
                    mediaPlayer.setVolume(volume, volume);
                    mediaPlayer.prepare();
                    mediaPlayer.start();
                }
            } catch (Exception e) {
                e.printStackTrace();
                // Emergency fallback to default system alarm
                try {
                    Uri fallback = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
                    if (fallback != null) {
                        mediaPlayer = new MediaPlayer();
                        mediaPlayer.setAudioAttributes(
                            new AudioAttributes.Builder()
                                .setUsage(AudioAttributes.USAGE_ALARM)
                                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                                .build()
                        );
                        mediaPlayer.setDataSource(this, fallback);
                        mediaPlayer.setLooping(true);
                        mediaPlayer.setVolume(volume, volume);
                        mediaPlayer.prepare();
                        mediaPlayer.start();
                    }
                } catch (Exception ignored) {}
            }
        }

        if (vibrationEnabled) {
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
                    VibratorManager vm = (VibratorManager) getSystemService(Context.VIBRATOR_MANAGER_SERVICE);
                    if (vm != null) vibrator = vm.getDefaultVibrator();
                } else {
                    vibrator = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
                }

                if (vibrator != null && vibrator.hasVibrator()) {
                    long[] pattern = {0, 600, 400, 600, 400};
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        vibrator.vibrate(VibrationEffect.createWaveform(pattern, 0));
                    } else {
                        vibrator.vibrate(pattern, 0);
                    }
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }
    }

    private Uri resolveAudioSourceUri(String soundType) {
        try {
            if ("custom".equalsIgnoreCase(soundType)) {
                String path = AlarmStateManager.getCustomAudioPath(this);
                if (path != null && !path.isEmpty()) {
                    File customFile = new File(path);
                    if (customFile.exists() && customFile.length() > 100) {
                        return Uri.fromFile(customFile);
                    }
                }
                soundType = "radar";
            }

            if ("system".equalsIgnoreCase(soundType)) {
                Uri sys = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
                if (sys != null) return sys;
            }

            File synthFile = ensureSynthesizedToneFile(soundType);
            if (synthFile != null && synthFile.exists()) {
                return Uri.fromFile(synthFile);
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
        return RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
    }

    private File ensureSynthesizedToneFile(String soundType) {
        String key = (soundType == null || soundType.isEmpty()) ? "radar" : soundType.toLowerCase(Locale.US);
        File file = new File(getFilesDir(), "opentick_tone_" + key + "_v2.wav");
        if (file.exists() && file.length() > 44) return file;

        try {
            int sampleRate = 22050;
            double durationSec = 2.0;
            int numSamples = (int) (sampleRate * durationSec);
            byte[] pcmData = new byte[numSamples * 2];

            for (int i = 0; i < numSamples; i++) {
                double t = i / (double) sampleRate;
                double sample = 0.0;

                if ("digital".equals(key)) {
                    // 4 sharp digital clock beeps inside 2.0s cycle
                    double cycle = t % 1.0;
                    boolean on = (cycle >= 0.0 && cycle < 0.11) ||
                                 (cycle >= 0.18 && cycle < 0.29) ||
                                 (cycle >= 0.36 && cycle < 0.47) ||
                                 (cycle >= 0.54 && cycle < 0.65);
                    if (on) {
                        sample = 0.65 * Math.sin(2.0 * Math.PI * 1046.5 * t)
                               + 0.25 * Math.sin(2.0 * Math.PI * 2093.0 * t);
                    }
                } else if ("siren".equals(key)) {
                    // Smooth urgent siren oscillation between 600Hz and 960Hz
                    double freq = 780.0 + 180.0 * Math.sin(2.0 * Math.PI * 1.5 * t);
                    sample = 0.65 * Math.sin(2.0 * Math.PI * freq * t);
                } else if ("bell".equals(key) || "chime".equals(key)) {
                    // Clear harmonic double chime
                    double localT = t % 1.0;
                    double env = Math.exp(-3.8 * localT);
                    sample = env * (
                        0.55 * Math.sin(2.0 * Math.PI * 523.25 * localT) +
                        0.30 * Math.sin(2.0 * Math.PI * 783.99 * localT) +
                        0.15 * Math.sin(2.0 * Math.PI * 1046.5 * localT)
                    );
                } else {
                    // Default 'radar': futuristic dual ping pulse
                    double local = t % 0.5;
                    if (local < 0.22) {
                        double freq = local < 0.11 ? 880.0 : 1318.5;
                        double env = Math.exp(-9.0 * (local % 0.11));
                        sample = env * 0.72 * Math.sin(2.0 * Math.PI * freq * t);
                    }
                }

                short pcmVal = (short) Math.max(-32767, Math.min(32767, (int) (sample * 32767)));
                pcmData[2 * i] = (byte) (pcmVal & 0xff);
                pcmData[2 * i + 1] = (byte) ((pcmVal >> 8) & 0xff);
            }

            writeWavFile(file, pcmData, sampleRate);
            return file;
        } catch (Exception e) {
            e.printStackTrace();
            return null;
        }
    }

    private void writeWavFile(File file, byte[] pcmData, int sampleRate) throws Exception {
        int byteRate = sampleRate * 2;
        int totalDataLen = pcmData.length + 36;
        byte[] header = new byte[44];
        header[0] = 'R'; header[1] = 'I'; header[2] = 'F'; header[3] = 'F';
        header[4] = (byte) (totalDataLen & 0xff);
        header[5] = (byte) ((totalDataLen >> 8) & 0xff);
        header[6] = (byte) ((totalDataLen >> 16) & 0xff);
        header[7] = (byte) ((totalDataLen >> 24) & 0xff);
        header[8] = 'W'; header[9] = 'A'; header[10] = 'V'; header[11] = 'E';
        header[12] = 'f'; header[13] = 'm'; header[14] = 't'; header[15] = ' ';
        header[16] = 16; header[17] = 0; header[18] = 0; header[19] = 0;
        header[20] = 1; header[21] = 0;
        header[22] = 1; header[23] = 0;
        header[24] = (byte) (sampleRate & 0xff);
        header[25] = (byte) ((sampleRate >> 8) & 0xff);
        header[26] = (byte) ((sampleRate >> 16) & 0xff);
        header[27] = (byte) ((sampleRate >> 24) & 0xff);
        header[28] = (byte) (byteRate & 0xff);
        header[29] = (byte) ((byteRate >> 8) & 0xff);
        header[30] = (byte) ((byteRate >> 16) & 0xff);
        header[31] = (byte) ((byteRate >> 24) & 0xff);
        header[32] = 2; header[33] = 0;
        header[34] = 16; header[35] = 0;
        header[36] = 'd'; header[37] = 'a'; header[38] = 't'; header[39] = 'a';
        header[40] = (byte) (pcmData.length & 0xff);
        header[41] = (byte) ((pcmData.length >> 8) & 0xff);
        header[42] = (byte) ((pcmData.length >> 16) & 0xff);
        header[43] = (byte) ((pcmData.length >> 24) & 0xff);

        try (FileOutputStream fos = new FileOutputStream(file)) {
            fos.write(header);
            fos.write(pcmData);
        }
    }

    private void scheduleAutoTimeout(int durationMinutes) {
        if (timeoutHandler == null) {
            timeoutHandler = new Handler(Looper.getMainLooper());
        } else {
            timeoutHandler.removeCallbacksAndMessages(null);
        }
        long timeoutMs = Math.max(1, durationMinutes) * 60_000L;
        timeoutHandler.postDelayed(() -> stopAlarmInternal(true, false), timeoutMs);
    }

    private void stopPlaybackOnly() {
        if (mediaPlayer != null) {
            try {
                if (mediaPlayer.isPlaying()) mediaPlayer.stop();
                mediaPlayer.release();
            } catch (Exception e) {
                e.printStackTrace();
            }
            mediaPlayer = null;
        }
        if (vibrator != null) {
            try {
                vibrator.cancel();
            } catch (Exception e) {
                e.printStackTrace();
            }
            vibrator = null;
        }
        if (timeoutHandler != null) {
            timeoutHandler.removeCallbacksAndMessages(null);
        }
    }

    private void stopAlarmInternal(boolean stopForegroundAndService, boolean broadcastStop) {
        stopPlaybackOnly();

        if (stopForegroundAndService) {
            try {
                NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
                if (nm != null) nm.cancel(NOTIFICATION_ID);
            } catch (Exception ignored) {}

            try {
                Intent closeIntent = new Intent(AlarmActivity.ACTION_CLOSE_ALARM_ACTIVITY);
                if (currentTaskId != null && !currentTaskId.isEmpty()) {
                    closeIntent.putExtra(EXTRA_TASK_ID, currentTaskId);
                }
                closeIntent.setPackage(getPackageName());
                sendBroadcast(closeIntent);
            } catch (Exception ignored) {}

            if (broadcastStop) {
                try {
                    Intent stoppedBroadcast = new Intent(ACTION_ALARM_STOPPED_BY_USER);
                    stoppedBroadcast.putExtra(EXTRA_TASK_ID, currentTaskId);
                    stoppedBroadcast.setPackage(getPackageName());
                    sendBroadcast(stoppedBroadcast);
                } catch (Exception ignored) {}
            }

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                stopForeground(STOP_FOREGROUND_REMOVE);
            } else {
                stopForeground(true);
            }
            stopSelf();
        }
    }

    @Override
    public void onDestroy() {
        stopAlarmInternal(false, false);
        super.onDestroy();
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }
}
