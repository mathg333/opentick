package com.opentick.app;

import android.app.Activity;
import android.app.KeyguardManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import android.view.WindowManager;
import android.view.animation.AlphaAnimation;
import android.view.animation.Animation;
import android.view.animation.AnimationSet;
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
    private View mOuterRipple;
    private View mMidRipple;

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

        // Configure edge-to-edge translucent frosted glass & lockscreen flags
        configureWindowAndLockScreen();

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
        mOuterRipple = findViewById(R.id.alarm_outer_ripple);
        mMidRipple = findViewById(R.id.alarm_mid_ripple);

        // Start Clock & Multi-stage Soundwave Pulse Animation
        setupLiveClock();
        setupGlassRipplesAnimation();

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

    private void configureWindowAndLockScreen() {
        // Display directly over lock screen and wake up screen without triggering PIN bouncer
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
        } else {
            getWindow().addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED |
                WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
            );
        }
        getWindow().addFlags(
            WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON |
            WindowManager.LayoutParams.FLAG_ALLOW_LOCK_WHILE_SCREEN_ON
        );

        // Edge-to-edge transparent system bars
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            getWindow().setStatusBarColor(Color.TRANSPARENT);
            getWindow().setNavigationBarColor(Color.TRANSPARENT);
            getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE |
                View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN |
                View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
            );
        }
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

    private void setupGlassRipplesAnimation() {
        // 1. Center Bell Pulse
        if (mBellContainer != null) {
            ScaleAnimation bellPulse = new ScaleAnimation(
                0.95f, 1.08f,
                0.95f, 1.08f,
                Animation.RELATIVE_TO_SELF, 0.5f,
                Animation.RELATIVE_TO_SELF, 0.5f
            );
            bellPulse.setDuration(750);
            bellPulse.setRepeatMode(Animation.REVERSE);
            bellPulse.setRepeatCount(Animation.INFINITE);
            mBellContainer.startAnimation(bellPulse);
        }

        // 2. Mid Soundwave Ripple (scale + alpha)
        if (mMidRipple != null) {
            AnimationSet midSet = new AnimationSet(true);
            ScaleAnimation midScale = new ScaleAnimation(
                0.90f, 1.25f,
                0.90f, 1.25f,
                Animation.RELATIVE_TO_SELF, 0.5f,
                Animation.RELATIVE_TO_SELF, 0.5f
            );
            midScale.setDuration(1200);
            midScale.setRepeatMode(Animation.RESTART);
            midScale.setRepeatCount(Animation.INFINITE);

            AlphaAnimation midAlpha = new AlphaAnimation(0.7f, 0.05f);
            midAlpha.setDuration(1200);
            midAlpha.setRepeatMode(Animation.RESTART);
            midAlpha.setRepeatCount(Animation.INFINITE);

            midSet.addAnimation(midScale);
            midSet.addAnimation(midAlpha);
            mMidRipple.startAnimation(midSet);
        }

        // 3. Outer Soundwave Ripple
        if (mOuterRipple != null) {
            AnimationSet outerSet = new AnimationSet(true);
            ScaleAnimation outerScale = new ScaleAnimation(
                0.85f, 1.35f,
                0.85f, 1.35f,
                Animation.RELATIVE_TO_SELF, 0.5f,
                Animation.RELATIVE_TO_SELF, 0.5f
            );
            outerScale.setDuration(1600);
            outerScale.setRepeatMode(Animation.RESTART);
            outerScale.setRepeatCount(Animation.INFINITE);

            AlphaAnimation outerAlpha = new AlphaAnimation(0.6f, 0.0f);
            outerAlpha.setDuration(1600);
            outerAlpha.setRepeatMode(Animation.RESTART);
            outerAlpha.setRepeatCount(Animation.INFINITE);

            outerSet.addAnimation(outerScale);
            outerSet.addAnimation(outerAlpha);
            mOuterRipple.startAnimation(outerSet);
        }
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
