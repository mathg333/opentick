package com.opentick.app;

import android.app.Activity;
import android.app.KeyguardManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.view.WindowManager;
import android.view.animation.Animation;
import android.view.animation.ScaleAnimation;
import android.widget.Button;
import android.widget.TextView;
import android.widget.Toast;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class AlarmActivity extends Activity {

    public static final String ACTION_CLOSE_ALARM_ACTIVITY = "com.opentick.app.ACTION_CLOSE_ALARM_ACTIVITY";

    private Handler mTimeHandler;
    private Runnable mTimeRunnable;
    private TextView mClockTimeView;
    private TextView mClockDateView;
    private View mBellContainer;

    private String mTaskId = "";
    private String mTaskTitle = "Lembrete OpenTick";

    private final BroadcastReceiver mCloseReceiver = new BroadcastReceiver() {
        @Override
        public void onReceive(Context context, Intent intent) {
            finish();
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Configure activity to wake up screen and show directly over lockscreen
        configureLockScreen();

        setContentView(R.layout.activity_alarm);

        // Read intent data
        if (getIntent() != null) {
            String id = getIntent().getStringExtra(AlarmService.EXTRA_TASK_ID);
            String title = getIntent().getStringExtra(AlarmService.EXTRA_TASK_TITLE);
            if (id != null) mTaskId = id;
            if (title != null && !title.trim().isEmpty()) mTaskTitle = title;
        }

        TextView titleView = findViewById(R.id.alarm_task_title);
        if (titleView != null) {
            titleView.setText(mTaskTitle);
        }

        mClockTimeView = findViewById(R.id.alarm_clock_time);
        mClockDateView = findViewById(R.id.alarm_clock_date);
        mBellContainer = findViewById(R.id.alarm_bell_container);

        // Start Clock & Pulse Animation
        setupLiveClock();
        setupPulseAnimation();

        // Button: Stop Alarm
        Button btnStop = findViewById(R.id.btn_stop_alarm);
        if (btnStop != null) {
            btnStop.setOnClickListener(v -> {
                AlarmService.stop(this);
                finish();
            });
        }

        // Button: Snooze 5 Minutes
        Button btnSnooze = findViewById(R.id.btn_snooze_alarm);
        if (btnSnooze != null) {
            btnSnooze.setOnClickListener(v -> {
                AlarmService.snooze(this, mTaskId, mTaskTitle, 5);
                Toast.makeText(this, "⏰ Alarme adiado por 5 minutos", Toast.LENGTH_SHORT).show();
                finish();
            });
        }

        // Button: Open Task in App
        Button btnOpenApp = findViewById(R.id.btn_open_app);
        if (btnOpenApp != null) {
            btnOpenApp.setOnClickListener(v -> {
                AlarmService.stop(this);

                Intent launchIntent = new Intent(this, MainActivity.class);
                launchIntent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
                launchIntent.putExtra("TRIGGERED_BY_ALARM", true);
                launchIntent.putExtra("ALARM_TASK_ID", mTaskId);
                launchIntent.putExtra("ALARM_TASK_TITLE", mTaskTitle);
                startActivity(launchIntent);

                finish();
            });
        }

        // Register receiver for when alarm is stopped via notification action
        IntentFilter filter = new IntentFilter();
        filter.addAction(ACTION_CLOSE_ALARM_ACTIVITY);
        filter.addAction(AlarmService.ACTION_STOP_ALARM);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            registerReceiver(mCloseReceiver, filter, Context.RECEIVER_NOT_EXPORTED);
        } else {
            registerReceiver(mCloseReceiver, filter);
        }
    }

    private void configureLockScreen() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
            KeyguardManager km = (KeyguardManager) getSystemService(Context.KEYGUARD_SERVICE);
            if (km != null) {
                km.requestDismissKeyguard(this, null);
            }
        } else {
            getWindow().addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
                WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD |
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
            );
        }
        getWindow().addFlags(
            WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON |
            WindowManager.LayoutParams.FLAG_ALLOW_LOCK_WHILE_SCREEN_ON
        );
    }

    private void setupLiveClock() {
        mTimeHandler = new Handler(Looper.getMainLooper());
        final SimpleDateFormat timeFormat = new SimpleDateFormat("HH:mm", Locale.getDefault());
        final SimpleDateFormat dateFormat = new SimpleDateFormat("EEEE, d 'de' MMMM", new Locale("pt", "BR"));

        mTimeRunnable = new Runnable() {
            @Override
            public void run() {
                Date now = new Date();
                if (mClockTimeView != null) {
                    mClockTimeView.setText(timeFormat.format(now));
                }
                if (mClockDateView != null) {
                    mClockDateView.setText(dateFormat.format(now));
                }
                mTimeHandler.postDelayed(this, 1000);
            }
        };
        mTimeHandler.post(mTimeRunnable);
    }

    private void setupPulseAnimation() {
        if (mBellContainer == null) return;
        ScaleAnimation pulse = new ScaleAnimation(
            0.95f, 1.10f,
            0.95f, 1.10f,
            Animation.RELATIVE_TO_SELF, 0.5f,
            Animation.RELATIVE_TO_SELF, 0.5f
        );
        pulse.setDuration(700);
        pulse.setRepeatMode(Animation.REVERSE);
        pulse.setRepeatCount(Animation.INFINITE);
        mBellContainer.startAnimation(pulse);
    }

    @Override
    protected void onDestroy() {
        if (mTimeHandler != null && mTimeRunnable != null) {
            mTimeHandler.removeCallbacks(mTimeRunnable);
        }
        try {
            unregisterReceiver(mCloseReceiver);
        } catch (Exception e) {}
        super.onDestroy();
    }
}
